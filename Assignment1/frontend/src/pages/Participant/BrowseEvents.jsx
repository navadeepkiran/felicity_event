import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Fuse from 'fuse.js';

const BrowseEvents = () => {
  const [allEvents, setAllEvents] = useState([]); // Store all fetched events
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    eventType: '',
    eligibility: '',
    followedOnly: false,
    trending: false
  });

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(allEvents, {
      keys: [
        { name: 'eventName', weight: 2 }, // Event name has higher weight
        { name: 'eventDescription', weight: 1 },
        { name: 'eventTags', weight: 1.5 },
        { name: 'organizer.organizerName', weight: 1.5 } // Also search organizer name
      ],
      threshold: 0.4, // 0 = exact match, 1 = match anything (0.4 is good for typos)
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true // Search entire string, not just beginning
    });
  }, [allEvents]);

  // Apply fuzzy search on top of other filters
  const events = useMemo(() => {
    let filtered = allEvents;

    // Apply fuzzy search if search term exists
    if (filters.search && filters.search.trim().length >= 2) {
      const results = fuse.search(filters.search);
      filtered = results.map(result => result.item);
    }

    // Apply other filters
    if (filters.eventType) {
      filtered = filtered.filter(event => event.eventType === filters.eventType);
    }
    if (filters.eligibility) {
      filtered = filtered.filter(event => event.eligibility === filters.eligibility);
    }

    return filtered;
  }, [allEvents, filters, fuse]);

  useEffect(() => {
    fetchEvents();
  }, [filters.followedOnly, filters.trending]); // Only refetch on these filters

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      // Don't send search, eventType, eligibility to backend - handle via Fuse.js
      if (filters.followedOnly) params.append('followedOnly', 'true');
      if (filters.trending) params.append('trending', 'true');

      const response = await api.get(`/events/browse?${params.toString()}`);
      setAllEvents(response.data.events);
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Only show loading for filters that require refetching
    if (field === 'followedOnly' || field === 'trending') {
      setLoading(true);
    }
  };

  const renderEventCard = (event) => {
    const isRegistrationOpen = 
      event.status === 'published' &&
      new Date(event.registrationDeadline) > new Date() &&
      event.currentRegistrations < event.registrationLimit;

    return (
      <div key={event._id} className="card">
        <h3>{event.eventName}</h3>
        <p style={{ color: '#7f8c8d', margin: '10px 0' }}>
          By <Link to={`/clubs/${event.organizer?._id}`} style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: '500' }} onMouseOver={(e) => e.target.style.textDecoration = 'underline'} onMouseOut={(e) => e.target.style.textDecoration = 'none'}>{event.organizer?.organizerName || 'Unknown'}</Link>
        </p>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          {event.eventDescription.substring(0, 150)}...
        </p>
        
        <div style={{ margin: '15px 0' }}>
          <span className={`badge badge-${event.eventType === 'normal' ? 'primary' : 'success'}`}>
            {event.eventType === 'normal' ? 'Event' : 'Merchandise'}
          </span>
          <span className="badge badge-warning" style={{ marginLeft: '8px' }}>
            {event.eligibility}
          </span>
        </div>

        <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
          <p>📅 {new Date(event.eventStartDate).toLocaleDateString()}</p>
          <p>💰 ₹{event.registrationFee}</p>
          <p>👥 {event.currentRegistrations}/{event.registrationLimit} registered</p>
        </div>

        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ecf0f1', display: 'flex', justifyContent: 'space-between' }}>
<Link to={`/events/${event._id}`} className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
            View Details
          </Link>
          {!isRegistrationOpen && (
            <span className="badge badge-danger">Closed</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <h1>Browse Events</h1>
        <p style={{ color: '#7f8c8d', marginTop: '10px' }}>
          Discover and register for exciting events at Felicity
        </p>

        {/* Search and Filters */}
        <div className="card" style={{ marginTop: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                className="form-input"
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="normal">Events</option>
                <option value="merchandise">Merchandise</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                className="form-input"
                value={filters.eligibility}
                onChange={(e) => handleFilterChange('eligibility', e.target.value)}
              >
                <option value="">All Eligibility</option>
                <option value="all">Open to All</option>
                <option value="iiit-only">IIIT Only</option>
                <option value="non-iiit-only">Non-IIIT Only</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '15px', display: 'flex', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.followedOnly}
                onChange={(e) => handleFilterChange('followedOnly', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Followed Clubs Only
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.trending}
                onChange={(e) => handleFilterChange('trending', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Trending (Top 5)
            </label>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="loading">Searching events...</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <h3>No events found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-3" style={{ marginTop: '30px' }}>
            {events.map(event => renderEventCard(event))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BrowseEvents;

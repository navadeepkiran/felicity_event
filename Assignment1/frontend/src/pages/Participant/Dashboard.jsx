import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ParticipantDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/participant/dashboard');
      setDashboard(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading your dashboard...</div>
      </Layout>
    );
  }

  const renderEventCard = (registration) => {
    const event = registration.event;
    if (!event) return null;

    return (
      <div key={registration._id} className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h3>{event.eventName}</h3>
            <p style={{ color: '#7f8c8d', marginTop: '8px' }}>
              {new Date(event.eventStartDate).toLocaleDateString()} - {new Date(event.eventEndDate).toLocaleDateString()}
            </p>
            <div style={{ marginTop: '10px' }}>
              <span className={`badge badge-${event.eventType === 'normal' ? 'primary' : 'success'}`}>
                {event.eventType === 'normal' ? 'Event' : 'Merchandise'}
              </span>
              <span className={`badge badge-${registration.status === 'registered' ? 'success' : 'warning'}`} style={{ marginLeft: '8px' }}>
                {registration.status}
              </span>
            </div>
          </div>
          <div>
            <Link to={`/events/${event._id}`} className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
              View Details
            </Link>
          </div>
        </div>
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ecf0f1' }}>
          <p style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
            <strong>Ticket ID:</strong> {registration.ticketId}
          </p>
          {registration.attended && (
            <p style={{ color: '#27ae60', fontSize: '0.9rem', marginTop: '5px' }}>
              ✓ Attended
            </p>
          )}
        </div>
      </div>
    );
  };

  const getEventsForTab = () => {
    switch (activeTab) {
      case 'upcoming':
        return dashboard.upcoming;
      case 'completed':
        return dashboard.completed;
      case 'cancelled':
        return dashboard.cancelled;
      default:
        return [];
    }
  };

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <h1>My Events Dashboard</h1>
        <p style={{ color: '#7f8c8d', marginTop: '10px' }}>
          Manage your event registrations and view participation history
        </p>

        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', borderBottom: '2px solid #ecf0f1' }}>
          <button
            onClick={() => setActiveTab('upcoming')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'upcoming' ? '#3498db' : 'transparent',
              color: activeTab === 'upcoming' ? 'white' : '#7f8c8d',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              fontWeight: activeTab === 'upcoming' ? 'bold' : 'normal'
            }}
          >
            Upcoming ({dashboard.upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'completed' ? '#3498db' : 'transparent',
              color: activeTab === 'completed' ? 'white' : '#7f8c8d',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              fontWeight: activeTab === 'completed' ? 'bold' : 'normal'
            }}
          >
            Completed ({dashboard.completed.length})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'cancelled' ? '#3498db' : 'transparent',
              color: activeTab === 'cancelled' ? 'white' : '#7f8c8d',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              fontWeight: activeTab === 'cancelled' ? 'bold' : 'normal'
            }}
          >
            Cancelled ({dashboard.cancelled.length})
          </button>
        </div>

        <div style={{ marginTop: '20px' }}>
          {getEventsForTab().length === 0 ? (
            <div className="empty-state">
              <h3>No events found</h3>
              <p>You don't have any {activeTab} events yet.</p>
              <Link to="/events" className="btn btn-primary" style={{ marginTop: '20px' }}>
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-2">
              {getEventsForTab().map(registration => renderEventCard(registration))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ParticipantDashboard;

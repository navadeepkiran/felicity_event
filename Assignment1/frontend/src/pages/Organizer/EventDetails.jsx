import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const OrganizerEventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/organizer/events/${eventId}`);
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      await api.post(`/organizer/events/${eventId}/publish`);
      toast.success('Event published!');
      fetchEventDetails();
    } catch (error) {
      toast.error('Failed to publish event');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/organizer/events/${eventId}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      const filename = `participants-${data.event.eventName.replace(/\s+/g, '-')}-${Date.now()}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const filterParticipants = () => {
    if (!data || !data.registrations) return [];

    let filtered = [...data.registrations];

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reg => {
        const fullName = `${reg.participant?.firstName} ${reg.participant?.lastName}`.toLowerCase();
        const email = reg.participant?.email?.toLowerCase() || '';
        const ticketId = reg.ticketId?.toLowerCase() || '';
        
        return fullName.includes(term) || email.includes(term) || ticketId.includes(term);
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'attended') {
        filtered = filtered.filter(reg => reg.attended === true);
      } else if (statusFilter === 'registered') {
        filtered = filtered.filter(reg => reg.attended !== true);
      }
    }

    return filtered;
  };

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h1>{data.event.eventName}</h1>
            <span className={`badge badge-${data.event.status === 'published' ? 'success' : 'warning'}`}>
              {data.event.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {data.event.status === 'draft' && (
              <button onClick={handlePublish} className="btn btn-success">Publish</button>
            )}
            <button 
              onClick={() => navigate(`/organizer/events/${eventId}/attendance`)} 
              className="btn btn-primary"
            >
              📷 QR Scanner
            </button>
            <button 
              onClick={() => navigate(`/organizer/events/${eventId}/feedback`)} 
              className="btn"
              style={{
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                border: 'none',
                color: 'white'
              }}
            >
              📊 View Feedback
            </button>
            <button onClick={handleExport} className="btn btn-secondary">Export CSV</button>
            <button 
              onClick={() => navigate(`/organizer/events/${eventId}/feedback`)} 
              className="btn"
              style={{
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
                color: 'white',
                border: 'none'
              }}
            >
              📊 View Feedback
            </button>
          </div>
        </div>

        <div className="grid grid-2" style={{ marginTop: '30px' }}>
          <div className="card">
            <h3>Registrations</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {data.event.currentRegistrations}/{data.event.registrationLimit}
            </p>
          </div>
          <div className="card">
            <h3>Revenue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>₹{data.analytics.revenue}</p>
          </div>
          <div className="card">
            <h3>Attendance</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.analytics.attendance}</p>
          </div>
          <div className="card">
            <h3>Attendance Rate</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.analytics.attendanceRate}%</p>
          </div>
        </div>

        <h2 style={{ marginTop: '40px' }}>
          Participants 
          <span style={{ fontSize: '1rem', color: '#7f8c8d', fontWeight: 'normal', marginLeft: '10px' }}>
            ({data?.registrations?.length || 0} total)
          </span>
        </h2>
        
        <div style={{ display: 'flex', gap: '15px', marginTop: '20px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email, or ticket ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ width: '200px' }}>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="all">All Status</option>
              <option value="registered">Registered Only</option>
              <option value="attended">Attended Only</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ marginTop: '20px', overflowX: 'auto' }}>
          {filterParticipants().length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
              <p>No participants found matching your search.</p>
              {(searchTerm || statusFilter !== 'all') && (
                <button 
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="btn btn-secondary"
                  style={{ marginTop: '15px' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {(searchTerm || statusFilter !== 'all') && (
                <div style={{ padding: '10px 15px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                  <span style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                    Showing {filterParticipants().length} of {data.registrations.length} participants
                  </span>
                </div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Ticket ID</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filterParticipants().map(reg => (
                <tr key={reg._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    {reg.participant?.firstName} {reg.participant?.lastName}
                  </td>
                  <td style={{ padding: '10px' }}>{reg.participant?.email}</td>
                  <td style={{ padding: '10px' }}>{reg.ticketId}</td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge badge-${reg.attended ? 'success' : 'warning'}`}>
                      {reg.attended ? 'Attended' : 'Registered'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OrganizerEventDetails;

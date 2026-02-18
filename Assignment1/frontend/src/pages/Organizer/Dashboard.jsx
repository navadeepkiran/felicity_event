import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const OrganizerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/organizer/dashboard');
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <h1>Organizer Dashboard</h1>
        
        <div className="grid grid-2" style={{ marginTop: '30px' }}>
          <div className="card">
            <h3>Total Events</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>{data.analytics.totalEvents}</p>
          </div>
          <div className="card">
            <h3>Total Registrations</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2ecc71' }}>{data.analytics.totalRegistrations}</p>
          </div>
          <div className="card">
            <h3>Total Revenue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>₹{data.analytics.totalRevenue}</p>
          </div>
          <div className="card">
            <h3>Total Attendance</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>{data.analytics.totalAttendance}</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
          <h2>My Events</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/organizer/password-reset" className="btn btn-warning">🔒 Password Reset</Link>
            <Link to="/organizer/create-event" className="btn btn-success">Create New Event</Link>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginTop: '20px' }}>
          {data.events.map(event => (
            <div key={event._id} className="card">
              <h3>{event.eventName}</h3>
              <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: '10px 0' }}>
                {new Date(event.eventStartDate).toLocaleDateString()}
              </p>
              <span className={`badge badge-${
                event.status === 'draft' ? 'warning' : 
                event.status === 'published' ? 'primary' : 
                event.status === 'ongoing' ? 'success' : 'secondary'
              }`}>
                {event.status}
              </span>
              <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                {event.currentRegistrations}/{event.registrationLimit} registered
              </p>
              <Link to={`/organizer/events/${event._id}`} className="btn btn-primary" style={{ marginTop: '15px', width: '100%' }}>
                Manage
              </Link>
            </div>
          ))}
        </div>

        {data.events.length === 0 && (
          <div className="empty-state">
            <h3>No events yet</h3>
            <Link to="/organizer/create-event" className="btn btn-primary" style={{ marginTop: '20px' }}>
              Create Your First Event
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrganizerDashboard;

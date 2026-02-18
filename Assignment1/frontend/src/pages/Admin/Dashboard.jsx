import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <h1>Admin Dashboard</h1>
        <p style={{ color: '#7f8c8d', marginTop: '10px' }}>Manage clubs and monitor system activity</p>

        <div className="grid grid-2" style={{ marginTop: '30px' }}>
          <div className="card">
            <h3>Total Clubs</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3498db' }}>
              {stats.totalClubs}
            </p>
          </div>
          <div className="card">
            <h3>Active Clubs</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2ecc71' }}>
              {stats.activeClubs}
            </p>
          </div>
          <div className="card">
            <h3>Inactive Clubs</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
              {stats.inactiveClubs}
            </p>
          </div>
          <div className="card">
            <h3>Total Participants</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f39c12' }}>
              {stats.totalParticipants}
            </p>
          </div>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <Link to="/admin/clubs" className="btn btn-primary" style={{ fontSize: '1.1rem' }}>
              👥 Manage Clubs & Organizers
            </Link>
            <Link to="/admin/password-reset" className="btn btn-warning" style={{ fontSize: '1.1rem' }}>
              🔐 Password Reset Requests
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

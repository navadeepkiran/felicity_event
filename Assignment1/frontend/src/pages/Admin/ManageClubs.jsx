import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ManageClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    organizerName: '',
    category: '',
    description: '',
    contactEmail: ''
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await api.get('/admin/clubs');
      setClubs(response.data.clubs);
    } catch (error) {
      toast.error('Failed to fetch clubs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/admin/clubs', formData);
      toast.success(`Club created! Email: ${response.data.credentials.email}, Password: ${response.data.credentials.password}`);
      setShowModal(false);
      setFormData({ organizerName: '', category: '', description: '', contactEmail: '' });
      fetchClubs();
    } catch (error) {
      toast.error('Failed to create club');
    }
  };

  const handleToggleStatus = async (clubId, currentStatus) => {
    try {
      await api.put(`/admin/clubs/${clubId}`, { isActive: !currentStatus });
      toast.success('Club status updated');
      fetchClubs();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async (clubId, clubEmail) => {
    if (!window.confirm('Are you sure you want to reset the password for this club?')) return;
    
    try {
      const response = await api.post(`/admin/clubs/${clubId}/reset-password`);
      toast.success(`New password: ${response.data.credentials.newPassword}`);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h1>Manage Clubs & Organizers</h1>
          <button onClick={() => setShowModal(true)} className="btn btn-success">
            Add New Club
          </button>
        </div>

        <div style={{ marginTop: '30px' }}>
          {clubs.map(club => (
            <div key={club._id} className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3>{club.organizerName}</h3>
                  <p style={{ color: '#7f8c8d', margin: '5px 0' }}>{club.category}</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>{club.description}</p>
                  <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                    <strong>Email:</strong> {club.email}<br />
                    <strong>Contact:</strong> {club.contactEmail}
                  </p>
                  <span className={`badge badge-${club.isActive ? 'success' : 'danger'}`} style={{ marginTop: '10px' }}>
                    {club.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleToggleStatus(club._id, club.isActive)}
                    className={`btn ${club.isActive ? 'btn-danger' : 'btn-success'}`}
                  >
                    {club.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleResetPassword(club._id, club.email)}
                    className="btn btn-secondary"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for creating new club */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2>Create New Club</h2>
            <form onSubmit={handleCreateClub} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Organizer Name</label>
                <input className="form-input" required
                  value={formData.organizerName}
                  onChange={(e) => setFormData({...formData, organizerName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input className="form-input" type="email" required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-success">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageClubs;

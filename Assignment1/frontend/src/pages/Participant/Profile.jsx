import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ParticipantProfile = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
 const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/participant/profile');
      setProfile(response.data.user);
      setFormData(response.data.user);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/participant/profile', formData);
      setProfile(response.data.user);
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h1>My Profile</h1>
          <button onClick={() => setEditing(!editing)} className="btn btn-secondary">
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="card" style={{ marginTop: '30px' }}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" value={formData.firstName || ''} 
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  disabled={!editing} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" value={formData.lastName || ''}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  disabled={!editing} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email (Non-editable)</label>
                <input className="form-input" value={formData.email || ''} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input className="form-input" value={formData.contactNumber || ''}
                  onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                  disabled={!editing} required />
              </div>
              <div className="form-group">
                <label className="form-label">College/Organization</label>
                <input className="form-input" value={formData.collegeName || ''}
                  onChange={(e) => setFormData({...formData, collegeName: e.target.value})}
                  disabled={!editing} required />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <input className="form-input" value={formData.participantType || ''} disabled />
              </div>
            </div>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Interests (comma separated)</label>
              <input className="form-input" 
                value={formData.interests?.join(', ') || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  interests: e.target.value.split(',').map(i => i.trim()).filter(Boolean)
                })}
                disabled={!editing}
                placeholder="coding, music, sports, open-source" />
              <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '5px' }}>
                Your status will be automatically updated based on your interests and activity
              </p>
            </div>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Current Status</label>
              <input className="form-input" value={formData.participantStatus || 'Newbie'} disabled />
            </div>
            
            {editing && (
              <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }}>
                Save Changes
              </button>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ParticipantProfile;

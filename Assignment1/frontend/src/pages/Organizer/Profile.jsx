import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const OrganizerProfile = () => {
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
      const response = await api.get('/organizer/profile');
      setProfile(response.data.organizer);
      setFormData(response.data.organizer);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/organizer/profile', formData);
      setProfile(response.data.organizer);
      updateUser(response.data.organizer);
      toast.success('Profile updated');
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
          <h1>Organizer Profile</h1>
          <button onClick={() => setEditing(!editing)} className="btn btn-secondary">
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="card" style={{ marginTop: '30px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Organizer Name</label>
              <input className="form-input" value={formData.organizerName || ''}
                onChange={(e) => setFormData({...formData, organizerName: e.target.value})}
                disabled={!editing} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={formData.category || ''}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                disabled={!editing} required>
                <option value="">Select a category</option>
                <option value="Cultural">Cultural</option>
                <option value="Technical">Technical</option>
                <option value="Sports">Sports</option>
                <option value="Literary">Literary</option>
                <option value="Social">Social</option>
                <option value="Academic">Academic</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows="4" value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                disabled={!editing} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input className="form-input" type="email" value={formData.contactEmail || ''}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                disabled={!editing} required />
            </div>
            <div className="form-group">
              <label className="form-label">Discord Webhook (Optional)</label>
              <input className="form-input" value={formData.discordWebhook || ''}
                onChange={(e) => setFormData({...formData, discordWebhook: e.target.value})}
                disabled={!editing} placeholder="https://discord.com/api/webhooks/..." />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>
                Discord will receive automatic notifications when you publish new events
              </small>
            </div>
            {editing && (
              <button type="submit" className="btn btn-primary">Save Changes</button>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default OrganizerProfile;

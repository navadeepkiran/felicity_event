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
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validation
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/participant/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
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

        {/* Security Settings Section */}
        <div className="card" style={{ marginTop: '30px' }}>
          <h2 style={{ marginBottom: '20px' }}>Security Settings</h2>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input 
                type="password"
                className="form-input"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                required
                placeholder="Enter your current password"
              />
            </div>
            
            <div className="grid grid-2" style={{ marginTop: '15px' }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password"
                  className="form-input"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  minLength="6"
                  placeholder="At least 6 characters"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password"
                  className="form-input"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                  minLength="6"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: '20px' }}
              disabled={changingPassword}
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ParticipantProfile;

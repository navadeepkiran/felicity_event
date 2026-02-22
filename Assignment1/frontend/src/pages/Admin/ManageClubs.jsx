import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ManageClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCreateCredentialsModal, setShowCreateCredentialsModal] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({ email: '', password: '' });
  const [createCredentialsData, setCreateCredentialsData] = useState({ email: '', password: '' });
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
      setCreateCredentialsData({
        email: response.data.credentials.email,
        password: response.data.credentials.password
      });
      setShowModal(false);
      setShowCreateCredentialsModal(true);
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
      setResetPasswordData({
        email: clubEmail,
        password: response.data.credentials.newPassword
      });
      setShowPasswordModal(true);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard!`, { autoClose: 2000 });
    }).catch(() => {
      toast.error('Failed to copy');
    });
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

      {/* Modal for new club credentials */}
      {showCreateCredentialsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-secondary) 100%)',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-color)'
          }}>
            <h2 style={{ color: 'var(--accent-cyan)', marginBottom: '20px' }}>
              ✅ Club Created Successfully
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              The club has been created. Share these login credentials with the organizer:
            </p>
            
            <div style={{ 
              background: 'var(--bg-tertiary)', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '15px'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.85rem', 
                  color: 'var(--text-secondary)',
                  marginBottom: '5px'
                }}>
                  Email
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={createCredentialsData.email}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      fontSize: '0.95rem'
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(createCredentialsData.email, 'Email')}
                    style={{
                      padding: '10px 15px',
                      background: 'var(--accent-cyan)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.85rem', 
                  color: 'var(--text-secondary)',
                  marginBottom: '5px'
                }}>
                  Password
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={createCredentialsData.password}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: '#4ade80',
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      fontWeight: '600',
                      letterSpacing: '1px'
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(createCredentialsData.password, 'Password')}
                    style={{
                      padding: '10px 15px',
                      background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#eab308',
                margin: 0,
                display: 'flex',
                alignItems: 'start',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <span>
                  These credentials will only be shown once. Make sure to copy and share them with the organizer before closing this window.
                </span>
              </p>
            </div>

            <button
              onClick={() => {
                setShowCreateCredentialsModal(false);
                setCreateCredentialsData({ email: '', password: '' });
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--accent-purple)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal for password reset */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-secondary) 100%)',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-color)'
          }}>
            <h2 style={{ color: 'var(--accent-cyan)', marginBottom: '20px' }}>
              🔑 Password Reset Successful
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              The password has been reset. Share these credentials with the club organizer:
            </p>
            
            <div style={{ 
              background: 'var(--bg-tertiary)', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '15px'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.85rem', 
                  color: 'var(--text-secondary)',
                  marginBottom: '5px'
                }}>
                  Email
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={resetPasswordData.email}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      fontSize: '0.95rem'
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(resetPasswordData.email, 'Email')}
                    style={{
                      padding: '10px 15px',
                      background: 'var(--accent-cyan)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.85rem', 
                  color: 'var(--text-secondary)',
                  marginBottom: '5px'
                }}>
                  New Password
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={resetPasswordData.password}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: '#4ade80',
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      fontWeight: '600',
                      letterSpacing: '1px'
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(resetPasswordData.password, 'Password')}
                    style={{
                      padding: '10px 15px',
                      background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#eab308',
                margin: 0,
                display: 'flex',
                alignItems: 'start',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <span>
                  This password will only be shown once. Make sure to copy and share it with the organizer before closing this window.
                </span>
              </p>
            </div>

            <button
              onClick={() => {
                setShowPasswordModal(false);
                setResetPasswordData({ email: '', password: '' });
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--accent-purple)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal for onClick={() => handleResetPassword(club._id, club.email)}
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

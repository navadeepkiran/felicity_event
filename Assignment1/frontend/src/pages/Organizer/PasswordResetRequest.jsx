import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';

const PasswordResetRequest = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/organizer/password-reset/requests');
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load password reset requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (reason.trim().length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/organizer/password-reset/request', { reason: reason.trim() });
      toast.success(response.data.message);
      setReason('');
      setShowForm(false);
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit request';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: '#fff3cd', color: '#856404', text: '⏳ Pending' },
      approved: { bg: '#d4edda', color: '#155724', text: '✓ Approved' },
      rejected: { bg: '#f8d7da', color: '#721c24', text: '✗ Rejected' }
    };
    const style = statusStyles[status] || statusStyles.pending;
    
    return (
      <span style={{ 
        padding: '5px 15px', 
        borderRadius: '20px', 
        backgroundColor: style.bg, 
        color: style.color,
        fontSize: '0.9rem'
      }}>
        {style.text}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  const hasPendingRequest = requests.some(req => req.status === 'pending');

  return (
    <Layout>
      <div className="container" style={{ padding: '40px 20px', maxWidth: '1000px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>Password Reset Requests</h1>
          <button onClick={() => navigate('/organizer/dashboard')} className="btn btn-secondary">
            ← Back to Dashboard
          </button>
        </div>

        {!showForm && !hasPendingRequest && (
          <div className="card" style={{ marginBottom: '30px', padding: '30px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '15px' }}>Request Password Reset</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
              Forgot your password? Submit a request to the admin for approval.
            </p>
            <button 
              onClick={() => setShowForm(true)} 
              className="btn btn-primary"
              style={{ fontSize: '1.1rem' }}
            >
              🔒 Request Password Reset
            </button>
          </div>
        )}

        {showForm && (
          <div className="card" style={{ marginBottom: '30px', padding: '30px' }}>
            <h2 style={{ marginBottom: '20px' }}>Submit Password Reset Request</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Reason for Password Reset *</label>
                <textarea
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you need to reset your password (minimum 10 characters)"
                  rows="5"
                  required
                  minLength={10}
                  style={{ resize: 'vertical' }}
                />
                <small style={{ color: '#7f8c8d' }}>
                  {reason.length}/10 characters minimum
                </small>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting || reason.trim().length < 10}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setReason('');
                  }} 
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {hasPendingRequest && (
          <div style={{ 
            marginBottom: '30px', 
            padding: '20px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '8px',
            border: '1px solid #ffc107'
          }}>
            <strong>⏳ Pending Request</strong>
            <p style={{ marginTop: '10px' }}>
              You have a pending password reset request. Please wait for admin approval.
            </p>
          </div>
        )}

        <div className="card" style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: '20px' }}>Request History</h2>
          
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              <p>No password reset requests yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {requests.map((request) => (
                <div 
                  key={request._id}
                  style={{ 
                    padding: '20px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <strong>Request #{request._id.slice(-8)}</strong>
                      <br />
                      <small style={{ color: '#7f8c8d' }}>
                        Submitted: {new Date(request.createdAt).toLocaleString()}
                      </small>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong>Reason:</strong>
                    <p style={{ marginTop: '5px', color: '#495057' }}>
                      {request.reason}
                    </p>
                  </div>

                  {request.status === 'approved' && (
                    <div style={{ 
                      padding: '15px', 
                      backgroundColor: '#d4edda', 
                      borderRadius: '5px',
                      color: '#155724'
                    }}>
                      <strong>✓ Approved</strong>
                      <p style={{ marginTop: '10px' }}>
                        Your password has been reset. Check your email or contact admin for the new password.
                      </p>
                      {request.reviewedAt && (
                        <small style={{ display: 'block', marginTop: '10px' }}>
                          Approved on: {new Date(request.reviewedAt).toLocaleString()}
                        </small>
                      )}
                    </div>
                  )}

                  {request.status === 'rejected' && (
                    <div style={{ 
                      padding: '15px', 
                      backgroundColor: '#f8d7da', 
                      borderRadius: '5px',
                      color: '#721c24'
                    }}>
                      <strong>✗ Rejected</strong>
                      {request.adminNotes && (
                        <p style={{ marginTop: '10px' }}>
                          <strong>Admin Notes:</strong> {request.adminNotes}
                        </p>
                      )}
                      {request.reviewedAt && (
                        <small style={{ display: 'block', marginTop: '10px' }}>
                          Rejected on: {new Date(request.reviewedAt).toLocaleString()}
                        </small>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PasswordResetRequest;

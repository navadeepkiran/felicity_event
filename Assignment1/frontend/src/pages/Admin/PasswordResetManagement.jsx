import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';

const PasswordResetManagement = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      const url = filterStatus === 'all' 
        ? '/admin/password-reset/requests'
        : `/admin/password-reset/requests?status=${filterStatus}`;
      
      const response = await api.get(url);
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load password reset requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this password reset request?')) return;

    setProcessingId(requestId);
    try {
      const response = await api.post(`/admin/password-reset/requests/${requestId}/approve`);
      toast.success('Password reset approved!');
      
      // Show new credentials to admin
      alert(`New credentials:\nEmail: ${response.data.credentials.email}\nNew Password: ${response.data.credentials.newPassword}\n\nPlease share these credentials with the organizer.`);
      
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to approve request';
      toast.error(errorMsg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRequest) return;

    setProcessingId(selectedRequest._id);
    try {
      await api.post(`/admin/password-reset/requests/${selectedRequest._id}/reject`, {
        reason: rejectReason.trim()
      });
      toast.success('Password reset request rejected');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to reject request';
      toast.error(errorMsg);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', border: '#ffc107', text: '⏳ Pending' },
      approved: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '#22c55e', text: '✓ Approved' },
      rejected: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '#ef4444', text: '✗ Rejected' }
    };
    const style = statusStyles[status] || statusStyles.pending;
    
    return (
      <span style={{ 
        padding: '5px 15px', 
        borderRadius: '20px', 
        backgroundColor: style.bg, 
        color: style.color,
        border: `1px solid ${style.border}`,
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

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <Layout>
      <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1>Password Reset Requests</h1>
            {pendingCount > 0 && (
              <p style={{ color: '#ffc107', marginTop: '10px' }}>
                ⚠️ {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} awaiting review
              </p>
            )}
          </div>
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
            ← Back to Dashboard
          </button>
        </div>

        <div className="card" style={{ marginBottom: '30px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Filter by Status:</label>
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <button onClick={fetchRequests} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="card" style={{ padding: '50px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              {filterStatus === 'all' 
                ? 'No password reset requests yet.'
                : `No ${filterStatus} requests found.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {requests.map((request) => (
              <div 
                key={request._id}
                className="card"
                style={{ padding: '25px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h3 style={{ marginBottom: '5px' }}>
                      {request.organizer?.organizerName || 'Unknown Organizer'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <strong>Email:</strong> {request.organizer?.email}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <strong>Request ID:</strong> #{request._id.slice(-8)}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <strong>Submitted:</strong> {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Reason for Reset:</strong>
                  <p style={{ marginTop: '10px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    {request.reason}
                  </p>
                </div>

                {request.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleApprove(request._id)}
                      className="btn btn-success"
                      disabled={processingId === request._id}
                      style={{ flex: 1, minWidth: '150px' }}
                    >
                      {processingId === request._id ? 'Processing...' : '✓ Approve & Reset Password'}
                    </button>
                    <button
                      onClick={() => handleRejectClick(request)}
                      className="btn btn-danger"
                      disabled={processingId === request._id}
                      style={{ flex: 1, minWidth: '150px' }}
                    >
                      ✗ Reject Request
                    </button>
                  </div>
                )}

                {request.status === 'approved' && (
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: 'rgba(34, 197, 94, 0.15)', 
                    borderRadius: '8px',
                    border: '1px solid #22c55e',
                    color: '#22c55e'
                  }}>
                    <strong>✓ Approved</strong>
                    <p style={{ marginTop: '10px', color: 'var(--text-primary)' }}>
                      New password generated and shared with organizer.
                    </p>
                    {request.reviewedBy && (
                      <p style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <strong>Reviewed by:</strong> {request.reviewedBy.name || request.reviewedBy.email}
                        <br />
                        <strong>Date:</strong> {new Date(request.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {request.status === 'rejected' && (
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                    borderRadius: '8px',
                    border: '1px solid #ef4444',
                    color: '#ef4444'
                  }}>
                    <strong>✗ Rejected</strong>
                    {request.adminNotes && (
                      <p style={{ marginTop: '10px', color: 'var(--text-primary)' }}>
                        <strong>Rejection Reason:</strong> {request.adminNotes}
                      </p>
                    )}
                    {request.reviewedBy && (
                      <p style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <strong>Reviewed by:</strong> {request.reviewedBy.name || request.reviewedBy.email}
                        <br />
                        <strong>Date:</strong> {new Date(request.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
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
            <div className="card" style={{ 
              maxWidth: '500px', 
              width: '90%', 
              padding: '30px',
              margin: '20px'
            }}>
              <h2 style={{ marginBottom: '20px' }}>Reject Password Reset Request</h2>
              <form onSubmit={handleRejectSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">Reason for Rejection *</label>
                  <textarea
                    className="form-input"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this request is being rejected"
                    rows="4"
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button 
                    type="submit" 
                    className="btn btn-danger"
                    disabled={processingId || !rejectReason.trim()}
                  >
                    {processingId ? 'Rejecting...' : 'Reject Request'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                      setSelectedRequest(null);
                    }} 
                    className="btn btn-secondary"
                    disabled={processingId}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PasswordResetManagement;

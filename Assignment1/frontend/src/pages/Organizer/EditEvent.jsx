import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const EditEvent = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    eventName: '',
    eventDescription: '',
    eventType: 'normal',
    eligibility: 'all',
    registrationDeadline: '',
    eventStartDate: '',
    eventEndDate: '',
    registrationLimit: '',
    registrationFee: 0,
    eventTags: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/organizer/events/${eventId}`);
      const eventData = response.data.event;
      setEvent(eventData);
      
      // Populate form with existing data
      setFormData({
        eventName: eventData.eventName || '',
        eventDescription: eventData.eventDescription || '',
        eventType: eventData.eventType || 'normal',
        eligibility: eventData.eligibility || 'all',
        registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline).toISOString().slice(0, 16) : '',
        eventStartDate: eventData.eventStartDate ? new Date(eventData.eventStartDate).toISOString().slice(0, 16) : '',
        eventEndDate: eventData.eventEndDate ? new Date(eventData.eventEndDate).toISOString().slice(0, 16) : '',
        registrationLimit: eventData.registrationLimit || '',
        registrationFee: eventData.registrationFee || 0,
        eventTags: eventData.eventTags?.join(', ') || '',
        status: eventData.status || 'draft'
      });
      
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load event');
      navigate('/organizer/dashboard');
    }
  };

  const getEditableFields = () => {
    if (!event) return { canEditAll: false, canEditLimited: false, canEditStatus: false };
    
    switch (event.status) {
      case 'draft':
        return { canEditAll: true, canEditLimited: false, canEditStatus: false };
      case 'published':
        return { canEditAll: false, canEditLimited: true, canEditStatus: false };
      case 'ongoing':
      case 'completed':
        return { canEditAll: false, canEditLimited: false, canEditStatus: true };
      default:
        return { canEditAll: false, canEditLimited: false, canEditStatus: false };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const editPermissions = getEditableFields();
      let payload = {};

      if (editPermissions.canEditAll) {
        // Draft: Can edit everything
        payload = {
          ...formData,
          eventTags: formData.eventTags.split(',').map(tag => tag.trim()).filter(Boolean)
        };
      } else if (editPermissions.canEditLimited) {
        // Published: Only description, deadline, limit, and close registrations
        payload.eventDescription = formData.eventDescription;
        
        // Can only extend deadline
        const originalDeadline = new Date(event.registrationDeadline);
        const newDeadline = new Date(formData.registrationDeadline);
        if (newDeadline > originalDeadline) {
          payload.registrationDeadline = formData.registrationDeadline;
        }
        
        // Can only increase limit
        if (parseInt(formData.registrationLimit) >= event.currentRegistrations) {
          payload.registrationLimit = formData.registrationLimit;
        }
        
        // Can close registrations
        if (formData.status === 'closed') {
          payload.status = 'closed';
        }
      } else if (editPermissions.canEditStatus) {
        // Ongoing/Completed: Only status change
        payload.status = formData.status;
      }

      await api.put(`/organizer/events/${eventId}`, payload);
      toast.success('Event updated successfully!');
      navigate(`/organizer/events/${eventId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRegistrations = async () => {
    if (!window.confirm('Are you sure you want to close registrations for this event?')) {
      return;
    }

    try {
      await api.put(`/organizer/events/${eventId}`, { status: 'closed' });
      toast.success('Registrations closed successfully!');
      navigate(`/organizer/events/${eventId}`);
    } catch (error) {
      toast.error('Failed to close registrations');
    }
  };

  if (loading || !event) {
    return <Layout><div className="loading">Loading...</div></Layout>;
  }

  const editPermissions = getEditableFields();

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Edit Event</h1>
          <span className={`badge badge-${event.status === 'published' ? 'success' : event.status === 'draft' ? 'warning' : 'info'}`}>
            {event.status}
          </span>
        </div>

        {/* Info banner about editing rules */}
        <div style={{
          padding: '15px 20px',
          backgroundColor: 'rgba(88, 166, 255, 0.1)',
          border: '1px solid rgba(88, 166, 255, 0.3)',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <strong style={{ color: 'var(--accent-cyan)' }}>ℹ️ Editing Rules:</strong>
          <ul style={{ marginTop: '10px', marginLeft: '20px', color: 'var(--text-secondary)' }}>
            {editPermissions.canEditAll && (
              <li>✏️ <strong>Draft Status:</strong> All fields can be edited freely. Publish when ready.</li>
            )}
            {editPermissions.canEditLimited && (
              <>
                <li>✏️ <strong>Published Status:</strong> You can update description, extend deadline, increase registration limit, or close registrations.</li>
                <li>🚫 Cannot modify: Event name, type, dates, fees, or reduce limits.</li>
              </>
            )}
            {editPermissions.canEditStatus && (
              <>
                <li>🔒 <strong>{event.status === 'ongoing' ? 'Ongoing' : 'Completed'} Status:</strong> Event details are locked.</li>
                <li>✏️ You can only change the event status (mark as completed or closed).</li>
              </>
            )}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ marginTop: '30px' }}>
          {/* Event Name */}
          <div className="form-group">
            <label className="form-label">Event Name</label>
            <input 
              className="form-input" 
              value={formData.eventName}
              onChange={(e) => setFormData({...formData, eventName: e.target.value})}
              disabled={!editPermissions.canEditAll}
              style={!editPermissions.canEditAll ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </div>

          {/* Event Description */}
          <div className="form-group">
            <label className="form-label">
              Event Description 
              {editPermissions.canEditLimited && <span style={{ color: 'var(--accent-green)', marginLeft: '10px' }}>✓ Editable</span>}
            </label>
            <textarea 
              className="form-input" 
              rows="4"
              value={formData.eventDescription}
              onChange={(e) => setFormData({...formData, eventDescription: e.target.value})}
              disabled={editPermissions.canEditStatus}
              style={editPermissions.canEditStatus ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </div>

          <div className="grid grid-2">
            {/* Event Type */}
            <div className="form-group">
              <label className="form-label">Event Type</label>
              <select 
                className="form-input"
                value={formData.eventType}
                onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                disabled={!editPermissions.canEditAll}
                style={!editPermissions.canEditAll ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                <option value="normal">Normal Event</option>
                <option value="merchandise">Merchandise</option>
                <option value="team">Team Event (Hackathon/Competition)</option>
              </select>
            </div>

            {/* Eligibility */}
            <div className="form-group">
              <label className="form-label">Eligibility</label>
              <select 
                className="form-input"
                value={formData.eligibility}
                onChange={(e) => setFormData({...formData, eligibility: e.target.value})}
                disabled={!editPermissions.canEditAll}
                style={!editPermissions.canEditAll ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                <option value="all">All</option>
                <option value="iiit-only">IIIT Only</option>
                <option value="non-iiit-only">Non-IIIT Only</option>
              </select>
            </div>

            {/* Registration Deadline */}
            <div className="form-group">
              <label className="form-label">
                Registration Deadline
                {editPermissions.canEditLimited && <span style={{ color: 'var(--accent-green)', marginLeft: '10px' }}>✓ Can extend</span>}
              </label>
              <input 
                type="datetime-local" 
                className="form-input"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({...formData, registrationDeadline: e.target.value})}
                disabled={editPermissions.canEditStatus}
                min={editPermissions.canEditLimited ? new Date(event.registrationDeadline).toISOString().slice(0, 16) : undefined}
                style={editPermissions.canEditStatus ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
              {editPermissions.canEditLimited && (
                <small style={{ color: 'var(--text-muted)' }}>Can only extend the deadline, not shorten it</small>
              )}
            </div>

            {/* Event Start Date */}
            <div className="form-group">
              <label className="form-label">Event Start Date</label>
              <input 
                type="datetime-local" 
                className="form-input"
                value={formData.eventStartDate}
                onChange={(e) => setFormData({...formData, eventStartDate: e.target.value})}
                disabled={!editPermissions.canEditAll}
                style={!editPermissions.canEditAll ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
            </div>

            {/* Event End Date */}
            <div className="form-group">
              <label className="form-label">Event End Date</label>
              <input 
                type="datetime-local" 
                className="form-input"
                value={formData.eventEndDate}
                onChange={(e) => setFormData({...formData, eventEndDate: e.target.value})}
                disabled={!editPermissions.canEditAll}
                style={!editPermissions.canEditAll ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
            </div>

            {/* Registration Limit */}
            <div className="form-group">
              <label className="form-label">
                Registration Limit
                {editPermissions.canEditLimited && <span style={{ color: 'var(--accent-green)', marginLeft: '10px' }}>✓ Can increase</span>}
              </label>
              <input 
                type="number" 
                className="form-input"
                value={formData.registrationLimit}
                onChange={(e) => setFormData({...formData, registrationLimit: e.target.value})}
                disabled={editPermissions.canEditStatus}
                min={editPermissions.canEditLimited ? event.currentRegistrations : undefined}
                style={editPermissions.canEditStatus ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
              {editPermissions.canEditLimited && (
                <small style={{ color: 'var(--text-muted)' }}>
                  Minimum: {event.currentRegistrations} (current registrations)
                </small>
              )}
            </div>

            {/* Registration Fee */}
            <div className="form-group">
              <label className="form-label">Registration Fee (₹)</label>
              <input 
                type="number" 
                className="form-input"
                value={formData.registrationFee}
                onChange={(e) => setFormData({...formData, registrationFee: e.target.value})}
                disabled={!editPermissions.canEditAll}
                style={!editPermissions.canEditAll ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
            </div>

            {/* Event Tags */}
            <div className="form-group">
              <label className="form-label">Event Tags (comma separated)</label>
              <input 
                className="form-input"
                value={formData.eventTags}
                onChange={(e) => setFormData({...formData, eventTags: e.target.value})}
                placeholder="workshop, tech, hackathon"
                disabled={!editPermissions.canEditAll}
                style={!editPermissions.canEditAll ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
            </div>
          </div>

          {/* Status Change for Published/Ongoing/Completed events */}
          {(editPermissions.canEditLimited || editPermissions.canEditStatus) && (
            <div className="form-group" style={{
              padding: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <label className="form-label">Event Status</label>
              <select 
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value={event.status}>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</option>
                {(event.status === 'published' || event.status === 'ongoing') && (
                  <>
                    <option value="closed">Close Registrations</option>
                    <option value="completed">Mark as Completed</option>
                  </>
                )}
                {event.status === 'completed' && (
                  <option value="closed">Mark as Closed</option>
                )}
              </select>
              <small style={{ color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
                {event.status === 'published' && '⚠️ Closing registrations will prevent new sign-ups'}
                {(event.status === 'ongoing' || event.status === 'completed') && '⚠️ This will change the event status'}
              </small>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
            <button 
              type="submit" 
              className="btn btn-success" 
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Event'}
            </button>
            
            {editPermissions.canEditLimited && event.status === 'published' && (
              <button 
                type="button"
                onClick={handleCloseRegistrations}
                className="btn btn-danger"
              >
                🚫 Close Registrations
              </button>
            )}
            
            <button 
              type="button"
              onClick={() => navigate(`/organizer/events/${eventId}`)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>

          {/* Help text based on status */}
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            border: '1px solid var(--border-default)'
          }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--accent-cyan)' }}>📋 What can be edited?</h4>
            {editPermissions.canEditAll && (
              <p style={{ color: 'var(--text-secondary)' }}>
                ✅ <strong>Draft events:</strong> All fields can be modified. Make sure everything is correct before publishing!
              </p>
            )}
            {editPermissions.canEditLimited && (
              <ul style={{ color: 'var(--text-secondary)', marginLeft: '20px' }}>
                <li>✅ Update event description</li>
                <li>✅ Extend registration deadline (cannot shorten)</li>
                <li>✅ Increase registration limit (cannot reduce below current registrations: {event.currentRegistrations})</li>
                <li>✅ Close registrations early</li>
                <li>🚫 Cannot change: Event name, type, dates, fees, eligibility</li>
              </ul>
            )}
            {editPermissions.canEditStatus && (
              <p style={{ color: 'var(--text-secondary)' }}>
                🔒 <strong>{event.status === 'ongoing' ? 'Ongoing' : 'Completed'} events:</strong> Event details are locked. 
                You can only change the status to mark the event as completed or closed.
              </p>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditEvent;

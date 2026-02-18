import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formResponses, setFormResponses] = useState({});
  const [merchandiseOrder, setMerchandiseOrder] = useState({
    size: '',
    color: '',
    variant: '',
    quantity: 1
  });

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data.event);
      setIsRegistered(response.data.isRegistered);
      setRegistration(response.data.registration);
    } catch (error) {
      toast.error('Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!event) return;

    // Validate custom form if exists
    if (event.eventType === 'normal' && event.customForm?.length > 0) {
      const requiredFields = event.customForm.filter(field => field.required);
      const missingFields = requiredFields.filter(field => !formResponses[field.fieldName]);
      
      if (missingFields.length > 0) {
        toast.error('Please fill all required fields');
        return;
      }
    }

    // Validate merchandise order if applicable
    if (event.eventType === 'merchandise') {
      if (event.merchandiseDetails.sizes?.length > 0 && !merchandiseOrder.size) {
        toast.error('Please select a size');
        return;
      }
      if (event.merchandiseDetails.colors?.length > 0 && !merchandiseOrder.color) {
        toast.error('Please select a color');
        return;
      }
      if (merchandiseOrder.quantity < 1) {
        toast.error('Quantity must be at least 1');
        return;
      }
      if (merchandiseOrder.quantity > event.merchandiseDetails.stockQuantity) {
        toast.error('Not enough stock available');
        return;
      }
    }

    setRegistering(true);
    try {
      const payload = {
        formResponses: event.eventType === 'normal' ? formResponses : undefined,
        merchandiseOrder: event.eventType === 'merchandise' ? merchandiseOrder : undefined
      };

      await api.post(`/participant/register/${eventId}`, payload);
      toast.success(event.eventType === 'merchandise' ? 'Purchase successful! Check your email for the receipt.' : 'Registration successful! Check your email for the ticket.');
      setIsRegistered(true);
      fetchEventDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const isRegistrationOpen = event && 
    event.status === 'published' &&
    new Date(event.registrationDeadline) > new Date() &&
    event.currentRegistrations < event.registrationLimit;

  const handleFormChange = (fieldName, value) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderCustomForm = () => {
    if (!event.customForm || event.customForm.length === 0) return null;

    return (
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Registration Form</h3>
        {event.customForm.map(field => (
          <div key={field.fieldName} className="form-group">
            <label className="form-label">
              {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
            </label>
            {field.fieldType === 'textarea' ? (
              <textarea
                className="form-input"
                value={formResponses[field.fieldName] || ''}
                onChange={(e) => handleFormChange(field.fieldName, e.target.value)}
                required={field.required}
              />
            ) : field.fieldType === 'dropdown' ? (
              <select
                className="form-input"
                value={formResponses[field.fieldName] || ''}
                onChange={(e) => handleFormChange(field.fieldName, e.target.value)}
                required={field.required}
              >
                <option value="">Select...</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.fieldType}
                className="form-input"
                value={formResponses[field.fieldName] || ''}
                onChange={(e) => handleFormChange(field.fieldName, e.target.value)}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderMerchandiseForm = () => {
    if (!event || event.eventType !== 'merchandise' || !event.merchandiseDetails) return null;

    const { sizes, colors, variants, stockQuantity } = event.merchandiseDetails;

    return (
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Purchase Options</h3>
        
        {sizes && sizes.length > 0 && (
          <div className="form-group">
            <label className="form-label">
              Select Size <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="form-input"
              value={merchandiseOrder.size}
              onChange={(e) => setMerchandiseOrder(prev => ({ ...prev, size: e.target.value }))}
              required
            >
              <option value="">Choose size...</option>
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}

        {colors && colors.length > 0 && (
          <div className="form-group">
            <label className="form-label">
              Select Color <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="form-input"
              value={merchandiseOrder.color}
              onChange={(e) => setMerchandiseOrder(prev => ({ ...prev, color: e.target.value }))}
              required
            >
              <option value="">Choose color...</option>
              {colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
        )}

        {variants && variants.length > 0 && (
          <div className="form-group">
            <label className="form-label">Select Variant</label>
            <select
              className="form-input"
              value={merchandiseOrder.variant}
              onChange={(e) => setMerchandiseOrder(prev => ({ ...prev, variant: e.target.value }))}
            >
              <option value="">Choose variant...</option>
              {variants.map(variant => (
                <option key={variant} value={variant}>{variant}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            Quantity <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="number"
            className="form-input"
            value={merchandiseOrder.quantity}
            onChange={(e) => setMerchandiseOrder(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
            min="1"
            max={stockQuantity}
            required
          />
          <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '5px' }}>
            Available stock: {stockQuantity}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading event details...</div>
      </Layout>
    );
  }

  if (!event) return null;

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1>{event.eventName}</h1>
            <p style={{ color: '#7f8c8d', marginTop: '10px' }}>
              Organized by {event.organizer?.organizerName || 'Unknown'}
            </p>
          </div>
          <div>
            <span className={`badge badge-${event.eventType === 'normal' ? 'primary' : event.eventType === 'team' ? 'warning' : 'success'}`}>
              {event.eventType === 'normal' ? 'Event' : event.eventType === 'team' ? 'Team Event' : 'Merchandise'}
            </span>
          </div>
        </div>

        <div className="card" style={{ marginTop: '30px' }}>
          <h3>Event Details</h3>
          <div style={{ marginTop: '20px', lineHeight: '1.8' }}>
            <p>{event.eventDescription}</p>
            
            <div style={{ marginTop: '30px' }}>
              <h4>Event Information</h4>
              <p><strong>Start Date:</strong> {new Date(event.eventStartDate).toLocaleString()}</p>
              <p><strong>End Date:</strong> {new Date(event.eventEndDate).toLocaleString()}</p>
              <p><strong>Registration Deadline:</strong> {new Date(event.registrationDeadline).toLocaleString()}</p>
              <p><strong>Registration Fee:</strong> ₹{event.registrationFee}</p>
              <p><strong>Eligibility:</strong> {event.eligibility}</p>
              <p><strong>Spots Available:</strong>{event.registrationLimit - event.currentRegistrations}/{event.registrationLimit}</p>
              
              {event.eventType === 'team' && event.teamDetails && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                  <h4>🏆 Team Event Information</h4>
                  <p><strong>Team Size:</strong> {event.teamDetails.minTeamSize} - {event.teamDetails.maxTeamSize} members</p>
                  <p><strong>Registration Type:</strong> Team-based</p>
                  <p><strong>How it works:</strong> Create or join a team. Registration completes automatically when your team is full.</p>
                </div>
              )}
              
              {event.eventType === 'merchandise' && event.merchandiseDetails && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h4>Merchandise Details</h4>
                  <p><strong>Item:</strong> {event.merchandiseDetails.itemName}</p>
                  <p><strong>Stock Available:</strong> {event.merchandiseDetails.stockQuantity}</p>
                  {event.merchandiseDetails.sizes && event.merchandiseDetails.sizes.length > 0 && (
                    <p><strong>Available Sizes:</strong> {event.merchandiseDetails.sizes.join(', ')}</p>
                  )}
                  {event.merchandiseDetails.colors && event.merchandiseDetails.colors.length > 0 && (
                    <p><strong>Available Colors:</strong> {event.merchandiseDetails.colors.join(', ')}</p>
                  )}
                  {event.merchandiseDetails.variants && event.merchandiseDetails.variants.length > 0 && (
                    <p><strong>Variants:</strong> {event.merchandiseDetails.variants.join(', ')}</p>
                  )}
                </div>
              )}
            </div>

            {event.eventTags && event.eventTags.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <strong>Tags:</strong>{' '}
                {event.eventTags.map(tag => (
                  <span key={tag} className="badge badge-primary" style={{ marginLeft: '5px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <button
            onClick={() => navigate(`/events/${eventId}/discussions`)}
            className="btn btn-primary"
            style={{ fontSize: '1rem' }}
          >
            💬 Discussion Forum
          </button>
        </div>

        {!isRegistered && isRegistrationOpen && event.eventType === 'normal' && renderCustomForm()}
        {!isRegistered && isRegistrationOpen && event.eventType === 'merchandise' && renderMerchandiseForm()}

        <div className="card" style={{ marginTop: '20px', textAlign: 'center' }}>
          {isRegistered ? (
            <div>
              <h3 style={{ color: '#27ae60' }}>✓ You are registered for this event!</h3>
              <p style={{ marginTop: '10px', color: '#7f8c8d' }}>
                Check your email for the ticket and QR code.
              </p>
              
              {registration && (
                <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h4>Your Ticket</h4>
                  <p style={{ marginTop: '15px' }}>
                    <strong>Ticket ID:</strong> {registration.ticketId}
                  </p>
                  <p style={{ marginTop: '10px', color: '#7f8c8d', fontSize: '0.9rem' }}>
                    Registered on: {new Date(registration.registrationDate).toLocaleDateString()}
                  </p>
                  
                  {registration.qrCode && (
                    <div style={{ marginTop: '20px' }}>
                      <h5>QR Code:</h5>
                      <img 
                        src={registration.qrCode} 
                        alt="Ticket QR Code" 
                        style={{ 
                          maxWidth: '250px', 
                          margin: '15px auto', 
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          padding: '10px',
                          backgroundColor: '#fff'
                        }} 
                      />
                      <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '10px' }}>
                        Show this QR code at the event venue for entry
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {event.eventType === 'team' && (
                <button
                  onClick={() => navigate(`/events/${eventId}/team`)}
                  className="btn btn-warning"
                  style={{ marginTop: '20px', fontSize: '1.1rem' }}
                >
                  🏆 Manage Team
                </button>
              )}
            </div>
          ) : event.eventType === 'team' && isRegistrationOpen ? (
            <div>
              <h3>Team Registration</h3>
              <p style={{ marginTop: '10px', color: '#7f8c8d' }}>
                This is a team event. You need to create or join a team to participate.
              </p>
              <button
                onClick={() => navigate(`/events/${eventId}/team`)}
                className="btn btn-warning"
                style={{ marginTop: '20px', fontSize: '1.1rem' }}
              >
                🏆 Manage Team
              </button>
            </div>
          ) : isRegistrationOpen ? (
            <div>
              <h3>{event.eventType === 'merchandise' ? 'Ready to purchase?' : 'Ready to join?'}</h3>
              <button
                onClick={handleRegister}
                className="btn btn-success"
                style={{ marginTop: '20px', fontSize: '1.1rem' }}
                disabled={registering}
              >
                {registering 
                  ? (event.eventType === 'merchandise' ? 'Processing...' : 'Registering...') 
                  : `${event.eventType === 'merchandise' ? 'Purchase Now' : 'Register Now'} - ₹${event.registrationFee}`
                }
              </button>
            </div>
          ) : (
            <div>
              <h3 style={{ color: '#e74c3c' }}>Registration Closed</h3>
              <p style={{ marginTop: '10px', color: '#7f8c8d' }}>
                {event.currentRegistrations >= event.registrationLimit
                  ? 'Event is full'
                  : 'Registration deadline has passed'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EventDetails;

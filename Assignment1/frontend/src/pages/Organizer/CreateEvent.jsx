import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const CreateEvent = () => {
  const navigate = useNavigate();
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
    customForm: [],
    merchandiseDetails: {
      itemName: '',
      stockQuantity: '',
      sizes: '',
      colors: '',
      variants: ''
    },
    teamDetails: {
      minTeamSize: 2,
      maxTeamSize: 4,
      allowSoloRegistration: false
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        eventTags: formData.eventTags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      // Format merchandise details if event type is merchandise
      if (formData.eventType === 'merchandise') {
        payload.merchandiseDetails = {
          itemName: formData.merchandiseDetails.itemName,
          stockQuantity: parseInt(formData.merchandiseDetails.stockQuantity) || 0,
          sizes: formData.merchandiseDetails.sizes.split(',').map(s => s.trim()).filter(Boolean),
          colors: formData.merchandiseDetails.colors.split(',').map(c => c.trim()).filter(Boolean),
          variants: formData.merchandiseDetails.variants.split(',').map(v => v.trim()).filter(Boolean)
        };
      } else {
        delete payload.merchandiseDetails;
      }

      // Format team details if event type is team
      if (formData.eventType === 'team') {
        payload.teamDetails = {
          minTeamSize: parseInt(formData.teamDetails.minTeamSize) || 2,
          maxTeamSize: parseInt(formData.teamDetails.maxTeamSize) || 4,
          allowSoloRegistration: formData.teamDetails.allowSoloRegistration
        };
      } else {
        delete payload.teamDetails;
      }

      const response = await api.post('/organizer/events', payload);
      toast.success('Event created successfully!');
      navigate(`/organizer/events/${response.data.event._id}`);
    } catch (error) {
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <h1>Create New Event</h1>

        <form onSubmit={handleSubmit} className="card" style={{ marginTop: '30px' }}>
          <div className="form-group">
            <label className="form-label">Event Name</label>
            <input className="form-input" required
              value={formData.eventName}
              onChange={(e) => setFormData({...formData, eventName: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Event Description</label>
            <textarea className="form-input" rows="4" required
              value={formData.eventDescription}
              onChange={(e) => setFormData({...formData, eventDescription: e.target.value})} />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Event Type</label>
              <select className="form-input" required
                value={formData.eventType}
                onChange={(e) => setFormData({...formData, eventType: e.target.value})}>
                <option value="normal">Normal Event</option>
                <option value="merchandise">Merchandise</option>
                <option value="team">Team Event (Hackathon/Competition)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Eligibility</label>
              <select className="form-input" required
                value={formData.eligibility}
                onChange={(e) => setFormData({...formData, eligibility: e.target.value})}>
                <option value="all">All</option>
                <option value="iiit-only">IIIT Only</option>
                <option value="non-iiit-only">Non-IIIT Only</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Registration Deadline</label>
              <input type="datetime-local" className="form-input" required
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({...formData, registrationDeadline: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Event Start Date</label>
              <input type="datetime-local" className="form-input" required
                value={formData.eventStartDate}
                onChange={(e) => setFormData({...formData, eventStartDate: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Event End Date</label>
              <input type="datetime-local" className="form-input" required
                value={formData.eventEndDate}
                onChange={(e) => setFormData({...formData, eventEndDate: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Registration Limit</label>
              <input type="number" className="form-input" required
                value={formData.registrationLimit}
                onChange={(e) => setFormData({...formData, registrationLimit: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Registration Fee (₹)</label>
              <input type="number" className="form-input" required
                value={formData.registrationFee}
                onChange={(e) => setFormData({...formData, registrationFee: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Event Tags (comma separated)</label>
              <input className="form-input"
                value={formData.eventTags}
                onChange={(e) => setFormData({...formData, eventTags: e.target.value})}
                placeholder="workshop, tech, hackathon" />
            </div>
          </div>

          {/* Team-specific fields */}
          {formData.eventType === 'team' && (
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' }}>
              <h3 style={{ marginBottom: '20px' }}>🏆 Team Event Configuration</h3>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Minimum Team Size</label>
                  <input type="number" className="form-input" required min="2"
                    value={formData.teamDetails.minTeamSize}
                    onChange={(e) => setFormData({
                      ...formData, 
                      teamDetails: {...formData.teamDetails, minTeamSize: e.target.value}
                    })}
                    placeholder="2" />
                </div>

                <div className="form-group">
                  <label className="form-label">Maximum Team Size</label>
                  <input type="number" className="form-input" required min="2"
                    value={formData.teamDetails.maxTeamSize}
                    onChange={(e) => setFormData({
                      ...formData, 
                      teamDetails: {...formData.teamDetails, maxTeamSize: e.target.value}
                    })}
                    placeholder="4" />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox"
                    checked={formData.teamDetails.allowSoloRegistration}
                    onChange={(e) => setFormData({
                      ...formData, 
                      teamDetails: {...formData.teamDetails, allowSoloRegistration: e.target.checked}
                    })} />
                  <span>Allow solo registration (participants can register without forming a team)</span>
                </label>
              </div>

              <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#856404' }}>
                💡 Participants will be able to create teams and invite others using invite codes. Registration completes automatically when the team is full.
              </p>
            </div>
          )}

          {/* Merchandise-specific fields */}
          {formData.eventType === 'merchandise' && (
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '20px' }}>Merchandise Details</h3>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Item Name</label>
                  <input className="form-input" required
                    value={formData.merchandiseDetails.itemName}
                    onChange={(e) => setFormData({
                      ...formData, 
                      merchandiseDetails: {...formData.merchandiseDetails, itemName: e.target.value}
                    })}
                    placeholder="T-Shirt, Hoodie, etc." />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input type="number" className="form-input" required
                    value={formData.merchandiseDetails.stockQuantity}
                    onChange={(e) => setFormData({
                      ...formData, 
                      merchandiseDetails: {...formData.merchandiseDetails, stockQuantity: e.target.value}
                    })}
                    placeholder="50" />
                </div>

                <div className="form-group">
                  <label className="form-label">Available Sizes (comma separated)</label>
                  <input className="form-input"
                    value={formData.merchandiseDetails.sizes}
                    onChange={(e) => setFormData({
                      ...formData, 
                      merchandiseDetails: {...formData.merchandiseDetails, sizes: e.target.value}
                    })}
                    placeholder="S, M, L, XL, XXL" />
                </div>

                <div className="form-group">
                  <label className="form-label">Available Colors (comma separated)</label>
                  <input className="form-input"
                    value={formData.merchandiseDetails.colors}
                    onChange={(e) => setFormData({
                      ...formData, 
                      merchandiseDetails: {...formData.merchandiseDetails, colors: e.target.value}
                    })}
                    placeholder="Black, White, Blue, Red" />
                </div>

                <div className="form-group">
                  <label className="form-label">Variants (comma separated, optional)</label>
                  <input className="form-input"
                    value={formData.merchandiseDetails.variants}
                    onChange={(e) => setFormData({
                      ...formData, 
                      merchandiseDetails: {...formData.merchandiseDetails, variants: e.target.value}
                    })}
                    placeholder="Basic, Premium, Limited Edition" />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? 'Creating...' : 'Create Event (Draft)'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default CreateEvent;

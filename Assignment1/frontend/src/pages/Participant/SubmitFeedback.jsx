import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const SubmitFeedback = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  useEffect(() => {
    fetchEventAndFeedback();
  }, [eventId]);

  const fetchEventAndFeedback = async () => {
    try {
      const [eventRes, feedbackRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/feedback/event/${eventId}`)
      ]);
      
      setEvent(eventRes.data.event);
      setHasSubmitted(feedbackRes.data.data.hasSubmitted);
      
      if (feedbackRes.data.data.userFeedback) {
        setExistingFeedback(feedbackRes.data.data.userFeedback);
        setRating(feedbackRes.data.data.userFeedback.rating);
        setComment(feedbackRes.data.data.userFeedback.comment);
      }
    } catch (error) {
      toast.error('Failed to load event details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await api.post('/feedback/submit', {
        eventId,
        rating,
        comment
      });
      
      toast.success('Feedback submitted successfully! Thank you for your input.');
      setHasSubmitted(true);
      setExistingFeedback({ rating, comment });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return <Layout><div className="loading">Loading...</div></Layout>;

  const renderStar = (index) => {
    const filled = (hoveredRating || rating) >= index;
    return (
      <span
        key={index}
        onMouseEnter={() => setHoveredRating(index)}
        onMouseLeave={() => setHoveredRating(0)}
        onClick={() => !hasSubmitted && setRating(index)}
        style={{
          fontSize: '3rem',
          cursor: hasSubmitted ? 'default' : 'pointer',
          color: filled ? '#ffd700' : 'var(--text-muted)',
          transition: 'color 0.2s',
          textShadow: filled ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
          marginRight: '10px'
        }}
      >
        ★
      </span>
    );
  };

  return (
    <Layout>
      <div style={{ marginTop: '30px', maxWidth: '800px', margin: '30px auto' }}>
        <h1 style={{ marginBottom: '10px', textAlign: 'center', color: 'var(--accent-cyan)' }}>
          Event Feedback
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '30px' }}>
          {hasSubmitted ? 'You have submitted feedback for this event' : 'Share your anonymous feedback'}
        </p>

        <div className="card" style={{ 
          padding: '40px',
          background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-elevated) 100%)',
          border: '1px solid var(--event-card-border)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}>
          <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>{event.eventName}</h2>
          
          {hasSubmitted ? (
            <div>
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--bg-elevated)', 
                borderRadius: '8px',
                border: '1px solid var(--accent-green)',
                marginBottom: '20px'
              }}>
                <p style={{ color: 'var(--accent-green)', marginBottom: '15px', fontSize: '1.1rem' }}>
                  ✓ Feedback Submitted
                </p>
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Your Rating:</p>
                  <div style={{ fontSize: '2.5rem' }}>
                    {[1, 2, 3, 4, 5].map((index) => (
                      <span 
                        key={index}
                        style={{ 
                          color: index <= existingFeedback.rating ? '#ffd700' : 'var(--text-muted)',
                          marginRight: '10px'
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {existingFeedback.comment && (
                  <div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Your Comment:</p>
                    <p style={{ 
                      color: 'var(--text-primary)', 
                      backgroundColor: 'var(--bg-primary)',
                      padding: '15px',
                      borderRadius: '5px',
                      fontStyle: 'italic'
                    }}>
                      "{existingFeedback.comment}"
                    </p>
                  </div>
                )}
              </div>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                🔒 Your feedback is anonymous and helps improve future events
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '15px', 
                  fontSize: '1.2rem',
                  color: 'var(--text-primary)'
                }}>
                  Rate your experience:
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  {[1, 2, 3, 4, 5].map(renderStar)}
                </div>
                {rating > 0 && (
                  <p style={{ color: 'var(--accent-cyan)', marginTop: '10px' }}>
                    {rating === 5 && '⭐ Excellent!'}
                    {rating === 4 && '👍 Good'}
                    {rating === 3 && '😊 Average'}
                    {rating === 2 && '😐 Below Average'}
                    {rating === 1 && '😞 Poor'}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--text-primary)' }}>
                  Additional Comments (Optional):
                </label>
                <textarea
                  className="form-input"
                  rows="5"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about the event... (max 1000 characters)"
                  maxLength={1000}
                  style={{ 
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  {comment.length}/1000 characters
                </small>
              </div>

              <div style={{ 
                padding: '15px', 
                backgroundColor: 'var(--bg-elevated)', 
                borderRadius: '5px',
                marginBottom: '20px',
                border: '1px solid var(--accent-purple)'
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  🔒 <strong>Anonymous Feedback:</strong> Your identity will not be shared with organizers. 
                  Only aggregated ratings and anonymous comments will be visible.
                </p>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || rating === 0}
                style={{ width: '100%', fontSize: '1.1rem', padding: '15px' }}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SubmitFeedback;

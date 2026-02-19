import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const EventFeedback = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, [eventId, selectedRating]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const eventRes = await api.get(`/events/${eventId}`);
      setEvent(eventRes.data.event);

      let feedbackRes;
      if (selectedRating) {
        feedbackRes = await api.get(`/feedback/event/${eventId}/rating/${selectedRating}`);
        setFeedbackData({
          totalFeedback: feedbackRes.data.data.count,
          feedbacks: feedbackRes.data.data.feedbacks,
          filtered: true
        });
      } else {
        feedbackRes = await api.get(`/feedback/event/${eventId}`);
        setFeedbackData(feedbackRes.data.data);
      }
    } catch (error) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <span>
        {[1, 2, 3, 4, 5].map((i) => (
          <span 
            key={i} 
            style={{ 
              color: i <= rating ? '#ffd700' : 'var(--text-muted)',
              fontSize: '1.2rem',
              marginRight: '2px',
              textShadow: i <= rating ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none'
            }}
          >
            ★
          </span>
        ))}
      </span>
    );
  };

  const renderRatingBar = (rating, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div 
        key={rating}
        onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: selectedRating === rating ? 'var(--bg-elevated)' : 'transparent',
          borderRadius: '5px',
          cursor: 'pointer',
          border: selectedRating === rating ? '1px solid var(--accent-cyan)' : '1px solid transparent',
          transition: 'all 0.3s'
        }}
      >
        <div style={{ 
          minWidth: '100px', 
          display: 'flex', 
          alignItems: 'center',
          color: 'var(--text-primary)'
        }}>
          <span style={{ marginRight: '10px', fontSize: '1.1rem' }}>{rating}</span>
          <span style={{ color: '#ffd700', fontSize: '1rem' }}>★</span>
        </div>
        <div style={{ flex: 1, marginRight: '15px' }}>
          <div style={{
            height: '25px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              height: '100%',
              width: `${percentage}%`,
              background: `linear-gradient(90deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)`,
              transition: 'width 0.3s',
              borderRadius: '12px'
            }} />
          </div>
        </div>
        <div style={{ 
          minWidth: '80px', 
          textAlign: 'right',
          color: 'var(--text-muted)'
        }}>
          {count} ({percentage.toFixed(0)}%)
        </div>
      </div>
    );
  };

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;
  if (!event || !feedbackData) return <Layout><div>No data available</div></Layout>;

  const { totalFeedback, averageRating, ratingCounts, feedbacks, filtered } = feedbackData;

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ marginBottom: '10px', color: 'var(--accent-cyan)' }}>Event Feedback</h1>
          <h3 style={{ color: 'var(--text-muted)' }}>{event.eventName}</h3>
        </div>

        {totalFeedback === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <h2 style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>📝</h2>
            <h3 style={{ color: 'var(--text-primary)' }}>No Feedback Yet</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>
              Participants who attended this event can submit anonymous feedback.
            </p>
          </div>
        ) : (
          <div>
            {/* Summary Cards */}
            {!filtered && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div className="card" style={{
                  background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-elevated) 100%)',
                  border: '1px solid var(--event-card-border)',
                  padding: '25px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>
                    Average Rating
                  </p>
                  <h1 style={{ 
                    color: 'var(--accent-cyan)', 
                    fontSize: '3rem',
                    margin: '10px 0',
                    textShadow: '0 0 20px rgba(88, 166, 255, 0.3)'
                  }}>
                    {averageRating}
                  </h1>
                  <div style={{ fontSize: '2rem', color: '#ffd700' }}>
                    {renderStars(Math.round(averageRating))}
                  </div>
                </div>

                <div className="card" style={{
                  background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-elevated) 100%)',
                  border: '1px solid var(--event-card-border)',
                  padding: '25px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>
                    Total Responses
                  </p>
                  <h1 style={{ 
                    color: 'var(--accent-purple)', 
                    fontSize: '3rem',
                    margin: '10px 0',
                    textShadow: '0 0 20px rgba(188, 140, 255, 0.3)'
                  }}>
                    {totalFeedback}
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Anonymous Submissions
                  </p>
                </div>

                <div className="card" style={{
                  background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-elevated) 100%)',
                  border: '1px solid var(--event-card-border)',
                  padding: '25px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>
                    Satisfaction Rate
                  </p>
                  <h1 style={{ 
                    color: 'var(--accent-green)', 
                    fontSize: '3rem',
                    margin: '10px 0',
                    textShadow: '0 0 20px rgba(63, 185, 80, 0.3)'
                  }}>
                    {totalFeedback > 0 ? 
                      Math.round(((ratingCounts[4] + ratingCounts[5]) / totalFeedback) * 100) : 0}%
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    4-5 Star Ratings
                  </p>
                </div>
              </div>
            )}

            {/* Rating Distribution */}
            {!filtered && (
              <div className="card" style={{ marginBottom: '30px', padding: '30px' }}>
                <h3 style={{ marginBottom: '25px', color: 'var(--text-primary)' }}>
                  Rating Distribution (Click to filter)
                </h3>
                {[5, 4, 3, 2, 1].map(rating => 
                  renderRatingBar(rating, ratingCounts[rating], totalFeedback)
                )}
              </div>
            )}

            {/* Individual Feedback */}
            {feedbacks && feedbacks.length > 0 && (
              <div className="card" style={{ padding: '30px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '25px'
                }}>
                  <h3 style={{ color: 'var(--text-primary)' }}>
                    {filtered ? `${selectedRating} Star Reviews` : 'All Feedback Comments'}
                  </h3>
                  {selectedRating && (
                    <button 
                      onClick={() => setSelectedRating(null)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px' }}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>

                {feedbacks.filter(f => f.comment && f.comment.trim()).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                    No written comments for this rating
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {feedbacks.filter(f => f.comment && f.comment.trim()).map((feedback, index) => (
                      <div 
                        key={index}
                        style={{
                          padding: '20px',
                          backgroundColor: 'var(--bg-elevated)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          marginBottom: '15px',
                          alignItems: 'center'
                        }}>
                          <div>{renderStars(feedback.rating)}</div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {new Date(feedback.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ 
                          color: 'var(--text-primary)',
                          lineHeight: '1.6',
                          fontStyle: 'italic'
                        }}>
                          "{feedback.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventFeedback;

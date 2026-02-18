import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';

const EventDiscussions = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '' });
  const [replyContent, setReplyContent] = useState({});
  const [showReply, setShowReply] = useState({});

  useEffect(() => {
    fetchEventAndDiscussions();
  }, [eventId]);

  const fetchEventAndDiscussions = async () => {
    try {
      const [eventRes, discussionsRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/discussions/event/${eventId}`)
      ]);
      setEvent(eventRes.data.event);
      setDiscussions(discussionsRes.data.discussions);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load discussions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      await api.post(`/discussions/event/${eventId}`, newDiscussion);
      toast.success('Discussion created successfully');
      setNewDiscussion({ title: '', content: '' });
      setShowNewDiscussion(false);
      fetchEventAndDiscussions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create discussion');
    }
  };

  const handleAddReply = async (discussionId) => {
    const content = replyContent[discussionId];
    
    if (!content || !content.trim()) {
      toast.error('Reply content is required');
      return;
    }

    try {
      await api.post(`/discussions/${discussionId}/reply`, { content });
      toast.success('Reply added successfully');
      setReplyContent({ ...replyContent, [discussionId]: '' });
      setShowReply({ ...showReply, [discussionId]: false });
      fetchEventAndDiscussions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add reply');
    }
  };

  const handleDeleteDiscussion = async (discussionId) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;

    try {
      await api.delete(`/discussions/${discussionId}`);
      toast.success('Discussion deleted successfully');
      fetchEventAndDiscussions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete discussion');
    }
  };

  const getUserDisplay = (user) => {
    if (user.role === 'organizer') {
      return `${user.organizerName} (Organizer)`;
    }
    return `${user.firstName} ${user.lastName}`;
  };

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>
        {event && (
          <div style={{ marginBottom: '30px' }}>
            <button 
              onClick={() => navigate(`/event/${eventId}`)} 
              className="btn btn-secondary"
              style={{ marginBottom: '15px' }}
            >
              ← Back to Event
            </button>
            <h1>{event.eventName} - Discussion Forum</h1>
            <p style={{ color: '#7f8c8d' }}>Ask questions and discuss with other participants</p>
          </div>
        )}

        <div style={{ marginBottom: '30px' }}>
          <button 
            onClick={() => setShowNewDiscussion(!showNewDiscussion)} 
            className="btn btn-primary"
          >
            {showNewDiscussion ? 'Cancel' : '+ New Discussion'}
          </button>
        </div>

        {showNewDiscussion && (
          <div className="card" style={{ marginBottom: '30px', padding: '20px' }}>
            <h3>Create New Discussion</h3>
            <form onSubmit={handleCreateDiscussion}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                  placeholder="Enter discussion title"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-input"
                  rows="5"
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                  placeholder="Enter your question or comment"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">Post Discussion</button>
                <button 
                  type="button" 
                  onClick={() => setShowNewDiscussion(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div>
          {discussions.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
              <p>No discussions yet. Be the first to start one!</p>
            </div>
          ) : (
            discussions.map(discussion => (
              <div key={discussion._id} className="card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ marginBottom: '5px' }}>{discussion.title}</h3>
                    <small style={{ color: '#7f8c8d' }}>
                      Posted by {getUserDisplay(discussion.author)} • {new Date(discussion.createdAt).toLocaleString()}
                    </small>
                  </div>
                  {(discussion.author._id === user._id || user.role === 'organizer') && (
                    <button
                      onClick={() => handleDeleteDiscussion(discussion._id)}
                      className="btn btn-danger"
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{discussion.content}</p>

                {/* Replies */}
                {discussion.replies.length > 0 && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ecf0f1' }}>
                    <h4 style={{ marginBottom: '15px', fontSize: '16px' }}>Replies ({discussion.replies.length})</h4>
                    {discussion.replies.map((reply, index) => (
                      <div key={index} style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginBottom: '10px' 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong>{getUserDisplay(reply.user)}</strong>
                          <small style={{ color: '#7f8c8d' }}>{new Date(reply.createdAt).toLocaleString()}</small>
                        </div>
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <div style={{ marginTop: '20px' }}>
                  {!showReply[discussion._id] ? (
                    <button
                      onClick={() => setShowReply({ ...showReply, [discussion._id]: true })}
                      className="btn btn-secondary"
                      style={{ fontSize: '14px' }}
                    >
                      Reply
                    </button>
                  ) : (
                    <div>
                      <textarea
                        className="form-input"
                        rows="3"
                        value={replyContent[discussion._id] || ''}
                        onChange={(e) => setReplyContent({ ...replyContent, [discussion._id]: e.target.value })}
                        placeholder="Write your reply..."
                      />
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                          onClick={() => handleAddReply(discussion._id)}
                          className="btn btn-primary"
                          style={{ fontSize: '14px' }}
                        >
                          Post Reply
                        </button>
                        <button
                          onClick={() => setShowReply({ ...showReply, [discussion._id]: false })}
                          className="btn btn-secondary"
                          style={{ fontSize: '14px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EventDiscussions;

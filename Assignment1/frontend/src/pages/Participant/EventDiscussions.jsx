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
  const [isRegistered, setIsRegistered] = useState(false);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '' });
  const [replyContent, setReplyContent] = useState({});
  const [showReply, setShowReply] = useState({});
  const [previousCount, setPreviousCount] = useState(0);
  const [previousAnnouncementIds, setPreviousAnnouncementIds] = useState(new Set());
  const [previousPinnedIds, setPreviousPinnedIds] = useState(new Set());

  useEffect(() => {
    fetchEventAndDiscussions();
    
    // Real-time polling - fetch every 5 seconds
    const interval = setInterval(() => {
      fetchEventAndDiscussions(true); // Silent fetch
    }, 5000);

    return () => clearInterval(interval);
  }, [eventId]);

  const fetchEventAndDiscussions = async (silent = false) => {
    try {
      const [eventRes, discussionsRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/discussions/event/${eventId}`)
      ]);
      
      const eventData = eventRes.data.event;
      setEvent(eventData);
      
      const newDiscussions = discussionsRes.data.discussions;
      setIsRegistered(discussionsRes.data.isRegistered || false);
      
      // Debug logging
      if (!silent) {
        console.log('Event data:', eventData);
        console.log('Event organizer:', eventData.organizer);
        console.log('Current user:', user);
        console.log('User ID:', user?._id);
        console.log('User role:', user?.role);
      }
      
      // Remove this line as we already set newDiscussions above
      // const newDiscussions = discussionsRes.data.discussions;
      
      // Show notifications for updates (only during polling)
      if (silent && discussions.length > 0) {
        // Check for new messages
        const totalMessages = newDiscussions.reduce((sum, d) => sum + 1 + (d.replies?.length || 0), 0);
        if (totalMessages > previousCount) {
          toast.info('💬 New activity in discussion forum!');
        }
        setPreviousCount(totalMessages);
        
        // Check for new announcements
        const currentAnnouncementIds = new Set(
          newDiscussions.filter(d => d.isAnnouncement).map(d => d._id)
        );
        
        const newAnnouncements = [...currentAnnouncementIds].filter(
          id => !previousAnnouncementIds.has(id)
        );
        
        console.log('Checking announcements:', {
          currentAnnouncementIds: [...currentAnnouncementIds],
          previousAnnouncementIds: [...previousAnnouncementIds],
          newAnnouncements
        });
        
        if (newAnnouncements.length > 0) {
          // Find the announcement title(s)
          const announcementTitles = newDiscussions
            .filter(d => newAnnouncements.includes(d._id))
            .map(d => d.title);
          
          console.log('🔔 NEW ANNOUNCEMENT DETECTED:', announcementTitles);
          
          if (announcementTitles.length > 0) {
            toast.warning(`📢 New Announcement: ${announcementTitles[0]}`, {
              autoClose: 8000,
              position: 'top-center'
            });
          }
        }
        
        setPreviousAnnouncementIds(currentAnnouncementIds);
        
        // Check for newly pinned discussions
        const currentPinnedIds = new Set(
          newDiscussions.filter(d => d.isPinned).map(d => d._id)
        );
        
        const newPinned = [...currentPinnedIds].filter(
          id => !previousPinnedIds.has(id)
        );
        
        console.log('Checking pinned:', {
          currentPinnedIds: [...currentPinnedIds],
          previousPinnedIds: [...previousPinnedIds],
          newPinned
        });
        
        if (newPinned.length > 0) {
          const pinnedTitles = newDiscussions
            .filter(d => newPinned.includes(d._id))
            .map(d => d.title);
          
          console.log('🔔 NEW PINNED DISCUSSION DETECTED:', pinnedTitles);
          
          if (pinnedTitles.length > 0) {
            toast.info(`📌 Discussion Pinned: ${pinnedTitles[0]}`);
          }
        }
        
        setPreviousPinnedIds(currentPinnedIds);
      } else if (!silent) {
        // Initial load - set up tracking
        const totalMessages = newDiscussions.reduce((sum, d) => sum + 1 + (d.replies?.length || 0), 0);
        setPreviousCount(totalMessages);
        
        const announcementIds = new Set(
          newDiscussions.filter(d => d.isAnnouncement).map(d => d._id)
        );
        setPreviousAnnouncementIds(announcementIds);
        
        const pinnedIds = new Set(
          newDiscussions.filter(d => d.isPinned).map(d => d._id)
        );
        setPreviousPinnedIds(pinnedIds);
      }
      
      setDiscussions(newDiscussions);
    } catch (error) {
      if (!silent) {
        console.error('Fetch error:', error);
        toast.error('Failed to load discussions');
      }
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

  const handleTogglePin = async (discussionId) => {
    try {
      const discussion = discussions.find(d => d._id === discussionId);
      const response = await api.put(`/discussions/${discussionId}/pin`);
      
      // Show prominent notification for organizer
      if (discussion && response.data.discussion?.isPinned) {
        toast.info(`📌 "${discussion.title}" has been pinned and all participants will be notified`, {
          autoClose: 5000,
          position: 'top-center'
        });
      } else {
        toast.success(response.data.message);
      }
      
      fetchEventAndDiscussions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to pin discussion');
    }
  };

  const handleToggleAnnouncement = async (discussionId) => {
    try {
      const discussion = discussions.find(d => d._id === discussionId);
      const response = await api.put(`/discussions/${discussionId}/announcement`);
      
      // Show prominent notification for organizer
      if (discussion && response.data.discussion?.isAnnouncement) {
        toast.warning(`📢 "${discussion.title}" marked as announcement - all participants will be notified!`, {
          autoClose: 6000,
          position: 'top-center'
        });
      } else {
        toast.success(response.data.message);
      }
      
      fetchEventAndDiscussions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle announcement');
    }
  };

  const handleReaction = async (discussionId, type) => {
    try {
      await api.post(`/discussions/${discussionId}/reaction`, { type });
      fetchEventAndDiscussions(true); // Silent fetch
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add reaction');
    }
  };

  const getReactionCount = (discussion, type) => {
    return discussion.reactions?.filter(r => r.type === type).length || 0;
  };

  const hasUserReacted = (discussion, type) => {
    return discussion.reactions?.some(r => r.user._id === user._id && r.type === type) || false;
  };

  const isOrganizer = () => {
    if (!event || !user) {
      console.log('isOrganizer: No event or user', { event, user });
      return false;
    }
    
    // Check if user role is organizer
    if (user.role !== 'organizer') {
      console.log('isOrganizer: User is not an organizer, role:', user.role);
      return false;
    }
    
    // Check if this organizer owns this event
    const eventOrganizerId = typeof event.organizer === 'object' ? event.organizer._id : event.organizer;
    const userId = user._id;
    
    const isOwner = eventOrganizerId?.toString() === userId?.toString();
    console.log('isOrganizer check:', {
      eventOrganizerId,
      userId,
      isOwner,
      eventOrganizerType: typeof event.organizer,
      match: eventOrganizerId?.toString() === userId?.toString()
    });
    
    return isOwner;
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
            <p style={{ color: 'var(--text-muted)' }}>Ask questions and discuss with other participants</p>
          </div>
        )}

        {isRegistered && (
          <>
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
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No discussions yet. Be the first to start one!</p>
            </div>
          ) : (
            discussions.map(discussion => (
              <div 
                key={discussion._id} 
                className="card" 
                style={{ 
                  marginBottom: '20px', 
                  padding: '20px',
                  border: discussion.isPinned ? '2px solid var(--accent-cyan)' : undefined,
                  backgroundColor: discussion.isAnnouncement ? 'rgba(88, 166, 255, 0.05)' : undefined
                }}
              >
                {/* Badges */}
                {(discussion.isPinned || discussion.isAnnouncement) && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    {discussion.isPinned && (
                      <span style={{ 
                        backgroundColor: 'rgba(88, 166, 255, 0.2)',
                        color: 'var(--accent-cyan)',
                        padding: '4px 12px',
                        borderRadius: '15px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid var(--accent-cyan)'
                      }}>
                        📌 PINNED
                      </span>
                    )}
                    {discussion.isAnnouncement && (
                      <span style={{ 
                        backgroundColor: 'rgba(168, 85, 247, 0.2)',
                        color: 'var(--accent-purple)',
                        padding: '4px 12px',
                        borderRadius: '15px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid var(--accent-purple)'
                      }}>
                        📢 ANNOUNCEMENT
                      </span>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ marginBottom: '5px' }}>{discussion.title}</h3>
                    <small style={{ color: 'var(--text-muted)' }}>
                      Posted by {getUserDisplay(discussion.author)} • {new Date(discussion.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {isOrganizer() && (
                      <>
                        <button
                          onClick={() => handleTogglePin(discussion._id)}
                          className="btn btn-toggle"
                          style={{ 
                            fontSize: '12px', 
                            padding: '5px 10px',
                            backgroundColor: discussion.isPinned ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                            color: discussion.isPinned ? 'white' : 'var(--text-primary)',
                            border: '1px solid var(--border-default)'
                          }}
                        >
                          {discussion.isPinned ? '📌 Pinned' : '📌 Pin'}
                        </button>
                        <button
                          onClick={() => handleToggleAnnouncement(discussion._id)}
                          className="btn btn-toggle"
                          style={{ 
                            fontSize: '12px', 
                            padding: '5px 10px',
                            backgroundColor: discussion.isAnnouncement ? 'var(--accent-purple)' : 'var(--bg-elevated)',
                            color: discussion.isAnnouncement ? 'white' : 'var(--text-primary)',
                            border: '1px solid var(--border-default)'
                          }}
                        >
                          {discussion.isAnnouncement ? '📢 Announcement' : '📢 Announce'}
                        </button>
                      </>
                    )}
                    {(discussion.author._id === user._id || isOrganizer()) && (
                      <button
                        onClick={() => handleDeleteDiscussion(discussion._id)}
                        className="btn btn-danger"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                
                <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{discussion.content}</p>

                {/* Reactions */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '15px', 
                  paddingTop: '15px', 
                  borderTop: '1px solid var(--border-default)' 
                }}>
                  <button
                    onClick={() => handleReaction(discussion._id, 'like')}
                    className="btn btn-reaction"
                    style={{
                      fontSize: '14px',
                      padding: '6px 12px',
                      backgroundColor: hasUserReacted(discussion, 'like') ? 'rgba(88, 166, 255, 0.2)' : 'var(--bg-elevated)',
                      border: hasUserReacted(discussion, 'like') ? '1px solid var(--accent-cyan)' : '1px solid var(--border-default)',
                      color: hasUserReacted(discussion, 'like') ? 'var(--accent-cyan)' : 'var(--text-primary)'
                    }}
                  >
                    👍 Like {getReactionCount(discussion, 'like') > 0 && `(${getReactionCount(discussion, 'like')})`}
                  </button>
                  <button
                    onClick={() => handleReaction(discussion._id, 'helpful')}
                    className="btn btn-reaction"
                    style={{
                      fontSize: '14px',
                      padding: '6px 12px',
                      backgroundColor: hasUserReacted(discussion, 'helpful') ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-elevated)',
                      border: hasUserReacted(discussion, 'helpful') ? '1px solid #22c55e' : '1px solid var(--border-default)',
                      color: hasUserReacted(discussion, 'helpful') ? '#22c55e' : 'var(--text-primary)'
                    }}
                  >
                    ✅ Helpful {getReactionCount(discussion, 'helpful') > 0 && `(${getReactionCount(discussion, 'helpful')})`}
                  </button>
                  <button
                    onClick={() => handleReaction(discussion._id, 'question')}
                    className="btn btn-reaction"
                    style={{
                      fontSize: '14px',
                      padding: '6px 12px',
                      backgroundColor: hasUserReacted(discussion, 'question') ? 'rgba(251, 191, 36, 0.2)' : 'var(--bg-elevated)',
                      border: hasUserReacted(discussion, 'question') ? '1px solid #fbbf24' : '1px solid var(--border-default)',
                      color: hasUserReacted(discussion, 'question') ? '#fbbf24' : 'var(--text-primary)'
                    }}
                  >
                    ❓ Question {getReactionCount(discussion, 'question') > 0 && `(${getReactionCount(discussion, 'question')})`}
                  </button>
                </div>

                {/* Replies */}
                {discussion.replies.length > 0 && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-default)' }}>
                    <h4 style={{ marginBottom: '15px', fontSize: '16px' }}>Replies ({discussion.replies.length})</h4>
                    {discussion.replies.map((reply, index) => (
                      <div key={index} style={{ 
                        backgroundColor: 'var(--bg-elevated)', 
                        padding: '15px', 
                        borderRadius: '8px',
                        border: '1px solid var(--border-default)',
                        marginBottom: '10px' 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{getUserDisplay(reply.user)}</strong>
                          <small style={{ color: 'var(--text-muted)' }}>{new Date(reply.createdAt).toLocaleString()}</small>
                        </div>
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0, color: 'var(--text-primary)' }}>{reply.content}</p>
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
          </>
        )}
      </div>
    </Layout>
  );
};

export default EventDiscussions;

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const TeamChat = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    fetchTeamAndMessages();
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [teamId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTeamAndMessages = async () => {
    try {
      setLoading(true);
      
      // Fetch team details
      const teamResponse = await api.get(`/teams/${teamId}`);
      setTeam(teamResponse.data.team);

      // Fetch messages
      await fetchMessages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load chat');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (showError = true) => {
    try {
      const response = await api.get(`/chat/${teamId}/messages`);
      setMessages(response.data.messages);
    } catch (error) {
      if (showError) {
        toast.error(error.response?.data?.message || 'Failed to load messages');
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      return;
    }

    if (newMessage.length > 2000) {
      toast.error('Message is too long (max 2000 characters)');
      return;
    }

    setSending(true);
    try {
      const response = await api.post(`/chat/${teamId}/messages`, {
        content: newMessage.trim()
      });

      // Add the new message to the list
      setMessages([...messages, response.data.message]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await api.delete(`/chat/${teamId}/messages/${messageId}`);
      setMessages(messages.filter(m => m._id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading chat...</div>
      </Layout>
    );
  }

  const isTeamLeader = team.teamLeader._id === user._id;

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1>💬 Team Chat</h1>
            <p style={{ color: '#7f8c8d', marginTop: '5px' }}>
              {team.teamName} • {team.members.length}/{team.teamSize} members
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            ← Back to Team
          </button>
        </div>

        {/* Chat Container */}
        <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {/* Messages Area */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '20px', 
            backgroundColor: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {messages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#7f8c8d', 
                marginTop: '50px',
                padding: '40px'
              }}>
                <p style={{ fontSize: '3rem', marginBottom: '20px' }}>💬</p>
                <p style={{ fontSize: '1.1rem' }}>No messages yet</p>
                <p style={{ marginTop: '10px' }}>Start the conversation with your team!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwnMessage = message.sender._id === user._id;
                const showSenderName = index === 0 || 
                                     messages[index - 1].sender._id !== message.sender._id;

                return (
                  <div 
                    key={message._id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {showSenderName && (
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#7f8c8d',
                        marginBottom: '5px',
                        marginLeft: isOwnMessage ? '0' : '10px',
                        marginRight: isOwnMessage ? '10px' : '0'
                      }}>
                        {isOwnMessage ? 'You' : `${message.sender.firstName} ${message.sender.lastName}`}
                      </div>
                    )}
                    <div style={{
                      maxWidth: '70%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        backgroundColor: isOwnMessage ? '#3498db' : '#fff',
                        color: isOwnMessage ? '#fff' : '#2c3e50',
                        padding: '10px 15px',
                        borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        wordWrap: 'break-word',
                        position: 'relative'
                      }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          opacity: 0.7,
                          marginTop: '4px',
                          textAlign: 'right'
                        }}>
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                      {(isOwnMessage || isTeamLeader) && (
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#e74c3c',
                            cursor: 'pointer',
                            padding: '5px',
                            fontSize: '0.9rem',
                            opacity: 0.6,
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                          title="Delete message"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Area */}
          <form 
            onSubmit={handleSendMessage}
            style={{ 
              borderTop: '2px solid #e0e0e0', 
              padding: '20px',
              backgroundColor: '#fff'
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  disabled={sending}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: newMessage.length > 2000 ? '#e74c3c' : '#7f8c8d',
                  marginTop: '5px',
                  textAlign: 'right'
                }}>
                  {newMessage.length}/2000 characters
                  {newMessage.length > 2000 && ' (too long)'}
                </div>
              </div>
              <button
                type="submit"
                disabled={sending || !newMessage.trim() || newMessage.length > 2000}
                className="btn btn-primary"
                style={{
                  padding: '12px 30px',
                  fontSize: '1rem',
                  height: 'fit-content',
                  minWidth: '100px'
                }}
              >
                {sending ? 'Sending...' : '📤 Send'}
              </button>
            </div>
            <p style={{ 
              fontSize: '0.85rem', 
              color: '#7f8c8d', 
              marginTop: '10px',
              marginBottom: 0
            }}>
              💡 Tip: Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default TeamChat;

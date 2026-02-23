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
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchTeamAndMessages();
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(false);
      fetchTypingStatus();
      fetchOnlineMembers();
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
      const newMessages = response.data.messages;
      
      // Check for new messages and show notification
      if (previousMessageCount > 0 && newMessages.length > previousMessageCount) {
        const newMessageCount = newMessages.length - previousMessageCount;
        const latestMessage = newMessages[newMessages.length - 1];
        
        // Don't notify for own messages
        if (latestMessage.sender._id !== user._id) {
          toast.info(`💬 ${latestMessage.sender.firstName}: ${latestMessage.content.substring(0, 50)}${latestMessage.content.length > 50 ? '...' : ''}`, {
            position: 'top-right',
            autoClose: 4000
          });
        }
      }
      
      setPreviousMessageCount(newMessages.length);
      setMessages(newMessages);
    } catch (error) {
      if (showError) {
        toast.error(error.response?.data?.message || 'Failed to load messages');
      }
    }
  };

  const fetchTypingStatus = async () => {
    try {
      const response = await api.get(`/chat/${teamId}/typing`);
      setTypingUsers(response.data.typingUsers || []);
    } catch (error) {
      // Silently fail - typing status is not critical
    }
  };

  const sendTypingStatus = async (typing) => {
    try {
      await api.post(`/chat/${teamId}/typing`, { isTyping: typing });
    } catch (error) {
      // Silently fail
    }
  };

  const fetchOnlineMembers = async () => {
    try {
      const response = await api.get(`/chat/${teamId}/online`);
      setOnlineMembers(response.data.onlineMembers || []);
    } catch (error) {
      // Silently fail - online status is not critical
    }
  };

  const isUserOnline = (userId) => {
    return onlineMembers.some(m => m.userId === userId);
  };

  const renderMessageContent = (content) => {
    // Detect URLs in the message
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index}
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent-cyan)',
              textDecoration: 'underline',
              wordBreak: 'break-all'
            }}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
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
      
      // Clear typing status
      setIsTyping(false);
      sendTypingStatus(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
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
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .typing-dots {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        
        .typing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--text-muted);
          animation: typingDots 1.4s infinite;
        }
        
        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes typingDots {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1>💬 Team Chat</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
              {team.teamName} • {team.members.length}/{team.teamSize} members
              {onlineMembers.length > 0 && <span> • {onlineMembers.length} online</span>}
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
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {messages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--text-muted)', 
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
                        color: 'var(--text-muted)',
                        marginBottom: '5px',
                        marginLeft: isOwnMessage ? '0' : '10px',
                        marginRight: isOwnMessage ? '10px' : '0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>
                          {isOwnMessage ? 'You' : `${message.sender.firstName} ${message.sender.lastName}`}
                        </span>
                        {!isOwnMessage && isUserOnline(message.sender._id) && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            display: 'inline-block',
                            boxShadow: '0 0 4px #22c55e',
                            animation: 'pulse 2s ease-in-out infinite'
                          }} title="Online" />
                        )}
                      </div>
                    )}
                    <div style={{
                      maxWidth: '70%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        backgroundColor: isOwnMessage ? '#58a6ff' : 'var(--bg-elevated)',
                        color: isOwnMessage ? 'var(--text-inverse)' : 'var(--text-primary)',
                        padding: '10px 15px',
                        borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        border: isOwnMessage ? 'none' : '1px solid var(--border-default)',
                        wordWrap: 'break-word',
                        position: 'relative'
                      }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                          {renderMessageContent(message.content)}
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

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div style={{
              padding: '10px 20px',
              backgroundColor: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-default)',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className="typing-dots">
                  <span></span><span></span><span></span>
                </span>
                {typingUsers.length === 1 
                  ? `${typingUsers[0].firstName} is typing...`
                  : typingUsers.length === 2
                  ? `${typingUsers[0].firstName} and ${typingUsers[1].firstName} are typing...`
                  : `${typingUsers.length} people are typing...`}
              </span>
            </div>
          )}

          {/* Message Input Area */}
          <form 
            onSubmit={handleSendMessage}
            style={{ 
              borderTop: '2px solid var(--border-default)', 
              padding: '20px',
              backgroundColor: 'var(--bg-elevated)'
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    
                    // Typing indicator logic
                    if (!isTyping) {
                      setIsTyping(true);
                      sendTypingStatus(true);
                    }
                    
                    // Clear previous timeout
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                    
                    // Set new timeout to stop typing after 2 seconds of inactivity
                    typingTimeoutRef.current = setTimeout(() => {
                      setIsTyping(false);
                      sendTypingStatus(false);
                    }, 2000);
                  }}
                  placeholder="Type your message..."
                  rows={3}
                  disabled={sending}
                  className="form-input"
                  style={{
                    width: '100%',
                    resize: 'none',
                    minHeight: '80px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: newMessage.length > 2000 ? '#e74c3c' : 'var(--text-muted)',
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
              color: 'var(--text-muted)', 
              marginTop: '10px',
              marginBottom: 0
            }}>
              💡 Tip: Press Enter to send, Shift+Enter for new line • Paste links to share files/URLs
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default TeamChat;

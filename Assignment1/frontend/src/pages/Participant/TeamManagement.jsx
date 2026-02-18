import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';

const TeamManagement = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [teamSize, setTeamSize] = useState(2);
  const [inviteCode, setInviteCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  useEffect(() => {
    fetchEventAndTeam();
  }, [eventId]);

  const fetchEventAndTeam = async () => {
    try {
      const [eventRes, teamRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/teams/event/${eventId}/my-team`)
      ]);

      setEvent(eventRes.data.event);
      setTeam(teamRes.data.team);
      console.log('Team data loaded:', teamRes.data.team);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    try {
      const response = await api.post('/teams/create', {
        eventId,
        teamName: teamName.trim(),
        teamSize: parseInt(teamSize)
      });

      toast.success('Team created successfully!');
      setTeam(response.data.team);
      setTeamName('');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create team';
      toast.error(errorMsg);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    try {
      const response = await api.post(`/teams/join/${inviteCode.trim().toUpperCase()}`);
      toast.success(response.data.message);
      await fetchEventAndTeam();
      setInviteCode('');
      setShowJoinForm(false);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to join team';
      toast.error(errorMsg);
    }
  };

  const copyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      toast.success('Invite code copied to clipboard!');
    }
  };

  const shareInviteLink = () => {
    if (team?.inviteCode) {
      const inviteLink = `${window.location.origin}/team/join/${team.inviteCode}`;
      navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied to clipboard!');
    }
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

  if (!event || event.eventType !== 'team') {
    return (
      <Layout>
        <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <h2>Invalid Event</h2>
          <p>This event does not support team registration.</p>
          <button onClick={() => navigate('/participant/browse')} className="btn btn-primary">
            Browse Events
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container" style={{ padding: '40px 20px', maxWidth: '900px' }}>
        <button onClick={() => navigate(`/participant/events/${eventId}`)} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
          ← Back to Event
        </button>

        <div className="card" style={{ marginBottom: '30px', padding: '30px' }}>
          <h1 style={{ marginBottom: '10px' }}>{event.eventName}</h1>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>Team Registration</p>
          
          {event.teamDetails && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '5px' }}>
              <strong>Team Requirements:</strong>
              <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
                <li>Team size: {event.teamDetails.minTeamSize} - {event.teamDetails.maxTeamSize} members</li>
                <li>Registration fee per person: ₹{event.registrationFee}</li>
                <li>Registration closes: {new Date(event.registrationDeadline).toLocaleString()}</li>
              </ul>
            </div>
          )}
        </div>

        {!team ? (
          // No team yet - show create/join options
          <div>
            <div className="card" style={{ marginBottom: '20px', padding: '30px' }}>
              <h2 style={{ marginBottom: '20px' }}>Create a New Team</h2>
              <form onSubmit={handleCreateTeam}>
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">Team Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter your team name"
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">Team Size *</label>
                  <select
                    className="form-input"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                  >
                    {[...Array(event.teamDetails.maxTeamSize - event.teamDetails.minTeamSize + 1)].map((_, i) => {
                      const size = event.teamDetails.minTeamSize + i;
                      return <option key={size} value={size}>{size} members</option>;
                    })}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem' }}>
                  Create Team
                </button>
              </form>
            </div>

            <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '20px' }}>Join an Existing Team</h2>
              <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
                Have an invite code? Join your friend's team!
              </p>
              
              {!showJoinForm ? (
                <button 
                  onClick={() => setShowJoinForm(true)} 
                  className="btn btn-success"
                  style={{ fontSize: '1.1rem' }}
                >
                  Join Team
                </button>
              ) : (
                <form onSubmit={handleJoinTeam} style={{ maxWidth: '400px', margin: '0 auto' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Enter invite code (e.g., A1B2C3D4)"
                      style={{ textTransform: 'uppercase', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button type="submit" className="btn btn-success">
                      Join Team
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowJoinForm(false);
                        setInviteCode('');
                      }} 
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          // Has team - show team details
          <div className="card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h2 style={{ marginBottom: '5px' }}>{team.teamName}</h2>
                <span style={{ 
                  padding: '5px 15px', 
                  borderRadius: '20px', 
                  fontSize: '0.9rem',
                  backgroundColor: team.status === 'registered' ? '#d4edda' : team.status === 'complete' ? '#cce5ff' : '#fff3cd',
                  color: team.status === 'registered' ? '#155724' : team.status === 'complete' ? '#004085' : '#856404'
                }}>
                  {team.status === 'registered' ? '✓ Registered' : team.status === 'complete' ? '✓ Team Complete' : '⏳ Incomplete'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '1.5rem', color: '#3498db' }}>
                  {team.members?.length || team.currentMembers}/{team.teamSize}
                </div>
                <button 
                  onClick={() => navigate(`/teams/${team._id}/chat`)} 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  💬 Team Chat
                </button>
              </div>
            </div>

            {team.status === 'incomplete' && (
              <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffc107' }}>
                <strong>⚠️ Team Incomplete</strong>
                <p style={{ marginTop: '10px', marginBottom: '15px' }}>
                  Share the invite code below with your teammates. Registration will be completed automatically when all members join.
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label className="form-label" style={{ marginBottom: '5px' }}>Invite Code:</label>
                    <div style={{ 
                      padding: '15px', 
                      backgroundColor: 'white', 
                      borderRadius: '5px', 
                      border: '2px dashed #3498db',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      letterSpacing: '3px',
                      color: '#3498db'
                    }}>
                      {team.inviteCode}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={copyInviteCode} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                      📋 Copy Code
                    </button>
                    <button onClick={shareInviteLink} className="btn btn-success" style={{ whiteSpace: 'nowrap' }}>
                      🔗 Copy Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {team.status === 'complete' && !team.registrationId && (
              <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#cce5ff', borderRadius: '5px', border: '1px solid #007bff' }}>
                <strong>🎉 Team Complete!</strong>
                <p style={{ marginTop: '10px' }}>
                  Registration is being processed. You will receive your tickets via email shortly.
                </p>
              </div>
            )}

            {team.status === 'registered' && (
              <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#d4edda', borderRadius: '5px', border: '1px solid #28a745' }}>
                <strong>✅ Registration Complete!</strong>
                <p style={{ marginTop: '10px' }}>
                  All team members have been sent their tickets via email. Check your participation history for ticket details.
                </p>
                <button 
                  onClick={() => navigate('/participant/dashboard')} 
                  className="btn btn-success"
                  style={{ marginTop: '15px' }}
                >
                  View My Tickets
                </button>
              </div>
            )}

            <h3 style={{ marginBottom: '15px' }}>Team Members</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {team.members && team.members.map((member, index) => (
                <div 
                  key={index}
                  style={{ 
                    padding: '15px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '5px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong>{member.name}</strong>
                    {index === 0 && <span style={{ marginLeft: '10px', color: '#3498db', fontSize: '0.9rem' }}>👑 Leader</span>}
                    <br />
                    <small style={{ color: '#7f8c8d' }}>{member.email}</small>
                  </div>
                  <small style={{ color: '#95a5a6' }}>
                    Joined: {new Date(member.joinedAt).toLocaleDateString()}
                  </small>
                </div>
              ))}
              
              {/* Show placeholders for empty slots */}
              {team.members && [...Array(team.teamSize - team.members.length)].map((_, i) => (
                <div 
                  key={`empty-${i}`}
                  style={{ 
                    padding: '15px', 
                    backgroundColor: '#ecf0f1', 
                    borderRadius: '5px',
                    border: '2px dashed #bdc3c7',
                    textAlign: 'center',
                    color: '#95a5a6'
                  }}
                >
                  Waiting for member {team.members.length + i + 1}...
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeamManagement;

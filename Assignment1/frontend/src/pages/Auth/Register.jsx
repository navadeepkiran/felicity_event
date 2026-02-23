import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    participantType: 'iiit',
    collegeName: 'IIIT Hyderabad',
    contactNumber: '',
    interests: [],
    followedClubs: []
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableClubs, setAvailableClubs] = useState([]);

  const interestOptions = [
    'Technology', 'Cultural', 'Sports', 'Music', 'Dance', 
    'Drama', 'Art', 'Photography', 'Gaming', 'Hackathon'
  ];

  useEffect(() => {
    // Fetch available clubs for onboarding
    const fetchClubs = async () => {
      try {
        const response = await api.get('/events/clubs/public');
        setAvailableClubs(response.data.clubs || []);
      } catch (error) {
        // Silent fail - clubs selection is optional
        console.log('Could not fetch clubs for registration');
      }
    };
    fetchClubs();
  }, []);

  const handleChange = (e) => {
    setErrorMessage('');
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'interests') {
      setFormData(prev => ({
        ...prev,
        interests: checked 
          ? [...prev.interests, value]
          : prev.interests.filter(i => i !== value)
      }));
    } else if (type === 'checkbox' && name === 'followedClubs') {
      setFormData(prev => ({
        ...prev,
        followedClubs: checked 
          ? [...prev.followedClubs, value]
          : prev.followedClubs.filter(id => id !== value)
      }));
    } else if (name === 'contactNumber') {
      // Only allow digits and max 10 characters
      const numericValue = value.replace(/\\D/g, '').slice(0, 10);
      setFormData({
        ...formData,
        [name]: numericValue
      });
    } else if (name === 'participantType' && value === 'iiit') {
      // Set default college name for IIIT students
      setFormData({
        ...formData,
        [name]: value,
        collegeName: 'IIIT Hyderabad'
      });
    } else if (name === 'participantType' && value === 'non-iiit') {
      // Clear college name for non-IIIT to let them enter manually
      setFormData({
        ...formData,
        [name]: value,
        collegeName: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    if (formData.contactNumber.length !== 10) {
      setErrorMessage('Contact number must be exactly 10 digits');
      return;
    }

    if (formData.participantType === 'non-iiit' && !formData.collegeName.trim()) {
      setErrorMessage('College name is required for non-IIIT participants');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registrationData } = formData;
    
    // Set default college for IIIT students if not provided
    if (registrationData.participantType === 'iiit' && !registrationData.collegeName) {
      registrationData.collegeName = 'IIIT Hyderabad';
    }
    
    const result = await register(registrationData);

    if (result.success) {
      toast.success('Registration successful!');
      navigate('/dashboard');
    } else {
      let errorMsg = result.message || 'Registration failed. Please try again.';
      if (result.errors && result.errors.length > 0) {
        errorMsg = result.errors.map(err => err.msg).join(', ');
      }
      setErrorMessage(errorMsg);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <div className="auth-header">
          <h1>Join Felicity</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
            />
            {formData.participantType === 'iiit' && (
              <small style={{ color: '#7f8c8d' }}>Use your IIIT email (@students.iiit.ac.in, @research.iiit.ac.in, or @iiit.ac.in)</small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Participant Type</label>
            <select
              name="participantType"
              className="form-input"
              value={formData.participantType}
              onChange={handleChange}
              required
            >
              <option value="iiit">IIIT Student</option>
              <option value="non-iiit">Non-IIIT Participant</option>
            </select>
          </div>

          {formData.participantType === 'non-iiit' && (
            <div className="form-group">
              <label className="form-label">College/Organization</label>
              <input
                type="text"
                name="collegeName"
                className="form-input"
                value={formData.collegeName}
                onChange={handleChange}
                required
                placeholder="Enter your college or organization name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              className="form-input"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              minLength="10"
              maxLength="10"
              placeholder="10-digit mobile number"
            />
            <small style={{ color: '#7f8c8d' }}>Enter exactly 10 digits</small>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Interests (Optional)</label>
            <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '10px' }}>
              Select your interests to get personalized event recommendations
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {interestOptions.map(interest => (
                <label key={interest} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="interests"
                    value={interest}
                    checked={formData.interests.includes(interest)}
                    onChange={handleChange}
                    style={{ marginRight: '8px' }}
                  />
                  {interest}
                </label>
              ))}
            </div>
          </div>

          {availableClubs.length > 0 && (
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Follow Clubs (Optional)</label>
              <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '10px' }}>
                Follow clubs to see their events first
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '10px',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '10px',
                border: '1px solid #34495e',
                borderRadius: '8px',
                backgroundColor: 'rgba(52, 73, 94, 0.3)'
              }}>
                {availableClubs.map(club => (
                  <label key={club._id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="followedClubs"
                      value={club._id}
                      checked={formData.followedClubs.includes(club._id)}
                      onChange={handleChange}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>{club.organizerName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div style={{ 
              color: '#e74c3c', 
              backgroundColor: '#fadbd8', 
              padding: '12px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              fontSize: '14px',
              border: '1px solid #e74c3c'
            }}>
              {errorMessage}
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const recaptchaRef = useRef();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setErrorMessage('');
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!captchaToken) {
      setErrorMessage('Please complete the reCAPTCHA verification');
      return;
    }
    
    setLoading(true);

    const result = await login(formData.email, formData.password, captchaToken);

    if (result.success) {
      toast.success('Login successful!');
      // Redirect based on role
      if (result.user.role === 'participant') {
        navigate('/dashboard');
      } else if (result.user.role === 'organizer') {
        navigate('/organizer/dashboard');
      } else if (result.user.role === 'admin') {
        navigate('/admin/dashboard');
      }
    } else {
      // Show inline error message
      setErrorMessage(result.message || 'Invalid email or password. Please try again.');
      
      // Reset captcha on error
      setCaptchaToken(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome to Felicity</h1>
          <p>Login to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
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
              placeholder="Enter your password"
            />
          </div>

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

          <div className="form-group" style={{ display: 'flex', justifyContent: 'center' }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  const getNavLinks = () => {
    if (!user) return null;

    switch (user.role) {
      case 'participant':
        return (
          <>
            <li><Link to="/dashboard" className="navbar-link">Dashboard</Link></li>
            <li><Link to="/events" className="navbar-link">Browse Events</Link></li>
            <li><Link to="/clubs" className="navbar-link">Clubs</Link></li>
            <li><Link to="/profile" className="navbar-link">Profile</Link></li>
          </>
        );
      case 'organizer':
        return (
          <>
            <li><Link to="/organizer/dashboard" className="navbar-link">Dashboard</Link></li>
            <li><Link to="/organizer/create-event" className="navbar-link">Create Event</Link></li>
            <li><Link to="/organizer/profile" className="navbar-link">Profile</Link></li>
          </>
        );
      case 'admin':
        return (
          <>
            <li><Link to="/admin/dashboard" className="navbar-link">Dashboard</Link></li>
            <li><Link to="/admin/clubs" className="navbar-link">Manage Clubs</Link></li>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          Felicity Events
        </Link>
        <ul className="navbar-menu">
          {getNavLinks()}
          {user && (
            <li>
              <button onClick={logout} className="navbar-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                Logout
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

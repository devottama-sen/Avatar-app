// src/components/Navbar.jsx (or Navbar.js) - Ensure you are using this structure
import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import '../assets/styles/Navbar.css';

const Navbar = ({ isLoggedIn, onLogout }) => {
  const history = useHistory();

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    history.push('/login');
  };

  return (
    <nav className="navbar">
      {/* Center Section: All Main Navigation Links */}
      <div className="navbar-center">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/user-profile" className="nav-link">User Profile</Link>
        <Link to="/avatar-details" className="nav-link">Avatar Details</Link>
        <Link to="/avatars" className="nav-link">Avatar History</Link> {/* Make sure this matches your route */}
      </div>

      {/* Right Section: Logout Button */}
      <div className="navbar-right">
        {isLoggedIn && (
          <button className="nav-logout-btn" onClick={handleLogoutClick}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

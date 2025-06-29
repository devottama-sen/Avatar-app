import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/">Home</Link>
      <Link to="/login">Login</Link>
      <Link to="/user-profile">User Profile</Link>
      <Link to="/avatar-details">Avatar Details</Link>
      <Link to="/all-avatars">Avatar History</Link> 
    </nav>
  );
};

export default Navbar;

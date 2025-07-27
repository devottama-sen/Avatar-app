// src/components/Footer.jsx
import React from 'react';
import '../assets/styles/Footer.css'; // You'll create this CSS file

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="main-footer">
      <p>&copy; {currentYear} Your Company Name. All rights reserved.</p>
      {/* You can add more links or info here later */}
    </footer>
  );
};

export default Footer;
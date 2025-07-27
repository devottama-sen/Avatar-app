import React from 'react';
import '../assets/styles/Footer.css'; // Ensure this path is correct

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="main-footer">
      <p>
        &copy; {currentYear} I3D Lab, IISc, Bangalore. All rights reserved.
        <span className="footer-line-separator"> | </span> {/* Separator line */}
        <span className="footer-created-by">Created By: Devottama Sen</span>
        <span className="footer-line-separator"> | </span> {/* Separator line */}
        <span className="footer-mentored-by">Mentored By: Prof. Pradipta Biswas</span> {/* Using a new class for mentors */}
      </p>
    </footer>
  );
};

export default Footer;
import React from 'react';
import '../assets/styles/Footer.css'; // Ensure this path is correct

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="main-footer">
      <p>
        &copy; {currentYear} I3D Lab, IISc, Bangalore. All rights reserved.
      </p>
      <p>
        Created By: Devottama Sen
      </p>
      <p>
        Mentored By: Prof. Pradipta Biswas
      </p>
    </footer>
  );
};

export default Footer;
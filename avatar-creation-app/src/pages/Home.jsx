import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/Home.css';

// Modal component to display project information
const AboutModal = ({ onClose, children }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                {children}
            </div>
        </div>
    );
};

const Home = ({ isLoggedIn, username }) => { 
    const [displayUserName, setDisplayUserName] = useState('');
    const [showModal, setShowModal] = useState(false); // State to control modal visibility

    useEffect(() => {
        if (isLoggedIn && username) {
            setDisplayUserName(username);
        } else {
            const storedLoggedIn = localStorage.getItem("isLoggedIn") === "true";
            const storedUserId = localStorage.getItem("user_id");

            if (storedLoggedIn && storedUserId) {
                setDisplayUserName(storedUserId);
            } else {
                setDisplayUserName('');
            }
        }
    }, [isLoggedIn, username]);

    // Handlers for modal
    const handleModalOpen = () => setShowModal(true);
    const handleModalClose = () => setShowModal(false);

    return (
        <div className="home-body">
            <main className="main-content fade-in">
                <div className="text-box">
                    
                    {/* ✅ Info icon moved to the top-right corner */}
                    <div className="info-button-container">
                        <svg
                            className="info-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            onClick={handleModalOpen}
                            aria-label="About Project Information"
                        >
                            <title>About Project</title>
                            <path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v72h24c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-144c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z"/>
                        </svg>
                    </div>

                    {/* Main heading and intro text */}
                    <h1 className="home-heading">
                        {displayUserName ? `Welcome, ${displayUserName}` : "Welcome to Avatar Creation"}
                    </h1>
                    <p className="intro-text">
                        Create your colleagues into their <italic><b>virtual</b></italic> selves
                    </p>

                    {/* Conditional "Continue" or "Create" button */}
                    {displayUserName ? (
                        <Link to="/avatar-details" className="start-button">Continue</Link>
                    ) : (
                        <Link to="/login" className="start-button">Create</Link>
                    )}
                </div>
            </main>

            {/* Modal for About Project */}
            {showModal && (
                <AboutModal onClose={handleModalClose}>
                    <h2 className="modal-title">About the Project</h2>
                    <p className="modal-text">
                        This study aims to investigate subjective perception of people in terms of 
                        demography of their office colleagues. We request you to generate avatars that 
                        can realistically represent your existing office colleagues. Results from the 
                        study will be used to make a VR digital twin of office spaces, and your personal 
                        identity will never be revealed.
                    </p>
                </AboutModal>
            )}
        </div>
    );
};

export default Home;

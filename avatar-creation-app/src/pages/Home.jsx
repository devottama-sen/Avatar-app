// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link /*, useHistory */ } from 'react-router-dom'; // No need for useHistory if no local logout
import '../assets/styles/Home.css';

// The Home component now relies on App.js to manage isLoggedIn and username via props
const Home = ({ isLoggedIn, username }) => { // Accept props from App.js
    // We can simplify the state and useEffect now,
    // as App.js is the source of truth for isLoggedIn and username
    // However, if you want Home to still be self-sufficient for username
    // in case it's loaded directly, you can keep the useEffect.
    // Let's keep the useEffect for robustness if `username` from props isn't always reliable.
    const [displayUserName, setDisplayUserName] = useState(''); // Use a distinct name to avoid confusion with prop
    // const history = useHistory(); // No longer needed if local handleLogout is removed

    useEffect(() => {
        // Prefer the prop `username` if available, otherwise check localStorage
        if (isLoggedIn && username) { // Use the props passed from App.js
            setDisplayUserName(username);
        } else {
            // Fallback to localStorage if props aren't fully populated yet (less ideal, but robust)
            const storedLoggedIn = localStorage.getItem("isLoggedIn") === "true";
            const storedUserId = localStorage.getItem("user_id");

            if (storedLoggedIn && storedUserId) {
                setDisplayUserName(storedUserId);
            } else {
                setDisplayUserName('');
            }
        }
    }, [isLoggedIn, username]); // Re-run effect if isLoggedIn or username props change

    // --- REMOVE THE handleLogout FUNCTION AND ITS BUTTON FROM HERE ---
    // const handleLogout = () => {
    //   localStorage.removeItem("isLoggedIn");
    //   localStorage.removeItem("user_id"); // Also remove user_id from localStorage
    //   setUserName(''); // No longer userName, but setDisplayUserName
    //   history.push('/'); // This would be handled by Navbar's logout
    // };
    // --- END REMOVAL ---

    return (
        <div className="home-body">
            <main className="main-content fade-in">
                <div className="text-box">
                    <h1 className="home-heading">
                        {displayUserName ? `Welcome, ${displayUserName}` : "Welcome to Avatar Creation"}
                    </h1>
                    <p className="intro-text">
                        Create your colleagues into their <italic><b>virtual</b></italic> selves
                    </p>

                    {/* Conditional buttons - only show "Continue" if logged in, otherwise "Create" (for login) */}
                    {displayUserName ? ( // Using displayUserName to determine if logged in
                        <>
                            <Link to="/avatar-details" className="start-button">Continue</Link>
                            {/* --- REMOVED THE LOGOUT BUTTON HERE --- */}
                            {/* <button onClick={handleLogout} className="logout-button">Logout</button> */}
                        </>
                    ) : (
                        <Link to="/login" className="start-button">Create</Link>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Home;
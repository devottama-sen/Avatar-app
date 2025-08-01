import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/Home.css';

const Home = ({ isLoggedIn, username }) => { 
    const [displayUserName, setDisplayUserName] = useState('');

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

    return (
        <div className="home-body">
            <main className="main-content fade-in">
                <div className="text-box">

                    {/* ✅ Main heading */}
                    <h1 className="home-heading">
                        {displayUserName ? `Welcome, ${displayUserName}` : "Welcome to Avatar Creation"}
                    </h1>

                    {/* ✅ Combined intro + about info */}
                    <p className="intro-text">
                        This study aims to investigate how people perceive the demography of their office colleagues. 
                        We request you to generate avatars that can realistically represent your colleagues. 
                        Results from the study will help create VR digital twins of office spaces — your personal identity will never be revealed.
                        <br/> <br/> Create your colleagues into their <b><i>virtual</i></b> selves. <br/> 
                    </p>

                    {/* ✅ Conditional "Continue" or "Create" button */}
                    {displayUserName ? (
                        <Link to="/avatar-details" className="start-button">Continue</Link>
                    ) : (
                        <Link to="/login" className="start-button">Create</Link>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Home;

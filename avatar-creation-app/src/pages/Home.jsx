import React, { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import '../assets/styles/Home.css';

const Home = () => {
  const [userName, setUserName] = useState('');
  const history = useHistory();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const name = localStorage.getItem("user_id");

    if (isLoggedIn === "true" && name) {
      setUserName(name);
    } else {
      setUserName('');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setUserName('');
    history.push('/');
  };

  return (
    <div className="home-body">
      <main className="main-content fade-in">
        <h1 className="home-heading">
          {userName ? `Welcome, ${userName}` : "Welcome to Avatar Creation"}
        </h1>
        <p className="intro-text">Create your colleagues into their <b>virtual</b> selves</p>

        {userName ? (
          <>
            <Link to="/avatar-details" className="start-button">Continue</Link>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </>
        ) : (
          <Link to="/login" className="start-button">Create</Link>
        )}
      </main>
    </div>
  );
};

export default Home;

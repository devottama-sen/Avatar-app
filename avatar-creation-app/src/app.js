import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import './assets/styles/UserProfile.css';
import './assets/styles/App.css';

// Import your page components
import Home from './pages/Home';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import UserProfile from './pages/UserProfile';
import AvatarDetails from './pages/AvatarDetails';
import AllAvatarsPage from './pages/AllAvatarsPage';
import Navbar from './pages/Navbar'; // Corrected import path for Navbar if it's in components folder
import Footer from './pages/Footer';
import ErrorBoundary from './pages/ErrorBoundary';

// PrivateRoute component to protect routes
const PrivateRoute = ({ component: Component, ...rest }) => {
  // Use localStorage.getItem("user_id") as the primary login check for consistency with Home.jsx
  const isLoggedIn = !!localStorage.getItem("user_id"); 
  return (
    <Route
      {...rest}
      render={(props) =>
        isLoggedIn ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(''); // State to store the username for display

  // Effect to check login status and username from localStorage on component mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const storedUserId = localStorage.getItem("user_id");
      // Assuming "isLoggedIn" in localStorage is explicitly set to "true" or similar by your login process
      const storedIsLoggedInFlag = localStorage.getItem("isLoggedIn") === "true"; 

      if (storedUserId && storedIsLoggedInFlag) {
        setIsLoggedIn(true);
        setUsername(storedUserId); // Assuming user_id is the displayable username
      } else {
        setIsLoggedIn(false);
        setUsername('');
      }
    };

    checkAuthStatus(); // Initial check

    // Listen for storage changes to keep login status in sync across tabs/windows
    window.addEventListener('storage', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  // Function to handle login success
  // This should be called by your Login component when authentication is successful
  const handleLoginSuccess = (loggedInUserId) => { // Expects the user ID/name from login
    localStorage.setItem("user_id", loggedInUserId); // Store user ID
    localStorage.setItem("isLoggedIn", "true"); // Store login flag
    setIsLoggedIn(true);
    setUsername(loggedInUserId);
    // Login component should handle redirecting to Home or dashboard after this call
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    setUsername('');
    // The Navbar component's handleLogoutClick will perform the redirect to /login
  };

  return (
    <Router>
      <div className="app-container">
        {/* Pass isLoggedIn state and handleLogout function to Navbar */}
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <main className="content-wrap">
          <ErrorBoundary>
            <Switch>
              {/* Pass username to Home component */}
              <Route exact path="/" render={(props) => <Home {...props} isLoggedIn={isLoggedIn} username={username} />} />
              {/* Pass handleLoginSuccess to Login component */}
              <Route path="/login" render={(props) => <Login {...props} onLoginSuccess={handleLoginSuccess} />} />
              <Route path="/reset-password" component={ResetPassword} />
              <Route path="/user-profile" component={UserProfile} />
              {/* PrivateRoute uses localStorage directly for simplicity here */}
              <PrivateRoute path="/avatar-details" component={AvatarDetails} /> 
              <Route path="/avatars" component={AllAvatarsPage} />
              <Route path="*" render={() => <h2>404 - Page not found</h2>} />
            </Switch>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
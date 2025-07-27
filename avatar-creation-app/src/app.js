import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import './assets/styles/UserProfile.css'; 
import './assets/styles/App.css'; // <-- Ensure this is correctly importing your App.css

import Home from './pages/Home';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import UserProfile from './pages/UserProfile';
import AvatarDetails from './pages/AvatarDetails';
import AllAvatarsPage from './pages/AllAvatarsPage';
import Navbar from './pages/Navbar';
import Footer from './pages/Footer'; // Importing Footer component
import ErrorBoundary from './pages/ErrorBoundary';

const PrivateRoute = ({ component: Component, ...rest }) => {
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
  return (
    <Router>
      {/* This is the key container for the sticky footer layout */}
      <div className="app-container">
        <Navbar />
        {/* This main content area will expand to push the footer down */}
        <main className="content-wrap">
          <ErrorBoundary>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route path="/login" component={Login} />
              <Route path="/reset-password" component={ResetPassword} />
              <Route path="/user-profile" component={UserProfile} />
              <PrivateRoute path="/avatar-details" component={AvatarDetails} />
              <Route path="/avatars" component={AllAvatarsPage} />
              <Route path="*" render={() => <h2>404 - Page not found</h2>} />
            </Switch>
          </ErrorBoundary>
        </main>
        <Footer /> {/* Footer is always at the end of the app-container */}
      </div>
    </Router>
  );
}

export default App;
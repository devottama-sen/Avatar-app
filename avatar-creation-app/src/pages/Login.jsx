import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import '../assets/styles/Login.css';

// Accept onLoginSuccess as a prop
const Login = ({ onLoginSuccess }) => {
  const history = useHistory();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    const storedName = localStorage.getItem("user_id");
    const storedPassword = localStorage.getItem("user_password");

    if (name === storedName && password === storedPassword) {
      // *** REMOVE this line as it's redundant if user_id is the primary login indicator ***
      // localStorage.setItem("isLoggedIn", "true"); 
      
      // Call onLoginSuccess and PASS THE USERNAME (which is 'name' in this component)
      if (onLoginSuccess) {
        onLoginSuccess(name); // <--- CHANGE IS HERE: Pass 'name' as the argument
      }

      history.push('/avatar-details');
    } else {
      alert("Invalid name or password. Please register.");
    }
  };

  const goToRegister = () => {
    history.push('/user-profile');
  };

  const handleForgotPassword = () => {
    history.push('/reset-password');
  };

  return (
    <div className="login-container">
      <h1>Login</h1>

      <div className="login-form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="login-form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <p className="forgot-password" onClick={handleForgotPassword}>
        Forgot Password?
      </p>

      <button className="login-button" onClick={handleLogin}>
        Login
      </button>

      <button className="register-button" onClick={goToRegister}>
        Register
      </button>
    </div>
  );
};

export default Login;
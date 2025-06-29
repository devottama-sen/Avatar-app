import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import '../assets/styles/Login.css';

const Login = () => {
  const history = useHistory();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    const storedName = localStorage.getItem("user_id");
    const storedPassword = localStorage.getItem("user_password");

    if (name === storedName && password === storedPassword) {
      localStorage.setItem("isLoggedIn", "true"); 
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

      <input
        type="text"
        placeholder="Enter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <p className="forgot-password" onClick={handleForgotPassword}>
        Forgot Password?
      </p>

      <button onClick={handleLogin}>Login</button>

      <button onClick={goToRegister} className="register-button">
        Register
      </button>
    </div>
  );
};

export default Login;

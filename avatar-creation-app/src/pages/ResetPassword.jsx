import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import '../assets/styles/ResetPassword.css';


const ResetPassword = () => {
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const history = useHistory();

  const handleReset = () => {
    const storedName = localStorage.getItem("user_id");
    if (name === storedName) {
      localStorage.setItem("user_password", newPassword);
      alert("Password reset successful.");
      history.push("/login");
    } else {
      alert("Name not found. Please register.");
    }
  };

  return (
    <div className="login-container">
      <h1>Reset Password</h1>
      <input
        type="text"
        placeholder="Enter Registered Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="password"
        placeholder="Enter New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={handleReset}>Reset Password</button>
    </div>
  );
};

export default ResetPassword;

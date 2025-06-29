import React, { useEffect, useState } from 'react';
import '../assets/styles/AllAvatarsPage.css';

const AllAvatarsPage = () => {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (!storedUserId) {
      setError('User ID not found. Please complete your profile.');
      setLoading(false);
      return;
    }
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    fetch(`http://localhost:8000/avatars?userId=${userId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Fetched avatars:", data);
        if (data.length > 0) {
          console.log("Sample base64:", data[0].image_base64.slice(0, 50));
        }
        setAvatars(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch avatars:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p>Loading user avatars...</p>;
  if (error) return <p>Error loading avatars: {error}</p>;
  if (avatars.length === 0) return <p>No avatars found for this user.</p>;

  return (
    <div className="page-container">
      <h1 className="page-title">Avatar History for User: {userId}</h1>
      <div className="avatar-gallery">
        {avatars.map((avatar, index) => (
          <div key={index} className="avatar-card">
            <img
              src={`data:image/png;base64,${avatar.image_base64}`}
              alt={`Avatar of ${avatar.user_id}`}
              className="avatar-image"
            />
            <div className="avatar-info">
              <p><strong>Name:</strong> {avatar.user_id}</p>
              <p><strong>Country:</strong> {avatar.country}</p>
              <p><strong>Prompt:</strong> {avatar.prompt}</p>
              <p><strong>Generated At:</strong> {new Date(avatar.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllAvatarsPage;

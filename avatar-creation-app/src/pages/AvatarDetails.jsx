import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import '../assets/styles/AvatarUnified.css';
import BASE_URL from '../api'; // ✅ Importing from shared config

const AvatarDetails = () => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [country, setCountry] = useState('');
  const [remaining, setRemaining] = useState(undefined);
  const history = useHistory();

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const storedCountry = localStorage.getItem('country');

    if (!storedUserId) {
      setError('User ID missing. Please complete your profile.');
      setTimeout(() => history.push('/user-profile'), 3000);
      return;
    }

    setUserId(storedUserId);

    fetch(`${BASE_URL}/avatar-count?userId=${storedUserId}`)
      .then(res => res.json())
      .then(data => setRemaining(data.remaining))
      .catch(err => {
        console.error('Error fetching avatar count:', err);
        setRemaining(null);
      });

    if (storedCountry) {
      setCountry(storedCountry);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const locationData = await res.json();
            const detectedCountry = locationData.countryName;
            if (detectedCountry) {
              setCountry(detectedCountry);
              localStorage.setItem('country', detectedCountry);
            }
          } catch (err) {
            console.error('Location fetch failed:', err);
          }
        },
        (err) => {
          console.warn('Geolocation error:', err);
        }
      );
    }
  }, [history]);

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!userId || !prompt.trim()) {
      setError('Please enter all required fields.');
      return;
    }

    if (remaining <= 0) {
      setError('You’ve reached your 10-image limit.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/store-user-avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          country: country || 'unknown',
          prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate avatar.');
      }

      const data = await response.json();
      console.log("Full response from backend:", data);
       setImageBase64(`data:image/png;base64,${data.image}`);
      setRemaining(prev => (prev !== undefined ? prev - 1 : 0));
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setImageBase64(null);
    setError('');
  };

  return (
    <div className="avatar-body">
      <div className="avatar-wrapper">
        <div className="avatar-form-section">
          <h1 className="avatar-details-heading"><em>Avatar Prompt</em></h1>
          <p className="avatar-details-text"><em>Describe your colleagues and let AI create it.</em></p>
          <p className="avatar-details-text"><em>Please add the world <b><strong>realistic</strong></b> to your prompt</em></p>

          {remaining !== undefined && (
            <p className="avatar-limit-message">
              {remaining > 0
                ? `You have ${remaining} out of 10 avatars remaining.`
                : "You’ve reached your 10-image limit."}
            </p>
          )}

          <form className="avatar-form" onSubmit={handleGenerate}>
            <div className="form-group">
              <textarea
                id="prompt"
                name="prompt"
                rows={4}
                placeholder="e.g., A realistic depiction of a tall man with short curly brown hair, a trimmed beard, and a warm smile, dressed in a grey suit and blue tie"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="button-group">
              <button
                type="submit"
                className="generate-button"
                disabled={loading || !prompt.trim() || (remaining !== undefined && remaining <= 0)}
              >
                {loading ? 'Generating...' : 'Generate Avatar'}
              </button>

              <button
                type="button"
                className="reset-button"
                onClick={handleReset}
                disabled={loading && !imageBase64}
              >
                Reset
              </button>
            </div>
          </form>

          {error && <p className="error-text">{error}</p>}
        </div>

        {imageBase64 && (
          <div className="avatar-display-section">
            <h2>Your Avatar</h2>
            <div className="avatar-container">
              <img src={imageBase64} alt="Generated Avatar" className="generated-avatar" />
            </div>
          </div>
        )}

        <button type="button" onClick={() => history.push('/avatars')}>
          Show All Generated Avatars
        </button>
      </div>
    </div>
  );
};

export default AvatarDetails;

import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import '../assets/styles/App.css';
import '../assets/styles/AvatarUnified.css';
import BASE_URL from '../api';

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

    const storedUserId = localStorage.getItem('user_id');
    const storedPassword = localStorage.getItem('user_password');
    const storedGender = localStorage.getItem('gender');
    const storedEthnicity = localStorage.getItem('ethnicity');
    const storedOccupation = localStorage.getItem('occupation');
    const storedCountryOfOrigin = localStorage.getItem('countryOfOrigin');
    const storedCountryOfOccupation = localStorage.getItem('countryOfOccupation');
    const storedCountry = localStorage.getItem('country');

    // Correctly handle age from local storage, ensuring it's always a list of strings
    let storedAge;
    try {
      const ageString = localStorage.getItem('age');
      storedAge = JSON.parse(ageString);
      // Ensure it's an array, otherwise wrap it
      if (!Array.isArray(storedAge)) {
        storedAge = storedAge ? [storedAge] : [];
      }
    } catch (e) {
      console.error("Error parsing 'age' from localStorage:", e);
      storedAge = [];
    }

    // Correctly handle languages from local storage, ensuring it's a list of strings
    let storedLanguages;
    try {
      const languagesString = localStorage.getItem('languages');
      storedLanguages = JSON.parse(languagesString);
      if (!Array.isArray(storedLanguages)) {
        storedLanguages = storedLanguages ? [storedLanguages] : [];
      }
    } catch (e) {
      console.error("Error parsing 'languages' from localStorage:", e);
      storedLanguages = [];
    }

    if (!storedUserId || !prompt.trim() || !storedPassword || !storedAge || !storedGender || !storedEthnicity || !storedOccupation || !storedCountryOfOrigin || !storedCountryOfOccupation || !storedLanguages) {
      setError('User profile data is incomplete. Please go back to your profile and fill in all details.');
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
          user_id: storedUserId,
          user_password: storedPassword,
          prompt: prompt,
          country: storedCountry || 'unknown',
          age: storedAge,
          gender: storedGender,
          ethnicity: storedEthnicity,
          occupation: storedOccupation,
          countryOfOrigin: storedCountryOfOrigin,
          countryOfOccupation: storedCountryOfOccupation,
          languages: storedLanguages,
        }),
      });

      if (!response.ok) {
        let errorText = await response.text();
        let errorMessage = 'Failed to generate avatar. Please check backend logs.';
        try {
          const errorData = JSON.parse(errorText);
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join('; ');
          }
        } catch (e) {
          console.error('Non-JSON error response from server:', errorText);
          errorMessage = `Server error: ${response.status} - ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
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
          <p className="avatar-details-text"><em>Please add the word <strong>realistic</strong> to your prompt</em></p>

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

            <div className="show-all-wrapper">
              <button
                type="button"
                className="view-all-button"
                onClick={() => history.push('/avatars')}
              >
                Show All Generated Avatars
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
      </div>
    </div>
  );
};

export default AvatarDetails;
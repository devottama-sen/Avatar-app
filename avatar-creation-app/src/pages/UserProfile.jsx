import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import '../assets/styles/UserProfile.css';

// Accept onAuthSuccess as a prop from App.js
const UserProfile = ({ onAuthSuccess }) => {
  const history = useHistory();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [age, setAge] = useState([]);
  const [gender, setGender] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [occupation, setOccupation] = useState('');
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { latitude, longitude };
        localStorage.setItem("location", JSON.stringify(location));

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response || {}; // Ensure data is an object
          const countryName = data.address?.country || '';
          setCountry(countryName);
          localStorage.setItem("country", countryName);
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          alert("Failed to detect country from coordinates.");
        }
      },
      (error) => {
        console.error('Error getting user location:', error);
        alert('Failed to get location.');
      }
    );
  }, []); // Empty dependency array means this runs once on mount

  const handleSaveProfile = () => {
    const trimmedId = userId.trim();
    const trimmedCountry = country.trim();

    if (!trimmedId || !trimmedCountry) {
      alert("Please enter all your Details.");
      return false;
    }

    // Set user ID and password in local storage
    localStorage.setItem("user_id", trimmedId);
    localStorage.setItem("user_password", password); // Make sure password is set

    localStorage.setItem("country", trimmedCountry);
    localStorage.setItem("age", age);
    localStorage.setItem("gender", gender);
    localStorage.setItem("ethnicity", ethnicity);
    localStorage.setItem("occupation", occupation);
    localStorage.setItem("languages", JSON.stringify(languages));
    
    return true;
  };

  const handleSubmit = () => {
    if (handleSaveProfile()) {
      // *** IMPORTANT: Call onAuthSuccess here after successful registration/save ***
      if (onAuthSuccess) {
        onAuthSuccess(); // This will update the isLoggedIn state in App.js
      }
      history.push('/avatar-details');
    }
  };

  return (
    <div className="main-content">
      <div className="user-profile-wrapper" role="form" aria-labelledby="profileHeading">
        <h1 id="profileHeading"><b><em>User Details</em></b></h1>
        <p>Welcome, dear user<br />Please enter the following details</p>

        <div className="form-group">
          <label htmlFor="password">Set Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set a password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="form-group">
          <label>Age Range:</label>
          <div className="checkbox-group">
            {["13-18", "19-25", "26-35", "36-50", "51-65", "66-100"].map((range) => (
              <label key={range} className="checkbox-item">
                <input
                  type="checkbox"
                  value={range}
                  checked={age.includes(range)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setAge([...age, range]);
                    } else {
                      setAge(age.filter((r) => r !== range));
                    }
                  }}
                />
                {range}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
            <option value="Self-describe">Self-describe</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ethnicity">Race/Ethnicity</label>
          <select
            id="ethnicity"
            value={ethnicity}
            onChange={(e) => setEthnicity(e.target.value)}
          >
            <option value="">Select</option>
            <option value="Asian">Asian</option>
            <option value="Black or African">Black or African</option>
            <option value="Hispanic or Latino">Hispanic or Latino</option>
            <option value="White">White</option>
            <option value="Mixed">Mixed</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="occupation">Occupation</label>
          <input
            id="occupation"
            type="text"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="Enter your occupation"
          />
        </div>

        <div className="form-group">
          <label htmlFor="country">Country of Origin</label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Enter your country"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="country">Country of Occupation</label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Enter your country"
          />
        </div>
        

        <div className="button-row">
          <button onClick={handleSubmit} id="submitButton" type="button">Submit</button>
          <Link to="/">
            <button type="button">Back to Home</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import '../assets/styles/UserProfile.css';

const UserProfile = ({ onAuthSuccess }) => {
  const history = useHistory();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [countryOfOccupation, setCountryOfOccupation] = useState('');
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
          const data = await response.json(); // Fixed: await the JSON body
          const countryName = data.address?.country || '';
          setCountryOfOrigin(countryName);
          localStorage.setItem("countryOfOrigin", countryName);
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
  }, []);

const handleSaveProfile = async () => {
  const trimmedId = userId.trim();
  const trimmedCountryOfOrigin = countryOfOrigin.trim();
  const trimmedCountryOfOccupation = countryOfOccupation.trim();

  if (!trimmedId || !trimmedCountryOfOrigin || !trimmedCountryOfOccupation) {
    alert("Please enter all your Details.");
    return false;
  }

  // Save to localStorage
  localStorage.setItem("user_id", trimmedId);
  localStorage.setItem("user_password", password);
  localStorage.setItem("countryOfOrigin", trimmedCountryOfOrigin);
  localStorage.setItem("countryOfOccupation", trimmedCountryOfOccupation);
  localStorage.setItem("age", age);
  localStorage.setItem("gender", gender);
  localStorage.setItem("ethnicity", ethnicity);
  localStorage.setItem("occupation", occupation);
  localStorage.setItem("languages", JSON.stringify(languages));

  // Send to FastAPI backend
  try {
    const response = await fetch("https://avatar-app-98is.onrender.com/store-user-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: trimmedId,
        age: age, // this is an array
        gender,
        ethnicity,
        occupation,
        languages // this is also an array
      })
    });

    if (!response.ok) {
      throw new Error("Failed to send user details");
    }

    const result = await response.json();
    console.log("User details stored on server:", result);
  } catch (error) {
    console.error("Error storing to backend:", error);
    alert("Failed to store user details on the server.");
    return false;
  }

  return true;
};

  const handleSubmit = () => {
    if (handleSaveProfile()) {
      if (onAuthSuccess) {
        onAuthSuccess();
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
          <label htmlFor="countryOfOrigin">Country of Origin</label>
          <input
            id="countryOfOrigin"
            type="text"
            value={countryOfOrigin}
            onChange={(e) => setCountryOfOrigin(e.target.value)}
            placeholder="Enter your country of origin"
          />
        </div>

        <div className="form-group">
          <label htmlFor="countryOfOccupation">Country of Occupation</label>
          <input
            id="countryOfOccupation"
            type="text"
            value={countryOfOccupation}
            onChange={(e) => setCountryOfOccupation(e.target.value)}
            placeholder="Enter your country of occupation"
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

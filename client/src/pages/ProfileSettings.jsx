import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import '../styles/ProfileSettings.css';

const ProfileSettings = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    bio: '',
    country: '',
    city: '',
    availability: []
  });
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const availabilityOptions = [
    { value: 'weekday_morning', label: 'Weekday Morning' },
    { value: 'weekday_afternoon', label: 'Weekday Afternoon' },
    { value: 'weekday_evening', label: 'Weekday Evening' },
    { value: 'weekend_morning', label: 'Weekend Morning' },
    { value: 'weekend_afternoon', label: 'Weekend Afternoon' },
    { value: 'weekend_evening', label: 'Weekend Evening' }
  ];

  useEffect(() => {
    fetchUserData();
    fetchCountries();
  }, []);

  useEffect(() => {
    if (formData.country) {
      fetchCities(formData.country);
    }
  }, [formData.country]);

  const fetchCountries = async () => {
    try {
      const response = await axios.get('https://countriesnow.space/api/v0.1/countries');
      const countryList = response.data.data
        .map(country => country.country)
        .sort();
      setCountries(countryList);
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  };

  const fetchCities = async (country) => {
    setLoadingCities(true);
    try {
      const response = await axios.post('https://countriesnow.space/api/v0.1/countries/cities', {
        country: country
      });
      if (response.data.data) {
        setCities(response.data.data.sort());
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.AUTH.ME, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setFormData({
        bio: response.data.bio || '',
        country: response.data.location?.country || '',
        city: response.data.location?.city || '',
        availability: response.data.availability || []
      });
    } catch (err) {
      console.error('Error fetching user:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'country') {
      setFormData({ ...formData, country: value, city: '' });
      setCities([]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAvailabilityToggle = (value) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(value)
        ? prev.availability.filter(a => a !== value)
        : [...prev.availability, value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(API_ENDPOINTS.AUTH.PROFILE, {
        bio: formData.bio,
        location: {
          city: formData.city,
          country: formData.country
        },
        availability: formData.availability
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profile updated successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-settings">
      <div className="settings-header">
        <h1>Profile Settings</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={user.username} disabled />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" value={user.email} disabled />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell others about yourself..."
              maxLength="500"
              rows="4"
            />
            <small>{formData.bio.length}/500 characters</small>
          </div>
        </div>

        <div className="form-section">
          <h2>Location</h2>
          
          <div className="form-group">
            <label>Country</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
            >
              <option value="">Select a country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>City</label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={!formData.country || loadingCities}
            >
              <option value="">
                {loadingCities ? 'Loading cities...' : 'Select a city'}
              </option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {!formData.country && <small>Please select a country first</small>}
          </div>
        </div>

        <div className="form-section">
          <h2>Availability</h2>
          <p className="section-description">Select when you're available for skill exchange sessions</p>
          
          <div className="availability-grid">
            {availabilityOptions.map(option => (
              <label key={option.value} className="availability-option">
                <input
                  type="checkbox"
                  checked={formData.availability.includes(option.value)}
                  onChange={() => handleAvailabilityToggle(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="save-btn" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [skillsSought, setSkillsSought] = useState([]);
  const [newSkillOffered, setNewSkillOffered] = useState('');
  const [newSkillSought, setNewSkillSought] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Clear messages after a few seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const validateSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed.length === 0) {
      return { isValid: false, message: 'Skill cannot be empty.' };
    }
    if (trimmed.length > 50) {
      return { isValid: false, message: 'Skill must be 50 characters or less.' };
    }
    if (!/^[a-zA-Z0-9\s\-\.]+$/.test(trimmed)) {
      return { isValid: false, message: 'Skill contains invalid characters.' };
    }
    return { isValid: true, message: '' };
  };

  const checkDuplicateSkill = (skill, skillArray) => {
    return skillArray.some(existingSkill => 
      existingSkill.toLowerCase() === skill.toLowerCase()
    );
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get(API_ENDPOINTS.AUTH.ME, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
      setSkillsOffered(response.data.skillsOffered || []);
      setSkillsSought(response.data.skillsSought || []);
      setNewBio(response.data.bio || '');
      
      // Store user data in localStorage for other components
      localStorage.setItem('user', JSON.stringify(response.data));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setLoading(false);
    }
  };

  const addSkillOffered = async () => {
    const validation = validateSkill(newSkillOffered);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    if (checkDuplicateSkill(newSkillOffered, skillsOffered)) {
      setError('You have already added this skill to your offered skills.');
      return;
    }

    if (skillsOffered.length >= 20) {
      setError('You can add a maximum of 20 skills offered.');
      return;
    }

    try {
      const updatedSkills = [...skillsOffered, newSkillOffered.trim()];
      await updateSkills(updatedSkills, skillsSought);
      setSkillsOffered(updatedSkills);
      setNewSkillOffered('');
      setSuccessMessage('Skill added successfully!');
      setError('');
    } catch (err) {
      console.error('Error adding skill offered:', err);
      setError('Failed to add skill. Please try again.');
    }
  };

  const addSkillSought = async () => {
    const validation = validateSkill(newSkillSought);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    if (checkDuplicateSkill(newSkillSought, skillsSought)) {
      setError('You have already added this skill to your sought skills.');
      return;
    }

    if (skillsSought.length >= 20) {
      setError('You can add a maximum of 20 skills sought.');
      return;
    }

    try {
      const updatedSkills = [...skillsSought, newSkillSought.trim()];
      await updateSkills(skillsOffered, updatedSkills);
      setSkillsSought(updatedSkills);
      setNewSkillSought('');
      setSuccessMessage('Skill added successfully!');
      setError('');
    } catch (err) {
      console.error('Error adding skill sought:', err);
      setError('Failed to add skill. Please try again.');
    }
  };

  const removeSkillOffered = async (skillToRemove) => {
    try {
      const updatedSkills = skillsOffered.filter(skill => skill !== skillToRemove);
      await updateSkills(updatedSkills, skillsSought);
      setSkillsOffered(updatedSkills);
    } catch (err) {
      console.error('Error removing skill offered:', err);
    }
  };

  const removeSkillSought = async (skillToRemove) => {
    try {
      const updatedSkills = skillsSought.filter(skill => skill !== skillToRemove);
      await updateSkills(skillsOffered, updatedSkills);
      setSkillsSought(updatedSkills);
    } catch (err) {
      console.error('Error removing skill sought:', err);
    }
  };

  const updateSkills = async (offered, sought) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(API_ENDPOINTS.AUTH.SKILLS, {
        skillsOffered: offered,
        skillsSought: sought
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update localStorage
      const updatedUser = { ...user, skillsOffered: offered, skillsSought: sought };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.error('Error updating skills:', err);
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0] || 'Failed to update skills.');
      } else {
        setError('Failed to update skills. Please try again.');
      }
      throw err; // Re-throw to be caught by calling function
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const updateBio = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(API_ENDPOINTS.AUTH.PROFILE, {
        bio: newBio.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUser = { ...user, bio: newBio.trim() };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEditingBio(false);
      setSuccessMessage('Bio updated successfully!');
      setError('');
    } catch (err) {
      console.error('Error updating bio:', err);
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0] || 'Failed to update bio.');
      } else {
        setError('Failed to update bio. Please try again.');
      }
    }
  };

  const cancelBioEdit = () => {
    setNewBio(user?.bio || '');
    setEditingBio(false);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>SkillSwap Dashboard</h1>
          <nav className="dashboard-nav">
            <Link to="/dashboard" className="nav-link active">Dashboard</Link>
            <Link to="/matches" className="nav-link">Matches</Link>
            <Link to="/chat" className="nav-link">Chat</Link>
            <Link to="/profile-settings" className="nav-link">Profile</Link>
            <span>Welcome, {user?.username}!</span>
            <NotificationBell socket={socket} />
            <ThemeToggle />
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </nav>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Error and Success Messages */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}
        
        <div className="dashboard-grid">
          {/* Skills I Offer Section */}
          <div className="skill-section">
            <h2>Skills I Offer ({skillsOffered.length}/20)</h2>
            <div className="skill-input">
              <input
                type="text"
                value={newSkillOffered}
                onChange={(e) => setNewSkillOffered(e.target.value)}
                placeholder="Add a skill you can teach..."
                onKeyPress={(e) => e.key === 'Enter' && addSkillOffered()}
                maxLength="50"
              />
              <button 
                onClick={addSkillOffered} 
                className="add-btn"
                disabled={skillsOffered.length >= 20}
              >
                Add
              </button>
            </div>
            <div className="skills-list">
              {skillsOffered.map((skill, index) => (
                <div key={index} className="skill-tag offered">
                  {skill}
                  <button 
                    onClick={() => removeSkillOffered(skill)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Skills I Want Section */}
          <div className="skill-section">
            <h2>Skills I Want to Learn ({skillsSought.length}/20)</h2>
            <div className="skill-input">
              <input
                type="text"
                value={newSkillSought}
                onChange={(e) => setNewSkillSought(e.target.value)}
                placeholder="Add a skill you want to learn..."
                onKeyPress={(e) => e.key === 'Enter' && addSkillSought()}
                maxLength="50"
              />
              <button 
                onClick={addSkillSought} 
                className="add-btn"
                disabled={skillsSought.length >= 20}
              >
                Add
              </button>
            </div>
            <div className="skills-list">
              {skillsSought.map((skill, index) => (
                <div key={index} className="skill-tag sought">
                  {skill}
                  <button 
                    onClick={() => removeSkillSought(skill)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="profile-summary">
          <div className="profile-header">
            <h2>Profile Summary</h2>
            <button onClick={() => navigate('/profile-settings')} className="settings-btn">
              Edit Profile
            </button>
          </div>
          <div className="summary-content">
            <div className="summary-item">
              <strong>Username</strong>
              <span>{user?.username}</span>
            </div>
            <div className="summary-item">
              <strong>Email</strong>
              <span>{user?.email}</span>
            </div>
            <div className="summary-item bio-section">
              <strong>Bio</strong>
              {editingBio ? (
                <div className="bio-edit">
                  <textarea
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    maxLength="500"
                    rows="3"
                  />
                  <div className="bio-actions">
                    <button onClick={updateBio} className="save-btn">
                      Save
                    </button>
                    <button onClick={cancelBioEdit} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                  <small>{newBio.length}/500 characters</small>
                </div>
              ) : (
                <div className="bio-display">
                  <span>{user?.bio || 'No bio added yet.'}</span>
                  <button 
                    onClick={() => setEditingBio(true)} 
                    className="edit-btn"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <div className="summary-item">
              <strong>Skills Offered</strong>
              <span>{skillsOffered.length} skills</span>
            </div>
            <div className="summary-item">
              <strong>Skills Sought</strong>
              <span>{skillsSought.length} skills</span>
            </div>
            <div className="summary-item">
              <strong>Location</strong>
              <span>{user?.location?.city && user?.location?.country ? `${user.location.city}, ${user.location.country}` : 'Not set'}</span>
            </div>
            <div className="summary-item">
              <strong>Availability</strong>
              <span>{user?.availability?.length > 0 ? `${user.availability.length} time slots` : 'Not set'}</span>
            </div>
            <div className="summary-item">
              <strong>Member Since</strong>
              <span>{new Date(user?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

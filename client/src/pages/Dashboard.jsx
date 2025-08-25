import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [skillsSought, setSkillsSought] = useState([]);
  const [newSkillOffered, setNewSkillOffered] = useState('');
  const [newSkillSought, setNewSkillSought] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
      setSkillsOffered(response.data.skillsOffered || []);
      setSkillsSought(response.data.skillsSought || []);
      
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
    if (!newSkillOffered.trim()) return;

    try {
      const updatedSkills = [...skillsOffered, newSkillOffered];
      await updateSkills(updatedSkills, skillsSought);
      setSkillsOffered(updatedSkills);
      setNewSkillOffered('');
    } catch (err) {
      console.error('Error adding skill offered:', err);
    }
  };

  const addSkillSought = async () => {
    if (!newSkillSought.trim()) return;

    try {
      const updatedSkills = [...skillsSought, newSkillSought];
      await updateSkills(skillsOffered, updatedSkills);
      setSkillsSought(updatedSkills);
      setNewSkillSought('');
    } catch (err) {
      console.error('Error adding skill sought:', err);
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
    const token = localStorage.getItem('token');
    await axios.put('http://localhost:5000/api/auth/skills', {
      skillsOffered: offered,
      skillsSought: sought
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Update localStorage
    const updatedUser = { ...user, skillsOffered: offered, skillsSought: sought };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
            <span>Welcome, {user?.username}!</span>
            <ThemeToggle />
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </nav>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-grid">
          {/* Skills I Offer Section */}
          <div className="skill-section">
            <h2>Skills I Offer</h2>
            <div className="skill-input">
              <input
                type="text"
                value={newSkillOffered}
                onChange={(e) => setNewSkillOffered(e.target.value)}
                placeholder="Add a skill you can teach..."
                onKeyPress={(e) => e.key === 'Enter' && addSkillOffered()}
              />
              <button onClick={addSkillOffered} className="add-btn">Add</button>
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
            <h2>Skills I Want to Learn</h2>
            <div className="skill-input">
              <input
                type="text"
                value={newSkillSought}
                onChange={(e) => setNewSkillSought(e.target.value)}
                placeholder="Add a skill you want to learn..."
                onKeyPress={(e) => e.key === 'Enter' && addSkillSought()}
              />
              <button onClick={addSkillSought} className="add-btn">Add</button>
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
          <h2>Profile Summary</h2>
          <div className="summary-content">
            <div className="summary-item">
              <strong>Username</strong>
              <span>{user?.username}</span>
            </div>
            <div className="summary-item">
              <strong>Email</strong>
              <span>{user?.email}</span>
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

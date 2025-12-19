import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiStar } from 'react-icons/fi';
import { API_ENDPOINTS } from '../config/api';
import '../styles/UserProfile.css';

const UserProfile = ({ userId, onClose }) => {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    fetchReviews();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_ENDPOINTS.AUTH.USER(userId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_ENDPOINTS.REVIEWS.USER(userId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile-modal" onClick={onClose}>
      <div className="user-profile-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="profile-header">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">{user.username[0].toUpperCase()}</div>
          )}
          <h2>{user.username}</h2>
          <div className="rating">
            <FiStar fill="#ffd700" color="#ffd700" />
            <span>{user.rating?.toFixed(1) || '0.0'} ({user.reviewCount || 0} reviews)</span>
          </div>
        </div>

        <div className="profile-section">
          <h3>Bio</h3>
          <p>{user.bio || 'No bio available'}</p>
        </div>

        {user.location?.city && (
          <div className="profile-section">
            <h3>Location</h3>
            <p>{user.location.city}{user.location.country ? `, ${user.location.country}` : ''}</p>
          </div>
        )}

        {user.availability?.length > 0 && (
          <div className="profile-section">
            <h3>Availability</h3>
            <div className="availability-tags">
              {user.availability.map(slot => (
                <span key={slot} className="tag">{slot.replace('_', ' ')}</span>
              ))}
            </div>
          </div>
        )}

        <div className="profile-section">
          <h3>Skills Offered</h3>
          <div className="skills-list">
            {user.skillsOffered?.map(skill => (
              <span key={skill} className="skill-tag offered">
                {skill}
                {user.proficiency?.[skill] && <small> ({user.proficiency[skill]})</small>}
              </span>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <h3>Skills Sought</h3>
          <div className="skills-list">
            {user.skillsSought?.map(skill => (
              <span key={skill} className="skill-tag sought">{skill}</span>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <h3>Reviews</h3>
          {reviews.length === 0 ? (
            <p>No reviews yet</p>
          ) : (
            reviews.map(review => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <strong>{review.reviewer.username}</strong>
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} fill={i < review.rating ? '#ffd700' : 'none'} color="#ffd700" size={14} />
                    ))}
                  </div>
                </div>
                <p>{review.comment}</p>
                <small>{new Date(review.createdAt).toLocaleDateString()}</small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

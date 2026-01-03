import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { FiStar, FiX } from 'react-icons/fi';
import { API_ENDPOINTS } from '../config/api';
import { Button, Card, Spinner } from './common';
import '../styles/UserProfile.css';

const UserProfile = ({ userId, onClose }) => {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
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
  }, [userId]);

  const fetchReviews = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_ENDPOINTS.REVIEWS.USER(userId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserProfile(); // eslint-disable-line react-hooks/set-state-in-effect
    fetchReviews();
  }, [userId, fetchUserProfile, fetchReviews]);

  if (loading) return (
    <div className="user-profile-modal">
      <div className="loading-container">
        <Spinner />
        <p>Loading profile...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="user-profile-modal" onClick={onClose}>
      <Card className="error-card">
        <p>User not found</p>
        <Button onClick={onClose}>Close</Button>
      </Card>
    </div>
  );

  return (
    <div className="user-profile-modal" onClick={onClose}>
      <Card className="user-profile-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close profile">
          <FiX size={24} />
        </button>
        
        <div className="profile-header">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">{user.username[0].toUpperCase()}</div>
          )}
          <h2>{user.username}</h2>
          <div className="rating">
            <FiStar fill="var(--color-accent)" color="var(--color-accent)" />
            <span>{user.rating?.toFixed(1) || '0.0'} ({user.reviewCount || 0} reviews)</span>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-section">
            <h3>Bio</h3>
            <p className="bio-text">{user.bio || 'No bio available'}</p>
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
        </div>

        <div className="profile-section reviews-section">
          <h3>Recent Reviews</h3>
          <div className="reviews-container">
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet</p>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <strong>{review.reviewer.username}</strong>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} fill={i < review.rating ? 'var(--color-accent)' : 'none'} color="var(--color-accent)" size={14} />
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

        <div className="profile-footer">
          <Button onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
};

UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default UserProfile;

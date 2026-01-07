import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../../styles/SkillSelector.css';

const PREDEFINED_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js',
  'Graphic Design', 'UI/UX Design', 'Digital Marketing',
  'Piano', 'Guitar', 'Music Theory',
  'Spanish', 'French', 'English', 'German',
  'Cooking', 'Baking',
  'Photography', 'Video Editing',
  'Public Speaking', 'Creative Writing',
  'Mathematics', 'Physics',
  'Yoga', 'Fitness'
];

const SkillSelector = ({ selectedSkills, onSkillsChange, title }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [error, setError] = useState('');

  const handleToggleSkill = (skill) => {
    let newSkills;
    if (selectedSkills.includes(skill)) {
      newSkills = selectedSkills.filter(s => s !== skill);
    } else {
      if (selectedSkills.length >= 20) {
        setError('Maximum 20 skills allowed.');
        return;
      }
      newSkills = [...selectedSkills, skill];
    }
    onSkillsChange(newSkills);
    setError('');
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const trimmedSkill = customSkill.trim();

    if (!trimmedSkill) return;

    if (selectedSkills.some(s => s.toLowerCase() === trimmedSkill.toLowerCase())) {
      setError('Skill already added.');
      return;
    }

    if (selectedSkills.length >= 20) {
      setError('Maximum 20 skills allowed.');
      return;
    }

    onSkillsChange([...selectedSkills, trimmedSkill]);
    setCustomSkill('');
    setError('');
  };

  return (
    <div className="skill-selector-container">
      <h3>{title} ({selectedSkills.length}/20)</h3>

      {error && <div className="skill-error">{error}</div>}

      <div className="selected-skills-area">
        {selectedSkills.length === 0 && <p className="no-skills-text">No skills selected yet.</p>}
        {selectedSkills.map(skill => (
          <span key={skill} className="skill-chip selected">
            {skill}
            <button
              onClick={() => handleToggleSkill(skill)}
              className="remove-skill-btn"
              aria-label={`Remove ${skill}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="skill-picker-controls">
        <button
          className="toggle-picker-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide Suggestions' : 'Show Suggestions'}
        </button>

        <form onSubmit={handleAddCustomSkill} className="custom-skill-form">
          <input
            type="text"
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            placeholder="Add other skill..."
            maxLength={50}
          />
          <button type="submit" disabled={!customSkill.trim()}>Add</button>
        </form>
      </div>

      {isExpanded && (
        <div className="predefined-skills-grid">
          {PREDEFINED_SKILLS.map(skill => (
            <button
              key={skill}
              className={`skill-option-chip ${selectedSkills.includes(skill) ? 'active' : ''}`}
              onClick={() => handleToggleSkill(skill)}
            >
              {skill}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

SkillSelector.propTypes = {
  selectedSkills: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSkillsChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
};

export default SkillSelector;

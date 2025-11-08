import React, { useState } from 'react';
import { FiFilter } from 'react-icons/fi';
import '../styles/AdvancedSearch.css';

const AdvancedSearch = ({ onSearch }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    country: '',
    availability: [],
    minRating: 0
  });

  const availabilityOptions = [
    'weekday_morning', 'weekday_afternoon', 'weekday_evening',
    'weekend_morning', 'weekend_afternoon', 'weekend_evening'
  ];

  const handleAvailabilityToggle = (option) => {
    setFilters(prev => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter(a => a !== option)
        : [...prev.availability, option]
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
    setShowFilters(false);
  };

  const handleReset = () => {
    const resetFilters = { city: '', country: '', availability: [], minRating: 0 };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  return (
    <div className="advanced-search">
      <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
        <FiFilter /> Advanced Filters
      </button>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>City</label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              placeholder="Enter city"
            />
          </div>

          <div className="filter-group">
            <label>Country</label>
            <input
              type="text"
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              placeholder="Enter country"
            />
          </div>

          <div className="filter-group">
            <label>Minimum Rating</label>
            <select value={filters.minRating} onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}>
              <option value="0">Any</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Availability</label>
            <div className="availability-options">
              {availabilityOptions.map(option => (
                <label key={option} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.availability.includes(option)}
                    onChange={() => handleAvailabilityToggle(option)}
                  />
                  {option.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn-secondary" onClick={handleReset}>Reset</button>
            <button className="btn-primary" onClick={handleSearch}>Apply Filters</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;

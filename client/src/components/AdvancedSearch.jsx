import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { FiFilter } from 'react-icons/fi';
import { Button, Input, Card } from './common';
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
      <Button 
        variant="secondary" 
        className="filter-btn" 
        onClick={() => setShowFilters(!showFilters)}
      >
        <FiFilter /> Advanced Filters
      </Button>

      {showFilters && (
        <Card className="filter-panel" title="Search Filters">
          <div className="filter-grid">
            <div className="filter-group">
              <label>City</label>
              <Input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="Enter city"
              />
            </div>

            <div className="filter-group">
              <label>Country</label>
              <Input
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
                  <span>{option.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-actions">
            <Button variant="secondary" onClick={handleReset}>Reset</Button>
            <Button variant="primary" onClick={handleSearch}>Apply Filters</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch;
AdvancedSearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
};

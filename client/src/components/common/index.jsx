import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import '../../styles/App.css'; // Ensure styles are available

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent', 'gradient', 'success', 'error']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  onClick: PropTypes.func
};

export const Input = ({ className = '', ...props }) => {
  return (
    <input 
      className={`input ${className}`} 
      {...props} 
    />
  );
};

Input.propTypes = {
  className: PropTypes.string
};

export const PasswordInput = ({ className = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="password-input-wrapper">
      <input
        type={showPassword ? 'text' : 'password'}
        className={`input password-input ${className}`}
        {...props}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={togglePasswordVisibility}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  );
};

PasswordInput.propTypes = {
  className: PropTypes.string
};

export const Card = ({ children, className = '', title, ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  title: PropTypes.string
};

export const Spinner = ({ className = '', ...props }) => {
  return (
    <div className={`spinner ${className}`} {...props}></div>
  );
};

Spinner.propTypes = {
  className: PropTypes.string
};

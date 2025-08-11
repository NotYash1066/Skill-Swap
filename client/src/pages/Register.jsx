import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const { username, email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      // Note: Use your actual backend URL
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      console.log(res.data);
      navigate('/login'); // Redirect to login after successful registration
    } catch (err) {
      console.error(err.response.data);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {/* Input fields for username, email, password go here */}
      <input type="text" name="username" value={username} onChange={onChange} required />
      <input type="email" name="email" value={email} onChange={onChange} required />
      <input type="password" name="password" value={password} onChange={onChange} required />
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;

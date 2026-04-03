import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import Login from '../pages/Login';
import Register from '../pages/Register';

// Mock axios
vi.mock('axios');

// Mock config to avoid import issues or dependencies on .env
vi.mock('../config/api', () => ({
  API_ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register'
    }
  }
}));

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully log in and redirect to dashboard', async () => {
    const mockToken = 'mock-jwt-token';
    const mockUserEmail = 'test@example.com';
    const mockPassword = 'password123';

    // Setup axios mock for successful login
    axios.post.mockResolvedValueOnce({
      data: {
        token: mockToken,
        user: { id: '123', email: mockUserEmail }
      }
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Fill out the login form
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: mockUserEmail } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: mockPassword } });

    // Submit the form
    const loginButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(loginButton);

    // Verify loading state
    expect(screen.getByText(/Signing In.../i)).toBeInTheDocument();

    // Wait for the redirect and token storage
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    // Verify axios was called with correct data
    expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
      email: mockUserEmail,
      password: mockPassword
    });
  });

  it('should display error messages on failed login attempt', async () => {
    const errorMessage = 'Invalid credentials';
    
    // Setup axios mock for failed login (401 Unauthorized)
    axios.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { errors: [{ msg: errorMessage }] }
      }
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Fill out and submit the form
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Verify token was NOT stored
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should successfully register and redirect to dashboard', async () => {
    const mockToken = 'new-user-jwt-token';

    axios.post.mockResolvedValueOnce({
      data: {
        token: mockToken,
        user: { id: '456', email: 'new@example.com' }
      }
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/johndoe/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), { target: { value: 'new@example.com' } });

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123'
    });
  });
});

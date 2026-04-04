import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import Login from '../pages/Login';
import Register from '../pages/Register';

vi.mock('axios');

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
    const mockRefreshToken = 'mock-refresh-token';
    const mockUserEmail = 'test@example.com';
    const mockPassword = 'password123';

    axios.post.mockResolvedValueOnce({
      data: {
        token: mockToken,
        refreshToken: mockRefreshToken,
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

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: mockUserEmail } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: mockPassword } });

    const loginButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(loginButton);

    expect(screen.getByText(/Signing In.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(localStorage.getItem('refreshToken')).toBe(mockRefreshToken);
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
      email: mockUserEmail,
      password: mockPassword
    });
  });

  it('should display error messages on failed login attempt', async () => {
    const errorMessage = 'Invalid credentials';
    
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

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should successfully register and redirect to dashboard', async () => {
    const mockToken = 'new-user-jwt-token';
    const mockRefreshToken = 'new-user-refresh-token';

    axios.post.mockResolvedValueOnce({
      data: {
        token: mockToken,
        refreshToken: mockRefreshToken,
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
      expect(localStorage.getItem('refreshToken')).toBe(mockRefreshToken);
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123'
    });
  });
});

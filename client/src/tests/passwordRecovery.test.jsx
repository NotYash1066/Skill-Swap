import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';

vi.mock('axios');

vi.mock('../config/api', () => ({
  API_ENDPOINTS: {
    AUTH: {
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: (token) => `/api/auth/reset-password/${token}`,
    },
  },
}));

describe('Password recovery flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits forgot-password requests and shows the success message', async () => {
    axios.post.mockResolvedValueOnce({
      data: { msg: 'If an account exists, a reset email has been sent.' },
    });

    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'reset@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'reset@example.com' });
      expect(screen.getByText(/If an account exists, a reset email has been sent/i)).toBeInTheDocument();
    });
  });

  it('submits reset-password requests using the route token and shows success feedback', async () => {
    axios.put.mockResolvedValueOnce({
      data: { message: 'Password reset successful' },
    });

    render(
      <MemoryRouter initialEntries={['/reset-password/test-token']}>
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: 'NewPassword1' } });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'NewPassword1' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('/api/auth/reset-password/test-token', {
        password: 'NewPassword1',
      });
      expect(screen.getByText(/Password reset successful/i)).toBeInTheDocument();
    });
  });
});

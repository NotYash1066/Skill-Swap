import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { API_ENDPOINTS } from './config/api';
import { AUTH_STATE_CHANGE_EVENT } from './utils/auth';

vi.mock('axios');

vi.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }) => <>{children}</>,
}));

vi.mock('./contexts/VideoCallContext', () => ({
  VideoCallProvider: ({ children }) => <>{children}</>,
}));

vi.mock('./components/ErrorBoundary', () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock('./components/video/GlobalVideoCall', () => ({
  default: () => null,
}));

vi.mock('./pages/Login', () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock('./pages/Register', () => ({
  default: () => <div>Register Page</div>,
}));

vi.mock('./pages/Dashboard', () => ({
  default: () => <div>Dashboard Page</div>,
}));

vi.mock('./pages/Matches', () => ({
  default: () => <div>Matches Page</div>,
}));

vi.mock('./pages/Chat', () => ({
  default: () => <div>Chat Page</div>,
}));

vi.mock('./pages/ProfileSettings', () => ({
  default: () => <div>Profile Settings Page</div>,
}));

vi.mock('socket.io-client', () => ({
  default: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock('peerjs', () => ({
  Peer: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    destroy: vi.fn(),
  })),
}));

describe('App Component Auth Check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.pushState({}, '', '/login');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not log an error to console when verify-token returns 401', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('token', 'fake-token');

    axios.get.mockRejectedValue({
      message: "Request failed with status code 401",
      response: { status: 401, data: { message: 'Unauthorized' } }
    });

    render(<App />);

    await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.VERIFY_TOKEN, expect.any(Object));
    });

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should sync app auth state when the custom auth event fires', async () => {
    axios.get.mockResolvedValue({
      data: { success: true }
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    localStorage.setItem('token', 'fresh-token');
    await act(async () => {
      window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.VERIFY_TOKEN, expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });

  it('should refresh the access token when verification returns 401 and a refresh token exists', async () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('refreshToken', 'valid-refresh-token');
    window.history.pushState({}, '', '/dashboard');

    axios.get
      .mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Token expired' } },
      })
      .mockResolvedValueOnce({
        data: { success: true },
      });

    axios.post.mockResolvedValueOnce({
      data: { token: 'fresh-token', refreshToken: 'rotated-refresh-token' },
    });

    render(<App />);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken: 'valid-refresh-token' }, expect.any(Object));
    });

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('fresh-token');
      expect(localStorage.getItem('refreshToken')).toBe('rotated-refresh-token');
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });
});

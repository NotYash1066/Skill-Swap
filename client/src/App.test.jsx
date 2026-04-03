import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AUTH_STATE_CHANGE_EVENT } from './utils/auth';

// Mock axios
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

// Mock socket.io-client to avoid connection errors in providers
vi.mock('socket.io-client', () => ({
  default: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

// Mock peerjs
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
    // Setup
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('token', 'fake-token');
    
    // Simulate 401 error
    axios.get.mockRejectedValue({
      message: "Request failed with status code 401",
      response: { status: 401, data: { message: 'Unauthorized' } }
    });

    // Act
    render(<App />);

    // Wait for the effect to run and axios to be called
    await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/auth/verify-token", expect.any(Object));
    });

    // Assert: We expect NO console.error to be called for a 401
    // This expects the test to FAIL if the code logs the error
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
      expect(axios.get).toHaveBeenCalledWith('/api/auth/verify-token', expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });
});

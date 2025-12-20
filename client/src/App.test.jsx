import React from 'react';
import { render, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock axios
vi.mock('axios');

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
});

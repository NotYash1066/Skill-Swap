import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('axios');

// Mock config
vi.mock('../config/api', () => ({
  API_ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login'
    }
  }
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
     vi.restoreAllMocks();
  });

  it('should not log console error on 400 Bad Request (Invalid Credentials)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    axios.post.mockRejectedValue({
      message: 'Request failed with status code 400',
      response: { 
        status: 400, 
        data: { errors: [{ msg: 'Invalid credentials' }] } 
      }
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Assert: currently it DOES log error, so this should fail
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

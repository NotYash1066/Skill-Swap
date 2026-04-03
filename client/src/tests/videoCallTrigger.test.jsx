import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Chat from '../pages/Chat';
import useSocket from '../hooks/useSocket';

// Mock axios
vi.mock('axios');

// Mock useSocket hook
vi.mock('../hooks/useSocket', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    socket: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
    sendMessage: vi.fn(),
    onNewMessage: vi.fn(),
    onUserTyping: vi.fn(),
    onUserStopTyping: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
    offNewMessage: vi.fn(),
    offUserTyping: vi.fn()
  }))
}));

// Mock Whiteboard to avoid canvas issues in jsdom
vi.mock('../components/collaboration/Whiteboard', () => ({
  __esModule: true,
  default: () => <div data-testid="whiteboard-mock">Whiteboard</div>
}));

// Mock API config
vi.mock('../config/api', () => ({
  API_ENDPOINTS: {
    CHAT: {
      ROOMS: '/api/chat/rooms',
      MESSAGES: (id) => `/api/chat/rooms/${id}/messages`
    }
  }
}));

describe('Chat Video Call Trigger', () => {
  const currentUserId = 'user-123';
  const otherUserId = 'user-456';
  const otherUsername = 'JaneDoe';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock scrollIntoView which is not present in JSDOM
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    
    // Mock token
    const mockToken = `header.${btoa(JSON.stringify({ user: { id: currentUserId } }))}.signature`;
    localStorage.setItem('token', mockToken);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should dispatch global-video-call-initiate event when video button is clicked', async () => {
    // Setup chat rooms mock
    const mockChatRooms = [
      {
        _id: 'room-1',
        participants: [
          { _id: currentUserId, username: 'JohnDoe' },
          { _id: otherUserId, username: otherUsername }
        ],
        lastActivity: new Date().toISOString()
      }
    ];

    axios.get.mockImplementation((url) => {
      if (url === '/api/chat/rooms') {
        return Promise.resolve({ data: mockChatRooms });
      }
      if (url.includes('/messages')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Spy on window.dispatchEvent
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Chat />
      </BrowserRouter>
    );

    // Wait for chat rooms to load and select the first one
    await waitFor(() => {
      expect(screen.getAllByText(otherUsername).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText(otherUsername)[0]);

    // Wait for chat room header to appear with video button
    await waitFor(() => {
      expect(screen.getByTitle(/Start video call/i)).toBeInTheDocument();
    });

    // Click the video call button
    fireEvent.click(screen.getByTitle(/Start video call/i));

    // Verify event was dispatched with correct details
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    const event = dispatchSpy.mock.calls.find(call => call[0].type === 'global-video-call-initiate')[0];
    expect(event.detail).toEqual({
      targetUserId: otherUserId,
      targetUserName: otherUsername
    });
  });
});

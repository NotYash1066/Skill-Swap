import io from 'socket.io-client';

// REST: use same-origin /api on Vercel (proxied to Lightsail). Dev uses Vite proxy.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5000');

// Socket.IO: must hit Lightsail directly (Vercel cannot proxy WebSockets).
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  (import.meta.env.PROD ? 'http://13.232.109.22' : 'http://localhost:5000');

export const SOCKET_PATH =
  import.meta.env.VITE_SOCKET_PATH ??
  (import.meta.env.PROD ? '/skill-api/socket.io/' : '/socket.io/');

export function createSocket(options = {}) {
  return io(SOCKET_URL, {
    path: SOCKET_PATH,
    transports: ['websocket', 'polling'],
    ...options
  });
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: (token) => `${API_BASE_URL}/api/auth/reset-password/${encodeURIComponent(token)}`,
    ME: `${API_BASE_URL}/api/auth/me`,
    VERIFY_TOKEN: `${API_BASE_URL}/api/auth/verify-token`,
    REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh-token`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    SKILLS: `${API_BASE_URL}/api/auth/skills`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
    USER: (id) => `${API_BASE_URL}/api/auth/user/${id}`
  },
  MATCHES: {
    POTENTIAL: `${API_BASE_URL}/api/matches/potential`,
    RECEIVED: `${API_BASE_URL}/api/matches/received`,
    SENT: `${API_BASE_URL}/api/matches/sent`,
    REQUEST: `${API_BASE_URL}/api/matches/request`,
    RESPOND: (id) => `${API_BASE_URL}/api/matches/${id}/respond`
  },
  CHAT: {
    ROOMS: `${API_BASE_URL}/api/chat/rooms`,
    MESSAGES: (roomId) => `${API_BASE_URL}/api/chat/rooms/${roomId}/messages`
  },
  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/api/notifications`,
    READ: (id) => `${API_BASE_URL}/api/notifications/${id}/read`
  },
  REVIEWS: {
    USER: (userId) => `${API_BASE_URL}/api/reviews/user/${userId}`
  }
};
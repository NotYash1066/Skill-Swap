export const AUTH_STATE_CHANGE_EVENT = 'skillswap-auth-state-change';

export const storeAuthTokens = ({ token, refreshToken }) => {
  if (token) {
    localStorage.setItem('token', token);
  }

  if (refreshToken !== undefined) {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }
};

export const clearAuthState = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const notifyAuthStateChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
  }
};

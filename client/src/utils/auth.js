export const AUTH_STATE_CHANGE_EVENT = 'skillswap-auth-state-change';

export const notifyAuthStateChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
  }
};

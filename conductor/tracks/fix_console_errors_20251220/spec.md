# Specification: Fix Console Errors (Auth, Router, PeerJS)

## 1. Overview
This track aims to resolve a series of console errors and warnings affecting the application's stability and developer experience. The primary focus is fixing critical authentication errors (`401` on token verification and `400` on login). Secondary tasks include resolving React Router future flag warnings and investigating PeerJS connection cleanup logs.

## 2. Functional Requirements
### 2.1 Authentication Fixes
- **Token Verification (`verify-token`):**
    - The application must not throw a `401 (Unauthorized)` error on initial load.
    - If no token exists, the check should ideally be skipped or handled gracefully without an error log.
    - If a token exists but is invalid, the user should be logged out cleanly.
- **Login (`/api/auth/login`):**
    - The login form submission must not result in a `400 (Bad Request)` error.
    - Ensure the client sends the correct payload structure expected by the backend.

### 2.2 React Router Improvements
- **Future Flags:**
    - Enable `v7_startTransition` and `v7_relativeSplatPath` flags in the Router configuration to opt-in to v7 behaviors and silence deprecation warnings.

### 2.3 PeerJS Investigation
- **Connection Cleanup:**
    - Investigate the "Cleaning up peer connections" log to ensure it represents expected behavior and not a premature or erroneous disconnection.
    - If it is a normal debug log, ensure it is handled/logged appropriately (e.g., only in debug mode).

## 3. Non-Functional Requirements
- **Code Quality:** Fixes should not introduce regressions in existing authentication flows.
- **Performance:** Auth checks on load should remain fast.

## 4. Acceptance Criteria
- [ ] No `401` errors appear in the console on application refresh/load.
- [ ] Users can log in successfully without `400` errors.
- [ ] React Router warnings about "Future Flag" are gone.
- [ ] "Cleaning up peer connections" log is verified as benign or fixed if it indicated a bug.

## 5. Out of Scope
- Major version upgrades for React Router (v7 upgrade is not in scope, just preparation).
- Refactoring the entire PeerJS module (only investigating the specific cleanup log).

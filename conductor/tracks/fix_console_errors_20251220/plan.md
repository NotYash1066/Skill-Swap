# Plan: Fix Console Errors (Auth, Router, PeerJS)

## Phase 1: Authentication Fixes (Core Priority)
- [x] Task: Create reproduction test for `verify-token` 401 error on app load (Red Phase).
- [x] Task: Implement fix for `verify-token` to handle missing/invalid tokens gracefully (Green Phase).
- [x] Task: Create reproduction test for `login` 400 error (Red Phase).
- [~] Task: Implement fix for `login` payload validation or client request structure (Green Phase).
- [ ] Task: Verify fix with automated tests and refactor if needed.
- [ ] Task: Conductor - User Manual Verification 'Authentication Fixes' (Protocol in workflow.md)

## Phase 2: Router & PeerJS Polish
- [ ] Task: Update React Router configuration to include `v7_startTransition` and `v7_relativeSplatPath` flags.
- [ ] Task: Verify application loads without React Router warnings.
- [ ] Task: Analyze `peerService.js` cleanup logic to determine cause of "Cleaning up peer connections" log.
- [ ] Task: Implement fix or adjustment to log level/logic for PeerJS cleanup.
- [ ] Task: Conductor - User Manual Verification 'Router & PeerJS Polish' (Protocol in workflow.md)

# Implementation Plan - Fix CI Test Timeouts and Mongoose Warnings

## Phase 1: Mongoose Schema Cleanup
- [x] Task: Remove redundant index in `server/models/ChatRoom.js` (found `match` field with `unique: true` and explicit `index({ match: 1 })`)
- [x] Task: Audit other models for redundant indexes (e.g., `User.js`, `Review.js`, etc.)
- [x] Task: Verify that duplicate index warnings are gone by running tests locally
- [x] Task: Conductor - User Manual Verification 'Mongoose Schema Cleanup' (Protocol in workflow.md)

## Phase 2: Database Connection Optimization in Tests
- [x] Task: Create `server/tests/db_helper.js` to manage Mongoose connections for tests, ensuring proper cleanup
- [x] Task: Update `server/tests/match_flow.test.js` to use `db_helper.js` and ensure it handles connection timeouts gracefully
- [x] Task: Update `server/tests/notifications.test.js` to use `db_helper.js`
- [x] Task: Verify these tests pass locally
- [x] Task: Conductor - User Manual Verification 'Database Connection Optimization in Tests' (Protocol in workflow.md)

## Phase 3: CI Environment Stabilization
- [x] Task: Add MongoDB health checks to `.github/workflows/ci-cd.yml` service container
- [x] Task: Update `.github/workflows/main.yml` to include a MongoDB service or ensure availability
- [x] Task: Conductor - User Manual Verification 'CI Environment Stabilization' (Protocol in workflow.md)
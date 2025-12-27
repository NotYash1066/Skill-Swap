# Implementation Plan - Upgrade to ESLint 9 and Fix Config Export Error

## Phase 1: Initialization and Red Phase
- [x] Task: Verify the current failure in `client` by running the lint command and confirming the `ERR_PACKAGE_PATH_NOT_EXPORTED` error.
- [x] Task: Audit `client/package.json` and `server/package.json` to list all ESLint-related dependencies that need upgrading.
- [~] Task: Conductor - User Manual Verification 'Initialization and Red Phase' (Protocol in workflow.md)

## Phase 2: Client ESLint 9 Migration
- [x] Task: Upgrade `eslint` and all associated plugins/parsers in `client/package.json` to versions compatible with ESLint 9.
- [x] Task: Refactor `client/eslint.config.js` to remove internal path imports and ensure compatibility with ESLint 9's Flat Config requirements.
- [x] Task: Verify that the `ERR_PACKAGE_PATH_NOT_EXPORTED` error for `./config` is resolved.
- [x] Task: Run `npm run lint` in `client` and verify it passes (Green Phase).
- [~] Task: Conductor - User Manual Verification 'Client ESLint 9 Migration' (Protocol in workflow.md)

## Phase 3: Server ESLint 9 Migration
- [ ] Task: Identify the current ESLint configuration in the `server` directory (e.g., `.eslintrc.json`).
- [ ] Task: Upgrade `eslint` and associated plugins in `server/package.json` to version 9.x.
- [ ] Task: Migrate the `server` configuration to a new `server/eslint.config.js` (Flat Config format).
- [ ] Task: Run the lint command in `server` and verify it passes.
- [ ] Task: Conductor - User Manual Verification 'Server ESLint 9 Migration' (Protocol in workflow.md)

## Phase 4: Project-Wide Verification and CI Alignment
- [ ] Task: Review `.github/workflows/main.yml` and `.github/workflows/ci-cd.yml` to ensure the linting steps are correctly configured for the new ESLint 9 execution.
- [ ] Task: Perform a final project-wide lint check.
- [ ] Task: Conductor - User Manual Verification 'Project-Wide Verification and CI Alignment' (Protocol in workflow.md)

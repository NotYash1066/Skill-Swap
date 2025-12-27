# Specification: Fix CI Test Timeouts and Mongoose Warnings

## 1. Overview
This track aims to resolve persistent CI failures in the GitHub Actions environment. Specifically, it addresses timeout errors in `match_flow.test.js` and `notifications.test.js` occurring during the `beforeAll` hook (MongoDB connection), and eliminates Mongoose warnings regarding duplicate schema indexes.

## 2. Objectives
- **Fix Test Timeouts:** Ensure `match_flow.test.js` and `notifications.test.js` connect to the test database reliably within the standard timeout limits.
- **Eliminate Warnings:** Remove duplicate index definitions from Mongoose models to clean up test output.
- **Stabilize CI:** Ensure the MongoDB service is fully ready in the GitHub Actions workflow before tests execute.

## 3. Implementation Requirements

### 3.1 Database Connection Optimization
- **Refactor Test Setup:** Investigate and improve the database connection/teardown logic in the failing test files.
- **Approach:** Implement a more robust connection pattern (potentially a shared helper) that handles connection states gracefully to prevent hanging or timeouts.

### 3.2 CI Environment (GitHub Actions)
- **Service Readiness:** Update the CI workflow configuration (likely `.github/workflows/ci-cd.yml` or similar) to ensure the MongoDB container is healthy and ready to accept connections before the `npm test` step runs.

### 3.3 Mongoose Schema Cleanup
- **Audit Models:** Inspect Mongoose models (focusing on `Match.js` or others with a `match` field) for redundant index declarations.
- **Resolution:** Ensure indexes are defined either via field options (`index: true`) OR `schema.index()`, but not both.

## 4. Acceptance Criteria
- [ ] `npm test` runs locally without "Exceeded timeout" errors in `match_flow` or `notifications` suites.
- [ ] `npm test` runs locally without "[MONGOOSE] Warning: Duplicate schema index" messages.
- [ ] CI/CD pipeline passes successfully.

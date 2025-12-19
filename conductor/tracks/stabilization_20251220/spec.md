# Spec: Project Stabilization and Security Hardening

## Background
The Skill-Swap platform has identified several critical stability and security issues that need to be addressed to provide a reliable and safe environment for users to exchange skills.

## Objectives
- Resolve identified critical bugs in authentication and data handling.
- Implement missing security headers and rate limiting where absent.
- Ensure all environment variables are properly validated.
- Fix broken test cases and improve overall test coverage.

## Scope
- Backend API (`server/`)
- Critical frontend interactions (`client/`)
- Security middleware and validation logic

## Success Criteria
- All identified critical fixes are implemented.
- Security scan passes with no high-severity vulnerabilities.
- Test suite passes with >80% coverage on new/modified code.
- No regression in core features (Chat, Video, Matching).

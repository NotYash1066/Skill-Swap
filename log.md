2025-09-21T19:09:40Z - Step 1: Hardened server/routes/matches.js
- Added mongoose import
- GET /potential: coalesced skills arrays, added next(err)
- POST /request: validated input, prevented self-requests, capped compatibilityScore, handled duplicate key, used next(err)
- PUT /:id/respond: validated status, set respondedAt, used next(err)
- Updated other routes to use next(err)

2025-09-21T19:09:40Z - Step 2: Updated server/models/User.js defaults
- skillsOffered and skillsSought now default to [] to prevent undefined array issues in queries and UI

2025-09-21T19:09:40Z - Step 3: Unified JWT verification secret in server/middleware/auth.js
- Removed fallback secret; jwt.verify now uses process.env.JWT_SECRET consistently

2025-09-21T19:09:40Z - Step 4: Improved client Matches.jsx UX and error handling
- Added sending state to prevent double submission and show 'Sending...'
- Broadened error handling to display server messages or sensible default
- fetchData now handles 401 by redirecting to login and clearing storage

2025-09-22T01:40:23Z - Step 5: Excluded already matched users from potential results
- Updated GET /api/matches/potential to $nin users with any existing Match with current user
- Prevents showing a 'Send Connection Request' for users where a match already exists

2025-09-22T01:51:07Z - Step 6: Fixed User.allSkills virtual to avoid 'not iterable'
- allSkills now coalesces skillsOffered/skillsSought to [] if undefined/null to prevent runtime TypeError during toJSON

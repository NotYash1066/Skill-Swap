# Connection Request Error Audit and Fix Plan

This report covers potential issues in both the backend (server) and frontend (client) around sending a “connection request” (aka match request), plus concrete steps to fix them.

Summary of key risks found:
- Backend validation gaps lead to 500 Server Error on common bad inputs (invalid recipientId, too many matched skills, duplicate requests).
- Route handlers bypass centralized error handling, hiding useful error details from the client.
- Potential matches query can throw if user skills arrays are undefined.
- Frontend assumes JSON error shape and doesn’t guard double-submit; users may not see meaningful feedback on failures.


Backend (server)

1) POST /api/matches/request — input validation and error handling
File: server/routes/matches.js
Problem:
- No validation for recipientId presence/format; invalid ObjectId can cause Mongoose CastError, currently returned as 500.
- No guard against self-requests.
- compatibilityScore = matchedSkills.length * 20 can exceed model max (100), causing validation error (500) when matchedSkills has > 5 entries.
- Duplicate requests can still throw a unique index error (race) and become a 500; not mapped to a user-friendly 400.
- catch blocks directly send 500 instead of delegating to centralized error handler.

Fix:
- Validate body upfront (recipientId is valid ObjectId, message length 1–500, matchedSkills is non-empty array of strings).
- Prevent self-request.
- Cap compatibilityScore at 100.
- Handle duplicate key errors gracefully.
- Prefer next(err) to use error middleware consistently.

Example route update:
```js path=null start=null
// at top of file
const mongoose = require('mongoose');

// inside router.post('/request', auth, async (req, res, next) => { ... })
try {
  const { recipientId, message, matchedSkills } = req.body;

  // Basic validation
  if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
    return res.status(400).json({ msg: 'Invalid recipientId' });
  }
  if (!message || !message.trim() || message.trim().length > 500) {
    return res.status(400).json({ msg: 'Message is required and must be <= 500 characters' });
  }
  if (!Array.isArray(matchedSkills) || matchedSkills.length === 0) {
    return res.status(400).json({ msg: 'matchedSkills must be a non-empty array' });
  }

  if (recipientId === req.user.id) {
    return res.status(400).json({ msg: 'Cannot send a request to yourself' });
  }

  const recipient = await User.findById(recipientId).select('_id');
  if (!recipient) {
    return res.status(404).json({ msg: 'Recipient not found' });
  }

  // Check if match request already exists (either direction)
  const existingMatch = await Match.findOne({
    $or: [
      { requester: req.user.id, recipient: recipientId },
      { requester: recipientId, recipient: req.user.id }
    ]
  });
  if (existingMatch) {
    return res.status(400).json({ msg: 'Match request already exists' });
  }

  const compatibilityScore = Math.min((matchedSkills?.length || 0) * 20, 100);

  const newMatch = new Match({
    requester: req.user.id,
    recipient: recipientId,
    message: message.trim(),
    matchedSkills,
    compatibilityScore
  });

  await newMatch.save();
  await newMatch.populate('requester recipient', 'username email');
  return res.json(newMatch);
} catch (err) {
  if (err && err.code === 11000) {
    return res.status(400).json({ msg: 'A request between these users already exists' });
  }
  return next(err); // Let centralized error handler format 500s and validation errors
}
```

2) GET /api/matches/potential — handle undefined skills arrays
File: server/routes/matches.js
Problem:
- Uses currentUser.skillsSought and currentUser.skillsOffered directly in $in filters. If either is undefined (new user without skills), Mongo will error ("$in needs an array").

Fix options (either is fine; doing both is best):
- Schema-level: give defaults of [] to skills arrays (recommended regardless).
- Route-level: coalesce to [] when building the query and when computing matches.

Example route hardening (coalescing arrays):
```js path=null start=null
const currentUser = await User.findById(req.user.id);
const userSought = Array.isArray(currentUser?.skillsSought) ? currentUser.skillsSought : [];
const userOffered = Array.isArray(currentUser?.skillsOffered) ? currentUser.skillsOffered : [];

let matchQuery = {
  _id: { $ne: req.user.id },
  isActive: { $ne: false },
  $and: [
    { skillsOffered: { $in: userSought } },
    { skillsSought: { $in: userOffered } }
  ]
};
```

3) Centralize error handling usage
File: server/routes/matches.js
Problem:
- Many try/catch blocks respond with res.status(500).send('Server error'), bypassing the rich error middleware (server/middleware/error.js) that already maps e.g. duplicate keys, token errors, validation issues to friendly messages.

Fix:
- Replace res.status(500).send('Server error') in catch blocks with next(err). Only handle known 4xx in-route.

Example replacement:
```js path=null start=null
} catch (err) {
  console.error(err.message);
  return next(err);
}
```

4) PUT /api/matches/:id/respond — validate status and set respondedAt
File: server/routes/matches.js
Problem:
- status is taken verbatim; invalid status will cause a validation error (500). respondedAt isn’t set.

Fix:
```js path=null start=null
const { status } = req.body; // 'accepted' or 'rejected'
if (!['accepted', 'rejected'].includes(status)) {
  return res.status(400).json({ msg: 'Invalid status' });
}
...
match.status = status;
match.respondedAt = new Date();
await match.save();
```

5) User schema — default empty arrays for skills
File: server/models/User.js
Problem:
- skillsOffered and skillsSought have no default; they may be undefined for new users.

Fix:
```js path=/C:/Users/hardi/Documents/GitHub/Skill-Swap/server/models/User.js start=33
		skillsOffered: [{ 
			type: String,
			trim: true,
			maxlength: 50
		}],
		skillsSought: [{ 
			type: String,
			trim: true,
			maxlength: 50
		}],
```
Becomes (add default: [] on the array path):
```js path=null start=null
	skillsOffered: { type: [String], default: [] },
	skillsSought: { type: [String], default: [] },
```

6) JWT secret consistency
Files: server/middleware/auth.js and server/routes/auth.js
Problem:
- auth.js uses process.env.JWT_SECRET to sign, while middleware/auth.js will verify with process.env.JWT_SECRET || 'fallback_secret'. If JWT_SECRET is misconfigured/missing, tokens may not verify consistently.

Fix:
- Use a single required secret for both: remove fallback in verify or apply the same fallback for sign and verify consistently. Prefer failing fast if JWT_SECRET is not set in non-development environments.


Frontend (client)

1) Matches.jsx — robust error feedback for send failures
File: client/src/pages/Matches.jsx
Problem:
- Expects err.response.data.msg for server errors; but backend may return text or a different JSON shape. Users might see no message.

Fix:
- Broaden error handling to show a sensible default when msg isn’t present.

Example:
```js path=/C:/Users/hardi/Documents/GitHub/Skill-Swap/client/src/pages/Matches.jsx start=60
    } catch (err) {
      console.error('Error sending match request:', err);
      const serverMsg = err.response?.data?.msg
        || err.response?.data?.errors?.[0]
        || err.response?.data?.message
        || err.message
        || 'Failed to send request. Please try again.';
      alert(`Error: ${serverMsg}`);
    }
```

2) Matches.jsx — prevent multiple submissions
Problem:
- No UI lock while the request is in flight; double-click can create races.

Fix:
- Add a sending state to disable the “Send Request” button while posting.

Example:
```js path=null start=null
const [sending, setSending] = useState(false);

const sendMatchRequest = async (recipientId, matchedSkills) => {
  try {
    setSending(true);
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/api/matches/request', {
      recipientId,
      message: matchMessage,
      matchedSkills
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSelectedMatch(null);
    setMatchMessage('');
    await fetchData();
  } catch (err) {
    // ... robust error handling as above
  } finally {
    setSending(false);
  }
};

// In the modal button
<button
  className="send-btn"
  onClick={() => sendMatchRequest(selectedMatch._id, selectedMatch.matchedSkills)}
  disabled={sending || !matchMessage.trim()}
>
  {sending ? 'Sending...' : 'Send Request'}
</button>
```

3) Matches.jsx — handle 401s consistently in fetchData
Problem:
- On 401 from any of the three GETs, remain on page.

Fix:
```js path=/C:/Users/hardi/Documents/GitHub/Skill-Swap/client/src/pages/Matches.jsx start=40
    } catch (err) {
      console.error('Error fetching matches:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      setLoading(false);
    }
```

4) Optional: centralize API base URL
Problem:
- Repeated 'http://localhost:5000' strings; harder to configure per environment.

Fix:
- Create an axios instance (e.g., client/src/api/http.js) using an environment variable (e.g., VITE_API_BASE_URL) and import it in pages.

Example instance:
```js path=null start=null
// client/src/api/http.js
import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;
```

Then replace axios.get/post(...) with http.get/post(...), and use relative paths like /api/matches/request.


Verification checklist
- Try sending a request with:
  - invalid recipientId (expect 400 with helpful msg)
  - recipientId == current user id (expect 400)
  - matchedSkills length > 5 (should no longer 500; capped to 100)
  - duplicate request (expect 400 consistent msg)
- New user with no skills should be able to load potential matches (0 results, no 500).
- Frontend shows error messages on failures and prevents double-submit.

If you want, I can apply these changes directly in the codebase. Let me know and I’ll proceed with the edits.

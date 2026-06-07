const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * GET /api/ice-servers
 *
 * Returns ICE server configuration for WebRTC.
 *
 * If TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars are set, it creates
 * a token via Twilio's STUN/TURN REST API which returns ephemeral credentials.
 * Otherwise, returns fallback servers from ICE_SERVERS env var or Google STUN.
 *
 * Twilio NTS setup:
 *   1. Sign up at https://www.twilio.com/console
 *   2. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env
 *   3. This endpoint auto-creates tokens with 1-hour TTL
 *
 * Fallback ICE_SERVERS env var format (JSON):
 *   '[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:your-turn.com:3478","username":"user","credential":"pass"}]'
 */

// In-memory cache for Twilio ICE servers (TTL: 50 minutes)
let cachedIceServers = null;
let cacheExpiry = 0;

router.get('/', async (req, res) => {
  try {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;

    if (twilioSid && twilioToken) {
      const now = Date.now();

      // Return cached value if still valid
      if (cachedIceServers && now < cacheExpiry) {
        return res.json({ iceServers: cachedIceServers, source: 'twilio-cached' });
      }

      // Create a new token via Twilio STUN/TURN REST API
      // POST /2010-04-01/Accounts/{AccountSid}/Tokens.json
      const tokenUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Tokens.json`;
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'Ttl=3600', // 1 hour TTL
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ice_servers && data.ice_servers.length > 0) {
          // Normalize: Twilio returns both 'url' and 'urls', some with 'credential' not 'password'
          // WebRTC standard expects 'urls' and 'username'/'credential'
          const servers = data.ice_servers.map(s => ({
            urls: s.urls || s.url,
            username: s.username,
            credential: s.credential,
          }));
          cachedIceServers = servers;
          cacheExpiry = now + 50 * 60 * 1000; // 50 min TTL
          logger.info(`Fetched fresh ICE servers from Twilio NTS (${servers.length} servers)`);
          return res.json({ iceServers: servers, source: 'twilio' });
        }
      } else {
        const errText = await response.text();
        logger.warn(`Twilio token creation failed: ${response.status} ${errText}`);
      }
    }

    // Fallback: ICE_SERVERS env var (JSON array)
    const fallback = process.env.ICE_SERVERS;
    if (fallback) {
      try {
        const servers = JSON.parse(fallback);
        if (Array.isArray(servers) && servers.length > 0) {
          return res.json({ iceServers: servers, source: 'env' });
        }
      } catch (e) {
        logger.warn('Failed to parse ICE_SERVERS env var:', e.message);
      }
    }

    // Last resort: Google STUN only (no TURN)
    logger.warn('No TURN server configured. Returning Google STUN only. WebRTC may fail for users behind symmetric NAT.');
    return res.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      source: 'stun-only',
    });
  } catch (error) {
    logger.error('Error in /api/ice-servers:', error);
    res.status(500).json({ error: 'Failed to fetch ICE server configuration' });
  }
});

module.exports = router;

# SkillSwap - Deployment Guide (2026 Edition)

This is the **modern, recommended** way to deploy SkillSwap.

The old `DEPLOYMENT_GUIDE.md` (GCP e2-micro + manual Docker) is still present for historical reasons but is no longer the easiest path.

## Recommended Stack

- **Platform**: Railway (best free tier + addons for this stack)
- **Database**: MongoDB Atlas (free tier) or Railway's Mongo (if available)
- **Cache / Realtime**: Redis (Railway addon or Upstash)
- **Single Docker image**: The root `Dockerfile` builds:
  - React frontend → static files
  - Node/Express + Socket.io backend
  - Nginx that serves the frontend and proxies `/api` + `/socket.io` to the backend on port 5000
- This single-container model is perfect for Railway / Render / Fly.

---

## 1. One-Time Setup

### A. Prepare Secrets Locally (do this once)

```bash
# Generate two different strong secrets
openssl rand -base64 48
openssl rand -base64 48
```

You will need:
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET` (must be different)

### B. MongoDB Atlas (Free Tier)

1. Create a free cluster.
2. Create a database user with "Read and write to any database".
3. In Network Access, add `0.0.0.0/0` (Allow access from anywhere) — acceptable for small apps.
4. Get the connection string (Drivers → Node.js).

Example:
```
mongodb+srv://skillswapAdmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/SkillSwapDB?retryWrites=true&w=majority
```

### C. (Optional but recommended) Twilio TURN

For reliable video calls behind strict NAT/firewalls, sign up for Twilio Network Traversal Service (free tier exists) and get:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

---

## 2. Deploy to Railway (Fastest)

1. Push the repo to GitHub.
2. In Railway:
   - New Project → Deploy from GitHub repo → select this repo.
   - Create a new service and set the **root directory** to the repo root (or let it detect the root `Dockerfile`).
3. Add services:
   - Redis (official plugin)
4. In the main app service, set these environment variables:

   ```
   NODE_ENV=production
   PORT=5000                 # Railway will override this with its own PORT
   CLIENT_URL=https://your-app.up.railway.app

   MONGO_URI=your-atlas-connection-string

   REDIS_URL=${{Redis.REDIS_URL}}
   REDIS_HOST=${{Redis.REDISHOST}}
   REDIS_PORT=${{Redis.REDISPORT}}

   JWT_SECRET=<the long random one you generated>
   REFRESH_TOKEN_SECRET=<different long random one>

   # Optional
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   ```

5. Deploy.

The root `Dockerfile` already handles Railway's dynamic port injection correctly (nginx listens on `$PORT`, Node runs on 5000 internally, nginx proxies `/api` and `/socket.io`).

---

## 3. Environment Variables Reference

See `.env.production.example` at the repo root for a clean template.

**Critical ones**:
- `MONGO_URI`
- `JWT_SECRET` + `REFRESH_TOKEN_SECRET` (different!)
- `REDIS_URL` / host+port
- `CLIENT_URL` (for CORS)

---

## 4. GitHub Actions (CI)

We created `.github/workflows/ci-cd.yml` that runs on every push/PR:

- `test-server`: Starts Mongo, installs, lints, runs `npm test` in `server/`
- `test-client`: Installs, lints, builds the Vite React app
- `build-monolith-docker`: On `main` only — builds the exact production Docker image that Railway will use, to prove it builds cleanly from git.

This prevents broken deploys.

---

## 5. Docker Details (What the Root Dockerfile Does)

- Stage 1: `node:18-alpine` → builds the React app (`npm ci && VITE_API_URL="" npm run build`)
- Stage 2: `node:18-alpine` → installs only production server deps
- Stage 3 (final): `node:18-alpine` + installs nginx
  - Copies built client to `/usr/share/nginx/html`
  - Copies server code + node_modules
  - Uses a small `start.sh` that:
    - Rewrites nginx to listen on `${PORT:-80}`
    - Starts nginx in background
    - Starts `node server.js` on internal port 5000
  - Proxies `/api` and `/socket.io` through nginx to localhost:5000

This is why you only need **one service** on Railway even though it's a full MERN + WebRTC app.

`.dockerignore` is hardened to keep the image small and avoid copying secrets.

---

## 6. Alternative Deployment Options

- **Render.com**: Can use the same Dockerfile. Add a Redis instance. Free web services sleep after inactivity.
- **Fly.io**: Excellent for global low-latency. Use the Dockerfile. You can add Redis via Fly or Upstash.
- **Separate services** (advanced): Use `docker-compose.prod.yml` style (separate `client`, `server`, `redis` containers). More moving parts; only worth it if you need to scale frontend and backend independently.

---

## 7. Security & Hardening Notes

- Never commit real `.env` or `server/.env` (we've updated `.gitignore`).
- Use different `JWT_SECRET` and `REFRESH_TOKEN_SECRET`.
- In production, set `CLIENT_URL` to your actual domain and consider tightening CORS in `server/`.
- For video calls, Twilio TURN dramatically improves success rate.
- The app already has `helmet`, rate limiting, and input sanitization — keep them enabled.

---

## 8. Local Production-like Testing

You can test the exact production Docker image locally:

```bash
docker build -t skillswap-local .
docker run -p 8080:80 \
  -e MONGO_URI=... \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e JWT_SECRET=... \
  -e REFRESH_TOKEN_SECRET=... \
  skillswap-local
```

Then open http://localhost:8080.

---

## 9. Custom Domain + HTTPS

- On Railway: Project → Settings → Domains → add custom domain. They handle SSL.
- Update `CLIENT_URL` env var to the custom domain.
- If using Mongo Atlas, you can restrict the IP later once you have a stable outbound IP (or keep `0.0.0.0/0` for small apps).

---

## 10. Common Issues & Fixes

- **White screen / frontend not loading**: Check that the nginx proxy is working. Look at Railway logs for "nginx" and "node".
- **Video calls fail**: Almost always a TURN / NAT issue. Add Twilio credentials.
- **Socket.io disconnects**: Make sure the proxy for `/socket.io` has `proxy_read_timeout 86400;` (already in the nginx.conf).
- **Mongo connection fails**: Double-check the connection string has the correct database name and that the user has read/write permissions.
- **Secrets showing in logs**: Never. We don't log secrets. If you accidentally committed one, rotate it immediately and remove from git history.

---

## 11. What Still Needs Your Manual Steps

I (the agent) have done everything that can be done in the repo:

- Hardened `.gitignore` + `.dockerignore`
- Created proper multi-stage root Dockerfile (already existed and was good)
- Created `.env.production.example`
- Created GitHub Actions CI that actually tests + verifies the Docker build
- Wrote this clean deployment guide

**You still need to**:
1. Create the Railway project.
2. Add Redis.
3. Paste the secrets and `MONGO_URI` into the Railway dashboard.
4. (Optional) Add Twilio credentials.
5. Push to `main` after reviewing the new CI workflows.

Once those are done, every future push to `main` will be automatically tested and can be deployed with one click (or auto-deploy if you enable it).

---

You're in a very good state now. The repo is production-deployment-ready from a code + config perspective.

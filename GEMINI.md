# Skill-Swap: Project Overview & Developer Guide

Skill-Swap is a peer-to-peer skill exchange platform designed to democratize education by allowing users to teach and learn from each other through real-time video calls, chat, and collaborative tools.

## 🚀 Project Overview

- **Core Purpose:** A P2P marketplace for knowledge exchange using a "Time Banking" concept.
- **Key Features:**
  - **Real-time Communication:** Video calling (WebRTC), Chat (Socket.io).
  - **Collaboration:** Interactive Whiteboard (Fabric.js).
  - **Matching:** AI-driven matching algorithm based on skills and compatibility.
  - **Gamification:** Badges, ratings, and reviews.
- **Architecture:** Monorepo-style structure with separate `client/` (Frontend) and `server/` (Backend) directories.

## 🛠 Tech Stack

### Frontend (`/client`)
- **Framework:** React 18.2.0 (Vite)
- **Styling:** Tailwind CSS 4.x & Modular CSS
- **Real-time:** Socket.io-client
- **WebRTC:** PeerJS & Simple-Peer
- **Animation:** Framer Motion
- **Canvas:** Fabric.js
- **Testing:** Vitest & React Testing Library

### Backend (`/server`)
- **Environment:** Node.js (Express 4.21.2)
- **Database:** MongoDB (Mongoose)
- **Caching/Real-time:** Redis & Socket.io
- **Security:** Helmet, Express Rate Limit, BcryptJS
- **Auth:** JWT (JSON Web Tokens)
- **Testing:** Jest & Supertest

## 🏃 Building and Running

### Prerequisites
- Node.js v14+
- MongoDB v4.4+
- Redis (optional for local dev, recommended for features)

### Local Development
1. **Server:**
   ```bash
   cd server
   npm install
   cp .env.example .env # Configure variables
   npm run dev
   ```
2. **Client:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

### Docker
```bash
docker-compose up --build
```

## 🧪 Testing and Quality

- **Mandate:** Test-Driven Development (TDD) is required for all new features.
- **Coverage Target:** >80% code coverage.
- **Commands:**
  - **Client:** `npm test` (Vitest)
  - **Server:** `npm test` (Jest)
  - **Linting:** `npm run lint` (ESLint)

## 📋 Development Workflow (Conductor)

This project uses the **Conductor** workflow for task management.
- **Source of Truth:** `conductor/tracks/<track_id>/plan.md`
- **Track Registry:** `conductor/tracks.md`
- **Key Principles:**
  1. Update `plan.md` status (`[ ]` -> `[~]` -> `[x]`) for every task.
  2. Write failing tests BEFORE implementation (Red/Green/Refactor).
  3. Attach task summaries to commits using `git notes`.
  4. Follow the **Checkpointing Protocol** at the end of each phase.

## 📁 Project Structure
- `client/`: React application.
- `server/`: Express API and Socket.io handlers.
- `conductor/`: Project management, track plans, and style guides.
- `docs/`: Extensive project documentation and reports.
- `.stitch/`: Design assets and screen definitions.

## 📜 Coding Conventions
- **Client:** Uses ES Modules (`import/export`).
- **Server:** Uses CommonJS (`require/module.exports`).
- **Commits:** Follow Conventional Commits (e.g., `feat(scope): description`).
- **Documentation:** All public functions should have JSDoc comments.

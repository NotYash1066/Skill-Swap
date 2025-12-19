# SkillSwap - Peer-to-Peer Skill Exchange Platform
## Project Report

**Author:** Yash Karthiya  
**Repository:** https://github.com/NotYash1066/Skill-Swap  
**Date:** November 2024  
**Version:** 1.0.0

---

## 1. INTRODUCTION

### 1.1 Problem Definition

In today's rapidly evolving world, individuals possess diverse skills but often lack platforms to exchange knowledge effectively. Traditional learning methods are expensive, time-consuming, and lack personalization. There is a need for a peer-to-peer platform where users can:

- **Teach skills they excel at** to others
- **Learn new skills** from peers without monetary transactions
- **Connect with like-minded individuals** based on skill compatibility
- **Engage in real-time collaboration** through video calls and interactive tools

**SkillSwap** addresses this gap by creating a community-driven platform for mutual skill exchange.

### 1.2 Objectives

The primary objectives of SkillSwap are:

1. **User Management**: Secure registration, authentication, and profile management
2. **Skill Matching**: Algorithm-based matching system with compatibility scoring
3. **Real-time Communication**: Instant messaging with typing indicators
4. **Video Collaboration**: WebRTC-based peer-to-peer video calls
5. **Interactive Tools**: Collaborative whiteboard for visual demonstrations
6. **Session Management**: Schedule and track skill exchange sessions
7. **Verification System**: Badge-based skill verification and credibility
8. **Progress Tracking**: XP-based gamification with achievements
9. **Notification System**: Real-time alerts for messages and match events
10. **Review System**: Rate and review skill exchange partners

### 1.3 Scope

**Included Features:**
- User authentication with JWT and refresh tokens
- Password reset via email
- Advanced skill matching with filters (rating, location, availability)
- Real-time chat with Socket.io
- WebRTC video calling with screen sharing
- Collaborative whiteboard using Fabric.js
- Session scheduling and management
- Skill verification badges (verified, expert, mentor)
- Progress tracking with XP and achievements
- Push notifications
- User reviews and ratings
- Redis caching for performance optimization
- Rate limiting and security headers
- Docker containerization
- CI/CD pipeline with GitHub Actions

**Target Users:**
- Students seeking peer learning
- Professionals wanting to exchange expertise
- Hobbyists looking to share and learn skills
- Remote workers seeking collaboration

**Use Cases:**
- A web developer teaches React in exchange for learning graphic design
- A musician teaches guitar in exchange for learning music production
- A chef teaches cooking in exchange for learning photography

**Excluded:**
- Monetary transactions or payment processing
- Mobile native applications (web-only)
- AI-powered skill recommendations
- Group video calls (only 1-on-1 supported)

---

## 2. SYSTEM REQUIREMENTS

### 2.1 Hardware Requirements

**Minimum Configuration:**
- **Processor**: Intel Core i3 or equivalent (2.0 GHz)
- **RAM**: 4 GB
- **Storage**: 500 MB free space
- **Network**: Broadband internet connection (2 Mbps)
- **Webcam**: Optional (for video calls)
- **Microphone**: Optional (for video calls)

**Recommended Configuration:**
- **Processor**: Intel Core i5 or higher (2.5 GHz+)
- **RAM**: 8 GB or more
- **Storage**: 1 GB free space
- **Network**: High-speed internet (10 Mbps+)
- **Webcam**: HD webcam (720p or higher)
- **Microphone**: Quality microphone or headset

### 2.2 Software Requirements

**Development Environment:**

**Backend:**
- **Runtime**: Node.js v14+ (v18 recommended)
- **Database**: MongoDB v4.4+
- **Cache**: Redis v6.0+ (optional)
- **Package Manager**: npm v6+ or yarn

**Frontend:**
- **Build Tool**: Vite v4.2.0
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

**Operating System:**
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+, Debian, CentOS)

**Additional Tools:**
- Git for version control
- Docker v20+ (for containerization)
- Postman/Thunder Client (for API testing)

### 2.3 Technology Stack

**Frontend Technologies:**
```
- React 18.2.0 (UI library)
- Vite (build tool)
- React Router DOM 6.8.1 (routing)
- Axios 1.3.4 (HTTP client)
- Socket.io Client 4.6.1 (WebSocket)
- Simple-Peer 9.11.1 (WebRTC)
- PeerJS 1.5.5 (WebRTC wrapper)
- Fabric.js 6.7.1 (canvas/whiteboard)
- Framer Motion 12.23.16 (animations)
- React Icons 5.5.0 (icons)
- Quill 2.0.3 (rich text editor)
```

**Backend Technologies:**
```
- Express 4.21.2 (web framework)
- Mongoose 8.9.3 (MongoDB ODM)
- Socket.io 4.8.1 (WebSocket server)
- JWT (jsonwebtoken 9.0.2) (authentication)
- Bcrypt.js 2.4.3 (password hashing)
- Nodemailer 7.0.10 (email service)
- Redis 5.9.0 (caching)
- Helmet 8.1.0 (security headers)
- Express Rate Limit 8.0.1 (rate limiting)
- Express Validator 7.2.0 (input validation)
- Multer 2.0.2 (file uploads)
- CORS 2.8.5 (cross-origin requests)
```

**Database:**
```
- MongoDB (NoSQL database)
- Redis (in-memory cache)
```

**DevOps & Testing:**
```
- Jest 30.2.0 (testing framework)
- Supertest 7.1.4 (API testing)
- Docker (containerization)
- Docker Compose (orchestration)
- GitHub Actions (CI/CD)
- Nodemon 3.1.10 (development)
```

### 2.4 Dependencies Summary

**Total Dependencies:**
- Backend: 14 production + 3 development = 17
- Frontend: 11 production + 7 development = 18
- **Total: 35 packages**


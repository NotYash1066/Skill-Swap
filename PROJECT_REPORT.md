# Project Report: SkillSwap

## Introduction

SkillSwap is a peer-to-peer skill exchange platform where users can teach and learn skills from each other through real-time video calls, chat, and collaborative tools.

## Problem Definition

The project aims to solve the difficulty of connecting people who want to learn new skills with those who are willing to teach them, providing an interactive and real-time platform for skill exchange.

## Objectives

The main goals and deliverables of the project are:
- To provide a secure and reliable platform for users to register, log in, and manage their profiles.
- To implement a skill-matching system that connects users based on their skills and interests.
- To enable real-time communication through chat and video calls.
- To offer a collaborative whiteboard for interactive learning sessions.
- To ensure a positive user experience with features like push notifications, user reviews, and advanced search functionality.

## Scope

### What’s Included
- Secure user authentication (registration and login)
- Skill matching with compatibility scores
- Real-time chat and video calling
- Collaborative whiteboard
- Push notifications
- User profiles with ratings and reviews
- Advanced search and filtering options

### What’s Excluded
- Payment gateways for paid tutoring
- Group video call sessions
- Advanced content management systems

### Target Users
- Individuals looking to learn new skills from experienced users.
- Experts or skilled individuals willing to teach and share their knowledge.

### Use Cases
- Users can register, add their skills, and find potential matches.
- Users can send, receive, and manage match requests.
- Users can communicate with their connections through real-time chat and video calls.
- Users can use a collaborative whiteboard for demonstrations.
- Users can provide feedback by rating and reviewing their partners.

## System Requirements

### Hardware
- **RAM:** 1 GB
- **CPU:** 1 GHz

### Software
- **Operating System:** Cross-platform (Windows, macOS, Linux)
- **Node.js Version:** 14+
- **Database:** MongoDB v4.4+

#### Backend Dependencies
- **Express:** 4.21.2
- **Mongoose:** 8.9.3
- **Socket.io:** 4.8.1
- **JWT:** 9.0.2
- **Bcryptjs:** 2.4.3
- **Jest:** 30.2.0

#### Frontend Dependencies
- **React:** 18.2.0
- **Vite:** 4.2.0
- **Socket.io-client:** 4.6.1
- **Axios:** 1.3.4
- **React-router-dom:** 6.8.1
- **Simple-peer:** 9.11.1
- **Fabric.js:** 6.7.1

## System Design

### Architecture Diagram

```
[         Client (React)         ]
           |
           |-- HTTP (Axios) --> [     Backend (Node.js/Express)     ]
           |                        |
           |                        |-- WebSocket (Socket.io) --> [ MongoDB (Mongoose) ]
           |
           |-- WebSocket (Socket.io) --> [     Backend (Node.js/Express)     ]
```

### ER Diagram

```
[User]
- _id (PK)
- username
- email
- password
- bio
- avatar
- skillsOffered
- skillsSought
- rating

[Match]
- _id (PK)
- requester (FK to User)
- recipient (FK to User)
- status
- message

[ChatRoom]
- _id (PK)
- participants (FK to User)
- match (FK to Match)
- lastMessage (FK to Message)

[Message]
- _id (PK)
- chatRoom (FK to ChatRoom)
- sender (FK to User)
- content

[Review]
- _id (PK)
- reviewer (FK to User)
- reviewee (FK to User)
- match (FK to Match)
- rating
- comment
```

## Implementation

### Frontend
- **Framework:** React 18.2.0 with Vite
- **Components:**
  - `Login.jsx` & `Register.jsx`: Handle user authentication.
  - `Dashboard.jsx`: Main user dashboard.
  - `Matches.jsx`: Displays potential skill matches.
  - `Chat.jsx`: Real-time chat interface.
- **Routing:**
  - `react-router-dom` is used for navigation.
  - Protected routes are implemented to restrict access to authenticated users.
  - Main routes include `/login`, `/register`, `/dashboard`, `/matches`, and `/chat`.

### Backend
- **Server Logic:** Node.js with Express 4.21.2
- **APIs:**
  - `auth.js`: Handles user registration, login, and profile updates.
  - `matches.js`: Manages skill matching, requests, and responses.
  - `chat.js`: Facilitates real-time chat functionality.
  - `notifications.js`: Manages user notifications.
  - `reviews.js`: Handles user reviews and ratings.
- **Middleware:**
  - `error.js`: Centralized error handling.
  - `rateLimit.js`: Implements rate limiting to prevent abuse.
- **Authentication:**
  - JWT (JSON Web Tokens) are used to secure API endpoints.

### Database
- **Schema:** Mongoose is used to define the database schema for MongoDB.
- **Collections:**
  - `users`: Stores user information.
  - `matches`: Manages match requests and statuses.
  - `chatrooms`: Defines chat rooms and participants.
  - `messages`: Stores chat messages.
  - `reviews`: Contains user-submitted reviews and ratings.
- **Relationships:**
  - One-to-many relationship between `User` and `Match` (a user can have multiple matches).
  - One-to-one relationship between `Match` and `ChatRoom`.
  - One-to-many relationship between `ChatRoom` and `Message`.

### Integration
- **Frontend-Backend:** The React frontend communicates with the Node.js backend via a RESTful API using `axios` for HTTP requests.
- **Real-time Features:** `Socket.io` is used for real-time features like chat and notifications, with the client and server maintaining a persistent WebSocket connection.
- **Database-Backend:** The backend interacts with the MongoDB database through the `mongoose` ODM, performing CRUD operations based on the API requests.

## Results & Output

### API Responses

**`POST /api/auth/login`**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d0fe4f5b37bc2e38c6b71a",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**`GET /api/matches/potential`**
```json
[
  {
    "_id": "60d0fe4f5b37bc2e38c6b71b",
    "username": "matchuser",
    "skillsOffered": ["JavaScript", "React"],
    "skillsSought": ["Node.js"],
    "compatibilityScore": 85
  }
]
```

### Database Snapshots

**`users` Collection**
```json
{
  "_id": "60d0fe4f5b37bc2e38c6b71a",
  "username": "testuser",
  "email": "test@example.com",
  "skillsOffered": ["Node.js"],
  "skillsSought": ["React", "JavaScript"]
}
```

**`matches` Collection**
```json
{
  "_id": "60d0fe4f5b37bc2e38c6b71c",
  "requester": "60d0fe4f5b37bc2e38c6b71a",
  "recipient": "60d0fe4f5b37bc2e38c6b71b",
  "status": "accepted"
}
```

## Testing

### Backend Testing
- **Framework:** Jest is used for backend testing.
- **API Testing:** `supertest` is used to test the API endpoints.
- **Test Coverage:** The `auth.test.js` file includes tests for user registration and login, ensuring the authentication system is working correctly.

### Frontend Testing
- No specific frontend testing frameworks or libraries were identified in the project's dependencies.

## Limitations

- **Frontend Testing:** The project lacks a dedicated frontend testing suite.
- **Scalability:** The current implementation might face scalability issues with a large number of concurrent users, particularly with video calls and whiteboard usage.

## Future Enhancements

- **Expanded Test Coverage:** Add more tests to cover the matches, chat, and reviews APIs.
- **End-to-End Testing:** Implement end-to-end tests to simulate full user flows.
- **Image Optimization:** Compress uploaded avatars to improve performance.
- **Whiteboard History:** Add version control for whiteboard states to allow users to undo/redo actions.
- **Frontend Development:**
  - **Password Reset Flow:** Create a user interface for password reset functionality.
  - **Session Scheduler:** Develop a session scheduler with a calendar view.
  - **Progress Dashboard:** Implement a dashboard to track user progress and achievements.

## Conclusion

SkillSwap is a comprehensive peer-to-peer skill exchange platform that successfully integrates real-time communication features with a robust backend. The project demonstrates a strong understanding of the MERN stack, real-time technologies like WebRTC and Socket.io, and secure authentication practices.

## References

- **React:** https://reactjs.org/
- **Node.js:** https://nodejs.org/
- **Express:** https://expressjs.com/
- **MongoDB:** https://www.mongodb.com/
- **Socket.io:** https://socket.io/
- **WebRTC:** https://webrtc.org/

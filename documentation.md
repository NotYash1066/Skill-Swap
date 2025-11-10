# SkillSwap Documentation

This document provides a detailed overview of the SkillSwap application's architecture, codebase, and features. It is intended for developers and contributors to understand the project's inner workings.

## 1. Project Overview

SkillSwap is a peer-to-peer skill exchange platform designed to connect users who want to learn new skills with those who can teach them. The platform facilitates this exchange through real-time video calls, chat, and collaborative tools. The core of the application is to provide a seamless and interactive learning experience.

## 2. Technologies Used

The project is a full-stack application with a clear separation between the frontend and backend.

### 2.1. Backend

*   **Runtime Environment:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB with Mongoose ODM
*   **Real-time Communication:** Socket.io
*   **Authentication:** JSON Web Tokens (JWT)
*   **Password Hashing:** Bcrypt.js
*   **Security:** Helmet.js for security headers, express-validator for input validation, and rate-limiting middleware.

### 2.2. Frontend

*   **Framework:** React 18.2.0
*   **Build Tool:** Vite
*   **Real-time Communication:** Socket.io Client
*   **Video Calling:** WebRTC (via Simple-Peer & PeerJS)
*   **Collaborative Whiteboard:** Fabric.js
*   **Animations:** Framer Motion
*   **HTTP Requests:** Axios
*   **Routing:** React Router

## 3. Codebase Structure

The project is organized into two main directories: `client` and `server`.

```
Skill-Swap/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── styles/        # CSS files
│   └── package.json
├── server/                # Express backend
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── socketHandlers/   # Socket.io handlers
│   ├── utils/            # Utility functions
│   └── server.js
└── documentation.md
```

## 4. Detailed Documentation: Backend

The backend is responsible for handling business logic, data persistence, and real-time communication.

### 4.1. `server.js`

This is the entry point for the backend application. Its main responsibilities are:

*   Initializing the Express server and Socket.io.
*   Connecting to the MongoDB database.
*   Applying security middleware (Helmet, CORS, rate limiting).
*   Registering API routes.
*   Handling Socket.io connections for chat, notifications, and video calls.
*   Implementing global error handling.

### 4.2. `routes/`

This directory contains the API endpoints for the application.

*   `auth.js`: Handles user registration, login, profile updates, and JWT generation.
*   `matches.js`: Manages skill-based user matching and connection requests.
*   `chat.js`: Provides endpoints for retrieving chat rooms and messages.
*   `notifications.js`: Manages user notifications.
*   `reviews.js`: Handles the creation and retrieval of user reviews.

### 4.3. `models/`

This directory defines the Mongoose schemas for the database.

*   `User.js`: The primary model for user data, including profile information, skills, and authentication details. It includes indexes for performance and virtual fields for computed properties.
*   `ChatRoom.js`: Defines a chat room with participants and a record of the last message.
*   `Message.js`: Represents a single message within a chat room.

### 4.4. `socketHandlers/`

This directory contains the logic for real-time communication.

*   `videoHandler.js`: Manages the signaling for WebRTC video calls. It handles call initiation, acceptance, rejection, and the exchange of ICE candidates and SDP offers/answers.
*   The main `server.js` file also contains socket handlers for chat messages and notifications.

### 4.5. `middleware/`

This directory contains custom middleware for the Express application.

*   `auth.js`: Protects routes by verifying the JWT token in the request headers.
*   `rateLimit.js`: Implements rate limiting to prevent abuse of the API.
*   `inputValidation.js`: Provides functions for validating and sanitizing user input.
*   `error.js`: A centralized error handler for the application.

## 5. Detailed Documentation: Frontend

The frontend is a single-page application (SPA) built with React.

### 5.1. `main.jsx` and `App.jsx`

*   `main.jsx`: The entry point for the React application. It renders the root `App` component into the DOM.
*   `App.jsx`: The root component of the application. It sets up the main application structure, including:
    *   **Routing:** Uses React Router to define the application's pages and protect routes based on authentication status.
    *   **Context Providers:** Wraps the application with `ThemeProvider` and `VideoCallProvider` to provide global state for theme and video call functionality.
    *   **Global Components:** Renders global components like `GlobalVideoCall` that need to be accessible from anywhere in the app.

### 5.2. `pages/`

This directory contains the main page components of the application.

*   `Login.jsx`: The user login page.
*   `Register.jsx`: The user registration page.
*   `Dashboard.jsx`: The main user dashboard, displayed after login.
*   `Matches.jsx`: A page for viewing potential skill matches.
*   `Chat.jsx`: The main interface for real-time chat.

### 5.3. `components/`

This directory contains reusable components used throughout the application.

### 5.4. `contexts/`

This directory contains React Contexts for managing global state.

*   `ThemeContext.jsx`: Manages the application's theme.
*   `VideoCallContext.jsx`: Manages the state of the video call.

### 5.5. `services/`

This directory would contain functions for making API requests to the backend, abstracting the logic of interacting with the server.

## 6. Key Features

### 6.1. Real-time Video Calling (WebRTC)

The video calling feature is implemented using WebRTC. The process is as follows:

1.  **Initiation:** A user initiates a call to another user.
2.  **Signaling:** The `videoHandler.js` on the server uses Socket.io to send a call invitation to the target user.
3.  **Connection:** If the call is accepted, the server facilitates the exchange of session descriptions (SDP) and network information (ICE candidates) between the two peers.
4.  **Peer-to-Peer:** Once the connection is established, the video and audio data are streamed directly between the users' browsers.

### 6.2. Skill Matching

The backend has routes for getting potential matches and sending/receiving match requests. The specific algorithm for matching is contained within the `matches` and `matchesEnhanced` routes.

### 6.3. Real-time Chat

The chat functionality is built on Socket.io.

1.  When a user connects, they join Socket.io rooms corresponding to their chat rooms.
2.  When a message is sent, it is emitted to the server, saved to the database, and then broadcast to all users in that chat room.
3.  The server also handles typing indicators and sends notifications for new messages.

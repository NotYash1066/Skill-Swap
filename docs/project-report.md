# Project Report: SkillSwap

## 1. Introduction

### Problem Definition
In a world of specialized knowledge, individuals often seek to learn new skills but lack a direct and interactive way to connect with experts. Similarly, those with valuable skills may not have a simple platform to share their expertise and connect with learners. SkillSwap addresses this gap by providing a peer-to-peer skill exchange platform where users can both teach and learn from each other in a dynamic, real-time environment.

### Objectives
The main goal of SkillSwap is to create a seamless and engaging platform for skill exchange. The key deliverables include:
- A secure user authentication system for managing user profiles.
- A skill-matching feature to connect learners and teachers.
- Real-time communication tools, including chat and video calling.
- A collaborative whiteboard for interactive learning sessions.
- A system for user ratings and reviews to build trust and credibility.

### Scope
- **Included:** User registration/login, profile management, skill listing, user matching, real-time chat, video calls, and a collaborative whiteboard.
- **Excluded:** Payment processing, course scheduling, and group sessions are not included in the current version.
- **Target Users:** Individuals looking to learn new skills or share their expertise with others.
- **Use Cases:** A student seeking help with a programming problem can connect with a software developer for a one-on-one video session. A graphic designer can teach illustration techniques to an aspiring artist using the collaborative whiteboard.

## 2. System Requirements

### Hardware
- **Minimum:** 2GB RAM, 2-core CPU.
- **Recommended:** 4GB RAM, 4-core CPU for a smoother experience, especially during video calls.

### Software
- **Operating System:** Any modern OS (Windows, macOS, Linux).
- **Web Browser:** Latest version of Chrome, Firefox, or Safari.
- **Backend:** Node.js v14+, MongoDB v4.4+.
- **Frontend:** npm or yarn for package management.

## 3. System Design

### Architecture Diagram
SkillSwap is built on a client-server architecture. The frontend is a React-based single-page application, and the backend is a Node.js/Express server. They communicate via a RESTful API and WebSockets.

- **Client:** The React application handles the user interface and interacts with the backend through API calls and Socket.io for real-time updates.
- **Server:** The Express server manages business logic, user data, and real-time communication. It connects to a MongoDB database for data persistence.
- **Database:** MongoDB stores user profiles, skills, chat messages, and other application data.
- **Real-time Communication:** Socket.io is used for chat, notifications, and signaling for WebRTC video calls.

### ER Diagram / Database Schema
The database consists of several collections, with the `User` collection being the most central.

- **User Collection:**
  - `username`, `email`, `password`
  - `bio`, `avatar`, `location`
  - `skillsOffered`, `skillsSought`
  - `rating`, `reviewCount`
- **ChatRoom Collection:**
  - `participants` (array of User IDs)
  - `lastMessage` (reference to Message)
- **Message Collection:**
  - `chatRoom` (reference to ChatRoom)
  - `sender` (reference to User)
  - `content`

### Wireframes / UI Mockups
The UI is designed to be intuitive and user-friendly.
- **Dashboard:** Displays user information, suggested matches, and recent activity.
- **Matches Page:** Shows a list of potential users to connect with, based on skill compatibility.
- **Chat Interface:** A standard messaging interface with a list of contacts and a chat window for each conversation.
- **Video Call View:** A full-screen video interface with controls for audio, video, and access to the collaborative whiteboard.

## 4. Implementation

### Frontend
The frontend is built with React and Vite. Key components include:
- **`App.jsx`:** The main component that sets up routing and global context providers.
- **`pages/`:** Components for each main page, such as `Dashboard`, `Matches`, and `Chat`.
- **`components/`:** Reusable UI elements like buttons, modals, and user profile cards.
- **`contexts/`:** React contexts for managing global state, such as `ThemeContext` and `VideoCallContext`.
- **`services/`:** Functions for making API calls to the backend.

### Backend
The backend is a Node.js application using the Express framework.
- **`server.js`:** The entry point that initializes the server, database connection, and WebSocket handlers.
- **`routes/`:** Defines the API endpoints for authentication, matching, chat, etc.
- **`models/`:** Mongoose schemas for the database collections.
- **`socketHandlers/`:** Logic for handling real-time events, including video call signaling.
- **`middleware/`:** Custom middleware for authentication, rate limiting, and error handling.

### Database
MongoDB is used as the database, with Mongoose as the ODM. The `User` schema is central and includes fields for profile information, skills, and ratings.

### Integration
The frontend and backend are tightly integrated. The React client makes API calls to the Express server for data and uses Socket.io to maintain a persistent connection for real-time features.

## 5. Results & Output

### Screenshots
- **Login/Register Page:** Clean and simple forms for user authentication.
- **Dashboard:** A personalized dashboard with user stats and suggested matches.
- **Chat Window:** A real-time chat interface with typing indicators.
- **Video Call:** A peer-to-peer video call with a collaborative whiteboard.

### API responses & Database snapshots
- **API Response Example (`/api/auth/me`):**
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "skillsOffered": ["JavaScript", "React"],
    "skillsSought": ["Node.js"]
  }
  ```
- **Database Snapshot (User Document):**
  ```json
  {
    "_id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "password": "hashed_password",
    "skillsOffered": ["javascript", "react"],
    "skillsSought": ["node.js"]
  }
  ```

## 6. Testing
- **Unit Tests:** The backend includes unit tests for the authentication API endpoints, written with Jest and Supertest.
- **API Testing:** The API can be tested using tools like Postman or Thunder Client to ensure that all endpoints are working as expected.

## 7. Limitations
- **Scalability:** The current implementation is designed for a small to medium number of users. For a larger user base, the server and database would need to be optimized for scalability.
- **Security:** While basic security measures are in place, a production application would require a more comprehensive security audit.
- **Incomplete Features:** The collaborative whiteboard is a core concept but may have limited functionality in the initial version.

## 8. Future Enhancements
- **Payment Integration:** To allow users to charge for their teaching sessions.
- **Group Sessions:** To enable one-to-many teaching sessions.
- **Advanced Search:** To provide more detailed filtering options for finding matches.
- **Mobile App:** A native mobile application for iOS and Android.

## 9. Conclusion
SkillSwap is a robust platform for peer-to-peer skill exchange. The project demonstrates a strong understanding of full-stack development, including a modern frontend with React, a secure backend with Node.js/Express, and real-time communication with WebSockets and WebRTC. The development process provided valuable experience with these technologies and highlighted the importance of a well-structured and scalable architecture.

## 10. References
- **Node.js:** https://nodejs.org/
- **React:** https://reactjs.org/
- **Socket.io:** https://socket.io/
- **WebRTC:** https://webrtc.org/
- **MongoDB:** https://www.mongodb.com/
- **GitHub Repository:** https://github.com/NotYash1066/Skill-Swap

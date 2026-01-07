# SkillSwap

A peer-to-peer skill exchange platform where users can teach and learn skills from each other through real-time video calls, chat, and collaborative tools.

## Features

### Core Features
- **User Authentication** - Secure registration and login with JWT
- **Skill Matching** - Algorithm-based matching with compatibility scores
- **Real-time Chat** - Instant messaging with typing indicators
- **Video Calling** - WebRTC-based peer-to-peer video calls
- **Collaborative Whiteboard** - Real-time drawing and annotation
- **Push Notifications** - Instant alerts for messages and match events
- **User Profiles** - Rich profiles with avatars, ratings, and reviews
- **Advanced Search** - Filter by location, availability, and rating

### Tech Stack

**Frontend:**
- React 18.2.0 with Vite
- Socket.io Client for real-time communication
- Simple-Peer & PeerJS for WebRTC
- Fabric.js for whiteboard
- Framer Motion for animations
- Axios for HTTP requests

**Backend:**
- Node.js with Express 4.21.2
- MongoDB with Mongoose ODM
- Socket.io for WebSocket connections
- JWT for authentication
- Bcrypt for password hashing

## Installation

### Prerequisites
- Node.js v14+
- MongoDB v4.4+
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/NotYash1066/Skill-Swap.git
cd Skill-Swap
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

4. **Configure environment variables**

Create `server/.env`:
```env
MONGO_URI=mongodb://localhost:27017/SkillSwapDB
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

5. **Start MongoDB**
```bash
mongod
```

6. **Run the application**

Terminal 1 - Server:
```bash
cd server
npm run dev
```

Terminal 2 - Client:
```bash
cd client
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Docker Setup

1. **Build and start the containers**
```bash
docker-compose up --build
```

2. **Access the application**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Documentation

For detailed information about the project, please refer to the following documents located in the `docs/` directory:

- [Documentation Index](docs/DOCUMENTATION_INDEX.md) - **Start Here** for a complete guide to all documentation.
- [Report Summary](docs/REPORT_SUMMARY.md) - Executive summary and quick overview.
- [Complete Project Report](docs/COMPLETE_PROJECT_REPORT.md) - Comprehensive details on requirements, design, and implementation.
- [API Reference](docs/API_REFERENCE.md) - Detailed API endpoints and usage.
- [Architecture Diagrams](docs/ARCHITECTURE_DIAGRAMS.md) - System architecture and design diagrams.
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Instructions for deploying the application.

## Usage

1. **Register** - Create an account with username, email, and password
2. **Add Skills** - Specify skills you offer and skills you want to learn
3. **Find Matches** - Browse potential matches with compatibility scores
4. **Send Requests** - Connect with users by sending match requests
5. **Chat** - Message your connections in real-time
6. **Video Call** - Start face-to-face skill exchange sessions
7. **Collaborate** - Use whiteboard for visual demonstrations
8. **Review** - Rate and review your skill exchange partners

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/skills` - Update skills

### Matches
- `GET /api/matches/potential` - Get potential matches
- `POST /api/matches/request` - Send match request
- `GET /api/matches/received` - Get received requests
- `GET /api/matches/sent` - Get sent requests
- `PUT /api/matches/:id/respond` - Accept/reject request

### Chat
- `GET /api/chat/rooms` - Get chat rooms
- `GET /api/chat/rooms/:id/messages` - Get messages

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/user/:userId` - Get user reviews

## Project Structure

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
├── docs/                   # Project documentation and reports
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Authors

- Yash Karthiya - [@NotYash1066](https://github.com/NotYash1066)

## Acknowledgments

- WebRTC for peer-to-peer communication
- Socket.io for real-time features
- MongoDB for flexible data storage
- React community for excellent tools and libraries

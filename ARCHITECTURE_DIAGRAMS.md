# SkillSwap - Architecture Diagrams & Visual Documentation

## 1. System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                  │
│                     (React 18.2 + Vite 4.2)                           │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │   PAGES     │  │ COMPONENTS  │  │  SERVICES   │  │  CONTEXTS   ││
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤│
│  │ • Login     │  │ • UserCard  │  │ • API       │  │ • Auth      ││
│  │ • Register  │  │ • ChatBox   │  │ • Socket    │  │ • Socket    ││
│  │ • Dashboard │  │ • VideoCall │  │ • WebRTC    │  │ • Theme     ││
│  │ • Matches   │  │ • Whiteboard│  │             │  │             ││
│  │ • Chat      │  │ • Navbar    │  │             │  │             ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
│                                                                        │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              HTTP/REST      WebSocket    WebRTC P2P
              (Port 5000)   (Socket.io)  (STUN/TURN)
                    │            │            │
                    └────────────┼────────────┘
                                 │
┌────────────────────────────────┴──────────────────────────────────────┐
│                          SERVER LAYER                                  │
│                    (Node.js 18 + Express 4.21)                        │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │   ROUTES    │  │ MIDDLEWARE  │  │   SOCKET    │  │   UTILS     ││
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤│
│  │ • auth      │  │ • auth      │  │ • chat      │  │ • email     ││
│  │ • matches   │  │ • rateLimit │  │ • video     │  │ • tokens    ││
│  │ • chat      │  │ • cache     │  │ • whiteboard│  │ • validators││
│  │ • sessions  │  │ • error     │  │ • notify    │  │ • logger    ││
│  │ • badges    │  │ • validate  │  │             │  │             ││
│  │ • progress  │  │ • upload    │  │             │  │             ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
│                                                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      MODELS (Mongoose)                         │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ User • Match • ChatRoom • Message • Session • Badge           │  │
│  │ Progress • Notification • Review • WhiteboardState            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                 Mongoose     Redis Client  Nodemailer
                    │            │            │
                    └────────────┼────────────┘
                                 │
┌────────────────────────────────┴──────────────────────────────────────┐
│                        DATABASE LAYER                                  │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│  │         MongoDB              │  │          Redis               │ │
│  │    (Primary Database)        │  │      (Cache Layer)           │ │
│  ├──────────────────────────────┤  ├──────────────────────────────┤ │
│  │ • Users Collection           │  │ • Session Cache              │ │
│  │ • Matches Collection         │  │ • API Response Cache         │ │
│  │ • Messages Collection        │  │ • User Profile Cache         │ │
│  │ • Sessions Collection        │  │ • Match Results Cache        │ │
│  │ • Badges Collection          │  │ TTL: 5-10 minutes            │ │
│  │ • Progress Collection        │  │                              │ │
│  │ • Notifications Collection   │  │                              │ │
│  │ • Reviews Collection         │  │                              │ │
│  └──────────────────────────────┘  └──────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## 2. Database ER Diagram

```
┌─────────────┐
│    USER     │
├─────────────┤
│ _id (PK)    │◄──────────────────────────────────┐
│ username    │                                    │
│ email       │                                    │
│ password    │                                    │
│ skills[]    │                                    │
│ rating      │                                    │
└──────┬──────┘                                    │
       │                                           │
       │ 1:N                                       │
       │                                           │
       ▼                                           │
┌─────────────┐         1:1          ┌────────────┴────┐
│    MATCH    │◄─────────────────────┤   CHATROOM      │
├─────────────┤                      ├─────────────────┤
│ _id (PK)    │                      │ _id (PK)        │
│ requester   │──────┐               │ participants[]  │
│ recipient   │──────┤               │ match (FK)      │
│ status      │      │               │ lastMessage     │
│ score       │      │               └────────┬────────┘
└─────────────┘      │                        │
                     │                        │ 1:N
                     │                        │
                     │                        ▼
                     │               ┌─────────────────┐
                     │               │    MESSAGE      │
                     │               ├─────────────────┤
                     │               │ _id (PK)        │
                     │               │ chatRoom (FK)   │
                     │               │ sender (FK)     │
                     │               │ content         │
                     │               │ createdAt       │
                     │               └─────────────────┘
                     │
                     │               ┌─────────────────┐
                     └──────────────►│    SESSION      │
                                     ├─────────────────┤
                                     │ _id (PK)        │
                                     │ participants[]  │
                                     │ skill           │
                                     │ scheduledAt     │
                                     │ status          │
                                     └─────────────────┘

┌─────────────┐                      ┌─────────────────┐
│    BADGE    │                      │    PROGRESS     │
├─────────────┤                      ├─────────────────┤
│ _id (PK)    │                      │ _id (PK)        │
│ user (FK)   │──────────────────────┤ user (FK)       │
│ skill       │                      │ xp              │
│ type        │                      │ level           │
│ verifiedBy[]│                      │ achievements[]  │
└─────────────┘                      └─────────────────┘

┌──────────────┐                     ┌─────────────────┐
│ NOTIFICATION │                     │     REVIEW      │
├──────────────┤                     ├─────────────────┤
│ _id (PK)     │                     │ _id (PK)        │
│ user (FK)    │─────────────────────┤ reviewer (FK)   │
│ type         │                     │ reviewee (FK)   │
│ message      │                     │ rating          │
│ isRead       │                     │ comment         │
└──────────────┘                     └─────────────────┘
```

## 3. Request Flow Diagram

### 3.1 User Authentication Flow

```
┌────────┐                ┌────────┐                ┌──────────┐
│ Client │                │ Server │                │ Database │
└───┬────┘                └───┬────┘                └────┬─────┘
    │                         │                          │
    │ POST /api/auth/register │                          │
    ├────────────────────────►│                          │
    │  {username, email, pwd} │                          │
    │                         │                          │
    │                         │ Hash password (bcrypt)   │
    │                         │                          │
    │                         │ INSERT User              │
    │                         ├─────────────────────────►│
    │                         │                          │
    │                         │◄─────────────────────────┤
    │                         │  User document           │
    │                         │                          │
    │                         │ Generate JWT             │
    │                         │ (15min access token)     │
    │                         │ (7day refresh token)     │
    │                         │                          │
    │◄────────────────────────┤                          │
    │  {token, refreshToken,  │                          │
    │   user}                 │                          │
    │                         │                          │
    │ Store tokens in         │                          │
    │ localStorage            │                          │
    │                         │                          │
    │ GET /api/auth/me        │                          │
    ├────────────────────────►│                          │
    │ Header: Authorization   │                          │
    │                         │                          │
    │                         │ Verify JWT               │
    │                         │                          │
    │                         │ FIND User by ID          │
    │                         ├─────────────────────────►│
    │                         │                          │
    │                         │◄─────────────────────────┤
    │                         │  User data               │
    │                         │                          │
    │◄────────────────────────┤                          │
    │  {user}                 │                          │
    │                         │                          │
```

### 3.2 Match Request Flow

```
┌────────┐     ┌────────┐     ┌──────────┐     ┌───────┐
│ User A │     │ Server │     │ Database │     │User B │
└───┬────┘     └───┬────┘     └────┬─────┘     └───┬───┘
    │              │               │               │
    │ GET /api/    │               │               │
    │ matches/     │               │               │
    │ potential    │               │               │
    ├─────────────►│               │               │
    │              │               │               │
    │              │ FIND Users    │               │
    │              │ with matching │               │
    │              │ skills        │               │
    │              ├──────────────►│               │
    │              │               │               │
    │              │◄──────────────┤               │
    │              │ User list     │               │
    │              │               │               │
    │              │ Calculate     │               │
    │              │ compatibility │               │
    │              │ scores        │               │
    │              │               │               │
    │◄─────────────┤               │               │
    │ Sorted       │               │               │
    │ matches      │               │               │
    │              │               │               │
    │ POST /api/   │               │               │
    │ matches/     │               │               │
    │ request      │               │               │
    ├─────────────►│               │               │
    │ {recipient,  │               │               │
    │  message}    │               │               │
    │              │               │               │
    │              │ INSERT Match  │               │
    │              ├──────────────►│               │
    │              │               │               │
    │              │◄──────────────┤               │
    │              │               │               │
    │              │ Socket.emit   │               │
    │              │ 'new-match'   │               │
    │              ├───────────────┼──────────────►│
    │              │               │               │
    │              │ INSERT        │               │
    │              │ Notification  │               │
    │              ├──────────────►│               │
    │              │               │               │
    │◄─────────────┤               │               │
    │ {match}      │               │               │
    │              │               │               │
```

### 3.3 Real-time Chat Flow

```
┌────────┐     ┌────────┐     ┌──────────┐     ┌────────┐
│ User A │     │ Server │     │ Database │     │ User B │
└───┬────┘     └───┬────┘     └────┬─────┘     └───┬────┘
    │              │               │               │
    │ WebSocket    │               │               │
    │ Connect      │               │               │
    ├─────────────►│               │               │
    │              │               │               │
    │ emit:        │               │               │
    │ 'join-rooms' │               │               │
    ├─────────────►│               │               │
    │              │               │               │
    │              │ FIND ChatRooms│               │
    │              ├──────────────►│               │
    │              │               │               │
    │              │◄──────────────┤               │
    │              │               │               │
    │              │ socket.join() │               │
    │              │               │               │
    │ emit:        │               │               │
    │ 'send-       │               │               │
    │  message'    │               │               │
    ├─────────────►│               │               │
    │              │               │               │
    │              │ INSERT Message│               │
    │              ├──────────────►│               │
    │              │               │               │
    │              │◄──────────────┤               │
    │              │               │               │
    │              │ io.to(roomId) │               │
    │              │ .emit('new-   │               │
    │              │  message')    │               │
    │◄─────────────┤               ├──────────────►│
    │              │               │               │
    │ Display      │               │  Display      │
    │ message      │               │  message      │
    │              │               │               │
```

### 3.4 Video Call Flow (WebRTC)

```
┌────────┐     ┌────────┐     ┌────────┐
│ User A │     │ Server │     │ User B │
│(Caller)│     │(Signal)│     │(Callee)│
└───┬────┘     └───┬────┘     └───┬────┘
    │              │              │
    │ Create Peer  │              │
    │ Connection   │              │
    │              │              │
    │ Get local    │              │
    │ media stream │              │
    │              │              │
    │ emit: 'offer'│              │
    ├─────────────►│              │
    │ {signal}     │              │
    │              │              │
    │              │ emit: 'offer'│
    │              ├─────────────►│
    │              │              │
    │              │              │ Create Peer
    │              │              │ Connection
    │              │              │
    │              │              │ Get local
    │              │              │ media stream
    │              │              │
    │              │ emit:'answer'│
    │              │◄─────────────┤
    │              │ {signal}     │
    │              │              │
    │ emit:'answer'│              │
    │◄─────────────┤              │
    │              │              │
    │ ICE          │              │
    │ candidates   │              │
    │ exchange     │              │
    │◄────────────►│◄────────────►│
    │              │              │
    │ P2P Connection Established  │
    │◄────────────────────────────►│
    │                              │
    │ Audio/Video Stream           │
    │◄────────────────────────────►│
    │                              │
```

## 4. Component Hierarchy

```
App
├── AuthContext.Provider
│   └── SocketContext.Provider
│       ├── Router
│       │   ├── PublicRoute
│       │   │   ├── Login
│       │   │   └── Register
│       │   │
│       │   └── ProtectedRoute
│       │       ├── Dashboard
│       │       │   ├── Navbar
│       │       │   │   ├── Logo
│       │       │   │   ├── Navigation
│       │       │   │   └── NotificationBell
│       │       │   │       └── NotificationList
│       │       │   │
│       │       │   ├── UserProfile
│       │       │   │   ├── Avatar
│       │       │   │   ├── SkillsList
│       │       │   │   └── Stats
│       │       │   │
│       │       │   └── QuickActions
│       │       │
│       │       ├── Matches
│       │       │   ├── AdvancedSearch
│       │       │   │   ├── FilterPanel
│       │       │   │   └── SearchBar
│       │       │   │
│       │       │   └── MatchList
│       │       │       └── MatchCard
│       │       │           ├── UserInfo
│       │       │           ├── SkillTags
│       │       │           ├── CompatibilityScore
│       │       │           └── ActionButtons
│       │       │
│       │       ├── Chat
│       │       │   ├── ChatRoomList
│       │       │   │   └── ChatRoomItem
│       │       │   │
│       │       │   └── ChatWindow
│       │       │       ├── MessageList
│       │       │       │   └── MessageBubble
│       │       │       │
│       │       │       ├── TypingIndicator
│       │       │       │
│       │       │       └── MessageInput
│       │       │           ├── TextArea
│       │       │           ├── EmojiPicker
│       │       │           └── SendButton
│       │       │
│       │       ├── VideoCall
│       │       │   ├── LocalVideo
│       │       │   ├── RemoteVideo
│       │       │   ├── ControlPanel
│       │       │   │   ├── MuteButton
│       │       │   │   ├── VideoToggle
│       │       │   │   ├── ScreenShare
│       │       │   │   └── EndCall
│       │       │   │
│       │       │   └── ConnectionStatus
│       │       │
│       │       └── Whiteboard
│       │           ├── Canvas
│       │           ├── ToolPanel
│       │           │   ├── DrawingTools
│       │           │   ├── ColorPicker
│       │           │   └── StrokeWidth
│       │           │
│       │           └── ActionButtons
│       │               ├── Clear
│       │               ├── Undo
│       │               └── Save
│       │
│       └── ErrorBoundary
```

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER ACTIONS                            │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   REACT COMPONENTS                           │
│  • Handle user input                                         │
│  • Validate data                                             │
│  • Update local state                                        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   API SERVICE LAYER                          │
│  • Format requests                                           │
│  • Add authentication headers                                │
│  • Handle errors                                             │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├──────────────┬──────────────┐
               │              │              │
               ▼              ▼              ▼
         HTTP Request    WebSocket      WebRTC P2P
         (REST API)     (Socket.io)    (Video/Audio)
               │              │              │
               ▼              ▼              │
┌─────────────────────────────────────────┐ │
│         EXPRESS SERVER                   │ │
│  • Route handling                        │ │
│  • Middleware processing                 │ │
│  • Business logic                        │ │
└──────────────┬──────────────────────────┘ │
               │                             │
               ├──────────┬──────────┐       │
               ▼          ▼          ▼       │
         ┌─────────┐ ┌────────┐ ┌────────┐  │
         │ MongoDB │ │ Redis  │ │ Email  │  │
         │         │ │ Cache  │ │Service │  │
         └────┬────┘ └───┬────┘ └────────┘  │
              │          │                   │
              ▼          ▼                   │
┌─────────────────────────────────────────┐ │
│         RESPONSE GENERATION              │ │
│  • Format data                           │ │
│  • Apply transformations                 │ │
│  • Add metadata                          │ │
└──────────────┬──────────────────────────┘ │
               │                             │
               ├──────────────┬──────────────┤
               ▼              ▼              ▼
         HTTP Response   WebSocket      WebRTC Stream
         (JSON)          Event          (Media)
               │              │              │
               └──────────────┴──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   REACT COMPONENTS                           │
│  • Update state                                              │
│  • Re-render UI                                              │
│  • Show notifications                                        │
└─────────────────────────────────────────────────────────────┘
```

## 6. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION                              │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   Route 53   │
                    │     (DNS)    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ CloudFront   │
                    │    (CDN)     │
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
        ┌──────────────┐      ┌──────────────┐
        │   S3 Bucket  │      │ Load Balancer│
        │   (Static)   │      │    (ALB)     │
        └──────────────┘      └──────┬───────┘
                                     │
                        ┌────────────┼────────────┐
                        │            │            │
                        ▼            ▼            ▼
                  ┌─────────┐  ┌─────────┐  ┌─────────┐
                  │  EC2-1  │  │  EC2-2  │  │  EC2-3  │
                  │ (Server)│  │ (Server)│  │ (Server)│
                  └────┬────┘  └────┬────┘  └────┬────┘
                       │            │            │
                       └────────────┼────────────┘
                                    │
                        ┌───────────┴───────────┐
                        │                       │
                        ▼                       ▼
                ┌──────────────┐        ┌──────────────┐
                │ MongoDB Atlas│        │ Redis Cloud  │
                │  (Database)  │        │   (Cache)    │
                └──────────────┘        └──────────────┘
```

## 7. Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
└─────────────────────────────────────────────────────────────┘

Layer 1: Network Security
├── HTTPS/TLS Encryption
├── CORS Policy
└── Firewall Rules

Layer 2: Application Security
├── Helmet.js (Security Headers)
│   ├── Content Security Policy
│   ├── XSS Protection
│   ├── HSTS
│   └── Frame Options
│
├── Rate Limiting
│   ├── 100 requests / 15 minutes
│   └── IP-based throttling
│
└── Input Validation
    ├── Express Validator
    ├── XSS Sanitization
    └── SQL Injection Prevention

Layer 3: Authentication & Authorization
├── JWT Tokens
│   ├── Access Token (15 min)
│   └── Refresh Token (7 days)
│
├── Password Security
│   ├── Bcrypt Hashing (10 rounds)
│   ├── Minimum 6 characters
│   └── Reset Token (SHA-256, 10 min)
│
└── Session Management
    ├── HTTP-only Cookies
    └── Secure Flag (HTTPS only)

Layer 4: Data Security
├── MongoDB
│   ├── Encrypted at Rest
│   ├── Access Control
│   └── Audit Logging
│
└── Redis
    ├── Password Protected
    └── TLS Connection

Layer 5: Monitoring & Logging
├── Request Logging
├── Error Tracking
└── Security Alerts
```

---

**Document Version:** 1.0  
**Last Updated:** November 9, 2024  
**Status:** Complete

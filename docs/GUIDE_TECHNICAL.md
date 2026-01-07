# Technical Improvements Implementation Guide

## 3. Technical Improvements

### 3.1 TypeScript Migration

**Priority:** HIGH | **Effort:** HIGH | **Impact:** HIGH

**Installation:**
```bash
# Server
cd server
npm install -D typescript @types/node @types/express @types/mongoose ts-node-dev

# Client
cd ../client
npm install -D typescript @types/react @types/react-dom
```

**Configuration:**
```json
// server/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}

// client/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Example Migration:**
```typescript
// server/types/index.ts
import { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  skillsOffered: string[];
  skillsWanted: string[];
  avatar?: string;
  bio?: string;
  location?: string;
  rating: {
    average: number;
    count: number;
  };
  createdAt: Date;
}

export interface ISession extends Document {
  participants: Array<{
    user: IUser['_id'];
    role: 'teacher' | 'learner';
  }>;
  skill: string;
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

// server/models/User.ts
import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  skillsOffered: [String],
  skillsWanted: [String],
  avatar: String,
  bio: String,
  location: String,
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', userSchema);

// server/routes/auth.ts
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../types';

interface AuthRequest extends Request {
  user?: IUser;
}

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// client/src/types/index.ts
export interface User {
  _id: string;
  username: string;
  email: string;
  skillsOffered: string[];
  skillsWanted: string[];
  avatar?: string;
  bio?: string;
  rating: {
    average: number;
    count: number;
  };
}

export interface Session {
  _id: string;
  participants: Array<{
    user: User;
    role: 'teacher' | 'learner';
  }>;
  skill: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

// client/src/components/Profile.tsx
import { FC } from 'react';
import { User } from '../types';

interface ProfileProps {
  user: User;
}

const Profile: FC<ProfileProps> = ({ user }) => {
  return (
    <div>
      <h2>{user.username}</h2>
      <p>{user.bio}</p>
      <div>Rating: {user.rating.average.toFixed(1)}</div>
    </div>
  );
};

export default Profile;
```

**Update package.json scripts:**
```json
// server/package.json
{
  "scripts": {
    "dev": "ts-node-dev --respawn server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

---

### 3.2 Testing Infrastructure

**Priority:** HIGH | **Effort:** HIGH | **Impact:** HIGH

**Installation:**
```bash
# Server
cd server
npm install -D jest supertest @types/jest @types/supertest mongodb-memory-server

# Client
cd ../client
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Configuration:**
```javascript
// server/jest.config.js
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};

// server/tests/setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// server/__tests__/auth.test.js
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('testuser');
    });

    it('should not register with duplicate email', async () => {
      await User.create({
        username: 'existing',
        email: 'test@example.com',
        password: 'hashed'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'test@example.com',
          password: 'Password123'
        });
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123'
        });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should not login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });
      
      expect(res.statusCode).toBe(401);
    });
  });
});

// client/vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js'
  }
});

// client/src/tests/setup.js
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
afterEach(() => cleanup());

// client/src/components/__tests__/Login.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Login from '../Login';
import axios from 'axios';

vi.mock('axios');

describe('Login Component', () => {
  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('submits form with credentials', async () => {
    axios.post.mockResolvedValue({
      data: { token: 'fake-token', user: { username: 'testuser' } }
    });

    render(<Login />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'Password123'
      });
    });
  });
});
```

**Add to package.json:**
```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

---

### 3.3 Docker Containerization

**Priority:** MEDIUM | **Effort:** MEDIUM | **Impact:** HIGH

**Implementation:**
```dockerfile
# Dockerfile.server
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]

# Dockerfile.client
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: skillswap-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: SkillSwapDB
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"
    networks:
      - skillswap-network

  redis:
    image: redis:7-alpine
    container_name: skillswap-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - skillswap-network

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: skillswap-server
    restart: unless-stopped
    env_file:
      - ./server/.env
    environment:
      MONGO_URI: mongodb://mongodb:27017/SkillSwapDB
      REDIS_HOST: redis
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
      - redis
    networks:
      - skillswap-network

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: skillswap-client
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - server
    networks:
      - skillswap-network

volumes:
  mongo-data:

networks:
  skillswap-network:
    driver: bridge

# .dockerignore
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
dist
coverage
```

**Usage:**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

---

### 3.4 CI/CD Pipeline (GitHub Actions)

**Priority:** MEDIUM | **Effort:** MEDIUM | **Impact:** HIGH

**Implementation:**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-server:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: server/package-lock.json
      
      - name: Install dependencies
        working-directory: ./server
        run: npm ci
      
      - name: Run tests
        working-directory: ./server
        run: npm test
        env:
          MONGO_URI: mongodb://localhost:27017/test
          JWT_SECRET: test-secret
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./server/coverage/lcov.info

  test-client:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: client/package-lock.json
      
      - name: Install dependencies
        working-directory: ./client
        run: npm ci
      
      - name: Run tests
        working-directory: ./client
        run: npm test

  lint:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Lint server
        working-directory: ./server
        run: |
          npm ci
          npm run lint
      
      - name: Lint client
        working-directory: ./client
        run: |
          npm ci
          npm run lint

  build:
    needs: [test-server, test-client, lint]
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: docker-compose build
      
      - name: Login to Docker Hub
        if: github.ref == 'refs/heads/main'
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Push to Docker Hub
        if: github.ref == 'refs/heads/main'
        run: |
          docker tag skillswap-server:latest ${{ secrets.DOCKER_USERNAME }}/skillswap-server:latest
          docker tag skillswap-client:latest ${{ secrets.DOCKER_USERNAME }}/skillswap-client:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/skillswap-server:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/skillswap-client:latest

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/skillswap
            docker-compose pull
            docker-compose up -d
            docker system prune -f
```

---

### 3.5 Error Logging (Sentry)

**Priority:** MEDIUM | **Effort:** LOW | **Impact:** MEDIUM

**Installation:**
```bash
npm install @sentry/node @sentry/react
```

**Implementation:**
```javascript
// server/config/sentry.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

module.exports = Sentry;

// server/server.js
const Sentry = require('./config/sentry');

// Add before routes
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Add after routes
app.use(Sentry.Handlers.errorHandler());

// client/src/main.jsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});
```

---

### 3.6 API Documentation (Swagger)

**Priority:** LOW | **Effort:** MEDIUM | **Impact:** MEDIUM

**Installation:**
```bash
npm install swagger-jsdoc swagger-ui-express
```

**Implementation:**
```javascript
// server/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SkillSwap API',
      version: '1.0.0',
      description: 'API documentation for SkillSwap platform'
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://api.skillswap.com', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

module.exports = swaggerJsdoc(options);

// server/server.js
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// server/routes/auth.js - Add JSDoc comments
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
router.post('/register', register);
```

---

See GUIDE_UX.md for UX/UI enhancements.

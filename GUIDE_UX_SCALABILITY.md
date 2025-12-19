# UX/UI & Scalability Implementation Guide

## 4. UX/UI Enhancements

### 4.1 Dark Mode

**Priority:** LOW | **Effort:** LOW | **Impact:** MEDIUM

**Implementation:**
```javascript
// client/src/contexts/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// client/src/main.jsx
import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

// client/src/styles/theme.css
:root[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --accent-color: #4a90e2;
}

:root[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
  --accent-color: #5ca3ff;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

// client/src/components/ThemeToggle.jsx
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="theme-toggle">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

---

### 4.2 Accessibility (WCAG Compliance)

**Priority:** HIGH | **Effort:** MEDIUM | **Impact:** HIGH

**Installation:**
```bash
npm install -D eslint-plugin-jsx-a11y
```

**Implementation:**
```javascript
// client/.eslintrc.json
{
  "extends": [
    "plugin:jsx-a11y/recommended"
  ],
  "plugins": ["jsx-a11y"]
}

// client/src/components/AccessibleButton.jsx
export default function AccessibleButton({ 
  onClick, 
  children, 
  ariaLabel, 
  disabled = false 
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      aria-disabled={disabled}
      className="accessible-btn"
    >
      {children}
    </button>
  );
}

// client/src/components/SkipToContent.jsx
export default function SkipToContent() {
  return (
    <a href="#main-content" className="skip-to-content">
      Skip to main content
    </a>
  );
}

// client/src/styles/accessibility.css
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--accent-color);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-to-content:focus {
  top: 0;
}

/* Focus indicators */
*:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

// client/src/hooks/useKeyboardNavigation.js
import { useEffect } from 'react';

export default function useKeyboardNavigation(ref, onEscape) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
      
      // Trap focus within modal
      if (e.key === 'Tab' && ref.current) {
        const focusableElements = ref.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [ref, onEscape]);
}
```

---

### 4.3 Progressive Web App (PWA)

**Priority:** MEDIUM | **Effort:** MEDIUM | **Impact:** MEDIUM

**Installation:**
```bash
npm install -D vite-plugin-pwa
```

**Implementation:**
```javascript
// client/vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'SkillSwap',
        short_name: 'SkillSwap',
        description: 'Peer-to-peer skill exchange platform',
        theme_color: '#4a90e2',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.skillswap\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          }
        ]
      }
    })
  ]
});

// client/src/components/InstallPrompt.jsx
import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="install-prompt">
      <p>Install SkillSwap for a better experience!</p>
      <button onClick={handleInstall}>Install</button>
      <button onClick={() => setShowPrompt(false)}>Later</button>
    </div>
  );
}
```

---

### 4.4 Onboarding Flow

**Priority:** MEDIUM | **Effort:** MEDIUM | **Impact:** MEDIUM

**Implementation:**
```javascript
// client/src/components/Onboarding.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    title: 'Welcome to SkillSwap!',
    description: 'Exchange skills with people around the world',
    image: '/onboarding-1.svg'
  },
  {
    title: 'Add Your Skills',
    description: 'Tell us what you can teach and what you want to learn',
    image: '/onboarding-2.svg'
  },
  {
    title: 'Find Matches',
    description: 'Connect with people who have complementary skills',
    image: '/onboarding-3.svg'
  },
  {
    title: 'Start Learning',
    description: 'Chat, video call, and collaborate in real-time',
    image: '/onboarding-4.svg'
  }
];

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem('onboardingCompleted', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    onComplete();
  };

  return (
    <div className="onboarding-overlay">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="onboarding-step"
        >
          <img src={steps[currentStep].image} alt="" />
          <h2>{steps[currentStep].title}</h2>
          <p>{steps[currentStep].description}</p>
          
          <div className="onboarding-dots">
            {steps.map((_, index) => (
              <span 
                key={index} 
                className={index === currentStep ? 'active' : ''}
              />
            ))}
          </div>
          
          <div className="onboarding-actions">
            <button onClick={handleSkip}>Skip</button>
            <button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// client/src/App.jsx
import { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('onboardingCompleted');
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      {/* Rest of app */}
    </>
  );
}
```

---

### 4.5 Advanced Filters

**Priority:** MEDIUM | **Effort:** LOW | **Impact:** MEDIUM

**Implementation:**
```javascript
// client/src/components/AdvancedFilters.jsx
import { useState } from 'react';

export default function AdvancedFilters({ onApply }) {
  const [filters, setFilters] = useState({
    skills: [],
    location: '',
    timezone: '',
    availability: [],
    minRating: 0,
    verified: false,
    language: []
  });

  const handleApply = () => {
    onApply(filters);
  };

  return (
    <div className="advanced-filters">
      <h3>Filters</h3>
      
      <div className="filter-group">
        <label>Minimum Rating</label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={filters.minRating}
          onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
        />
        <span>{filters.minRating} stars</span>
      </div>

      <div className="filter-group">
        <label>Timezone</label>
        <select
          value={filters.timezone}
          onChange={(e) => setFilters({ ...filters, timezone: e.target.value })}
        >
          <option value="">Any</option>
          <option value="UTC-8">PST (UTC-8)</option>
          <option value="UTC-5">EST (UTC-5)</option>
          <option value="UTC+0">GMT (UTC+0)</option>
          <option value="UTC+5:30">IST (UTC+5:30)</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Availability</label>
        {['Morning', 'Afternoon', 'Evening', 'Weekend'].map(time => (
          <label key={time}>
            <input
              type="checkbox"
              checked={filters.availability.includes(time)}
              onChange={(e) => {
                const newAvailability = e.target.checked
                  ? [...filters.availability, time]
                  : filters.availability.filter(t => t !== time);
                setFilters({ ...filters, availability: newAvailability });
              }}
            />
            {time}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={filters.verified}
            onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
          />
          Verified users only
        </label>
      </div>

      <button onClick={handleApply}>Apply Filters</button>
    </div>
  );
}

// server/routes/matches.js - Update endpoint
router.get('/potential', auth, async (req, res) => {
  const { minRating, timezone, availability, verified } = req.query;
  
  let query = {
    _id: { $ne: req.user._id },
    skillsOffered: { $in: req.user.skillsWanted },
    skillsWanted: { $in: req.user.skillsOffered }
  };
  
  if (minRating) {
    query['rating.average'] = { $gte: parseFloat(minRating) };
  }
  
  if (timezone) {
    query.timezone = timezone;
  }
  
  if (availability) {
    query.availability = { $in: availability.split(',') };
  }
  
  if (verified === 'true') {
    query.verified = true;
  }
  
  const matches = await User.find(query).limit(20);
  res.json(matches);
});
```

---

## 5. Scalability

### 5.1 Microservices Architecture

**Priority:** LOW | **Effort:** VERY HIGH | **Impact:** HIGH

**Structure:**
```
skillswap-microservices/
├── api-gateway/          # Entry point, routing
├── auth-service/         # Authentication & authorization
├── user-service/         # User profiles & management
├── match-service/        # Matching algorithm
├── chat-service/         # Real-time messaging
├── video-service/        # WebRTC signaling
├── notification-service/ # Push notifications
└── shared/              # Common utilities
```

**Implementation:**
```javascript
// api-gateway/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api/auth', createProxyMiddleware({ 
  target: 'http://auth-service:3001',
  changeOrigin: true 
}));

app.use('/api/users', createProxyMiddleware({ 
  target: 'http://user-service:3002',
  changeOrigin: true 
}));

app.use('/api/matches', createProxyMiddleware({ 
  target: 'http://match-service:3003',
  changeOrigin: true 
}));

app.use('/api/chat', createProxyMiddleware({ 
  target: 'http://chat-service:3004',
  changeOrigin: true 
}));

app.listen(5000);

// docker-compose.microservices.yml
version: '3.8'

services:
  api-gateway:
    build: ./api-gateway
    ports:
      - "5000:5000"
    depends_on:
      - auth-service
      - user-service
      - match-service
      - chat-service

  auth-service:
    build: ./auth-service
    environment:
      - DB_HOST=mongodb
      - REDIS_HOST=redis

  user-service:
    build: ./user-service
    environment:
      - DB_HOST=mongodb

  match-service:
    build: ./match-service
    environment:
      - DB_HOST=mongodb

  chat-service:
    build: ./chat-service
    environment:
      - REDIS_HOST=redis

  mongodb:
    image: mongo:6

  redis:
    image: redis:7-alpine
```

---

### 5.2 Load Balancing (Nginx)

**Priority:** MEDIUM | **Effort:** MEDIUM | **Impact:** HIGH

**Implementation:**
```nginx
# nginx.conf
upstream backend {
    least_conn;
    server server1:5000 weight=3;
    server server2:5000 weight=2;
    server server3:5000 weight=1;
}

upstream socketio {
    ip_hash;
    server server1:5000;
    server server2:5000;
    server server3:5000;
}

server {
    listen 80;
    server_name skillswap.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /socket.io/ {
        proxy_pass http://socketio;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

# docker-compose.loadbalancer.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - server1
      - server2
      - server3

  server1:
    build: ./server
    environment:
      - INSTANCE_ID=1

  server2:
    build: ./server
    environment:
      - INSTANCE_ID=2

  server3:
    build: ./server
    environment:
      - INSTANCE_ID=3
```

---

### 5.3 Message Queuing (RabbitMQ)

**Priority:** MEDIUM | **Effort:** MEDIUM | **Impact:** MEDIUM

**Installation:**
```bash
npm install amqplib
```

**Implementation:**
```javascript
// server/config/rabbitmq.js
const amqp = require('amqplib');

let connection, channel;

const connect = async () => {
  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  
  await channel.assertQueue('notifications', { durable: true });
  await channel.assertQueue('emails', { durable: true });
  await channel.assertQueue('analytics', { durable: true });
};

const publishToQueue = async (queue, message) => {
  await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true
  });
};

const consumeQueue = async (queue, callback) => {
  await channel.consume(queue, async (msg) => {
    if (msg) {
      const content = JSON.parse(msg.content.toString());
      await callback(content);
      channel.ack(msg);
    }
  });
};

module.exports = { connect, publishToQueue, consumeQueue };

// server/workers/notificationWorker.js
const { consumeQueue } = require('../config/rabbitmq');
const Notification = require('../models/Notification');

const startNotificationWorker = async () => {
  await consumeQueue('notifications', async (data) => {
    await Notification.create(data);
    
    // Send push notification
    io.to(data.userId).emit('notification', data);
  });
};

startNotificationWorker();

// Usage in routes
const { publishToQueue } = require('../config/rabbitmq');

router.post('/request', auth, async (req, res) => {
  // ... create match request
  
  // Queue notification instead of sending immediately
  await publishToQueue('notifications', {
    userId: recipientId,
    type: 'match-request',
    message: `${req.user.username} sent you a match request`
  });
  
  res.json({ message: 'Request sent' });
});
```

---

See IMPLEMENTATION_GUIDE.md for priority matrix and getting started.

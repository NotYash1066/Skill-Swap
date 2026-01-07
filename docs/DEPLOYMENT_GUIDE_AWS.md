# SkillSwap Deployment Guide - AWS (EC2 with Nginx)

## Prerequisites
- AWS Account with billing enabled
- Domain name (optional but recommended)
- Local machine with SSH client (OpenSSH or PuTTY)

---

## Step 1: Launch AWS EC2 Instance

### 1.1 Launch Instance
1. Go to **EC2 Dashboard** > **Instances** > **Launch Instances**.
2. **Name**: `skillswap-server`
3. **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type.
4. **Instance Type**: `t3.medium` (Recommended for Node.js + MongoDB + Redis).
5. **Key Pair**: Create a new key pair (`skillswap-key`) and download the `.pem` file.

### 1.2 Network Settings (Security Group)
Create a new Security Group allowing:
- **SSH** (TCP 22) - Limit to your IP for security.
- **HTTP** (TCP 80) - Anywhere `0.0.0.0/0`
- **HTTPS** (TCP 443) - Anywhere `0.0.0.0/0`
- **Custom TCP** (5000) - Custom Port for API testing (Optional, better to keep closed and use Nginx reverse proxy).

### 1.3 Storage
- Set to **20 GiB** gp3 (General Purpose SSD).

### 1.4 Elastic IP (Static IP)
1. Go to **Network & Security** > **Elastic IPs**.
2. Click **Allocate Elastic IP address**.
3. Select the new IP > **Actions** > **Associate Elastic IP address**.
4. Select your `skillswap-server` instance and click **Associate**.

---

## Step 2: Connect to Instance and Install Dependencies

### 2.1 SSH into Instance
```bash
# Set permissions for key file (Linux/Mac)
chmod 400 skillswap-key.pem

# Connect
ssh -i "skillswap-key.pem" ubuntu@YOUR_ELASTIC_IP
```

### 2.2 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3 Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verify installation
```

### 2.4 Install MongoDB
```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2.5 Install Redis (Required for Caching/Queues)
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 2.6 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.7 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 2.8 Install Git
```bash
sudo apt install -y git
```

---

## Step 3: Clone and Setup Application

### 3.1 Clone Repository
```bash
cd /home/ubuntu
git clone https://github.com/NotYash1066/Skill-Swap.git
cd Skill-Swap
```

### 3.2 Setup Backend
```bash
cd server

# Install dependencies
npm install

# Create production .env file
cat > .env << EOF
MONGO_URI=mongodb://localhost:27017/SkillSwapDB
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -base64 32)
PORT=5000
CLIENT_URL=http://YOUR_ELASTIC_IP_OR_DOMAIN
NODE_ENV=production
# Add TURN server credentials if you have them
# TURN_SERVER_URL=...
EOF

# Create uploads directory
mkdir -p uploads/avatars
```

### 3.3 Setup Frontend
```bash
cd ../client

# Install dependencies
npm install

# Create production .env file
# NOTE: If using a domain, replace IP with https://yourdomain.com
cat > .env << EOF
VITE_API_URL=http://YOUR_ELASTIC_IP_OR_DOMAIN
EOF

# Build for production
npm run build
```

---

## Step 4: Configure Nginx

### 4.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/skillswap
```

### 4.2 Add Configuration
Paste the following. Replace `YOUR_DOMAIN_OR_IP` with your actual Domain or Elastic IP.

```nginx
# Backend API Server Upstream
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Frontend - Serve built React app
    location / {
        root /home/ubuntu/Skill-Swap/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io WebSocket Proxy
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Serve Uploaded Files
    location /uploads {
        alias /home/ubuntu/Skill-Swap/server/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
```

### 4.3 Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/skillswap /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 5: Start Application with PM2

### 5.1 Start Backend
```bash
cd /home/ubuntu/Skill-Swap/server
pm2 start server.js --name skillswap-backend
pm2 save
pm2 startup
```

### 5.2 Configure PM2 to Start on Boot
Run the command output by `pm2 startup`. It will look like:
```bash
sudo env PATH=$PATH:/usr/bin/node /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## Step 6: Setup SSL (HTTPS)

**Note:** You need a valid domain name pointed to your Elastic IP for this step.

### 6.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 6.3 Verify Auto-renewal
```bash
sudo certbot renew --dry-run
```

---

## Step 7: Final Security Checks

1. **MongoDB Auth:** Enable authentication for MongoDB (see GCP guide or Mongo docs) to prevent unauthorized access.
2. **Firewall:** Ensure your AWS Security Group only allows necessary ports (22, 80, 443).
3. **Environment Variables:** Ensure `NODE_ENV=production` is set in your backend `.env`.

---

## AWS Cost Estimation (Approximate)

- **t3.medium Instance:** ~$30/month (or t3.micro for low traffic free tier eligible)
- **EBS Storage (20GB):** ~$2/month
- **Elastic IP:** Free if attached to running instance.
- **Data Transfer:** Free inbound, ~$0.09/GB outbound.

**Total:** ~$32/month for a production-capable server.

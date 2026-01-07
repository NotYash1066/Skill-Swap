# SkillSwap Deployment Guide - GCP with Nginx

## Prerequisites
- GCP Account with billing enabled
- Domain name (optional but recommended)
- Local machine with gcloud CLI installed

---

## Step 1: Create GCP VM Instance

### 1.1 Create Compute Engine Instance
```bash
gcloud compute instances create skillswap-server \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server
```

### 1.2 Configure Firewall Rules
```bash
# Allow HTTP
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --target-tags http-server

# Allow HTTPS
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --target-tags https-server

# Allow custom ports (if needed)
gcloud compute firewall-rules create allow-app \
  --allow tcp:5000,tcp:5173 \
  --target-tags http-server
```

### 1.3 Reserve Static IP (Optional)
```bash
gcloud compute addresses create skillswap-ip --region=us-central1
gcloud compute instances add-access-config skillswap-server \
  --access-config-name="External NAT" \
  --address=$(gcloud compute addresses describe skillswap-ip --region=us-central1 --format="value(address)")
```

---

## Step 2: Connect to VM and Install Dependencies

### 2.1 SSH into VM
```bash
gcloud compute ssh skillswap-server --zone=us-central1-a
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
sudo systemctl status mongod
```

### 2.5 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.6 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 2.7 Install Git
```bash
sudo apt install -y git
```

---

## Step 3: Clone and Setup Application

### 3.1 Clone Repository
```bash
cd /home/$USER
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
JWT_SECRET=$(openssl rand -base64 32)
PORT=5000
CLIENT_URL=http://YOUR_DOMAIN_OR_IP
NODE_ENV=production
TURN_SERVER_URL=turn:openrelay.metered.ca:80
TURN_USERNAME=openrelayproject
TURN_CREDENTIAL=openrelayproject
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
cat > .env << EOF
VITE_API_URL=http://YOUR_DOMAIN_OR_IP
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
```nginx
# Backend API Server
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Frontend - Serve built React app
    location / {
        root /home/$USER/Skill-Swap/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io WebSocket
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploaded files
    location /uploads {
        alias /home/$USER/Skill-Swap/server/uploads;
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
cd /home/$USER/Skill-Swap/server
pm2 start server.js --name skillswap-backend
pm2 save
pm2 startup
```

### 5.2 Configure PM2 to Start on Boot
```bash
# Run the command that PM2 outputs from previous step
# It will look like:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

---

## Step 6: Setup SSL with Let's Encrypt (Optional but Recommended)

### 6.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d YOUR_DOMAIN
```

### 6.3 Auto-renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job for renewal
```

---

## Step 7: Configure MongoDB Security

### 7.1 Enable Authentication
```bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "STRONG_PASSWORD_HERE",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Create app user
use SkillSwapDB
db.createUser({
  user: "skillswap",
  pwd: "STRONG_PASSWORD_HERE",
  roles: [ { role: "readWrite", db: "SkillSwapDB" } ]
})

exit
```

### 7.2 Enable Auth in MongoDB Config
```bash
sudo nano /etc/mongod.conf
```

Add:
```yaml
security:
  authorization: enabled
```

### 7.3 Restart MongoDB
```bash
sudo systemctl restart mongod
```

### 7.4 Update Backend .env
```bash
cd /home/$USER/Skill-Swap/server
nano .env
```

Update:
```env
MONGO_URI=mongodb://skillswap:STRONG_PASSWORD_HERE@localhost:27017/SkillSwapDB
```

### 7.5 Restart Backend
```bash
pm2 restart skillswap-backend
```

---

## Step 8: Monitoring and Logs

### 8.1 PM2 Monitoring
```bash
# View logs
pm2 logs skillswap-backend

# Monitor processes
pm2 monit

# View status
pm2 status
```

### 8.2 Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 8.3 MongoDB Logs
```bash
sudo tail -f /var/log/mongodb/mongod.log
```

---

## Step 9: Backup Strategy

### 9.1 Create Backup Script
```bash
nano /home/$USER/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="mongodb://skillswap:PASSWORD@localhost:27017/SkillSwapDB" \
  --out="$BACKUP_DIR/mongo_$DATE"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /home/$USER/Skill-Swap/server/uploads

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 9.2 Make Executable and Schedule
```bash
chmod +x /home/$USER/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
```

Add:
```
0 2 * * * /home/$USER/backup.sh >> /home/$USER/backup.log 2>&1
```

---

## Step 10: Update and Maintenance

### 10.1 Update Application
```bash
cd /home/$USER/Skill-Swap

# Pull latest changes
git pull origin main

# Update backend
cd server
npm install
pm2 restart skillswap-backend

# Update frontend
cd ../client
npm install
npm run build
```

### 10.2 System Updates
```bash
sudo apt update && sudo apt upgrade -y
sudo systemctl restart nginx
```

---

## Quick Reference Commands

```bash
# Check application status
pm2 status

# Restart backend
pm2 restart skillswap-backend

# View logs
pm2 logs skillswap-backend

# Reload Nginx
sudo systemctl reload nginx

# Check MongoDB status
sudo systemctl status mongod

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Backend not starting
```bash
pm2 logs skillswap-backend
# Check for errors in .env file
# Verify MongoDB is running
```

### 502 Bad Gateway
```bash
# Check if backend is running
pm2 status
# Check Nginx configuration
sudo nginx -t
```

### MongoDB connection failed
```bash
# Check MongoDB status
sudo systemctl status mongod
# Verify credentials in .env
```

### WebSocket connection failed
```bash
# Check Nginx WebSocket configuration
# Verify firewall rules allow WebSocket
```

---

## Security Checklist

- ✅ MongoDB authentication enabled
- ✅ Strong JWT secret generated
- ✅ SSL certificate installed
- ✅ Firewall rules configured
- ✅ Regular backups scheduled
- ✅ System updates automated
- ✅ PM2 process monitoring
- ✅ Nginx security headers set

---

## Cost Estimation (GCP)

- **e2-medium VM**: ~$25/month
- **20GB Storage**: ~$2/month
- **Static IP**: ~$3/month
- **Bandwidth**: Variable (~$0.12/GB)

**Total**: ~$30-40/month

---

## Support

For issues or questions:
- Check logs: `pm2 logs skillswap-backend`
- Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`

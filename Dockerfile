# ============================================
# Stage 1: Build the React frontend
# ============================================
FROM node:18-alpine AS client-build

WORKDIR /app/client
COPY client/ ./
RUN npm ci
# Build with empty VITE_API_URL so it uses relative paths (nginx will proxy)
RUN VITE_API_URL="" npm run build

# ============================================
# Stage 2: Build the production server
# ============================================
FROM node:18-alpine AS server-build

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production

# ============================================
# Stage 3: Production image
# ============================================
FROM node:18-alpine

# Install nginx
RUN apk add --no-cache nginx

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy server
WORKDIR /app
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# Copy built client assets
COPY --from=client-build /app/client/dist /usr/share/nginx/html

# Copy nginx config
COPY client/nginx.conf /etc/nginx/http.d/default.conf

# Create uploads directory
RUN mkdir -p /app/server/uploads/avatars && \
    chown -R appuser:appgroup /app /usr/share/nginx/html /var/log/nginx /var/lib/nginx

# Start script - nginx on Railway PORT, node on internal 5000
RUN echo '#!/bin/sh\n\
PUBLIC_PORT=${PORT:-80}\n\
export PORT=5000\n\
sed -i "s/listen 80;/listen ${PUBLIC_PORT};/" /etc/nginx/http.d/default.conf\n\
nginx -g "daemon off;" &\n\
cd /app/server && exec node server.js\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 80 5000

USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || wget --no-verbose --tries=1 --spider http://localhost:5000/api/test || exit 1

CMD ["/app/start.sh"]

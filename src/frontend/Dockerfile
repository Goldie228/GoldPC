# =============================================================================
# GoldPC Frontend Dockerfile
# Multi-stage build for React + Vite application
# Build stage: node:20-alpine
# Runtime stage: nginx:alpine
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build application (outputs to /app/dist for Vite)
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Runtime with Nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine AS runtime

# Labels for container metadata
LABEL maintainer="GoldPC Team"
LABEL description="GoldPC Frontend - React/Vite Application"
LABEL version="1.0.0"

# Security: Install ca-certificates for TLS connections
RUN apk add --no-cache ca-certificates && \
    update-ca-certificates

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config (from frontend directory)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Security: Create nginx temp directories with proper permissions
# nginx user (UID 101) already exists in nginx:alpine image
RUN mkdir -p /var/lib/nginx/tmp /var/cache/nginx /var/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /var/lib/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Security: Run as non-root user (nginx user, UID 101)
USER nginx

# Expose port 3000 (internal)
EXPOSE 3000

# Security: Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
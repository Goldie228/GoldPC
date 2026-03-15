# =============================================================================
# GoldPC Frontend Dockerfile
# Multi-stage build for React + Vite application
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (better layer caching)
COPY src/frontend/package*.json ./
RUN npm ci --include=dev

# Copy source code
COPY src/frontend/. .

# Build application (outputs to /app/dist)
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Runtime with Nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine AS runtime

# Labels for container metadata
LABEL maintainer="GoldPC Team"
LABEL description="GoldPC Frontend - React/Vite Application"
LABEL version="1.0.0"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY docker/frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Security: Set proper permissions for nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Create directory for nginx temp files
RUN mkdir -p /var/lib/nginx/tmp && \
    chown -R nginx:nginx /var/lib/nginx

# Security: Run as non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
</task_progress>
</write_to_file>
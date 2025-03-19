FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy VERSION file first
COPY VERSION /app/VERSION

# Clean the VERSION string to remove any hidden characters or line endings
RUN cat /app/VERSION | tr -d '\r\n' > /app/VERSION_CLEAN && \
    mv /app/VERSION_CLEAN /app/VERSION

# Copy individual package files first for better caching
COPY forms-flow-admin/package*.json ./forms-flow-admin/
COPY forms-flow-components/package*.json ./forms-flow-components/
COPY forms-flow-integration/package*.json ./forms-flow-integration/
COPY forms-flow-nav/package*.json ./forms-flow-nav/
COPY forms-flow-rsbcservice/package*.json ./forms-flow-rsbcservice/
COPY forms-flow-service/package*.json ./forms-flow-service/
COPY forms-flow-theme/package*.json ./forms-flow-theme/

# Install dependencies for each microfrontend
WORKDIR /app
RUN cd forms-flow-admin && npm ci --force --legacy-peer-deps && cd /app
RUN cd forms-flow-components && npm ci --force --legacy-peer-deps && cd /app
RUN cd forms-flow-integration && npm ci --force --legacy-peer-deps && cd /app
RUN cd forms-flow-nav && npm ci --force --legacy-peer-deps && cd /app
RUN cd forms-flow-rsbcservice && npm ci --force --legacy-peer-deps && cd /app
RUN cd forms-flow-service && npm ci --force --legacy-peer-deps && cd /app
RUN cd forms-flow-theme && npm ci --force --legacy-peer-deps && cd /app

# Copy source code for all microfrontends
COPY forms-flow-admin/ /app/forms-flow-admin/
COPY forms-flow-components/ /app/forms-flow-components/
COPY forms-flow-integration/ /app/forms-flow-integration/
COPY forms-flow-nav/ /app/forms-flow-nav/
COPY forms-flow-rsbcservice/ /app/forms-flow-rsbcservice/
COPY forms-flow-service/ /app/forms-flow-service/
COPY forms-flow-theme/ /app/forms-flow-theme/

# Build each microfrontend
RUN cd forms-flow-admin && npm run build:webpack && cd /app
RUN cd forms-flow-components && npm run build:webpack && cd /app
RUN cd forms-flow-integration && npm run build:webpack && cd /app
RUN cd forms-flow-nav && npm run build:webpack && cd /app
RUN cd forms-flow-rsbcservice && npm run build:webpack && cd /app
RUN cd forms-flow-service && npm run build:webpack && cd /app
RUN cd forms-flow-theme && npm run build && cd /app

# Get version and create versioned directories with a clean version string
RUN VERSION=$(cat /app/VERSION | tr -d '[:space:]') && \
    echo "Using version: $VERSION" && \
    for component in forms-flow-admin forms-flow-components forms-flow-integration forms-flow-nav forms-flow-rsbcservice forms-flow-service forms-flow-theme; do \
      if [ -d "$component/dist" ]; then \
        mkdir -p "/app/versioned/$component@$VERSION" && \
        cp -r "$component/dist/"* "/app/versioned/$component@$VERSION/"; \
      fi; \
    done

# Use Nginx to serve the static files
FROM nginx:alpine

# Copy VERSION file (cleaned)
COPY --from=builder /app/VERSION /usr/share/nginx/html/VERSION

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files from builder stage
COPY --from=builder /app/versioned/ /usr/share/nginx/html/

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost/ || exit 1

# Expose Nginx port
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
# ==========================================
# Stage 1: Build React 19 Frontend
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build production assets
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Nginx Web Server & Reverse Proxy
# ==========================================
FROM nginx:alpine

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built SPA assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

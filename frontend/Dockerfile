# -------------------------------------------------------------
# Multi-stage Dockerfile for HOP React 18 Frontend
# Stage 1: Build static assets with Node.js 20 & Vite
# Stage 2: Production Nginx web server
# -------------------------------------------------------------

FROM node:20-alpine AS builder
WORKDIR /app

# Copy package manifests & install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build static distribution
COPY . .
RUN npm run build

# Stage 2: Nginx Web Server
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean default assets and copy production build
RUN rm -rf ./*
COPY --from=builder /app/dist .

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

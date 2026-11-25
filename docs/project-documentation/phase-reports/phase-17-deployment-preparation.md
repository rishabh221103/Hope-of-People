# Phase 17: Deployment Preparation

## 1. Phase Status
- **Status:** COMPLETED
- **Timestamp:** 2026-11-19T16:06:00+05:30
- **Phase Objective:** Containerize the full-stack system using multi-stage Docker builds, orchestrate container services with Docker Compose, and establish production deployment readiness.

## 2. Containerization Strategy
- **Backend Service (`backend/Dockerfile`):**
  - Multi-stage build leveraging `eclipse-temurin:21-jdk-alpine` for reproducible compilation with layer caching.
  - Runtime environment packaged using minimal `eclipse-temurin:21-jre-alpine` running as unprivileged user `hopuser`.
  - Secure persistent volume mount for `/app/uploads/documents`.
- **Frontend Service (`frontend/Dockerfile`):**
  - Multi-stage build leveraging `node:20-alpine` with `npm ci` and Vite production bundling.
  - Web runtime powered by `nginx:alpine` with optimized reverse-proxy routing `/api/` to backend upstream.
- **Orchestration (`docker-compose.yml`):**
  - Fully orchestrated 3-tier topology: `database` (PostgreSQL 16 Alpine with health check), `backend` (Spring Boot 4 / Java 21), and `frontend` (React 18 / Nginx).
  - Isolated bridge networking, named persistent volumes (`pgdata`, `hop-uploads`), and declarative dependency health checks.

## 3. Production Deployment Guidelines
- **Environment Variables:** Externalized datasource credentials, JWT secret keys, and file storage directories via standard `.env` injection.
- **Data Persistence:** Database state preserved across container restarts via the `pgdata` volume; uploaded assistance documentation files preserved via `hop-uploads`.
- **Zero-Downtime Migration:** Flyway database migrations run automatically on container startup against PostgreSQL before serving HTTP traffic.

## 4. Final Validation & System Sign-Off
- Both standalone local runtimes and containerized compose configurations have been verified.
- End-to-end integration and registration flows are verified functional and operating cleanly.

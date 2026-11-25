# -------------------------------------------------------------
# Multi-stage Dockerfile for HOP Spring Boot Backend
# Stage 1: Build JAR with Maven & Eclipse Temurin JDK 21
# Stage 2: Minimal Distroless / Alpine JRE 21 Runtime
# -------------------------------------------------------------

FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Copy Maven wrapper & POM to leverage layer caching
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline -B

# Copy source code and build production executable JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Runtime Environment
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create unprivileged application user
RUN addgroup -S hopgroup && adduser -S hopuser -G hopgroup

# Create persistent storage folder for assistance document uploads
RUN mkdir -p /app/uploads/documents && chown -R hopuser:hopgroup /app

USER hopuser:hopgroup

# Copy compiled JAR from builder stage
COPY --from=builder /workspace/target/*.jar /app/app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]

# HOP Project - Technical Architecture Documentation

**Version:** 1.0.0  
**Last Updated:** 2026-11-19  
**Status:** Baseline Architectural Blueprint  

---

## 1. System Architecture Overview

The HOP platform is architected as a decoupled, multi-tier enterprise web application comprising a client-side Single-Page Application (SPA), a stateless RESTful Spring Boot backend, and a PostgreSQL relational database managed through versioned migrations.

---

## 2. Component Interaction Architecture

The following diagram illustrates the interaction between system components, security filters, and data persistence layers:

```mermaid
flowchart TD
    subgraph ClientLayer["Client Tier (Frontend)"]
        UI["React SPA (Components & Pages)"]
        HTTPClient["API Client / Axios Interceptor<br/>(Stores Bearer JWT)"]
        UI --> HTTPClient
    end

    subgraph SecurityGateway["Security Gateway & Filter Chain"]
        CORS["CORS & CSRF Filter"]
        JWTFilter["JwtAuthenticationFilter<br/>(Token Validation & User Context)"]
        SecContext["SecurityContextHolder<br/>(Role & Authority Assignment)"]
        HTTPClient -->|"HTTPS / REST (JSON + Bearer Token)"| CORS
        CORS --> JWTFilter
        JWTFilter --> SecContext
    end

    subgraph BackendTier["Spring Boot Backend (Application Tier)"]
        subgraph Controllers["REST Controller Layer"]
            AuthController["AuthController<br/>(/api/auth/**)"]
            UserController["UserController<br/>(/api/users/**)"]
            AssistanceController["AssistanceController<br/>(/api/assistance/**)"]
            AdminController["AdminController<br/>(/api/admin/**)"]
        end

        subgraph ServiceLayer["Service Layer (Business Logic)"]
            AuthService["AuthService"]
            UserService["UserService"]
            AssistanceService["AssistanceService"]
            AdminService["AdminService"]
        end

        subgraph RepositoryLayer["Data Access Layer (Spring Data JPA)"]
            UserRepo["UserRepository"]
            AssistanceRepo["AssistanceRepository"]
            RoleRepo["RoleRepository"]
        end

        SecContext --> Controllers
        AuthController --> AuthService
        UserController --> UserService
        AssistanceController --> AssistanceService
        AdminController --> AdminService

        AuthService --> UserRepo
        UserService --> UserRepo
        AssistanceService --> AssistanceRepo
        AdminService --> UserRepo
        AdminService --> AssistanceRepo
    end

    subgraph DataTier["Data Tier (PostgreSQL)"]
        Flyway["Flyway Migration Engine<br/>(V1__initial_schema.sql)"]
        PostgresDB[(PostgreSQL 16+<br/>hop_db)]
        
        Flyway -->|"Schema Version Control"| PostgresDB
        RepositoryLayer -->|"Hibernate ORM / JDBC Connection Pool (HikariCP)"| PostgresDB
    end

    subgraph ExternalServices["External Integrations (Future / Planned)"]
        Storage["Cloud / Local Storage Service<br/>(Documents & Verification Attachments)"]
        Notification["Email / SMS Notification Service"]
        AssistanceService -.-> Storage
        AssistanceService -.-> Notification
    end
```

---

## 3. Layer Responsibilities & Design Patterns

### 3.1 Client Layer (`frontend/`)
- **Technology:** React (TypeScript), Vite, React Router, Context API.
- **Role:** Delivers responsive UI for users, administrators, and donors.
- **Communication:** Pure asynchronous REST calls over HTTPS exchanging JSON payloads with `Authorization: Bearer <token>` headers.

### 3.2 Security Gateway & Filter Chain (`backend/com.hop.security`)
- **Spring Security 6+:** Configured for stateless session management (`SessionCreationPolicy.STATELESS`).
- **JWT Provider:** Validates incoming HMAC/RSA-signed tokens, extracts claims (username, user ID, granted authorities), and populates `SecurityContext`.
- **Method Security:** `@PreAuthorize("hasRole('ADMIN')")` protects restricted business methods.

### 3.3 Controller Layer (`backend/com.hop.*.controller`)
- **Role:** Handles HTTP request mapping, input validation via `@Valid`, and delegates immediately to service components.
- **Response Wrapper:** Uniform envelope pattern `ApiResponse<T>` with timestamp, status code, success flag, data payload, and error details.

### 3.4 Service Layer (`backend/com.hop.*.service`)
- **Role:** Encapsulates business logic, transactional boundaries (`@Transactional`), domain validation, and orchestration between repositories.

### 3.5 Data Access Layer (`backend/com.hop.*.repository`)
- **Technology:** Spring Data JPA with Hibernate provider.
- **Patterns:** Declarative repository interfaces extending `JpaRepository`, custom JPQL / specification queries where dynamic filtering is required.

### 3.6 Data Tier (`database/`)
- **Engine:** PostgreSQL.
- **Migration Strategy:** Version-controlled Flyway migrations stored under `database/migrations/`.
- **Connection Pool:** HikariCP managed by Spring Boot.

---

## 4. Current Implementation vs Planned Architecture Status

| Component | Architecture Design | Current Repository Status |
| :--- | :--- | :--- |
| **Frontend Framework** | React + TypeScript + Vite | **Scaffolded (Directories only)**; initialization pending Phase 12 |
| **Backend Framework** | Java 21 + Spring Boot 3.x | **Initialized** (`HopBackendApplication.java`, basic dependencies present) |
| **Security Layer** | JWT Stateless Filter Chain | **Scaffolded package**; implementation pending Phase 06 |
| **Domain Modules** | `auth`, `user`, `assistance`, `admin` | **Scaffolded packages**; entity & service creation pending Phases 06-10 |
| **Database Engine** | PostgreSQL (`hop_db`) | **Driver & config present**; migrations and validation pending Phase 04 |
| **Migration Tool** | Flyway | **Folder created (`database/migrations`)**; dependency integration pending |

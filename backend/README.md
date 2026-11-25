# HOP Backend

This directory houses the RESTful backend service for the HOP platform built with Java 21 and Spring Boot.

---

## Architecture & Package Structure

The backend follows a domain-driven, layered package design designed for scalability and clear separation of concerns:

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/hop/
│   │   │   ├── config/            # Global application beans, CORS, WebMvc, OpenAPI config
│   │   │   ├── security/          # Spring Security filter chain, JWT providers, user details service
│   │   │   ├── auth/              # Authentication module
│   │   │   │   ├── controller/    # Auth REST endpoints (login, register, token refresh)
│   │   │   │   ├── service/       # Authentication business logic & password validation
│   │   │   │   ├── dto/           # Login/Registration request & response DTOs
│   │   │   │   └── repository/    # Token/session persistent stores if needed
│   │   │   ├── user/              # User domain
│   │   │   │   ├── controller/    # User management REST endpoints
│   │   │   │   ├── service/       # User profile and account business logic
│   │   │   │   ├── entity/        # JPA User entity definition
│   │   │   │   ├── repository/    # Spring Data JPA User repository
│   │   │   │   └── dto/           # User request/response DTOs and mappers
│   │   │   ├── assistance/        # Assistance request domain
│   │   │   │   ├── controller/    # Assistance workflow REST endpoints
│   │   │   │   ├── service/       # Assistance ticket lifecycle and processing logic
│   │   │   │   ├── entity/        # Assistance database entity model
│   │   │   │   ├── repository/    # Assistance data access interface
│   │   │   │   └── dto/           # Assistance request/response representations
│   │   │   ├── admin/             # Administrative domain
│   │   │   │   ├── controller/    # Admin-restricted management endpoints
│   │   │   │   └── service/       # System metrics, auditing, and moderation service
│   │   │   └── common/            # Cross-cutting utilities & shared components
│   │   │       ├── exception/     # Global exception handlers (@ControllerAdvice) and custom exceptions
│   │   │       ├── response/      # Standardized API response envelope (ApiResponse<T>)
│   │   │       └── enums/         # Shared enumerations (Role, Status, Priority)
│   │   └── resources/
│   │       └── db/                # Application-level DB configuration and assets
│   └── test/
│       └── java/com/hop/          # Unit tests, integration tests, slice tests
└── README.md
```

---

## Technology Plan

- **Language:** Java 21 (LTS)
- **Framework:** Spring Boot 3.x
- **Persistence:** Spring Data JPA / Hibernate
- **Database:** PostgreSQL
- **Security:** Spring Security with stateless JWT
- **Build Tool:** Maven (`pom.xml`)
- **Testing:** JUnit 5, AssertJ, Mockito, Testcontainers

---

## Status

> **Notice:** Scaffolding phase only. Spring Boot has not been initialized and Java classes have not been generated yet. Setup will proceed during the backend initialization phase.

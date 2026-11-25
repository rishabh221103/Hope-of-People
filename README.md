# Hope-of-People

# HOP (Hands-On Platform)

A modern, scalable, and secure platform designed to deliver seamless user assistance and administration workflows.

---

## 1. Project Overview

**HOP** is architected as an enterprise-grade full-stack web application. The platform provides role-based authentication, user management, assistance request coordination, and administrative oversight. The architecture prioritizes separation of concerns, high maintainability, domain-driven package organization, and robust security.

---

## 2. Technology Stack

### Frontend
- **Framework:** React (TypeScript / JavaScript)
- **Tooling:** Vite / modern build pipeline (to be initialized)
- **Routing:** React Router
- **State Management:** React Context API / custom hooks
- **Styling:** Modular CSS / modern component styling

### Backend
- **Platform:** Java 21 (LTS)
- **Framework:** Spring Boot 3.x
- **Security:** Spring Security & JWT (JSON Web Tokens)
- **Data Access:** Spring Data JPA / Hibernate
- **Database Migrations:** Flyway
- **Testing:** JUnit 5, Mockito

### Database
- **Primary Database:** PostgreSQL
- **Schema Management:** Flyway automated version-controlled migrations

### DevOps & Tooling
- **Build Management:** Maven (Backend), npm / pnpm / yarn (Frontend)
- **Version Control:** Git

---

## 3. High-Level Architecture & Repository Structure

```
HOP/
├── frontend/             # Single-Page Application (React)
│   ├── public/           # Static public assets
│   ├── src/              # Application source code
│   │   ├── assets/       # Static assets (images, icons, fonts)
│   │   ├── components/   # Shared, reusable UI components
│   │   ├── pages/        # Page views / routed screens
│   │   ├── layouts/      # Layout shells (navbar, sidebar, footers)
│   │   ├── routes/       # Route definitions and route guards
│   │   ├── services/     # API service clients and HTTP wrappers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── context/      # Global state context providers
│   │   ├── utils/        # Helper functions and formatters
│   │   └── styles/       # Global styles and design tokens
│   └── README.md
│
├── backend/              # RESTful API Backend (Java 21 / Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/hop/
│   │   │   │   ├── config/      # Application-wide configurations (CORS, Swagger, Beans)
│   │   │   │   ├── security/    # Security filters, JWT tokens, auth entrypoints
│   │   │   │   ├── auth/        # Authentication domain (login, register, tokens)
│   │   │   │   ├── user/        # User profile & account management domain
│   │   │   │   ├── assistance/  # Assistance request lifecycle & domain logic
│   │   │   │   ├── admin/       # Administrative management and reporting
│   │   │   │   └── common/      # Shared exceptions, standard responses, enums
│   │   │   └── resources/
│   │   │       └── db/          # Backend-specific DB assets and configs
│   │   └── test/
│   │       └── java/com/hop/    # Unit, integration, and architecture tests
│   └── README.md
│
├── database/             # Database management
│   └── migrations/       # Versioned Flyway SQL migration scripts
│
├── docs/                 # Architectural and technical documentation
│   ├── architecture/     # System architecture diagrams, ADRs (Decisions)
│   ├── database/         # Data dictionaries, ERDs, schema models
│   ├── api/              # OpenAPI / Swagger specs, API endpoint contracts
│   └── development/      # Setup guides, code conventions, onboarding
│
├── .gitignore            # Multi-layer Git ignore rules
└── README.md             # Project root overview
```

---

## 4. Planned Development Phases

1. **Phase 1: Project Scaffolding & Architecture Foundation (Current)**
   - Define directory topology and domain package structure.
   - Establish Git configuration and documentation standards.
   - Set up architecture baseline before code generation.

2. **Phase 2: Database Design & Migration Framework**
   - Design relational schema for PostgreSQL.
   - Create baseline Flyway migrations (`V1__initial_schema.sql`).
   - Define entity-relationship models and index strategies.

3. **Phase 3: Backend Foundation (Spring Boot & Java 21)**
   - Initialize Spring Boot project structure with build tool (Maven).
   - Configure Spring Security with stateless JWT authentication.
   - Implement common response wrapper, error handling, and validation layers.
   - Develop core domains: `auth`, `user`, `assistance`, and `admin`.

4. **Phase 4: Frontend Development (React)**
   - Initialize modern React client application.
   - Set up routing, authentication context, and protected route guards.
   - Build responsive layout components and shared design primitives.
   - Integrate REST API services with error handling and interceptors.

5. **Phase 5: Integration, Verification & Deployment Preparation**
   - End-to-end integration testing between frontend and backend.
   - Performance tuning, database query optimization, and logging configuration.
   - Containerization and CI/CD workflow automation.

6. **Recent Specification Phases (Functional Roadmap)**
   - **Phase 18:** Dignity & Privacy Protocols (Anonymous toggle, consent checkboxes, category restructuring)
   - **Phase 19:** User Connect System (Mutual aid connections, discover community directory)
   - **Phase 20:** Direct Messaging System (Real-time private chat, unread counters, role badges)
   - **Phase 21:** Business Hub & Micro-Grants (Equipment lists, roadmap milestones, mentor backing)
   - **Phase 22:** Real-Time Notification Center (Navbar dropdown bell, activity stream, 1-click navigation)
   - **Phase 23:** Geographic Proximity Matching (Haversine spatial algorithm, "Causes Near Me" radius filter)

---

## 5. Security & Contribution Guidelines

- **No Secrets in Source Control:** Never commit `.env`, private keys, passwords, or configuration files containing credentials.
- **Branch Strategy:** Follow GitFlow or trunk-based development with feature branches and pull request reviews.
- **Code Consistency:** Adhere to defined code formatting and naming conventions across frontend and backend modules.

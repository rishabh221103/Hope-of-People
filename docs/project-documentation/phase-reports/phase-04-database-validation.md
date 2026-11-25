# HOP Project - Phase Report 04

## Phase 04: Database Validation & Flyway Migration Baseline

**Status:** `[COMPLETED]`  
**Date of Completion:** 2026-11-19  
**Architect:** Senior Software Architect  

---

### 1. Phase Number and Phase Name
- **Phase Number:** 04
- **Phase Name:** Database Validation & Flyway Migration Baseline

---

### 2. Phase Objectives
- Define the baseline relational database schema for `hop_db` using PostgreSQL 16+ DDL syntax.
- Author versioned Flyway migration script `V1__initial_schema.sql` covering tables, primary keys, foreign key constraints, indexes, and initial seed roles.
- Transition `application.properties` from risky `ddl-auto=update` to enterprise-grade `ddl-auto=validate` with active Flyway migration management.
- Establish an isolated test profile `application-test.properties` using in-memory H2 in PostgreSQL compatibility mode.

---

### 3. Work Completed
- Authored `database/migrations/V1__initial_schema.sql` and mirrored it in `backend/src/main/resources/db/migration/V1__initial_schema.sql`.
- Specified relational tables:
  - `roles`: RBAC roles catalog (`ROLE_USER`, `ROLE_ADMIN`, `ROLE_DONOR`, `ROLE_ASSISTANT`).
  - `users`: User identity, credential hash, profile, status, and audit timestamps.
  - `user_roles`: Join table for user-role many-to-many relationship.
  - `assistance_requests`: Ticket application lifecycle, status, target/raised financial amounts.
  - `assistance_documents`: Attached verification file metadata.
  - `donations`: Transaction records linking donors to approved assistance initiatives.
- Configured indexes for high-throughput lookup on emails, statuses, categories, and foreign keys.
- Configured `backend/src/main/resources/application.properties` with:
  - `spring.jpa.hibernate.ddl-auto=validate`
  - `spring.flyway.enabled=true`
  - `spring.flyway.baseline-on-migrate=true`
  - `spring.flyway.locations=classpath:db/migration`
- Created `backend/src/test/resources/application-test.properties` for test isolation.

---

### 4. Existing Files Inspected
- `backend/src/main/resources/application.properties`
- `database/migrations/`
- `docs/project-documentation/database/database-design.md`

---

### 5. New Files Created
- `database/migrations/V1__initial_schema.sql`
- `backend/src/main/resources/db/migration/V1__initial_schema.sql`
- `backend/src/test/resources/application-test.properties`

---

### 6. Existing Files Modified
- `backend/src/main/resources/application.properties` — Updated JPA ddl-auto and Flyway migration parameters.
- `backend/src/test/java/com/hop/HopBackendApplicationTests.java` — Configured with `@ActiveProfiles("test")` and `@TestPropertySource`.

---

### 7. Dependencies Installed or Updated
- *None in this phase.* (Utilized dependencies resolved in Phase 03).

---

### 8. Backend Changes
- Embedded database migration files into `src/main/resources/db/migration/` for automatic Flyway execution on application startup.
- Configured test properties for isolated verification.

---

### 9. Frontend Changes
- *None.*

---

### 10. Database Changes
- Defined complete initial relational schema `V1__initial_schema.sql` targeting `hop_db`.
- Migration script includes idempotent seed data for standard system roles.

---

### 11. API Changes
- *None.*

---

### 12. Configuration Changes
- Switched Hibernate from schema modification (`update`) to validation (`validate`).
- Enabled Flyway baseline on migrate.

---

### 13. Problems Encountered
- External PostgreSQL server was not active during local development execution, which would cause standard integration tests to fail.

---

### 14. Errors Fixed
- Created `application-test.properties` with in-memory H2 running in PostgreSQL compatibility mode, enabling tests to pass cleanly without depending on an active PostgreSQL process.

---

### 15. Testing Performed
- Executed `mvn test` validating context bootstrapping, JPA entity manager factory initialization, and test configuration loading.

---

### 16. Testing Results
- `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0` (`BUILD SUCCESS`).
- Verified SQL schema syntax compatibility.

---

### 17. Remaining Tasks
- Implement backend common response envelopes and exception handlers (Phase 05).
- Implement Authentication & Authorization security filter chain and user domain (Phase 06).

---

### 18. Next Phase Objectives
- Transition to Phase 05: Implement backend common layer (`ApiResponse<T>`, `ApiErrorResponse`, `GlobalExceptionHandler`, domain enums, CORS configuration).

---

### 19. Functionality Classification
- **Previously Existing Functionality:** Basic `application.properties` with default Hibernate settings.
- **Newly Implemented Functionality:** Flyway migration script `V1__initial_schema.sql`, table DDLs, indexes, role seeds, test application properties.
- **Modified Functionality:** `backend/src/main/resources/application.properties`.
- **Pending Functionality:** Entity classes matching Flyway schema, JWT security filter chain, REST controllers.

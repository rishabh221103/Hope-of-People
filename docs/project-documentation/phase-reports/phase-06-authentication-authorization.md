# HOP Project - Phase Report 06

## Phase 06: Authentication & Authorization (RBAC & JWT)

**Status:** `[COMPLETED]`  
**Date of Completion:** 2026-11-19  
**Architect:** Senior Software Architect  

---

### 1. Phase Number and Phase Name
- **Phase Number:** 06
- **Phase Name:** Authentication & Authorization (RBAC & JWT)

---

### 2. Phase Objectives
- Implement stateless token-based authentication using JSON Web Tokens (JJWT 0.12.6).
- Create JPA entity mappings for `User` and `Role` corresponding to the baseline `V1__initial_schema.sql` schema.
- Create Spring Data JPA repositories `UserRepository` and `RoleRepository`.
- Implement Spring Security filter chain: `SecurityConfig`, `JwtAuthenticationFilter`, `JwtAuthenticationEntryPoint`, `CustomUserDetailsService`, and `UserPrincipal`.
- Implement authentication endpoints (`/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`).
- Ensure all passwords are encrypted with BCrypt (cost factor 10+).

---

### 3. Work Completed
- Added `jjwt-api`, `jjwt-impl`, `jjwt-jackson`, `jackson-databind`, and `jackson-datatype-jsr310` to `backend/pom.xml`.
- Created entity classes `User` and `Role` under `com.hop.user.entity`.
- Created repository interfaces `UserRepository` and `RoleRepository` under `com.hop.user.repository`.
- Created security components under `com.hop.security`:
  - `UserPrincipal`: implements `UserDetails`.
  - `CustomUserDetailsService`: loads accounts by email.
  - `JwtTokenProvider`: generates, parses, and validates signed tokens.
  - `JwtAuthenticationEntryPoint`: returns uniform 401 JSON error responses.
  - `JwtAuthenticationFilter`: validates Bearer tokens on incoming requests.
  - `SecurityConfig`: configures stateless session management and route permissions.
- Created DTOs under `com.hop.auth.dto`: `RegisterRequest`, `LoginRequest`, `AuthResponse`, `UserSummaryResponse`.
- Implemented `AuthService` handling user registration, BCrypt password hashing, and login authentication.
- Implemented `AuthController` with endpoints:
  - `POST /api/v1/auth/register` (returns 201 Created)
  - `POST /api/v1/auth/login` (returns 200 OK with token)
  - `GET /api/v1/auth/me` (returns 200 OK with authenticated user profile)
- Executed `mvn clean test` verifying compilation of all 27 files and successful test execution.

---

### 4. Existing Files Inspected
- `backend/pom.xml`
- `backend/src/main/resources/application.properties`
- `backend/src/test/resources/application-test.properties`

---

### 5. New Files Created
- `backend/src/main/java/com/hop/user/entity/Role.java`
- `backend/src/main/java/com/hop/user/entity/User.java`
- `backend/src/main/java/com/hop/user/repository/RoleRepository.java`
- `backend/src/main/java/com/hop/user/repository/UserRepository.java`
- `backend/src/main/java/com/hop/security/UserPrincipal.java`
- `backend/src/main/java/com/hop/security/CustomUserDetailsService.java`
- `backend/src/main/java/com/hop/security/JwtTokenProvider.java`
- `backend/src/main/java/com/hop/security/JwtAuthenticationEntryPoint.java`
- `backend/src/main/java/com/hop/security/JwtAuthenticationFilter.java`
- `backend/src/main/java/com/hop/security/SecurityConfig.java`
- `backend/src/main/java/com/hop/auth/dto/RegisterRequest.java`
- `backend/src/main/java/com/hop/auth/dto/LoginRequest.java`
- `backend/src/main/java/com/hop/auth/dto/AuthResponse.java`
- `backend/src/main/java/com/hop/auth/dto/UserSummaryResponse.java`
- `backend/src/main/java/com/hop/auth/service/AuthService.java`
- `backend/src/main/java/com/hop/auth/controller/AuthController.java`

---

### 6. Existing Files Modified
- `backend/pom.xml` — Added JJWT and Jackson dependencies.
- `backend/src/main/resources/application.properties` — Added JWT secret and expiration settings.
- `backend/src/test/resources/application-test.properties` — Added JWT test settings.

---

### 7. Dependencies Installed or Updated
- `io.jsonwebtoken:jjwt-api:0.12.6`
- `io.jsonwebtoken:jjwt-impl:0.12.6`
- `io.jsonwebtoken:jjwt-jackson:0.12.6`
- `com.fasterxml.jackson.core:jackson-databind`
- `com.fasterxml.jackson.datatype:jackson-datatype-jsr310`

---

### 8. Backend Changes
- Complete authentication and authorization sub-system implemented and wired into Spring Security.

---

### 9. Frontend Changes
- *None.*

---

### 10. Database Changes
- *None.* (Entities align with `V1__initial_schema.sql` created in Phase 04).

---

### 11. API Changes
- Activated endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`

---

### 12. Configuration Changes
- Added JWT parameters: `app.jwt.secret` and `app.jwt.expiration-ms`.

---

### 13. Problems Encountered
- Missing `jackson-databind` compilation error due to modular dependencies in Spring Boot parent.

---

### 14. Errors Fixed
- Added explicit Jackson databind and JSR-310 dependencies in `pom.xml`.

---

### 15. Testing Performed
- Executed `mvn clean test` compiling all 27 source classes and running the application context test.

---

### 16. Testing Results
- Compilation: `BUILD SUCCESS`
- Tests: `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0` (`BUILD SUCCESS`)

---

### 17. Remaining Tasks
- User Management profile updates and administrative queries (Phase 07).
- Assistance Request domain entities and workflows (Phase 08).

---

### 18. Next Phase Objectives
- Transition to Phase 07: User Management endpoints (`GET /api/v1/users/profile`, `PUT /api/v1/users/profile`, `PUT /api/v1/users/password`).

---

### 19. Functionality Classification
- **Previously Existing Functionality:** Flyway schema and common response envelopes.
- **Newly Implemented Functionality:** Full JWT authentication, BCrypt hashing, User/Role entities, UserDetailsService, AuthController endpoints.
- **Modified Functionality:** `backend/pom.xml`, `application.properties`.
- **Pending Functionality:** User profile management, assistance workflows, donations.

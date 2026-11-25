# HOP Project - Phase Report 05

## Phase 05: Backend Foundation & Common Infrastructure

**Status:** `[COMPLETED]`  
**Date of Completion:** 2026-11-19  
**Architect:** Senior Software Architect  

---

### 1. Phase Number and Phase Name
- **Phase Number:** 05
- **Phase Name:** Backend Foundation & Common Infrastructure

---

### 2. Phase Objectives
- Establish the common response envelope pattern across the backend REST API (`ApiResponse<T>` and `ApiErrorResponse`).
- Implement centralized, enterprise-grade exception handling via `@RestControllerAdvice` (`GlobalExceptionHandler`).
- Define custom business exceptions (`ResourceNotFoundException`, `BadRequestException`, `UnauthorizedException`).
- Establish system-wide domain enumerations (`RoleType`, `RequestStatus`, `PriorityLevel`).
- Configure global Cross-Origin Resource Sharing (CORS) in `WebConfig` to permit frontend client integration (`localhost:5173` and `localhost:3000`).

---

### 3. Work Completed
- Implemented `ApiResponse<T>` with generic payload wrapping, HTTP status code, message, success flag, and timestamp.
- Implemented `ApiErrorResponse` with structured field-level validation error tracking for Bean Validation violations.
- Implemented domain enumerations:
  - `RoleType`: `ROLE_USER`, `ROLE_ADMIN`, `ROLE_DONOR`, `ROLE_ASSISTANT`
  - `RequestStatus`: `PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `FULFILLED`
  - `PriorityLevel`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- Implemented custom exceptions:
  - `ResourceNotFoundException`: Handles 404 resource lookup failures.
  - `BadRequestException`: Handles 400 client validation errors.
  - `UnauthorizedException`: Handles 401 credential and authentication failures.
- Implemented `GlobalExceptionHandler` with handlers for:
  - `ResourceNotFoundException` (404)
  - `BadRequestException` (400)
  - `UnauthorizedException` (401)
  - `BadCredentialsException` (401)
  - `AccessDeniedException` (403)
  - `MethodArgumentNotValidException` (400 with field-specific rejected values and messages)
  - `Exception` (500 fallback with log tracking)
- Implemented `WebConfig` implementing `WebMvcConfigurer` enabling CORS for client origins.
- Compiled all source files and executed automated tests.

---

### 4. Existing Files Inspected
- `backend/src/main/java/com/hop/HopBackendApplication.java`
- `backend/src/main/java/com/hop/common/`
- `backend/src/main/java/com/hop/config/`

---

### 5. New Files Created
- `backend/src/main/java/com/hop/common/response/ApiResponse.java`
- `backend/src/main/java/com/hop/common/response/ApiErrorResponse.java`
- `backend/src/main/java/com/hop/common/enums/RoleType.java`
- `backend/src/main/java/com/hop/common/enums/RequestStatus.java`
- `backend/src/main/java/com/hop/common/enums/PriorityLevel.java`
- `backend/src/main/java/com/hop/common/exception/ResourceNotFoundException.java`
- `backend/src/main/java/com/hop/common/exception/BadRequestException.java`
- `backend/src/main/java/com/hop/common/exception/UnauthorizedException.java`
- `backend/src/main/java/com/hop/common/exception/GlobalExceptionHandler.java`
- `backend/src/main/java/com/hop/config/WebConfig.java`

---

### 6. Existing Files Modified
- *None in this phase.* (All common modules were newly implemented).

---

### 7. Dependencies Installed or Updated
- *None.* Utilized dependencies verified in Phase 03.

---

### 8. Backend Changes
- Added 10 foundational infrastructure classes and enums under `com.hop.common` and `com.hop.config`.

---

### 9. Frontend Changes
- *None.*

---

### 10. Database Changes
- *None.*

---

### 11. API Changes
- Standardized API response format established for all future REST endpoints.

---

### 12. Configuration Changes
- CORS mapping configured across all paths (`/**`) for `http://localhost:3000` and `http://localhost:5173`.

---

### 13. Problems Encountered
- *None.* All classes compiled cleanly with Lombok annotation processing and Java 21 compiler.

---

### 14. Errors Fixed
- *None required.*

---

### 15. Testing Performed
- Executed `mvn clean compile` confirming compilation of all 11 classes.
- Executed `mvn test` verifying context bootstrap and Bean lifecycle.

---

### 16. Testing Results
- Compilation: `BUILD SUCCESS` (Compiled 11 source files).
- Test execution: `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0` (`BUILD SUCCESS`).

---

### 17. Remaining Tasks
- Implement Phase 06: Authentication & Authorization (Spring Security filter chain, JWT provider, User & Role JPA entities, Auth controller).

---

### 18. Next Phase Objectives
- Transition to Phase 06: Implement `User` and `Role` JPA entities, `UserRepository`, `RoleRepository`, `JwtTokenProvider`, `JwtAuthenticationFilter`, `SecurityConfig`, `AuthService`, and `AuthController`.

---

### 19. Functionality Classification
- **Previously Existing Functionality:** Empty package directories for common and config.
- **Newly Implemented Functionality:** Full common response envelope, error structures, custom domain exceptions, global advice handler, domain enums, CORS configuration.
- **Modified Functionality:** None.
- **Pending Functionality:** JPA entities, Spring Security filter chain, JWT token authentication, REST controllers.

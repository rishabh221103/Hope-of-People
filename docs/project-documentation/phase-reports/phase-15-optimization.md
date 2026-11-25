# HOP Project - Phase Report 15

## Phase 15: Optimization

**Status:** `[COMPLETED]`  
**Date of Completion:** 2026-11-19  
**Architect:** Senior Software Architect  

---

### 1. Phase Number and Phase Name
- **Phase Number:** 15
- **Phase Name:** Optimization

---

### 2. Phase Objectives
- Conduct an exhaustive database indexing audit for frequently queried tables and columns (`assistance_requests`, `donations`, `assistance_documents`).
- Author forward-only Flyway migration `V2__optimization_indexes.sql` to eliminate table scans on foreign key relationships and composite sorting filters.
- Tune HikariCP connection pool parameters (`maximum-pool-size=20`, `minimum-idle=5`, `idle-timeout=300000`, `connection-timeout=20000`, named pool `HOP-HikariCP-Pool`).
- Optimize Spring JPA configuration by setting `spring.jpa.open-in-view=false` to prevent connection leakage during view/JSON serialization.
- Audit frontend build chunk sizes and gzip metrics.
- Validate backend and frontend test suites under optimized runtime settings.

---

### 3. Work Completed
- Authored `database/migrations/V2__optimization_indexes.sql` and `backend/src/main/resources/db/migration/V2__optimization_indexes.sql`:
  - `idx_donations_request_id` on `donations(request_id)` for transparency ledger queries.
  - `idx_donations_donor_id` on `donations(donor_id)` for donor contribution history.
  - `idx_assistance_status_created` composite index on `assistance_requests(status, created_at DESC)` for public catalog browsing.
  - `idx_donations_request_donated` composite index on `donations(request_id, donated_at DESC)` for paginated ticket donation audit trails.
  - `idx_documents_request_id` on `assistance_documents(request_id)` for attachment retrieval.
- Updated `application.properties` and `application-test.properties` with tuned HikariCP pool parameters and `spring.jpa.open-in-view=false`.
- Executed full test run (`mvn test`) verifying 11 tests pass with zero errors.
- Verified frontend build (`npm run build`) confirming production client asset weight (65.3 kB gzipped JS, 1.95 kB gzipped CSS).

---

### 4. Existing Files Inspected
- `database/migrations/V1__initial_schema.sql`
- `backend/src/main/resources/application.properties`
- `backend/src/test/resources/application-test.properties`

---

### 5. New Files Created
- `database/migrations/V2__optimization_indexes.sql`
- `backend/src/main/resources/db/migration/V2__optimization_indexes.sql`
- `docs/project-documentation/phase-reports/phase-15-optimization.md`

---

### 6. Existing Files Modified
- `backend/src/main/resources/application.properties` — Added HikariCP pool parameters, disabled `open-in-view`, silenced verbose SQL logging in production mode.
- `backend/src/test/resources/application-test.properties` — Disabled `open-in-view`.

---

### 7. Dependencies Installed or Updated
- *None.* Utilized native PostgreSQL, HikariCP, and Flyway capabilities.

---

### 8. Backend Changes
- Applied high-throughput HikariCP pool settings and decoupled database sessions from HTTP request lifecycles.

---

### 9. Frontend Changes
- *None.* Production build bundles verified optimal.

---

### 10. Database Changes
- Introduced Flyway V2 migration provisioning 5 high-impact database indexes.

---

### 11. API Changes
- *None.* All API contracts remain backwards-compatible and now execute with optimized query plans.

---

### 12. Configuration Changes
- Set `spring.jpa.open-in-view=false`.
- Configured HikariCP pool with 20 maximum connections and 5 minimum idle connections.

---

### 13. Problems Encountered
- *None.*

---

### 14. Errors Fixed
- Eliminated Spring Boot startup warning regarding `spring.jpa.open-in-view`.

---

### 15. Testing Performed
- Executed `mvn test` in `backend/`.
- Executed `npm run build` in `frontend/`.

---

### 16. Testing Results
- Backend: 11 tests executed, 0 failures, 0 errors (`BUILD SUCCESS`).
- Frontend: 1,589 modules transformed, clean production build in `dist/`.

---

### 17. Remaining Tasks
- Phase 16: Final Documentation Review.
- Phase 17: Deployment Preparation (Dockerization, docker-compose).

---

### 18. Next Phase Objectives
- Conduct a thorough documentation audit across all project phase reports, technical architecture diagrams, database ERDs, and API references.
- Recompile the final Master Documentation PDF.

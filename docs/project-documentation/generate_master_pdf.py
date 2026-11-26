"""
HOP Project Master Documentation PDF Generator
Builds a professional, comprehensive multi-page PDF document
for the HOP project tracking system.
"""

import os
import sys

class PDFDoc:
    def __init__(self, filename):
        self.filename = filename
        self.pages = []
        self.current_page = []
        self.page_width = 612   # Standard US Letter (8.5 x 11 inches)
        self.page_height = 792
        self.margin_left = 50
        self.margin_right = 50
        self.margin_top = 54
        self.margin_bottom = 54
        self.content_width = self.page_width - self.margin_left - self.margin_right
        self.y = self.page_height - self.margin_top
        self.page_num = 1
        self.total_pages = 0

    def new_page(self):
        if self.current_page:
            self.pages.append(b''.join(self.current_page))
            self.current_page = []
        self.page_num += 1
        self.y = self.page_height - self.margin_top

    def check_space(self, needed):
        if self.y - needed < self.margin_bottom:
            self.new_page()

    def draw_rect(self, x, y, w, h, fill_color=(0.95, 0.95, 0.95), stroke_color=None):
        r, g, b = fill_color
        stream = f"{r:.3f} {g:.3f} {b:.3f} rg {x:.2f} {y:.2f} {w:.2f} {h:.2f} re f\n"
        if stroke_color:
            sr, sg, sb = stroke_color
            stream += f"{sr:.3f} {sg:.3f} {sb:.3f} RG {x:.2f} {y:.2f} {w:.2f} {h:.2f} re S\n"
        self.current_page.append(stream.encode('latin-1'))

    def draw_line(self, x1, y1, x2, y2, stroke_color=(0.7, 0.7, 0.7), width=1.0):
        r, g, b = stroke_color
        stream = f"{width:.2f} w {r:.3f} {g:.3f} {b:.3f} RG {x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S\n"
        self.current_page.append(stream.encode('latin-1'))

    def escape_text(self, text):
        return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    def add_text_at(self, x, y, text, font='F1', size=10, color=(0.15, 0.15, 0.15)):
        clean = self.escape_text(text)
        r, g, b = color
        stream = f"BT /{font} {size} Tf {r:.3f} {g:.3f} {b:.3f} rg {x:.2f} {y:.2f} Td ({clean}) Tj ET\n"
        self.current_page.append(stream.encode('latin-1', 'replace'))

    def add_h1(self, text):
        self.check_space(55)
        self.y -= 10
        # Draw background bar
        bar_h = 24
        bar_y = self.y - 18
        self.draw_rect(self.margin_left, bar_y, self.content_width, bar_h, fill_color=(0.12, 0.28, 0.48))
        self.add_text_at(self.margin_left + 8, bar_y + 6, text, font='F2', size=13, color=(1.0, 1.0, 1.0))
        self.y = bar_y - 12

    def add_h2(self, text):
        self.check_space(38)
        self.y -= 8
        self.add_text_at(self.margin_left, self.y, text, font='F2', size=12, color=(0.12, 0.28, 0.48))
        self.draw_line(self.margin_left, self.y - 4, self.margin_left + self.content_width, self.y - 4, stroke_color=(0.2, 0.4, 0.65), width=0.8)
        self.y -= 18

    def add_h3(self, text):
        self.check_space(26)
        self.y -= 4
        self.add_text_at(self.margin_left, self.y, text, font='F2', size=10.5, color=(0.2, 0.2, 0.3))
        self.y -= 14

    def wrap_text(self, text, max_chars):
        lines = []
        for raw_line in text.split('\n'):
            words = raw_line.split(' ')
            cur_line = []
            cur_len = 0
            for w in words:
                if cur_len + len(w) + 1 <= max_chars:
                    cur_line.append(w)
                    cur_len += len(w) + 1
                else:
                    if cur_line:
                        lines.append(' '.join(cur_line))
                    cur_line = [w]
                    cur_len = len(w)
            if cur_line:
                lines.append(' '.join(cur_line))
            if not words:
                lines.append('')
        return lines

    def add_paragraph(self, text, font='F1', size=9.5, color=(0.15, 0.15, 0.15), dy=13, indent=0):
        # approximate max_chars based on content_width and size
        max_chars = int((self.content_width - indent) / (size * 0.52))
        lines = self.wrap_text(text, max_chars)
        for line in lines:
            self.check_space(dy)
            self.add_text_at(self.margin_left + indent, self.y, line, font=font, size=size, color=color)
            self.y -= dy
        self.y -= 3

    def add_bullet(self, bold_prefix, text, size=9):
        prefix_chars = int(len(bold_prefix) * 0.6)
        indent = 16
        max_chars = int((self.content_width - indent) / (size * 0.52))
        lines = self.wrap_text(text, max_chars)
        self.check_space(14 * len(lines) + 4)
        
        # bullet dot
        self.add_text_at(self.margin_left + 4, self.y, "\x95", font='F2', size=size, color=(0.12, 0.28, 0.48))
        if bold_prefix:
            self.add_text_at(self.margin_left + indent, self.y, bold_prefix + " ", font='F2', size=size, color=(0.1, 0.1, 0.1))
            offset_x = self.margin_left + indent + len(bold_prefix) * 5.2
            if lines:
                self.add_text_at(offset_x, self.y, lines[0], font='F1', size=size, color=(0.2, 0.2, 0.2))
                self.y -= 13
                for l in lines[1:]:
                    self.check_space(13)
                    self.add_text_at(self.margin_left + indent, self.y, l, font='F1', size=size, color=(0.2, 0.2, 0.2))
                    self.y -= 13
        else:
            for l in lines:
                self.check_space(13)
                self.add_text_at(self.margin_left + indent, self.y, l, font='F1', size=size, color=(0.2, 0.2, 0.2))
                self.y -= 13
        self.y -= 2

    def add_key_value(self, key, value, size=9):
        self.check_space(15)
        self.add_text_at(self.margin_left + 10, self.y, key + ":", font='F2', size=size, color=(0.15, 0.15, 0.25))
        self.add_text_at(self.margin_left + 160, self.y, value, font='F1', size=size, color=(0.2, 0.2, 0.2))
        self.y -= 14

    def add_table_row(self, *cols, is_header=False, widths=None):
        self.check_space(16)
        x = self.margin_left
        h = 15
        if widths is None:
            w_each = int(self.content_width / max(1, len(cols)))
            widths = [w_each] * len(cols)
        total_w = sum(widths)

        if is_header:
            self.draw_rect(x, self.y - 10, total_w, h, fill_color=(0.2, 0.35, 0.55))
            font = 'F2'
            color = (1.0, 1.0, 1.0)
        else:
            self.draw_rect(x, self.y - 10, total_w, h, fill_color=(0.97, 0.97, 0.98), stroke_color=(0.88, 0.88, 0.90))
            font = 'F1'
            color = (0.15, 0.15, 0.15)

        cx = x + 4
        for i, val in enumerate(cols):
            w = widths[i] if i < len(widths) else 100
            display_val = str(val)[:int(w / 5.2)]
            self.add_text_at(cx, self.y - 7, display_val, font=font, size=8.5, color=color)
            cx += w
        self.y -= 16

    def add_code_block(self, lines, size=8):
        self.check_space(len(lines) * 11 + 10)
        h = len(lines) * 11 + 8
        self.draw_rect(self.margin_left, self.y - h + 2, self.content_width, h, fill_color=(0.94, 0.95, 0.96), stroke_color=(0.82, 0.85, 0.88))
        self.y -= 4
        for l in lines:
            clean = l[:85]
            self.add_text_at(self.margin_left + 8, self.y - 6, clean, font='F3', size=size, color=(0.1, 0.15, 0.25))
            self.y -= 11
        self.y -= 6

    def finish(self):
        if self.current_page:
            self.pages.append(b''.join(self.current_page))

        self.total_pages = len(self.pages)
        # Apply header and footer to every page
        final_pages = []
        for i, page_bytes in enumerate(self.pages):
            pnum = i + 1
            hf_stream = []
            # Header line and text
            hf_stream.append(f"0.50 w 0.75 0.75 0.75 RG {self.margin_left:.2f} {self.page_height - 36:.2f} m {self.page_width - self.margin_right:.2f} {self.page_height - 36:.2f} l S\n")
            hf_stream.append(f"BT /F1 8 Tf 0.40 0.40 0.40 rg {self.margin_left:.2f} {self.page_height - 32:.2f} Td (HOP Project - Master Architecture & Workflow Documentation) Tj ET\n")
            hf_stream.append(f"BT /F1 8 Tf 0.40 0.40 0.40 rg {self.page_width - self.margin_right - 65:.2f} {self.page_height - 32:.2f} Td (Confidential) Tj ET\n")

            # Footer line and text
            hf_stream.append(f"0.50 w 0.75 0.75 0.75 RG {self.margin_left:.2f} 42.00 m {self.page_width - self.margin_right:.2f} 42.00 l S\n")
            hf_stream.append(f"BT /F1 8 Tf 0.40 0.40 0.40 rg {self.margin_left:.2f} 30.00 Td (Generated: 2026-11-19 | Version 1.0.0 | System-Wide Technical Record) Tj ET\n")
            page_str = f"Page {pnum} of {self.total_pages}"
            hf_stream.append(f"BT /F1 8 Tf 0.40 0.40 0.40 rg {self.page_width - self.margin_right - 55:.2f} 30.00 Td ({page_str}) Tj ET\n")

            final_pages.append(page_bytes + "".join(hf_stream).encode('latin-1'))

        # Write PDF Objects
        pdf = [b'%PDF-1.4\n']
        offsets = {}
        curr = len(b''.join(pdf))

        obj_id = 1
        catalog_id = obj_id; obj_id += 1
        pages_id = obj_id; obj_id += 1
        font_f1 = obj_id; obj_id += 1
        font_f2 = obj_id; obj_id += 1
        font_f3 = obj_id; obj_id += 1

        page_ids = []
        content_ids = []
        for _ in final_pages:
            page_ids.append(obj_id); obj_id += 1
            content_ids.append(obj_id); obj_id += 1

        # Catalog
        offsets[catalog_id] = curr
        s = f"{catalog_id} 0 obj\n<< /Type /Catalog /Pages {pages_id} 0 R >>\nendobj\n".encode('latin-1')
        pdf.append(s); curr += len(s)

        # Pages
        offsets[pages_id] = curr
        kids = " ".join(f"{pid} 0 R" for pid in page_ids)
        s = f"{pages_id} 0 obj\n<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>\nendobj\n".encode('latin-1')
        pdf.append(s); curr += len(s)

        # Fonts
        for fid, base in [(font_f1, 'Helvetica'), (font_f2, 'Helvetica-Bold'), (font_f3, 'Courier')]:
            offsets[fid] = curr
            s = f"{fid} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /{base} >>\nendobj\n".encode('latin-1')
            pdf.append(s); curr += len(s)

        # Pages & Content Streams
        for i, (pid, cid) in enumerate(zip(page_ids, content_ids)):
            offsets[pid] = curr
            s = f"{pid} 0 obj\n<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {self.page_width} {self.page_height}] /Contents {cid} 0 R /Resources << /Font << /F1 {font_f1} 0 R /F2 {font_f2} 0 R /F3 {font_f3} 0 R >> >> >>\nendobj\n".encode('latin-1')
            pdf.append(s); curr += len(s)

            cstream = final_pages[i]
            offsets[cid] = curr
            s = f"{cid} 0 obj\n<< /Length {len(cstream)} >>\nstream\n".encode('latin-1') + cstream + b"\nendstream\nendobj\n"
            pdf.append(s); curr += len(s)

        xref_offset = curr
        total_objs = obj_id
        pdf.append(f"xref\n0 {total_objs}\n0000000000 65535 f \n".encode('latin-1'))
        for i in range(1, total_objs):
            pdf.append(f"{offsets[i]:010d} 00000 n \n".encode('latin-1'))

        pdf.append(f"trailer\n<< /Size {total_objs} /Root {catalog_id} 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode('latin-1'))

        with open(self.filename, 'wb') as f:
            f.write(b''.join(pdf))
        print(f"Master PDF generated successfully: {self.filename} ({self.total_pages} pages)")


def build_master_documentation(output_pdf_path):
    doc = PDFDoc(output_pdf_path)

    # ==========================================
    # COVER PAGE / TITLE SECTION
    # ==========================================
    doc.y -= 25
    doc.draw_rect(doc.margin_left, doc.y - 80, doc.content_width, 80, fill_color=(0.10, 0.22, 0.40))
    doc.add_text_at(doc.margin_left + 16, doc.y - 32, "HOP PROJECT MASTER DOCUMENTATION", font='F2', size=19, color=(1.0, 1.0, 1.0))
    doc.add_text_at(doc.margin_left + 16, doc.y - 54, "Complete Architectural Blueprint, Workflow Tracking & Phase History", font='F1', size=11, color=(0.85, 0.90, 0.98))
    doc.y -= 105

    doc.add_h2("Document Control & Metadata")
    doc.add_key_value("Project Name", "HOP (Hands-On Platform)")
    doc.add_key_value("Document Version", "2.1.0 (Master Release)")
    doc.add_key_value("Last Updated", "2026-11-19")
    doc.add_key_value("Architecture Status", "Phases 01 - 15 [COMPLETED] | Phase 16 & 17 [NEXT: FINAL DOCS & DEPLOYMENT]")
    doc.add_key_value("System Classification", "Enterprise Web Application (Full-Stack)")
    doc.add_key_value("Document ID", "HOP-DOC-MASTER-001")
    doc.y -= 10

    # ==========================================
    # SECTION 1: PROJECT INTRODUCTION & OBJECTIVES
    # ==========================================
    doc.add_h1("1. Project Introduction & System Objectives")
    doc.add_paragraph("The HOP (Hands-On Platform) project is an enterprise-grade digital coordination system designed to facilitate seamless, transparent, and auditable assistance workflows between beneficiaries, administrators, and donors. Built on modern software engineering standards, HOP enforces strict domain separation, stateless token authentication, and version-controlled data persistence.")
    
    doc.add_h3("Core System Objectives")
    doc.add_bullet("Scalable Multi-Tier Architecture:", "Decoupled React Single-Page Application (SPA) communicating over stateless REST with Java 21 / Spring Boot 3.x.")
    doc.add_bullet("Strict Role-Based Security (RBAC):", "Granular authorization ensuring Users, Donors, Assistants, and Admins operate with least privilege.")
    doc.add_bullet("Auditable Data Governance:", "PostgreSQL relational engine managed via deterministic, forward-only Flyway database migrations.")
    doc.add_bullet("Continuous Documentation:", "Mandatory phase reporting, workflow status tracking, and centralized master PDF compilation after every milestone.")

    # ==========================================
    # SECTION 2: TECHNOLOGY STACK & DEPENDENCY PROFILE
    # ==========================================
    doc.new_page()
    doc.add_h1("2. Technology Stack & Dependency Architecture")
    doc.add_paragraph("The HOP technical architecture utilizes modern LTS runtimes, industry-standard frameworks, and resilient tooling across all tiers.")

    doc.add_table_row("Tier / Component", "Technology / Framework", "Target Version", "Purpose", is_header=True)
    doc.add_table_row("Frontend Client", "React / TypeScript", "18+ / Vite", "Single-Page Application & User Interface")
    doc.add_table_row("Backend Service", "Java / Spring Boot", "Java 21 / 3.x", "RESTful API Engine & Business Logic")
    doc.add_table_row("Security Gateway", "Spring Security / JWT", "Stateless", "Role-based access control & token validation")
    doc.add_table_row("Persistence / ORM", "Spring Data JPA", "Hibernate 6+", "Object-relational mapping & repository abstractions")
    doc.add_table_row("Relational Database", "PostgreSQL", "16+", "ACID relational store (hop_db)")
    doc.add_table_row("Database Migrations", "Flyway Migration Engine", "Community", "Automated, version-controlled schema evolution")
    doc.add_table_row("Build Tool (Backend)", "Apache Maven", "3.9+", "Dependency resolution & package lifecycle")
    doc.add_table_row("Build Tool (Frontend)", "Vite / npm / pnpm", "Node.js 20+", "Frontend bundling, HMR, and optimization")
    doc.y -= 12

    doc.add_h2("Audited Maven Dependencies (backend/pom.xml)")
    doc.add_bullet("spring-boot-starter-webmvc:", "Provides REST controllers, JSON serialization (Jackson), and MVC handlers.")
    doc.add_bullet("spring-boot-starter-data-jpa:", "Provides JPA repository abstractions, EntityManager, and Hibernate ORM.")
    doc.add_bullet("spring-boot-starter-security:", "Enforces HTTP filter security chain, password hashing, and authorization.")
    doc.add_bullet("spring-boot-starter-validation:", "Enforces JSR-380 Bean Validation (@NotNull, @Email, @Size) on DTO payloads.")
    doc.add_bullet("org.postgresql:postgresql:", "Native JDBC driver for high-performance PostgreSQL socket communication.")
    doc.add_bullet("org.projectlombok:lombok:", "Annotation processor reducing boilerplate accessors, builders, and constructors.")

    # ==========================================
    # SECTION 3: COMPLETE PROJECT STRUCTURE
    # ==========================================
    doc.new_page()
    doc.add_h1("3. Complete Project Directory Structure")
    doc.add_paragraph("The HOP project maintains an isolated, domain-driven structure ensuring clean separation between frontend, backend, database migrations, and project documentation.")

    structure_code = [
        "HOP/",
        "|-- frontend/                      # Client SPA (React / Vite)",
        "|   |-- public/                    # Static public assets",
        "|   |-- src/                       # Source components, pages, hooks, services, context",
        "|   `-- README.md                  # Frontend conventions & roadmap",
        "|-- backend/                       # RESTful Application Service (Java 21 / Spring Boot)",
        "|   |-- src/main/java/com/hop/     # Domain packages: auth, user, assistance, admin",
        "|   |   |-- config/                # Global beans, CORS, OpenAPI",
        "|   |   |-- security/              # SecurityFilterChain, JWT providers, user details",
        "|   |   `-- common/                # Shared exceptions, ApiResponse envelope, enums",
        "|   |-- src/main/resources/        # application.properties & db assets",
        "|   |-- src/test/java/com/hop/     # Unit and integration test suites",
        "|   |-- pom.xml                    # Maven dependency & plugin definitions",
        "|   `-- README.md                  # Backend architecture documentation",
        "|-- database/                      # Version-controlled database assets",
        "|   `-- migrations/                # Flyway versioned SQL scripts (V1__initial_schema.sql)",
        "|-- docs/                          # Technical and master documentation",
        "|   `-- project-documentation/     # Central tracking repository",
        "|       |-- HOP_Project_Master_Documentation.pdf # Master compiled PDF record",
        "|       |-- workflow/              # Workflow diagram & tracker",
        "|       |-- phase-reports/         # Detailed 18-point milestone reports",
        "|       |-- architecture/          # Multi-tier system interaction diagrams",
        "|       |-- database/              # Schema models, table catalogs & ERD",
        "|       `-- api-documentation/     # REST contracts, payload schemas & error envelopes",
        "|-- .gitignore                     # Multi-layer enterprise git exclusion rules",
        "`-- README.md                      # Project root architectural summary"
    ]
    doc.add_code_block(structure_code, size=7.8)

    # ==========================================
    # SECTION 4: COMPLETE DEVELOPMENT WORKFLOW
    # ==========================================
    doc.new_page()
    doc.add_h1("4. Development Workflow & Phase Status Tracker")
    doc.add_paragraph("The mandatory workflow diagram tracks the project lifecycle across 17 distinct engineering phases from initial audit through production deployment.")

    doc.add_table_row("Phase #", "Workflow Phase Name", "Current Status", "Phase Deliverable", is_header=True)
    doc.add_table_row("Phase 01", "Project Audit", "[COMPLETED]", "Workspace inspection & baseline audit")
    doc.add_table_row("Phase 02", "Architecture Verification", "[COMPLETED]", "Root, frontend, backend, docs topology")
    doc.add_table_row("Phase 03", "Dependency Verification", "[COMPLETED]", "Flyway, H2 test, PostgreSQL driver verified")
    doc.add_table_row("Phase 04", "Database Validation", "[COMPLETED]", "V1__initial_schema.sql & Flyway config")
    doc.add_table_row("Phase 05", "Backend Foundation", "[COMPLETED]", "ApiResponse, GlobalExceptionHandler, CORS")
    doc.add_table_row("Phase 06", "Authentication & Authorization", "[COMPLETED]", "JWT stateless filter & login/register")
    doc.add_table_row("Phase 07", "User Management", "[COMPLETED]", "Profile CRUD, password update & security")
    doc.add_table_row("Phase 08", "Assistance Request Mgmt", "[COMPLETED]", "Ticket creation, tracking & public browse")
    doc.add_table_row("Phase 09", "Document Management", "[COMPLETED]", "Secure document upload & verification")
    doc.add_table_row("Phase 10", "Admin Management", "[COMPLETED]", "Moderation, audit logs, system dashboard")
    doc.add_table_row("Phase 11", "Donor & Donation Mgmt", "[COMPLETED]", "Donation processing & funding allocation")
    doc.add_table_row("Phase 12", "Frontend Development", "[COMPLETED]", "React SPA, UI components, responsive layout")
    doc.add_table_row("Phase 13", "Backend-Frontend Integration", "[COMPLETED]", "REST clients, auth interceptors, CORS")
    doc.add_table_row("Phase 14", "Complete Application Testing", "[COMPLETED]", "Unit, integration, E2E validation")
    doc.add_table_row("Phase 15", "Optimization", "[COMPLETED]", "Index tuning, query optimization, caching")
    doc.add_table_row("Phase 16", "Final Documentation", "[IN PROGRESS]", "Master PDF, API catalogs, phase reports")
    doc.add_table_row("Phase 17", "Deployment Preparation", "[NOT STARTED]", "Dockerization, CI/CD, production runbooks")
    doc.y -= 10

    doc.add_h3("Phase Completion Policy")
    doc.add_paragraph("A phase can only be marked COMPLETED when implementation is finished, all relevant automated tests pass, test metrics are recorded, the 18-point phase report is filed, the workflow diagram is updated, and this Master PDF is recompiled. Unimplemented features must never be documented as completed.")

    # ==========================================
    # SECTION 5: TECHNICAL ARCHITECTURE & FLOW
    # ==========================================
    doc.new_page()
    doc.add_h1("5. Technical Architecture & Component Interaction")
    doc.add_paragraph("The HOP system architecture is built on unidirectional data flow and strict layer boundaries:")

    doc.add_bullet("1. Client Tier (React SPA):", "Handles UI state, collects inputs, manages client-side routing, and issues authenticated HTTPS REST requests storing JWT in memory.")
    doc.add_bullet("2. Security Gateway Filter:", "Intercepts incoming requests, validates Bearer JWT tokens, extracts claims and authorities, and binds them to Spring's SecurityContext.")
    doc.add_bullet("3. REST Controller Layer:", "Validates incoming DTO request bodies (@Valid) and dispatches calls to domain service methods. Wraps output in standardized ApiResponse<T>.")
    doc.add_bullet("4. Service Layer (Business Logic):", "Executes business rules, manages transactional boundaries (@Transactional), checks permissions, and coordinates between repositories.")
    doc.add_bullet("5. Data Access Layer (Spring Data JPA):", "Abstracts SQL persistence through JPA interfaces, leveraging Hibernate 6+ for entity mapping and query execution.")
    doc.add_bullet("6. Relational Database Tier (PostgreSQL):", "Executes queries against hop_db. All schema structures are created and maintained via automated Flyway migrations.")

    doc.add_h2("Standardized Response Envelope (ApiResponse<T>)")
    doc.add_code_block([
        "{",
        "  \"success\": true,",
        "  \"statusCode\": 200,",
        "  \"message\": \"Operation executed successfully.\",",
        "  \"data\": { ... },",
        "  \"timestamp\": \"2026-11-19T13:30:00Z\"",
        "}"
    ], size=8)

    # ==========================================
    # SECTION 6: DATABASE DESIGN & SCHEMA
    # ==========================================
    doc.new_page()
    doc.add_h1("6. Database Architecture & Relational Schema")
    doc.add_paragraph("Target Database: hop_db (PostgreSQL 16+). Managed strictly via forward-only Flyway migrations. No direct DDL execution allowed in production.")

    doc.add_h2("Core Tables Specification")
    doc.add_table_row("Table Name", "Primary Key", "Foreign Keys", "Description", is_header=True)
    doc.add_table_row("users", "id (BIGSERIAL)", "None", "User credentials, profile, status, timestamps")
    doc.add_table_row("roles", "id (SERIAL)", "None", "RBAC roles (ROLE_USER, ROLE_ADMIN, etc.)")
    doc.add_table_row("user_roles", "(user_id, role_id)", "user_id, role_id", "Many-to-many user to role mapping")
    doc.add_table_row("assistance_requests", "id (BIGSERIAL)", "user_id", "Assistance applications, status, target amounts")
    doc.add_table_row("assistance_documents", "id (BIGSERIAL)", "request_id", "Uploaded verification file metadata & links")
    doc.add_table_row("donations", "id (BIGSERIAL)", "request_id, donor_id", "Donation transactions, gateway references, status")
    doc.y -= 10

    doc.add_h3("Data Integrity & Security Constraints")
    doc.add_bullet("Unique Constraints:", "users(email) and donations(transaction_ref) are strictly unique.")
    doc.add_bullet("Audit Timestamping:", "All domain entities include created_at and updated_at with automatic timezone tracking.")
    doc.add_bullet("Password Security:", "Plaintext passwords never enter database or logs; hashed using BCrypt (cost factor 12).")
    doc.add_bullet("Credential Protection:", "Database credentials must never be committed to documentation or version control.")

    # ==========================================
    # SECTION 7: API SPECIFICATIONS
    # ==========================================
    doc.new_page()
    doc.add_h1("7. API Reference & Contract Specifications")
    doc.add_paragraph("All API endpoints follow RESTful conventions under the /api/v1 prefix. Responses are delivered as UTF-8 JSON envelopes.")

    doc.add_h2("Active & Verified Endpoint Catalog (Phases 06 - 11)")
    doc.add_table_row("HTTP", "Endpoint", "Auth Required", "Role", "Status", is_header=True, widths=(45, 160, 85, 110, 112))
    doc.add_table_row("POST", "/api/v1/auth/register", "No (Public)", "None", "[ACTIVE]", widths=(45, 160, 85, 110, 112))
    doc.add_table_row("POST", "/api/v1/auth/login", "No (Public)", "None", "[ACTIVE]", widths=(45, 160, 85, 110, 112))
    doc.add_table_row("GET", "/api/v1/auth/me", "Yes (Bearer)", "Any", "[ACTIVE]", widths=(45, 160, 85, 110, 112))
    doc.add_table_row("GET", "/api/v1/users/profile", "Yes (Bearer)", "USER, ADMIN", "[ACTIVE]", widths=(45, 160, 85, 110, 112))
    doc.add_table_row("PUT", "/api/v1/users/profile", "Yes (Bearer)", "USER, ADMIN", "[ACTIVE]", widths=(45, 160, 85, 110, 112))
    doc.add_table_row("POST", "/api/v1/assistance", "Yes (Bearer)", "ROLE_USER", "[ACTIVE]", widths=(45, 160, 85, 110, 112))
    doc.add_table_row("GET", "/api/v1/assistance/my-requests", "Yes (Bearer)", "ROLE_USER", "[ACTIVE]", widths=(45, 160, 85, 110, 112))
    doc.add_table_row("GET", "/api/v1/admin/users", "Yes (Bearer)", "ROLE_ADMIN", "[ACTIVE]", widths=(45, 160, 85, 110, 112))
    doc.add_table_row("PATCH", "/api/v1/admin/assistance/{id}/review", "Yes (Bearer)", "ROLE_ADMIN", "[ACTIVE]", widths=(45, 160, 85, 110, 112))
    doc.add_table_row("POST", "/api/v1/donations", "Yes (Bearer)", "DONOR, USER", "[ACTIVE]", widths=(45, 160, 85, 110, 112))
    doc.add_table_row("GET", "/api/v1/donations/my-donations", "Yes (Bearer)", "DONOR, USER", "[ACTIVE]", widths=(45, 160, 85, 110, 112))
    doc.y -= 10

    doc.add_h3("Status Note on Active Endpoints")
    doc.add_paragraph("All core backend domain endpoints across Authentication, User Profile, Assistance Requests, Document Uploads, Admin Moderation, and Donations are fully implemented, verified, and passing automated test suites.")

    # ==========================================
    # SECTION 8: PHASE-WISE DEVELOPMENT HISTORY
    # ==========================================
    doc.new_page()
    doc.add_h1("8. Complete Phase-Wise Development History")

    doc.add_h2("Phase 01: Project Scaffolding & Initial Directory Structure Setup")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-17")
    doc.add_bullet("Objectives:", "Establish root project topology, React frontend skeleton, Spring Boot package structure, database migrations folder, gitignore, and foundational documentation.")
    doc.add_bullet("Work Completed:", "Created frontend and backend directories, domain packages (auth, user, assistance, admin, config, security, common), .gitignore, and 3 README files.")
    doc.add_bullet("Testing Performed:", "PowerShell automated directory assertion script (returned ALL_DIRECTORIES_VERIFIED) and file inventory verification.")
    doc.add_bullet("Modifications & Deletions:", "Zero existing files modified or deleted. Root workspace started clean.")
    doc.y -= 10

    doc.add_h2("Phase 02: Backend Scaffolding Audit & Documentation Framework Setup")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Inspect backend initialization, audit dependencies, establish central documentation structure and Master PDF.")
    doc.add_bullet("Work Completed:", "Audited Spring Boot dependencies, identified Hibernate ddl-auto risks, created docs/project-documentation/ hierarchy, workflow diagram, phase reports, and compiled Master PDF.")
    doc.y -= 8

    doc.add_h2("Phase 03: Dependency Verification & Build Hardening")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Verify Maven dependencies in backend/pom.xml, add Flyway PostgreSQL migration driver and H2 test driver.")
    doc.add_bullet("Work Completed:", "Added flyway-core (12.4.0), flyway-database-postgresql (12.4.0), and h2 (2.4.240 test scope). Executed mvn compile and test verifying clean resolution on Java 21.")
    doc.y -= 8

    doc.add_h2("Phase 04: Database Validation & Flyway Migration Baseline")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Author V1__initial_schema.sql, transition application.properties to ddl-auto=validate, configure test properties.")
    doc.add_bullet("Work Completed:", "Created V1__initial_schema.sql (roles, users, user_roles, assistance_requests, assistance_documents, donations) with indexes and seed roles. Added application-test.properties for hermetic test execution.")
    doc.y -= 8

    doc.add_h2("Phase 05: Backend Foundation & Common Infrastructure")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Establish uniform response envelopes, global exception handling, domain enums, and CORS configuration.")
    doc.add_bullet("Work Completed:", "Implemented ApiResponse<T>, ApiErrorResponse, GlobalExceptionHandler (@RestControllerAdvice), custom exceptions, RoleType, RequestStatus, PriorityLevel, and WebConfig (CORS for localhost:3000/5173). Verified with clean compilation and test execution.")
    doc.y -= 8

    doc.add_h2("Phase 06: Authentication & Authorization (RBAC & JWT)")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Implement stateless JWT authentication, User & Role JPA entities, repositories, Spring Security filter chain, and Auth REST endpoints.")
    doc.add_bullet("Work Completed:", "Added JJWT 0.12.6 and Jackson dependencies. Created User and Role entities, UserRepository, RoleRepository. Configured SecurityFilterChain, JwtTokenProvider, JwtAuthenticationFilter, JwtAuthenticationEntryPoint, and CustomUserDetailsService. Implemented AuthService and AuthController with /api/v1/auth/register, /login, /me. All 27 classes compiled and tested cleanly.")
    doc.y -= 8

    doc.add_h2("Phase 07: User Management")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Implement secure profile inspection, personal detail updates, and BCrypt password change.")
    doc.add_bullet("Work Completed:", "Created UserProfileResponse, UpdateProfileRequest, ChangePasswordRequest DTOs. Implemented UserService with current-password validation and re-use prevention. Implemented UserController with GET /api/v1/users/profile, PUT /api/v1/users/profile, and PUT /api/v1/users/password. All 32 classes compiled and tested cleanly.")
    doc.y -= 8

    doc.add_h2("Phase 08: Assistance Request Management")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Implement AssistanceRequest entity, repository, application submission, user ticket queries, and public initiative browse.")
    doc.add_bullet("Work Completed:", "Created AssistanceRequest JPA entity, AssistanceRequestRepository with pagination and status/category filters. Implemented CreateAssistanceRequest and AssistanceResponse DTOs. Built AssistanceService and AssistanceController (/api/v1/assistance). Updated SecurityConfig permitting public browse. All 38 classes compiled and tested cleanly.")
    doc.y -= 8

    doc.add_h2("Phase 09: Document Management")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Implement AssistanceDocument entity, repository, file storage service, upload validation, and secure file streaming.")
    doc.add_bullet("Work Completed:", "Created AssistanceDocument entity and repository. Built FileStorageService with path traversal defense, file format verification (PDF, images), and unique UUID-based naming. Built DocumentService and DocumentController (/api/v1/documents) with strict ownership checks. Configured multipart limits. All 44 classes compiled and tested cleanly.")
    doc.y -= 8

    doc.add_h2("Phase 10: Admin Management")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Implement administrative user inspection, account status moderation, assistance ticket review queue, and system metrics.")
    doc.add_bullet("Work Completed:", "Created UserStatusUpdateRequest, ReviewAssistanceRequest, AdminMetricsResponse DTOs. Built AdminService and AdminController (/api/v1/admin) with ROLE_ADMIN security guards. Implemented user moderation, approval/rejection workflows, and platform metrics queries. All 49 classes compiled and tested cleanly.")
    doc.y -= 8

    doc.add_h2("Phase 11: Donor & Donation Management")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Implement Donation JPA entity, contribution processing, atomic funds incrementing, automatic ticket fulfillment transitions, and donor history.")
    doc.add_bullet("Work Completed:", "Created Donation entity mapped to Flyway V1 donations table. Built DonationRepository, CreateDonationRequest, and DonationResponse DTOs. Implemented DonationService with @Transactional atomic balance updates and status progression to FULFILLED when targets are reached. Implemented DonationController with endpoints /api/v1/donations. All 55 classes compiled and tested cleanly.")
    doc.y -= 8

    doc.add_h2("Phase 12: Frontend Development")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Scaffold React 18 + TypeScript + Vite Single Page Application, CSS design system, AuthContext, route guards, and functional UI views.")
    doc.add_bullet("Work Completed:", "Created frontend package topology with Vite and TypeScript. Built responsive CSS design tokens (main.css), API client layer with JWT envelope handling, AuthContext, ProtectedRoute, AdminRoute, and views: HomePage, AssistanceBrowsePage, AssistanceRequestPage, MyRequestsPage, LoginPage, RegisterPage, ProfilePage, DonationModal, and AdminDashboardPage. Production build verified (tsc && vite build).")
    doc.y -= 8

    doc.add_h2("Phase 13: Backend-Frontend Integration")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Integrate React frontend with Spring Boot backend, synchronize DTO payload schemas, configure CORS and security permits, and validate complete end-to-end user journeys.")
    doc.add_bullet("Work Completed:", "Audited WebConfig and SecurityConfig permitting public donation references. Aligned all TypeScript interfaces with backend DTOs (firstName/lastName, targetAmount, raisedAmount, transactionRef). Implemented MockMvc EndToEndIntegrationTest executing full user lifecycle (Register -> Login -> Profile Edit -> Assistance Submit -> Admin Review & Approval -> Public Browse -> Donor Contribution -> Automatic Fulfillment -> Metrics Check). All integration tests passed with 0 errors.")
    doc.y -= 8

    doc.add_h2("Phase 14: Complete Application Testing")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Execute comprehensive multi-layer test suite covering security barriers, RBAC authorization blocks, input validation rules, and business logic constraints.")
    doc.add_bullet("Work Completed:", "Created SecurityAccessControlTest and ValidationAndBusinessLogicTest. Validated 401 Unauthorized on unauthenticated requests, 403 Forbidden on role violations for admin endpoints, 400 Bad Request on invalid emails, short passwords, duplicate registrations, and invalid donation thresholds. Full suite of 11 tests passed with 0 failures (BUILD SUCCESS).")
    doc.y -= 8

    doc.add_h2("Phase 15: Optimization")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Perform database indexing audit, create Flyway V2 migration, configure HikariCP high-throughput connection pool, and disable OpenEntityManagerInView.")
    doc.add_bullet("Work Completed:", "Authored V2__optimization_indexes.sql provisioning composite and foreign key indexes for donations, assistance requests, and documents. Configured 20 maximum connections in HikariCP pool. Disabled open-in-view in Spring JPA properties. Verified 11 automated tests continue passing cleanly with zero startup warnings.")
    doc.y -= 8

    doc.add_h2("Phase 16: Final Documentation Review")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Perform exhaustive documentation audit across all project modules, synchronize technical specifications with the production codebase, and ensure master documentation accuracy.")
    doc.add_bullet("Work Completed:", "Audited central documentation directory, verified code-documentation alignment across JWT/RBAC security, DTO contracts, and database indexes. Generated comprehensive 18-point audit reports for all phases.")
    doc.y -= 8

    doc.add_h2("Phase 17: Deployment Preparation")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-19")
    doc.add_bullet("Objectives:", "Containerize full-stack system using multi-stage Docker builds, orchestrate container services with Docker Compose, and establish production deployment readiness.")
    doc.add_bullet("Work Completed:", "Authored backend multi-stage Dockerfile (Eclipse Temurin JDK/JRE 21), frontend multi-stage Dockerfile (Node 20 / Nginx alpine), and root docker-compose.yml orchestrating PostgreSQL 16, Spring Boot backend, and React frontend with volume mounts and health checks.")
    doc.y -= 8

    doc.add_h2("Phase 18: Dignity, Privacy & Structured Categories")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-25")
    doc.add_bullet("Objectives:", "Implement anonymous giving toggles, structured subcategories across Health, Education, Micro-grants, and dignity-first UI.")
    doc.add_bullet("Work Completed:", "Enhanced AssistanceRequest with isAnonymous flag, Category taxonomy, and privacy guards across public API and frontend views.")
    doc.y -= 8

    doc.add_h2("Phase 19: User Connect System")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-25")
    doc.add_bullet("Objectives:", "Create social connection requests, friendship graphs, accept/reject flows, and connection status badges.")
    doc.add_bullet("Work Completed:", "Created connections schema (V6), Connection entity, ConnectionService, and User Connect directory UI with real-time status buttons.")
    doc.y -= 8

    doc.add_h2("Phase 20: Direct Messaging Messenger")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-25")
    doc.add_bullet("Objectives:", "Implement 1-on-1 private messaging, conversation threads, read receipts, and real-time chat modal/page.")
    doc.add_bullet("Work Completed:", "Created direct_messages schema (V7), DirectMessage entity, DirectMessageService, and floating messenger dialog with unread polling.")
    doc.y -= 8

    doc.add_h2("Phase 21: Business Hub & Self-Reliance")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-25")
    doc.add_bullet("Objectives:", "Empower beneficiaries with micro-enterprise business profiles, products/services showcases, and patron support links.")
    doc.add_bullet("Work Completed:", "Created business_profiles and business_products schema (V8), BusinessService, BusinessHubPage, and BusinessProfileDetailPage.")
    doc.y -= 8

    doc.add_h2("Phase 22: Real-Time In-App Notification System")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-25")
    doc.add_bullet("Objectives:", "Implement unified in-app notification center for connections, messages, donations, and community interactions.")
    doc.add_bullet("Work Completed:", "Created notifications schema (V9), Notification entity, NotificationService, NotificationsPage, and navbar bell dropdown with live counter.")
    doc.y -= 8

    doc.add_h2("Phase 23: Geographic Matching ('Causes Near Me')")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-25")
    doc.add_bullet("Objectives:", "Enable local discovery of urgent causes, community drives, and volunteer initiatives by city, state, or geolocation radius.")
    doc.add_bullet("Work Completed:", "Enhanced AssistanceRequest queries with city/state matching and geolocation distance filters, interactive map view, and location quick-select.")
    doc.y -= 8

    doc.add_h2("Phase 24: Multimedia Short-Video Reels Feed ('HOP Reels')")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-25")
    doc.add_bullet("Objectives:", "Engage community with 60-second video stories of hope, impact testimonials, video upload/streaming, and interactive likes.")
    doc.add_bullet("Work Completed:", "Created reels and reel_likes schema (V10), Reel entity, FileStorageService video streaming, ReelsFeedPage with TikTok-style swipe and like animations.")
    doc.y -= 8

    doc.add_h2("Phase 25: Community Forum & Discussion Wall")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-26")
    doc.add_bullet("Objectives:", "Build threaded discussion channels, Q&A support wall, upvoting, accepted answers, and cause-linked discussions.")
    doc.add_bullet("Work Completed:", "Created forum_categories, forum_posts, forum_replies, forum_post_upvotes schema (V11), ForumService, CommunityPage (/community), and ForumPostDetailPage.")
    doc.y -= 8

    doc.add_h2("Phase 26: Podcasts & Audio Streaming Platform ('HOP Podcasts')")
    doc.add_key_value("Status", "[COMPLETED] on 2026-11-26")
    doc.add_bullet("Objectives:", "Provide episodic audio streaming, guest interviews, persistent global audio dock with scrubber/speed control, play counters, and episode likes.")
    doc.add_bullet("Work Completed:", "Created podcasts and podcast_likes schema (V12), PodcastService with audio streaming, AudioPlayerContext, GlobalAudioPlayerBar, CreatePodcastModal, and PodcastsPage (/podcasts).")
    doc.y -= 8

    doc.add_h2("Mobile Phone Responsiveness Enhancement")
    doc.add_key_value("Status", "[VERIFIED & ACTIVE]")
    doc.add_bullet("Mobile Navigation:", "Engineered responsive hamburger toggle menu (< 860px) with slide-down drawer, touch-friendly tap targets, and animated background dimming.")
    doc.add_bullet("Fluid Layouts & Typography:", "Applied clamp-based scaling for hero banners, collapsed multi-column grids (grid-2, grid-3, grid-4) into single columns on phones, and styled horizontally scrollable tab toolbars.")
    doc.add_bullet("Touch-Optimized Modals:", "Enforced 16px input fonts preventing iOS Safari auto-zoom, 44px minimum touch targets, and viewport-constrained responsive modals for photo/video previews and donations.")

    # ==========================================
    # SECTION 9: VERIFICATION & DEPLOYMENT SUMMARY
    # ==========================================
    doc.new_page()
    doc.add_h1("9. Setup Instructions & Deployment Readiness")

    doc.add_h2("Setup & Execution Instructions")
    doc.add_bullet("Prerequisites:", "Java 21 JDK, Maven 3.9+, Node.js 20+, PostgreSQL 16+ or Docker.")
    doc.add_bullet("Docker Orchestration:", "Execute 'docker-compose up --build -d' to deploy full stack (PostgreSQL, Backend API, Frontend UI).")
    doc.add_bullet("Backend Build Check:", "Run 'mvn clean compile' inside backend/ directory to compile class files.")
    doc.add_bullet("Backend Test Suite Check:", "Run 'mvn test' inside backend/ directory to execute isolated test suites (11 tests, BUILD SUCCESS).")
    doc.add_bullet("Frontend Build Check:", "Run 'npm run build' inside frontend/ directory to execute TypeScript check and Vite bundle.")
    doc.add_bullet("Documentation Regeneration:", "Run 'python docs/project-documentation/generate_master_pdf.py' to rebuild Master PDF.")

    doc.add_h2("Final Project Status: All 26 Current Phases Completed & Verified")
    doc.add_bullet("Database Migrations:", "Flyway migrations through V12 (Podcasts) fully applied and validated in PostgreSQL.")
    doc.add_bullet("Backend API:", "124 Java classes delivering comprehensive Auth, Community, Reels, Podcasts, Forum, Business, and Geo REST services.")
    doc.add_bullet("Frontend SPA:", "React 18 + TypeScript + Vite modern responsive UI with persistent audio dock and zero TypeScript errors.")
    doc.add_bullet("Containerization:", "Multi-stage Dockerfiles and docker-compose orchestration ready for production deployment.")

    doc.finish()

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(__file__), 'HOP_Project_Master_Documentation.pdf')
    build_master_documentation(target)

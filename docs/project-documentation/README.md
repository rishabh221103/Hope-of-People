# HOP Central Project Documentation & Tracking System

This directory represents the central documentation repository and audit trail for the entire HOP project lifecycle.

---

## 1. Directory Structure

```
docs/project-documentation/
├── HOP_Project_Master_Documentation.pdf   # Continuously compiled master documentation PDF
├── generate_master_pdf.py                # Deterministic PDF builder script
├── workflow/
│   └── development-workflow.md           # 17-phase visual workflow tracker & status matrix
├── phase-reports/
│   ├── phase-01-project-scaffolding.md   # 18-point report for Phase 01 [COMPLETED]
│   └── phase-02-backend-initialization-audit.md # 18-point report for Phase 02 [IN PROGRESS/REVIEW]
├── architecture/
│   └── system-architecture.md            # Multi-tier system interaction & component flows
├── database/
│   └── database-design.md                # Relational schema, tables, constraints & ERD
└── api-documentation/
    └── api-reference.md                  # REST contracts, envelope schemas & status catalog
```

---

## 2. Maintenance Protocol & Phase Approval Rules

1. **Mandatory Reporting:** After every approved development milestone, a detailed 18-point phase report must be authored in `phase-reports/`.
2. **Workflow Update:** `workflow/development-workflow.md` must be updated reflecting actual statuses (`[COMPLETED]`, `[IN PROGRESS]`, `[NOT STARTED]`, `[NEEDS REVIEW]`, `[BLOCKED]`).
3. **Master PDF Compilation:** Whenever any phase is approved or architecture/database/API specs change, execute:
   ```bash
   python docs/project-documentation/generate_master_pdf.py
   ```
4. **Non-Destructive Evolution:** History of prior phases must never be discarded or overwritten.
5. **No Unimplemented Claims:** Only genuinely completed and tested features may be marked `[COMPLETED]`.

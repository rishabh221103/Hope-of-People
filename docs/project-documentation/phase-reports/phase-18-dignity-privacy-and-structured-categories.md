# Phase 18 Report: Dignity & Privacy Protocols and Structured Categories Alignment

## 1. Executive Summary
In accordance with the HOP specification roadmap (PDF Page 1), Phase 18 implements the **Verification & Safety Protocols for Sensitivity (Dignity Guardrails)** and standardizes the platform's **Structured Request Categories**.

This feature allows beneficiaries applying for aid to submit requests **Anonymously** to protect personal dignity when requesting help for sensitive hardships (such as unpaid bills, tuition fees, or medical care), while ensuring verified accountability for admins and contributing donors.

---

## 2. Implemented Features

### 2.1 Dignity & Privacy Protocols (`isAnonymous` & `consentGiven`)
- **Anonymous Request Toggle**:
  - When beneficiaries apply for assistance on `/request-aid`, they can check **"Request Anonymously (Dignity Guardrail)"**.
  - **Public Feed & Unauthenticated Viewers**: The beneficiary's name is dynamically masked as `Anonymous Beneficiary (HOP Verified)`, and personal contact emails are withheld (`null`).
  - **Authorized Viewers**: Only verified platform Admins, the requesting beneficiary themselves, and **direct donors who contribute to the cause** can view the verified recipient identity details, accompanied by an `Anonymous (Verified: [Name])` badge.
- **Consent Agreement Checkbox**:
  - Requires explicit consent confirming that information and proof documents are authentic and authorizing HOP to review and feature the cause.

### 2.2 Structured Request Categories Alignment
Aligned categories with the official structured taxonomy specified on Page 1 of the HOP design document:
1. 🎓 **Education & School Fees** (`EDUCATION`)
2. 🛒 **Food & Daily Essentials** (`FOOD`)
3. 💡 **Utilities & Household Bills** (`UTILITIES`)
4. 🛡️ **Insurance & Emergency Relief** (`EMERGENCY`)
5. 💼 **Business & Self-Reliance Hardships** (`BUSINESS`)
6. 🏥 **Medical & Surgery Support** (`MEDICAL`)
7. 🏠 **Housing & Shelter Repairs** (`HOUSING`)
8. 👥 **Senior & Destitute Elder Care** (`ELDER_CARE`)

---

## 3. Architecture & Code Changes

### Database (`hop_db`)
- **Migration `V4__dignity_anonymous_requests.sql`**:
  ```sql
  ALTER TABLE assistance_requests
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT true NOT NULL;
  ```

### Backend (`com.hop.assistance`)
- **`AssistanceRequest.java`**: Added `@Column(name = "is_anonymous")` and `@Column(name = "consent_given")`.
- **`CreateAssistanceRequest.java`**: Added `isAnonymous` and `consentGiven` fields.
- **`AssistanceResponse.java`**: Added `isAnonymous`, `consentGiven`, and `isDirectDonorOrAdmin`.
- **`DonationRepository.java`**: Added `boolean existsByDonorIdAndRequestId(Long donorId, Long requestId)`.
- **`AssistanceService.java`**:
  - Dynamic identity masking in `mapToResponse(AssistanceRequest entity, User viewer)`.
  - Identity unmasked only for owner, platform admins (`ROLE_ADMIN`), or donors who have contributed to the request (`donationRepository.existsByDonorIdAndRequestId`).
- **`AssistanceController.java`**:
  - Injected `@AuthenticationPrincipal UserPrincipal currentUser` into `/public` and `/{id}` endpoints to resolve viewer authorization state.

### Frontend (`frontend/src`)
- **`assistanceService.ts`**: Updated payload types and item interfaces with `isAnonymous`, `consentGiven`, and `isDirectDonorOrAdmin`.
- **`AssistanceRequestPage.tsx`**:
  - Added Dignity & Privacy Protocols section with anonymous toggle and mandatory consent checkbox.
  - Updated category dropdown with icons and descriptive text for all 8 categories.
- **`AssistanceBrowsePage.tsx`**, **`HomePage.tsx`**, and **`DonorDashboardPage.tsx`**:
  - Rendered `Shield` dignity badges (`Anonymous Beneficiary (HOP Verified)` vs. `Anonymous (Verified: [Name])`).
  - Added filter tabs for the standardized categories.
- **`MyRequestsPage.tsx`**:
  - Displays `Anonymous to Public` status badge for beneficiary's own request tracking.

---

## 4. Verification & Testing Evidence
1. **Anonymous Request Creation**:
   - Beneficiary submitted request #9 (`College Semester Tuition Aid`, `isAnonymous: true`).
2. **Public Unauthenticated View**:
   - Queried `/api/v1/assistance/public` without credentials:
     - `userFullName`: `"Anonymous Beneficiary (HOP Verified)"`
     - `userEmail`: `null`
     - `isAnonymous`: `true`
     - `isDirectDonorOrAdmin`: `false`
3. **Contributing Donor View**:
   - Donor John (`donor@example.com`) contributed $25 to request #9.
   - Queried `/api/v1/assistance/public` with John's bearer token:
     - `userFullName`: `"Shubham Sharma"`
     - `userEmail`: `"shubham@example.com"`
     - `isAnonymous`: `true`
     - `isDirectDonorOrAdmin`: `true`

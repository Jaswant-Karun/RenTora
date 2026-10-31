# 🏛️ RENTORA — Smart Institutional Resource Sharing Platform

> **Access More. Own Less. Share Smarter.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%208.9-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.21.2-000000?logo=express&logoColor=white)](https://expressjs.com/)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture & Lifecycle](#system-architecture--lifecycle)
4. [Environment Setup](#environment-setup)
5. [Installation & Quick Start](#installation--quick-start)
6. [Database Structure & Schemas](#database-structure--schemas)
7. [Comprehensive API Documentation](#comprehensive-api-documentation)
8. [Automated Testing Suite](#automated-testing-suite)
9. [Demonstration Accounts & Roles](#demonstration-accounts--roles)
10. [Deployment Guide](#deployment-guide)
11. [Known Limitations & Production Roadmap](#known-limitations--production-roadmap)

---

## 🌟 Project Overview

**RENTORA** is an institutional resource federation and asset-sharing ecosystem designed for universities, polytechnics, national research laboratories, and cross-institutional consortiums.

In higher education and research, millions of dollars worth of advanced machinery—such as X-Ray Diffractometers, Electron Microscopes, 5-Axis CNC Routers, Cleanrooms, and GPU compute clusters—sit underutilized within departmental silos, while students and faculty from neighboring departments or partner colleges face long delays or lack of access.

### Core Capabilities

* **Full-Spectrum Resource Discovery:** Full-text searchable catalog spanning laboratories, specialized instruments, workshops, and meeting facilities with criteria filtering (status, safety qualifications, capacity).
* **14-Step Booking State Machine:** End-to-end reservation lifecycle from eligibility diagnostics, atomic double-booking prevention, custodian approval, physical handover check-in, to post-use condition sign-off.
* **Trust, Safety & Fairness Engine:** Quota caps per student, monopolisation detection cooldown windows, and transparent priority-scored standby queues.
* **Handover Condition Documentation:** Verified dual-signed inspections with pre-use/post-use condition notes, meter readings, cleanliness checks, operational status ratings, and uploaded photographic proof.
* **AI-Assisted Intelligence:** Intelligent equipment matching based on research project parameters, predictive utilization analytics, conflict explanation, and incident summary extraction.
* **Central Administrative Governance:** Multi-tenant institution management, role-based governance (Student, Custodian, Manager, Administrator), write-once read-many (WORM) immutable audit ledgers, and global settings toggles.

---

## 🛠️ Technology Stack

### Frontend Architecture

* **Core Framework:** React 19 (TypeScript) with Vite build toolchain.
* **Styling & Design System:** Tailored Vanilla CSS tokens, glassmorphism overlays, accessible contrast ratios, and HSL palettes.
* **Micro-Animations & Motion:** Framer Motion for spring physics transitions, modal entries, and animated metric counters.
* **Data Visualization:** Recharts for institutional utilization timelines, category breakdowns, and incident triage trends.
* **Iconography:** Lucide React icons.
* **Resilience:** React Error Boundaries with crash containment, skeleton loaders, confirmation dialogs, and non-blocking toast notifications.

### Backend Architecture

* **Runtime & Framework:** Node.js 22 LTS with Express.js RESTful API architecture.
* **Language:** TypeScript 5.7+ running ESM modules.
* **Security & Auth:** JSON Web Tokens (JWT) in signed HTTP cookies / Bearer headers, bcryptjs salt rounds (10), strict Role-Based Access Control (RBAC) middleware.
* **Validation:** Server-side Zod schema validation intercepting invalid payloads before database queries.
* **Concurrency & Safety:** Mongoose transactions, atomic compound indexes (`{ resourceId, startTime, endTime, status }`) preventing double bookings, and Mongoose pre-save immutability locks on audit logs.

### Database

* **Primary Store:** MongoDB Atlas / Local MongoDB Community Edition via Mongoose ODM.
* **Indexing:** Compound indexes for high-speed timeslot overlap detection, category filtering, and full-text search indexing on assets.

---

## 🔄 System Architecture & Lifecycle

### The 14-Step Booking State Machine

```mermaid
stateDiagram-v2
    [*] --> Selected: 1. Student selects asset
    Selected --> Diagnostics: 2. Pick date/time slot
    Diagnostics --> Lodged: 3. System checks eligibility & limits
    Lodged --> Pending: 4 & 5. Enters project purpose & submits
    Pending --> UnderReview: 6 & 7. Custodian review
    Pending --> Waitlisted: Collision / Quota Limit (Standby Queue)
    Pending --> Rejected: 8. Custodian rejects (Mandatory Reason)
    UnderReview --> Approved: 7. Custodian approves
    Approved --> CheckedIn: 9 & 10. Handover check-in & initial condition
    CheckedIn --> ReturnPending: 11 & 12. Session end & return condition logged
    ReturnPending --> Completed: 13 & 14. Custodian inspects & confirms return
    Completed --> [*]
```

---

## ⚙️ Environment Setup

### 1. Server Configuration (`server/.env`)

Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
NODE_ENV=development

# Database Connection (Local or Atlas)
MONGODB_URI=mongodb://127.0.0.1:27017/rentora

# Authentication & JWT Security
JWT_SECRET=rentora_super_secure_production_signing_key_replace_with_strong_secret
JWT_EXPIRES_IN=7d

# CORS Allowed Origin
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://rentora.edu

# System Audit Ledger Security
ENFORCE_AUDIT_LEDGER_INTEGRITY=true
```

### 2. Client Configuration (`client/.env`)

Create `client/.env` based on `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Installation & Quick Start

### Prerequisites

* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm**: v9.0.0 or higher
* **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or free MongoDB Atlas cluster

### Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Jaswant-Karun/RenTora.git
cd RenTora

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Seed Demonstration Database

Populate MongoDB with partner universities, laboratory assets, pre-configured bookings, and demo accounts:

```bash
cd ../server
npm run seed
```

### Step 3: Run Development Servers

Open two terminal windows:

**Terminal 1 (Backend API):**

```bash
cd server
npm run dev
# Server boots at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

**Terminal 2 (Frontend Client):**

```bash
cd client
npm run dev
# Frontend boots at http://localhost:5173
```

---

## 🗄️ Database Structure & Schemas

RENTORA relies on normalized Mongoose models:

### 1. `User` Schema

* `name`, `email` (unique index), `password` (hashed, excluded by default), `role` (`student`, `owner`, `manager`, `admin`).
* `institution`, `department`, `phone`, `avatar`, `isVerified`, `academicQualification`.
* `trainingCertifications`: Array of `{ name, certifiedDate, expiresAt, credentialId }`.
* `historicalUsage`: `{ weeklyHoursUsed, totalHoursLogged, totalCompletedBookings, penaltyPoints, monopolisationCooldownUntil }`.

### 2. `Resource` Schema

* `name`, `category`, `institution`, `location`, `description`, `images`, `status` (`available`, `reserved`, `maintenance`, `in_use`).
* `ownerId`, `ownerName`, `ownerEmail`, `ownerDepartment`.
* `specifications`: Dynamic Key-Value Map.
* `availabilitySchedule`: Hourly start/end bounds, days of week, buffer time minutes.
* `minBookingDurationHours`, `maxBookingDurationHours`, `depositOrUsageConditions`, `approvalRequired`, `supervisionRequired`.
* `isRestricted`: Boolean (restricted high-value equipment cannot be auto-approved by AI).
* `requiredQualification`: Academic threshold (e.g. `PhD Scholar`, `Faculty`).
* `requiredTraining`: Name of mandatory training clearance.
* **Indexes:** Full-text index on `name`, `description`, `category`, `institution`, `tags`; compound index on `category`, `status`, `institution`.

### 3. `Booking` Schema

* `resourceId`, `resourceName`, `resourceCategory`, `institution`, `userId`, `userName`, `userEmail`, `userDepartment`, `userRole`.
* `date`, `timeSlot`, `startTime`, `endTime`, `durationHours`, `purpose`, `projectDescription`.
* `status`: `pending`, `under_review`, `approved`, `rejected`, `waitlisted`, `checked_in`, `return_pending`, `completed`, `cancelled`.
* `waitlistPriority`, `queuePosition`, `waitlistReason`, `rejectionReason`.
* `initialCondition` / `returnCondition`: `{ conditionNotes, meterReading, cleanliness, operationalStatus, photos, userConfirmation, ownerConfirmation, timestamp, recordedBy }`.
* `auditTrail`: Array of immutable state transition events.
* **Indexes:** Compound index on `{ resourceId: 1, startTime: 1, endTime: 1, status: 1 }` preventing timeslot collisions.

### 4. `Incident` Schema

* `category`: `equipment_damage`, `late_return`, `missing_components`, `misuse`, `scheduling_conflict`, `safety_violation`.
* `title`, `description`, `severity` (`low`, `medium`, `high`, `critical`), `status` (`open`, `under_review`, `resolved`, `dismissed`).
* `resourceId`, `resourceName`, `bookingId`, `reportedByUserId`, `reportedByRole`, `evidence` (photo URLs).
* `managerNotes`, `resolutionNotes`, `sanctionsApplied`, `resolvedBy`, `resolvedAt`.

### 5. `AuditLog` Schema (WORM Non-Repudiation Ledger)

* `timestamp`, `action` (15 enum types), `entityType`, `entityId`, `entityTitle`, `actorId`, `actorName`, `actorRole`, `details`, `reason`.
* **Immutability Hooks:** `pre('deleteOne')`, `pre('deleteMany')`, `pre('findOneAndUpdate')`, `pre('updateMany')` reject with `IMMUTABILITY_VIOLATION`.

### 6. `Institution` & `SystemSetting` Schemas

* `Institution`: Partner campus registration, federation tier, trust domain, contact info.
* `SystemSetting`: Platform maintenance mode, public registration toggle, maximum active bookings per student, monopolisation cooldown periods.

---

## 📡 Comprehensive API Documentation

### System Health

* `GET /health` & `GET /api/health` — Cloud orchestrator health status and MongoDB connection diagnostics.
* `GET /api/db-status` — Detailed database connection state.

### Authentication (`/api/auth`)

* `POST /register` — User registration with institutional role validation. Public self-registration of `admin`/`manager` is rejected.
* `POST /login` — Authenticates credentials, sets secure cookie and returns JWT bearer token.
* `GET /me` — Returns current authenticated user session and role capabilities.
* `POST /logout` — Clears authentication cookies and invalidates session.
* `GET /demo-accounts` — Returns list of pre-seeded credentials for rapid evaluation.

### Resource Catalog (`/api/resources`)

* `GET /` — Search and filter catalog by search text, category, institution, status, and qualifications.
* `GET /:id` — Retrieve detailed resource specification, availability schedule, and safety requirements.
* `GET /categories` — Returns list of standardized institutional categories.

### Booking Lifecycle (`/api/bookings`)

* `POST /pre-check` — Diagnostic pre-validation of training, academic qualification, timeslot collision, and active quota limits.
* `POST /` — Lodge reservation request (returns 409 Conflict if timeslot collides; creates `waitlisted` entry if `allowWaitlist: true`).
* `GET /` — List bookings for current authenticated user.
* `GET /waitlist` — Query transparent waitlist standing and queue positions.
* `GET /:id` — Retrieve visual booking progress timeline and condition reports.
* `POST /:id/review` — Custodian marks booking under review.
* `POST /:id/approve` — Custodian approves booking.
* `POST /:id/reject` — Custodian rejects booking with mandatory stated reason.
* `POST /:id/check-in` — Handover check-in recording pre-use condition notes, cleanliness, meter readings, and confirmation.
* `POST /:id/initiate-return` — User initiates return with post-use operational condition and photographic evidence.
* `POST /:id/confirm-return` — Custodian inspects return and signs off completion.
* `POST /:id/cancel` — Borrower cancels booking with stated justification.
* `POST /:id/override` — Institution manager overrides booking decision with mandatory justification.

### Owner Management (`/api/owner`)

* `GET /resources` — List assets managed by custodian.
* `POST /resources` — Register new technical asset with availability schedules and safety instructions.
* `PUT /resources/:id` — Update asset status, specifications, or calibration schedules.
* `GET /bookings` — List incoming booking requests across owned equipment.
* `GET /analytics` — Custodian utilization metrics, hours logged, and return rate.

### Manager Console (`/api/manager`)

* `GET /overview` — Institution-wide equipment utilization, department breakdown, and active alerts.
* `GET /fair-policy` & `PUT /fair-policy` — Configure max active bookings per student and monopolisation rules.
* `GET /incidents` & `PATCH /incidents/:id` — Triage, investigate, and resolve reported safety and equipment incidents.

### Admin Central Control (`/api/admin`)

* `GET /overview` — Systemwide metrics (Total Users, Institutions, Resources, Bookings, Active Incidents, Utilization).
* `GET /users` & `PATCH /users/:id/role` & `DELETE /users/:id` — User governance and verification.
* `GET /resources` & `PATCH /resources/:id/status` & `DELETE /resources/:id` — Asset governance.
* `GET /institutions` & `POST /institutions` — Partner campus federation onboarding.
* `GET /settings` & `PUT /settings` — Global configuration parameters.

### AI Assistance (`/api/ai`)

* `POST /match-resource` — Multi-factor recommendation engine matching project keywords against asset specifications.
* `POST /conflict-explainer` — Explains timeslot collisions and identifies next available openings.
* `POST /incident-summary` — Generates executive summaries of technical incident reports for managers.

### Audit Ledger (`/api/audit-logs`)

* `GET /` — Chronological read-only query of non-repudiable audit events.
* `POST /`, `PUT /`, `DELETE /` — Explicitly rejected with HTTP 405 Method Not Allowed.

---

## 🧪 Automated Testing Suite

RENTORA includes a comprehensive end-to-end integration test suite verifying all 15 core lifecycle steps required by enterprise standards.

### Running the Test Suite

Ensure the backend server is running, then execute:

```bash
cd server
node scratch/test-full-15-suite.mjs
```

### Verified Test Matrix

| Step | Lifecycle Stage | Status | Verification Detail |
| :---: | :--- | :---: | :--- |
| **1** | **User Sign-Up** | `PASS` | Zod validation enforced; public admin registration blocked; student created. |
| **2** | **User Sign-In** | `PASS` | Authenticated session established; JWT bearer token generated. |
| **3** | **User Logout** | `PASS` | Session invalidated; subsequent protected queries rejected with HTTP 401. |
| **4** | **Resource Creation** | `PASS` | Custodian creates Rigaku X-Ray Diffractometer with safety specifications. |
| **5** | **Resource Discovery** | `PASS` | Full-text query matches asset across category, name, and institution. |
| **6** | **Booking Requests** | `PASS` | Student requests timeslot; diagnostics confirm eligibility and active quota. |
| **7** | **Owner Approvals** | `PASS` | Custodian reviews radiation certificate and approves reservation. |
| **8** | **Rejections with Reason** | `PASS` | Rejection without reason fails; rejection with mandatory justification succeeds. |
| **9** | **Double-Booking & Waitlists** | `PASS` | Conflicting slot returns 409 Conflict; `allowWaitlist: true` queues user with standing. |
| **10** | **Check-In** | `PASS` | Pre-use condition inspection recorded with vacuum meter readings & confirmation. |
| **11** | **Check-Out (Return)** | `PASS` | Borrower finishes scan, uploads beam shutter locked proof, initiates return. |
| **12** | **Condition Documentation** | `PASS` | Custodian signs off return condition; booking transitions to `completed`. |
| **13** | **Incident Reporting** | `PASS` | Safety interlock E-402 warning reported with severity `medium` and evidence. |
| **14** | **Audit History & Immutability** | `PASS` | Chronological ledger verified; DELETE attempt rejected with HTTP 405. |
| **15** | **Role Restrictions (RBAC)** | `PASS` | Student accessing `/api/admin/overview` receives 403 Forbidden; Admin receives 200 OK. |

---

## 🔑 Demonstration Accounts & Roles

The platform is pre-configured with 4 personas across different tiers:

| Persona | Role | Email | Password | Institutional Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Student / Researcher** | `student` | `student@rentora.edu` | `Password123!` | Browse catalog, book assets, check-in, initiate returns, report incidents. |
| **Lab Custodian / Owner** | `owner` | `owner@rentora.edu` | `Password123!` | List equipment, approve/reject requests, perform physical handover sign-offs. |
| **Institution Manager** | `manager` | `manager@rentora.edu` | `Password123!` | Oversee campus analytics, fair usage rules, resolve incidents, manager overrides. |
| **Platform Administrator** | `admin` | `admin@rentora.edu` | `Password123!` | Global dashboard, user role changes, institutional federations, system settings. |

*Quick Evaluation:* In the web application header, click **"Demo Logins"** to instantly switch between roles without re-typing passwords.

---

## 🌐 Deployment Guide

### 1. MongoDB Atlas Setup

1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a user with `readWriteAnyDatabase` privileges.
3. Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere) or specific server IPs.
4. Obtain your connection URI: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/rentora?retryWrites=true&w=majority`.
5. Set `MONGODB_URI` in your production environment variables.

### 2. Backend Deployment (Render / Railway / AWS / DigitalOcean)

* **Build Command:** `npm run build` (runs `tsc` into `dist/`)
* **Start Command:** `npm start` (runs `node dist/server.js`)
* **Environment Variables:**
  * `NODE_ENV=production`
  * `PORT=5000` (or dynamically assigned `$PORT`)
  * `MONGODB_URI=<your-atlas-uri>`
  * `JWT_SECRET=<strong-random-secret>`
  * `CLIENT_URL=https://your-frontend-domain.vercel.app`
  * `ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app`

### 3. Frontend Deployment (Vercel / Netlify / Cloudflare Pages)

* **Framework Preset:** Vite
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Environment Variables:**
  * `VITE_API_URL=https://your-backend-api.onrender.com/api`

---

## ⚠️ Known Limitations & Production Roadmap

1. **Physical RFID / QR Scanner Hardware:** Check-in condition inspection currently accepts manual confirmation and photo uploads. Integration with physical barcode/RFID scanners at lab entrance doors is planned for v2.0.
2. **Third-Party Email / SMS Notifications:** In-app notification feeds and toasts are fully functional; integration with SendGrid/Twilio SMTP credentials requires production API keys.
3. **Payment Gateways:** RENTORA currently operates on academic institutional allocation quotas and departmental chargebacks rather than commercial credit cards. Stripe integration can be enabled if commercial fee-per-hour booking is required.
4. **Cloud Object Storage (AWS S3):** Uploaded condition photos and incident logs are stored as secure URL references. In high-volume production, direct S3 signed presigned URLs should be attached to the Multer upload pipeline.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

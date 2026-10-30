# 🏛️ RENTORA — Smart Institutional Resource Sharing & Management Platform

> **Problem Statement:** Unlock Underused Equipment and Spaces  
> **Platform Version:** 1.0 (Hackathon Production-Ready Baseline)

---

## 🌟 Executive Summary

**RENTORA** is a full-stack, enterprise-grade institutional platform that enables colleges, universities, research laboratories, and academic communities to catalogue, share, and schedule high-value technical apparatus, specialized labs, testing rigs, and collaborative facilities safely and transparently.

By breaking institutional and departmental silos, RENTORA maximizes equipment utilization, avoids redundant procurement expenses, enforces safety protocols, and democratizes research infrastructure for students, faculty, and cross-departmental teams.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts, React Router v7 |
| **Form & State** | React Hook Form, Zod Validation, React Context API, Axios (Interceptors & Bearer Tokens) |
| **Backend** | Node.js, Express.js (RESTful APIs), TypeScript, ES2022 |
| **Database** | MongoDB Atlas / Local MongoDB, Mongoose ODM |
| **Security & Auth** | JSON Web Tokens (JWT), bcryptjs password hashing, Role-Based Access Control (RBAC) |
| **Validation & Upload** | Server-side Zod Schema Validation, Multer-ready architecture |

---

## 👥 Institutional Roles & Access Matrix

RENTORA features a strictly enforced **Role-Based Access Control (RBAC)** architecture across four core stakeholders:

1. **Student / Researcher (`student`)**
   - Search across college and inter-departmental equipment catalogs.
   - Reserve technical equipment and testing slots.
   - Request safety clearance passes and track project approval status.

2. **Resource / Lab Owner (`owner`)**
   - List and catalogue instruments (spectrometers, CNCs, 3D printers, server nodes).
   - Configure availability windows, buffer times, and calibration intervals.
   - Inspect and approve booking requests with safety checklist validation.

3. **Institution Manager (`manager`)**
   - Oversee inter-departmental resource federation and university-wide utilization.
   - Approve cross-department resource transfers and review equipment audit reports.
   - Monitor facility safety compliance and department budgets.

4. **Platform Administrator (`admin`)**
   - Onboard and verify accredited partner institutions and colleges.
   - Manage system-wide policies, security credentials, and compliance audits.
   - Monitor live API telemetry and database persistence status.

---

## 📁 Repository & Architecture Structure

```text
Rentora/
├── package.json              # Root orchestration scripts
├── README.md                 # Project architecture and running instructions
│
├── server/                   # Express.js REST API Backend
│   ├── .env.example          # Server environment template
│   ├── .env                  # Development environment variables
│   ├── package.json          # Server dependencies & scripts
│   ├── tsconfig.json         # NodeNext TypeScript configuration
│   └── src/
│       ├── config/
│       │   └── db.ts         # Mongoose MongoDB connection & health check
│       ├── controllers/
│       │   └── auth.controller.ts  # Register, Login, Me, Demo accounts
│       ├── middleware/
│       │   ├── auth.middleware.ts  # Bearer JWT verification
│       │   ├── role.middleware.ts  # RBAC permission guard
│       │   └── error.middleware.ts # Centralized Zod & DB error handler
│       ├── models/
│       │   └── user.model.ts       # Mongoose User schema & password hashing
│       ├── routes/
│       │   ├── index.ts            # Central API router & health telemetry
│       │   └── auth.routes.ts      # Authentication endpoints
│       ├── schemas/
│       │   └── auth.schema.ts      # Zod validation schemas
│       ├── utils/
│       │   ├── jwt.ts              # JWT sign & verify helpers
│       │   └── seed.ts             # Demo fictional accounts seeder
│       └── server.ts         # Express application bootstrap
│
└── client/                   # Vite + React + TypeScript Frontend
    ├── .env.example          # Client environment template
    ├── .env                  # Frontend environment variables
    ├── index.html            # HTML entry point with Google Fonts
    ├── package.json          # Frontend dependencies & scripts
    ├── postcss.config.js     # PostCSS Tailwind configuration
    ├── tailwind.config.js    # Design tokens & color palette
    ├── tsconfig.json         # React-JSX TypeScript configuration
    ├── vite.config.ts        # Vite configuration & dev server
    └── src/
        ├── api/
        │   ├── client.ts     # Axios instance with auth interceptors
        │   └── auth.ts       # Authentication API service
        ├── components/
        │   ├── common/       # Reusable UI library
        │   │   ├── Button.tsx        # Dynamic button with loading & variants
        │   │   ├── Input.tsx         # Accessible input with error feedback
        │   │   ├── Card.tsx          # Glassmorphic card container
        │   │   ├── Badge.tsx         # Role & status indicator pills
        │   │   ├── LoadingSpinner.tsx
        │   │   └── EmptyState.tsx
        │   └── layout/       # Structural components
        │       ├── Navbar.tsx        # Header with role switcher & brand
        │       ├── Sidebar.tsx       # Dynamic role-based console sidebar
        │       └── AppLayout.tsx     # Shell with team footer
        ├── context/
        │   └── AuthContext.tsx       # React Auth provider & session sync
        ├── pages/
        │   ├── LandingPage.tsx       # Hero, feature pillars, fast-demo cards
        │   ├── LoginPage.tsx         # Sign-in form with demo logins
        │   ├── RegisterPage.tsx      # Multi-role registration with Zod
        │   ├── DashboardPage.tsx     # Live Recharts analytics & role console
        │   └── NotFoundPage.tsx      # 404 handler
        ├── types/
        │   └── auth.ts               # Shared TypeScript models
        ├── App.tsx                   # Route definitions & guards
        ├── main.tsx                  # Application mounting
        └── index.css                 # Tailwind directives & dark styling
```

---

## ⚡ Getting Started (Running Frontend & Backend)

### Prerequisites
- **Node.js**: v18.0.0 or later (v22.x recommended)
- **npm**: v9.0.0 or later
- **MongoDB**: MongoDB Atlas connection string OR local MongoDB instance running on port `27017`

---

### Step 1: Install Dependencies

From the project root:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

*(Alternatively, run `npm run install:all` from the root directory).*

---

### Step 2: Configure Environment Variables

#### Backend (`server/.env`):
Create `server/.env` (a pre-configured `.env.example` is provided):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/rentora
JWT_SECRET=rentora_dev_jwt_secret_token_key_778899_xyz
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
> **Note for MongoDB Atlas:** Replace `MONGODB_URI` with your Atlas connection string (e.g. `mongodb+srv://<user>:<password>@cluster0.mongodb.net/rentora?retryWrites=true&w=majority`).

#### Frontend (`client/.env`):
Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

### Step 3: Seed Fictional Demonstration Data

Populate MongoDB with sample accounts for all 4 roles:

```bash
cd server
npm run seed
```

---

### Step 4: Run the Backend & Frontend Separately

#### Running the Backend API:
Open a terminal and run:
```bash
cd server
npm run dev
```
- **Backend URL:** `http://localhost:5000`
- **Health Check:** `http://localhost:5000/api/health`

#### Running the Frontend Client:
Open a second terminal and run:
```bash
cd client
npm run dev
```
- **Frontend App:** `http://localhost:5173`

---

## 🔑 Demo Login Credentials for Hackathon Evaluation

You can sign in directly using the **"Demo Roles"** dropdown in the navigation bar or use the following pre-seeded credentials:

| Role | Role Label | Email | Password | Primary Institution |
| :--- | :--- | :--- | :--- | :--- |
| **student** | Student / Researcher | `student@rentora.edu` | `Password123!` | National Institute of Technology |
| **owner** | Lab / Resource Owner | `owner@rentora.edu` | `Password123!` | National Institute of Technology |
| **manager** | Institution Manager | `manager@rentora.edu` | `Password123!` | National Institute of Technology |
| **admin** | Platform Administrator | `admin@rentora.edu` | `Password123!` | RENTORA Central Network |

---

## 📡 Core API Endpoints

### System & Telemetry
- `GET /api/health` — Checks backend status, team metadata, and MongoDB connection health.
- `GET /api/db-status` — Returns database connection state, host, and database name.

### Authentication & Profiles
- `POST /api/auth/register` — Validates inputs with Zod, checks email uniqueness, hashes password, saves to MongoDB, issues JWT.
- `POST /api/auth/login` — Authenticates credentials with bcrypt, returns JWT token and user profile.
- `GET /api/auth/me` — Protected route returning authenticated user details.
- `GET /api/auth/demo-accounts` — Returns list of pre-configured demo personas for fast jury evaluation.

---

## 🔒 Security & Code Standards

- **Zero Hardcoded Secrets**: Secrets are loaded strictly via `.env` files.
- **Server-Side Validation**: All HTTP payloads are strictly validated using Zod schemas before touching the database.
- **Password Protection**: Passwords are encrypted with salt rounds via bcrypt (`select: false` on Mongoose).
- **Bearer Token Auth**: Authorization header format `Bearer <token>` verified on all protected routes.
- **Graceful Error Handling**: Centralized error middleware handling Zod validation errors, duplicate keys, and invalid ObjectIds.
- **No Mock Persistence**: Real MongoDB database backing all user and session data.

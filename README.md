# KidSafe — Child Welfare & Adoption Management System

> A full-stack digital platform that modernizes Rwanda's child adoption process — replacing paper-based workflows with a transparent, role-driven, end-to-end system for orphanages, social workers, government officials, and adoptive families.

---

## Demo Video

[Watch the Demo](#) <!-- Replace # with your video link -->

**Live App:** [kid-safe-beta.vercel.app](https://kid-safe-beta.vercel.app)

---

## The Problem

Rwanda's child adoption process is entirely paper-based. Thousands of children in orphanages wait months — sometimes years — for adoption because applications move physically between desks: from orphanage to social worker to district commissioner to NCDA (National Child Development Agency). There is no shared visibility, no audit trail, and no way for families to know where their application stands.

## The Solution

KidSafe digitizes the entire adoption workflow. Every stakeholder gets a role-specific dashboard. Applications move through a structured approval pipeline. Families receive email updates at every milestone. All documents are stored securely in the cloud.

---

## How It Works

### Roles & Access

KidSafe has six distinct roles, each with their own dashboard and permissions:

| Role | What they do |
|------|-------------|
| **Orphanage Admin** | Registers children, monitors proposals for their children |
| **Social Worker** | Conducts home visits, writes findings, gives Level 1 approval |
| **District Commissioner** | Reviews social worker reports, gives Level 2 approval |
| **NCDA Official** | Final approval authority, can assign social workers |
| **Adoptive Family** | Browses children, submits adoption proposals, tracks application status |
| **System Admin** | Manages staff accounts, invites users |

### The Adoption Workflow

```
Family submits proposal (public form, no account needed)
        ↓
NCDA is notified by email → assigns a Social Worker
        ↓
Family receives email with document upload link
        ↓
Social Worker schedules & conducts a Home Visit
        ↓
Social Worker submits findings → Level 1 Approval
        ↓
District Commissioner reviews → Level 2 Approval
        ↓
NCDA Official gives Final Approval
        ↓
System Admin invites family to create a KidSafe account
        ↓
Family submits monthly progress reports
```

### Key Features

- **Public proposal submission** — families apply without needing an account, identified by national ID
- **Document upload portal** — a secure, account-free page where families upload required documents (birth certificate, medical records, financial proof, etc.), accessed via a pre-filled link sent by email
- **Real-time status tracking** — families see a live progress bar through all approval stages
- **Email notifications** at every stage: proposal confirmation, SW assignment, document upload request, approval/rejection
- **Role-based dashboards** — each user sees only what is relevant to their role
- **Cloudinary document & photo storage** — all uploads are stored securely in the cloud
- **Monthly family reports** — approved families submit progress reports with supporting documents

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2 (App Router), Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL (Neon serverless) |
| ORM | TypeORM |
| Auth | JWT (jsonwebtoken) |
| File Storage | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Vercel (frontend) · Render (backend) · Neon (database) |

---

## Project Structure

```
KidSafe/
├── frontend/                  # Next.js application
│   └── src/
│       ├── app/
│       │   ├── (auth)/        # Login, register pages
│       │   ├── (dashboard)/   # All role-based dashboard pages
│       │   ├── documents/     # Public document upload portal
│       │   ├── explore/       # Public children browse page
│       │   ├── propose/       # Public adoption proposal form
│       │   └── track/         # Application status tracker
│       ├── components/
│       │   ├── layout/        # Sidebar, header
│       │   └── ui/            # Reusable UI components
│       ├── contexts/          # AuthContext (global user state)
│       └── lib/               # Axios API client
│
└── backend/                   # Express API
    └── src/
        ├── config/            # Database, Cloudinary, email, multer
        ├── controllers/       # Business logic per domain
        ├── entities/          # TypeORM database models
        ├── middleware/         # JWT auth, role authorization
        ├── routes/            # API route definitions
        └── utils/             # Email templates, validators, JWT helpers
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL (local) or a [Neon](https://neon.tech) database
- A [Cloudinary](https://cloudinary.com) account (free tier works)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for SMTP

### 1. Clone the repository

```bash
git clone https://github.com/Aderline490/KidSafe.git
cd KidSafe
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development

# Database — use a local PostgreSQL connection or your Neon URL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_NAME=kidsafe_db

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your@gmail.com

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
```

> TypeORM will automatically create all database tables on first run (synchronize is enabled in development).

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

### 4. Create the first admin account

With the backend running and the database initialized, run this in a terminal to generate a bcrypt password hash:

```bash
node -e "const b = require('bcryptjs'); b.hash('YourPassword', 12).then(h => console.log(h))"
```

Then insert the admin user directly into your database:

```sql
INSERT INTO "user" (
  id, "firstName", "lastName", email, "passwordHash",
  role, "isActive", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Admin', 'KidSafe',
  'admin@kidsafe.rw',
  '<hash from above>',
  'system_admin',
  true, NOW(), NOW()
);
```

From there, the admin can log in and invite all other staff members via the dashboard.

---

## Deployment

| Service | Purpose | Branch |
|---------|---------|--------|
| [Vercel](https://vercel.com) | Frontend (Next.js) | `feat/proposal_workflow` |
| [Render](https://render.com) | Backend (Express API) | `feat/proposal_workflow` |
| [Neon](https://neon.tech) | PostgreSQL database | — |

### Backend environment variables on Render

Set all variables from the `.env` example above, replacing local values with production ones:

- `DATABASE_URL` — Neon pooled connection string
- `DB_SYNC=true` — first deploy only (creates tables), then remove
- `FRONTEND_URL` — your Vercel app URL
- `NODE_ENV=production`

### Frontend environment variable on Vercel

```env
NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate a user |
| `POST` | `/api/auth/register/staff` | Register via staff invite |
| `GET` | `/api/children` | Browse available children (public) |
| `POST` | `/api/proposals` | Submit an adoption proposal (public) |
| `GET` | `/api/proposals/my` | Get current user's proposals |
| `POST` | `/api/proposals/documents` | Upload supporting document |
| `GET` | `/api/staff/proposals` | List all proposals (staff) |
| `PATCH` | `/api/staff/proposals/:id/assign` | Assign a social worker |
| `PATCH` | `/api/staff/proposals/:id/review` | Approve or reject a proposal |
| `POST` | `/api/staff/home-visits` | Schedule a home visit |
| `POST` | `/api/staff/children` | Register a new child |
| `POST` | `/api/reports` | Submit a monthly family report |

---

## Contributing

This project was built as part of the ALU Year 2 Term 2 capstone. Pull requests and feedback are welcome.

---

## License

MIT

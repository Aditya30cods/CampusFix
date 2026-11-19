# CampusFix → OrgFix

A Git-ready issue reporting and maintenance workflow for a college campus, designed with organization scoped data so it can grow toward a multi-tenant OrgFix SaaS.

## Features

- Separate student, faculty, staff, and admin sign-in portals with JWT authentication and role checks
- Profile self-service for updating name, department, and password; appearance settings persist per browser
- Organization-scoped users and issues
- Report issues with location, category, priority, optional image URL, and QR preselection
- Admin assignment and status tracking with an immutable status history
- Staff queue and issue resolution
- Student issue tracking
- Admin metrics and charts
- Lightweight AI helper API for category/priority suggestions and duplicate candidates (heuristic baseline, replaceable with a trained model)
- Seed script for a demo organization and accounts

## Stack

React, Vite, React Router, Axios, Recharts, Tailwind CSS; Node.js, Express, Mongoose, MongoDB, JWT, bcrypt; Python FastAPI helper.

## Run locally

Requirements: Node.js 20+, npm, MongoDB (local or Atlas). Python 3.10+ is optional for AI helper.

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and `JWT_SECRET`.
2. Copy `client/.env.example` to `client/.env` if the API is not at `http://localhost:5000/api`.
3. In one terminal:

   ```bash
   cd server && npm install && npm run seed && npm run dev
   ```

4. In another:

   ```bash
   cd client && npm install && npm run dev
   ```

5. Open the Vite URL. Demo logins (password `CampusFix123!`):

   - Choose a role-specific portal from `/login`.
   - Admin: `admin@campusfix.demo`
   - Staff: `staff@campusfix.demo`
   - Student: `student@campusfix.demo`

   Faculty accounts can be created as student accounts and then assigned the Faculty role by an admin in the Team page. Faculty can report and track their own issues.

Optional AI service: `cd ai && pip install -r requirements.txt && uvicorn app:app --reload --port 8000`; set `AI_SERVICE_URL=http://localhost:8000` in the server environment. The API has a built-in fallback if it is unavailable.

## Environment

See `server/.env.example` and `client/.env.example`. Never commit real secrets or `.env` files.

## API overview

All endpoints are under `/api`.

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create student account |
| POST | `/auth/login` | Public | Login |
| GET | `/auth/me` | Authenticated | Current profile |
| GET/POST | `/issues` | Authenticated | List/create issues |
| GET/PATCH | `/issues/:id` | Authenticated | View/update issue |
| GET | `/admin/analytics` | Admin | Dashboard metrics |
| GET | `/admin/users` | Admin | Organization users |
| PATCH | `/admin/users/:id/role` | Admin | Assign staff/admin role |
| GET | `/health` | Public | Service health |

Students can only see their own issues. Staff can only see assigned issues. Admins can see issues in their organization. Each issue transition is recorded in `statusHistory`.

## Git workflow

```bash
git init
git add .
git commit -m "Build CampusFix MVP"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```

Suggested team branches: `frontend`, `backend`, `ai-analytics`, `security`, and feature branches merged by pull request.

## Deployment

- Client: Vercel, root directory `client`, build `npm run build`, output `dist`; set `VITE_API_URL` to the deployed API `/api` URL.
- API: Render, root directory `server`, build `npm install`, start `npm start`; configure MongoDB Atlas URI, JWT secret, client origin, and optional AI URL.
- AI helper: optional Render Python service. The core workflow does not depend on it.

## Future multi-tenant direction

Every tenant owned record stores `organizationId`; authorization scopes reads and writes through the signed-in user's organization. Organization signup, tenant-specific roles, branding, billing, and stronger tenant provisioning are intentionally future SaaS work. For production, add email verification, password reset, audit logging, rate limits tuned to deployment, upload validation/storage, and operational monitoring.

## Project structure

```text
client/  React interface
server/  Express REST API and MongoDB models
ai/      Optional FastAPI heuristic service
docs/    Architecture, schema, and demo walkthrough
```

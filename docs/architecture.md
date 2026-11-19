# Architecture

```text
React SPA (Vercel)
   │ HTTPS / JSON + JWT
Express REST API (Render)
   ├── MongoDB Atlas (organization-scoped records)
   ├── Optional FastAPI suggestion helper
   └── Future: Cloudinary media URLs, email notifications
```

The authenticated user's organization ID is the tenant boundary. The API derives it from the signed-in user and does not accept an organization ID from issue create/update requests. Student issue reads are limited to the reporter; staff reads and updates are limited to their assignments; admins see their organization. The demo seed creates a single college tenant.

# Data model

- **Organization**: name, unique slug, type.
- **User**: organizationId, name, email, passwordHash, role, department. Email is unique per organization.
- **Issue**: organizationId, reportedBy, assignedTo, title, description, category, location, department, priority, status, imageUrl, timestamps.
- **Issue status history**: status, note, changedBy, changedAt, embedded on Issue to keep a chronological audit trail with the issue.

Status values: `open → assigned → in_progress → resolved → closed`. Admin assignment can promote an open issue to assigned. Each status or assignment update appends history.

# Demo walkthrough

1. Sign in as `student@campusfix.demo` / `CampusFix123!` and report a Wi-Fi issue at Lab 3.
2. Use **Suggest** to see the baseline category and priority recommendation.
3. Sign in as `admin@campusfix.demo`, assign the report to Rahul Staff, and review the dashboard charts.
4. Sign in as `staff@campusfix.demo`, move the assigned issue to In progress and then Resolved.
5. Sign in as the student and follow the issue timeline.

For QR reporting, print a QR code that points to `https://your-client-url/report?location=Lab%203`; the report form reads the location from the URL. Replace this URL with your deployed client domain.

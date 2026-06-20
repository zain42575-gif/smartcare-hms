# API Overview

Base URL: `/api`

## Auth
- `POST /auth/login`
- `POST /auth/register-patient`
- `GET /auth/me`
- `PATCH /auth/password`

## Admin
- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `GET /audit-logs`

## Hospital Workflow
- `GET/POST/PATCH /patients`
- `GET/POST/PATCH /doctors`
- `GET/POST/PATCH /appointments`
- `GET/POST/PATCH /records`
- `GET/POST/PATCH /medicines`
- `POST /medicines/issue`
- `GET/POST/PATCH /invoices`

## Dashboard
- `GET /dashboard/summary`
- `GET /dashboard/appointments-trend`

All protected routes require:
`Authorization: Bearer <token>`

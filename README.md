# SmartCare HMS - MERN Hospital Management System

A professional 7th-semester MERN Stack Hospital Management System based on the provided scope document. It includes JWT authentication, role-based authorization, dashboards, patient/doctor/appointment workflows, medical records, billing, pharmacy inventory, notifications, audit logs, search, filtering, pagination, and seed data.

## Tech Stack
- Frontend: React 18, Vite, React Router, Axios, Recharts, Lucide React
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- Security: Helmet, CORS, rate limiting, input validation, centralized error handling

## Roles
Admin, Doctor, Receptionist, Pharmacist, Accountant, Patient

## Project Structure
```
smartcare-hms/
  backend/
  frontend/
  docs/
```

## Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Default frontend: `http://localhost:5173`
Default backend: `http://localhost:5000/api`

## Patient Google Login
Real Google login is enabled only for patients. Create a Google OAuth Web Client ID, then add the same client ID to:

```bash
backend/.env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

frontend/.env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

In Google Cloud Console, add `http://localhost:5173` as an authorized JavaScript origin for local development.

## Demo Login Accounts
After running `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@smartcare.com | Password@123 |
| Doctor | doctor@smartcare.com | Password@123 |
| Receptionist | reception@smartcare.com | Password@123 |
| Pharmacist | pharmacy@smartcare.com | Password@123 |
| Accountant | accounts@smartcare.com | Password@123 |
| Patient | patient@smartcare.com | Password@123 |

## Main Modules
- Authentication and role-based dashboards
- User and staff management
- Patient registration and visit history
- Doctor profiles, departments, availability, consultation fees
- Appointment booking with duplicate-slot prevention
- Consultation notes, diagnosis, prescription, follow-up
- Pharmacy stock, expiry, low-stock alerts
- Billing invoices, discounts, paid/partial/unpaid status
- Notifications and audit logs
- Dashboard analytics and reports

## Notes for Academic Submission
This project is ready for semester demonstration and can be extended with Socket.io notifications, online payments, lab reports, and production-level medical compliance review.

## Enhanced Version Notes
This version was upgraded for a larger 7th semester project demo:

- Patient self-registration and login.
- Doctor self-application flow with admin approval.
- Admin can approve pending doctors from the Users module.
- Google demo login button for academic/demo purpose. For real Google OAuth, configure Google Client ID and verify Google ID tokens on the backend.
- Patient can book appointments directly after login.
- Receptionist/admin can still book appointments for patients.
- Patient can view their own appointments, medical records, and bills.
- Doctor can view only assigned appointments and records.
- Seed data now includes multiple doctors, multiple patients, many appointments, invoices, medicines, records, and a pending doctor request.

After replacing this project, run the seed command again:

```bash
cd backend
npm run seed
npm run dev
```

Then run frontend:

```bash
cd frontend
npm run dev
```

Demo accounts all use password: `Password@123`

- Admin: `admin@smartcare.com`
- Doctor: `hidayat@alhidayat.com`
- Doctor: `hamza@smartcare.com`
- Receptionist: `reception@smartcare.com`
- Pharmacist: `pharmacy@smartcare.com`
- Accountant: `accounts@smartcare.com`
- Patient: `patient@smartcare.com`
- Patient: `maham@smartcare.com`
- Pending doctor application: `pending.doctor@smartcare.com`

## Production Deployment Workflow

1. **GitHub Preparation**
   - The repository is configured to ignore `node_modules`, `.env`, and build folders.
   - Example environment files `.env.example` are provided in both frontend and backend.
   - Push your code to a GitHub repository.

2. **MongoDB Atlas**
   - Create a MongoDB Atlas Cluster and get your connection string.
   - Ensure the database user has read/write privileges.

3. **Backend Deployment (Railway)**
   - Connect your GitHub repository to Railway.
   - Set the `Start Command` to `npm start` (which runs `node src/server.js`).
   - Add the following environment variables:
     - `NODE_ENV=production`
     - `PORT=5000`
     - `MONGODB_URI=<Your Atlas Connection String>`
     - `JWT_SECRET=<Random String>`
     - `JWT_REFRESH_SECRET=<Random String>`
     - `FRONTEND_URL=https://<your-vercel-app>.vercel.app`

4. **Frontend Deployment (Vercel)**
   - Connect your GitHub repository to Vercel.
   - Vercel will automatically detect Vite and run `npm run build`.
   - The `vercel.json` file handles React Router page refreshes.
   - Add the following environment variable:
     - `VITE_API_URL=https://<your-railway-app>.up.railway.app/api`

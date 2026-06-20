# Scratchpad - Separated Portals Verification

## Plan
- [x] Navigate to http://localhost:5173/login
- [x] Verify Patient Portal login (no role dropdown)
- [x] Capture screenshot of Patient Portal login
- [x] Navigate to http://localhost:5173/admin
- [x] Verify Admin Portal login (no role dropdown)
- [x] Capture screenshot of Admin Portal login
- [x] Click autofill admin credentials
- [x] Click login
- [x] Verify redirection to Admin Dashboard
- [x] Capture screenshot of Admin Dashboard

## Progress / Findings
- Checked http://localhost:5173/login: Verified Patient Portal text, patient autofill button, and lack of role dropdown.
- Captured patient portal screenshot (`patient_login`).
- Checked http://localhost:5173/admin: Verified Admin Portal text, admin autofill button, and lack of role dropdown.
- Captured admin portal screenshot (`admin_login`).
- Clicked autofill admin credentials and clicked login button on `/admin`.
- Redirection to `/dashboard` succeeded. Dashboard layout confirmed to be Admin Portal (showing "System Admin" and options like Users, Doctors, Patients, etc.).
- Captured admin dashboard screenshot (`admin_dashboard`).





# Implementation Plan - Separate Portals for Each Role

This plan describes how we will implement dedicated portal routes for each hospital role (Patients, Doctors, Admins, Receptionists, Pharmacists, Accountants) on the frontend. This replaces the role selection dropdown with clean, role-locked login portals.

## User Review Required

> [!IMPORTANT]
> - **Patient Portal URL**: The default `/login` route will act as the **Patient Portal** (with patient registration links and Google Login).
> - **Staff Portal URLs**: Dedicated paths will be registered for each staff role:
>   - `/admin` $\rightarrow$ Admin Portal (Role locked to `admin`)
>   - `/doctor` $\rightarrow$ Doctor Portal (Role locked to `doctor`, with doctor self-application link)
>   - `/receptionist` $\rightarrow$ Receptionist Portal (Role locked to `receptionist`)
>   - `/pharmacist` $\rightarrow$ Pharmacist Portal (Role locked to `pharmacist`)
>   - `/accountant` $\rightarrow$ Accountant Portal (Role locked to `accountant`)
> - **No Dropdowns**: Each portal route will automatically assign the correct `role` during login behind the scenes. No dropdown menu will be shown.

## Proposed Changes

---

### Frontend Updates

#### [MODIFY] [App.jsx](file:///d:/smartcare-hms/frontend/src/App.jsx)
- Register the portal routes and map them to the `<Login>` component passing the corresponding `portal` prop:
  - `/login` $\rightarrow$ `<Login portal="patient" />`
  - `/admin` $\rightarrow$ `<Login portal="admin" />`
  - `/doctor` $\rightarrow$ `<Login portal="doctor" />`
  - `/receptionist` $\rightarrow$ `<Login portal="receptionist" />`
  - `/pharmacist` $\rightarrow$ `<Login portal="pharmacist" />`
  - `/accountant` $\rightarrow$ `<Login portal="accountant" />`

#### [MODIFY] [Login.jsx](file:///d:/smartcare-hms/frontend/src/pages/Login.jsx)
- Adapt the page header, autofill options, and layout based on the `portal` prop:
  - Set the state `role` automatically according to the `portal` prop (no manual dropdown needed).
  - Modify the title to show: `SmartCare Patient Portal`, `SmartCare Admin Portal`, etc.
  - Display role-specific helper links: e.g., "Apply as Doctor" only inside the `/doctor` portal, and "Create Patient Account" only inside the `/login` patient portal.
  - Filter the autofill demo buttons to show only the relevant role on each portal screen.

---

## Verification Plan

### Manual Verification
1. Access `http://localhost:5173/login` (Patient Portal). Verify it has no dropdown, displays "Patient Portal", shows the patient registration links, and logging in routes to the patient dashboard.
2. Access `http://localhost:5173/admin` (Admin Portal). Verify it has no dropdown, displays "Admin Portal", shows only the Admin autofill button, and logging in routes to the admin dashboard.
3. Repeat the check for `/doctor` (Doctor Portal), `/receptionist` (Receptionist Portal), `/pharmacist` (Pharmacist Portal), and `/accountant` (Accountant Portal).

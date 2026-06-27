# SmartCare Hospital Management System

Welcome to the **SmartCare Hospital Management System**! This comprehensive application is designed to streamline various hospital operations and facilitate seamless interactions between different user roles, such as admins, doctors, patients, receptionists, pharmacists, accountants, and lab technicians.

The system empowers patients to book appointments, doctors to manage their schedules and medical records, and the hospital staff to efficiently handle billing, lab reports, ward management, and pharmacy inventory.

## 🚀 Features & Access Portals

Once you have the application running locally (see instructions below), you can access the different portals by typing the complete URLs into your browser's address bar:

- **Patient Portal:** [http://localhost:5173/login](http://localhost:5173/login) (Default Login)
  - Book appointments, view medical records, check lab reports, and manage billing.
- **Admin Portal:** [http://localhost:5173/admin](http://localhost:5173/admin)
  - Full system control, manage users, audit logs, oversee wards, and view contact messages.
- **Doctor Portal:** [http://localhost:5173/doctor](http://localhost:5173/doctor)
  - Manage patient records, handle appointments, view lab reports, and prescribe medicine.
- **Receptionist Portal:** [http://localhost:5173/receptionist](http://localhost:5173/receptionist)
  - Manage patient registrations, handle doctor appointments, manage wards, and oversee billing.
- **Pharmacist Portal:** [http://localhost:5173/pharmacist](http://localhost:5173/pharmacist)
  - Manage pharmacy inventory, process prescriptions, and handle medicine stocks.
- **Accountant Portal:** [http://localhost:5173/accountant](http://localhost:5173/accountant)
  - Manage hospital billing, handle patient invoices, and oversee financial records.
- **Lab Technician Portal:** [http://localhost:5173/lab_technician](http://localhost:5173/lab_technician)
  - Upload and manage patient lab reports and test results.

## 🛠 Technology Stack

- **Frontend:** React.js (Vite), React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB

## ⚙️ How to run the project locally

To set up the project on your local machine, follow these steps:

### 1. Backend Setup
Open a terminal, navigate to the `backend` directory, and start the server:
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
Open another terminal, navigate to the `frontend` directory, and start the development server:
```bash
cd frontend
npm install
npm run dev
```

### 3. Access the Application
Open your web browser and go to [http://localhost:5173](http://localhost:5173) to view the application. From there, you can append the specific role routes (e.g., `http://localhost:5173/admin`) to access different portals.

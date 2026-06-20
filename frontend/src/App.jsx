import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import Doctors from './pages/Doctors.jsx';
import Appointments from './pages/Appointments.jsx';
import MedicalRecords from './pages/MedicalRecords.jsx';
import Pharmacy from './pages/Pharmacy.jsx';
import Billing from './pages/Billing.jsx';
import Users from './pages/Users.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import LabReports from './pages/LabReports.jsx';
import Wards from './pages/Wards.jsx';
import ContactMessages from './pages/ContactMessages.jsx';
import Profile from './pages/Profile.jsx';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">Loading Al Hidayat Hospital...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles?.length && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login portal="patient" />} />
      <Route path="/admin" element={<Login portal="admin" />} />
      <Route path="/doctor" element={<Login portal="doctor" />} />
      <Route path="/receptionist" element={<Login portal="receptionist" />} />
      <Route path="/pharmacist" element={<Login portal="pharmacist" />} />
      <Route path="/accountant" element={<Login portal="accountant" />} />
      <Route path="/lab_technician" element={<Login portal="lab_technician" />} />
      <Route path="/dashboard" element={<Protected><DashboardLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<Protected roles={['admin','doctor','receptionist','accountant']}><Patients /></Protected>} />
        <Route path="doctors" element={<Protected roles={['admin','receptionist','patient']}><Doctors /></Protected>} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="records" element={<Protected roles={['admin','doctor','patient']}><MedicalRecords /></Protected>} />
        <Route path="pharmacy" element={<Protected roles={['admin','pharmacist','doctor']}><Pharmacy /></Protected>} />
        <Route path="lab" element={<Protected roles={['admin','doctor','receptionist','patient','lab_technician']}><LabReports /></Protected>} />
        <Route path="billing" element={<Protected roles={['admin','accountant','receptionist','patient']}><Billing /></Protected>} />
        <Route path="wards" element={<Protected roles={['admin','receptionist']}><Wards /></Protected>} />
        <Route path="users" element={<Protected roles={['admin']}><Users /></Protected>} />
        <Route path="audit" element={<Protected roles={['admin']}><AuditLogs /></Protected>} />
        <Route path="messages" element={<Protected roles={['admin']}><ContactMessages /></Protected>} />
        <Route path="profile" element={<Profile />} />
      </Route>
      </Routes>
    </>
  );
}

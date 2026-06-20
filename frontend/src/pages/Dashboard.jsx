import { CalendarCheck, CalendarDays, ClipboardList, Coins, FileText, Pill, Stethoscope, Users, FlaskConical } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, Panel } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';

const currency = (value) => `Rs. ${value ?? 0}`;

const dashboardCards = (role, summary) => {
  const cards = {
    doctor: [
      ['Assigned Appointments', summary.assignedAppointments ?? 0, <CalendarDays/>],
      ['Today Appointments', summary.todayAppointments ?? 0, <CalendarCheck/>],
      ['Pending Visits', summary.pendingAppointments ?? 0, <ClipboardList/>],
      ['Completed Visits', summary.completedAppointments ?? 0, <Stethoscope/>, 'success'],
      ['Lab Reports', summary.labReports ?? 0, <FlaskConical/>],
    ],
    patient: [
      ['My Appointments', summary.appointments ?? 0, <CalendarDays/>],
      ['Upcoming Visits', summary.upcomingAppointments ?? 0, <CalendarCheck/>],
      ['Medical Records', summary.records ?? 0, <FileText/>],
      ['Lab Reports', summary.labReports ?? 0, <FlaskConical/>],
      ['Pending Bills', summary.pendingBills ?? 0, <Coins/>, 'warning'],
    ],
    receptionist: [
      ['Patients', summary.patients ?? 0, <Users/>],
      ['Today Appointments', summary.todayAppointments ?? 0, <CalendarDays/>],
      ['Pending Appointments', summary.pendingAppointments ?? 0, <ClipboardList/>, 'warning'],
      ['Available Doctors', summary.availableDoctors ?? 0, <Stethoscope/>, 'success'],
    ],
    pharmacist: [
      ['Medicines', summary.medicines ?? 0, <Pill/>],
      ['Low Stock', summary.lowStock ?? 0, <Pill/>, 'warning'],
      ['Expired Items', summary.expired ?? 0, <ClipboardList/>, 'warning'],
      ['Total Quantity', summary.totalQuantity ?? 0, <CalendarCheck/>, 'success'],
    ],
    accountant: [
      ['Pending Invoices', summary.pendingInvoices ?? 0, <ClipboardList/>, 'warning'],
      ['Paid Invoices', summary.paidInvoices ?? 0, <CalendarCheck/>, 'success'],
      ['Revenue', currency(summary.revenue), <Coins/>, 'success'],
      ['Total Billed', currency(summary.billed), <FileText/>],
    ],
    lab_technician: [
      ['Pending Reports', summary.pendingReports ?? 0, <ClipboardList/>, 'warning'],
      ['Completed Reports', summary.completedReports ?? 0, <FlaskConical/>, 'success'],
      ['Total Reports', summary.totalReports ?? 0, <FileText/>],
    ],
  };
  return cards[role] || [
    ['Patients', summary.patients ?? 0, <Users/>],
    ['Doctors', summary.doctors ?? 0, <Stethoscope/>],
    ['Today Appointments', summary.todayAppointments ?? 0, <CalendarDays/>],
    ['Lab Reports', summary.labReports ?? 0, <FlaskConical/>],
    ['Revenue', currency(summary.revenue), <Coins/>, 'success'],
  ];
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary } = useFetch('/dashboard/summary', {});
  const { data: trend } = useFetch('/dashboard/appointments-trend', []);
  const cards = dashboardCards(user?.role, summary);
  return <div className="grid-page">
    <div className="stats-grid">
      {cards.map(([title, value, icon, tone]) => <Card key={title} title={title} value={value} icon={icon} tone={tone}/>)}
    </div>
    <Panel title="Appointment Trend"><div className="chart"><ResponsiveContainer><AreaChart data={trend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis allowDecimals={false}/><Tooltip/><Area type="monotone" dataKey="appointments" strokeWidth={3} fillOpacity={0.2}/></AreaChart></ResponsiveContainer></div></Panel>
  </div>;
}

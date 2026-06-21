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
  const showAppointmentTrend = !user?.role || ['admin', 'receptionist', 'doctor'].includes(user?.role);
  const { data: trend } = useFetch(showAppointmentTrend ? '/dashboard/appointments-trend' : null, []);
  
  const cards = dashboardCards(user?.role, summary);
  
  return <div className="grid-page">
    <div className="stats-grid">
      {cards.map(([title, value, icon, tone]) => <Card key={title} title={title} value={value} icon={icon} tone={tone}/>)}
    </div>
    {showAppointmentTrend && (
      <Panel title={user?.role === 'doctor' ? "My Appointment Trend" : "Hospital Appointment Trend"}>
        <div className="chart">
          <ResponsiveContainer>
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="date"/>
              <YAxis allowDecimals={false}/>
              <Tooltip/>
              <Area type="monotone" dataKey="appointments" strokeWidth={3} fillOpacity={0.2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    )}

    {user?.role === 'patient' && (
      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Panel title="Upcoming Appointments">
            {summary.upcomingList?.length ? (
              <table className="table">
                <thead><tr><th>Date</th><th>Time</th><th>Doctor</th></tr></thead>
                <tbody>
                  {summary.upcomingList.map(a => (
                    <tr key={a._id}>
                      <td>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                      <td>{a.timeSlot}</td>
                      <td>{a.doctor?.user?.name || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty-state">No upcoming appointments.</p>}
          </Panel>
          <Panel title="Action Required: Pending Bills">
            {summary.pendingBillsList?.length ? (
              <table className="table">
                <thead><tr><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {summary.pendingBillsList.map(b => {
                    const total = b.items?.reduce((s, it) => s + (it.quantity * it.unitPrice), 0) - (b.discount || 0);
                    return (
                      <tr key={b._id}>
                        <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td>Rs. {total}</td>
                        <td><span className="badge warning">Unpaid</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <p className="empty-state">All bills are paid.</p>}
          </Panel>
        </div>
        <div>
          <Panel title="Recent Medical Records">
            {summary.recentRecords?.length ? (
              <table className="table">
                <thead><tr><th>Date</th><th>Doctor</th><th>Diagnosis</th></tr></thead>
                <tbody>
                  {summary.recentRecords.map(r => (
                    <tr key={r._id}>
                      <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>{r.doctor?.user?.name || 'Unknown'}</td>
                      <td>{r.diagnosis || 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty-state">No recent records.</p>}
          </Panel>
        </div>
      </div>
    )}

    {user?.role === 'pharmacist' && (
      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Panel title="Low Stock Alerts">
          {summary.lowStockList?.length ? (
            <table className="table">
              <thead><tr><th>Medicine</th><th>Quantity</th><th>Limit</th></tr></thead>
              <tbody>
                {summary.lowStockList.map(m => (
                  <tr key={m._id}>
                    <td>{m.name}</td>
                    <td style={{color: 'var(--danger-color)', fontWeight: 'bold'}}>{m.quantity}</td>
                    <td>{m.lowStockLimit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty-state">Inventory levels are healthy.</p>}
        </Panel>
        <Panel title="Expiring Soon (90 Days)">
          {summary.expiringList?.length ? (
            <table className="table">
              <thead><tr><th>Medicine</th><th>Batch</th><th>Expiry Date</th></tr></thead>
              <tbody>
                {summary.expiringList.map(m => (
                  <tr key={m._id}>
                    <td>{m.name}</td>
                    <td>{m.batchNo}</td>
                    <td style={{color: 'var(--danger-color)'}}>{new Date(m.expiryDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty-state">No medicines expiring soon.</p>}
        </Panel>
      </div>
    )}

    {user?.role === 'accountant' && (
      <Panel title="Recent Invoices Ledger">
        {summary.recentInvoicesList?.length ? (
          <table className="table">
            <thead><tr><th>Date</th><th>Patient</th><th>Total Amount</th><th>Status</th></tr></thead>
            <tbody>
              {summary.recentInvoicesList.map(i => {
                const total = i.items?.reduce((s, it) => s + (it.quantity * it.unitPrice), 0) - (i.discount || 0);
                return (
                  <tr key={i._id}>
                    <td>{new Date(i.createdAt).toLocaleDateString()}</td>
                    <td>{i.patient?.user?.name || 'Walk-in'}</td>
                    <td>Rs. {total}</td>
                    <td><span className={`badge ${i.paymentStatus === 'paid' ? 'success' : 'warning'}`}>{i.paymentStatus}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p className="empty-state">No recent invoices.</p>}
      </Panel>
    )}

    {user?.role === 'lab_technician' && (
      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Panel title="Pending Lab Requests">
          {summary.pendingRequestsList?.length ? (
            <table className="table">
              <thead><tr><th>Date</th><th>Patient</th><th>Test Name</th></tr></thead>
              <tbody>
                {summary.pendingRequestsList.map(r => (
                  <tr key={r._id}>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>{r.patient?.user?.name || 'Unknown'}</td>
                    <td>{r.testName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty-state">No pending requests.</p>}
        </Panel>
        <Panel title="Recently Completed">
          {summary.completedReportsList?.length ? (
            <table className="table">
              <thead><tr><th>Date Completed</th><th>Patient</th><th>Test Name</th></tr></thead>
              <tbody>
                {summary.completedReportsList.map(r => (
                  <tr key={r._id}>
                    <td>{new Date(r.updatedAt).toLocaleDateString()}</td>
                    <td>{r.patient?.user?.name || 'Unknown'}</td>
                    <td>{r.testName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty-state">No recently completed reports.</p>}
        </Panel>
      </div>
    )}

  </div>;
}

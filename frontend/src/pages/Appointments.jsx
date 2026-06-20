import { useEffect, useState } from 'react';
import { CalendarPlus, Search, CheckCircle, XCircle, Ban } from 'lucide-react';
import { Empty, Panel, StatusBadge, Pagination, TableSkeleton } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Appointments() {
  const { user } = useAuth();
  const isStaff = ['admin', 'receptionist', 'doctor'].includes(user?.role);
  
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, refetch } = useFetch(`/appointments?page=${page}&limit=10`, []);
  const { data: doctorsData } = useFetch('/doctors', []);
  const { data: patientsData } = useFetch(user?.role === 'patient' ? null : '/patients', []);

  const rows = Array.isArray(data) ? data : [];
  const doctors = Array.isArray(doctorsData) ? doctorsData : [];
  const patients = Array.isArray(patientsData) ? patientsData : [];

  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ patient:'', doctor:'', appointmentDate:'', timeSlot:'09:00 AM - 09:30 AM', reason:'' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (patients[0] && !form.patient) {
      setForm(f => ({ ...f, patient: patients[0]._id }));
    }
    if (doctors[0] && !form.doctor) {
      setForm(f => ({ ...f, doctor: doctors[0]._id }));
    }
  }, [patients, doctors]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const payload = { ...form };
      if (user.role === 'patient') delete payload.patient;
      await api.post('/appointments', payload);
      setMsg('Appointment request created successfully.');
      setForm(f => ({ ...f, reason: '' }));
      refetch?.();
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not book appointment');
    }
  };

  const updateStatus = async (id, status) => {
    setErr('');
    setMsg('');
    try {
      await api.patch(`/appointments/${id}`, { status });
      setMsg(`Appointment updated to ${status}.`);
      refetch?.();
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not update appointment status.');
    }
  };

  const filteredRows = rows.filter(item => {
    const query = search.toLowerCase();
    return (
      (item.patient?.fullName || '').toLowerCase().includes(query) ||
      (item.doctor?.user?.name || '').toLowerCase().includes(query) ||
      (item.reason || '').toLowerCase().includes(query) ||
      (item.timeSlot || '').toLowerCase().includes(query) ||
      (item.status || '').toLowerCase().includes(query)
    );
  });

  return <>
    {user?.role !== 'doctor' && (
      <Panel title="Book Appointment" actions={<CalendarPlus size={20}/> }>
        {msg && <div className="success-alert">{msg}</div>}
        {err && <div className="alert">{err}</div>}
        <form className="inline-form" onSubmit={submit}>
          {user.role !== 'patient' && (
            <label>
              Patient
              <select value={form.patient} onChange={e => setForm({ ...form, patient: e.target.value })}>
                {patients.map(p => <option key={p._id} value={p._id}>{p.fullName} ({p.patientId})</option>)}
              </select>
            </label>
          )}
          <label>
            Doctor
            <select value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })}>
              {doctors.map(d => <option key={d._id} value={d._id}>{d.user?.name} - {d.specialization}</option>)}
            </select>
          </label>
          <label>
            Date
            <input type="date" value={form.appointmentDate} onChange={e => setForm({ ...form, appointmentDate: e.target.value })} required />
          </label>
          <label>
            Slot
            <select value={form.timeSlot} onChange={e => setForm({ ...form, timeSlot: e.target.value })}>
              {['09:00 AM - 09:30 AM','09:30 AM - 10:00 AM','10:00 AM - 10:30 AM','11:00 AM - 11:30 AM','12:00 PM - 12:30 PM','02:00 PM - 02:30 PM'].map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="span-2">
            Reason
            <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for visit" required />
          </label>
          <button className="primary">Book</button>
        </form>
      </Panel>
    )}

    <Panel
      title="Appointments"
      actions={
        <div className="searchbox">
          <Search size={16} />
          <input
            placeholder="Search appointments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      }
    >
      {error && <div className="alert">{error}</div>}
      {loading ? (
        <TableSkeleton />
      ) : filteredRows.length === 0 ? (
        <Empty />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Reason</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(item => (
                <tr key={item._id}>
                  <td>{item.patient?.fullName || 'N/A'}</td>
                  <td>{item.doctor?.user?.name}</td>
                  <td>{new Date(item.appointmentDate).toLocaleDateString()}</td>
                  <td>{item.timeSlot}</td>
                  <td>{item.reason}</td>
                  <td><StatusBadge value={item.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {/* Patient cancel action */}
                      {!isStaff && ['pending', 'confirmed'].includes(item.status) && (
                        <button
                          className="ghost"
                          onClick={() => updateStatus(item._id, 'cancelled')}
                          style={{ padding: '4px 8px', borderRadius: '6px', color: '#ef4444' }}
                        >
                          Cancel
                        </button>
                      )}

                      {/* Staff actions */}
                      {isStaff && item.status === 'pending' && (
                        <>
                          <button
                            className="ghost"
                            onClick={() => updateStatus(item._id, 'confirmed')}
                            style={{ padding: '4px 8px', borderRadius: '6px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <CheckCircle size={12} /> Confirm
                          </button>
                          <button
                            className="ghost"
                            onClick={() => updateStatus(item._id, 'cancelled')}
                            style={{ padding: '4px 8px', borderRadius: '6px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <XCircle size={12} /> Cancel
                          </button>
                        </>
                      )}

                      {isStaff && item.status === 'confirmed' && (
                        <>
                          <button
                            className="ghost"
                            onClick={() => updateStatus(item._id, 'no-show')}
                            style={{ padding: '4px 8px', borderRadius: '6px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Ban size={12} /> No-Show
                          </button>
                          <button
                            className="ghost"
                            onClick={() => updateStatus(item._id, 'cancelled')}
                            style={{ padding: '4px 8px', borderRadius: '6px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <XCircle size={12} /> Cancel
                          </button>
                        </>
                      )}

                      {!['pending', 'confirmed'].includes(item.status) && (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={meta} onPageChange={setPage} />
    </Panel>
  </>;
}

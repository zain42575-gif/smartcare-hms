import { useEffect, useMemo, useState } from 'react';
import { ClipboardPlus, Search, Printer, ArrowLeft, FileText, Activity } from 'lucide-react';
import { Empty, Panel, StatusBadge, Pagination, TableSkeleton } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const initialForm = { appointment:'', diagnosis:'', symptoms:'', treatmentNotes:'', medicineName:'', dosage:'', frequency:'', duration:'', followUpDate:'' };

export default function MedicalRecords() {
  const { user } = useAuth();
  const canCreate = user?.role === 'doctor' || user?.role === 'admin';
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, refetch } = useFetch(`/records?page=${page}&limit=10`, []);
  const { data: appointmentsData, refetch: refetchAppointments } = useFetch(canCreate ? '/appointments' : null, []);
  
  const [form, setForm] = useState(initialForm);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const rows = Array.isArray(data) ? data : [];
  const appointments = Array.isArray(appointmentsData) ? appointmentsData : [];
  const selectableAppointments = useMemo(() => appointments.filter(item => !['completed','cancelled','no-show'].includes(item.status)), [appointments]);
  
  useEffect(() => {
    if (selectableAppointments[0] && !form.appointment) setForm(prev => ({ ...prev, appointment: selectableAppointments[0]._id }));
  }, [selectableAppointments.length]);

  const selectedAppointment = selectableAppointments.find(item => item._id === form.appointment);
  
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!selectedAppointment) { setErr('Select an active appointment first.'); return; }
    try {
      await api.post('/records', {
        appointment: selectedAppointment._id,
        patient: selectedAppointment.patient?._id,
        doctor: selectedAppointment.doctor?._id,
        diagnosis: form.diagnosis,
        symptoms: form.symptoms.split(',').map(item => item.trim()).filter(Boolean),
        treatmentNotes: form.treatmentNotes,
        prescription: form.medicineName ? [{
          medicineName: form.medicineName,
          dosage: form.dosage,
          frequency: form.frequency,
          duration: form.duration,
        }] : [],
        followUpDate: form.followUpDate || undefined,
      });
      setMsg('Medical record created and appointment marked completed.');
      setForm(initialForm);
      refetch?.();
      refetchAppointments?.();
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not create medical record');
    }
  };

  if (selectedRecord) {
    return (
      <div className="printable-document">
        <div className="print-hide" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button className="ghost" onClick={() => setSelectedRecord(null)}>
            <ArrowLeft size={16} /> Back to Records
          </button>
          <button className="primary" onClick={() => window.print()} style={{ width: 'auto' }}>
            <Printer size={16} /> Download PDF / Print
          </button>
        </div>

        <Panel>
          {/* Hospital Letterhead */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
              <img src="/logo.jpg" alt="Al Hidayat Hospital Logo" style={{ height: '48px', width: 'auto', borderRadius: '4px' }} />
              <h2 style={{ margin: 0, fontSize: '28px', color: '#0f172a', fontWeight: '800' }}>Al Hidayat Hospital</h2>
            </div>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
              GT Road Near UBL Bank, Kot Adu | Contact: +92 3037364446 | Email: support@alhidayathospital.com
            </p>
          </div>

          {/* Record Title */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>
              Official Medical Record
            </h3>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>
              Date: {new Date(selectedRecord.createdAt).toLocaleDateString()} | Record ID: {selectedRecord._id.slice(-6).toUpperCase()}
            </p>
          </div>

          {/* Patient & Doctor Details */}
          <div className="form-grid" style={{ marginBottom: '32px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Patient Information</p>
              <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>Name: {selectedRecord.patient?.fullName}</p>
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#475569' }}>Email: {selectedRecord.patient?.email || 'N/A'}</p>
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#475569' }}>Gender: <span style={{ textTransform: 'capitalize' }}>{selectedRecord.patient?.gender || 'N/A'}</span> | Blood Group: {selectedRecord.patient?.bloodGroup || 'N/A'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Consulting Physician</p>
              <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                {selectedRecord.doctor?.user?.name?.match(/^Dr\.?\s+/i) ? '' : 'Dr. '}
                {selectedRecord.doctor?.user?.name}
              </p>
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#475569' }}>Department: {selectedRecord.doctor?.department}</p>
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#475569' }}>Specialization: {selectedRecord.doctor?.specialization}</p>
            </div>
          </div>

          {/* Clinical Details */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Clinical Assessment</h4>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Primary Diagnosis</strong>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '500', color: '#1e293b' }}>{selectedRecord.diagnosis}</p>
              </div>
              
              {selectedRecord.symptoms?.length > 0 && (
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Reported Symptoms</strong>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedRecord.symptoms.map((sym, i) => (
                      <span key={i} style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', color: '#475569' }}>{sym}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.treatmentNotes && (
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Treatment Notes & Observations</strong>
                  <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.6', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {selectedRecord.treatmentNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Prescription Table */}
          {selectedRecord.prescription?.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Prescription Details</h4>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecord.prescription.map((med, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: '600', color: '#0f172a' }}>{med.medicineName}</td>
                        <td>{med.dosage}</td>
                        <td>{med.frequency}</td>
                        <td>{med.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer & Signatures */}
          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Recommended Follow-up</strong>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                {selectedRecord.followUpDate ? new Date(selectedRecord.followUpDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'As needed'}
              </p>
            </div>
            
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #cbd5e1', height: '40px', marginBottom: '8px' }}></div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                {selectedRecord.doctor?.user?.name?.match(/^Dr\.?\s+/i) ? '' : 'Dr. '}
                {selectedRecord.doctor?.user?.name}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Signature / Digital Stamp</p>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return <>
    {canCreate && <Panel title="Create Medical Record" actions={<ClipboardPlus size={20}/>}>
      {msg && <div className="success-alert">{msg}</div>}{err && <div className="alert">{err}</div>}
      {selectableAppointments.length === 0 ? <Empty text="No active appointments available for record creation." /> : <form className="inline-form records-form" onSubmit={submit}>
        <label className="span-2">Appointment<select value={form.appointment} onChange={e=>setForm({...form, appointment:e.target.value})}>
          {selectableAppointments.map(item => <option key={item._id} value={item._id}>{item.patient?.fullName} - {new Date(item.appointmentDate).toLocaleDateString()} - {item.timeSlot}</option>)}
        </select></label>
        <label className="span-2">Diagnosis<input value={form.diagnosis} onChange={e=>setForm({...form, diagnosis:e.target.value})} required /></label>
        <label className="span-2">Symptoms<textarea value={form.symptoms} onChange={e=>setForm({...form, symptoms:e.target.value})} placeholder="Comma separated symptoms" /></label>
        <label className="span-2">Treatment Notes<textarea value={form.treatmentNotes} onChange={e=>setForm({...form, treatmentNotes:e.target.value})} /></label>
        <label>Medicine<input value={form.medicineName} onChange={e=>setForm({...form, medicineName:e.target.value})} /></label>
        <label>Dosage<input value={form.dosage} onChange={e=>setForm({...form, dosage:e.target.value})} /></label>
        <label>Frequency<input value={form.frequency} onChange={e=>setForm({...form, frequency:e.target.value})} /></label>
        <label>Duration<input value={form.duration} onChange={e=>setForm({...form, duration:e.target.value})} /></label>
        <label>Follow-up<input type="date" value={form.followUpDate} onChange={e=>setForm({...form, followUpDate:e.target.value})} /></label>
        <button className="primary">Save Record</button>
      </form>}
    </Panel>}
    
    <Panel title="Medical Records" actions={<div className="searchbox"><Search size={16}/><input placeholder="Search and filters available from API" /></div>}>
      {error && <div className="alert">{error}</div>}
      {loading ? <TableSkeleton /> : rows.length === 0 ? <Empty /> : <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Diagnosis</th>
              <th>Follow-up</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(item => (
              <tr key={item._id}>
                <td>{item.patient?.fullName}</td>
                <td>{item.doctor?.user?.name}</td>
                <td>{item.diagnosis}</td>
                <td>{item.followUpDate ? new Date(item.followUpDate).toLocaleDateString() : '-'}</td>
                <td>
                  <button className="ghost" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => setSelectedRecord(item)}>
                    <FileText size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
      <Pagination meta={meta} onPageChange={setPage} />
    </Panel>
  </>;
}

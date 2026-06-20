import { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, ClipboardList, CalendarDays, Receipt, Eye, Activity } from 'lucide-react';
import { Empty, Panel, StatusBadge, Pagination, TableSkeleton } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

const initialForm = {
  fullName: '',
  gender: 'male',
  dateOfBirth: '',
  phone: '',
  email: '',
  address: '',
  bloodGroup: 'unknown',
  allergies: '',
  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: ''
};

export default function Patients() {
  const { user } = useAuth();
  const canRegister = ['admin', 'receptionist'].includes(user?.role);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'register'
  
  // Search state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // Reset page when search changes
  useEffect(() => { setPage(1); }, [search]);
  
  // Fetch Patients List
  const fetchUrl = `/patients?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ''}`;
  const { data: listData, meta: listMeta, loading: listLoading, error: listError, refetch } = useFetch(fetchUrl, []);
  const rows = Array.isArray(listData) ? listData : [];

  // Detail View State
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const { data: detailData, loading: detailLoading, error: detailError } = useFetch(
    selectedPatientId ? `/patients/${selectedPatientId}` : null,
    null
  );

  // Form State
  const [form, setForm] = useState(initialForm);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submitRegister = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    const payload = {
      fullName: form.fullName,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth || undefined,
      phone: form.phone,
      email: form.email || undefined,
      address: form.address || undefined,
      bloodGroup: form.bloodGroup,
      allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      emergencyContact: {
        name: form.emergencyName || undefined,
        relation: form.emergencyRelation || undefined,
        phone: form.emergencyPhone || undefined
      }
    };

    try {
      await api.post('/patients', payload);
      setMsg('Patient registered successfully.');
      setForm(initialForm);
      refetch?.();
      setActiveTab('directory');
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to register patient.');
    }
  };

  const handleTextChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Render Patient Detailed Clinical Profile
  if (selectedPatientId) {
    return (
      <>
        <button className="back-link" onClick={() => setSelectedPatientId(null)} style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Patients List
        </button>

        {detailError && <div className="alert">{detailError}</div>}
        {detailLoading || !detailData ? (
          <div className="empty">Loading patient records...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Profile Overview Card */}
            <Panel title={`Patient Clinical File: ${detailData.patient.fullName}`} actions={<small style={{ color: '#64748b' }}>ID: {detailData.patient.patientId}</small>}>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                <div><strong>Gender:</strong><div style={{ textTransform: 'capitalize', marginTop: '4px' }}>{detailData.patient.gender}</div></div>
                <div><strong>Date of Birth:</strong><div style={{ marginTop: '4px' }}>{detailData.patient.dateOfBirth ? new Date(detailData.patient.dateOfBirth).toLocaleDateString() : '-'}</div></div>
                <div><strong>Phone:</strong><div style={{ marginTop: '4px' }}>{detailData.patient.phone}</div></div>
                <div><strong>Email:</strong><div style={{ marginTop: '4px' }}>{detailData.patient.email || '-'}</div></div>
                <div><strong>Blood Group:</strong><div style={{ marginTop: '4px' }}><StatusBadge value={detailData.patient.bloodGroup} /></div></div>
                <div><strong>Address:</strong><div style={{ marginTop: '4px' }}>{detailData.patient.address || '-'}</div></div>
                <div className="span-2"><strong>Known Allergies:</strong>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {detailData.patient.allergies?.length > 0 ? (
                      detailData.patient.allergies.map((a, idx) => <span key={idx} className="badge cancelled">{a}</span>)
                    ) : (
                      <span className="badge active">None Recorded</span>
                    )}
                  </div>
                </div>
              </div>

              {detailData.patient.emergencyContact?.name && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#475569' }}>Emergency Contact</h4>
                  <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div><strong>Name:</strong> {detailData.patient.emergencyContact.name}</div>
                    <div><strong>Relation:</strong> {detailData.patient.emergencyContact.relation || '-'}</div>
                    <div><strong>Phone:</strong> {detailData.patient.emergencyContact.phone || '-'}</div>
                  </div>
                </div>
              )}
            </Panel>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
              {/* Visit / Clinical Records History */}
              <Panel title="Consultation & Diagnosis History" actions={<ClipboardList size={18} />}>
                {detailData.records?.length === 0 ? (
                  <Empty text="No medical records found." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {detailData.records.map(r => (
                      <div key={r._id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong>{r.diagnosis}</strong>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div><strong>Doctor:</strong> {r.doctor?.user?.name || 'Staff'}</div>
                          {r.symptoms?.length > 0 && <div><strong>Symptoms:</strong> {r.symptoms.join(', ')}</div>}
                          {r.treatmentNotes && <div><strong>Treatment Notes:</strong> {r.treatmentNotes}</div>}
                          {r.prescription?.length > 0 && (
                            <div style={{ marginTop: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                              <strong>Prescription:</strong>
                              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                {r.prescription.map((p, idx) => (
                                  <li key={idx}>
                                    {p.medicineName} - {p.dosage} ({p.frequency} / {p.duration})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Appointment Bookings */}
                <Panel title="Appointment Visits" actions={<CalendarDays size={18} />}>
                  {detailData.appointments?.length === 0 ? (
                    <Empty text="No appointments recorded." />
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Slot</th>
                            <th>Doctor</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.appointments.map(a => (
                            <tr key={a._id}>
                              <td>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                              <td>{a.timeSlot}</td>
                              <td>{a.doctor?.user?.name}</td>
                              <td><StatusBadge value={a.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>

                {/* Invoices List */}
                <Panel title="Billing & Receipts" actions={<Receipt size={18} />}>
                  {detailData.invoices?.length === 0 ? (
                    <Empty text="No invoices generated." />
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Invoice No</th>
                            <th>Total</th>
                            <th>Paid</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.invoices.map(inv => (
                            <tr key={inv._id}>
                              <td><strong>{inv.invoiceNo}</strong></td>
                              <td>Rs. {inv.totalAmount}</td>
                              <td>Rs. {inv.paidAmount}</td>
                              <td><StatusBadge value={inv.paymentStatus} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Tab Controls */}
      {canRegister && (
        <div className="tabs">
          <button className={activeTab === 'directory' ? 'active' : ''} onClick={() => { setActiveTab('directory'); setMsg(''); setErr(''); }}>
            <ClipboardList size={16} /> Patients Directory
          </button>
          <button className={activeTab === 'register' ? 'active' : ''} onClick={() => { setActiveTab('register'); setMsg(''); setErr(''); }}>
            <Plus size={16} /> Register New Patient
          </button>
        </div>
      )}

      {/* 1. REGISTER NEW PATIENT FORM */}
      {activeTab === 'register' && canRegister && (
        <Panel title="Patient Registration Form" actions={<Activity size={20} />}>
          {msg && <div className="success-alert">{msg}</div>}
          {err && <div className="alert">{err}</div>}
          <form onSubmit={submitRegister} className="form-grid">
            <label>
              Full Name
              <input type="text" name="fullName" value={form.fullName} onChange={handleTextChange} placeholder="e.g. John Doe" required />
            </label>

            <label>
              Gender
              <select name="gender" value={form.gender} onChange={handleTextChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              Date of Birth
              <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleTextChange} />
            </label>

            <label>
              Phone Number
              <input type="text" name="phone" value={form.phone} onChange={handleTextChange} placeholder="e.g. 0321-4567890" required />
            </label>

            <label>
              Email Address
              <input type="email" name="email" value={form.email} onChange={handleTextChange} placeholder="e.g. john@example.com" />
            </label>

            <label>
              Blood Group
              <select name="bloodGroup" value={form.bloodGroup} onChange={handleTextChange}>
                <option value="unknown">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </label>

            <label className="span-2">
              Home Address
              <input type="text" name="address" value={form.address} onChange={handleTextChange} placeholder="e.g. House 45-B, Sector G-11, Islamabad" />
            </label>

            <label className="span-2">
              Known Allergies (comma-separated list)
              <input type="text" name="allergies" value={form.allergies} onChange={handleTextChange} placeholder="e.g. Penicillin, Pollen, Nuts" />
            </label>

            <div className="span-2" style={{ borderTop: '1px solid #e2e8f0', marginTop: '14px', paddingTop: '14px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569' }}>Emergency Contact</h4>
            </div>

            <label>
              Contact Person Name
              <input type="text" name="emergencyName" value={form.emergencyName} onChange={handleTextChange} placeholder="e.g. Jane Doe" />
            </label>

            <label>
              Relation
              <input type="text" name="emergencyRelation" value={form.emergencyRelation} onChange={handleTextChange} placeholder="e.g. Spouse, Parent" />
            </label>

            <label>
              Contact Phone
              <input type="text" name="emergencyPhone" value={form.emergencyPhone} onChange={handleTextChange} placeholder="e.g. 0321-0000000" />
            </label>

            <div className="span-2" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="primary" style={{ width: 'auto' }}>Register Patient</button>
            </div>
          </form>
        </Panel>
      )}

      {/* 2. PATIENTS DIRECTORY TABLE */}
      {activeTab === 'directory' && (
        <Panel
          title="Patients Directory"
          actions={
            <div className="searchbox">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search patient name, phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          }
        >
          {listError && <div className="alert">{listError}</div>}
          {listLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <Empty text="No matching patient profiles found." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Blood</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(item => (
                    <tr key={item._id}>
                      <td><strong>{item.patientId}</strong></td>
                      <td>{item.fullName}</td>
                      <td>{item.phone}</td>
                      <td><StatusBadge value={item.bloodGroup} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="ghost"
                          onClick={() => setSelectedPatientId(item._id)}
                          style={{ padding: '6px 12px', borderRadius: '8px' }}
                        >
                          <Eye size={14} /> Medical File
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination meta={listMeta} onPageChange={setPage} />
        </Panel>
      )}
    </>
  );
}

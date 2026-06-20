import { useState, useEffect } from 'react';
import { Search, Plus, Bed, LogOut, ClipboardList, Activity, Stethoscope, User, Calendar, DollarSign, PenTool } from 'lucide-react';
import { Empty, Panel, StatusBadge, Pagination, TableSkeleton, CardSkeleton } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function Wards() {
  const { user } = useAuth();
  const isStaff = ['admin', 'receptionist', 'doctor'].includes(user?.role);
  const canManageBeds = ['admin', 'receptionist'].includes(user?.role);
  const canManageAdmissions = ['admin', 'receptionist'].includes(user?.role);

  const [activeTab, setActiveTab] = useState('beds');
  const [bedSearch, setBedSearch] = useState('');
  const [admissionSearch, setAdmissionSearch] = useState('');

  // Fetch data
  const [bedPage, setBedPage] = useState(1);
  const [admissionPage, setAdmissionPage] = useState(1);

  const { data: bedsData, meta: bedsMeta, loading: bedsLoading, error: bedsError, refetch: refetchBeds } = useFetch(`/beds?page=${bedPage}&limit=12`, []);
  const { data: admissionsData, meta: admissionsMeta, loading: admissionsLoading, error: admissionsError, refetch: refetchAdmissions } = useFetch(`/admissions?page=${admissionPage}&limit=10`, []);
  const { data: doctorsData } = useFetch('/doctors', []);
  const { data: patientsData } = useFetch(user?.role === 'patient' ? null : '/patients', []);

  const beds = Array.isArray(bedsData) ? bedsData : [];
  const admissions = Array.isArray(admissionsData) ? admissionsData : [];
  const doctors = Array.isArray(doctorsData) ? doctorsData : [];
  const patients = Array.isArray(patientsData) ? patientsData : [];

  // Modals state
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // Add Bed form state
  const [newBedForm, setNewBedForm] = useState({ bedNumber: '', roomNumber: '', type: 'general', pricePerDay: '', status: 'available' });

  // Admit form state
  const [admitForm, setAdmitForm] = useState({ patient: '', bed: '', doctor: '', reason: '' });

  // Discharge form state
  const [dischargeForm, setDischargeForm] = useState({ dischargeNotes: '' });

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Setup initial selections in form dropdowns when data is loaded
  useEffect(() => {
    const availableBeds = beds.filter(b => b.status === 'available');
    if (patients[0] && !admitForm.patient) {
      setAdmitForm(f => ({ ...f, patient: patients[0]._id }));
    }
    if (availableBeds[0] && !admitForm.bed) {
      setAdmitForm(f => ({ ...f, bed: availableBeds[0]._id }));
    }
    if (doctors[0] && !admitForm.doctor) {
      setAdmitForm(f => ({ ...f, doctor: doctors[0]._id }));
    }
  }, [patients, beds, doctors]);

  // Keep dropdown updated when beds status change
  useEffect(() => {
    const availableBeds = beds.filter(b => b.status === 'available');
    if (availableBeds.length > 0 && (!admitForm.bed || !availableBeds.some(b => b._id === admitForm.bed))) {
      setAdmitForm(f => ({ ...f, bed: availableBeds[0]._id }));
    }
  }, [beds]);

  const handleAddBed = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.post('/beds', {
        ...newBedForm,
        pricePerDay: Number(newBedForm.pricePerDay)
      });
      setMsg('Bed added successfully.');
      setNewBedForm({ bedNumber: '', roomNumber: '', type: 'general', pricePerDay: '', status: 'available' });
      setShowAddBedModal(false);
      refetchBeds();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to add bed.');
    }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!admitForm.patient || !admitForm.bed || !admitForm.doctor || !admitForm.reason) {
      setErr('Please fill out all fields to admit the patient.');
      return;
    }
    try {
      await api.post('/admissions', admitForm);
      setMsg('Patient admitted successfully.');
      setAdmitForm({ patient: '', bed: '', doctor: '', reason: '' });
      setShowAdmitModal(false);
      refetchBeds();
      refetchAdmissions();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to admit patient.');
    }
  };

  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.post(`/admissions/${selectedAdmission._id}/discharge`, dischargeForm);
      setMsg('Patient discharged and room charges invoiced successfully.');
      setShowDischargeModal(false);
      setSelectedAdmission(null);
      setDischargeForm({ dischargeNotes: '' });
      refetchBeds();
      refetchAdmissions();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to discharge patient.');
    }
  };

  const toggleBedMaintenance = async (bed) => {
    setErr('');
    setMsg('');
    const newStatus = bed.status === 'maintenance' ? 'available' : 'maintenance';
    try {
      await api.patch(`/beds/${bed._id}`, { status: newStatus });
      setMsg(`Bed ${bed.bedNumber} status updated to ${newStatus}.`);
      refetchBeds();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to update bed status.');
    }
  };

  const openDischargeModal = (admission) => {
    setSelectedAdmission(admission);
    setDischargeForm({ dischargeNotes: 'Discharged in stable condition.' });
    setShowDischargeModal(true);
  };

  // Stay calculation for discharge preview
  const getStayDurationAndCost = (admission) => {
    if (!admission) return { days: 0, cost: 0 };
    const start = new Date(admission.admissionDate);
    const end = new Date();
    const diffTime = Math.max(0, end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const rate = admission.bed?.pricePerDay || 0;
    return { days, cost: days * rate };
  };

  // Filtering beds
  const filteredBeds = beds.filter(b => {
    const query = bedSearch.toLowerCase();
    return (
      b.bedNumber.toLowerCase().includes(query) ||
      b.roomNumber.toLowerCase().includes(query) ||
      b.type.toLowerCase().includes(query) ||
      b.status.toLowerCase().includes(query)
    );
  });

  // Filtering admissions
  const filteredAdmissions = admissions.filter(a => {
    const query = admissionSearch.toLowerCase();
    return (
      (a.patient?.fullName || '').toLowerCase().includes(query) ||
      (a.patient?.patientId || '').toLowerCase().includes(query) ||
      (a.bed?.bedNumber || '').toLowerCase().includes(query) ||
      (a.doctor?.user?.name || '').toLowerCase().includes(query) ||
      (a.reason || '').toLowerCase().includes(query) ||
      (a.status || '').toLowerCase().includes(query)
    );
  });

  const availableBedsForAdmit = beds.filter(b => b.status === 'available');

  return (
    <>
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-head" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bed size={24} style={{ color: '#4a4166' }} />
            <div>
              <h3 style={{ margin: 0 }}>Inpatient Department (IPD)</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Manage hospital rooms, wards, bed availability, and patient stay admissions.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {canManageBeds && (
              <button className="primary" onClick={() => setShowAddBedModal(true)} style={{ width: 'auto', padding: '8px 14px', fontSize: '14px' }}>
                <Plus size={16} /> Add Bed
              </button>
            )}
            {canManageAdmissions && (
              <button className="primary" onClick={() => setShowAdmitModal(true)} style={{ width: 'auto', padding: '8px 14px', fontSize: '14px', background: '#4f46e5' }}>
                <Activity size={16} /> Admit Patient
              </button>
            )}
          </div>
        </div>

        {msg && <div className="success-alert">{msg}</div>}
        {err && <div className="alert">{err}</div>}

        <div className="tabs" style={{ marginTop: '16px' }}>
          <button className={activeTab === 'beds' ? 'active' : ''} onClick={() => setActiveTab('beds')}>
            <Bed size={16} /> Wards & Bed Inventory
          </button>
          <button className={activeTab === 'admissions' ? 'active' : ''} onClick={() => setActiveTab('admissions')}>
            <ClipboardList size={16} /> Admission Registry
          </button>
        </div>
      </div>

      {activeTab === 'beds' && (
        <Panel
          title="Beds & Room Allocation"
          actions={
            <div className="searchbox">
              <Search size={16} />
              <input
                placeholder="Search bed, room, type..."
                value={bedSearch}
                onChange={e => setBedSearch(e.target.value)}
              />
            </div>
          }
        >
          {bedsError && <div className="alert">{bedsError}</div>}
          {bedsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '10px' }}>
              <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
            </div>
          ) : filteredBeds.length === 0 ? (
            <Empty text="No rooms or beds found matching search criteria." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '10px' }}>
              {filteredBeds.map(b => (
                <div key={b._id} className="card" style={{
                  textAlign: 'left',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: '1px solid #e2e8f0',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        padding: '8px',
                        borderRadius: '10px',
                        background: b.status === 'available' ? '#dcfce7' : b.status === 'occupied' ? '#fee2e2' : '#fef3c7',
                        color: b.status === 'available' ? '#166534' : b.status === 'occupied' ? '#991b1b' : '#92400e'
                      }}>
                        <Bed size={20} />
                      </div>
                      <div>
                        <b style={{ fontSize: '16px', color: '#1e293b' }}>{b.bedNumber}</b>
                        <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>{b.roomNumber}</span>
                      </div>
                    </div>
                    <StatusBadge value={b.status} />
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Room Category:</span>
                      <strong style={{ textTransform: 'capitalize', color: '#334155' }}>{b.type}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Charge Rate:</span>
                      <strong style={{ color: '#4a4166' }}>Rs. {b.pricePerDay} / day</strong>
                    </div>
                  </div>

                  {canManageBeds && b.status !== 'occupied' && (
                    <button
                      onClick={() => toggleBedMaintenance(b)}
                      className="ghost"
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        padding: '6px 10px',
                        width: '100%',
                        justifyContent: 'center',
                        color: b.status === 'maintenance' ? '#16a34a' : '#ea580c'
                      }}
                    >
                      {b.status === 'maintenance' ? 'Set Active / Available' : 'Set to Maintenance'}
                    </button>
                  )}
                  {b.status === 'occupied' && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      padding: '6px 10px',
                      background: '#f8fafc',
                      color: '#64748b',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>
                      Occupied by Inpatient
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <Pagination meta={bedsMeta} onPageChange={setBedPage} />
        </Panel>
      )}

      {activeTab === 'admissions' && (
        <Panel
          title="Patient Stay Registrations"
          actions={
            <div className="searchbox">
              <Search size={16} />
              <input
                placeholder="Search patient, bed, doctor..."
                value={admissionSearch}
                onChange={e => setAdmissionSearch(e.target.value)}
              />
            </div>
          }
        >
          {admissionsError && <div className="alert">{admissionsError}</div>}
          {admissionsLoading ? (
            <TableSkeleton />
          ) : filteredAdmissions.length === 0 ? (
            <Empty text="No admission logs found." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Patient Details</th>
                    <th>Bed / Room</th>
                    <th>Physician</th>
                    <th>Admission Date</th>
                    <th>Discharge Date</th>
                    <th>Status</th>
                    {canManageAdmissions && <th style={{ textAlign: 'right' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmissions.map(a => (
                    <tr key={a._id}>
                      <td>
                        <strong style={{ color: '#4a4166', fontSize: '13px' }}>{a.admissionNo || 'N/A'}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>{a.patient?.fullName}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>ID: {a.patient?.patientId} | blood: {a.patient?.bloodGroup}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600' }}>{a.bed?.bedNumber}</span>
                          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>{a.bed?.type} ({a.bed?.roomNumber})</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Stethoscope size={14} style={{ color: '#64748b' }} />
                          <span style={{ fontSize: '13px' }}>{a.doctor?.user?.name || 'Assigned Doctor'}</span>
                        </div>
                      </td>
                      <td>{new Date(a.admissionDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td>
                        {a.dischargeDate ? (
                          new Date(a.dischargeDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                        ) : (
                          <span style={{ color: '#3b82f6', fontWeight: '600', fontSize: '12px' }}>Active Admission</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${a.status === 'admitted' ? 'pending' : 'active'}`}>
                          {a.status}
                        </span>
                      </td>
                      {canManageAdmissions && (
                        <td style={{ textAlign: 'right' }}>
                          {a.status === 'admitted' ? (
                            <button
                              onClick={() => openDischargeModal(a)}
                              className="ghost"
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: '#fee2e2',
                                color: '#991b1b',
                                fontWeight: '700',
                                border: 'none',
                                fontSize: '12px'
                              }}
                            >
                              Discharge & Bill
                            </button>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                              Billed: Rs. {a.totalPrice}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination meta={admissionsMeta} onPageChange={setAdmissionPage} />
        </Panel>
      )}

      {/* Add Bed Modal */}
      {showAddBedModal && (
        <div className="center-screen" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          zIndex: 1000,
          display: 'grid',
          placeItems: 'center'
        }}>
          <div className="login-card panel" style={{ width: '450px', background: 'white', margin: 0, padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Create Room Bed</h3>
            <form onSubmit={handleAddBed} style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'grid', gap: '6px', fontWeight: '600', color: '#475569' }}>
                Bed Number / ID
                <input
                  type="text"
                  placeholder="e.g. BED-101-A"
                  value={newBedForm.bedNumber}
                  onChange={e => setNewBedForm({ ...newBedForm, bedNumber: e.target.value })}
                  required
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />
              </label>
              <label style={{ display: 'grid', gap: '6px', fontWeight: '600', color: '#475569' }}>
                Room / Ward Name
                <input
                  type="text"
                  placeholder="e.g. ICU Room 1 or General Ward A"
                  value={newBedForm.roomNumber}
                  onChange={e => setNewBedForm({ ...newBedForm, roomNumber: e.target.value })}
                  required
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />
              </label>
              <label style={{ display: 'grid', gap: '6px', fontWeight: '600', color: '#475569' }}>
                Bed / Room Category
                <select
                  value={newBedForm.type}
                  onChange={e => setNewBedForm({ ...newBedForm, type: e.target.value })}
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }}
                >
                  <option value="general">General Ward</option>
                  <option value="semi-private">Semi-Private Room</option>
                  <option value="private">Private Suite</option>
                  <option value="icu">ICU Unit Bed</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: '6px', fontWeight: '600', color: '#475569' }}>
                Charge Rate (Rs. per Day)
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 1500"
                  value={newBedForm.pricePerDay}
                  onChange={e => setNewBedForm({ ...newBedForm, pricePerDay: e.target.value })}
                  required
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />
              </label>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="ghost" onClick={() => setShowAddBedModal(false)}>Cancel</button>
                <button type="submit" className="primary" style={{ width: 'auto' }}>Add Bed</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admit Patient Modal */}
      {showAdmitModal && (
        <div className="center-screen" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          zIndex: 1000,
          display: 'grid',
          placeItems: 'center'
        }}>
          <div className="login-card panel" style={{ width: '500px', background: 'white', margin: 0, padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>New Inpatient Admission</h3>
            <form onSubmit={handleAdmit} style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'grid', gap: '6px', fontWeight: '600', color: '#475569' }}>
                Select Patient
                <select
                  value={admitForm.patient}
                  onChange={e => setAdmitForm({ ...admitForm, patient: e.target.value })}
                  required
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }}
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.fullName} ({p.patientId})</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: '6px', fontWeight: '600', color: '#475569' }}>
                Select Available Bed
                <select
                  value={admitForm.bed}
                  onChange={e => setAdmitForm({ ...admitForm, bed: e.target.value })}
                  required
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }}
                >
                  <option value="">-- Choose Room/Bed --</option>
                  {availableBedsForAdmit.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.bedNumber} - {b.roomNumber} ({b.type} - Rs. {b.pricePerDay}/day)
                    </option>
                  ))}
                </select>
                {availableBedsForAdmit.length === 0 && (
                  <span style={{ fontSize: '11px', color: '#ef4444' }}>No beds are currently available.</span>
                )}
              </label>
              <label style={{ display: 'grid', gap: '6px', fontWeight: '600', color: '#475569' }}>
                Primary Physician
                <select
                  value={admitForm.doctor}
                  onChange={e => setAdmitForm({ ...admitForm, doctor: e.target.value })}
                  required
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white' }}
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>{d.user?.name} ({d.specialization})</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: '6px', fontWeight: '600', color: '#475569' }}>
                Reason for Admission
                <textarea
                  rows="3"
                  placeholder="Clinical symptoms, surgery recovery observation..."
                  value={admitForm.reason}
                  onChange={e => setAdmitForm({ ...admitForm, reason: e.target.value })}
                  required
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', font: 'inherit', resize: 'vertical' }}
                />
              </label>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="ghost" onClick={() => setShowAdmitModal(false)}>Cancel</button>
                <button type="submit" className="primary" style={{ width: 'auto' }} disabled={availableBedsForAdmit.length === 0}>
                  Admit Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge & Billing Modal */}
      {showDischargeModal && selectedAdmission && (
        <div className="center-screen" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          zIndex: 1000,
          display: 'grid',
          placeItems: 'center'
        }}>
          <div className="login-card panel" style={{ width: '480px', background: 'white', margin: 0, padding: '28px' }}>
            <h3 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', color: '#991b1b' }}>Patient Discharge & Billing</h3>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', fontSize: '13px', display: 'grid', gap: '8px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Patient: </span>
                <strong>{selectedAdmission.patient?.fullName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Bed Allocated: </span>
                <strong>{selectedAdmission.bed?.bedNumber} ({selectedAdmission.bed?.roomNumber})</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Date of Admission:</span>
                  <strong>{new Date(selectedAdmission.admissionDate).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Stay Duration:</span>
                  <strong style={{ color: '#2563eb' }}>{getStayDurationAndCost(selectedAdmission).days} day(s)</strong>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px', fontSize: '15px' }}>
                <span style={{ fontWeight: '700', color: '#334155' }}>Total Room Charges:</span>
                <strong style={{ color: '#991b1b', fontSize: '16px' }}>Rs. {getStayDurationAndCost(selectedAdmission).cost}</strong>
              </div>
            </div>

            <form onSubmit={handleDischargeSubmit} style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'grid', gap: '6px', fontWeight: '600', color: '#475569' }}>
                Discharge Notes / Summary
                <textarea
                  rows="3"
                  placeholder="Recovery status, prescriptions to follow, subsequent OPD appointment advice..."
                  value={dischargeForm.dischargeNotes}
                  onChange={e => setDischargeForm({ ...dischargeForm, dischargeNotes: e.target.value })}
                  required
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', font: 'inherit', resize: 'vertical' }}
                />
              </label>
              <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                * Note: Discharging this patient will automatically free Bed <b>{selectedAdmission.bed?.bedNumber}</b> and generate an unpaid invoice under the billing system.
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="ghost" onClick={() => { setShowDischargeModal(false); setSelectedAdmission(null); }}>Cancel</button>
                <button type="submit" className="primary" style={{ width: 'auto', background: '#991b1b' }}>
                  Confirm Discharge & Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

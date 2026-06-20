import { useState, useEffect } from 'react';
import { Search, FlaskConical, Plus, Clipboard, Eye, CheckCircle, Edit3 } from 'lucide-react';
import { Empty, Panel, StatusBadge, Pagination, TableSkeleton } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function LabReports() {
  const { user } = useAuth();
  const isStaff = ['admin', 'doctor', 'receptionist', 'lab_technician'].includes(user?.role);
  const canOrderTest = ['admin', 'doctor', 'receptionist'].includes(user?.role);
  const canUpdateReport = ['admin', 'lab_technician'].includes(user?.role);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, refetch } = useFetch(search ? `/lab-reports?search=${encodeURIComponent(search)}&page=${page}&limit=10` : `/lab-reports?page=${page}&limit=10`, []);
  const { data: patientsData } = useFetch(isStaff ? '/patients' : null, []);
  const { data: doctorsData } = useFetch(isStaff ? '/doctors' : null, []);

  const reports = Array.isArray(data) ? data : [];
  const patients = Array.isArray(patientsData) ? patientsData : [];
  const doctors = Array.isArray(doctorsData) ? doctorsData : [];

  // Order Test Form State
  const initialOrderForm = { patient: '', doctor: '', testName: '', cost: 1000, paymentStatus: 'unpaid' };
  const [orderForm, setOrderForm] = useState(initialOrderForm);

  // Edit/View Dialog State
  const [activeReport, setActiveReport] = useState(null);
  const [editForm, setEditForm] = useState({ resultSummary: '', technicianNotes: '', status: '', paymentStatus: '', cost: 0 });

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Default selection initialization
  useEffect(() => {
    if (patients.length > 0 && !orderForm.patient) {
      setOrderForm(f => ({ ...f, patient: patients[0]._id }));
    }
    if (doctors.length > 0 && !orderForm.doctor) {
      setOrderForm(f => ({ ...f, doctor: doctors[0]._id }));
    }
  }, [patients, doctors, orderForm]);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    if (!orderForm.patient || !orderForm.testName) {
      setErr('Please select a patient and enter the test name.');
      return;
    }

    try {
      await api.post('/lab-reports', {
        patient: orderForm.patient,
        doctor: orderForm.doctor || undefined,
        testName: orderForm.testName,
        cost: Number(orderForm.cost) || 0,
        paymentStatus: orderForm.paymentStatus
      });
      setMsg('Diagnostic test ordered successfully.');
      setOrderForm({ ...initialOrderForm, patient: patients[0]?._id || '', doctor: doctors[0]?._id || '' });
      refetch?.();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to order lab test.');
    }
  };

  const openEdit = (report) => {
    setActiveReport(report);
    setEditForm({
      resultSummary: report.resultSummary || '',
      technicianNotes: report.technicianNotes || '',
      status: report.status,
      paymentStatus: report.paymentStatus,
      cost: report.cost
    });
    setMsg('');
    setErr('');
  };

  const closeEdit = () => {
    setActiveReport(null);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-pdf-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Lab_Report_${activeReport.reportNo}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    try {
      await api.patch(`/lab-reports/${activeReport._id}`, {
        resultSummary: editForm.resultSummary,
        technicianNotes: editForm.technicianNotes,
        status: editForm.status,
        paymentStatus: editForm.paymentStatus,
        cost: Number(editForm.cost)
      });
      setMsg('Lab report details updated successfully.');
      setActiveReport(null);
      refetch?.();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to update lab report.');
    }
  };

  return (
    <>
      {/* 1. ORDER TEST FORM (Staff only) */}
      {canOrderTest && !activeReport && (
        <Panel title="Order Diagnostic Lab Test" actions={<FlaskConical size={20} />}>
          {msg && <div className="success-alert">{msg}</div>}
          {err && <div className="alert">{err}</div>}
          <form onSubmit={handleOrderSubmit} className="form-grid">
            <label>
              Patient
              <select
                value={orderForm.patient}
                onChange={e => setOrderForm({ ...orderForm, patient: e.target.value })}
                required
              >
                <option value="">-- Select Patient --</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.fullName} ({p.patientId})</option>
                ))}
              </select>
            </label>

            <label>
              Prescribing Doctor (Optional)
              <select
                value={orderForm.doctor}
                onChange={e => setOrderForm({ ...orderForm, doctor: e.target.value })}
              >
                <option value="">-- Select Doctor --</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>{d.user?.name} - {d.specialization}</option>
                ))}
              </select>
            </label>

            <label className="span-2">
              Test / Diagnostic Service Name
              <input
                type="text"
                value={orderForm.testName}
                onChange={e => setOrderForm({ ...orderForm, testName: e.target.value })}
                placeholder="e.g. Complete Blood Count (CBC), Chest X-Ray, ECG"
                required
              />
            </label>

            <label>
              Cost (Rs.)
              <input
                type="number"
                min="0"
                value={orderForm.cost}
                onChange={e => setOrderForm({ ...orderForm, cost: e.target.value })}
                required
              />
            </label>

            <label>
              Payment Status
              <select
                value={orderForm.paymentStatus}
                onChange={e => setOrderForm({ ...orderForm, paymentStatus: e.target.value })}
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </label>

            <div className="span-2" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="primary" style={{ width: 'auto' }}>Order Test</button>
            </div>
          </form>
        </Panel>
      )}

      {/* 2. UPDATE/VIEW DETAILS FORM */}
      {activeReport && (
        <Panel title={canUpdateReport ? `Update Lab Report: ${activeReport.reportNo}` : `Lab Report Details: ${activeReport.reportNo}`} actions={<Edit3 size={20} />}>
          {err && <div className="alert">{err}</div>}
          <div id="report-pdf-content" style={{ padding: '10px', background: '#fff' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div><strong>Patient Name:</strong> {activeReport.patient?.fullName}</div>
              <div><strong>Test Requested:</strong> {activeReport.testName}</div>
              <div><strong>Ordering Doctor:</strong> {activeReport.doctor?.user?.name || 'Self/Walk-in'}</div>
              <div><strong>Date Ordered:</strong> {new Date(activeReport.createdAt).toLocaleDateString()}</div>
              <div><strong>Cost:</strong> Rs. {activeReport.cost}</div>
              <div><strong>Payment:</strong> <StatusBadge value={activeReport.paymentStatus} /></div>
            </div>
          </div>

          <form onSubmit={canUpdateReport ? handleEditSubmit : e => e.preventDefault()}>
            <div className="form-grid">
              <label className="span-2">
                Result Summary / Lab Findings
                <textarea
                  value={editForm.resultSummary}
                  onChange={e => setEditForm({ ...editForm, resultSummary: e.target.value })}
                  placeholder="Record patient diagnostic metrics, e.g., Hemoglobin: 14.5 g/dL"
                  disabled={!canUpdateReport}
                  rows={4}
                  style={{ width: '100%' }}
                />
              </label>

              <label className="span-2">
                Technician/Radiologist Remarks
                <textarea
                  value={editForm.technicianNotes}
                  onChange={e => setEditForm({ ...editForm, technicianNotes: e.target.value })}
                  placeholder="e.g. Scans are clear. No abnormalities detected."
                  disabled={!canUpdateReport}
                  rows={3}
                  style={{ width: '100%' }}
                />
              </label>

              {canUpdateReport ? (
                <>
                  <label>
                    Report Status
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>

                  <label>
                    Payment Status
                    <select
                      value={editForm.paymentStatus}
                      onChange={e => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                    </select>
                  </label>

                  <label>
                    Test Cost (Rs.)
                    <input
                      type="number"
                      min="0"
                      value={editForm.cost}
                      onChange={e => setEditForm({ ...editForm, cost: e.target.value })}
                    />
                  </label>
                </>
              ) : (
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div><strong>Report Status:</strong> <StatusBadge value={activeReport.status} /></div>
                  {activeReport.performedAt && <div><strong>Completed On:</strong> {new Date(activeReport.performedAt).toLocaleString()}</div>}
                  
                  {activeReport.status === 'completed' && (
                    <>
                      <div style={{ background: '#f8fafc', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Result Summary</h4>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#475569' }}>{activeReport.resultSummary}</p>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Technician Remarks</h4>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#475569' }}>{activeReport.technicianNotes}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div data-html2canvas-ignore="true" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              {!isStaff && activeReport.status === 'completed' && (
                <button type="button" className="primary" onClick={handleDownloadPDF} style={{ width: 'auto' }}>
                  Download PDF
                </button>
              )}
              <button type="button" className="ghost" onClick={closeEdit}>Close</button>
              {canUpdateReport && <button className="primary" onClick={handleEditSubmit} style={{ width: 'auto' }}>Save Changes</button>}
            </div>
          </form>
        </div>
        </Panel>
      )}

      {/* 3. LAB REPORTS TABLE LIST */}
      {!activeReport && (
        <Panel title="Lab Reports & Diagnostics" actions={<div className="searchbox"><Search size={16}/><input placeholder="Search tests..." value={search} onChange={e => {setSearch(e.target.value); setPage(1);}} /></div>}>
          {error && <div className="alert">{error}</div>}
          {loading ? (
            <TableSkeleton />
          ) : reports.length === 0 ? (
            <Empty text="No lab reports found." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Report No</th>
                    <th>Patient</th>
                    <th>Test Name</th>
                    <th>Cost</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date Ordered</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(item => (
                    <tr key={item._id}>
                      <td><strong>{item.reportNo}</strong></td>
                      <td>{item.patient?.fullName || 'N/A'}</td>
                      <td>{item.testName}</td>
                      <td>Rs. {item.cost}</td>
                      <td><StatusBadge value={item.paymentStatus} /></td>
                      <td><StatusBadge value={item.status} /></td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="ghost" onClick={() => openEdit(item)} style={{ padding: '6px 12px', borderRadius: '8px' }}>
                          {canUpdateReport ? <Edit3 size={14} /> : <Eye size={14} />} {canUpdateReport ? 'Update' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination meta={meta} onPageChange={setPage} />
        </Panel>
      )}
    </>
  );
}

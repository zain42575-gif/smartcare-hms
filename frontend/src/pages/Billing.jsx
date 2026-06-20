import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Coins, Eye, ArrowLeft, Printer } from 'lucide-react';
import { Empty, Panel, StatusBadge, Pagination, TableSkeleton } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function Billing() {
  const { user } = useAuth();
  const canCreate = ['admin', 'accountant', 'receptionist'].includes(user?.role);
  
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, refetch } = useFetch(`/invoices?page=${page}&limit=10`, []);
  const { data: patientsData } = useFetch(canCreate ? '/patients' : null, []);
  const { data: medicinesData } = useFetch(canCreate ? '/medicines' : null, []);

  const rows = Array.isArray(data) ? data : [];
  const patients = Array.isArray(patientsData) ? patientsData : [];
  const medicines = Array.isArray(medicinesData) ? medicinesData : [];

  // Active Invoice View State
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  // Search state
  const [search, setSearch] = useState('');

  // Invoice creation form State
  const initialItem = { type: 'consultation', description: '', quantity: 1, unitPrice: 0, medicine: '' };
  const [patient, setPatient] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('none');
  const [items, setItems] = useState([initialItem]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Default patient selection
  useEffect(() => {
    if (patients.length > 0 && !patient) {
      setPatient(patients[0]._id);
    }
  }, [patients, patient]);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)), 0);
  const total = Math.max(subtotal - (Number(discount) || 0), 0);

  let statusPreview = 'unpaid';
  const paid = Number(paidAmount) || 0;
  if (paid > 0) {
    if (paid < total) statusPreview = 'partially-paid';
    else statusPreview = 'paid';
  }

  const handleItemChange = (index, field, val) => {
    const newItems = [...items];
    const updated = { ...newItems[index], [field]: val };

    if (field === 'type') {
      updated.medicine = '';
      updated.description = '';
      updated.unitPrice = 0;
    }

    if (field === 'medicine') {
      const medObj = medicines.find(m => m._id === val);
      if (medObj) {
        updated.description = medObj.name;
        updated.unitPrice = medObj.price;
      } else {
        updated.description = '';
        updated.unitPrice = 0;
      }
    }

    newItems[index] = updated;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { ...initialItem }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    if (!patient) {
      setErr('Please select a patient.');
      return;
    }

    const cleanedItems = items.map(item => {
      const copy = {
        type: item.type,
        description: item.description || (item.type === 'medicine' ? 'Medicine' : 'Service'),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0
      };
      if (item.type === 'medicine' && item.medicine) {
        copy.medicine = item.medicine;
      }
      return copy;
    });

    try {
      await api.post('/invoices', {
        patient,
        items: cleanedItems,
        discount: Number(discount) || 0,
        paidAmount: Number(paidAmount) || 0,
        paymentMethod,
      });

      setMsg('Invoice created successfully.');
      setDiscount(0);
      setPaidAmount(0);
      setPaymentMethod('none');
      setItems([{ ...initialItem }]);
      if (patients.length > 0) setPatient(patients[0]._id);
      refetch?.();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to create invoice.');
    }
  };

  // Record additional payment on existing invoice
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    if (!payAmount || Number(payAmount) <= 0) {
      setErr('Please enter a valid payment amount.');
      return;
    }

    const nextPaidAmount = (activeInvoice.paidAmount || 0) + Number(payAmount);

    try {
      const res = await api.patch(`/invoices/${activeInvoice._id}`, {
        paidAmount: nextPaidAmount,
        paymentMethod: payMethod
      });
      setMsg('Payment recorded successfully.');
      setActiveInvoice(res.data.data);
      setPayAmount('');
      refetch?.();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to update payment details.');
    }
  };

  const filteredRows = rows.filter(item => {
    const query = search.toLowerCase();
    return (
      (item.invoiceNo || '').toLowerCase().includes(query) ||
      (item.patient?.fullName || '').toLowerCase().includes(query) ||
      (item.paymentStatus || '').toLowerCase().includes(query)
    );
  });

  // Render Detailed Invoice View
  if (activeInvoice) {
    const invSubtotal = activeInvoice.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
    const invTotal = Math.max(invSubtotal - (activeInvoice.discount || 0), 0);
    const balanceDue = Math.max(invTotal - (activeInvoice.paidAmount || 0), 0);

    return (
      <>
        <button className="back-link" onClick={() => { setActiveInvoice(null); setMsg(''); setErr(''); }} style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Invoices List
        </button>

        {msg && <div className="success-alert">{msg}</div>}
        {err && <div className="alert">{err}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '22px' }}>
          {/* Detailed Invoice Receipt */}
          <div className="printable-receipt">
            <Panel title={`Invoice Receipt: ${activeInvoice.invoiceNo}`} actions={<button className="ghost print-hide" onClick={() => window.print()}><Printer size={16} /> Print</button>}>
              <div style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <small style={{ color: '#64748b' }}>BILL TO:</small>
                    <h4 style={{ margin: '4px 0', fontSize: '16px' }}>{activeInvoice.patient?.fullName}</h4>
                    <div>Phone: {activeInvoice.patient?.phone || 'N/A'}</div>
                    <div>ID: {activeInvoice.patient?.patientId || 'N/A'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <small style={{ color: '#64748b' }}>DATE GENERATED:</small>
                    <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{new Date(activeInvoice.createdAt).toLocaleDateString()}</div>
                    <div style={{ marginTop: '8px' }}>
                      Status: <StatusBadge value={activeInvoice.paymentStatus} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.description}</td>
                        <td><span style={{ textTransform: 'capitalize', fontSize: '11px', color: '#64748b' }}>{item.type}</span></td>
                        <td>{item.quantity}</td>
                        <td>Rs. {item.unitPrice}</td>
                        <td style={{ textAlign: 'right' }}>Rs. {item.quantity * item.unitPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '260px', marginLeft: 'auto', marginTop: '20px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <strong>Rs. {invSubtotal}</strong>
                </div>
                {activeInvoice.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                    <span>Discount:</span>
                    <span>- Rs. {activeInvoice.discount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '16px' }}>
                  <span style={{ color: '#1e293b', fontWeight: 'bold' }}>Grand Total:</span>
                  <strong style={{ color: '#2563eb' }}>Rs. {invTotal}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                  <span>Paid Amount:</span>
                  <span>Rs. {activeInvoice.paidAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', color: balanceDue > 0 ? '#ea580c' : '#10b981', fontWeight: 'bold' }}>
                  <span>Balance Due:</span>
                  <span>Rs. {balanceDue}</span>
                </div>
              </div>
            </Panel>
          </div>

          {/* Record Payment Form (for staff, only if balance due) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {canCreate && balanceDue > 0 && (
              <Panel title="Record Payment" actions={<Coins size={20} />}>
                <form onSubmit={handleRecordPayment}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <label>
                      Payment Amount (Rs.)
                      <input
                        type="number"
                        min="1"
                        max={balanceDue}
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        placeholder={`Max Rs. ${balanceDue}`}
                        required
                      />
                    </label>

                    <label>
                      Payment Method
                      <select value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="online">Online Payment</option>
                      </select>
                    </label>

                    <button className="primary" style={{ marginTop: '10px' }}>Record Payment</button>
                  </div>
                </form>
              </Panel>
            )}

            <Panel title="Invoice Details" actions={<small style={{ color: '#64748b' }}>Logs</small>}>
              <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>Payment Method:</strong> <span style={{ textTransform: 'capitalize' }}>{activeInvoice.paymentMethod}</span></div>
                <div><strong>Billed By:</strong> {activeInvoice.createdBy?.name || 'System / Admin'}</div>
                <div><strong>Created On:</strong> {new Date(activeInvoice.createdAt).toLocaleString()}</div>
                <div><strong>Last Updated:</strong> {new Date(activeInvoice.updatedAt).toLocaleString()}</div>
              </div>
            </Panel>
          </div>
        </div>
      </>
    );
  }

  return <>
    {canCreate && (
      <Panel title="Create New Invoice" actions={<Coins size={20} />}>
        {msg && <div className="success-alert">{msg}</div>}
        {err && <div className="alert">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Patient
              <select value={patient} onChange={e => setPatient(e.target.value)} required>
                <option value="">-- Select Patient --</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.fullName} ({p.patientId})</option>
                ))}
              </select>
            </label>

            <label>
              Payment Method
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="none">None (Unpaid)</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="online">Online Payment</option>
              </select>
            </label>

            <label>
              Discount (Rs.)
              <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} />
            </label>

            <label>
              Paid Amount (Rs.)
              <input type="number" min="0" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
            </label>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#475569' }}>Invoice Items</h4>
            
            {items.map((item, idx) => (
              <div key={idx} className="form-grid" style={{ gridTemplateColumns: '1.2fr 1.2fr 1.5fr 0.8fr 1fr auto', alignItems: 'end', marginBottom: '12px' }}>
                <label>
                  Type
                  <select value={item.type} onChange={e => handleItemChange(idx, 'type', e.target.value)}>
                    <option value="consultation">Consultation</option>
                    <option value="service">Service</option>
                    <option value="medicine">Medicine</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                {item.type === 'medicine' ? (
                  <label>
                    Select Medicine
                    <select value={item.medicine} onChange={e => handleItemChange(idx, 'medicine', e.target.value)} required>
                      <option value="">-- Choose --</option>
                      {medicines.map(m => (
                        <option key={m._id} value={m._id} disabled={m.quantity <= 0}>
                          {m.name} (Qty: {m.quantity})
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div style={{ display: 'none' }}></div>
                )}

                <label className={item.type === 'medicine' ? '' : 'span-2'}>
                  Description
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => handleItemChange(idx, 'description', e.target.value)}
                    placeholder="e.g. Consult Fee / Service Charge"
                    required
                  />
                </label>

                <label>
                  Qty
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                    required
                  />
                </label>

                <label>
                  Unit Price (Rs.)
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                    required
                  />
                </label>

                <button
                  type="button"
                  className="ghost"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  style={{ height: '46px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            ))}

            <button type="button" className="ghost" onClick={addItem} style={{ marginTop: '8px', display: 'flex', width: 'auto' }}>
              <Plus size={16} /> Add Line Item
            </button>
          </div>

          <div style={{ marginTop: '20px', background: '#f8fafc', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div><small style={{ color: '#64748b' }}>Subtotal</small><div style={{ fontSize: '18px', fontWeight: 'bold' }}>Rs. {subtotal}</div></div>
              <div><small style={{ color: '#64748b' }}>Discount</small><div style={{ fontSize: '18px', fontWeight: 'bold' }}>Rs. {discount || 0}</div></div>
              <div><small style={{ color: '#64748b' }}>Total</small><div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>Rs. {total}</div></div>
              <div><small style={{ color: '#64748b' }}>Payment Status</small><div><StatusBadge value={statusPreview} /></div></div>
            </div>
            <button className="primary" style={{ width: 'auto' }}>Create Invoice</button>
          </div>
        </form>
      </Panel>
    )}

    <Panel
      title="Billing & Invoices"
      actions={
        <div className="searchbox">
          <Search size={16} />
          <input
            placeholder="Search invoice or patient..."
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
                <th>Invoice</th>
                <th>Patient</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(item => (
                <tr key={item._id}>
                  <td><strong>{item.invoiceNo}</strong></td>
                  <td>{item.patient?.fullName || 'N/A'}</td>
                  <td>Rs. {item.totalAmount || 0}</td>
                  <td>Rs. {item.paidAmount || 0}</td>
                  <td><StatusBadge value={item.paymentStatus} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="ghost"
                      onClick={() => { setActiveInvoice(item); setMsg(''); setErr(''); }}
                      style={{ padding: '6px 12px', borderRadius: '8px' }}
                    >
                      <Eye size={14} /> Receipt
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
  </>;
}

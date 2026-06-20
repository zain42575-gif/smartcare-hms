import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Pill, ClipboardCheck } from 'lucide-react';
import { Empty, Panel, StatusBadge, Pagination, TableSkeleton } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function Pharmacy() {
  const { user } = useAuth();
  const canRestock = ['admin', 'pharmacist'].includes(user?.role);
  const canDispense = ['pharmacist'].includes(user?.role);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, refetch } = useFetch(search ? `/medicines?search=${encodeURIComponent(search)}&page=${page}&limit=10` : `/medicines?page=${page}&limit=10`, []);
  const rows = Array.isArray(data) ? data : [];

  const [mode, setMode] = useState('');
  useEffect(() => {
    if (canDispense) setMode('dispense');
    else if (canRestock) setMode('restock');
  }, [canDispense, canRestock]);

  // Restock Form State
  const initialRestock = { name: '', category: '', batchNo: '', quantity: '', price: '', expiryDate: '', lowStockLimit: 10, supplier: '' };
  const [restockForm, setRestockForm] = useState(initialRestock);

  // Dispense Form State
  const initialDispenseItem = { medicine: '', quantity: 1 };
  const [dispenseItems, setDispenseItems] = useState([initialDispenseItem]);

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Clear messages when mode changes
  const changeMode = (newMode) => {
    setMode(newMode);
    setMsg('');
    setErr('');
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.post('/medicines', {
        ...restockForm,
        quantity: Number(restockForm.quantity),
        price: Number(restockForm.price),
        lowStockLimit: Number(restockForm.lowStockLimit) || 10,
      });
      setMsg('Medicine added to inventory successfully.');
      setRestockForm(initialRestock);
      refetch?.();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to add medicine.');
    }
  };

  const handleDispenseItemChange = (index, field, val) => {
    const newItems = [...dispenseItems];
    newItems[index] = { ...newItems[index], [field]: val };
    setDispenseItems(newItems);
  };

  const addDispenseItem = () => {
    setDispenseItems([...dispenseItems, { ...initialDispenseItem }]);
  };

  const removeDispenseItem = (index) => {
    if (dispenseItems.length > 1) {
      setDispenseItems(dispenseItems.filter((_, i) => i !== index));
    }
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    const invalid = dispenseItems.some(item => !item.medicine || item.quantity <= 0);
    if (invalid) {
      setErr('Please select a medicine and enter a valid quantity for all lines.');
      return;
    }

    try {
      await api.post('/medicines/issue', {
        items: dispenseItems.map(item => ({
          medicine: item.medicine,
          quantity: Number(item.quantity)
        }))
      });
      setMsg('Medicines issued and inventory updated successfully.');
      setDispenseItems([initialDispenseItem]);
      refetch?.();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to issue medicines.');
    }
  };

  const cellValues = (item) => [
    item.name,
    item.category,
    item.quantity,
    `Rs. ${item.price}`,
    new Date(item.expiryDate).toLocaleDateString(),
    item.quantity <= item.lowStockLimit ? 'low-stock' : 'in-stock'
  ];

  return <>
    {(canRestock || canDispense) && (
      <Panel title="Pharmacy Management" actions={<Pill size={20} />}>
        {msg && <div className="success-alert">{msg}</div>}
        {err && <div className="alert">{err}</div>}

        {canRestock && canDispense && (
          <div className="tabs">
            <button className={mode === 'dispense' ? 'active' : ''} onClick={() => changeMode('dispense')}>
              <ClipboardCheck size={16} /> Dispense / Issue Medicine
            </button>
            <button className={mode === 'restock' ? 'active' : ''} onClick={() => changeMode('restock')}>
              <Plus size={16} /> Restock / Add Medicine
            </button>
          </div>
        )}

        {mode === 'restock' && (
          <form onSubmit={handleRestock} className="form-grid">
            <label>
              Medicine Name
              <input
                type="text"
                value={restockForm.name}
                onChange={e => setRestockForm({ ...restockForm, name: e.target.value })}
                required
                placeholder="e.g. Paracetamol 500mg"
              />
            </label>
            <label>
              Category
              <input
                type="text"
                value={restockForm.category}
                onChange={e => setRestockForm({ ...restockForm, category: e.target.value })}
                required
                placeholder="e.g. Analgesic"
              />
            </label>
            <label>
              Batch No.
              <input
                type="text"
                value={restockForm.batchNo}
                onChange={e => setRestockForm({ ...restockForm, batchNo: e.target.value })}
                required
                placeholder="e.g. BTC-402"
              />
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="0"
                value={restockForm.quantity}
                onChange={e => setRestockForm({ ...restockForm, quantity: e.target.value })}
                required
              />
            </label>
            <label>
              Price per Unit (Rs.)
              <input
                type="number"
                min="0"
                value={restockForm.price}
                onChange={e => setRestockForm({ ...restockForm, price: e.target.value })}
                required
              />
            </label>
            <label>
              Expiry Date
              <input
                type="date"
                value={restockForm.expiryDate}
                onChange={e => setRestockForm({ ...restockForm, expiryDate: e.target.value })}
                required
              />
            </label>
            <label>
              Low Stock Alert Limit
              <input
                type="number"
                min="1"
                value={restockForm.lowStockLimit}
                onChange={e => setRestockForm({ ...restockForm, lowStockLimit: e.target.value })}
                required
              />
            </label>
            <label>
              Supplier
              <input
                type="text"
                value={restockForm.supplier}
                onChange={e => setRestockForm({ ...restockForm, supplier: e.target.value })}
                placeholder="e.g. Getz Pharma"
              />
            </label>
            <div className="span-2" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="primary" style={{ width: 'auto' }}>Add Medicine</button>
            </div>
          </form>
        )}

        {mode === 'dispense' && (
          <form onSubmit={handleDispense}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dispenseItems.map((item, idx) => (
                <div key={idx} className="form-grid" style={{ gridTemplateColumns: '3fr 1.5fr auto', alignItems: 'end' }}>
                  <label>
                    Select Medicine
                    <select
                      value={item.medicine}
                      onChange={e => handleDispenseItemChange(idx, 'medicine', e.target.value)}
                      required
                    >
                      <option value="">-- Choose Medicine --</option>
                      {rows.map(m => (
                        <option key={m._id} value={m._id} disabled={m.quantity <= 0}>
                          {m.name} (Batch: {m.batchNo}) - In Stock: {m.quantity}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Qty to Dispense
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => handleDispenseItemChange(idx, 'quantity', e.target.value)}
                      required
                    />
                  </label>

                  <button
                    type="button"
                    className="ghost"
                    onClick={() => removeDispenseItem(idx)}
                    disabled={dispenseItems.length === 1}
                    style={{ height: '46px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <button type="button" className="ghost" onClick={addDispenseItem} style={{ width: 'auto' }}>
                <Plus size={16} /> Add Another Medicine
              </button>
              <button className="primary" style={{ width: 'auto' }}>Issue / Dispense</button>
            </div>
          </form>
        )}
      </Panel>
    )}

    <Panel title="Pharmacy Inventory" actions={<div className="searchbox"><Search size={16}/><input placeholder="Search medicines..." value={search} onChange={e => {setSearch(e.target.value); setPage(1);}} /></div>}>
      {error && <div className="alert">{error}</div>}
      {loading ? <TableSkeleton /> : rows.length === 0 ? <Empty /> : <div className="table-wrap"><table><thead><tr><th>Medicine</th><th>Category</th><th>Qty</th><th>Price</th><th>Expiry</th><th>Status</th></tr></thead><tbody>
        {rows.map(item => {
          const vals = cellValues(item);
          return <tr key={item._id}>
            {vals.map((v, i) => (
              <td key={i}>
                {i === vals.length - 1 ? (
                  <span className={`badge ${v === 'low-stock' ? 'pending' : 'active'}`}>
                    {v.replaceAll('-', ' ')}
                  </span>
                ) : (
                  v
                )}
              </td>
            ))}
          </tr>;
        })}
      </tbody></table></div>}
      <Pagination meta={meta} onPageChange={setPage} />
    </Panel>
  </>;
}

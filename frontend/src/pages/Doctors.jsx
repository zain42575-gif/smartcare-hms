import { useState } from 'react';
import { Search } from 'lucide-react';
import { Empty, Panel, StatusBadge } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';

export default function Doctors() {
  const [search, setSearch] = useState('');
  const { data, loading, error } = useFetch(search ? `/doctors?search=${encodeURIComponent(search)}` : '/doctors', []);
  const rows = Array.isArray(data) ? data : [];
  const cellValues = (item) => [item.user?.name, item.department, item.specialization, `Rs. ${item.consultationFee}`];
  return <Panel title="Doctors" actions={<div className="searchbox"><Search size={16}/><input placeholder="Search name, dept..." value={search} onChange={e => setSearch(e.target.value)} /></div>}>
    {error && <div className="alert">{error}</div>}
    {loading ? <div className="empty">Loading...</div> : rows.length === 0 ? <Empty /> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Department</th><th>Specialization</th><th>Fee</th></tr></thead><tbody>
      {rows.map(item => <tr key={item._id}>{cellValues(item).map((v, i) => <td key={i}>{i === cellValues(item).length - 1 && ['active','inactive','pending','confirmed','completed','cancelled','no-show','paid','unpaid','partially-paid'].includes(String(v)) ? <StatusBadge value={v} /> : v}</td>)}</tr>)}
    </tbody></table></div>}
  </Panel>;
}

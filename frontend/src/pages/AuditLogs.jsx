import { useState } from 'react';
import { Search } from 'lucide-react';
import { Empty, Panel, StatusBadge } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const { data, loading, error } = useFetch(search ? `/audit-logs?search=${encodeURIComponent(search)}` : '/audit-logs', []);
  const rows = Array.isArray(data) ? data : [];
  const cellValues = (item) => [item.user?.name || '-', item.action, item.module, new Date(item.createdAt).toLocaleString()];
  return <Panel title="Audit Logs" actions={<div className="searchbox"><Search size={16}/><input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} /></div>}>
    {error && <div className="alert">{error}</div>}
    {loading ? <div className="empty">Loading...</div> : rows.length === 0 ? <Empty /> : <div className="table-wrap"><table><thead><tr><th>User</th><th>Action</th><th>Module</th><th>Time</th></tr></thead><tbody>
      {rows.map(item => <tr key={item._id}>{cellValues(item).map((v, i) => <td key={i}>{i === cellValues(item).length - 1 && ['active','inactive','pending','confirmed','completed','cancelled','no-show','paid','unpaid','partially-paid'].includes(String(v)) ? <StatusBadge value={v} /> : v}</td>)}</tr>)}
    </tbody></table></div>}
  </Panel>;
}

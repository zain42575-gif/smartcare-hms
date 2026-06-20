import { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { Empty, Panel, StatusBadge } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';
import api from '../api/client.js';

export default function Users() {
  const { data, loading, error, refetch } = useFetch('/users', []);
  const rows = Array.isArray(data) ? data : [];
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const filteredRows = rows.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const approve = async (id) => { setMsg(''); setErr(''); try { await api.patch(`/users/${id}/approve-doctor`, {}); setMsg('Doctor approved successfully.'); refetch?.(); } catch (error) { setErr(error.response?.data?.message || 'Approval failed'); } };
  return <Panel title="System Users & Doctor Approvals" actions={<div className="searchbox"><Search size={16}/><input placeholder="Search users" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>}>
    {msg && <div className="success-alert">{msg}</div>}{err && <div className="alert">{err}</div>}{error && <div className="alert">{error}</div>}
    {loading ? <div className="empty">Loading...</div> : rows.length === 0 ? <Empty /> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Doctor Request</th><th>Action</th></tr></thead><tbody>
      {filteredRows.map(item => <tr key={item._id}><td>{item.name}</td><td>{item.email}</td><td>{item.role}</td><td><StatusBadge value={item.status} /></td><td>{item.pendingDoctorProfile ? `${item.pendingDoctorProfile.specialization} / ${item.pendingDoctorProfile.department}` : '-'}</td><td>{item.role === 'doctor' && item.status === 'pending' ? <button className="ghost" onClick={()=>approve(item._id)}><ShieldCheck size={16}/> Approve</button> : '-'}</td></tr>)}
    </tbody></table></div>}
  </Panel>;
}

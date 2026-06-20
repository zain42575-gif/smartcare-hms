export function Card({ title, value, icon, tone }) {
  return <div className={`card ${tone || ''}`}><div className="card-head"><span>{title}</span>{icon}</div><strong>{value}</strong></div>;
}
export function Panel({ title, children, actions }) {
  return <div className="panel"><div className="panel-head"><h3>{title}</h3>{actions}</div>{children}</div>;
}
export function StatusBadge({ value }) {
  return <span className={`badge ${String(value).replaceAll(' ','-')}`}>{value}</span>;
}
export function Empty({ text='No data found' }) { return <div className="empty">{text}</div>; }
export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
      <span style={{ fontSize: '13px', color: '#475569' }}>Showing page {meta.page} of {meta.pages} ({meta.total} records)</span>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="ghost" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)} style={{ padding: '6px 12px' }}>Previous</button>
        <button className="ghost" disabled={meta.page >= meta.pages} onClick={() => onPageChange(meta.page + 1)} style={{ padding: '6px 12px' }}>Next</button>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="table-wrap skeleton-pulse">
      <table style={{ opacity: 0.6 }}>
        <thead><tr><th>Loading...</th><th></th><th></th><th></th></tr></thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td><div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '60%' }}></div></td>
              <td><div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '80%' }}></div></td>
              <td><div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '40%' }}></div></td>
              <td><div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '100%' }}></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card skeleton-pulse" style={{ height: '110px' }}>
      <div className="card-head">
        <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '50%' }}></div>
        <div style={{ height: '24px', width: '24px', background: '#e2e8f0', borderRadius: '50%' }}></div>
      </div>
      <div style={{ height: '28px', background: '#e2e8f0', borderRadius: '4px', width: '30%', marginTop: '16px' }}></div>
    </div>
  );
}

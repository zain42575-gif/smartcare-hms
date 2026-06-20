import { useState } from 'react';
import { Mail, CheckCircle, Circle, Trash2, Calendar, User } from 'lucide-react';
import { Empty, Panel } from '../components/UI.jsx';
import useFetch from '../hooks/useFetch.js';
import api from '../api/client.js';

export default function ContactMessages() {
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const url = `/contact${filter !== 'all' ? `?read=${filter === 'read'}` : ''}`;
  const { data, loading, error, refetch } = useFetch(url, []);
  
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const toggleReadStatus = async (id, currentStatus) => {
    setMsg('');
    setErr('');
    try {
      await api.patch(`/contact/${id}/read`, { read: !currentStatus });
      setMsg(`Message marked as ${!currentStatus ? 'read' : 'unread'}.`);
      refetch();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to update message status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    setMsg('');
    setErr('');
    try {
      await api.delete(`/contact/${id}`);
      setMsg('Message deleted successfully.');
      refetch();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const messages = Array.isArray(data) ? data : [];

  return (
    <Panel 
      title="Contact Form Messages" 
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={filter === 'all' ? 'primary' : 'ghost'} 
            onClick={() => setFilter('all')}
            style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '8px', width: 'auto', height: 'auto' }}
          >
            All
          </button>
          <button 
            className={filter === 'unread' ? 'primary' : 'ghost'} 
            onClick={() => setFilter('unread')}
            style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '8px', width: 'auto', height: 'auto' }}
          >
            Unread
          </button>
          <button 
            className={filter === 'read' ? 'primary' : 'ghost'} 
            onClick={() => setFilter('read')}
            style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '8px', width: 'auto', height: 'auto' }}
          >
            Read
          </button>
        </div>
      }
    >
      {msg && <div className="success-alert" style={{ marginBottom: '16px' }}>{msg}</div>}
      {err && <div className="alert" style={{ marginBottom: '16px' }}>{err}</div>}
      {error && <div className="alert" style={{ marginBottom: '16px' }}>{error}</div>}

      {loading ? (
        <div className="empty">Loading messages...</div>
      ) : messages.length === 0 ? (
        <Empty text={`No ${filter !== 'all' ? filter : ''} messages found`} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
          {messages.map((item) => (
            <div 
              key={item._id} 
              style={{
                background: 'white',
                border: item.read ? '1px solid #e2e8f0' : '2px solid #5c527a',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: item.read ? '0 2px 8px rgba(0, 0, 0, 0.02)' : '0 4px 12px rgba(92, 82, 122, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s'
              }}
            >
              {/* Header: Name, Email, Date, Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={16} style={{ color: '#5c527a' }} /> {item.name}
                    </h4>
                    {!item.read && (
                      <span style={{
                        background: '#5c527a',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <a 
                    className="button" 
                    href={`mailto:${item.email}?subject=Reply to your query - Al Hidayat Hospital`} 
                    style={{ textDecoration: 'none', background: '#3b82f6', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}
                  >
                    <Mail size={14} style={{ color: '#5c527a' }} /> {item.email}
                  </a>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px' }}>
                  <Calendar size={14} />
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Message Content */}
              <div style={{ 
                background: '#f8fafc', 
                padding: '16px', 
                borderRadius: '12px', 
                fontSize: '14px', 
                color: '#334155',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                border: '1px solid #f1f5f9'
              }}>
                {item.message}
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
                <button 
                  onClick={() => toggleReadStatus(item._id, item.read)}
                  className="ghost"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '13px', 
                    padding: '8px 14px', 
                    color: item.read ? '#64748b' : '#5c527a',
                    cursor: 'pointer',
                    borderRadius: '8px'
                  }}
                >
                  {item.read ? <Circle size={15} /> : <CheckCircle size={15} />}
                  <span>{item.read ? 'Mark Unread' : 'Mark Read'}</span>
                </button>

                <a
                  href={`mailto:${item.email}?subject=Reply to your query - SmartCare HMS`}
                  className="ghost"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '13px', 
                    padding: '8px 14px', 
                    color: '#16a34a',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    borderRadius: '8px'
                  }}
                >
                  <Mail size={15} />
                  <span>Reply</span>
                </a>

                <button 
                  onClick={() => handleDelete(item._id)}
                  className="ghost"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '13px', 
                    padding: '8px 14px', 
                    color: '#ef4444',
                    cursor: 'pointer',
                    borderRadius: '8px'
                  }}
                >
                  <Trash2 size={15} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

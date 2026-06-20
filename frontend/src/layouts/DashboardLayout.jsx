import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Activity, CalendarDays, FileText, LayoutDashboard, LogOut, Pill, Receipt, Stethoscope, UserCog, Users, ClipboardList, FlaskConical, Bell, Bed, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const nav = [
  ['/dashboard', 'Dashboard', LayoutDashboard, null],
  ['/dashboard/patients', 'Patients', Users, ['admin','doctor','receptionist','accountant']],
  ['/dashboard/doctors', 'Doctors', Stethoscope, ['admin','receptionist','patient']],
  ['/dashboard/appointments', 'Appointments', CalendarDays, ['admin','doctor','receptionist','patient']],
  ['/dashboard/records', 'Medical Records', ClipboardList, ['admin','doctor','patient']],
  ['/dashboard/pharmacy', 'Pharmacy', Pill, ['admin','pharmacist','doctor']],
  ['/dashboard/lab', 'Lab Reports', FlaskConical, ['admin','doctor','receptionist','patient','lab_technician']],
  ['/dashboard/billing', 'Billing', Receipt, ['admin','accountant','receptionist','patient']],
  ['/dashboard/wards', 'Wards & Beds', Bed, ['admin','receptionist']],
  ['/dashboard/users', 'Users', UserCog, ['admin']],
  ['/dashboard/messages', 'Contact Messages', MessageSquare, ['admin']],
  ['/dashboard/audit', 'Audit Logs', FileText, ['admin']],
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 10000);
    
    // Initialize Socket.io connection
    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    
    socket.emit('join_room', user._id);
    socket.emit('join_role_room', user.role);
    
    socket.on('notification', (newNotification) => {
      // Fetch fresh notifications instantly when an event arrives
      fetchNotifications();
      toast(newNotification.title + ': ' + newNotification.message, { icon: '🔔' });
    });
    
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user]);

  const toggleNotifications = async () => {
    setShowNotifications(!showNotifications);
  };

  const markAllAsRead = async (e) => {
    e.stopPropagation();
    const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
    if (unreadIds.length > 0) {
      try {
        await api.patch('/notifications/read', { ids: unreadIds });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment': return <CalendarDays size={16} color="#6366f1" />;
      case 'billing': return <Receipt size={16} color="#10b981" />;
      case 'inventory': return <Pill size={16} color="#f59e0b" />;
      default: return <Activity size={16} color="#8b5cf6" />;
    }
  };

  const links = nav.filter(([, , , roles]) => !roles || roles.includes(user?.role));
  const unreadCount = notifications.filter(n => !n.read).length;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand" style={{ background: '#047857', height: '80px', padding: '0 24px', margin: '0', display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
        <img src="/logo.jpg" alt="Al Hidayat Hospital Logo" style={{ height: '36px', width: 'auto', borderRadius: '4px' }} />
        <div>
          <b style={{ color: 'white', display: 'block', fontSize: '15px' }}>SmartCare HMS</b>
        </div>
      </div>
      
      <div className="sidebar-scroll-area" style={{ padding: '24px 24px' }}>
        {/* User Profile in Sidebar */}
        <NavLink to="/dashboard/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 0 24px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }} className="sidebar-profile-link">
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
            {user?.name?.slice(0,2).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <span style={{ fontWeight: '600', color: 'white', display: 'block', fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
        </NavLink>

        <nav>{links.map(([to,label,Icon]) => <NavLink key={to} to={to} end={to === '/dashboard'}><Icon size={18}/>{label}</NavLink>)}</nav>
      </div>
    </aside>
    <main>
      <header className="topbar">
        {/* Left Side: Empty Space for layout balance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
        </div>

        {/* Center Side: Logo and Title */}
        <div className="topbar-logo-center" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
          <img src="/logo.jpg" alt="Logo" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} />
          <strong className="topbar-logo-text" style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>Al Hidayat Hospital</strong>
        </div>

        {/* Right Side: Notifications */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          <button className="ghost" onClick={toggleNotifications} style={{ position: 'relative', padding: '10px', borderRadius: '12px', color: 'white' }}>
            <Bell size={18} style={{ color: 'white' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="panel" style={{
              position: 'absolute',
              top: '50px',
              right: '0',
              width: '380px',
              maxHeight: '450px',
              zIndex: 100,
              overflowY: 'auto',
              padding: 0,
              marginTop: 0,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              borderRadius: '16px',
              border: '1px solid rgba(226, 232, 240, 0.8)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', padding: '16px 20px', background: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ margin: 0, color: '#0f172a', fontWeight: '700', fontSize: '15px' }}>Notifications</h4>
                  {unreadCount > 0 && <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>{unreadCount} New</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
              
              {notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '50%' }}>
                    <Bell size={24} color="#94a3b8" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>You're all caught up!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {notifications.map(n => (
                    <div key={n._id} style={{
                      padding: '16px 20px',
                      background: n.read ? 'white' : '#f8fafc',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      gap: '12px',
                      transition: 'background 0.2s',
                      cursor: 'default',
                    }}>
                      <div style={{ 
                        marginTop: '2px', 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: n.read ? '#f1f5f9' : '#e0e7ff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {getNotificationIcon(n.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <span style={{ fontWeight: n.read ? '600' : '700', color: n.read ? '#334155' : '#0f172a', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {n.title}
                            {!n.read && <span style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }}></span>}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div style={{ color: n.read ? '#64748b' : '#475569', fontSize: '13px', lineHeight: '1.5' }}>
                          {n.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="ghost" onClick={logout} style={{ padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
            <LogOut size={16} /> <span style={{ color: 'white' }}>Logout</span>
          </button>
        </div>
      </header>
      <section className="content"><Outlet /></section>
    </main>
  </div>;
}

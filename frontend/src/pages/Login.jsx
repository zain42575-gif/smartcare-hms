import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Activity, ArrowLeft, Stethoscope, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const initialPatient = { name:'', email:'', password:'', phone:'', gender:'male', bloodGroup:'unknown', address:'' };
const initialDoctor = { name:'', email:'', password:'', phone:'', specialization:'', department:'', qualification:'', experienceYears:1, consultationFee:1500 };
const loginRoles = [
  { value:'admin', label:'Admin', email:'admin@alhidayathospital.com' },
  { value:'doctor', label:'Doctor', email:'hidayat@alhidayathospital.com' },
  { value:'receptionist', label:'Receptionist', email:'receptionist@alhidayathospital.com' },
  { value:'pharmacist', label:'Pharmacist', email:'pharmacy@alhidayathospital.com' },
  { value:'accountant', label:'Accountant', email:'accountant@alhidayathospital.com' },
  { value:'patient', label:'Patient', email:'patient@alhidayathospital.com' },
];

export default function Login({ portal }) {
  const { user, login, verify2fa, registerPatient, registerDoctor, googleLogin } = useAuth();
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(portal || 'patient');
  const [patient, setPatient] = useState(initialPatient);
  const [doctor, setDoctor] = useState(initialDoctor);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState(null);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Update role when portal changes
  useEffect(() => {
    if (portal) {
      setRole(portal);
      setEmail('');
      setPassword('');
      setError('');
      setMessage('');
      setView('login');
    }
  }, [portal]);

  // Initialize view from URL search query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'register' && portal === 'patient') {
      setView('patient');
    } else if (mode === 'doctor' && portal === 'doctor') {
      setView('doctor');
    }
  }, [portal]);

  useEffect(() => {
    if (view !== 'login' || !googleClientId || portal !== 'patient') return;
    let cancelled = false;
    window.handleGooglePatientLogin = async (response) => {
      setError('');
      setMessage('');
      try {
        await googleLogin(response.credential);
      } catch (err) {
        fail(err);
      }
    };
    const renderGoogleButton = () => {
      if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: window.handleGooglePatientLogin });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: googleButtonRef.current.offsetWidth || 360,
      });
    };
    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => { cancelled = true; };
    }
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', renderGoogleButton, { once: true });
      return () => { cancelled = true; existingScript.removeEventListener('load', renderGoogleButton); };
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
    return () => { cancelled = true; script.onload = null; };
  }, [view, googleClientId, googleLogin, portal]);

  if (user) return <Navigate to="/dashboard" replace />;

  const fail = (err) => setError(err.response?.data?.message || 'Request failed');

  const submitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await login(email, password, role);
      if (res && res.requires2fa) {
        setPendingUserId(res.userId);
        setView('2fa');
      }
    } catch (err) {
      fail(err);
    }
  };

  const submit2fa = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await useAuth().verify2fa(pendingUserId, twoFactorCode); // actually just destructure verify2fa from useAuth hook above
      // Wait, we can't call useAuth() directly here like this easily if it's not in scope, but we destructured it at top!
    } catch (err) {
      fail(err);
    }
  };

  const submitPatient = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await registerPatient(patient);
    } catch (err) {
      fail(err);
    }
  };

  const submitDoctor = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await registerDoctor(doctor);
      setMessage('Doctor application submitted. Admin will approve it from Users page.');
      setDoctor(initialDoctor);
    } catch (err) {
      fail(err);
    }
  };



  const update = (setter) => (e) => setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const openView = (nextView) => { setView(nextView); setError(''); setMessage(''); };


  const portalName = portal ? portal.charAt(0).toUpperCase() + portal.slice(1) : '';

  return (
    <div className="login-page">
      <div className="login-card wide">
        <button type="button" className="back-link" onClick={() => window.location.href = '/'} style={{ marginBottom: '14px', border: 0, background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#64748b' }}>
          <ArrowLeft size={15} /> Back to Homepage
        </button>
        <div className="login-logo">
          <img src="/logo.jpg" alt="Al Hidayat Hospital Logo" style={{ height: '64px', width: 'auto', marginBottom: '8px', borderRadius: '8px' }} />
          <h1>Al Hidayat Hospital</h1>
          <p>{portalName} Portal</p>
        </div>

        {error && <div className="alert">{error}</div>}
        {message && <div className="success-alert">{message}</div>}

        {view === 'login' && (
          <form onSubmit={submitLogin}>
            <label>
              Email Address
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={`Enter ${portalName.toLowerCase()} email`}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </label>
            
            <button className="primary" style={{ marginTop: '10px' }}>Login as {portalName}</button>
            
            {portal === 'patient' && googleClientId && (
              <div className="google-signin" ref={googleButtonRef} />
            )}

            {portal === 'patient' && (
              <div className="login-actions" style={{ marginTop: '20px' }}>
                <span>Are you a patient?</span>
                <button type="button" onClick={() => openView('patient')}>
                  <UserPlus size={15} /> Create Patient Account
                </button>
              </div>
            )}

            {portal === 'doctor' && (
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button type="button" className="link-btn" onClick={() => openView('doctor')}>
                  <Stethoscope size={15} /> Apply as Doctor
                </button>
              </div>
            )}

          </form>
        )}

        {view === '2fa' && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await verify2fa(pendingUserId, twoFactorCode); // use destructured
            } catch (err) {
              fail(err);
            }
          }}>
            <button type="button" className="back-link span-2" onClick={() => openView('login')}>
              <ArrowLeft size={15} /> Back to Login
            </button>
            <p style={{marginBottom: '15px'}}>Please enter the 6-digit code from your authenticator app.</p>
            <label>
              Authenticator Code
              <input
                type="text"
                value={twoFactorCode}
                onChange={e => setTwoFactorCode(e.target.value)}
                placeholder="123456"
                required
                maxLength="6"
                autoComplete="one-time-code"
              />
            </label>
            <button className="primary" style={{ marginTop: '10px' }}>Verify</button>
          </form>
        )}

        {view === 'patient' && portal === 'patient' && (
          <form onSubmit={submitPatient} className="form-grid">
            <button type="button" className="back-link span-2" onClick={() => openView('login')}>
              <ArrowLeft size={15} /> Back to Login
            </button>
            <label>
              Name
              <input name="name" value={patient.name} onChange={update(setPatient)} required />
            </label>
            <label>
              Email
              <input name="email" value={patient.email} onChange={update(setPatient)} required />
            </label>
            <label>
              Password
              <input name="password" type="password" value={patient.password} onChange={update(setPatient)} required />
            </label>
            <label>
              Phone
              <input name="phone" value={patient.phone} onChange={update(setPatient)} required />
            </label>
            <label>
              Gender
              <select name="gender" value={patient.gender} onChange={update(setPatient)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Blood Group
              <select name="bloodGroup" value={patient.bloodGroup} onChange={update(setPatient)}>
                {['unknown','A+','A-','B+','B-','AB+','AB-','O+','O-'].map(x => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="span-2">
              Address
              <input name="address" value={patient.address} onChange={update(setPatient)} />
            </label>
            <button className="primary span-2">Create Patient Account</button>
          </form>
        )}

        {view === 'doctor' && portal === 'doctor' && (
          <form onSubmit={submitDoctor} className="form-grid">
            <button type="button" className="back-link span-2" onClick={() => openView('login')}>
              <ArrowLeft size={15} /> Back to Login
            </button>
            <label>
              Name
              <input name="name" value={doctor.name} onChange={update(setDoctor)} required />
            </label>
            <label>
              Email
              <input name="email" value={doctor.email} onChange={update(setDoctor)} required />
            </label>
            <label>
              Password
              <input name="password" type="password" value={doctor.password} onChange={update(setDoctor)} required />
            </label>
            <label>
              Phone
              <input name="phone" value={doctor.phone} onChange={update(setDoctor)} required />
            </label>
            <label>
              Specialization
              <input name="specialization" value={doctor.specialization} onChange={update(setDoctor)} required />
            </label>
            <label>
              Department
              <input name="department" value={doctor.department} onChange={update(setDoctor)} required />
            </label>
            <label>
              Qualification
              <input name="qualification" value={doctor.qualification} onChange={update(setDoctor)} />
            </label>
            <label>
              Fee (Rs.)
              <input name="consultationFee" type="number" value={doctor.consultationFee} onChange={update(setDoctor)} required />
            </label>
            <button className="primary span-2">Submit Doctor Application</button>
            <small className="span-2" style={{ textAlign: 'center', color: '#64748b' }}>
              Pending applications require approval from the Administrator.
            </small>
          </form>
        )}
      </div>
    </div>
  );
}

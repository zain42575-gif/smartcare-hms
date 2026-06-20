import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function Profile() {
  const { user } = useAuth();
  
  // 2FA States
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(user?.isTwoFactorEnabled || false);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const generate2fa = async () => {
    try {
      const res = await api.post('/auth/2fa/generate');
      setQrCodeUrl(res.data.data.qrCodeUrl);
      setSecret(res.data.data.secret);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate 2FA');
    }
  };

  const enable2fa = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/2fa/enable', { token });
      setSuccess('2FA has been successfully enabled!');
      setIsTwoFactorEnabled(true);
      setQrCodeUrl('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    
    if (newPassword !== confirmPassword) {
      return setPwdError('New passwords do not match.');
    }
    if (newPassword.length < 6) {
      return setPwdError('Password must be at least 6 characters long.');
    }

    setIsChangingPwd(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      setPwdSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2>My Profile</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginTop: '20px' }}>
        
        {/* Two-Factor Authentication Card */}
        <div className="card" style={{ flex: '1 1 400px', padding: '24px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>Two-Factor Authentication (2FA)</h3>
          {isTwoFactorEnabled ? (
            <div className="success-alert" style={{ marginTop: '16px' }}>
              2FA is active on your account.
            </div>
          ) : (
            <div style={{ marginTop: '16px' }}>
              <p style={{marginBottom: '10px'}}>Enhance your account security by enabling Two-Factor Authentication.</p>
              {!qrCodeUrl ? (
                <button className="primary" onClick={generate2fa}>Setup 2FA</button>
              ) : (
                <div>
                  <p>1. Scan this QR code with your authenticator app (e.g. Google Authenticator).</p>
                  <img src={qrCodeUrl} alt="2FA QR Code" style={{ display: 'block', margin: '10px 0' }} />
                  <p>Or enter this secret manually: <strong style={{background: '#f1f5f9', padding: '4px', borderRadius: '4px'}}>{secret}</strong></p>
                  <form onSubmit={enable2fa} style={{ marginTop: '16px' }}>
                    <label>
                      2. Enter the 6-digit code from the app:
                      <input type="text" value={token} onChange={e => setToken(e.target.value)} required maxLength="6" />
                    </label>
                    <button className="primary" style={{ marginTop: '10px' }}>Enable 2FA</button>
                  </form>
                </div>
              )}
              {error && <div className="alert" style={{ marginTop: '16px' }}>{error}</div>}
              {success && <div className="success-alert" style={{ marginTop: '16px' }}>{success}</div>}
            </div>
          )}
        </div>

        {/* Change Password Card */}
        <div className="card" style={{ flex: '1 1 400px', padding: '24px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>Change Password</h3>
          <form onSubmit={changePassword} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label>
              Current Password
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="Enter current password" />
            </label>
            <label>
              New Password
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Enter new password" />
            </label>
            <label>
              Confirm New Password
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm new password" />
            </label>
            
            {pwdError && <div className="alert" style={{ margin: 0 }}>{pwdError}</div>}
            {pwdSuccess && <div className="success-alert" style={{ margin: 0 }}>{pwdSuccess}</div>}
            
            <button className="primary" type="submit" disabled={isChangingPwd} style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
              {isChangingPwd ? 'Changing...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

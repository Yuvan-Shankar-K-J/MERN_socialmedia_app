import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  updateProfile, 
  changePassword, 
  toggleTwoFactor, 
  getLoginHistory, 
  getLinkedAccounts, 
  linkAccount, 
  unlinkAccount 
} from '../services/api';

const Settings = () => {
  const { user, setUser, setToken, token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Form states
  const [accountForm, setAccountForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load initial data
  useEffect(() => {
    if (token) {
      loadSettingsData();
    }
  }, [token]);

  const loadSettingsData = async () => {
    try {
      const [historyRes, accountsRes] = await Promise.all([
        getLoginHistory(token),
        getLinkedAccounts(token)
      ]);
      setLoginHistory(historyRes.data);
      setLinkedAccounts(accountsRes.data);
    } catch (err) {
      console.error('Error loading settings data:', err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const showMessage = (message, isError = false) => {
    if (isError) {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 5000);
    } else {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateProfile(accountForm, token);
      setUser(res.data);
      showMessage('Account settings updated successfully!');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to update account settings', true);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('New passwords do not match', true);
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showMessage('Password must be at least 8 characters long', true);
      return;
    }
    
    setLoading(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, token);
      showMessage('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to change password', true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    setLoading(true);
    try {
      const res = await toggleTwoFactor(!twoFactorEnabled, token);
      setTwoFactorEnabled(res.data.twoFactorEnabled);
      showMessage(res.data.message);
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to toggle two-factor authentication', true);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (provider) => {
    setLoading(true);
    try {
      const res = await linkAccount(provider, token);
      showMessage(res.data.message);
      // Refresh linked accounts
      const accountsRes = await getLinkedAccounts(token);
      setLinkedAccounts(accountsRes.data);
    } catch (err) {
      showMessage(err.response?.data?.message || `Failed to link ${provider} account`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkAccount = async (provider) => {
    setLoading(true);
    try {
      const res = await unlinkAccount(provider, token);
      showMessage(res.data.message);
      // Refresh linked accounts
      const accountsRes = await getLinkedAccounts(token);
      setLinkedAccounts(accountsRes.data);
    } catch (err) {
      showMessage(err.response?.data?.message || `Failed to unlink ${provider} account`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100%',
      width: '100%',
      background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9f9 100%)',
      overflow: 'auto',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 24,
        boxShadow: '0 8px 32px 0 rgba(80, 120, 200, 0.12)',
        border: '1.5px solid #e0e7ef',
        overflow: 'hidden',
        minHeight: 'fit-content',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
          padding: '32px',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: 1, color: '#222' }}>Settings</h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: 16, color: '#222' }}>Manage your account preferences and security</p>
        </div>

        <div style={{ padding: '32px' }}>
          {/* Success/Error Messages */}
          {successMessage && (
            <div style={{
              background: '#d4edda',
              color: '#155724',
              padding: '12px',
              borderRadius: 8,
              marginBottom: 20,
              border: '1px solid #c3e6cb',
            }}>
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: 8,
              marginBottom: 20,
              border: '1px solid #f5c6cb',
            }}>
              {errorMessage}
            </div>
          )}

          {/* Account Settings Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#222', marginBottom: 20, fontSize: 20, fontWeight: 700 }}>Account Settings</h2>
            <div style={{
              background: '#f8f9fa',
              borderRadius: 12,
              padding: '24px',
              border: '1px solid #e0e7ef',
            }}>
              <form onSubmit={handleAccountUpdate}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#222', marginBottom: 8 }}>Username</label>
                  <input
                    type="text"
                    value={accountForm.username}
                    onChange={(e) => setAccountForm({...accountForm, username: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1.5px solid #e0e7ef',
                      borderRadius: 8,
                      fontSize: 16,
                      boxSizing: 'border-box',
                      background: '#fff',
                      color: '#222',
                    }}
                    placeholder="Enter new username"
                    disabled={loading}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#222', marginBottom: 8 }}>Email</label>
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1.5px solid #e0e7ef',
                      borderRadius: 8,
                      fontSize: 16,
                      boxSizing: 'border-box',
                      background: '#fff',
                      color: '#222',
                    }}
                    placeholder="Enter new email"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#ccc' : 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 24px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                  }}
                >
                  {loading ? 'Updating...' : 'Update Account'}
                </button>
              </form>
            </div>
          </div>

          {/* Security Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#222', marginBottom: 20, fontSize: 20, fontWeight: 700 }}>Security</h2>
            
            {/* Change Password */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: 12,
              padding: '24px',
              border: '1px solid #e0e7ef',
              marginBottom: 16,
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>Change Password</h3>
              <form onSubmit={handlePasswordChange}>
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1.5px solid #e0e7ef',
                      borderRadius: 8,
                      fontSize: 16,
                      boxSizing: 'border-box',
                      background: '#fff',
                      color: '#222',
                    }}
                    disabled={loading}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="password"
                    placeholder="New Password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1.5px solid #e0e7ef',
                      borderRadius: 8,
                      fontSize: 16,
                      boxSizing: 'border-box',
                      background: '#fff',
                      color: '#222',
                    }}
                    disabled={loading}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1.5px solid #e0e7ef',
                      borderRadius: 8,
                      fontSize: 16,
                      boxSizing: 'border-box',
                      background: '#fff',
                      color: '#222',
                    }}
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#ccc' : 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 24px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                  }}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Two-Factor Authentication */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: 12,
              padding: '24px',
              border: '1px solid #e0e7ef',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600 }}>Two-Factor Authentication</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Add an extra layer of security to your account</p>
                </div>
                <button
                  onClick={handleToggleTwoFactor}
                  disabled={loading}
                  style={{
                    background: loading ? '#ccc' : (twoFactorEnabled ? '#dc3545' : 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)'),
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                  }}
                >
                  {loading ? 'Updating...' : (twoFactorEnabled ? 'Disable' : 'Enable')}
                </button>
              </div>
            </div>

            {/* Login History */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: 12,
              padding: '24px',
              border: '1px solid #e0e7ef',
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>Login History</h3>
              <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                {loginHistory.map((login, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    borderBottom: index < loginHistory.length - 1 ? '1px solid #e0e7ef' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{login.device}</div>
                      <div style={{ color: '#666', fontSize: 12 }}>{login.location}</div>
                    </div>
                    <div style={{ color: '#888', fontSize: 12 }}>
                      {new Date(login.date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Linked Accounts Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#222', marginBottom: 20, fontSize: 20, fontWeight: 700 }}>Linked Accounts</h2>
            <div style={{
              background: '#f8f9fa',
              borderRadius: 12,
              padding: '24px',
              border: '1px solid #e0e7ef',
            }}>
              {linkedAccounts.map((account, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: index < linkedAccounts.length - 1 ? '1px solid #e0e7ef' : 'none',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{account.provider}</div>
                    {account.connected && (
                      <div style={{ color: '#666', fontSize: 14 }}>{account.email}</div>
                    )}
                  </div>
                  <button
                    onClick={() => account.connected ? handleUnlinkAccount(account.provider) : handleLinkAccount(account.provider)}
                    disabled={loading}
                    style={{
                      background: loading ? '#ccc' : (account.connected ? '#dc3545' : 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)'),
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                    }}
                  >
                    {loading ? 'Processing...' : (account.connected ? 'Unlink' : 'Link')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Logout Section */}
          <div style={{
            background: '#fff3cd',
            borderRadius: 12,
            padding: '24px',
            border: '1px solid #ffeaa7',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#856404' }}>Danger Zone</h3>
            <p style={{ margin: '0 0 16px 0', color: '#856404', fontSize: 14 }}>
              Sign out of your account. You can sign back in at any time.
            </p>
            <button
              onClick={handleLogout}
              disabled={loading}
              style={{
                background: loading ? '#ccc' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 16,
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 
import React, { useEffect, useState } from 'react';
import { userService, UserProfile } from '../services/userService';
import { User, Key } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Edit State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    userService
      .getProfile()
      .then((data) => {
        setProfile(data);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setPhone(data.phone || '');
      })
      .catch((err) => console.error('Failed to load profile', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      const updated = await userService.updateProfile({
        firstName,
        lastName,
        phone: phone || undefined,
      });
      setProfile(updated);
      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setProfileMessage({ text: err?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      await userService.changePassword({ currentPassword, newPassword });
      setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ text: err?.message || 'Failed to change password.', type: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading profile...</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '1rem auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Account & Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal details and security credentials</p>
      </div>

      <div className="grid-2">
        {/* Personal Details */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--primary)" /> Personal Details
            </h3>
            <span className="badge badge-active">{profile?.status}</span>
          </div>

          {profileMessage && (
            <div className={`alert ${profileMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">Email (Immutable)</label>
              <input type="email" disabled value={profile?.email || ''} className="form-control" style={{ background: '#f1f5f9' }} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Roles</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {profile?.roles.map((r) => (
                  <span key={r} className="badge badge-pending">{r}</span>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isUpdatingProfile} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {isUpdatingProfile ? 'Saving...' : 'Update Details'}
            </button>
          </form>
        </div>

        {/* Security / Password */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={18} color="var(--accent)" /> Change Password
            </h3>
          </div>

          {passwordMessage && (
            <div className={`alert ${passwordMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-control"
              />
            </div>

            <button type="submit" disabled={isChangingPassword} className="btn btn-outline" style={{ width: '100%', marginTop: '1.5rem' }}>
              {isChangingPassword ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

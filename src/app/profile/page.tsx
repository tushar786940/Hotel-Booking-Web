'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiCalendar, FiLock, FiSave } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/profile');
      return;
    }
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user, isAuthenticated, authLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await authApi.updateProfile({ name, phone: phone || undefined });
      const updatedUser = response.data.data || response.data;
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        <h1 className="section-title mb-8">My Profile</h1>

        {/* Avatar + Info */}
        <div className="bg-white rounded-2xl border border-secondary-100 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-secondary-900">{user.name}</h2>
              <p className="text-sm text-secondary-500">{user.email}</p>
              <p className="text-xs text-secondary-400 mt-1">
                <FiCalendar className="inline mr-1" />
                Member since {formatDate(user.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-white rounded-2xl border border-secondary-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Edit Profile</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400" />
                <input
                  type="email"
                  value={user.email}
                  className="input-field pl-10 bg-secondary-100 cursor-not-allowed"
                  disabled
                />
              </div>
              <p className="text-xs text-secondary-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <Button type="submit" isLoading={isSaving} leftIcon={<FiSave />}>
              Save Changes
            </Button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-secondary-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">Change Password</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              {showPasswordForm ? 'Cancel' : 'Change'}
            </Button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="input-field pl-10"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" isLoading={isChangingPassword} leftIcon={<FiLock />}>
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
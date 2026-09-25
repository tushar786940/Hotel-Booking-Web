'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiCalendar, FiSave, FiBell } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, roles, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      // PUT /profile only accepts `name` and `phone`
      // (AuthController@updateProfile).
      const response = await authApi.updateProfile({ name, phone: phone || null });
      const updatedUser = response.data?.data ?? response.data;
      updateUser({ ...user!, ...updatedUser });
      toast.success('Profile updated successfully');
    } catch {
      // Error handled by interceptor
    } finally {
      setIsSaving(false);
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
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-secondary-900">{user.name}</h2>
                {roles.map((role) => (
                  <span
                    key={role}
                    className="text-[10px] bg-primary-100 text-primary-700 font-bold px-1.5 py-0.5 rounded uppercase"
                  >
                    {role.replace('-', ' ')}
                  </span>
                ))}
              </div>
              <p className="text-sm text-secondary-500">{user.email}</p>
              <div className="flex flex-wrap gap-3 mt-1">
                {user.created_at && (
                  <p className="text-xs text-secondary-400">
                    <FiCalendar className="inline mr-1" />
                    Member since {formatDate(user.created_at)}
                  </p>
                )}
                {typeof user.notifications === 'number' && user.notifications > 0 && (
                  <p className="text-xs text-primary-600">
                    <FiBell className="inline mr-1" />
                    {user.notifications} unread notification
                    {user.notifications === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-white rounded-2xl border border-secondary-100 p-6">
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
                  maxLength={255}
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
                  maxLength={20}
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
      </div>
    </div>
  );
}

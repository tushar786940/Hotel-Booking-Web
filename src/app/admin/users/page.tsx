'use client';

import React from 'react';
import { API_ORIGIN } from '@/lib/config';

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 mb-2">Users</h1>
      <p className="text-secondary-500 mb-6">Manage registered users</p>

      <div className="bg-white rounded-2xl border border-secondary-100 p-8 text-center">
        <p className="text-secondary-500 mb-4">
          User management is available through the Filament Admin Panel.
        </p>
        <a
          href={`${API_ORIGIN}/admin`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          Open Filament Admin →
        </a>
      </div>
    </div>
  );
}
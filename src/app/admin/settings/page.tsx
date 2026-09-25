'use client';

import React from 'react';
import { API_BASE_URL, API_ORIGIN, STORAGE_BASE_URL } from '@/lib/config';

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 mb-2">Settings</h1>
      <p className="text-secondary-500 mb-6">Application configuration</p>

      <div className="bg-white rounded-2xl border border-secondary-100 p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-secondary-900 mb-2">General</h3>
          <p className="text-sm text-secondary-500">
            General application settings are managed in your Laravel <code className="bg-secondary-100 px-1.5 py-0.5 rounded text-xs">.env</code> file and Filament admin panel.
          </p>
        </div>

        <hr className="border-secondary-100" />

        <div>
          <h3 className="font-semibold text-secondary-900 mb-2">API Configuration</h3>
          <div className="bg-secondary-50 rounded-xl p-4 text-sm font-mono text-secondary-600">
            <p>NEXT_PUBLIC_API_URL={process.env.NEXT_PUBLIC_API_URL || '(not set)'}</p>
            <p>Resolved API base: {API_BASE_URL}</p>
            <p>Resolved storage: {STORAGE_BASE_URL}</p>
          </div>
        </div>

        <hr className="border-secondary-100" />

        <div>
          <h3 className="font-semibold text-secondary-900 mb-2">Backend Admin</h3>
          <a
            href={`${API_ORIGIN}/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Open Filament Admin Panel →
          </a>
        </div>
      </div>
    </div>
  );
}
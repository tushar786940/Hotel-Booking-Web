'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function LoginForm() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(email, password);
      router.push(redirectTo);
    } catch {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <HiOutlineBuildingOffice2 className="text-white text-xl" />
            </div>
            <span className="text-2xl font-bold text-gradient">StayHub</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-secondary-100 p-8">
          <h1 className="text-2xl font-bold text-secondary-900 text-center mb-2">Welcome Back</h1>
          <p className="text-secondary-500 text-center mb-6">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`input-field pl-10 ${errors.email ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-danger-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger-500 mt-1">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <p className="text-sm text-center text-secondary-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <LoginForm />
    </Suspense>
  );
}
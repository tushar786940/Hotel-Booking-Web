'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({
  size = 'md',
  className,
  fullScreen = false,
  message,
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const spinner = (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-secondary-200 border-t-primary-600',
          sizes[size]
        )}
      />
      {message && (
        <p className="text-sm text-secondary-500 animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        {spinner}
      </div>
    );
  }

  return spinner;
}
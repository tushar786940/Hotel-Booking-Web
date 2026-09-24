'use client';

import React from 'react';
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export default function Badge({ status, size = 'md', showDot = true, className }: BadgeProps) {
  const colors = getStatusColor(status);
  const label = getStatusLabel(status);

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        colors.bg,
        colors.text,
        sizes[size],
        className
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
      )}
      {label}
    </span>
  );
}
'use client';

import React, { useState } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const displayRating = hoverRating || rating;

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const filled = displayRating >= starValue;
    const halfFilled = !filled && displayRating >= starValue - 0.5;

    const starProps = interactive
      ? {
          onClick: () => onChange?.(starValue),
          onMouseEnter: () => setHoverRating(starValue),
          onMouseLeave: () => setHoverRating(0),
          className: cn('cursor-pointer transition-colors duration-150', sizes[size]),
        }
      : {
          className: cn(sizes[size]),
        };

    if (filled) {
      return <FaStar key={index} {...starProps} className={cn(starProps.className, 'text-amber-400')} />;
    }
    if (halfFilled) {
      return <FaStarHalfAlt key={index} {...starProps} className={cn(starProps.className, 'text-amber-400')} />;
    }
    return <FaRegStar key={index} {...starProps} className={cn(starProps.className, 'text-amber-400')} />;
  };

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }, (_, i) => renderStar(i))}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium text-secondary-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
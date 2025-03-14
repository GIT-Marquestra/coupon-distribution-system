// File: components/CouponClaimStatus.tsx
'use client';

import { useEffect, useState } from 'react';

interface CouponClaimStatusProps {
  timeRemaining: number;
}

export const CouponClaimStatus = ({ timeRemaining }: CouponClaimStatusProps) => {
  const [progress, setProgress] = useState(100);
  const [initialTime] = useState(timeRemaining);
  
  useEffect(() => {
    const percentage = (timeRemaining / initialTime) * 100;
    setProgress(percentage);
  }, [timeRemaining, initialTime]);
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Cooldown Period</span>
        <span className="text-sm font-medium text-indigo-600">{formatTime(timeRemaining)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        You can claim another coupon when the cooldown period ends.
      </p>
    </div>
  );
};
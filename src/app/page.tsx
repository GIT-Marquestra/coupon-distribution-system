// File: app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { CouponCard } from '@/components/CouponCard';
import { CouponClaimStatus } from '@/components/CouponClaimStatus';
import axios from 'axios';
import CouponForm from '@/components/Input';
import toast from 'react-hot-toast';

export default function Home() {
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [recentClaims, setRecentClaims] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has any time restrictions
    const checkClaimStatus = async () => {
      try {
        const response = await axios.get('/api/claim-status');
        const { data } = response;
        
        if (data.timeRemaining) {
          setTimeRemaining(data.timeRemaining);
          
          // Set interval to update remaining time
          const interval = setInterval(() => {
            setTimeRemaining(prevTime => {
              if (prevTime === null || prevTime <= 1) {
                clearInterval(interval);
                return null;
              }
              return prevTime - 1;
            });
          }, 1000);
          
          return () => clearInterval(interval);
        }
        
        if (data.recentClaims) {
          setRecentClaims(data.recentClaims);
        }
      } catch (error) {
        console.error('Error checking claim status:', error);
      }
    };
    
    checkClaimStatus();
  }, []);

  const claimCoupon = async () => {
    if (timeRemaining !== null) {
      setError(`Please wait ${formatTime(timeRemaining)} before claiming another coupon.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/claim-coupon');
      
      const { data } = response;
      
      if (response.status === 200 && data.success) {
        setCouponCode(data.couponCode);
        setTimeRemaining(data.cooldownPeriod);
        setRecentClaims([...(recentClaims || []), data.couponCode]);
        
        // Set interval to update remaining time
        const interval = setInterval(() => {
          setTimeRemaining(prevTime => {
            if (prevTime === null || prevTime <= 1) {
              clearInterval(interval);
              return null;
            }
            return prevTime - 1;
          });
        }, 1000);
      } else {
        setError(data.message || "Something went wrong");

        toast.error(data.message || "Something went wrong");
        
        if (data.timeRemaining) {
          setTimeRemaining(data.timeRemaining);
        }
      }
    } catch (error) {
      console.error('Error claiming coupon:', error);
      toast.error('Some error occurred');
      setError("Please try again later");
    } finally {
      setLoading(false);
    }
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <CouponForm/>
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-indigo-800 mb-4">Exclusive Coupon Offers</h1>
          <p className="text-lg text-gray-600">
            Claim your limited-time discount coupon below and save on your next purchase!
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Claim Your Coupon</h2>
            <p className="text-gray-600 mt-2">
              One coupon per user. You can claim another after the cooldown period.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {couponCode ? (
            <CouponCard code={couponCode} />
          ) : (
            <div className="flex justify-center">
              <button
                onClick={claimCoupon}
                disabled={loading || timeRemaining !== null}
                className={`px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all
                  ${timeRemaining !== null 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : timeRemaining !== null ? (
                  `Wait ${formatTime(timeRemaining)} to claim again`
                ) : (
                  'Claim Your Coupon'
                )}
              </button>
            </div>
          )}
          
          {timeRemaining !== null && (
            <CouponClaimStatus timeRemaining={timeRemaining} />
          )}
        </div>
        
        {recentClaims && recentClaims.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Recent Claims</h3>
            <div className="flex flex-wrap gap-3">
              {recentClaims.map((code, index) => (
                <div key={index} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-mono">
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
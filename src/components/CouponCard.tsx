'use client';

import { useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';

interface CouponCardProps {
  code: string;
}

export const CouponCard = ({ code }: CouponCardProps) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="w-full max-w-md bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-1">
        <div className="bg-white rounded-lg p-6">
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-sm mb-1">Your Coupon Code</span>
            <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 mb-3 w-full">
              <code className="text-lg font-mono font-bold text-indigo-700 flex-1 text-center">
                {code}
              </code>
              <button
                onClick={copyToClipboard}
                className="ml-2 p-2 text-gray-600 hover:text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
              >
                {copied ? <CheckIcon size={18} className="text-green-500" /> : <CopyIcon size={18} />}
              </button>
            </div>
            <span className="text-sm text-indigo-600 font-medium">Use at checkout for your discount</span>
          </div>
        </div>
      </div>
    </div>
  );
};
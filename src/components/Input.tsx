'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import toast from 'react-hot-toast';


export default function CouponForm() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/coupons', { code });
      
      const { data } = response;
      
      if (data.success) {
        toast.success(`Coupon "${data.coupon?.code}" was created successfully!`);
        setCode(''); // Reset form after successful submission
      } else {
        toast.error(data.message || "Failed to create coupon");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error('Error submitting coupon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Coupon</CardTitle>
        <CardDescription>
          Enter a unique code to create a new coupon
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Coupon Code
              </label>
              <Input
                id="code"
                placeholder="Enter coupon code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Coupon"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
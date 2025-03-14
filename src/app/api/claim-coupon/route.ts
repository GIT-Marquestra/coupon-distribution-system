import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const COOLDOWN_PERIOD = 3600; // 1 hour in seconds
const COUPON_CODES = [
  'SAVE20TODAY', 'FREESHIP2025', 'SPRING25OFF', 
  'WELCOME10NOW', 'FLASH30DEAL', 'EXCLUSIVE15', 
  'SPECIAL40OFF', 'NEWCUST25', 'LOYALTY20',
  'DISCOUNT50NOW'
];

export async function POST(request: NextRequest) {
  try {
    // Get user IP address
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Get user identifier from cookies or create a new one
    const cookieStore = await cookies();
    let userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      userId = uuidv4();
      // In a real implementation, we'd set the cookie properly here
    }
    
    // Check if user is on cooldown
    const userCooldownKey = `cooldown:${ip}:${userId}`;
    const userCooldown = await kv.get(userCooldownKey);
    
    if (userCooldown) {
      const remainingTime = COOLDOWN_PERIOD - (Math.floor(Date.now() / 1000) - Number(userCooldown));
      
      if (remainingTime > 0) {
        return NextResponse.json({
          success: false,
          message: 'Claim limit reached',
          timeRemaining: remainingTime
        }, { status: 429 });
      }
    }
    
    // Get the next coupon in round-robin fashion
    const currentIndexKey = 'coupon:currentIndex';
    let currentIndex = await kv.get(currentIndexKey) as number || 0;
    
    const couponCode = COUPON_CODES[currentIndex % COUPON_CODES.length];
    
    // Update the index for next claim
    await kv.set(currentIndexKey, (currentIndex + 1) % COUPON_CODES.length);
    
    // Record this claim
    const now = Math.floor(Date.now() / 1000);
    await kv.set(userCooldownKey, now);
    
    // Add to user's claim history
    const userClaimsKey = `claims:${ip}:${userId}`;
    await kv.rpush(userClaimsKey, couponCode);
    
    // Set TTL on the claims list to expire after reasonable time (e.g., 7 days)
    await kv.expire(userClaimsKey, 7 * 24 * 60 * 60);
    
    // Respond with the coupon code
    return NextResponse.json({
      success: true,
      couponCode,
      cooldownPeriod: COOLDOWN_PERIOD
    });
    
  } catch (error) {
    console.error('Error claiming coupon:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing request'
    }, { status: 500 });
  }
}
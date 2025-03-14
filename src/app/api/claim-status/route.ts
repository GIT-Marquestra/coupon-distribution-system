// File: app/api/claim-status/route.ts (continued)
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Configuration
const COOLDOWN_PERIOD = 3600; // 1 hour in seconds

export async function GET(request: NextRequest) {
  try {
    // Get user IP address
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Get user identifier from cookies or return anonymous state
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({
        timeRemaining: null,
        recentClaims: []
      });
    }
    
    // Check if user is on cooldown
    const userCooldownKey = `cooldown:${ip}:${userId}`;
    const userCooldown = await kv.get(userCooldownKey) as number;
    
    let timeRemaining = null;
    if (userCooldown) {
      timeRemaining = COOLDOWN_PERIOD - (Math.floor(Date.now() / 1000) - userCooldown);
      
      // If the cooldown has expired, clear it
      if (timeRemaining <= 0) {
        await kv.del(userCooldownKey);
        timeRemaining = null;
      }
    }
    
    // Get user's claim history
    const userClaimsKey = `claims:${ip}:${userId}`;
    const recentClaims = await kv.lrange(userClaimsKey, 0, 9); // Get up to 10 most recent claims
    
    return NextResponse.json({
      timeRemaining,
      recentClaims: recentClaims || []
    });
    
  } catch (error) {
    console.error('Error checking claim status:', error);
    return NextResponse.json({
      timeRemaining: null,
      recentClaims: [],
      error: 'Error checking claim status'
    }, { status: 500 });
  }
}
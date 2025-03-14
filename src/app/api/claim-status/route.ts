// app/api/claim-status/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get cooldown period from environment or default to 1 hour
const COOLDOWN_PERIOD = parseInt(process.env.COOLDOWN_PERIOD || '3600', 10);

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
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json({
        timeRemaining: null,
        recentClaims: []
      });
    }
    
    // Check if user is on cooldown
    const latestClaim = await prisma.claim.findFirst({
      where: { userId },
      orderBy: { claimedAt: 'desc' }
    });
    
    let timeRemaining = null;
    
    if (latestClaim) {
      const elapsedSeconds = Math.floor((Date.now() - latestClaim.claimedAt.getTime()) / 1000);
      timeRemaining = COOLDOWN_PERIOD - elapsedSeconds;
      
      // If the cooldown has expired, set to null
      if (timeRemaining <= 0) {
        timeRemaining = null;
      }
    }
    
    // Get user's claim history with coupon codes
    const claims = await prisma.claim.findMany({
      where: { userId },
      orderBy: { claimedAt: 'desc' },
      take: 10,
      include: { coupon: true }
    });
    
    const recentClaims = claims.map(claim => claim.coupon.code);
    
    return NextResponse.json({
      timeRemaining,
      recentClaims
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
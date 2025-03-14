import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get user IP address
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    const COOLDOWN_PERIOD = parseInt(process.env.COOLDOWN_PERIOD || '3600', 10);
    
    // Get user identifier from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    // If no userId in cookies, we can either:
    // 1. Return empty result (current behavior)
    // 2. Create a new user (similar to claim-coupon endpoint)
    if (!userId) {
      return NextResponse.json({
        timeRemaining: null,
        recentClaims: []
      });
    }
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    // If user ID from cookie doesn't exist in database, create it
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          ipAddress: ip
        }
      });
    }
    
    // Rest of your code stays the same...
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
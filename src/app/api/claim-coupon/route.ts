// app/api/claim-coupon/route.ts
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Get cooldown period from environment or default to 1 hour
const COOLDOWN_PERIOD = parseInt(process.env.COOLDOWN_PERIOD || '3600', 10);

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
    
    // Find or create user record
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          ipAddress: ip
        }
      });
    }
    
    // Check if user is on cooldown
    const latestClaim = await prisma.claim.findFirst({
      where: { userId },
      orderBy: { claimedAt: 'desc' }
    });
    
    if (latestClaim) {
      const elapsedSeconds = Math.floor((Date.now() - latestClaim.claimedAt.getTime()) / 1000);
      const remainingTime = COOLDOWN_PERIOD - elapsedSeconds;
      
      if (remainingTime > 0) {
        return NextResponse.json({
          success: false,
          message: 'Claim limit reached',
          timeRemaining: remainingTime
        }, { status: 429 });
      }
    }
    
    
    // Get the next coupon in round-robin fashion
let couponIndexRecord = await prisma.couponIndex.findUnique({
  where: { id: 1 }
});

if (!couponIndexRecord) {
  // Create the coupon index record if it doesn't exist
  try {
    couponIndexRecord = await prisma.couponIndex.create({
      data: {
        id: 1,
        currentIndex: 0
      }
    });
  } catch (error) {
    console.error('Error creating coupon index:', error);
    return NextResponse.json({
      success: false,
      message: 'System error: Failed to initialize coupon index'
    }, { status: 500 });
  }
}
    
    // Count available coupons
    const couponCount = await prisma.coupon.count();
    
    if (couponCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'No coupons available'
      }, { status: 404 });
    }
    
    // Get the current coupon
    const currentIndex = couponIndexRecord.currentIndex % couponCount;
    
    const coupons = await prisma.coupon.findMany({
      skip: currentIndex,
      take: 1,
      orderBy: { id: 'asc' }
    });
    
    if (!coupons || coupons.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No coupon available'
      }, { status: 404 });
    }
    
    const coupon = coupons[0];
    
    // Update the coupon index
    await prisma.couponIndex.update({
      where: { id: 1 },
      data: { currentIndex: (currentIndex + 1) % couponCount }
    });
    
    // Record this claim
    await prisma.claim.create({
      data: {
        userId: user.id,
        couponId: coupon.id
      }
    });
    
    // Respond with the coupon code
    return NextResponse.json({
      success: true,
      couponCode: coupon.code,
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
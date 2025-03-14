// app/api/claim-coupon/route.ts

import prisma from '@/lib/prisma';
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
    let user = await prisma.user.findFirst({
      where: { ipAddress: ip }
    });

    console.log(user)
    
    if (!user) {
      try{
        user = await prisma.user.create({
          data: {
            id: userId,
            ipAddress: ip
          }
        });
      } catch(error) {
        console.error('Error creating user:', error);
        return NextResponse.json({
          success: false,
          statusCode: 500,
          message: 'User with same ip exists'
        }, { status: 208 });
      }
    }
    
    // Check if user is on cooldown by looking at their most recent claim
    // Add this check before the IP-based check:

// Check if the current user is on cooldown
const latestUserClaim = await prisma.claim.findFirst({
  where: { userId: user.id },
  orderBy: { claimedAt: 'desc' }
});

if (latestUserClaim) {
  const elapsedSeconds = Math.floor((Date.now() - latestUserClaim.claimedAt.getTime()) / 1000);
  
  if (elapsedSeconds < COOLDOWN_PERIOD) {
    const remainingTime = COOLDOWN_PERIOD - elapsedSeconds;
    return NextResponse.json({
      success: false,
      statusCode: 429,
      message: `Please wait ${formatRemainingTime(remainingTime)} before claiming another coupon`,
      timeRemaining: remainingTime
    }, { status: 202 });
  }
}
    
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
        // True server error - use 500
        return NextResponse.json({
          success: false,
          statusCode: 500,
          message: 'System error: Failed to initialize coupon index'
        }, { status: 500 });
      }
    }
    
    // Count available coupons
    const couponCount = await prisma.coupon.count();
    
    if (couponCount === 0) {
      return NextResponse.json({
        success: false,
        statusCode: 404,
        message: 'No coupons available'
      }, { status: 203 }); // Using 203 (Non-Authoritative Information)
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
        statusCode: 404,
        message: 'No coupon available'
      }, { status: 203 }); // Using 203 (Non-Authoritative Information)
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
    
    // Respond with the coupon code - success with 201 Created
    return NextResponse.json({
      success: true,
      statusCode: 200,
      couponCode: coupon.code,
      message: 'Coupon claimed',  
      cooldownPeriod: COOLDOWN_PERIOD
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error claiming coupon:', error);
    // True server error - use 500
    return NextResponse.json({
      success: false,
      statusCode: 500,
      message: 'Error processing request'
    }, { status: 500 });
  }
}

// Helper function to format remaining time in a human-readable format
function formatRemainingTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}
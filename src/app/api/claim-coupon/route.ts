

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';


const COOLDOWN_PERIOD = parseInt(process.env.COOLDOWN_PERIOD || '3600', 10);

export async function POST(request: NextRequest) {
  try {

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    

    const cookieStore = await cookies();
    let userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      userId = uuidv4();

    }
    

    let user = await prisma.user.findFirst({
      where: { ipAddress: ip }
    });


    
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
          statusCode: 500,
          message: 'System error: Failed to initialize coupon index'
        }, { status: 500 });
      }
    }
    

    const couponCount = await prisma.coupon.count();
    
    if (couponCount === 0) {
      return NextResponse.json({
        success: false,
        statusCode: 404,
        message: 'No coupons available'
      }, { status: 203 });
    }
    

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
      }, { status: 203 }); 
    }
    
    const coupon = coupons[0];
    

    await prisma.couponIndex.update({
      where: { id: 1 },
      data: { currentIndex: (currentIndex + 1) % couponCount }
    });
    

    await prisma.claim.create({
      data: {
        userId: user.id,
        couponId: coupon.id
      }
    });
    

    return NextResponse.json({
      success: true,
      statusCode: 200,
      couponCode: coupon.code,
      message: 'Coupon claimed',  
      cooldownPeriod: COOLDOWN_PERIOD
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error claiming coupon:', error);

    return NextResponse.json({
      success: false,
      statusCode: 500,
      message: 'Error processing request'
    }, { status: 500 });
  }
}


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
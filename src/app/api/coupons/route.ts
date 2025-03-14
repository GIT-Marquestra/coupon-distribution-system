

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid coupon code" },
        { status: 400 }
      );
    }

    // Check if the coupon already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { success: false, message: "Coupon code already exists" },
        { status: 409 }
      );
    }

    // Create new coupon
    const newCoupon = await prisma.coupon.create({
      data: { code },
    });

    return NextResponse.json(
      { success: true, coupon: newCoupon },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
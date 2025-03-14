// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export function middleware(request: NextRequest) {
  // Get the existing user_id cookie
  const userId = request.cookies.get('user_id')?.value;
  
  // If there's no user_id, set one
  if (!userId) {
    const response = NextResponse.next();
    
    // Generate a new user ID
    const newUserId = uuidv4();
    
    // Set the cookie
    response.cookies.set({
      name: 'user_id',
      value: newUserId,
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      // Set expiry to 30 days
      maxAge: 30 * 24 * 60 * 60
    });
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
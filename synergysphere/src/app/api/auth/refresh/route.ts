import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    // Import authService inside the handler
    const { authService } = await import('@/lib/auth');
    
    // Generate a new token
    const token = authService.generateToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json({
      user,
      token,
    });

    // Set the new token in cookie
    authService.setAuthCookie(response, token);

    return response;
  });
}
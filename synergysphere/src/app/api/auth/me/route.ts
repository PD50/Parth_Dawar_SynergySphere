import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    return NextResponse.json({ user });
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    const response = NextResponse.json({ message: 'Session cleared successfully' });
    
    // Import authService inside the handler to avoid circular imports
    const { authService } = await import('@/lib/auth');
    authService.clearAuthCookie(response);
    
    return response;
  });
}
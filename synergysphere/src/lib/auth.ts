import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_EXPIRES_IN = '7d';

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: { userId: string; email: string }): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
  }

  // Set httpOnly cookie
  setAuthCookie(res: NextResponse, token: string) {
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  }

  // Clear auth cookie
  clearAuthCookie(res: NextResponse) {
    res.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  }
}

// Create a singleton instance
export const authService = new AuthService();

// JWT-based authentication verification for API routes
export async function verifyAuth(req: NextRequest): Promise<{
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.get('auth-token')?.value || 
                  req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided'
      };
    }

    // Verify the JWT token
    const payload = authService.verifyToken(token);
    
    return {
      success: true,
      userId: payload.userId,
      email: payload.email
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return {
        success: false,
        error: 'Invalid authentication token'
      };
    }
    
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const JWT_SECRET = process.env.JWT_SECRET;

interface JWTPayload {
  role?: string;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ isAdmin: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    if (!decoded || !decoded.role) {
      return NextResponse.json({ isAdmin: false });
    }

    return NextResponse.json({ isAdmin: decoded.role === 'admin' });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false });
  }
} 
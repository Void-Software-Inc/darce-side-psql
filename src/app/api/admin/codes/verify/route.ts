import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Access code is required' },
        { status: 400 }
      );
    }

    // Check if the code exists and is not used
    const result = await query(
      'SELECT id FROM access_codes WHERE code = $1 AND is_used = false',
      [code]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid or used access code' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying access code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify access code' },
      { status: 500 }
    );
  }
} 
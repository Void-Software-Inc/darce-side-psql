import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(req: NextRequest) {
  try {
    const videoId = req.nextUrl.searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { message: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active = false
    await query(
      'UPDATE videos SET is_active = false WHERE id = $1',
      [videoId]
    );

    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/videos/delete:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
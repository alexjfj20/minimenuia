import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Generate hash with salt rounds = 10
    const hash = await bcrypt.hash(password, 10);

    return NextResponse.json({
      success: true,
      hash,
      message: 'Use this hash to update the user password in Supabase'
    });
  } catch (error) {
    console.error('[Hash Generator] Error:', error);
    return NextResponse.json(
      { error: 'Error generating hash' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verificationCodes } from '@/lib/verification-storage';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const stored = verificationCodes.get(email);

    if (!stored) {
      return NextResponse.json({ error: 'Verification code not found or expired' }, { status: 400 });
    }

    // Check if code is expired
    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Check if code matches
    if (stored.code !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Code is valid, remove it
    verificationCodes.delete(email);

    return NextResponse.json({ 
      message: 'Email verified successfully',
      success: true 
    });

  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}

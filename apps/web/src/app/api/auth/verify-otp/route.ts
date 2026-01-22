import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security';

/**
 * Email OTP Verification API
 *
 * Verifies a 6-digit OTP code sent to the user's email.
 * Uses database-backed rate limiting for distributed environments.
 */

// OTP-specific rate limit: 5 attempts per minute (stricter than default)
const OTP_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validation
    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Invalid code format. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // Database-backed rate limiting (works across multiple server instances)
    const rateLimitResult = await rateLimit(request, `otp:verify:${email}`, OTP_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many verification attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Verify OTP with Supabase
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (error) {
      console.error('OTP verification error:', error);

      // Map Supabase errors to user-friendly messages
      let errorMessage = 'Verification failed';

      if (error.message.includes('expired')) {
        errorMessage = 'Code has expired. Please request a new one.';
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Invalid verification code. Please try again.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'No pending verification found. Please sign up again.';
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'Verification failed. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error: any) {
    console.error('Unexpected error in verify-otp:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

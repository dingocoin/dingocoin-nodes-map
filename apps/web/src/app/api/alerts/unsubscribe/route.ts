/**
 * Unsubscribe from Alert Emails
 *
 * GET /api/alerts/unsubscribe?token=xxx - Disable email alerts for a subscription
 * POST /api/alerts/unsubscribe - Same as GET (for form submissions)
 *
 * This allows users to unsubscribe from email alerts without logging in.
 * The token is unique per subscription and included in alert emails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security';

export const dynamic = 'force-dynamic';

interface UnsubscribeResult {
  success: boolean;
  message: string;
  nodeInfo?: {
    ip: string;
    port: number;
    name?: string;
  };
}

async function handleUnsubscribe(token: string): Promise<{ result: UnsubscribeResult; status: number }> {
  // Validate token format (64 hex characters)
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return {
      result: {
        success: false,
        message: 'Invalid unsubscribe token format',
      },
      status: 400,
    };
  }

  const adminClient = createAdminClient();

  // Find subscription by token
  const { data: subscription, error: findError } = await adminClient
    .from('alert_subscriptions')
    .select(`
      id,
      email_enabled,
      node_id,
      nodes (
        ip,
        port
      )
    `)
    .eq('unsubscribe_token', token)
    .single();

  if (findError || !subscription) {
    return {
      result: {
        success: false,
        message: 'Subscription not found. The link may have expired or already been used.',
      },
      status: 404,
    };
  }

  // Check if already unsubscribed
  if (!subscription.email_enabled) {
    const nodeData = subscription.nodes as { ip: string; port: number } | null;
    return {
      result: {
        success: true,
        message: 'You are already unsubscribed from email alerts for this node.',
        nodeInfo: nodeData ? { ip: nodeData.ip, port: nodeData.port } : undefined,
      },
      status: 200,
    };
  }

  // Disable email alerts (keep webhook if configured)
  const { error: updateError } = await adminClient
    .from('alert_subscriptions')
    .update({ email_enabled: false, updated_at: new Date().toISOString() })
    .eq('id', subscription.id);

  if (updateError) {
    console.error('[Unsubscribe] Failed to update subscription:', updateError);
    return {
      result: {
        success: false,
        message: 'Failed to unsubscribe. Please try again or contact support.',
      },
      status: 500,
    };
  }

  const nodeData = subscription.nodes as { ip: string; port: number } | null;

  console.info('[Unsubscribe] Email alerts disabled', {
    subscriptionId: subscription.id,
    nodeId: subscription.node_id,
  });

  return {
    result: {
      success: true,
      message: 'You have been successfully unsubscribed from email alerts.',
      nodeInfo: nodeData ? { ip: nodeData.ip, port: nodeData.port } : undefined,
    },
    status: 200,
  };
}

// GET /api/alerts/unsubscribe?token=xxx
export async function GET(request: NextRequest) {
  // Rate limit to prevent abuse
  const rateLimitResult = await rateLimit(request, 'alerts:unsubscribe', RATE_LIMITS.READ);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Missing unsubscribe token' },
      { status: 400 }
    );
  }

  const { result, status } = await handleUnsubscribe(token);
  return NextResponse.json(result, { status });
}

// POST /api/alerts/unsubscribe (for form submissions)
export async function POST(request: NextRequest) {
  // Rate limit to prevent abuse
  const rateLimitResult = await rateLimit(request, 'alerts:unsubscribe', RATE_LIMITS.READ);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  let token: string | null = null;

  // Try to get token from JSON body
  try {
    const body = await request.json();
    token = body.token;
  } catch {
    // Try URL params as fallback
    token = request.nextUrl.searchParams.get('token');
  }

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Missing unsubscribe token' },
      { status: 400 }
    );
  }

  const { result, status } = await handleUnsubscribe(token);
  return NextResponse.json(result, { status });
}

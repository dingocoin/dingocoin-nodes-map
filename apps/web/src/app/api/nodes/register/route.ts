import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, RATE_LIMITS } from '@/lib/security'
import { getChainConfig } from '@/config'
import net from 'net'

const registerNodeSchema = z.object({
  ip: z.string().ip({ message: 'Invalid IP address' }),
  port: z.number().int().min(1).max(65535),
})

/**
 * Attempts to connect to a node and perform a basic P2P handshake
 * Returns version info if successful
 */
async function probeNode(ip: string, port: number, timeoutMs: number = 5000): Promise<{
  success: boolean
  version?: string
  error?: string
}> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let resolved = false

    const cleanup = () => {
      if (!resolved) {
        resolved = true
        socket.destroy()
      }
    }

    socket.setTimeout(timeoutMs)

    socket.on('connect', () => {
      // Connected successfully - node is reachable
      // For a full implementation, we'd do the P2P version handshake here
      // For now, just verify connectivity
      cleanup()
      resolve({ success: true, version: 'reachable' })
    })

    socket.on('timeout', () => {
      cleanup()
      resolve({ success: false, error: 'Connection timeout' })
    })

    socket.on('error', (err) => {
      cleanup()
      resolve({ success: false, error: err.message })
    })

    try {
      socket.connect(port, ip)
    } catch (err) {
      cleanup()
      resolve({ success: false, error: 'Failed to initiate connection' })
    }
  })
}

/**
 * Register a node manually
 *
 * POST /api/nodes/register
 * Body: { ip: string, port: number }
 *
 * - Requires authentication
 * - Validates IP:port format
 * - Probes the node to verify it's reachable
 * - Adds to database if successful
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit registration attempts
    const rateLimitResult = await rateLimit(request, 'nodes:register', RATE_LIMITS.VERIFY)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = registerNodeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { ip, port } = validation.data
    const chainConfig = getChainConfig()

    // Use admin client for database operations (bypass RLS)
    const adminClient = createAdminClient()

    // Check if node already exists
    const { data: existingNode } = await adminClient
      .from('nodes')
      .select('id, ip, port, status, registered_by')
      .eq('ip', ip)
      .eq('port', port)
      .single()

    if (existingNode) {
      return NextResponse.json(
        {
          error: 'Node already registered',
          node: {
            id: existingNode.id,
            ip: existingNode.ip,
            port: existingNode.port,
            status: existingNode.status
          }
        },
        { status: 409 }
      )
    }

    // Probe the node to verify it's reachable
    console.info('[NodeRegister] Probing node', { ip, port, userId: user.id })
    const probeResult = await probeNode(ip, port)

    if (!probeResult.success) {
      console.warn('[NodeRegister] Node probe failed', { ip, port, error: probeResult.error })
      return NextResponse.json(
        {
          error: 'Could not connect to node. Please ensure your node is running and accessible.',
          details: probeResult.error
        },
        { status: 422 }
      )
    }

    // Insert the node
    const { data: newNode, error: insertError } = await adminClient
      .from('nodes')
      .insert({
        ip,
        port,
        chain: chainConfig.name.toLowerCase(),
        status: 'up',
        source: 'manual',
        registered_by: user.id,
        last_seen: new Date().toISOString(),
        first_seen: new Date().toISOString(),
      })
      .select('id, ip, port, status')
      .single()

    if (insertError) {
      console.error('[NodeRegister] Insert failed', { error: insertError })
      return NextResponse.json(
        { error: 'Failed to register node', details: insertError.message },
        { status: 500 }
      )
    }

    console.info('[NodeRegister] Node registered successfully', {
      nodeId: newNode.id,
      ip,
      port,
      userId: user.id
    })

    return NextResponse.json({
      success: true,
      message: 'Node registered successfully! The crawler will update its details shortly.',
      node: newNode
    })

  } catch (err) {
    console.error('[NodeRegister] Unexpected error', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Get user's registered nodes
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    const { data: nodes, error } = await adminClient
      .from('nodes')
      .select('id, ip, port, status, version, last_seen, registered_by')
      .eq('registered_by', user.id)
      .order('last_seen', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch nodes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ nodes })

  } catch (err) {
    console.error('[NodeRegister] GET error', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

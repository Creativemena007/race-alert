import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const unsubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().uuid('Invalid unsubscribe token').optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = unsubscribeSchema.parse(body)
    const normalizedEmail = email.toLowerCase()

    // Find the subscriber
    const { data: subscriber, error: findError } = await supabaseAdmin
      .from('subscribers')
      .select('id, email, status')
      .eq('email', normalizedEmail)
      .single()

    if (findError || !subscriber) {
      return NextResponse.json({
        success: false,
        message: 'Email address not found in our system.'
      }, { status: 404 })
    }

    // If already unsubscribed, return friendly message
    if (subscriber.status === 'unsubscribed') {
      return NextResponse.json({
        success: true,
        alreadyUnsubscribed: true,
        message: 'You\'re already unsubscribed from all race alerts.'
      })
    }

    // Update subscriber status to unsubscribed
    const { error: updateError } = await supabaseAdmin
      .from('subscribers')
      .update({
        status: 'unsubscribed',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriber.id)

    if (updateError) {
      console.error('Unsubscribe update error:', updateError)
      return NextResponse.json({
        success: false,
        message: 'Failed to unsubscribe. Please try again.'
      }, { status: 500 })
    }

    // Deactivate all subscriptions
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .update({ is_active: false })
      .eq('subscriber_id', subscriber.id)

    if (subscriptionError) {
      console.error('Subscription deactivation error:', subscriptionError)
      // Don't fail the unsubscribe if subscription update fails
    }

    console.log(`User unsubscribed: ${normalizedEmail}`)

    return NextResponse.json({
      success: true,
      alreadyUnsubscribed: false,
      message: 'You have been successfully unsubscribed from all race alerts.'
    })

  } catch (error) {
    console.error('Unsubscribe error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email address'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

// Handle GET requests for direct unsubscribe links
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  if (!email) {
    return NextResponse.redirect(new URL('/unsubscribe?error=missing-email', request.url))
  }

  try {
    // Validate email format
    const { email: validEmail } = unsubscribeSchema.parse({ email, token })
    
    // Process unsubscribe
    const unsubscribeResponse = await POST(new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ email: validEmail, token }),
      headers: { 'content-type': 'application/json' }
    }))

    const result = await unsubscribeResponse.json()
    
    if (result.success) {
      return NextResponse.redirect(new URL(`/unsubscribe?success=true&already=${result.alreadyUnsubscribed}`, request.url))
    } else {
      return NextResponse.redirect(new URL(`/unsubscribe?error=${encodeURIComponent(result.message)}`, request.url))
    }
    
  } catch (error) {
    console.error('GET unsubscribe error:', error)
    return NextResponse.redirect(new URL('/unsubscribe?error=invalid-request', request.url))
  }
}
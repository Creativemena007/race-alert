import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'
import { z } from 'zod'

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  timezone: z.string().optional().default('UTC')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, timezone } = subscribeSchema.parse(body)

    // Create or update subscriber
    const { data: subscriber, error: subscriberError } = await supabaseAdmin
      .from('subscribers')
      .upsert([
        {
          email: email.toLowerCase(),
          status: 'active',
          timezone
        }
      ])
      .select()
      .single()

    if (subscriberError) {
      console.error('Error creating subscriber:', subscriberError)
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      )
    }

    // Get all races to subscribe to
    const { data: races, error: racesError } = await supabaseAdmin
      .from('races')
      .select('id')

    if (racesError) {
      console.error('Error fetching races:', racesError)
      return NextResponse.json(
        { error: 'Failed to fetch races' },
        { status: 500 }
      )
    }

    // Subscribe to all races (for MVP, users get all races)
    if (races && races.length > 0) {
      const subscriptions = races.map(race => ({
        subscriber_id: subscriber.id,
        race_id: race.id,
        is_active: true
      }))

      const { error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .upsert(subscriptions, {
          onConflict: 'subscriber_id,race_id',
          ignoreDuplicates: false
        })

      if (subscriptionError) {
        console.error('Error creating subscriptions:', subscriptionError)
        return NextResponse.json(
          { error: 'Failed to create race subscriptions' },
          { status: 500 }
        )
      }
    }

    // Send welcome email
    try {
      const template = emailTemplates.welcomeEmail(email, races?.length || 0)
      await sendEmail({
        to: [email],
        subject: template.subject,
        html: template.html,
        text: template.text
      })
      console.log(`Welcome email sent to ${email}`)
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError)
      // Don't fail the subscription if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to race alerts!',
      races_count: races?.length || 0
    })

  } catch (error) {
    console.error('Subscribe error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
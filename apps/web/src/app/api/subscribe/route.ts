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
    const normalizedEmail = email.toLowerCase()

    // Check if subscriber already exists
    const { data: existingSubscriber, error: checkError } = await supabaseAdmin
      .from('subscribers')
      .select('id, email, status, created_at')
      .eq('email', normalizedEmail)
      .single()

    let subscriber
    let isNewSubscriber = false

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Subscriber check error:', checkError)
      return NextResponse.json({ error: 'Failed to process subscription' }, { status: 500 })
    }

    if (existingSubscriber) {
      // User already exists - update their status and timezone
      const { data: updatedSubscriber, error: updateError } = await supabaseAdmin
        .from('subscribers')
        .update({
          status: 'active',
          timezone,
          updated_at: new Date().toISOString()
        })
        .eq('email', normalizedEmail)
        .select()
        .single()

      if (updateError) {
        console.error('Subscriber update error:', updateError)
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
      }
      subscriber = updatedSubscriber
      isNewSubscriber = false
    } else {
      // New user - create subscriber
      const { data: newSubscriber, error: createError } = await supabaseAdmin
        .from('subscribers')
        .insert({
          email: normalizedEmail,
          status: 'active',
          timezone
        })
        .select()
        .single()

      if (createError) {
        console.error('Subscriber creation error:', createError)
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
      }
      subscriber = newSubscriber
      isNewSubscriber = true
    }

    // Get all races to subscribe to
    const { data: races, error: racesError } = await supabaseAdmin
      .from('races')
      .select('id')

    if (racesError) {
      console.error('Error fetching races:', racesError)
      return NextResponse.json({ error: 'Failed to fetch races' }, { status: 500 })
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
        return NextResponse.json({ error: 'Failed to create race subscriptions' }, { status: 500 })
      }
    }

    // Send welcome email only for new subscribers
    if (isNewSubscriber) {
      try {
        const template = emailTemplates.welcomeEmail(normalizedEmail, races?.length || 0)
        await sendEmail({
          to: [normalizedEmail],
          subject: template.subject,
          html: template.html,
          text: template.text
        })
        console.log(`Welcome email sent to ${normalizedEmail}`)
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Don't fail the subscription if email fails
      }
    }

    return NextResponse.json({
      success: true,
      isNewSubscriber,
      races_count: races?.length || 0,
      message: isNewSubscriber 
        ? 'Successfully subscribed to race alerts!' 
        : 'You\'re already subscribed! Your preferences have been updated.'
    })

  } catch (error) {
    console.error('Subscribe error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
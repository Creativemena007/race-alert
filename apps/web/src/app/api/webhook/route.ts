import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'
import { z } from 'zod'

// Webhook payload schema
const webhookSchema = z.object({
  race_id: z.string().uuid(),
  status: z.enum(['open', 'closed', 'unknown', 'full']),
  scraped_at: z.string().optional(),
  content_snippet: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (basic security)
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.WEBHOOK_SECRET || 'dev-secret'
    
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = webhookSchema.parse(body)

    console.log('Received webhook:', payload)

    // Call the database function to handle status update and notifications
    const { data, error } = await supabaseAdmin.rpc('notify_registration_opened', {
      p_race_id: payload.race_id,
      p_new_status: payload.status
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const notificationsSent = data?.[0]?.notifications_sent || 0
    console.log(`Status update processed. Notifications sent: ${notificationsSent}`)

    // If notifications were created and status is 'open', send actual emails
    if (notificationsSent > 0 && payload.status === 'open') {
      try {
        // Get the race details and pending notifications
        const { data: raceData, error: raceError } = await supabaseAdmin
          .from('races')
          .select('name, url')
          .eq('id', payload.race_id)
          .single()

        if (raceError) {
          console.error('Error fetching race details:', raceError)
        } else {
          // Get pending notifications for this race
          const { data: notifications, error: notificationError } = await supabaseAdmin
            .from('notifications')
            .select('recipient_email')
            .eq('race_id', payload.race_id)
            .gte('sent_at', new Date(Date.now() - 60000).toISOString()) // Last minute

          if (!notificationError && notifications && notifications.length > 0) {
            const template = emailTemplates.raceRegistrationOpen(raceData.name, raceData.url, notifications[0]?.recipient_email)
            
            // Send email to all recipients
            await sendEmail({
              to: notifications.map(n => n.recipient_email),
              subject: template.subject,
              html: template.html,
              text: template.text
            })

            console.log(`Sent registration open emails to ${notifications.length} recipients`)
          }
        }
      } catch (emailError) {
        console.error('Error sending registration emails:', emailError)
        // Don't fail the webhook if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      notifications_sent: notificationsSent
    })

  } catch (error) {
    console.error('Webhook error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  })
}
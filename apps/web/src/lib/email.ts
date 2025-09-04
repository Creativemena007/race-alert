import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key')

export interface SendEmailOptions {
  to: string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Race Alert <onboarding@resend.dev>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('Email sent successfully:', data)
    return data
  } catch (error) {
    console.error('Email sending failed:', error)
    throw error
  }
}

// Email templates
export const emailTemplates = {
  raceRegistrationOpen: (raceName: string, raceUrl: string, subscriberEmail?: string) => ({
    subject: `🏃‍♂️ Registration just opened: ${raceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 20px;">
          🏃‍♂️ Registration Alert: ${raceName}
        </h1>
        
        <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin-top: 0;">Registration is now OPEN!</h2>
          <p style="font-size: 16px; margin-bottom: 15px;">
            Great news! Registration for <strong>${raceName}</strong> just opened.
          </p>
          <p style="font-size: 16px; margin-bottom: 0;">
            Don't wait - popular races fill up fast!
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${raceUrl}" 
             style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
            Register Now
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>
            You're receiving this email because you signed up for race registration alerts at 
            <a href="https://race-alert-k3xe3dj3o-orezi-menas-projects.vercel.app" style="color: #2563eb;">Race Alert</a>.
          </p>
          <p>
            <a href="https://race-alert-k3xe3dj3o-orezi-menas-projects.vercel.app/unsubscribe?email=${encodeURIComponent(subscriberEmail || '')}" style="color: #6b7280;">Unsubscribe</a> • 
            <a href="https://race-alert-k3xe3dj3o-orezi-menas-projects.vercel.app" style="color: #6b7280;">Update Preferences</a>
          </p>
        </div>
      </div>
    `,
    text: `
🏃‍♂️ Registration Alert: ${raceName}

Registration is now OPEN!

Great news! Registration for ${raceName} just opened.
Don't wait - popular races fill up fast!

Register now: ${raceUrl}

You're receiving this email because you signed up for race registration alerts at Race Alert.
    `
  }),

  welcomeEmail: (subscriberEmail: string, raceCount: number) => ({
    subject: '🎉 Welcome to Race Alert!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 20px;">
          🎉 Welcome to Race Alert!
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hi there!
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Thanks for signing up! You're now subscribed to instant notifications for <strong>${raceCount} major marathons</strong> worldwide, including:
        </p>
        
        <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
          <li>Boston Marathon</li>
          <li>London Marathon</li>
          <li>Berlin Marathon</li>
          <li>Chicago Marathon</li>
          <li>NYC Marathon</li>
          <li>And more!</li>
        </ul>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e;">
            <strong>⚡ Pro tip:</strong> When you get an alert, register immediately! 
            Popular races like Boston and London can sell out within hours or minutes.
          </p>
        </div>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          We'll only email you when registration opens - no spam, just the alerts you need.
        </p>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>
            Happy running! 🏃‍♀️<br>
            The Race Alert Team
          </p>
          <p>
            <a href="https://race-alert-k3xe3dj3o-orezi-menas-projects.vercel.app/unsubscribe?email=${encodeURIComponent(subscriberEmail)}" style="color: #6b7280;">Unsubscribe</a> • 
            <a href="https://race-alert-k3xe3dj3o-orezi-menas-projects.vercel.app" style="color: #6b7280;">Update Preferences</a>
          </p>
        </div>
      </div>
    `,
    text: `
🎉 Welcome to Race Alert!

Hi there!

Thanks for signing up! You're now subscribed to instant notifications for ${raceCount} major marathons worldwide, including Boston, London, Berlin, Chicago, NYC, and more!

⚡ Pro tip: When you get an alert, register immediately! Popular races like Boston and London can sell out within hours or minutes.

We'll only email you when registration opens - no spam, just the alerts you need.

Happy running! 🏃‍♀️
The Race Alert Team
    `
  })
}
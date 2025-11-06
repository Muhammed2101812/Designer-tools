import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailNotification {
  type: 'welcome_email'
  user_id: string
  email: string
  full_name?: string
  timestamp: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the notification payload
    const { type, user_id, email, full_name } = await req.json() as EmailNotification

    console.log('Processing email notification:', { type, user_id, email })

    // Validate the notification
    if (type !== 'welcome_email') {
      throw new Error(`Unsupported notification type: ${type}`)
    }

    if (!user_id || !email) {
      throw new Error('Missing required fields: user_id, email')
    }

    // Verify user exists and get their preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      console.error('User not found:', profileError)
      throw new Error('User not found')
    }

    // Check email preferences
    const { data: emailPrefs } = await supabase
      .from('email_preferences')
      .select('marketing_emails')
      .eq('user_id', user_id)
      .single()

    // Skip if user has opted out
    if (emailPrefs && !emailPrefs.marketing_emails) {
      console.log('User has opted out of marketing emails:', user_id)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User opted out of marketing emails' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Call the welcome email API
    const emailResponse = await fetch(`${appUrl}/api/email/welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        email: profile.email,
        full_name: full_name || profile.full_name,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      throw new Error(`Email API failed: ${emailResponse.status} ${errorText}`)
    }

    const emailResult = await emailResponse.json()
    console.log('Welcome email sent successfully:', emailResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email processed successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Email notification error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

/* To deploy this function:
 * 1. Make sure you have the Supabase CLI installed
 * 2. Run: supabase functions deploy email-notifications
 * 3. Set the required environment variables in Supabase dashboard:
 *    - APP_URL: Your application URL (e.g., https://yourapp.com)
 * 4. The function will be available at:
 *    https://your-project.supabase.co/functions/v1/email-notifications
 */
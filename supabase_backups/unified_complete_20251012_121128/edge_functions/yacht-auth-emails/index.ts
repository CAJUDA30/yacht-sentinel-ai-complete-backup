import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { WelcomeVerificationEmail } from './_templates/welcome-verification.tsx'
import { PasswordResetEmail } from './_templates/password-reset.tsx'
import { SecurityAlertEmail } from './_templates/security-alert.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('YACHT_AUTH_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    // Handle direct calls for security alerts (not webhook)
    if (req.headers.get('x-yacht-direct-call') === 'true') {
      return await handleDirectCall(req, payload)
    }

    // Handle Supabase auth webhooks
    if (!hookSecret) {
      console.error('YACHT_AUTH_HOOK_SECRET not configured')
      return new Response('Server configuration error', { status: 500, headers: corsHeaders })
    }

    const wh = new Webhook(hookSecret)
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: { email: string }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
      }
    }

    let html: string
    let subject: string

    // Route to appropriate email template based on action type
    if (email_action_type === 'signup') {
      html = await renderAsync(
        React.createElement(WelcomeVerificationEmail, {
          supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
          token,
          token_hash,
          redirect_to,
          email_action_type,
          user_email: user.email,
        })
      )
      subject = 'Welcome to Yacht Excel - Verify Your Account'
    } else if (email_action_type === 'recovery') {
      html = await renderAsync(
        React.createElement(PasswordResetEmail, {
          supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
          token,
          token_hash,
          redirect_to,
          email_action_type,
          user_email: user.email,
        })
      )
      subject = 'Reset Your Yacht Excel Password'
    } else {
      // Fallback to basic template for other types
      html = `
        <h1>Yacht Excel Authentication</h1>
        <p>Action required for your account: ${email_action_type}</p>
        <p><a href="${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}">Click here to continue</a></p>
        <p>Or use this code: <code>${token}</code></p>
      `
      subject = 'Yacht Excel - Account Action Required'
    }

    const { error } = await resend.emails.send({
      from: 'Yacht Excel <auth@yachtexcel.com>',
      to: [user.email],
      subject,
      html,
    })

    if (error) {
      console.error('Email send error:', error)
      throw error
    }

    console.log(`Auth email sent successfully: ${email_action_type} to ${user.email}`)
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error: any) {
    console.error('Yacht auth email error:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'Email sending failed',
          code: error.code || 'UNKNOWN_ERROR',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})

// Handle direct security alert calls
async function handleDirectCall(req: Request, payload: string) {
  try {
    const data = JSON.parse(payload) as {
      type: 'security_alert'
      user_email: string
      alert_type: 'new_device' | 'suspicious_activity' | 'password_changed' | 'account_locked'
      details: {
        timestamp: string
        location?: string
        ip_address?: string
        device_info?: string
        action_taken?: string
      }
    }

    if (data.type !== 'security_alert') {
      return new Response('Invalid request type', { status: 400, headers: corsHeaders })
    }

    const html = await renderAsync(
      React.createElement(SecurityAlertEmail, {
        user_email: data.user_email,
        alert_type: data.alert_type,
        details: data.details,
      })
    )

    const subject = `Yacht Excel Security Alert - ${data.alert_type.replace('_', ' ').toUpperCase()}`

    const { error } = await resend.emails.send({
      from: 'Yacht Excel Security <security@yachtexcel.com>',
      to: [data.user_email],
      subject,
      html,
    })

    if (error) {
      console.error('Security email send error:', error)
      throw error
    }

    console.log(`Security alert sent: ${data.alert_type} to ${data.user_email}`)
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error: any) {
    console.error('Security alert email error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Security email failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
}
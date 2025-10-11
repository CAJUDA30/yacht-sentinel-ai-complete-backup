import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { authenticator } from 'https://esm.sh/otplib@12.0.1';
import { toDataURL } from 'https://esm.sh/qrcode@1.5.3';
import { encode } from 'https://deno.land/std@0.190.0/encoding/base32.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Request2FA {
  action: 'generate' | 'verify' | 'finalize' | 'disable';
  code?: string;
  secret?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { action, code, secret }: Request2FA = await req.json();

    switch (action) {
      case 'generate': {
        // Generate new secret for 2FA setup
        const newSecret = authenticator.generateSecret();
        const serviceName = 'Yacht Excel';
        const label = `${serviceName}:${user.email}`;
        
        // Generate OTP auth URL
        const otpAuthUrl = authenticator.keyuri(user.email, serviceName, newSecret);
        
        // Generate QR code
        const qrCode = await toDataURL(otpAuthUrl);

        // Store temporary secret in user metadata (for verification)
        await supabaseClient.auth.updateUser({
          data: { 
            temp_2fa_secret: newSecret,
            two_factor_setup_started: new Date().toISOString()
          }
        });

        return new Response(JSON.stringify({
          secret: newSecret,
          qr_code: qrCode,
          success: true
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      case 'verify': {
        if (!code || !secret) {
          throw new Error('Code and secret are required for verification');
        }

        // Verify the TOTP code
        const isValid = authenticator.verify({
          token: code,
          secret: secret
        });

        if (!isValid) {
          return new Response(JSON.stringify({
            valid: false,
            error: 'Invalid verification code'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        // Generate backup codes
        const backupCodes = Array.from({ length: 8 }, () => {
          return Array.from({ length: 8 }, () => 
            Math.random().toString(36).charAt(2)
          ).join('').toUpperCase();
        });

        // Store backup codes securely (hash them)
        const hashedBackupCodes = await Promise.all(
          backupCodes.map(async (code) => {
            const encoder = new TextEncoder();
            const data = encoder.encode(code + user.id); // Salt with user ID
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          })
        );

        // Update user metadata with verified secret and backup codes
        await supabaseClient.auth.updateUser({
          data: { 
            verified_2fa_secret: secret,
            backup_codes: hashedBackupCodes,
            two_factor_verified: new Date().toISOString(),
            temp_2fa_secret: null // Clear temporary secret
          }
        });

        return new Response(JSON.stringify({
          valid: true,
          backup_codes: backupCodes,
          success: true
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      case 'finalize': {
        // Enable 2FA for the user
        await supabaseClient.auth.updateUser({
          data: { 
            two_factor_enabled: true,
            two_factor_enabled_at: new Date().toISOString()
          }
        });

        // Log security event
        await supabaseClient.from('analytics_events').insert({
          event_type: 'security_2fa_enabled',
          event_message: 'Two-factor authentication enabled',
          severity: 'info',
          module: 'security'
        });

        return new Response(JSON.stringify({
          success: true,
          message: '2FA has been enabled successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      case 'disable': {
        // Disable 2FA for the user
        await supabaseClient.auth.updateUser({
          data: { 
            two_factor_enabled: false,
            verified_2fa_secret: null,
            backup_codes: null,
            two_factor_disabled_at: new Date().toISOString()
          }
        });

        // Log security event
        await supabaseClient.from('analytics_events').insert({
          event_type: 'security_2fa_disabled',
          event_message: 'Two-factor authentication disabled',
          severity: 'warn',
          module: 'security'
        });

        return new Response(JSON.stringify({
          success: true,
          message: '2FA has been disabled'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      default:
        throw new Error('Invalid action specified');
    }

  } catch (error: any) {
    console.error('2FA setup error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Failed to process 2FA request',
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
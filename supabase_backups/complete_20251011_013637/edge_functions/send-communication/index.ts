import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      function: 'send-communication',
      capabilities: ['email', 'whatsapp'],
      time: new Date().toISOString() 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  try {
    const { jobId, channel, message, attachments = [], recipientEmail, recipientWhatsApp } = await req.json();

    console.log('Communication request:', { jobId, channel, message: message?.substring(0, 100) });

    // Get or create communication channel
    let channelRecord;
    const { data: existingChannel, error: channelError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('audit_instance_id', jobId)
      .single();

    if (existingChannel) {
      channelRecord = existingChannel;
    } else {
      const { data: newChannel, error: createError } = await supabase
        .from('communication_channels')
        .insert({
          audit_instance_id: jobId,
          channel_type: channel,
          supplier_email: recipientEmail,
          supplier_whatsapp: recipientWhatsApp,
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating channel:', createError);
        throw createError;
      }
      channelRecord = newChannel;
    }

    // Send message based on channel type
    let deliveryStatus = false;
    let deliveryResponse = null;

    if (channel === 'email' || channel === 'both') {
      try {
        const emailResponse = await sendEmailMessage(message, recipientEmail, attachments);
        deliveryStatus = emailResponse.success;
        deliveryResponse = emailResponse;
        console.log('Email sent:', emailResponse);
      } catch (error) {
        console.error('Email sending failed:', error);
      }
    }

    if (channel === 'whatsapp' || channel === 'both') {
      try {
        const whatsappResponse = await sendWhatsAppMessage(message, recipientWhatsApp, attachments);
        deliveryStatus = deliveryStatus || whatsappResponse.success;
        deliveryResponse = deliveryResponse || whatsappResponse;
        console.log('WhatsApp sent:', whatsappResponse);
      } catch (error) {
        console.error('WhatsApp sending failed:', error);
      }
    }

    // Log the communication
    const { data: loggedMessage, error: logError } = await supabase
      .from('supplier_communications')
      .insert({
        channel_id: channelRecord.id,
        message_type: 'outgoing',
        channel_used: channel,
        content: message,
        attachments: attachments,
        read_status: true,
        delivered_at: deliveryStatus ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging message:', logError);
      throw logError;
    }

    // Update channel with last message time and increment unread count for recipient
    await supabase
      .from('communication_channels')
      .update({
        last_message_at: new Date().toISOString(),
        thread_data: {
          ...channelRecord.thread_data,
          last_outgoing_message: message,
          total_messages: (channelRecord.thread_data?.total_messages || 0) + 1
        }
      })
      .eq('id', channelRecord.id);

    return new Response(JSON.stringify({
      success: deliveryStatus,
      messageId: loggedMessage.id,
      channelId: channelRecord.id,
      deliveryResponse: deliveryResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('send-communication error:', error);
    const err = {
      message: error?.message ?? String(error),
      code: 'COMMUNICATION_ERROR',
      function: 'send-communication',
      requestId: (globalThis as any).crypto?.randomUUID?.(),
      timestamp: new Date().toISOString(),
    };
    const status = typeof error?.status === 'number' ? error.status : 500;
    return new Response(JSON.stringify({ error: err }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendEmailMessage(message: string, recipientEmail: string, attachments: string[] = []) {
  try {
    // This would integrate with your email provider (SMTP, SendGrid, etc.)
    // For now, we'll simulate the email sending
    console.log('Sending email to:', recipientEmail);
    console.log('Message:', message);
    console.log('Attachments:', attachments);

    // In a real implementation, you would use an email service here
    // Example with SendGrid or similar:
    /*
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: recipientEmail }] }],
        from: { email: 'noreply@yourcompany.com' },
        subject: 'Marine Operations Update',
        content: [{ type: 'text/plain', value: message }]
      })
    });
    */

    return {
      success: true,
      messageId: `email_${Date.now()}`,
      provider: 'email_service'
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function sendWhatsAppMessage(message: string, recipientWhatsApp: string, attachments: string[] = []) {
  try {
    // This would integrate with WhatsApp Business API (Twilio, Meta, etc.)
    console.log('Sending WhatsApp to:', recipientWhatsApp);
    console.log('Message:', message);
    console.log('Attachments:', attachments);

    // In a real implementation, you would use WhatsApp API here
    // Example with Twilio WhatsApp:
    /*
    const whatsappResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: 'whatsapp:+1234567890',
        To: `whatsapp:${recipientWhatsApp}`,
        Body: message
      })
    });
    */

    return {
      success: true,
      messageId: `whatsapp_${Date.now()}`,
      provider: 'whatsapp_business'
    };
  } catch (error) {
    console.error('WhatsApp sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER || '+61425372361';

// Initialize Twilio client lazily
let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio | null {
  if (!accountSid || !authToken) {
    console.warn('[SMS] Twilio credentials not configured');
    return null;
  }
  
  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }
  
  return twilioClient;
}

// Check if SMS is configured
export function isSmsConfigured(): boolean {
  return !!(accountSid && authToken && twilioPhoneNumber);
}

// Send SMS to admin for new user signup
export async function notifyAdminNewSignup(userData: {
  name: string;
  email: string;
  organizationName: string;
}): Promise<boolean> {
  const client = getTwilioClient();
  
  if (!client || !twilioPhoneNumber) {
    console.log('[SMS] Twilio not configured, skipping notification');
    return false;
  }

  try {
    const message = `🚗 TradePilot.AI - New User Signup\n\nName: ${userData.name}\nEmail: ${userData.email}\nOrg: ${userData.organizationName}\n\nLogin to approve: https://car-trader-ai-mvp.vercel.app/admin/users`;
    
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: adminPhoneNumber,
    });

    console.log(`[SMS] Notification sent to admin. SID: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send notification:', error);
    return false;
  }
}

// Send SMS to admin for any custom message
export async function sendAdminSms(message: string): Promise<boolean> {
  const client = getTwilioClient();
  
  if (!client || !twilioPhoneNumber) {
    console.log('[SMS] Twilio not configured, skipping SMS');
    return false;
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: adminPhoneNumber,
    });

    console.log(`[SMS] Message sent to admin. SID: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send SMS:', error);
    return false;
  }
}

// Email Service for Camping Thailand Platform
// Uses Mailgun for sending emails (Q12: Essential emails only)
// Emails: verification, inquiry received, inquiry reply, password reset

import logger from '../utils/logger';

// Email configuration
interface EmailConfig {
  mailgunApiKey: string;
  mailgunDomain: string;
  fromEmail: string;
  fromName: string;
  isProduction: boolean;
}

// Email send result
interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email template data interfaces
interface InquiryNotificationData {
  ownerName: string;
  campsiteName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  inquiryType: string;
  message: string;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  inquiryId: string;
}

interface InquiryConfirmationData {
  guestName: string;
  campsiteName: string;
  message: string;
  checkInDate?: string | null;
  checkOutDate?: string | null;
}

interface InquiryReplyData {
  guestName: string;
  campsiteName: string;
  ownerReply: string;
  originalMessage: string;
}

// Get email configuration from environment
function getEmailConfig(): EmailConfig {
  return {
    mailgunApiKey: process.env.MAILGUN_API_KEY || '',
    mailgunDomain: process.env.MAILGUN_DOMAIN || 'sandboxXXXXXXXX.mailgun.org',
    fromEmail: process.env.EMAIL_FROM || 'noreply@campingthailand.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Camping Thailand',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

// Mock email sending for development/testing
async function mockSendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  logger.info('Mock email sent', {
    to,
    subject,
    htmlLength: html.length,
  });

  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    success: true,
    messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}

// Send email via Mailgun
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<SendEmailResult> {
  const config = getEmailConfig();

  // Use mock in development or when API key is not configured
  if (!config.isProduction || !config.mailgunApiKey) {
    return mockSendEmail(to, subject, html);
  }

  try {
    // Mailgun API request
    const formData = new URLSearchParams();
    formData.append('from', `${config.fromName} <${config.fromEmail}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', html);
    if (text) {
      formData.append('text', text);
    }

    const response = await fetch(
      `https://api.mailgun.net/v3/${config.mailgunDomain}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${config.mailgunApiKey}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Mailgun API error', { status: response.status, error: errorText });
      return { success: false, error: `Mailgun error: ${response.status}` };
    }

    const result = await response.json();
    logger.info('Email sent successfully', { to, subject, messageId: result.id });

    return {
      success: true,
      messageId: result.id,
    };
  } catch (error) {
    logger.error('Failed to send email', { error, to, subject });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Generate inquiry notification email HTML (sent to owner)
function generateInquiryNotificationHtml(data: InquiryNotificationData): string {
  const dateSection = data.checkInDate && data.checkOutDate
    ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>Dates:</strong><br>
          Check-in: ${data.checkInDate}<br>
          Check-out: ${data.checkOutDate}
        </td>
      </tr>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Inquiry - ${data.campsiteName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Inquiry Received</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">For ${data.campsiteName}</p>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="margin-top: 0;">Hi ${data.ownerName},</p>
    <p>You have received a new inquiry from a potential guest.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>From:</strong> ${data.guestName}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>Email:</strong> <a href="mailto:${data.guestEmail}" style="color: #10b981;">${data.guestEmail}</a>
        </td>
      </tr>
      ${data.guestPhone ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>Phone:</strong> <a href="tel:${data.guestPhone}" style="color: #10b981;">${data.guestPhone}</a>
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>Inquiry Type:</strong> ${data.inquiryType}
        </td>
      </tr>
      ${dateSection}
    </table>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <strong>Message:</strong>
      <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
    </div>

    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/owner/inquiries/${data.inquiryId}"
       style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
      Reply to Inquiry
    </a>

    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
      This is an automated message from Camping Thailand. Please do not reply directly to this email.
    </p>
  </div>
</body>
</html>`;
}

// Generate inquiry confirmation email HTML (sent to guest/user)
function generateInquiryConfirmationHtml(data: InquiryConfirmationData): string {
  const dateSection = data.checkInDate && data.checkOutDate
    ? `<p><strong>Requested dates:</strong> ${data.checkInDate} to ${data.checkOutDate}</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiry Sent - Camping Thailand</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Inquiry Sent Successfully</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Camping Thailand</p>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="margin-top: 0;">Hi ${data.guestName},</p>
    <p>Thank you for your inquiry about <strong>${data.campsiteName}</strong>. Your message has been sent to the campsite owner.</p>

    ${dateSection}

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <strong>Your message:</strong>
      <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
    </div>

    <p>The owner will review your inquiry and respond as soon as possible. You will receive an email notification when they reply.</p>

    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/campsites"
       style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
      Explore More Campsites
    </a>

    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
      This is an automated message from Camping Thailand. Please do not reply directly to this email.
    </p>
  </div>
</body>
</html>`;
}

// Generate inquiry reply email HTML (sent to guest when owner replies)
function generateInquiryReplyHtml(data: InquiryReplyData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reply from ${data.campsiteName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Reply to Your Inquiry</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">From ${data.campsiteName}</p>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="margin-top: 0;">Hi ${data.guestName},</p>
    <p>The owner of <strong>${data.campsiteName}</strong> has replied to your inquiry.</p>

    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <strong>Owner's reply:</strong>
      <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${escapeHtml(data.ownerReply)}</p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <strong>Your original message:</strong>
      <p style="margin: 10px 0 0 0; white-space: pre-wrap; color: #6b7280;">${escapeHtml(data.originalMessage)}</p>
    </div>

    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
      This is an automated message from Camping Thailand. Please do not reply directly to this email.
    </p>
  </div>
</body>
</html>`;
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Public API: Send inquiry notification to owner
export async function sendInquiryNotification(
  ownerEmail: string,
  data: InquiryNotificationData
): Promise<SendEmailResult> {
  const html = generateInquiryNotificationHtml(data);
  const subject = `New Inquiry: ${data.campsiteName} - ${data.inquiryType}`;

  return sendEmail(ownerEmail, subject, html);
}

// Public API: Send inquiry confirmation to guest
export async function sendInquiryConfirmation(
  guestEmail: string,
  data: InquiryConfirmationData
): Promise<SendEmailResult> {
  const html = generateInquiryConfirmationHtml(data);
  const subject = `Inquiry Sent: ${data.campsiteName}`;

  return sendEmail(guestEmail, subject, html);
}

// Public API: Send inquiry reply notification to guest
export async function sendInquiryReplyNotification(
  guestEmail: string,
  data: InquiryReplyData
): Promise<SendEmailResult> {
  const html = generateInquiryReplyHtml(data);
  const subject = `Reply from ${data.campsiteName}`;

  return sendEmail(guestEmail, subject, html);
}

// Export types for external use
export type {
  SendEmailResult,
  InquiryNotificationData,
  InquiryConfirmationData,
  InquiryReplyData,
};

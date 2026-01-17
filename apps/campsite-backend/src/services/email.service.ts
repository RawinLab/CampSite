import logger from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface InquiryNotificationData {
  ownerName: string;
  ownerEmail: string;
  campsiteName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  message: string;
  inquiryType: string;
  checkInDate?: string;
  checkOutDate?: string;
  dashboardUrl: string;
}

interface InquiryReplyData {
  guestName: string;
  guestEmail: string;
  ownerName: string;
  campsiteName: string;
  originalMessage: string;
  replyMessage: string;
  campsiteUrl: string;
}

export class EmailService {
  private mailgunDomain: string;
  private mailgunApiKey: string;
  private fromEmail: string;
  private isEnabled: boolean;

  constructor() {
    this.mailgunDomain = process.env.MAILGUN_DOMAIN || '';
    this.mailgunApiKey = process.env.MAILGUN_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@campingthailand.com';
    this.isEnabled = !!(this.mailgunDomain && this.mailgunApiKey);

    if (!this.isEnabled) {
      logger.warn('Email service disabled: Missing Mailgun configuration');
    }
  }

  /**
   * Send an email using Mailgun API
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isEnabled) {
      logger.info('Email not sent (service disabled):', {
        to: options.to,
        subject: options.subject,
      });
      return true; // Return true to not break the flow in dev
    }

    try {
      const formData = new FormData();
      formData.append('from', this.fromEmail);
      formData.append('to', options.to);
      formData.append('subject', options.subject);
      formData.append('html', options.html);
      if (options.text) {
        formData.append('text', options.text);
      }

      const response = await fetch(
        `https://api.mailgun.net/v3/${this.mailgunDomain}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${this.mailgunApiKey}`).toString('base64')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Mailgun API error:', { status: response.status, error });
        return false;
      }

      logger.info('Email sent successfully:', {
        to: options.to,
        subject: options.subject,
      });
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send inquiry notification to owner
   */
  async sendInquiryNotification(data: InquiryNotificationData): Promise<boolean> {
    const subject = `[Camping Thailand] New Inquiry for ${data.campsiteName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .message-box { background: white; padding: 15px; border-left: 4px solid #16a34a; margin: 15px 0; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Inquiry Received</h1>
          </div>
          <div class="content">
            <p>Hello ${data.ownerName},</p>
            <p>You have received a new inquiry for <strong>${data.campsiteName}</strong>.</p>

            <div class="info-row">
              <span class="label">From:</span> ${data.guestName} (${data.guestEmail})
            </div>
            ${data.guestPhone ? `<div class="info-row"><span class="label">Phone:</span> ${data.guestPhone}</div>` : ''}
            <div class="info-row">
              <span class="label">Inquiry Type:</span> ${data.inquiryType}
            </div>
            ${data.checkInDate ? `<div class="info-row"><span class="label">Check-in:</span> ${data.checkInDate}</div>` : ''}
            ${data.checkOutDate ? `<div class="info-row"><span class="label">Check-out:</span> ${data.checkOutDate}</div>` : ''}

            <div class="message-box">
              <p class="label">Message:</p>
              <p>${data.message.replace(/\n/g, '<br>')}</p>
            </div>

            <a href="${data.dashboardUrl}" class="button">View in Dashboard</a>
          </div>
          <div class="footer">
            <p>This email was sent from Camping Thailand platform.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Inquiry for ${data.campsiteName}

From: ${data.guestName} (${data.guestEmail})
${data.guestPhone ? `Phone: ${data.guestPhone}` : ''}
Inquiry Type: ${data.inquiryType}
${data.checkInDate ? `Check-in: ${data.checkInDate}` : ''}
${data.checkOutDate ? `Check-out: ${data.checkOutDate}` : ''}

Message:
${data.message}

View in dashboard: ${data.dashboardUrl}
    `;

    return this.sendEmail({
      to: data.ownerEmail,
      subject,
      html,
      text,
    });
  }

  /**
   * Send reply notification to guest
   */
  async sendInquiryReply(data: InquiryReplyData): Promise<boolean> {
    const subject = `[Camping Thailand] Reply from ${data.campsiteName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .message-box { background: white; padding: 15px; border-left: 4px solid #16a34a; margin: 15px 0; }
          .original-box { background: #f3f4f6; padding: 15px; border-left: 4px solid #9ca3af; margin: 15px 0; }
          .label { font-weight: bold; color: #666; margin-bottom: 5px; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reply from ${data.campsiteName}</h1>
          </div>
          <div class="content">
            <p>Hello ${data.guestName},</p>
            <p>${data.ownerName} from <strong>${data.campsiteName}</strong> has replied to your inquiry.</p>

            <div class="message-box">
              <p class="label">Reply:</p>
              <p>${data.replyMessage.replace(/\n/g, '<br>')}</p>
            </div>

            <div class="original-box">
              <p class="label">Your original message:</p>
              <p>${data.originalMessage.replace(/\n/g, '<br>')}</p>
            </div>

            <a href="${data.campsiteUrl}" class="button">View Campsite</a>
          </div>
          <div class="footer">
            <p>This email was sent from Camping Thailand platform.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Reply from ${data.campsiteName}

Hello ${data.guestName},

${data.ownerName} from ${data.campsiteName} has replied to your inquiry:

---
${data.replyMessage}
---

Your original message:
${data.originalMessage}

View campsite: ${data.campsiteUrl}
    `;

    return this.sendEmail({
      to: data.guestEmail,
      subject,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();

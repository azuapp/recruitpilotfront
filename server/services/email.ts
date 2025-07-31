import nodemailer from 'nodemailer';

// Debug environment variables
console.log('SMTP Configuration:', {
  host: 'smtp.gmail.com', // Fixed host
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  passExists: !!process.env.SMTP_PASS
});

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Force correct SMTP host
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: true,
  logger: true
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{messageId: string}> {
  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { messageId: result.messageId || 'unknown' };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Re-throw the error instead of returning false
  }
}

export function getApplicationConfirmationEmail(candidateName: string, position: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Application Received - RecruitPro</h2>
      <p>Dear ${candidateName},</p>
      <p>Thank you for your application for the <strong>${position}</strong> position.</p>
      <p>We have received your application and will review it shortly. Our AI system will analyze your resume and we'll get back to you with the next steps within 3-5 business days.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The RecruitPro Team</p>
    </div>
  `;
}

export function getInterviewInvitationEmail(
  candidateName: string, 
  position: string, 
  interviewDate: string, 
  interviewType: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Interview Invitation - RecruitPro</h2>
      <p>Dear ${candidateName},</p>
      <p>Congratulations! We would like to invite you for an interview for the <strong>${position}</strong> position.</p>
      <p><strong>Interview Details:</strong></p>
      <ul>
        <li>Date & Time: ${interviewDate}</li>
        <li>Type: ${interviewType}</li>
      </ul>
      <p>Please confirm your availability by replying to this email.</p>
      <p>We look forward to speaking with you!</p>
      <p>Best regards,<br>The RecruitPro Team</p>
    </div>
  `;
}

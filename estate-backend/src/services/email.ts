import transporter, { emailConfig } from "../config/email.js";
import logger from "../middleware/logging.js";

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${emailConfig.frontendUrl}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: email,
      subject: "Verify your EstateIn account",
      html: `
        <h1>Welcome to EstateIn!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
    });
  } catch (err) {
    logger.error({ err, email }, "Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${emailConfig.frontendUrl}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: email,
      subject: "Reset your EstateIn password",
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;">Reset Password</a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  } catch (err) {
    logger.error({ err, email }, "Failed to send password reset email");
  }
}

export async function sendInquiryNotification(agentEmail: string, buyerName: string, propertyTitle: string) {
  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: agentEmail,
      subject: `New inquiry from ${buyerName} for ${propertyTitle}`,
      html: `
        <h1>New Property Inquiry</h1>
        <p><strong>${buyerName}</strong> is interested in <strong>${propertyTitle}</strong>.</p>
        <p>Log in to your agent dashboard to view and respond to this inquiry.</p>
      `,
    });
  } catch (err) {
    logger.error({ err, agentEmail }, "Failed to send inquiry notification");
  }
}

export async function sendContactMessageNotification(payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
  source: string;
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || emailConfig.from;
  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: adminEmail,
      replyTo: payload.email,
      subject: `New ${payload.source} lead: ${payload.firstName} ${payload.lastName}`,
      html: `
        <h1>New Contact Message</h1>
        <p><strong>${payload.firstName} ${payload.lastName}</strong> (${payload.email}${payload.phone ? `, ${payload.phone}` : ""}) submitted the ${payload.source} form.</p>
        <p>${payload.message}</p>
      `,
    });
  } catch (err) {
    logger.error({ err, source: payload.source }, "Failed to send contact message notification");
  }
}

export async function sendListingApprovedNotification(agentEmail: string, listingTitle: string) {
  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: agentEmail,
      subject: `Your listing "${listingTitle}" has been approved`,
      html: `
        <h1>Listing Approved!</h1>
        <p>Your listing <strong>${listingTitle}</strong> has been approved and is now live on EstateIn.</p>
      `,
    });
  } catch (err) {
    logger.error({ err, agentEmail }, "Failed to send listing approved email");
  }
}

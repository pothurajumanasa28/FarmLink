/**
 * Email service for sending password reset links and authentication notifications.
 * Automatically handles development mode gracefully if SMTP is not configured.
 */
const sendPasswordResetEmail = async ({ toEmail, resetToken, hostUrl }) => {
  const resetLink = `${hostUrl || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  console.log('====================================================');
  console.log(`[EMAIL DISPATCH] Password Reset Email`);
  console.log(`To: ${toEmail}`);
  console.log(`Reset Token: ${resetToken}`);
  console.log(`Reset Link: ${resetLink}`);
  console.log('====================================================');

  // In production with valid SMTP, send actual email via nodemailer or API
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"SRGEC Farm Portal" <noreply@srgrec.edu.in>',
        to: toEmail,
        subject: 'Password Reset Request - Farm Procurement Portal',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2e7d32;">Smart Local Farm-to-Institution Procurement Portal</h2>
            <p>You requested a password reset for your account at Seshadri Rao Gudlavalleru Engineering College Procurement Portal.</p>
            <p>Click the link below to set a new password. This link is valid for 1 hour:</p>
            <p style="margin: 25px 0;">
              <a href="${resetLink}" style="background-color: #2e7d32; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
            </p>
            <p>If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #757575;">Seshadri Rao Gudlavalleru Engineering College, Gudlavalleru, AP</p>
          </div>
        `
      });
    } catch (err) {
      console.warn('[Email Warning] Could not send via SMTP transport:', err.message);
    }
  }

  return { success: true, resetLink };
};

module.exports = {
  sendPasswordResetEmail
};

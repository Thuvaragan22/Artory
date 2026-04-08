const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends the password reset email with a clickable link.
 */
exports.sendResetEmail = async (toEmail, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"Art Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1E3A5F; padding: 28px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Art Platform</h2>
        </div>
        <div style="padding: 32px;">
          <h3 style="color: #1E3A5F;">Password Reset Request</h3>
          <p style="color: #444;">You requested to reset your password. Click the button below. This link expires in <strong>15 minutes</strong>.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}"
               style="background: #1E3A5F; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px;">
              Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #bbb; font-size: 12px; margin-top: 24px;">Or copy this link: <a href="${resetUrl}" style="color:#1565C0;">${resetUrl}</a></p>
        </div>
      </div>
    `,
  });
};
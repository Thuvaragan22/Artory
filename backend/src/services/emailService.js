const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send enrollment request email to the guide
 */
exports.sendEnrollmentRequestEmail = async ({ guideEmail, guideName, learnerName, learnerEmail, courseTitle, dashboardLink, details }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f1ec; margin: 0; padding: 40px 0; }
        .wrapper { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
        .header { background: #1d1b17; padding: 40px 40px 32px; }
        .header h1 { color: #f97316; font-size: 28px; margin: 0 0 6px; }
        .header p { color: rgba(255,255,255,0.5); font-size: 14px; margin: 0; }
        .body { padding: 40px; }
        .body p { color: #555; font-size: 15px; line-height: 1.7; }
        .info-box { background: #faf9f6; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #eee; }
        .info-box p { margin: 8px 0; font-size: 14px; color: #444; }
        .info-box strong { color: #1d1b17; min-width: 120px; display: inline-block; }
        .btn { display: inline-block; margin-top: 28px; padding: 14px 32px; background: #f97316; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
        .footer { padding: 24px 40px; background: #faf9f6; text-align: center; }
        .footer p { color: #aaa; font-size: 12px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Artory</h1>
          <p>Workshop Enrollment Request</p>
        </div>
        <div class="body">
          <p>Hi <strong>${guideName}</strong>,</p>
          <p>A learner has submitted a detailed application to join your workshop. Please review their details below:</p>
          <div class="info-box">
            <p><strong>Workshop:</strong> ${courseTitle}</p>
            <hr style="border:0; border-top: 1px solid #eee; margin: 15px 0;" />
            <p><strong>Full Name:</strong> ${details?.full_name || learnerName}</p>
            <p><strong>Email:</strong> ${details?.email || learnerEmail}</p>
            <p><strong>Phone:</strong> ${details?.country_code || ''} ${details?.phone_number || 'N/A'}</p>
            <p><strong>Age:</strong> ${details?.age || 'N/A'} Years</p>
            <p><strong>DOB:</strong> ${details?.dob || 'N/A'}</p>
            <p><strong>Location:</strong> ${details?.city || 'N/A'}, ${details?.country || 'N/A'}</p>
            ${details?.gender ? `<p><strong>Gender:</strong> ${details.gender}</p>` : ''}
          </div>
          <p>Head to your dashboard to approve or decline this request:</p>
          <a href="${dashboardLink}" class="btn">Go to Dashboard &rarr;</a>
        </div>
        <div class="footer">
          <p>You received this email because you are a guide on Artory. &copy; ${new Date().getFullYear()} Artory</p>
        </div>
      </div>
    </body>
    </html>
    `;

  await transporter.sendMail({
    from: `"Artory Platform" <${process.env.EMAIL_USER}>`,
    to: guideEmail,
    subject: `📚 Enrollment Request: ${courseTitle} from ${details?.full_name || learnerName}`,
    html,
  });
};

/**
 * Send approval confirmation email to the learner
 */
exports.sendEnrollmentApprovalEmail = async ({ learnerEmail, learnerName, courseTitle, guideName, dashboardLink }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f1ec; margin: 0; padding: 40px 0; }
        .wrapper { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
        .header { background: #1d1b17; padding: 40px 40px 32px; }
        .header h1 { color: #f97316; font-size: 28px; margin: 0 0 6px; }
        .header p { color: rgba(255,255,255,0.5); font-size: 14px; margin: 0; }
        .badge { display: inline-block; background: #22c55e; color: #fff; border-radius: 50px; padding: 6px 18px; font-size: 13px; font-weight: 700; margin-bottom: 20px; }
        .body { padding: 40px; }
        .body p { color: #555; font-size: 15px; line-height: 1.7; }
        .info-box { background: #faf9f6; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #eee; }
        .info-box p { margin: 6px 0; font-size: 14px; }
        .info-box strong { color: #1d1b17; }
        .btn { display: inline-block; margin-top: 28px; padding: 14px 32px; background: #f97316; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
        .footer { padding: 24px 40px; background: #faf9f6; text-align: center; }
        .footer p { color: #aaa; font-size: 12px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Artory</h1>
          <p>Enrollment Approved!</p>
        </div>
        <div class="body">
          <span class="badge">✅ Enrollment Approved</span>
          <p>Hi <strong>${learnerName}</strong>,</p>
          <p>Great news! Your enrollment request has been approved. You are now officially enrolled in the workshop below.</p>
          <div class="info-box">
            <p>📚 <strong>Course:</strong> ${courseTitle}</p>
            <p>👩‍🏫 <strong>Guide:</strong> ${guideName}</p>
          </div>
          <p>Head to your dashboard to start your learning journey:</p>
          <a href="${dashboardLink}" class="btn">Go to My Dashboard &rarr;</a>
        </div>
        <div class="footer">
          <p>You received this email because you enrolled on Artory. &copy; ${new Date().getFullYear()} Artory</p>
        </div>
      </div>
    </body>
    </html>
    `;

  await transporter.sendMail({
    from: `"Artory Platform" <${process.env.EMAIL_USER}>`,
    to: learnerEmail,
    subject: `✅ You're In! Enrollment Approved – ${courseTitle}`,
    html,
  });
};

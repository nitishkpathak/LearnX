const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Lazy-load SMTP transporter, falling back to dynamic Ethereal Sandbox accounts if credentials are missing
 */
async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    console.log(`✉️ SMTP Transporter configured for real SMTP account: ${user}`);
  } else {
    console.log("✉️ SMTP Credentials missing in .env. Dynamically creating Ethereal Sandbox SMTP account...");
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`✉️ Ethereal SMTP account created successfully!`);
      console.log(`   User: ${testAccount.user}`);
      console.log(`   Pass: ${testAccount.pass}`);
    } catch (err) {
      console.error("✉️ Failed to create Ethereal test account, initializing offline transporter fallback:", err);
      // Fail-safe mock transporter that doesn't crash the server
      transporter = {
        sendMail: async (options) => {
          console.log(`✉️ [OFFLINE MOCK MAIL] Send attempt to ${options.to}: ${options.subject}`);
          return { messageId: 'offline-mock-id' };
        }
      };
    }
  }
  return transporter;
}

/**
 * Base mail dispatcher
 */
async function sendEmail({ to, subject, html }) {
  try {
    const activeTransporter = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"LearnX Team" <support@learnx.com>';
    
    const info = await activeTransporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html
    });

    console.log(`✉️ Email successfully dispatched to [${to}]: "${subject}"`);
    
    // Ethereal sandbox link logging
    if (typeof nodemailer.getTestMessageUrl === 'function') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🚀 [Ethereal Sandbox] E-mail Preview URL: ${previewUrl}`);
      }
    }
    return info;
  } catch (error) {
    console.error(`✉️ ERROR: Failed to dispatch email to [${to}]:`, error);
  }
}

/**
 * HTML Emails Wrapper Layout
 */
function getEmailWrapper(contentHtml, accentColor = '#6366f1') {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LearnX Alerts</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        table { border-collapse: collapse; width: 100%; }
        .wrapper { background-color: #f3f4f6; padding: 30px 15px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, ${accentColor} 0%, #312e81 100%); padding: 35px 20px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }
        .body-content { padding: 35px 30px; color: #374151; line-height: 1.6; font-size: 15px; }
        .body-content p { margin-top: 0; margin-bottom: 20px; }
        .cta-btn { display: inline-block; padding: 12px 28px; background-color: ${accentColor}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; margin: 15px 0; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2); }
        .footer { background-color: #f9fafb; padding: 25px 20px; text-align: center; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px; }
        .footer a { color: #6b7280; text-decoration: underline; }
        .card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .card-title { font-weight: bold; margin-bottom: 5px; color: #111827; }
        .badge-pill { display: inline-block; background-color: rgba(99,102,241,0.1); color: #6366f1; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>LearnX</h1>
          </div>
          <div class="body-content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p>You received this email because you are registered at LearnX E-Learning Platform.</p>
            <p>&copy; ${new Date().getFullYear()} LearnX Inc. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 1. Send Welcome Email
 */
async function sendWelcomeEmail(toEmail, userName, studentId) {
  const content = `
    <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Welcome to the family, ${userName}! 👋</h2>
    <p>We are absolutely thrilled to have you on board. LearnX is designed to give you a premium, hands-on learning experience to help you master coding, design, and web development.</p>
    
    <div class="card">
      <div class="card-title">Your Student Profile Details:</div>
      <div style="font-size: 14px; color: #4b5563; margin-top: 8px;">
        <strong>Student ID:</strong> <code style="color: #6366f1; font-weight: 600;">${studentId}</code><br>
        <strong>Email Address:</strong> ${toEmail}
      </div>
    </div>

    <p>We have pre-enrolled you in your dashboard courses so you can start learning right away! Watch video lectures, solve quizzes at the end of each lesson, submit assignments, and earn XP points to unlock exclusive badges and climb the global leaderboard!</p>
    
    <div style="text-align: center;">
      <a href="http://localhost:5000/dashboard.html" class="cta-btn">Access Student Dashboard</a>
    </div>
    
    <p style="margin-top: 25px; margin-bottom: 0;">Happy coding,<br><strong>The LearnX Team</strong></p>
  `;

  const html = getEmailWrapper(content, '#6366f1');
  return sendEmail({
    to: toEmail,
    subject: "Welcome to LearnX! Your E-Learning Portal is Ready 🚀",
    html
  });
}

/**
 * 2. Send Course Completion Congratulation Email
 */
async function sendCourseCompletionEmail(toEmail, userName, courseName) {
  const content = `
    <h2 style="margin-top: 0; color: #d97706; font-size: 22px; text-align: center;">Congratulations! Course Completed! 🎓🏆</h2>
    <p style="text-align: center; font-size: 16px; font-weight: 600;">Sensational work, ${userName}!</p>
    <p>You have successfully completed all lectures and passed every practice quiz in the course: <strong>"${courseName}"</strong>.</p>
    
    <div class="card" style="text-align: center; border-color: #f59e0b; background-color: #fef3c7; padding: 20px 15px;">
      <span style="font-size: 2.5rem;">🏆</span>
      <h3 style="margin: 10px 0 5px 0; color: #b45309; font-size: 18px;">Official Completion Certificate Unlocked</h3>
      <p style="margin: 0; font-size: 13.5px; color: #b45309; opacity: 0.9;">Your high-res PDF certificate is now ready for download inside your dashboard.</p>
    </div>

    <p>We are incredibly proud of your commitment to learning. You earned **+50 XP** for completing this course, helping you climb even higher on the student rankings leaderboard!</p>
    
    <div style="text-align: center;">
      <a href="http://localhost:5000/dashboard.html" class="cta-btn" style="background-color: #f59e0b; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.25);">Claim Certificate Now</a>
    </div>
    
    <p style="margin-top: 25px; margin-bottom: 0;">Best wishes for your future endeavors,<br><strong>The LearnX Team</strong></p>
  `;

  const html = getEmailWrapper(content, '#d97706');
  return sendEmail({
    to: toEmail,
    subject: `Congratulations! You have completed "${courseName}"! 🎓`,
    html
  });
}

/**
 * 3. Send Assignment Submitted Confirmation Email
 */
async function sendAssignmentSubmissionEmail(toEmail, userName, assignmentTitle) {
  const content = `
    <h2 style="margin-top: 0; color: #059669; font-size: 20px;">Assignment Received successfully! ✅</h2>
    <p>Hi ${userName},</p>
    <p>This is to confirm that we have successfully received your project submission for the assignment: <strong>"${assignmentTitle}"</strong>.</p>
    
    <div class="card" style="border-left: 4px solid #10b981;">
      <div style="font-weight: 600; color: #111827;">Submission Status:</div>
      <div class="badge-pill" style="background-color: rgba(16, 185, 129, 0.1); color: #059669;">Completed & Under Review</div>
      <p style="margin: 8px 0 0 0; font-size: 13.5px; color: #6b7280;">Our mentors will review your code and submission notes shortly.</p>
    </div>

    <p>By completing this task, you have earned **+150 XP** points! These points have been added directly to your profile. Go check out the leaderboard rankings to see if you have advanced!</p>
    
    <div style="text-align: center;">
      <a href="http://localhost:5000/dashboard.html" class="cta-btn" style="background-color: #10b981; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">Go to Leaderboard</a>
    </div>
    
    <p style="margin-top: 25px; margin-bottom: 0;">Keep up the great work,<br><strong>The LearnX Team</strong></p>
  `;

  const html = getEmailWrapper(content, '#10b981');
  return sendEmail({
    to: toEmail,
    subject: `Assignment Submitted: "${assignmentTitle}" Confirmation`,
    html
  });
}

module.exports = {
  sendWelcomeEmail,
  sendCourseCompletionEmail,
  sendAssignmentSubmissionEmail
};

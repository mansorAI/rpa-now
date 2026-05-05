const nodemailer = require('nodemailer');
const { query } = require('../../config/database');

const getTransporter = async (workspaceId) => {
  if (workspaceId) {
    const { rows } = await query(
      `SELECT credentials FROM integrations WHERE workspace_id = $1 AND type = 'gmail' AND is_active = true LIMIT 1`,
      [workspaceId]
    );
    if (rows[0]?.credentials?.access_token) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          accessToken: rows[0].credentials.access_token,
          refreshToken: rows[0].credentials.refresh_token,
        },
      });
    }
  }

  // Fallback to SMTP if configured
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  throw new Error('لم يتم تكوين خدمة البريد الإلكتروني');
};

const sendEmail = async ({ to, subject, body, workspaceId, from }) => {
  const transporter = await getTransporter(workspaceId);
  const result = await transporter.sendMail({
    from: from || process.env.SMTP_USER || 'noreply@automation.app',
    to,
    subject,
    html: body,
  });
  return { messageId: result.messageId };
};

const getOAuthUrl = () => {
  const { google } = require('googleapis');
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
  });
};

module.exports = { sendEmail, getOAuthUrl };

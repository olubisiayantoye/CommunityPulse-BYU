import nodemailer from 'nodemailer';

const buildPreviewMessage = ({ to, subject, text, html }) => ({
  accepted: Array.isArray(to) ? to : [to],
  rejected: [],
  envelopeTime: 0,
  messageTime: 0,
  messageId: `preview-${Date.now()}`,
  preview: {
    subject,
    text,
    html
  }
});

const hasSmtpConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.EMAIL_FROM);

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });

export const sendEmail = async ({ to, subject, text = '', html = '' }) => {
  if (!to || !subject) {
    throw new Error('Email "to" and "subject" are required');
  }

  if (hasSmtpConfig()) {
    const transporter = createTransporter();
    return transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    });
  }

  const result = buildPreviewMessage({ to, subject, text, html });

  if (process.env.NODE_ENV !== 'production') {
    console.log('[emailService] Preview email', {
      to: result.accepted,
      subject
    });
  }

  return result;
};

export const sendPasswordResetEmail = async ({ email, resetUrl, name }) =>
  sendEmail({
    to: email,
    subject: 'Reset your CommunityPulse password',
    text: `Hello ${name || 'there'}, reset your password here: ${resetUrl}`,
    html: `<p>Hello ${name || 'there'},</p><p>Reset your password <a href="${resetUrl}">here</a>.</p>`
  });

export const sendVerificationEmail = async ({ email, verificationUrl, name }) =>
  sendEmail({
    to: email,
    subject: 'Verify your CommunityPulse account',
    text: `Hello ${name || 'there'}, verify your email here: ${verificationUrl}`,
    html: `<p>Hello ${name || 'there'},</p><p>Verify your email <a href="${verificationUrl}">here</a>.</p>`
  });

export const sendWeeklySummaryEmail = async ({ email, name, organization, summary }) => {
  const categoryItems = (summary.breakdowns?.categories || [])
    .map((item) => `<li>${item.label}: ${item.count}</li>`)
    .join('');
  const statusItems = (summary.breakdowns?.statuses || [])
    .map((item) => `<li>${item.label}: ${item.count}</li>`)
    .join('');

  return sendEmail({
    to: email,
    subject: `Weekly CommunityPulse summary${organization ? ` for ${organization}` : ''}`,
    text: [
      `Hello ${name || 'there'},`,
      '',
      `Here is your weekly CommunityPulse summary${organization ? ` for ${organization}` : ''}.`,
      `Total feedback: ${summary.overview?.totalFeedback || 0}`,
      `Total upvotes: ${summary.overview?.totalUpvotes || 0}`,
      `Average sentiment score: ${summary.overview?.avgSentimentScore || 0}`,
      `Feedback with admin notes: ${summary.overview?.feedbackWithAdminNotes || 0}`,
      `Total admin notes: ${summary.overview?.totalAdminNotes || 0}`
    ].join('\n'),
    html: `
      <p>Hello ${name || 'there'},</p>
      <p>Here is your weekly CommunityPulse summary${organization ? ` for <strong>${organization}</strong>` : ''}.</p>
      <ul>
        <li>Total feedback: ${summary.overview?.totalFeedback || 0}</li>
        <li>Total upvotes: ${summary.overview?.totalUpvotes || 0}</li>
        <li>Average sentiment score: ${summary.overview?.avgSentimentScore || 0}</li>
        <li>Feedback with admin notes: ${summary.overview?.feedbackWithAdminNotes || 0}</li>
        <li>Total admin notes: ${summary.overview?.totalAdminNotes || 0}</li>
      </ul>
      <p><strong>Category breakdown</strong></p>
      <ul>${categoryItems || '<li>No category activity this week.</li>'}</ul>
      <p><strong>Status breakdown</strong></p>
      <ul>${statusItems || '<li>No status changes this week.</li>'}</ul>
    `
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWeeklySummaryEmail
};

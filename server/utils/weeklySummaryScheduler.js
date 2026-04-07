import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { sendWeeklySummaryEmail } from './emailService.js';
import { buildExportQuery, getSummaryReport } from './reportingService.js';

const POLL_INTERVAL_MS = 60 * 60 * 1000;
let schedulerHandle = null;
let schedulerRunning = false;

export const initializeWeeklySummaryScheduler = () => {
  if (process.env.WEEKLY_SUMMARY_EMAILS_ENABLED !== 'true') {
    return;
  }

  if (schedulerHandle) {
    return;
  }

  void maybeSendWeeklySummaries();
  schedulerHandle = setInterval(() => {
    void maybeSendWeeklySummaries();
  }, POLL_INTERVAL_MS);
};

const maybeSendWeeklySummaries = async () => {
  if (schedulerRunning || !isScheduledSendWindow()) {
    return;
  }

  schedulerRunning = true;

  try {
    const organizations = await User.findIncludingInactive({
      role: 'admin',
      isActive: true
    }).distinct('organization');

    for (const organization of organizations.filter(Boolean)) {
      const weekKey = getCurrentWeekKey();
      const alreadySent = await AuditLog.findOne({
        action: 'analytics.weekly_summary_email_sent',
        'details.weekKey': weekKey,
        'details.organization': organization
      }).lean();

      if (alreadySent) {
        continue;
      }

      const recipients = await User.findIncludingInactive({
        organization,
        role: 'admin',
        isActive: true,
        isVerified: true
      })
        .select('name email organization')
        .lean();

      if (recipients.length === 0) {
        continue;
      }

      const query = await buildExportQuery({ days: 7, organization });
      const summary = await getSummaryReport(query, { organization });

      for (const recipient of recipients) {
        await sendWeeklySummaryEmail({
          email: recipient.email,
          name: recipient.name,
          organization,
          summary
        });
      }

      await AuditLog.record({
        actor: null,
        action: 'analytics.weekly_summary_email_sent',
        targetType: 'Analytics',
        details: {
          organization,
          weekKey,
          recipients: recipients.map((recipient) => recipient.email),
          totalFeedback: summary.overview.totalFeedback
        },
        severity: 'info'
      });
    }
  } catch (error) {
    console.error('Weekly summary scheduler failed:', error);
  } finally {
    schedulerRunning = false;
  }
};

const isScheduledSendWindow = () => {
  const now = new Date();
  const scheduledDay = normalizeDay(process.env.WEEKLY_SUMMARY_EMAIL_DAY || 'MONDAY');
  const scheduledHour = Number(process.env.WEEKLY_SUMMARY_EMAIL_HOUR || 8);

  return now.getDay() === scheduledDay && now.getHours() === scheduledHour;
};

const normalizeDay = (value) => {
  const dayMap = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
  };

  return dayMap[String(value || '').toUpperCase()] ?? 1;
};

const getCurrentWeekKey = () => {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

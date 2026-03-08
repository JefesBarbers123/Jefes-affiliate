import { Resend } from "resend";
import { emailLogsTable, isAirtableConfigured } from "./airtable";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY. Check your environment variables.");
}

export const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_BOOKINGS = "Bookings <no-reply@yourbarberplatform.com>";
const FROM_UPDATES = "Updates <no-reply@yourbarberplatform.com>";
const FROM_REMINDERS = "Reminders <no-reply@yourbarberplatform.com>";

function formatMoneyGBP(amount: number) {
  return `£${amount.toFixed(2)}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function writeEmailLog(params: {
  type: string;
  to: string;
  subject: string;
  status: "Sent" | "Failed";
  resendMessageId?: string;
  errorMessage?: string;
  context?: Record<string, unknown>;
}) {
  if (!isAirtableConfigured || !emailLogsTable) return;
  const { type, to, subject, status, resendMessageId, errorMessage, context } = params;
  try {
    await emailLogsTable.create({
      Type: type,
      To: to,
      Subject: subject,
      Status: status,
      "Sent At": new Date().toISOString(),
      ...(resendMessageId ? { "Resend Message ID": resendMessageId } : {}),
      ...(errorMessage ? { "Error Message": errorMessage.slice(0, 1000) } : {}),
      ...(context ? { Context: JSON.stringify(context).slice(0, 50000) } : {}),
    });
  } catch (logErr) {
    console.error("Email log write failed:", logErr);
  }
}

async function sendTrackedEmail(params: {
  type: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  context?: Record<string, unknown>;
}) {
  const { type, to, from, subject, html, context } = params;
  try {
    const result = await resend.emails.send({ from, to, subject, html });
    const maybeError = (result as { error?: unknown }).error;
    if (maybeError) {
      throw new Error(getErrorMessage(maybeError));
    }
    const resendMessageId =
      (result as { id?: string; data?: { id?: string } }).id ??
      (result as { id?: string; data?: { id?: string } }).data?.id;
    await writeEmailLog({
      type,
      to,
      subject,
      status: "Sent",
      resendMessageId,
      context,
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    await writeEmailLog({
      type,
      to,
      subject,
      status: "Failed",
      errorMessage,
      context,
    });
    throw error;
  }
}

export async function sendSignupConfirmationEmail(params: {
  to: string;
  barberName: string;
}) {
  const { to, barberName } = params;
  await sendTrackedEmail({
    type: "signup_confirmation",
    from: FROM_UPDATES,
    to,
    subject: "Your Jefes Affiliates account is set up",
    context: { barberName },
    html: `
      <p>Hi ${barberName},</p>
      <p>Your account has been successfully set up with <strong>Jefes Affiliates</strong>.</p>
      <p>You can now log in, manage your availability, and receive additional barber work around the UK.</p>
      <p>Thank you,<br/>Jefes Affiliates</p>
    `,
  });
}

export async function sendBarberApprovalEmail(params: {
  to: string;
  barberName: string;
  location: string;
  date: string;
  approveUrl: string;
  declineUrl: string;
}) {
  const { to, barberName, location, date, approveUrl, declineUrl } = params;

  await sendTrackedEmail({
    type: "work_sent",
    from: FROM_BOOKINGS,
    to,
    subject: `New work opportunity: ${location} on ${date}`,
    context: { barberName, location, date },
    html: `
      <p>Hi ${barberName},</p>
      <p>We have sent you new barber work at <strong>${location}</strong> on <strong>${date}</strong>.</p>
      <p>Please confirm this booking:</p>
      <p>
        <a href="${approveUrl}">✅ Approve</a> |
        <a href="${declineUrl}">❌ Decline</a>
      </p>
      <p>Thank you,<br/>Jefes Affiliates</p>
    `,
  });
}

export async function sendBookingConfirmedEmail(params: {
  to: string;
  barberName: string;
  location: string;
  date: string;
}) {
  const { to, barberName, location, date } = params;
  await sendTrackedEmail({
    type: "booking_confirmed",
    from: FROM_BOOKINGS,
    to,
    subject: `Booking confirmed: ${location} on ${date}`,
    context: { barberName, location, date },
    html: `
      <p>Hi ${barberName},</p>
      <p>Your booking at <strong>${location}</strong> on <strong>${date}</strong> is now confirmed.</p>
      <p>Thank you,<br/>Jefes Affiliates</p>
    `,
  });
}

export async function sendBookingCancelledEmail(params: {
  to: string;
  barberName: string;
  location: string;
  date: string;
}) {
  const { to, barberName, location, date } = params;
  await sendTrackedEmail({
    type: "booking_cancelled",
    from: FROM_UPDATES,
    to,
    subject: `Booking update: ${location} on ${date} has been cancelled`,
    context: { barberName, location, date },
    html: `
      <p>Hi ${barberName},</p>
      <p>Your booking at <strong>${location}</strong> on <strong>${date}</strong> has been cancelled.</p>
      <p>We will notify you as soon as new filler work is available.</p>
      <p>Thank you,<br/>Jefes Affiliates</p>
    `,
  });
}

export async function sendPayoutPaidEmail(params: {
  to: string;
  barberName: string;
  amount: number;
}) {
  const { to, barberName, amount } = params;
  await sendTrackedEmail({
    type: "payout_paid",
    from: FROM_UPDATES,
    to,
    subject: `Payout sent: ${formatMoneyGBP(amount)} has been paid`,
    context: { barberName, amount },
    html: `
      <p>Hi ${barberName},</p>
      <p>Your payout of <strong>${formatMoneyGBP(amount)}</strong> has been sent to your account.</p>
      <p>Please allow normal bank processing time for it to appear in your balance.</p>
      <p>Thank you,<br/>Jefes Affiliates</p>
    `,
  });
}

export async function sendReferralBonusEmail(params: {
  to: string;
  barberName: string;
  referredBarberName: string;
  location: string;
  date: string;
  bonusAmount: number;
}) {
  const { to, barberName, referredBarberName, location, date, bonusAmount } = params;
  await sendTrackedEmail({
    type: "referral_bonus",
    from: FROM_UPDATES,
    to,
    subject: `You earned a 10% referral bonus: ${formatMoneyGBP(bonusAmount)}`,
    context: { barberName, referredBarberName, location, date, bonusAmount },
    html: `
      <p>Hi ${barberName},</p>
      <p>You earned an additional <strong>${formatMoneyGBP(bonusAmount)}</strong> in referral bonus.</p>
      <p>
        Trigger: <strong>${referredBarberName}</strong> completed work at
        <strong> ${location}</strong> on <strong>${date}</strong>.
      </p>
      <p style="color:#71717a;font-size:12px;">
        This 10% bonus is funded by Jefes Affiliates and is not deducted from the referred barber's wage.
      </p>
      <p>Thank you,<br/>Jefes Affiliates</p>
    `,
  });
}

export async function sendAppointmentReminderEmail(params: {
  to: string;
  barberName: string;
  location: string;
  date: string;
}) {
  const { to, barberName, location, date } = params;

  await sendTrackedEmail({
    type: "appointment_reminder",
    from: FROM_REMINDERS,
    to,
    subject: `Reminder: Appointment at ${location} on ${date}`,
    context: { barberName, location, date },
    html: `
      <p>Hi ${barberName},</p>
      <p>This is a reminder for your upcoming appointment at <strong>${location}</strong> on <strong>${date}</strong>.</p>
      <p>Please ensure you arrive on time and prepared.</p>
      <p>Thank you,<br/>Jefes Affiliates</p>
    `,
  });
}


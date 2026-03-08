import Airtable from "airtable";

const {
  AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID,
  AIRTABLE_BARBERS_TABLE = "Barbers",
  AIRTABLE_APPOINTMENTS_TABLE = "Appointments",
  AIRTABLE_AVAILABILITY_TABLE = "Availability",
  AIRTABLE_WITHDRAWALS_TABLE = "Withdrawals",
  AIRTABLE_EMAIL_LOGS_TABLE = "Email Logs",
} = process.env;

const isPlaceholder = (v: string | undefined) =>
  !v || v === "your_airtable_api_key" || v === "appXXXXXXXXXXXXXX";

export const isAirtableConfigured =
  !!AIRTABLE_API_KEY &&
  !!AIRTABLE_BASE_ID &&
  !isPlaceholder(AIRTABLE_API_KEY) &&
  !isPlaceholder(AIRTABLE_BASE_ID);

const base = isAirtableConfigured
  ? new Airtable({ apiKey: AIRTABLE_API_KEY! }).base(AIRTABLE_BASE_ID!)
  : null;

export const barbersTable = base ? base(AIRTABLE_BARBERS_TABLE!) : null;
export const appointmentsTable = base
  ? base(AIRTABLE_APPOINTMENTS_TABLE!)
  : null;
export const availabilityTable = base
  ? base(AIRTABLE_AVAILABILITY_TABLE!)
  : null;
export const withdrawalsTable = base
  ? base(AIRTABLE_WITHDRAWALS_TABLE!)
  : null;
export const emailLogsTable = base
  ? base(AIRTABLE_EMAIL_LOGS_TABLE!)
  : null;

export type BarberRecordFields = {
  Name: string;
  Email: string;
  Phone?: string;
  "Barber ID"?: string;
  "Password Hash"?: string;
  "Work Image 1 URL"?: string;
  "Work Image 2 URL"?: string;
  "Work Image 3 URL"?: string;
  "Referral Code"?: string;
  "Referring Barber ID"?: string | string[];
  "Total Earnings"?: number;
  "Bank Details"?: string;
  "Contract Status"?: boolean;
  "PDF Contract URL"?: string;
  "Contract Signed At"?: string;
  "Contract Signature Data"?: string;
};

export type AppointmentStatus = "Pending" | "Approved" | "Completed" | "Cancelled";
export type InvoiceStatus = "Sent" | "Paid" | "None" | "";

export type AppointmentRecordFields = {
  Location: string;
  Date: string;
  "Day Rate": number;
  "Barber Assigned"?: string | string[];
  Status?: AppointmentStatus;
  "Invoice Status"?: InvoiceStatus;
};

export type AvailabilityStatus = "Available" | "Booked";

export type AvailabilityRecordFields = {
  "Barber ID": string | string[];
  Date: string;
  Status: AvailabilityStatus;
};

export type WithdrawalStatus = "Requested" | "Approved" | "Paid" | "Rejected";

export type WithdrawalRecordFields = {
  Barber: string | string[];
  Amount: number;
  Status: WithdrawalStatus;
  "Requested At"?: string;
  "Processed At"?: string;
  Note?: string;
};

export type EmailLogStatus = "Sent" | "Failed";

export type EmailLogRecordFields = {
  Type: string;
  To: string;
  Subject: string;
  Status: EmailLogStatus;
  "Sent At": string;
  "Resend Message ID"?: string;
  "Error Message"?: string;
  Context?: string;
};

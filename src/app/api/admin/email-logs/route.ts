import { NextResponse } from "next/server";
import { emailLogsTable, isAirtableConfigured } from "@/lib/airtable";

type EmailLogItem = {
  id: string;
  type: string;
  to: string;
  subject: string;
  status: string;
  sentAt: string;
  resendMessageId: string;
  errorMessage: string;
  context: string;
};

export async function GET() {
  if (!isAirtableConfigured || !emailLogsTable) {
    return NextResponse.json({ items: [] as EmailLogItem[], tableReady: false });
  }

  try {
    const records = await emailLogsTable
      .select({
        sort: [{ field: "Sent At", direction: "desc" }],
        maxRecords: 200,
      })
      .all();

    const items: EmailLogItem[] = records.map((record) => ({
      id: record.id,
      type: ((record.get("Type") as string) ?? ""),
      to: ((record.get("To") as string) ?? ""),
      subject: ((record.get("Subject") as string) ?? ""),
      status: ((record.get("Status") as string) ?? ""),
      sentAt: ((record.get("Sent At") as string) ?? ""),
      resendMessageId: ((record.get("Resend Message ID") as string) ?? ""),
      errorMessage: ((record.get("Error Message") as string) ?? ""),
      context: ((record.get("Context") as string) ?? ""),
    }));

    return NextResponse.json({ items, tableReady: true });
  } catch (err) {
    console.error("Failed to fetch email logs:", err);
    return NextResponse.json({ items: [] as EmailLogItem[], tableReady: false });
  }
}

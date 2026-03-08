import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
const BARBERS_FILE = path.join(LOCAL_DATA_DIR, "barbers.json");

export type LocalBarber = {
  id: string;
  Name: string;
  Email: string;
  Phone?: string;
  "Barber ID"?: string;
  "Password Hash"?: string;
  "Work Image 1 URL"?: string;
  "Work Image 2 URL"?: string;
  "Work Image 3 URL"?: string;
  "Referral Code": string;
  "Bank Details": string;
  "Referring Barber ID"?: string;
  "Contract Status": boolean;
  "Contract Signed At"?: string;
  "Contract Signature Data"?: string;
  "PDF Contract URL"?: string;
};

async function ensureDataDir() {
  await mkdir(LOCAL_DATA_DIR, { recursive: true });
}

export async function readBarbers(): Promise<LocalBarber[]> {
  await ensureDataDir();
  try {
    const raw = await readFile(BARBERS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeBarbers(barbers: LocalBarber[]) {
  await ensureDataDir();
  await writeFile(BARBERS_FILE, JSON.stringify(barbers, null, 2), "utf-8");
}

export function isLocalBarberId(id: string) {
  return id.startsWith("local_");
}

export async function getLocalBarberById(id: string): Promise<LocalBarber | null> {
  const barbers = await readBarbers();
  return barbers.find((b) => b.id === id) ?? null;
}

export async function getLocalBarberByEmail(email: string): Promise<LocalBarber | null> {
  const barbers = await readBarbers();
  const normalized = email.trim().toLowerCase();
  return (
    barbers.find((b) => b.Email.trim().toLowerCase() === normalized) ?? null
  );
}

export async function findLocalBarberByReferralCode(code: string): Promise<LocalBarber | null> {
  const barbers = await readBarbers();
  return barbers.find((b) => b["Referral Code"] === code) ?? null;
}

export async function createLocalBarber(fields: {
  name: string;
  email: string;
  phone?: string;
  barberCustomId?: string;
  passwordHash?: string;
  bankDetails?: string;
  referralCode: string;
  referringBarberId?: string;
}): Promise<LocalBarber> {
  const barbers = await readBarbers();
  const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const barber: LocalBarber = {
    id,
    Name: fields.name,
    Email: fields.email,
    ...(fields.phone ? { Phone: fields.phone } : {}),
    ...(fields.barberCustomId ? { "Barber ID": fields.barberCustomId } : {}),
    ...(fields.passwordHash ? { "Password Hash": fields.passwordHash } : {}),
    "Referral Code": fields.referralCode,
    "Bank Details": fields.bankDetails ?? "",
    "Contract Status": false,
    ...(fields.referringBarberId
      ? { "Referring Barber ID": fields.referringBarberId }
      : {}),
  };
  barbers.push(barber);
  await writeBarbers(barbers);
  return barber;
}

export async function updateLocalBarber(
  id: string,
  updates: Partial<LocalBarber>
) {
  const barbers = await readBarbers();
  const i = barbers.findIndex((b) => b.id === id);
  if (i === -1) return;
  barbers[i] = { ...barbers[i], ...updates };
  await writeBarbers(barbers);
}

/** Barber record-like shape so barber dashboard can use .get("Name") etc. */
export function toRecordLike(barber: LocalBarber): { id: string; get: (key: string) => unknown } {
  return {
    id: barber.id,
    get(key: string) {
      return (barber as Record<string, unknown>)[key];
    },
  };
}

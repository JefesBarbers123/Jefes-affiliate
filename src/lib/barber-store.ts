import { isAirtableConfigured, barbersTable } from "./airtable";
import {
  isLocalBarberId,
  getLocalBarberById,
  getLocalBarberByEmail,
  findLocalBarberByReferralCode,
  createLocalBarber,
  updateLocalBarber,
  toRecordLike,
  type LocalBarber,
} from "./local-barbers";
import { hashPassword } from "./password";

export type BarberRecordLike = { id: string; get: (key: string) => unknown };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getBarberById(barberId: string): Promise<BarberRecordLike | null> {
  if (isLocalBarberId(barberId)) {
    const b = await getLocalBarberById(barberId);
    return b ? toRecordLike(b) : null;
  }
  if (isAirtableConfigured && barbersTable) {
    try {
      const record = await barbersTable.find(barberId);
      return record as unknown as BarberRecordLike;
    } catch {
      return null;
    }
  }
  return null;
}

export async function findBarberByEmail(email: string): Promise<BarberRecordLike | null> {
  const normalizedEmail = normalizeEmail(email);

  if (isAirtableConfigured && barbersTable) {
    try {
      const results = await barbersTable
        .select({
          filterByFormula: `LOWER(TRIM({Email})) = '${normalizedEmail.replace(
            /'/g,
            "\\'"
          )}'`,
          maxRecords: 1,
        })
        .firstPage();
      if (results.length > 0) return results[0] as unknown as BarberRecordLike;
    } catch {
      // fall through to local
    }
  }
  const local = await getLocalBarberByEmail(email);
  return local ? toRecordLike(local) : null;
}

export async function resolveReferralCode(code: string): Promise<string | null> {
  if (!code) return null;
  if (isAirtableConfigured && barbersTable) {
    try {
      const results = await barbersTable
        .select({
          filterByFormula: `{Referral Code} = '${code.replace(/'/g, "\\'")}'`,
          maxRecords: 1,
        })
        .firstPage();
      if (results.length > 0) return results[0].id;
    } catch {
      // fall through
    }
  }
  const local = await findLocalBarberByReferralCode(code);
  return local?.id ?? null;
}

export async function createBarber(params: {
  name: string;
  email: string;
  phone?: string;
  barberCustomId?: string;
  password?: string;
  bankDetails?: string;
  referralCode: string;
  referringCode?: string;
}): Promise<{ id: string; name: string; email: string; referralCode: string }> {
  const normalizedEmail = normalizeEmail(params.email);
  const referringBarberId = params.referringCode
    ? await resolveReferralCode(params.referringCode)
    : undefined;

  if (isAirtableConfigured && barbersTable) {
    const airtableReferrer =
      referringBarberId && !isLocalBarberId(referringBarberId)
        ? referringBarberId
        : undefined;
    const created = await barbersTable.create({
      Name: params.name,
      Email: normalizedEmail,
      ...(params.phone ? { Phone: params.phone.trim() } : {}),
      ...(params.barberCustomId ? { "Barber ID": params.barberCustomId.trim() } : {}),
      ...(params.password ? { "Password Hash": hashPassword(params.password) } : {}),
      "Referral Code": params.referralCode,
      "Bank Details": params.bankDetails ?? "",
      "Contract Status": false,
      ...(airtableReferrer ? { "Referring Barber ID": [airtableReferrer] } : {}),
    });
    return {
      id: created.id,
      name: params.name,
      email: normalizedEmail,
      referralCode: params.referralCode,
    };
  }

  const local = await createLocalBarber({
    name: params.name,
    email: normalizedEmail,
    phone: params.phone,
    barberCustomId: params.barberCustomId,
    passwordHash: params.password ? hashPassword(params.password) : undefined,
    bankDetails: params.bankDetails,
    referralCode: params.referralCode,
    referringBarberId: referringBarberId ?? undefined,
  });
  return {
    id: local.id,
    name: local.Name,
    email: local.Email,
    referralCode: local["Referral Code"],
  };
}

export async function updateBarberContract(
  barberId: string,
  updates: {
    "Contract Status": boolean;
    "Contract Signed At": string;
    "Contract Signature Data": string;
    "PDF Contract URL": string;
  }
) {
  if (isLocalBarberId(barberId)) {
    await updateLocalBarber(barberId, updates);
    return;
  }
  if (isAirtableConfigured && barbersTable) {
    await barbersTable.update(barberId, updates);
  }
}

export async function updateBarberProfile(
  barberId: string,
  updates: {
    Name?: string;
    Email?: string;
    Phone?: string;
    "Barber ID"?: string;
    "Bank Details"?: string;
    "Password Hash"?: string;
    "Work Image 1 URL"?: string;
    "Work Image 2 URL"?: string;
    "Work Image 3 URL"?: string;
  }
) {
  if (isLocalBarberId(barberId)) {
    await updateLocalBarber(barberId, updates);
    return;
  }
  if (isAirtableConfigured && barbersTable) {
    await barbersTable.update(barberId, updates);
  }
}

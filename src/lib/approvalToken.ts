import crypto from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET. Check your environment variables.");
}

function base64UrlEncode(input: Buffer) {
  return input
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = 4 - (input.length % 4);
  if (pad !== 4) {
    input += "=".repeat(pad);
  }
  return Buffer.from(input, "base64");
}

export function createApprovalToken(appointmentId: string, barberId: string) {
  const payload = `${appointmentId}:${barberId}`;
  const hmac = crypto.createHmac("sha256", AUTH_SECRET);
  hmac.update(payload);
  const signature = hmac.digest();

  return `${base64UrlEncode(Buffer.from(payload))}.${base64UrlEncode(
    signature
  )}`;
}

export function verifyApprovalToken(token: string) {
  const [payloadPart, sigPart] = token.split(".");
  if (!payloadPart || !sigPart) return null;

  const payloadBuf = base64UrlDecode(payloadPart);
  const sigBuf = base64UrlDecode(sigPart);

  const hmac = crypto.createHmac("sha256", AUTH_SECRET);
  hmac.update(payloadBuf);
  const expectedSig = hmac.digest();

  if (
    expectedSig.length !== sigBuf.length ||
    !crypto.timingSafeEqual(expectedSig, sigBuf)
  ) {
    return null;
  }

  const payload = payloadBuf.toString("utf8");
  const [appointmentId, barberId] = payload.split(":");
  if (!appointmentId || !barberId) return null;

  return { appointmentId, barberId };
}


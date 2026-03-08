export const COOKIE_NAME = "barber_auth";

// For this implementation, the auth token is simply the Airtable Barber record ID.
// In a production system, you would likely replace this with a signed token.

export function createAuthToken(barberId: string) {
  return barberId;
}

export function parseAuthToken(token: string | undefined | null): string | null {
  if (!token) return null;
  return token;
}


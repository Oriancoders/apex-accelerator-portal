const SF_AUTHORIZE_URL = "https://test.salesforce.com/services/oauth2/authorize";
const SF_REVOKE_PATH = "/services/oauth2/revoke";

const FRONTEND_STATE_KEY = "sf_oauth_state";
const FRONTEND_STATE_BACKUP_KEY = "sf_oauth_state_backup";

type OAuthState = {
  ticketId: string;
  nonce: string;
  createdAt: number;
};

function toBase64(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

function fromBase64(input: string): string {
  return decodeURIComponent(escape(atob(input)));
}

function generateNonce(length = 24): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const random = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < random.length; i += 1) {
    out += charset[random[i] % charset.length];
  }
  return out;
}

function getRedirectUri(): string {
  return import.meta.env.VITE_SF_REDIRECT_URI || `${window.location.origin}/oauth/callback`;
}

function getClientId(): string {
  const clientId = (import.meta.env.VITE_SF_CLIENT_ID || "")
    .toString()
    .trim()
    .replace(/^"|"$/g, "");
  if (!clientId) {
    throw new Error("Salesforce client id is missing. Configure VITE_SF_CLIENT_ID and restart dev server.");
  }
  return clientId;
}

function normalizeState(value: string): string {
  let normalized = (value || "").trim();
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Keep original if it is already decoded.
  }
  // Querystring decoders can convert '+' to spaces.
  return normalized.replace(/ /g, "+");
}

export function isProductionOrg(instanceUrl: string): boolean {
  try {
    const url = new URL(instanceUrl);
    const host = url.hostname.toLowerCase();

    if (host === "login.salesforce.com") {
      return true;
    }

    if (!host.includes("salesforce.com")) {
      return true;
    }

    const looksSandbox = host.includes("sandbox") || host.startsWith("cs") || host.includes("test.salesforce.com");
    return !looksSandbox;
  } catch {
    return true;
  }
}

export function buildOAuthURL(ticketId: string): string {
  if (!ticketId) {
    throw new Error("Ticket id is required.");
  }

  if (isProductionOrg("https://test.salesforce.com")) {
    throw new Error("OAuth target must be sandbox-only.");
  }

  const statePayload: OAuthState = {
    ticketId,
    nonce: generateNonce(),
    createdAt: Date.now(),
  };

  const state = toBase64(JSON.stringify(statePayload));
  sessionStorage.setItem(FRONTEND_STATE_KEY, state);
  localStorage.setItem(FRONTEND_STATE_BACKUP_KEY, state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    scope: "api refresh_token offline_access",
    state,
  });

  return `${SF_AUTHORIZE_URL}?${params.toString()}`;
}

export function verifyState(returnedState: string): { ticketId: string } {
  const normalizedReturned = normalizeState(returnedState || "");
  const expectedSession = sessionStorage.getItem(FRONTEND_STATE_KEY);
  const expectedBackup = localStorage.getItem(FRONTEND_STATE_BACKUP_KEY);

  const candidates = [expectedSession, expectedBackup]
    .filter((v): v is string => Boolean(v))
    .map((v) => normalizeState(v));

  if (!normalizedReturned || candidates.length === 0 || !candidates.includes(normalizedReturned)) {
    throw new Error("OAuth state validation failed.");
  }

  let decoded: OAuthState;
  try {
    decoded = JSON.parse(fromBase64(normalizedReturned)) as OAuthState;
  } catch {
    throw new Error("OAuth state payload is invalid.");
  }

  if (!decoded.ticketId || !decoded.nonce) {
    throw new Error("OAuth state payload is incomplete.");
  }

  if (Date.now() - decoded.createdAt > 1000 * 60 * 15) {
    throw new Error("OAuth state has expired. Please try again.");
  }

  sessionStorage.removeItem(FRONTEND_STATE_KEY);
  localStorage.removeItem(FRONTEND_STATE_BACKUP_KEY);
  return { ticketId: decoded.ticketId };
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No active session. Please sign in again.");
  }

  return session.access_token;
}

export async function exchangeCodeForTokens(code: string) {
  if (!code) {
    throw new Error("Missing authorization code.");
  }

  const token = await getAccessToken();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sf-api/exchange-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ code }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || "Token exchange failed.");
  }

  return payload;
}

export async function fetchObjects(instanceUrl: string, accessToken: string) {
  if (!instanceUrl || !accessToken) {
    throw new Error("Missing Salesforce connection context.");
  }

  const response = await fetch(`${instanceUrl}/services/data/v59.0/sobjects/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.[0]?.message || "Unable to fetch Salesforce objects.");
  }

  return payload;
}

export async function revokeToken(instanceUrl: string, accessToken: string) {
  if (!instanceUrl || !accessToken) {
    throw new Error("Missing Salesforce token context.");
  }

  const url = new URL(SF_REVOKE_PATH, instanceUrl);
  url.searchParams.set("token", accessToken);

  const response = await fetch(url.toString(), { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to revoke Salesforce token.");
  }
}

export async function fetchObjectsForTicket(ticketId: string) {
  if (!ticketId) {
    throw new Error("Ticket id is required.");
  }

  const token = await getAccessToken();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sf-api/objects?ticketId=${encodeURIComponent(ticketId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || "Unable to fetch objects from backend.");
  }

  return payload;
}

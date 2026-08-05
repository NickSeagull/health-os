const BASE_URL = "https://api.prod.whoop.com";
const CLIENT_ID = ""; // Cognito client ID — injected at build time if needed

interface TokenData {
  accessToken: string;
  expiresAt: number;
}

let tokenData: TokenData | null = null;

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Europe/Moscow";
  }
}

function makeHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Host: "api.prod.whoop.com",
    Accept: "*/*",
    "User-Agent": "iOS",
    "Content-Type": "application/json",
    "X-WHOOP-Device-Platform": "iOS",
    "X-WHOOP-Time-Zone": getTimezone(),
    Locale: "en_US",
    Currency: "USD",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

async function login(): Promise<void> {
  const email = process.env.WHOOP_EMAIL;
  const password = process.env.WHOOP_PASSWORD;
  if (!email || !password) {
    throw new Error("WHOOP_EMAIL and WHOOP_PASSWORD must be set in .env.local");
  }

  const response = await fetch(`${BASE_URL}/auth-service/v3/whoop`, {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify({
      AuthParameters: { USERNAME: email, PASSWORD: password },
      ClientId: CLIENT_ID,
      AuthFlow: "USER_PASSWORD_AUTH",
    }),
  });

  if (!response.ok) {
    throw new Error(`WHOOP auth failed: ${response.status}`);
  }

  const data = await response.json();
  const result = data.AuthenticationResult;
  tokenData = {
    accessToken: result.AccessToken,
    expiresAt: Date.now() + result.ExpiresIn * 1000,
  };
}

async function ensureValidToken(): Promise<string> {
  if (!tokenData || Date.now() > tokenData.expiresAt - 300000) {
    await login();
  }
  return tokenData!.accessToken;
}

async function whoopFetch<T>(path: string): Promise<T> {
  let retried = false;

  while (true) {
    const token = await ensureValidToken();
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: makeHeaders(token),
    });

    if (response.status === 401 && !retried) {
      retried = true;
      tokenData = null;
      continue;
    }

    if (!response.ok) {
      throw new Error(`WHOOP API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getHomeData(date?: string) {
  return whoopFetch(`/home-service/v1/home?date=${date ?? today()}`);
}

export async function getRecoveryDeepDive(date?: string) {
  return whoopFetch(`/home-service/v1/deep-dive/recovery?date=${date ?? today()}`);
}

export async function getSleepDeepDive(date?: string) {
  return whoopFetch(`/home-service/v1/deep-dive/sleep?date=${date ?? today()}`);
}

export async function getStrainDeepDive(date?: string) {
  return whoopFetch(`/home-service/v1/deep-dive/strain?date=${date ?? today()}`);
}

export async function getHistoryDays(days: number = 30) {
  const results = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    try {
      const data = await getHomeData(dateStr);
      results.push({ date: dateStr, ...(data as Record<string, unknown>) });
    } catch {
      // skip failed days
    }
  }

  return results.reverse();
}

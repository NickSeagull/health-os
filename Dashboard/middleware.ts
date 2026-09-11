import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protect mutating requests from a malicious browser tab.
 *
 * The dashboard is bound to `127.0.0.1`, which protects against attackers on the network.
 * Loopback binding provides **no CSRF protection**: the victim's browser runs
 * on the same machine, so a page open in another tab can send a request to
 * `127.0.0.1:3000` and reach the same server.
 *
 * This was verified before this file was created: `PUT /api/profile`
 * with a foreign `Origin` and `Content-Type: text/plain` returned
 * `{"success":true}` and overwrote the profile's `basic` block — date of birth,
 * sex, and height. The `text/plain` type is deliberate: it is a "simple"
 * request and does not trigger a preflight, so the browser sends it without
 * prior permission from the server.
 *
 * This closes two attack vectors:
 *
 * 1. **CSRF.** Mutating requests are checked against `Origin` and `Sec-Fetch-Site`.
 *    The browser sets these headers, and a page cannot forge them.
 * 2. **DNS rebinding.** An attacker's domain resolving to `127.0.0.1`
 *    bypasses loopback binding. Its `Host` header remains foreign,
 *    so it is checked separately.
 *
 * A request without `Origin` and `Sec-Fetch-Site` comes from `curl` or a
 * script, not a browser. It is allowed: it is not a CSRF vector, and anyone
 * already executing commands on the machine does not need to bypass the dashboard.
 */

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** A host is trusted when it is a loopback interface. The port is irrelevant. */
function isLoopbackHost(host: string | null): boolean {
  if (!host) return false;
  // Possible forms: 127.0.0.1:3000, localhost:3000, [::1]:3000
  const hostname = host.startsWith("[")
    ? host.slice(0, host.indexOf("]") + 1)
    : host.split(":")[0];
  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

function originMatchesHost(origin: string, host: string | null): boolean {
  if (!host) return false;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  return isLoopbackHost(parsed.host) && parsed.host === host;
}

function deny(reason: string): NextResponse {
  return NextResponse.json(
    {
      error:
        "Request rejected: it did not come from the dashboard. " +
        "This looks like an external site attempting to change your data " +
        "through the dashboard open on this machine.",
      reason,
    },
    { status: 403 }
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  // DNS rebinding: a foreign name resolving to 127.0.0.1 arrives with a foreign Host
  if (!isLoopbackHost(host)) {
    return deny("host-not-loopback");
  }

  if (!UNSAFE.has(request.method)) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  if (origin !== null) {
    return originMatchesHost(origin, host)
      ? NextResponse.next()
      : deny("origin-mismatch");
  }

  // Origin is absent. Modern browsers always send it for mutating requests,
  // so check Fetch metadata as a second signal.
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin" && site !== "none") {
    return deny("cross-site-fetch");
  }

  // Neither Origin nor Sec-Fetch-Site: the request is not from a browser.
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};

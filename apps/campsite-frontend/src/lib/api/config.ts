/**
 * API Configuration
 *
 * Determines the API base URL based on environment:
 * - NEXT_PUBLIC_API_URL env var takes priority if set
 * - Otherwise, auto-detects based on current hostname:
 *   - localhost:3090 → http://localhost:3091
 *   - campsite.earn.dev.rawinlab.com → https://campsite-api.earn.dev.rawinlab.com
 */

function resolveApiUrl(): string {
  // 1. Explicit env var always wins
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Client-side: detect from browser hostname
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3091';
    }

    if (hostname === 'campsite.earn.dev.rawinlab.com') {
      return `${protocol}//campsite-api.earn.dev.rawinlab.com`;
    }

    // Fallback: assume API is on api. subdomain
    return `${protocol}//api.${hostname}`;
  }

  // 3. Server-side fallback (SSR, API routes)
  return 'http://localhost:3091';
}

export const API_BASE_URL = resolveApiUrl();

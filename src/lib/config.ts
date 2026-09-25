/**
 * Runtime configuration for talking to the Hotel Booking API (Laravel).
 *
 * The Laravel app exposes every endpoint under `/api/v1` (see `routes/api.php`
 * → `Route::prefix('v1')`), so the effective base URL is always:
 *
 *   http://<api-host>/api/v1
 *
 * People configure `NEXT_PUBLIC_API_URL` in three different (and all
 * reasonable) ways, which is the #1 source of "404 on every page":
 *
 *   http://localhost:8000            → every call hit /login, /hotels … → 404
 *   http://localhost:8000/api        → every call hit /api/login …     → 404
 *   http://localhost:8000/api/v1     → correct
 *
 * `normalizeApiBaseUrl()` accepts all three (plus a relative value such as
 * `/api`, used when you want to proxy through Next's rewrite) and always
 * resolves to the one shape the backend actually serves.
 */

export const DEFAULT_API_ORIGIN = 'http://localhost:8000';
export const API_VERSION_PATH = '/api/v1';

/** Remove trailing slashes without touching the rest of the URL. */
function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Turn anything the user might put in `NEXT_PUBLIC_API_URL` into the real
 * versioned base URL of the Laravel API.
 */
export function normalizeApiBaseUrl(raw?: string | null): string {
  const value = stripTrailingSlash((raw ?? '').trim());

  if (!value) return `${DEFAULT_API_ORIGIN}${API_VERSION_PATH}`;

  // Already versioned: http://host/api/v1 (or /api/v2 one day)
  if (/\/api\/v\d+$/i.test(value)) return value;

  // Only the /api prefix: http://host/api
  if (/\/api$/i.test(value)) return `${value}/v1`;

  // Bare origin (or a relative prefix such as "/backend")
  return `${value}${API_VERSION_PATH}`;
}

/**
 * The scheme + host of the API, e.g. `http://localhost:8000`.
 * Returns an empty string when the base URL is relative (proxy mode).
 */
export function apiOriginFrom(baseUrl: string): string {
  const withoutVersion = baseUrl.replace(/\/api\/v\d+$/i, '');
  return /^https?:\/\//i.test(withoutVersion) ? stripTrailingSlash(withoutVersion) : '';
}

/** Base URL used by the axios client — always ends with `/api/v1`. */
export const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

/** `http://localhost:8000` — used for `/storage` image fallbacks. */
export const API_ORIGIN = apiOriginFrom(API_BASE_URL) || DEFAULT_API_ORIGIN;

/**
 * Where uploaded files live. The API already returns absolute URLs
 * (`asset('storage/...')`), so this is only a fallback for raw paths.
 */
export const STORAGE_BASE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_STORAGE_URL || `${API_ORIGIN}/storage`,
);

/** Path the Next rewrite forwards to the API's `public/storage` directory. */
export const STORAGE_PROXY_PREFIX = '/storage';

/**
 * Hosts whose images next/image will refuse to fetch.
 *
 * Next 16 resolves every *absolute* image URL and rejects it when the hostname
 * lands on a private IP, to block SSRF:
 *
 *   ⨯ upstream image http://localhost:8000/storage/hotels/x.jpg hostname
 *     resolved to private IP ["::1","127.0.0.1"]
 *
 * Which is precisely the normal local setup — Laravel on :8000, Next on :3000.
 */
function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();

  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === '::1' || host === '0.0.0.0') return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const [a, b] = ipv4.slice(1).map(Number);
  return (
    a === 127 ||                          // loopback
    a === 10 ||                           // private class A
    (a === 172 && b >= 16 && b <= 31) ||  // private class B
    (a === 192 && b === 168) ||           // private class C
    (a === 169 && b === 254)              // link-local
  );
}

/**
 * Turn `http://localhost:8000/storage/hotels/x.jpg` into `/storage/hotels/x.jpg`
 * so it is served through this app's own origin.
 *
 * A `/`-prefixed URL is treated by the image optimiser as a local image: it
 * skips the private-IP check above and is fetched through Next itself, where
 * the `/storage/:path*` rewrite in next.config.ts forwards it to the API.
 *
 * Only private hosts are rewritten, and only under `/storage`. A public CDN is
 * left alone — it is not blocked, and proxying it would add a pointless hop.
 */
export function toProxiedStorageUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (!parsed.pathname.startsWith(`${STORAGE_PROXY_PREFIX}/`)) return url;
  if (!isPrivateHost(parsed.hostname)) return url;

  return `${parsed.pathname}${parsed.search}`;
}

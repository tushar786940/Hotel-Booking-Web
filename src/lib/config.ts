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

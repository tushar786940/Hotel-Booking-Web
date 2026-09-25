import type { NextConfig } from 'next';

/**
 * Keep this in sync with `src/lib/config.ts` — it cannot be imported here
 * because `next.config.ts` is evaluated before the TS path aliases exist.
 */
const DEFAULT_API_ORIGIN = 'http://localhost:8000';

function normalizeApiBaseUrl(raw?: string | null): string {
  const value = (raw ?? '').trim().replace(/\/+$/, '');
  if (!value) return `${DEFAULT_API_ORIGIN}/api/v1`;
  if (/\/api\/v\d+$/i.test(value)) return value;
  if (/\/api$/i.test(value)) return `${value}/v1`;
  return `${value}/api/v1`;
}

const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

/**
 * Origin of the Laravel app (`http://localhost:8000`).
 * `API_PROXY_TARGET` lets you point the dev proxy somewhere else than the URL
 * the browser uses — handy when the frontend talks to the API through
 * Next's rewrite (`NEXT_PUBLIC_API_URL=/api`).
 */
const apiOrigin = (() => {
  const explicit = (process.env.API_PROXY_TARGET ?? '').trim().replace(/\/+$/, '');
  if (explicit) return explicit.replace(/\/api(\/v\d+)?$/i, '');

  const withoutVersion = apiBaseUrl.replace(/\/api\/v\d+$/i, '');
  return /^https?:\/\//i.test(withoutVersion) ? withoutVersion : DEFAULT_API_ORIGIN;
})();

const apiHost = (() => {
  try {
    return new URL(apiOrigin);
  } catch {
    return new URL(DEFAULT_API_ORIGIN);
  }
})();

const nextConfig: NextConfig = {
  images: {
    /*
     * Safety net for absolute loopback image URLs that do not come from
     * getImageUrl() — a NEXT_PUBLIC_STORAGE_URL pointing at a LAN address, say.
     * Development only: in production this would be a real SSRF hole, and the
     * same-origin /storage rewrite below is the mechanism that is meant to
     * carry these images anyway.
     */
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',

    remotePatterns: [
      // Images served by the API: asset('storage/hotels/…')
      {
        protocol: apiHost.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiHost.hostname,
        port: apiHost.port,
        pathname: '/storage/**',
      },
      /*
       * The API builds image URLs from its own APP_URL, which does not have to
       * match the origin the frontend talks to — `API_PROXY_TARGET` may say
       * 127.0.0.1 while APP_URL says localhost, or the API may run on another
       * port. next/image refuses any host that is not listed here, so allow
       * both loopback spellings on any port. Omitting `port` matches all.
       */
      { protocol: 'http', hostname: 'localhost', pathname: '/storage/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/storage/**' },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  /**
   * Optional same-origin proxy to the Laravel API, mirroring its real path so
   * `/api/v1/login` → `http://localhost:8000/api/v1/login`.
   *
   * Enable it by setting `NEXT_PUBLIC_API_URL=/api`, which removes the need
   * for CORS entirely. The previous version of this file crashed `next dev`
   * with "Invalid rewrite found" whenever `NEXT_PUBLIC_API_URL` was unset,
   * because the destination became the literal string "undefined/:path*".
   */
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
      /*
       * Uploaded files, served from the API's `public/storage` symlink.
       *
       * This exists so image URLs can be same-origin. next/image resolves an
       * absolute URL's hostname and refuses private IPs as an SSRF guard, which
       * rejects the ordinary local setup (Laravel on :8000). A `/`-prefixed URL
       * is treated as a local image instead and fetched through this rewrite.
       * `toProxiedStorageUrl()` in src/lib/config.ts produces those URLs.
       */
      {
        source: '/storage/:path*',
        destination: `${apiOrigin}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;

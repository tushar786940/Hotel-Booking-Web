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
    remotePatterns: [
      // Images served by the API: asset('storage/hotels/…')
      {
        protocol: apiHost.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiHost.hostname,
        port: apiHost.port,
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
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
    ];
  },
};

export default nextConfig;

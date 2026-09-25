/**
 * Checks that this app can actually reach the Hotel Booking API and load the
 * images it serves, and names the fix when it can't.
 *
 *   npm run doctor
 *
 * Most "images don't show" / "everything 404s" reports come down to a handful
 * of environment problems that all look identical from the browser. This walks
 * the same path the app does and reports where it breaks.
 */
import { API_BASE_URL, API_ORIGIN, STORAGE_BASE_URL } from '@/lib/config';
import { getHotelImage, getImageUrl } from '@/lib/utils';

const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://127.0.0.1:3000';
/** An explicit image to diagnose: `npm run doctor -- /storage/hotels/x.jpg` */
const TARGET = process.argv[2];
const remedies = [];
let failures = 0;

const ok = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const bad = (msg) => { failures++; console.log(`  \x1b[31m✗\x1b[0m ${msg}`); };
const warn = (msg) => console.log(`  \x1b[33m!\x1b[0m ${msg}`);
const dim = (msg) => console.log(`    \x1b[2m${msg}\x1b[0m`);
const head = (msg) => console.log(`\n\x1b[1m${msg}\x1b[0m`);

/** Mirrors next/image's detectContentType, which sniffs bytes, not headers. */
function sniff(buffer) {
  const b = new Uint8Array(buffer);
  if (b.byteLength === 0) return null;
  const starts = (...sig) => sig.every((byte, i) => b[i] === byte);
  if (starts(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
  if (starts(0x47, 0x49, 0x46, 0x38)) return 'image/gif';
  if (starts(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45) return 'image/webp';
  if (starts(0x3c, 0x3f, 0x78, 0x6d, 0x6c) || starts(0x3c, 0x73, 0x76, 0x67)) return 'image/svg+xml';
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return 'image/avif';
  return null;
}

const preview = (buffer) =>
  new TextDecoder().decode(buffer.slice(0, 80)).replace(/\s+/g, ' ').trim();

async function probe(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const buffer = new Uint8Array(await res.arrayBuffer());
    return { res, buffer, type: sniff(buffer) };
  } catch (error) {
    return { error };
  }
}

console.log('\n\x1b[1mHotel Booking Web — environment check\x1b[0m');

head('1. Configuration');
dim(`NEXT_PUBLIC_API_URL  = ${process.env.NEXT_PUBLIC_API_URL ?? '(unset)'}`);
dim(`API_PROXY_TARGET     = ${process.env.API_PROXY_TARGET ?? '(unset)'}`);
dim(`resolved API base    = ${API_BASE_URL}`);
dim(`resolved API origin  = ${API_ORIGIN}`);
dim(`storage base         = ${STORAGE_BASE_URL}`);

head('2. Is the API reachable?');
const hotelsProbe = await probe(`${API_ORIGIN}/api/v1/hotels`);
let hotels = [];

if (hotelsProbe.error) {
  bad(`cannot connect to ${API_ORIGIN} — ${hotelsProbe.error.message}`);
  remedies.push(`Start the API so it listens on ${API_ORIGIN} (php artisan serve).`);
} else if (!hotelsProbe.res.ok) {
  bad(`GET ${API_ORIGIN}/api/v1/hotels → ${hotelsProbe.res.status}`);
  dim(preview(hotelsProbe.buffer));
  remedies.push('The API responded but not with a hotel list. Check its logs.');
} else {
  try {
    const payload = JSON.parse(new TextDecoder().decode(hotelsProbe.buffer));
    hotels = payload.data ?? payload;
    ok(`GET /api/v1/hotels → 200, ${hotels.length} hotel(s)`);
  } catch {
    bad('GET /api/v1/hotels → 200 but the body is not JSON');
    dim(preview(hotelsProbe.buffer));
  }
}

head('3. What image URLs is the API handing out?');

/**
 * Prefer a hotel whose images live on the API's own /storage, since that is
 * the pipeline this script exists to check. A hotel pointing at an external
 * CDN tells us nothing about storage:link.
 */
const isStorageHosted = (url) =>
  typeof url === 'string' &&
  (url.startsWith('/storage/') || url.startsWith(`${API_ORIGIN}/storage/`));

const candidates = hotels.filter((h) => h?.cover_image || h?.images?.length);
const withImages =
  candidates.find((h) => isStorageHosted(getHotelImage(h))) ?? candidates[0];

if (!hotels.length) {
  warn('no hotels to inspect — skipped');
} else if (!withImages) {
  warn(`none of the ${hotels.length} hotel(s) have any images set`);
  dim('Add one in the admin, then run this again.');
} else {
  dim(`hotel: ${withImages.name}`);
  dim(`cover_image : ${withImages.cover_image ?? '(null)'}`);
  dim(`images[0]   : ${JSON.stringify(withImages.images?.[0]) ?? '(none)'}`);

  // The Filament textarea bug: `images` held a string, so cover_image became
  // asset('storage/' . $images[0]) where [0] is a single character.
  if (/\/storage\/[^/]$/.test(withImages.cover_image ?? '')) {
    bad('cover_image is a single character — the API\'s `images` column holds a string, not a list');
    remedies.push(
      'API: the hotel `images` column contains a plain string. Use a FileUpload\n' +
      '    field (not Textarea) in the Filament form so it stores a JSON array.\n' +
      '    See Hotel-Booking-API issue #10. This app already works around it by\n' +
      '    reading images[0], so the cards will still render.',
    );
  }

  const resolved = TARGET ? getImageUrl(TARGET) : getHotelImage(withImages);
  if (TARGET) dim(`(overridden on the command line: ${TARGET})`);
  ok(`this app will request: ${resolved}`);

  head('4. Does that image actually load from the API?');
  const direct = resolved.replace(/^\//, `${API_ORIGIN}/`);
  const external = !isStorageHosted(resolved);
  const directProbe = external ? null : await probe(direct);
  let directOk = false;

  if (external) {
    warn(`${resolved} is on an external host, not the API's /storage`);
    dim('Nothing here to diagnose — storage:link only affects API-hosted files.');
    dim('To check a specific file: npm run doctor -- /storage/hotels/<name>.jpg');
  } else if (directProbe.error) {
    bad(`${direct} — ${directProbe.error.message}`);
  } else if (directProbe.type) {
    directOk = true;
    ok(`${direct} → ${directProbe.res.status}, ${directProbe.type}`);
  } else {
    bad(`${direct} → ${directProbe.res.status}, body is not an image`);
    dim(`content-type: ${directProbe.res.headers.get('content-type') ?? '(none)'}`);
    dim(`first bytes : ${preview(directProbe.buffer) || '(empty)'}`);
    dim('next/image sniffs magic bytes, so it reports this as "received null".');
    const file = decodeURIComponent(direct.split('/').pop().split('?')[0]);
    const rel = new URL(direct).pathname.replace(/^\/storage\//, '');
    const win = process.platform === 'win32';
    const find = win
      ? `Get-ChildItem -Recurse -Filter "${file}" storage\\`
      : `find storage -name "${file}"`;

    remedies.push(
      [
        `API: nothing is served at /storage/${rel}.`,
        '',
        '    Filament uploads to the `public` disk by default, so the file is most',
        `    likely at  storage/app/public/${rel}`,
        '    which is reachable only through the public/storage symlink.',
        '',
        '    Note that /storage/{path} does NOT fall through to the public disk.',
        "    The API's `local` disk sets 'serve' => true with no 'url', so Laravel",
        '    registers GET /storage/{path} for it and serves from app/private.',
        '    It is declared first, so it owns that route and the public disk never',
        '    gets a look in — hence a 404 rather than your file.',
        '',
        '    Fix it either way, from the API directory:',
        '',
        '      (a) create the link',
        '            php artisan storage:link',
        ...(win
          ? [
              '          On Windows this needs an elevated PowerShell or Developer Mode.',
              '          Without admin rights, make a junction instead:',
              '            cmd /c mklink /J "public\\storage" "storage\\app\\public"',
            ]
          : []),
        '',
        '      (b) or let Laravel serve it, no symlink — in config/filesystems.php',
        "            'local'  => [ ... 'serve' => false ... ],",
        "            'public' => [ ... 'serve' => true  ... ],",
        '',
        '    Confirm where the file actually is:',
        `          ${find}`,
        '    If it turns up under app/private/ instead, the upload was pinned to',
        '    the local disk; add ->disk(\'public\') to the FileUpload field.',
      ].join('\n'),
    );
  }

  head('5. Does it load through this app?');
  const viaWeb = resolved.startsWith('/') ? await probe(`${WEB_ORIGIN}${resolved}`) : {};
  if (!resolved.startsWith('/')) {
    warn(`${resolved} is absolute — served directly by the browser, not proxied`);
  } else if (viaWeb.error) {
    warn(`${WEB_ORIGIN} is not running — start it with npm run dev, then re-run`);
  } else if (viaWeb.type) {
    ok(`${WEB_ORIGIN}${resolved} → ${viaWeb.res.status}, ${viaWeb.type}`);
  } else {
    bad(`${WEB_ORIGIN}${resolved} → ${viaWeb.res.status}, body is not an image`);
    dim(`first bytes: ${preview(viaWeb.buffer) || '(empty)'}`);
    // Only blame the rewrite when the API itself served the file happily.
    // Otherwise this 404 is just the API's 404 travelling through it.
    if (viaWeb.res.status === 404 && directOk) {
      remedies.push(
        'The /storage/:path* rewrite did not match, though the API serves the\n' +
        '    file directly. Restart `npm run dev` — next.config.ts changes need\n' +
        '    a restart.',
      );
    } else if (!directOk) {
      dim('Same body as the API returned above — the rewrite is working, the file is not there.');
    }
  }

  const optimizer = await probe(
    `${WEB_ORIGIN}/_next/image?url=${encodeURIComponent(resolved)}&w=640&q=75`,
  );
  if (!optimizer.error) {
    if (optimizer.type) {
      ok(`next/image optimiser → ${optimizer.res.status}, ${optimizer.type}`);
    } else if (external) {
      // Not this app's storage pipeline, and an external host can fail for
      // reasons that have nothing to do with the setup being checked here.
      warn(`next/image optimiser → ${optimizer.res.status} for an external host`);
      dim('Either this machine cannot reach that host, or it is not permitted');
      dim('by images.remotePatterns in next.config.ts.');
    } else {
      bad(`next/image optimiser → ${optimizer.res.status} (this is what the browser shows)`);
    }
  }
}

console.log('');
if (!remedies.length && failures > 0) {
  console.log('\x1b[33mSomething failed above but no specific remedy matched.\x1b[0m');
  console.log('');
  process.exit(1);
}
if (remedies.length) {
  console.log('\x1b[1m\x1b[33mWhat to fix\x1b[0m');
  remedies.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  console.log('');
  process.exit(1);
}

console.log('\x1b[32mNo problems found.\x1b[0m\n');

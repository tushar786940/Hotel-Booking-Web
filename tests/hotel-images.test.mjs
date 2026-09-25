/**
 * Which image a hotel card shows, for each shape the API can actually emit.
 *
 *   npm run test:images
 *
 * This imports the real `src/lib/utils.ts` rather than restating it, so it
 * fails if the helper changes underneath it.
 *
 * Background: `hotels.images` is a JSON column cast to `array`. Two accessors
 * read it — Hotel::getCoverImageAttribute() and getImagesWithUrlsAttribute() —
 * and they disagree when the column holds a bare string, which is exactly what
 * the Filament admin's `Textarea::make('images')` stores.
 */
import { getHotelImage, getImageUrl, PLACEHOLDER_IMAGE } from '@/lib/utils';
import { toProxiedStorageUrl } from '@/lib/config';

const APP_URL = 'http://localhost:8000';
const asset = (path) => `${APP_URL}/${path}`;

/**
 * What the card ends up rendering. localhost is a private host, so
 * toProxiedStorageUrl() strips the origin and the image is fetched through
 * this app's own /storage rewrite — see the note in src/lib/config.ts.
 */
const served = (path) => `/${path}`;

let pass = 0, fail = 0;
const eq = (actual, expected, label) => {
  if (actual === expected) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}\n      expected: ${expected}\n      actual:   ${actual}`); }
};

/**
 * Faithful port of the two PHP accessors, given the *decoded* value of the
 * `images` column. The subtle part is `$this->images[0]` on a string: PHP
 * returns a one-character string offset, not the whole value.
 */
function apiEmits(decodedImages) {
  const isString = typeof decodedImages === 'string';
  const empty =
    decodedImages === null || decodedImages === undefined ||
    decodedImages === '' || (Array.isArray(decodedImages) && decodedImages.length === 0);

  // getImagesWithUrlsAttribute(): collect($this->images) casts a string to a
  // single-element list, so this one survives the string case intact.
  const list = empty ? [] : (Array.isArray(decodedImages) ? decodedImages : [decodedImages]);
  const images = list.map((image) =>
    typeof image === 'string'
      ? { url: asset(`storage/${image}`), thumbnail_url: asset(`storage/${image}`) }
      : {
          url: asset(`storage/${image.path}`),
          thumbnail_url: asset(`storage/${image.thumbnail ?? image.path}`),
        });

  // getCoverImageAttribute(): indexes with [0] before checking the type.
  let cover_image = null;
  if (!empty) {
    const first = isString ? decodedImages[0] : decodedImages[0];
    cover_image = typeof first === 'string'
      ? asset(`storage/${first}`)
      : asset(`storage/${first.thumbnail ?? first.path}`);
  }

  return { cover_image, images };
}

console.log('\nA. images = ["hotels/abc.jpg", …]  (plain paths)');
{
  const hotel = apiEmits(['hotels/abc.jpg', 'hotels/def.jpg']);
  eq(hotel.cover_image, asset('storage/hotels/abc.jpg'), 'cover_image is the first path');
  eq(getHotelImage(hotel), served('storage/hotels/abc.jpg'),
    'card shows the first image, proxied same-origin');
}

console.log('\nB. images = [{path, thumbnail}, …]  (the documented format)');
{
  const hotel = apiEmits([{ path: 'hotels/abc.jpg', thumbnail: 'hotels/thumbnails/abc.jpg' }]);
  eq(hotel.cover_image, asset('storage/hotels/thumbnails/abc.jpg'), 'cover_image is the thumbnail');
  eq(getHotelImage(hotel), toProxiedStorageUrl(hotel.cover_image),
    'card resolves to the same file as cover_image — preferring images[0] loses nothing');
}

console.log('\nC. images = "hotels/abc.jpg"  (a string: what the Filament Textarea saves)');
{
  const hotel = apiEmits('hotels/abc.jpg');
  eq(hotel.cover_image, asset('storage/h'),
    'cover_image degrades to the first CHARACTER — this is the reported bug');
  eq(hotel.images[0].url, asset('storage/hotels/abc.jpg'),
    'images[0] is still correct, because collect() wraps the string');
  eq(getImageUrl(hotel.cover_image), served('storage/h'),
    'the old cover_image-first ordering would have requested storage/h');
  eq(getHotelImage(hotel), served('storage/hotels/abc.jpg'),
    'card now renders the real image');
}

console.log('\nD. images = "https://cdn.example.com/x.jpg"  (a full URL typed in)');
{
  const hotel = apiEmits('https://images.unsplash.com/photo-1.jpg');
  eq(hotel.images[0].url, asset('storage/https://images.unsplash.com/photo-1.jpg'),
    'the API prefixes it with storage/, producing a dead URL');
  eq(getHotelImage(hotel), 'https://images.unsplash.com/photo-1.jpg',
    'the storage/ wrapper is unwrapped and the real URL used');
}

console.log('\nE. no images at all');
{
  const hotel = apiEmits(null);
  eq(hotel.cover_image, null, 'cover_image is null');
  eq(getHotelImage(hotel), PLACEHOLDER_IMAGE, 'card falls back to the placeholder');
  eq(getHotelImage(null), PLACEHOLDER_IMAGE, 'a missing hotel does too');
  eq(getHotelImage({ images: [], cover_image: null }), PLACEHOLDER_IMAGE,
    'an empty list does too');
}

console.log('\nF. regressions guarded');
{
  eq(getImageUrl('https://cdn.example.com/a.jpg'), 'https://cdn.example.com/a.jpg',
    'an ordinary absolute URL is untouched');
  eq(getImageUrl({ url: asset('storage/a.jpg'), thumbnail_url: asset('storage/t.jpg') },
    'thumbnail_url'), served('storage/t.jpg'), 'the thumbnail variant is honoured');
  eq(getImageUrl(undefined), PLACEHOLDER_IMAGE, 'undefined gives the placeholder');
  eq(getImageUrl('   '), PLACEHOLDER_IMAGE, 'whitespace gives the placeholder');
  eq(getImageUrl('null'), PLACEHOLDER_IMAGE, 'the literal string "null" gives the placeholder');

  // A bare path is resolved against the storage mount; one that already names
  // that mount must not be doubled.
  eq(getImageUrl('hotels/a.jpg'), served('storage/hotels/a.jpg'),
    'a bare path is resolved against the storage mount');
  eq(getImageUrl('/storage/hotels/a.jpg'), served('storage/hotels/a.jpg'),
    'an already-rooted path is not doubled to /storage/storage/...');
  eq(getImageUrl('storage/hotels/a.jpg'), served('storage/hotels/a.jpg'),
    'nor is one without the leading slash');
}

console.log('\nG. same-origin proxying (next/image refuses private IPs)');
{
  eq(toProxiedStorageUrl('http://localhost:8000/storage/hotels/x.jpg'),
    '/storage/hotels/x.jpg', 'localhost is rewritten to a relative URL');
  eq(toProxiedStorageUrl('http://127.0.0.1:8000/storage/hotels/x.jpg'),
    '/storage/hotels/x.jpg', '127.0.0.1 too');
  eq(toProxiedStorageUrl('http://192.168.1.50/storage/hotels/x.jpg'),
    '/storage/hotels/x.jpg', 'a LAN address too');
  eq(toProxiedStorageUrl('https://cdn.example.com/storage/hotels/x.jpg'),
    'https://cdn.example.com/storage/hotels/x.jpg',
    'a public host is left alone — it is not blocked, so proxying would only add a hop');
  eq(toProxiedStorageUrl('http://localhost:8000/other/x.jpg'),
    'http://localhost:8000/other/x.jpg',
    'only /storage is proxied; nothing else is assumed to be routable');
  eq(toProxiedStorageUrl('http://localhost:8000/storage/x.jpg?v=2'),
    '/storage/x.jpg?v=2', 'the query string survives');
  eq(toProxiedStorageUrl('not a url'), 'not a url', 'a non-URL is returned untouched');
}

console.log(`\n${fail === 0 ? '✅' : '❌'}  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);

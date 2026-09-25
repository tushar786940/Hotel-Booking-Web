/**
 * Dev-only stand-in for the Hotel Booking API (Laravel).
 *
 *   node mock-api/server.mjs          # http://localhost:8000/api/v1
 *   npm run mock:api
 *
 * It implements the same routes, request validation and response shapes as
 * `routes/api.php` so the frontend can be exercised without PHP/MySQL.
 * It is NOT a replacement for the real backend — data lives in memory only.
 */
import http from 'node:http';

/** A valid 1×1 PNG, served for any /storage/... path (see the handler below). */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';
const ORIGIN = process.env.MOCK_PUBLIC_URL || `http://localhost:${PORT}`;

// ── in-memory data ───────────────────────────────────────────────────────
const img = (seed) => ({
  url: `https://images.unsplash.com/${seed}?w=1200&auto=format&fit=crop&q=80`,
  thumbnail_url: `https://images.unsplash.com/${seed}?w=400&auto=format&fit=crop&q=80`,
});

let nextId = { user: 3, booking: 1, review: 4, hotel: 4, roomType: 7 };

const users = [
  { id: 1, name: 'Olivia Owner', email: 'owner@example.com', password: 'password', phone: '+15550000001', roles: ['hotel-owner'], created_at: '2026-01-04T09:00:00.000Z' },
  { id: 2, name: 'Guest User', email: 'guest@example.com', password: 'password', phone: '+15550000002', roles: ['guest'], created_at: '2026-02-11T09:00:00.000Z' },
];

const roomTypes = [
  { id: 1, hotel_id: 1, name: 'Standard', description: 'Cosy room with a queen bed and city view.', price_per_night: 129.0, capacity: 2, total_rooms: 8, amenities: ['wifi', 'tv', 'ac'], images: [img('photo-1590490360182-c33d57733427')] },
  { id: 2, hotel_id: 1, name: 'Deluxe', description: 'Spacious deluxe room with balcony.', price_per_night: 249.99, capacity: 3, total_rooms: 5, amenities: ['wifi', 'tv', 'ac', 'minibar', 'balcony'], images: [img('photo-1618773928121-c32242e63f39')] },
  { id: 3, hotel_id: 2, name: 'Garden Suite', description: 'Suite opening onto the garden terrace.', price_per_night: 310.5, capacity: 4, total_rooms: 4, amenities: ['wifi', 'tv', 'ac', 'kitchen'], images: [img('photo-1582719478250-c89cae4dc85b')] },
  { id: 4, hotel_id: 2, name: 'Classic', description: 'Comfortable classic double.', price_per_night: 175.0, capacity: 2, total_rooms: 10, amenities: ['wifi', 'tv'], images: [img('photo-1611892440504-42a792e24d32')] },
  { id: 5, hotel_id: 3, name: 'Ocean View', description: 'Panoramic ocean view with king bed.', price_per_night: 420.0, capacity: 2, total_rooms: 6, amenities: ['wifi', 'tv', 'ac', 'ocean_view', 'balcony'], images: [img('photo-1571003123894-1f0594d2b5d9')] },
  { id: 6, hotel_id: 3, name: 'Family Room', description: 'Two bedrooms, sleeps five.', price_per_night: 380.0, capacity: 5, total_rooms: 3, amenities: ['wifi', 'tv', 'ac', 'kitchen'], images: [img('photo-1566195992011-5f6b21e539aa')] },
];

const hotels = [
  { id: 1, user_id: 1, name: 'Grand Palace Hotel', slug: 'grand-palace-hotel-x8k9m', description: 'A landmark hotel in the heart of Manhattan, steps from Central Park.', address: '15 West 44th Street', city: 'New York', state: 'NY', country: 'USA', zip_code: '10036', latitude: 40.7549, longitude: -73.984, star_rating: 5, check_in_time: '14:00', check_out_time: '11:00', amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'concierge'], images: [img('photo-1566073771259-6a8506099945'), img('photo-1582719478250-c89cae4dc85b'), img('photo-1611892440504-42a792e24d32')], is_active: true },
  { id: 2, user_id: 1, name: 'Riverside Boutique', slug: 'riverside-boutique-p2h4z', description: 'An intimate boutique stay on the Seine with a leafy courtyard.', address: '8 Quai de Montebello', city: 'Paris', state: 'Île-de-France', country: 'France', zip_code: '75005', latitude: 48.852, longitude: 2.347, star_rating: 4, check_in_time: '15:00', check_out_time: '11:00', amenities: ['wifi', 'restaurant', 'bar', 'pet_friendly'], images: [img('photo-1551882547-ff40c63fe5fa'), img('photo-1590073242678-70ee3fc28e8e')], is_active: true },
  { id: 3, user_id: 1, name: 'Azure Bay Resort', slug: 'azure-bay-resort-t7w1q', description: 'Beachfront resort with private cabanas and a sunset bar.', address: '120 Marina Drive', city: 'Dubai', state: 'Dubai', country: 'UAE', zip_code: '00000', latitude: 25.077, longitude: 55.133, star_rating: 5, check_in_time: '14:00', check_out_time: '12:00', amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'airport_shuttle'], images: [img('photo-1520250497591-112f2f40a3f4'), img('photo-1540541338287-41700207dee6')], is_active: true },
];

const reviews = [
  { id: 1, hotel_id: 1, user_id: 2, booking_id: null, rating: 5, comment: 'Faultless service and the best breakfast in the city.', created_at: '3 days ago' },
  { id: 2, hotel_id: 1, user_id: 2, booking_id: null, rating: 4, comment: 'Beautiful rooms, though the lobby gets busy at check-in.', created_at: '2 weeks ago' },
  { id: 3, hotel_id: 3, user_id: 2, booking_id: null, rating: 5, comment: 'Woke up to the sea every morning. Worth every penny.', created_at: '1 month ago' },
];

// Physical Room records — the seeder and RoomTypeController@store auto-generate
// these from `total_rooms` (D001, D002, …). Bookings attach to a Room, not a RoomType.
const rooms = [];
for (const rt of roomTypes) {
  const prefix = rt.name[0].toUpperCase();
  for (let i = 1; i <= rt.total_rooms; i++) {
    rooms.push({
      id: rooms.length + 1,
      room_type_id: rt.id,
      room_number: `${prefix}${String(i).padStart(3, '0')}`,
      floor: Math.ceil(i / 4),
      status: 'available',
      is_available: true,
    });
  }
}

const bookings = [];
const payments = [];
const tokens = new Map(); // token -> userId

// ── helpers ──────────────────────────────────────────────────────────────
const json = (res, status, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
};

const fail = (res, status, message, errors) =>
  json(res, status, errors ? { message, errors } : { message });

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const parseDate = (value) => {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};
const nightsBetween = (a, b) =>
  Math.round((parseDate(b) - parseDate(a)) / 86400000);

const roomTypesOf = (hotelId) => roomTypes.filter((r) => r.hotel_id === hotelId);

/**
 * Mirrors App\Models\Room::isAvailableForDates().
 * Both whereBetween() calls are INCLUSIVE on each end, so a stay that starts on
 * the day another stay ends is treated as a conflict (no same-day turnover).
 */
const roomIsFree = (room, checkIn, checkOut) =>
  !bookings.some((b) => {
    if (b.room_id !== room.id) return false;
    if (['cancelled', 'refunded'].includes(b.status)) return false;
    const startsWithin = b.check_in >= checkIn && b.check_in <= checkOut;
    const endsWithin = b.check_out >= checkIn && b.check_out <= checkOut;
    const wraps = b.check_in <= checkIn && b.check_out >= checkOut;
    return startsWithin || endsWithin || wraps;
  });

/** AvailabilityService::findAvailableRoom() */
const findAvailableRoom = (roomTypeId, checkIn, checkOut) =>
  rooms.find(
    (r) =>
      r.room_type_id === Number(roomTypeId) &&
      r.is_available &&
      r.status === 'available' &&
      roomIsFree(r, checkIn, checkOut),
  ) ?? null;

const countAvailableRooms = (roomTypeId, checkIn, checkOut) =>
  rooms.filter(
    (r) =>
      r.room_type_id === roomTypeId &&
      r.is_available &&
      r.status === 'available' &&
      roomIsFree(r, checkIn, checkOut),
  ).length;
const avgRating = (hotelId) => {
  const list = reviews.filter((r) => r.hotel_id === hotelId);
  if (!list.length) return 0;
  return Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10;
};

// PricingService
const TAX_RATE = 0.12, EXTRA_GUEST_RATE = 0.2, BASE_CAPACITY = 2;
const round2 = (n) => Math.round(n * 100) / 100;
const breakdown = (roomType, nights, guests = 1) => {
  const basePrice = roomType.price_per_night * nights;
  const extraGuests = Math.max(guests - BASE_CAPACITY, 0);
  const extraGuestCharge = extraGuests * roomType.price_per_night * EXTRA_GUEST_RATE * nights;
  const subtotal = basePrice + extraGuestCharge;
  const tax = subtotal * TAX_RATE;
  return {
    price_per_night: roomType.price_per_night,
    nights,
    base_price: round2(basePrice),
    extra_guests: extraGuests,
    extra_guest_charge: round2(extraGuestCharge),
    subtotal: round2(subtotal),
    tax_rate: `${TAX_RATE * 100}%`,
    tax: round2(tax),
    total: round2(subtotal + tax),
  };
};

// Resources
/**
 * RoomTypeResource. `available_rooms` is `whenLoaded('rooms')` and counts rooms
 * by their `status`/`is_available` flags only — it does NOT consider bookings,
 * so it is not a date-aware availability figure.
 */
const roomTypeResource = (rt, { withRooms = false } = {}) => ({
  id: rt.id,
  name: rt.name,
  description: rt.description,
  price_per_night: rt.price_per_night,
  capacity: rt.capacity,
  total_rooms: rt.total_rooms,
  amenities: rt.amenities,
  cover_image: rt.images[0]?.thumbnail_url ?? null,
  images: rt.images,
  ...(withRooms
    ? {
        available_rooms: rooms.filter(
          (r) => r.room_type_id === rt.id && r.is_available && r.status === 'available',
        ).length,
      }
    : {}),
});

const hotelResource = (h) => ({
  id: h.id,
  name: h.name,
  slug: h.slug,
  description: h.description,
  address: h.address,
  city: h.city,
  country: h.country,
  star_rating: h.star_rating,
  average_rating: avgRating(h.id),
  reviews_count: reviews.filter((r) => r.hotel_id === h.id).length,
  cover_image: h.images[0]?.thumbnail_url ?? null,
  images: h.images,
  amenities: h.amenities,
  check_in_time: h.check_in_time,
  check_out_time: h.check_out_time,
  starting_price: Math.min(...roomTypesOf(h.id).map((r) => r.price_per_night), Infinity) || null,
  is_active: h.is_active,
});

const hotelDetailResource = (h) => ({
  ...hotelResource(h),
  state: h.state,
  zip_code: h.zip_code,
  latitude: h.latitude,
  longitude: h.longitude,
  /**
   * HotelController@show DOES eager-load 'roomTypes.rooms', so available_rooms
   * is present — but RoomTypeResource computes it as a plain count of rooms
   * flagged is_available/status=available. It ignores bookings entirely, so it
   * is NOT date-aware and will happily report rooms that are fully booked.
   */
  room_types: roomTypesOf(h.id).map((rt) => roomTypeResource(rt, { withRooms: true })),
  reviews: reviews
    .filter((r) => r.hotel_id === h.id)
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      user: users.find((u) => u.id === r.user_id)?.name ?? 'Guest',
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
    })),
  owner: { name: 'Olivia Owner', email: 'owner@example.com' },
});

/**
 * Mirrors Booking::isCancellable():
 *
 *   in_array($this->status, ['pending', 'confirmed'])
 *       && $this->check_in->isAfter(now()->addDay())
 *
 * The second half is easy to miss: a stay starting within 24 hours can no
 * longer be cancelled, even while it is still `confirmed`.
 */
const isCancellable = (b) => {
  if (!['pending', 'confirmed'].includes(b.status)) return false;
  // check_in is a date, so Laravel casts it to midnight local time.
  const checkIn = new Date(`${b.check_in}T00:00:00`);
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return checkIn > cutoff;
};

const bookingResource = (b, { withUser = false } = {}) => {
  const rt = roomTypes.find((r) => r.id === b.room_type_id);
  const hotel = hotels.find((h) => h.id === b.hotel_id);
  const payment = payments.find((p) => p.booking_id === b.id);
  const review = reviews.find((r) => r.booking_id === b.id);

  return {
    id: b.id,
    booking_reference: b.booking_reference,
    hotel: { id: hotel.id, name: hotel.name, city: hotel.city },
    room: {
      room_number: b.room_number,
      room_type: rt.name,
      floor: b.floor,
      price_per_night: rt.price_per_night,
    },
    check_in: b.check_in,
    check_out: b.check_out,
    nights: nightsBetween(b.check_in, b.check_out),
    guests_count: b.guests_count,
    total_price: b.total_price,
    status: b.status,
    special_requests: b.special_requests,
    is_cancellable: isCancellable(b),
    ...(payment
      ? {
          payment: {
            status: payment.status,
            method: payment.method,
            amount: payment.amount,
            transaction_id: payment.transaction_id,
            paid_at: payment.paid_at,
          },
        }
      : {}),
    ...(review ? { review: { rating: review.rating, comment: review.comment } } : {}),
    ...(withUser ? { user: publicUser(users.find((u) => u.id === b.user_id)) } : {}),
    created_at: b.created_at,
  };
};

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  roles: u.roles,
});

const authUser = (req) => {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');
  const userId = tokens.get(token);
  return users.find((u) => u.id === userId) || null;
};

// ── router ───────────────────────────────────────────────────────────────
const routes = [];
const route = (method, pattern, handler) => {
  const keys = [];
  const regex = new RegExp(
    '^' +
      pattern.replace(/\{(\w+)\}/g, (_, key) => {
        keys.push(key);
        return '([^/]+)';
      }) +
      '$',
  );
  routes.push({ method, regex, keys, handler });
};

// ── AUTH ──
route('POST', '/api/v1/register', (req, res, _p, body) => {
  const errors = {};
  if (!body.name) errors.name = ['The name field is required.'];
  if (!body.email) errors.email = ['The email field is required.'];
  else if (users.some((u) => u.email === body.email))
    errors.email = ['The email has already been taken.'];
  if (!body.password || body.password.length < 8)
    errors.password = ['The password field must be at least 8 characters.'];
  else if (body.password !== body.password_confirmation)
    errors.password = ['The password field confirmation does not match.'];
  if (Object.keys(errors).length)
    return fail(res, 422, 'The given data was invalid.', errors);

  const user = {
    id: ++nextId.user,
    name: body.name,
    email: body.email,
    password: body.password,
    phone: body.phone ?? null,
    roles: ['guest'],
    created_at: new Date().toISOString(),
  };
  users.push(user);

  const token = `${user.id}|mock-${Math.random().toString(36).slice(2)}`;
  tokens.set(token, user.id);

  return json(res, 201, {
    message: 'Registration successful!',
    data: {
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      token,
    },
  });
});

route('POST', '/api/v1/login', (req, res, _p, body) => {
  const user = users.find((u) => u.email === body.email);
  if (!user || user.password !== body.password) {
    return fail(res, 422, 'The given data was invalid.', {
      email: ['The provided credentials are incorrect.'],
    });
  }
  const token = `${user.id}|mock-${Math.random().toString(36).slice(2)}`;
  tokens.set(token, user.id);

  return json(res, 200, {
    message: 'Login successful!',
    data: { user: publicUser(user), token },
  });
});

route('POST', '/api/v1/logout', (req, res) => {
  const user = authUser(req);
  if (!user) return fail(res, 401, 'Unauthenticated.');
  return json(res, 200, { message: 'Logged out successfully!' });
});

route('GET', '/api/v1/profile', (req, res) => {
  const user = authUser(req);
  if (!user) return fail(res, 401, 'Unauthenticated.');
  return json(res, 200, {
    data: { ...publicUser(user), notifications: 0, created_at: user.created_at },
  });
});

route('PUT', '/api/v1/profile', (req, res, _p, body) => {
  const user = authUser(req);
  if (!user) return fail(res, 401, 'Unauthenticated.');
  if (body.name !== undefined) user.name = body.name;
  if (body.phone !== undefined) user.phone = body.phone;
  return json(res, 200, {
    message: 'Profile updated successfully!',
    data: { ...publicUser(user), created_at: user.created_at },
  });
});

// ── HOTELS ──
route('GET', '/api/v1/hotels', (req, res, _p, _b, query) => {
  let list = hotels.filter((h) => h.is_active);

  if (query.city) list = list.filter((h) => h.city.toLowerCase().includes(query.city.toLowerCase()));
  if (query.country) list = list.filter((h) => h.country === query.country);
  if (query.star_rating) list = list.filter((h) => h.star_rating >= Number(query.star_rating));
  if (query.min_price)
    list = list.filter((h) => roomTypesOf(h.id).some((r) => r.price_per_night >= Number(query.min_price)));
  if (query.max_price)
    list = list.filter((h) => roomTypesOf(h.id).some((r) => r.price_per_night <= Number(query.max_price)));

  if (query.sort_by === 'price') {
    const dir = query.sort_order === 'desc' ? -1 : 1;
    list = [...list].sort(
      (a, b) =>
        (Math.min(...roomTypesOf(a.id).map((r) => r.price_per_night)) -
          Math.min(...roomTypesOf(b.id).map((r) => r.price_per_night))) * dir,
    );
  } else if (query.sort_by === 'rating') {
    list = [...list].sort((a, b) => avgRating(b.id) - avgRating(a.id));
  }

  const perPage = Number(query.per_page || 15);
  const page = Number(query.page || 1);
  const paged = list.slice((page - 1) * perPage, page * perPage);

  return json(res, 200, {
    data: paged.map(hotelResource),
    meta: {
      current_page: page,
      last_page: Math.max(Math.ceil(list.length / perPage), 1),
      per_page: perPage,
      total: list.length,
    },
  });
});

route('GET', '/api/v1/hotels/{slug}', (req, res, params) => {
  const hotel = hotels.find((h) => h.slug === params.slug && h.is_active);
  if (!hotel) return fail(res, 404, 'Hotel not found.');
  return json(res, 200, { data: hotelDetailResource(hotel) });
});

route('GET', '/api/v1/hotels/{id}/reviews', (req, res, params) => {
  const hotel = hotels.find((h) => String(h.id) === params.id);
  if (!hotel) return fail(res, 404, 'Hotel not found.');
  const list = reviews.filter((r) => r.hotel_id === hotel.id);
  return json(res, 200, {
    data: list.map((r) => ({
      id: r.id,
      user: users.find((u) => u.id === r.user_id)?.name ?? 'Guest',
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
    })),
    meta: {
      average_rating: avgRating(hotel.id),
      total_reviews: list.length,
      current_page: 1,
      last_page: 1,
    },
  });
});

// ── SEARCH / AVAILABILITY ──
const validateStay = (query) => {
  const errors = {};
  const checkIn = parseDate(query.check_in || '');
  const checkOut = parseDate(query.check_out || '');

  if (!query.check_in) errors.check_in = ['The check in field is required.'];
  else if (!checkIn || checkIn <= today())
    errors.check_in = ['The check in field must be a date after today.'];

  if (!query.check_out) errors.check_out = ['The check out field is required.'];
  else if (!checkOut || (checkIn && checkOut <= checkIn))
    errors.check_out = ['The check out field must be a date after check in.'];

  return errors;
};

route('GET', '/api/v1/search', (req, res, _p, _b, query) => {
  const errors = validateStay(query);
  if (Object.keys(errors).length)
    return fail(res, 422, 'The given data was invalid.', errors);

  let list = hotels.filter((h) => h.is_active);
  if (query.city) list = list.filter((h) => h.city.toLowerCase().includes(query.city.toLowerCase()));
  if (query.country) list = list.filter((h) => h.country === query.country);
  if (query.star_rating) list = list.filter((h) => h.star_rating >= Number(query.star_rating));
  if (query.guests)
    list = list.filter((h) => roomTypesOf(h.id).some((r) => r.capacity >= Number(query.guests)));
  if (query.min_price)
    list = list.filter((h) => roomTypesOf(h.id).some((r) => r.price_per_night >= Number(query.min_price)));
  if (query.max_price)
    list = list.filter((h) => roomTypesOf(h.id).some((r) => r.price_per_night <= Number(query.max_price)));

  return json(res, 200, {
    data: list.map(hotelResource),
    count: list.length,
    filters: query,
  });
});

route('GET', '/api/v1/hotels/{id}/availability', (req, res, params, _b, query) => {
  const hotel = hotels.find((h) => String(h.id) === params.id);
  if (!hotel) return fail(res, 404, 'Hotel not found.');

  const errors = validateStay(query);
  if (Object.keys(errors).length)
    return fail(res, 422, 'The given data was invalid.', errors);

  const nights = nightsBetween(query.check_in, query.check_out);
  const guests = Number(query.guests || 1);

  // AvailabilityService::getAvailableRoomTypes() — date-aware, and room types
  // with zero availability are filtered OUT of the response entirely.
  const data = roomTypesOf(hotel.id)
    .map((rt) => ({
      room_type: {
        id: rt.id,
        name: rt.name,
        description: rt.description,
        capacity: rt.capacity,
        amenities: rt.amenities,
        images: rt.images,
      },
      available_rooms: countAvailableRooms(rt.id, query.check_in, query.check_out),
      pricing: breakdown(rt, nights, guests),
    }))
    .filter((item) => item.available_rooms > 0);

  return json(res, 200, {
    data,
    hotel: {
      id: hotel.id,
      name: hotel.name,
      check_in_time: hotel.check_in_time,
      check_out_time: hotel.check_out_time,
    },
    search: { check_in: query.check_in, check_out: query.check_out, nights, guests },
  });
});

// ── BOOKINGS ──
route('GET', '/api/v1/bookings', (req, res, _p, _b, query) => {
  const user = authUser(req);
  if (!user) return fail(res, 401, 'Unauthenticated.');

  let list = bookings.filter((b) => b.user_id === user.id);
  if (query.status) list = list.filter((b) => b.status === query.status);
  list = [...list].reverse();

  return json(res, 200, {
    data: list.map((b) => bookingResource(b)),
    meta: { current_page: 1, last_page: 1, total: list.length },
  });
});

route('POST', '/api/v1/bookings', (req, res, _p, body) => {
  const user = authUser(req);
  if (!user) return fail(res, 401, 'Unauthenticated.');

  const errors = validateStay(body);
  const roomType = roomTypes.find((r) => r.id === Number(body.room_type_id));
  if (!roomType) errors.room_type_id = ['The selected room type id is invalid.'];
  if (!body.guests_count) errors.guests_count = ['The guests count field is required.'];
  else if (Number(body.guests_count) < 1 || Number(body.guests_count) > 10)
    errors.guests_count = ['The guests count field must be between 1 and 10.'];
  if (body.special_requests && String(body.special_requests).length > 500)
    errors.special_requests = ['The special requests field must not be greater than 500 characters.'];
  if (Object.keys(errors).length)
    return fail(res, 422, 'The given data was invalid.', errors);

  // BookingService::createBooking — STEP 1: find an available physical room.
  // This is the 422 most people hit: the room type exists and passes validation,
  // but every room of that type is taken for the requested dates.
  const room = findAvailableRoom(roomType.id, body.check_in, body.check_out);
  if (!room) {
    return fail(res, 422, 'The given data was invalid.', {
      room_type_id: ['No rooms available for the selected dates.'],
    });
  }

  const nights = nightsBetween(body.check_in, body.check_out);
  const total = breakdown(roomType, nights, Number(body.guests_count)).total;

  const booking = {
    id: nextId.booking++,
    booking_reference: `BK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    user_id: user.id,
    hotel_id: roomType.hotel_id,
    room_type_id: roomType.id,
    room_id: room.id,
    room_number: room.room_number,
    floor: room.floor,
    check_in: body.check_in,
    check_out: body.check_out,
    guests_count: Number(body.guests_count),
    total_price: total,
    status: 'pending',
    special_requests: body.special_requests ?? null,
    created_at: new Date().toISOString(),
  };
  bookings.push(booking);

  return json(res, 201, {
    message: 'Booking created successfully! Please complete payment.',
    data: bookingResource(booking),
  });
});

route('GET', '/api/v1/bookings/{id}', (req, res, params) => {
  const user = authUser(req);
  if (!user) return fail(res, 401, 'Unauthenticated.');
  const booking = bookings.find((b) => String(b.id) === params.id);
  if (!booking) return fail(res, 404, 'Not found.');
  if (booking.user_id !== user.id)
    return fail(res, 403, 'You are not authorized to view this booking.');

  const roomType = roomTypes.find((r) => r.id === booking.room_type_id);
  return json(res, 200, {
    data: bookingResource(booking),
    price_breakdown: breakdown(
      roomType,
      nightsBetween(booking.check_in, booking.check_out),
      booking.guests_count,
    ),
  });
});

route('POST', '/api/v1/bookings/{id}/cancel', (req, res, params, body) => {
  const user = authUser(req);
  if (!user) return fail(res, 401, 'Unauthenticated.');
  const booking = bookings.find((b) => String(b.id) === params.id);
  if (!booking) return fail(res, 404, 'Not found.');
  if (booking.user_id !== user.id)
    return fail(res, 403, 'You are not authorized to cancel this booking.');

  // BookingController@cancel: 'reason' => ['nullable', 'string', 'max:500']
  if (body.reason != null && typeof body.reason !== 'string')
    return fail(res, 422, 'The given data was invalid.', {
      reason: ['The reason field must be a string.'],
    });
  if (typeof body.reason === 'string' && body.reason.length > 500)
    return fail(res, 422, 'The given data was invalid.', {
      reason: ['The reason field must not be greater than 500 characters.'],
    });

  // BookingService::cancelBooking() re-checks the rule and throws a
  // ValidationException keyed `booking` — the status/24h window may well have
  // changed since the client last loaded the booking.
  if (!isCancellable(booking))
    return fail(res, 422, 'The given data was invalid.', {
      booking: [
        "This booking cannot be cancelled. Either it's too late or it's already cancelled.",
      ],
    });

  booking.status = 'cancelled';
  booking.cancelled_at = new Date().toISOString();
  booking.cancellation_reason = body.reason ?? null;
  // NOTE: cancelBooking() does not refund. A completed payment stays
  // `completed`; only an admin can move it to `refunded`.
  return json(res, 200, {
    message: 'Booking cancelled successfully.',
    data: bookingResource(booking),
  });
});

// ── PAYMENTS ──
/**
 * Set MOCK_STRIPE=off to reproduce an API whose STRIPE_SECRET is not set.
 *
 * PaymentService's constructor does Stripe::setApiKey(config('services.stripe.secret')).
 * With no key, PaymentIntent::create() throws AuthenticationException, and
 * nothing in PaymentService, PaymentController or bootstrap/app.php catches
 * it — so the client gets a bare 500.
 */
const STRIPE_CONFIGURED = (process.env.MOCK_STRIPE ?? 'on') !== 'off';

route('POST', '/api/v1/bookings/{id}/pay', (req, res, params) => {
  const user = authUser(req);
  if (!user) return fail(res, 401, 'Unauthenticated.');
  const booking = bookings.find((b) => String(b.id) === params.id);
  if (!booking) return fail(res, 404, 'Not found.');
  if (booking.user_id !== user.id) return fail(res, 403, 'Unauthorized');
  if (booking.status !== 'pending')
    return fail(res, 422, `This booking cannot be paid for. Current status: ${booking.status}`);

  if (!STRIPE_CONFIGURED) {
    // Laravel with APP_DEBUG=true surfaces the exception message; with
    // APP_DEBUG=false it is just "Server Error".
    return json(res, 500, {
      message:
        'No API key provided. Set your API key using "Stripe::setApiKey(<API-KEY>)".',
      exception: 'Stripe\\Exception\\AuthenticationException',
    });
  }

  const transactionId = `pi_mock_${Math.random().toString(36).slice(2, 12)}`;
  payments.push({
    booking_id: booking.id,
    amount: booking.total_price,
    currency: 'usd',
    method: 'stripe',
    transaction_id: transactionId,
    status: 'pending',
    paid_at: null,
  });

  // The real flow confirms through the Stripe webhook; simulate that delay.
  setTimeout(() => {
    const payment = payments.find((p) => p.transaction_id === transactionId);
    if (!payment) return;
    payment.status = 'completed';
    payment.paid_at = new Date().toISOString();
    booking.status = 'confirmed';
  }, 4000);

  return json(res, 200, {
    message: 'Payment intent created. Use client_secret to complete payment.',
    data: {
      client_secret: `${transactionId}_secret_mock`,
      payment_id: transactionId,
      amount: booking.total_price,
    },
  });
});

route('GET', '/api/v1/bookings/{id}/payment-status', (req, res, params) => {
  const user = authUser(req);
  if (!user) return fail(res, 401, 'Unauthenticated.');
  const booking = bookings.find((b) => String(b.id) === params.id);
  if (!booking) return fail(res, 404, 'Not found.');
  const payment = payments.find((p) => p.booking_id === booking.id);

  return json(res, 200, {
    data: {
      booking_reference: booking.booking_reference,
      booking_status: booking.status,
      payment: payment
        ? {
            status: payment.status,
            amount: payment.amount,
            method: payment.method,
            transaction_id: payment.transaction_id,
            paid_at: payment.paid_at,
          }
        : null,
    },
  });
});

// ── REVIEWS ──
route('POST', '/api/v1/bookings/{id}/review', (req, res, params, body) => {
  const user = authUser(req);
  if (!user) return fail(res, 401, 'Unauthenticated.');
  const booking = bookings.find((b) => String(b.id) === params.id);
  if (!booking) return fail(res, 404, 'Not found.');
  if (booking.user_id !== user.id) return fail(res, 403, 'You can only review your own bookings.');
  if (booking.status !== 'checked_out')
    return fail(res, 422, 'You can only review after checking out.');
  if (reviews.some((r) => r.booking_id === booking.id))
    return fail(res, 422, 'You have already reviewed this booking.');
  if (!body.rating || body.rating < 1 || body.rating > 5)
    return fail(res, 422, 'The given data was invalid.', {
      rating: ['The rating field must be between 1 and 5.'],
    });

  const review = {
    id: ++nextId.review,
    hotel_id: booking.hotel_id,
    user_id: user.id,
    booking_id: booking.id,
    rating: Number(body.rating),
    comment: body.comment ?? null,
    created_at: 'just now',
  };
  reviews.push(review);

  return json(res, 201, {
    message: 'Review submitted successfully! Thank you.',
    data: { id: review.id, rating: review.rating, comment: review.comment },
  });
});

// ── MANAGE (hotel-owner) ──
const requireOwner = (req, res) => {
  const user = authUser(req);
  if (!user) {
    fail(res, 401, 'Unauthenticated.');
    return null;
  }
  if (!user.roles.includes('hotel-owner') && !user.roles.includes('admin')) {
    fail(res, 403, 'User does not have the right roles.');
    return null;
  }
  return user;
};

route('GET', '/api/v1/manage/hotels', (req, res) => {
  const user = requireOwner(req, res);
  if (!user) return;
  const owned = hotels.filter((h) => h.user_id === user.id);
  return json(res, 200, {
    data: owned.map((h) => ({
      ...hotelResource(h),
      room_types: roomTypesOf(h.id).map((rt) => roomTypeResource(rt, { withRooms: true })),
      bookings_count: bookings.filter((b) => b.hotel_id === h.id).length,
    })),
  });
});

route('POST', '/api/v1/manage/hotels', (req, res, _p, body) => {
  const user = requireOwner(req, res);
  if (!user) return;

  const errors = {};
  ['name', 'address', 'city', 'country'].forEach((field) => {
    if (!body[field]) errors[field] = [`The ${field} field is required.`];
  });
  if (!body.star_rating) errors.star_rating = ['The star rating field is required.'];
  if (Object.keys(errors).length)
    return fail(res, 422, 'The given data was invalid.', errors);

  const hotel = {
    id: ++nextId.hotel,
    user_id: user.id,
    slug: `${body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 7)}`,
    images: [],
    is_active: true,
    check_in_time: body.check_in_time || '14:00',
    check_out_time: body.check_out_time || '11:00',
    amenities: body.amenities || [],
    ...body,
  };
  hotels.push(hotel);

  return json(res, 201, { message: 'Hotel created successfully!', data: hotelResource(hotel) });
});

route('GET', '/api/v1/manage/hotels/{id}', (req, res, params) => {
  const user = requireOwner(req, res);
  if (!user) return;
  const hotel = hotels.find((h) => String(h.id) === params.id);
  if (!hotel) return fail(res, 404, 'Not found.');
  if (hotel.user_id !== user.id) return fail(res, 403, 'You do not own this hotel.');
  return json(res, 200, {
    data: {
      ...hotelResource(hotel),
      state: hotel.state,
      zip_code: hotel.zip_code,
      room_types: roomTypesOf(hotel.id).map((rt) => roomTypeResource(rt, { withRooms: true })),
    },
  });
});

route('PUT', '/api/v1/manage/hotels/{id}', (req, res, params, body) => {
  const user = requireOwner(req, res);
  if (!user) return;
  const hotel = hotels.find((h) => String(h.id) === params.id);
  if (!hotel) return fail(res, 404, 'Not found.');
  if (hotel.user_id !== user.id) return fail(res, 403, 'You do not own this hotel.');
  Object.assign(hotel, body);
  return json(res, 200, { message: 'Hotel updated successfully!', data: hotelResource(hotel) });
});

route('DELETE', '/api/v1/manage/hotels/{id}', (req, res, params) => {
  const user = requireOwner(req, res);
  if (!user) return;
  const index = hotels.findIndex((h) => String(h.id) === params.id);
  if (index === -1) return fail(res, 404, 'Not found.');
  if (hotels[index].user_id !== user.id) return fail(res, 403, 'You do not own this hotel.');

  const active = bookings.filter(
    (b) => b.hotel_id === hotels[index].id && ['confirmed', 'checked_in'].includes(b.status),
  ).length;
  if (active > 0)
    return fail(res, 422, `Cannot delete hotel. There are ${active} active bookings.`);

  hotels.splice(index, 1);
  return json(res, 200, { message: 'Hotel deleted successfully.' });
});

route('GET', '/api/v1/manage/hotels/{id}/room-types', (req, res, params) => {
  const user = requireOwner(req, res);
  if (!user) return;
  const hotel = hotels.find((h) => String(h.id) === params.id);
  if (!hotel) return fail(res, 404, 'Not found.');
  return json(res, 200, {
    data: roomTypesOf(hotel.id).map((rt) => roomTypeResource(rt, { withRooms: true })),
  });
});

route('GET', '/api/v1/manage/hotels/{id}/bookings', (req, res, params, _b, query) => {
  const user = requireOwner(req, res);
  if (!user) return;
  const hotel = hotels.find((h) => String(h.id) === params.id);
  if (!hotel) return fail(res, 404, 'Not found.');
  if (hotel.user_id !== user.id) return fail(res, 403, 'Unauthorized');

  let list = bookings.filter((b) => b.hotel_id === hotel.id);
  if (query.status) list = list.filter((b) => b.status === query.status);

  return json(res, 200, {
    data: list.map((b) => bookingResource(b, { withUser: true })),
    meta: { current_page: 1, total: list.length },
  });
});

const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
};

route('PUT', '/api/v1/manage/bookings/{id}/status', (req, res, params, body) => {
  const user = requireOwner(req, res);
  if (!user) return;
  const booking = bookings.find((b) => String(b.id) === params.id);
  if (!booking) return fail(res, 404, 'Not found.');

  const allowed = TRANSITIONS[booking.status] ?? [];
  if (!allowed.includes(body.status)) {
    return json(res, 422, {
      message: `Cannot change status from '${booking.status}' to '${body.status}'.`,
      allowed,
    });
  }
  booking.status = body.status;
  return json(res, 200, {
    message: `Booking status updated to '${body.status}'.`,
    data: bookingResource(booking),
  });
});

// ── server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    });
    return res.end();
  }

  const url = new URL(req.url, ORIGIN);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const query = Object.fromEntries(url.searchParams.entries());

  /*
   * Stand-in for Laravel's `public/storage` symlink, so the frontend's
   * `/storage/:path*` rewrite has something real to proxy to. Any path under
   * /storage returns a valid 1×1 PNG; this is about exercising the transport,
   * not about the pixels.
   */
  if (req.method === 'GET' && pathname.startsWith('/storage/')) {
    console.log(`GET ${pathname} → 200 (storage stub)`);
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    });
    return res.end(PNG_1X1);
  }

  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
  });
  req.on('end', () => {
    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = {};
    }

    for (const r of routes) {
      if (r.method !== req.method) continue;
      const match = pathname.match(r.regex);
      if (!match) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
      console.log(`${req.method} ${pathname} → 200`);
      return r.handler(req, res, params, body, query);
    }

    console.log(`${req.method} ${pathname} → 404`);
    return fail(res, 404, 'Not Found. Check the route and the /api/v1 prefix.');
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Mock Hotel Booking API listening on http://${HOST}:${PORT}/api/v1`);
  console.log('Seeded logins: owner@example.com / guest@example.com — password: "password"');
});

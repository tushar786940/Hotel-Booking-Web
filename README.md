# Hotel Booking Web

Next.js 16 (App Router) frontend for the
[Hotel Booking API](https://github.com/tushar786940/Hotel-Booking-API) — a Laravel 11
backend using Sanctum tokens, Spatie roles and a Filament admin panel.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then edit if your API isn't on :8000
npm run dev
```

Open <http://localhost:3000>.

You also need the API running:

```bash
# in the Hotel-Booking-API checkout
php artisan serve               # http://localhost:8000
```

No PHP handy? A dev-only stand-in is bundled (see [Mock API](#mock-api-no-php-required)).

---

## Configuration

Every backend route lives under **`/api/v1`** (`Route::prefix('v1')` in `routes/api.php`).
The single most common cause of "404 on every page" is a base URL that is missing
that prefix, so `src/lib/config.ts` normalises whatever you provide:

| `NEXT_PUBLIC_API_URL`             | Requests go to                    |
| --------------------------------- | --------------------------------- |
| *(unset)*                         | `http://localhost:8000/api/v1/…`  |
| `http://localhost:8000`           | `http://localhost:8000/api/v1/…`  |
| `http://localhost:8000/api`       | `http://localhost:8000/api/v1/…`  |
| `http://localhost:8000/api/v1`    | `http://localhost:8000/api/v1/…`  |
| `/api/v1`                         | same-origin, proxied by Next      |

### Variables

| Variable                   | Scope    | Purpose |
| -------------------------- | -------- | ------- |
| `NEXT_PUBLIC_API_URL`      | browser  | Where the browser sends API calls. Normalised as above. |
| `API_PROXY_TARGET`         | server   | Origin the Next rewrite forwards `/api/v1/*` to. Only used with a relative `NEXT_PUBLIC_API_URL`. |
| `NEXT_PUBLIC_STORAGE_URL`  | browser  | Where `php artisan storage:link` publishes uploads. Defaults to `<api-origin>/storage`. |

### Two ways to reach the API

**A. Direct (needs CORS on the Laravel side)**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**B. Same-origin through Next's rewrite (no CORS, recommended)**

```env
NEXT_PUBLIC_API_URL=/api/v1
API_PROXY_TARGET=http://127.0.0.1:8000
```

`next.config.ts` rewrites `/api/v1/:path*` → `${API_PROXY_TARGET}/api/v1/:path*`. The
destination is always absolute, so an unset variable can no longer crash `next dev`
with `Invalid rewrite found`.

---

## Mock API (no PHP required)

`mock-api/server.mjs` is a dependency-free Node server that mirrors the real routes,
validation rules and response shapes. Useful for frontend work and CI.

```bash
npm run mock:api      # http://localhost:8000/api/v1
npm run dev           # in another terminal
```

Seeded accounts (password `password` for both):

| Email                 | Role          |
| --------------------- | ------------- |
| `owner@example.com`   | `hotel-owner` |
| `guest@example.com`   | `guest`       |

It keeps data in memory only and is **not** a substitute for the Laravel app.

---

## Endpoint map

Frontend modules in `src/lib/api.ts` → backend routes:

### Public

| Module call                       | Route |
| --------------------------------- | ----- |
| `authApi.register`                | `POST /register` |
| `authApi.login`                   | `POST /login` |
| `hotelsApi.list(filters)`         | `GET /hotels` |
| `hotelsApi.getBySlug(slug)`       | `GET /hotels/{hotel:slug}` |
| `reviewsApi.listByHotel(id)`      | `GET /hotels/{hotel}/reviews` |
| `availabilityApi.search(filters)` | `GET /search` |
| `availabilityApi.forHotel(id, …)` | `GET /hotels/{hotel}/availability` |

`GET /search` **requires** `check_in` after today and `check_out` after `check_in`,
otherwise it 422s. `availabilityApi.search` checks this with `canUseAvailabilitySearch()`
and falls back to `GET /hotels` when dates are missing, so browsing without dates works.

### Authenticated (Bearer token)

| Module call                           | Route |
| ------------------------------------- | ----- |
| `authApi.logout` / `profile` / `updateProfile` | `POST /logout`, `GET /profile`, `PUT /profile` |
| `bookingsApi.create` / `list` / `get` | `POST /bookings`, `GET /bookings`, `GET /bookings/{booking}` |
| `bookingsApi.cancel(id, reason)`      | `POST /bookings/{booking}/cancel` |
| `paymentsApi.pay` / `status`          | `POST /bookings/{booking}/pay`, `GET /bookings/{booking}/payment-status` |
| `reviewsApi.create(bookingId, …)`     | `POST /bookings/{booking}/review` |
| `invoicesApi.get` / `download` / `email` | `GET|GET|POST /bookings/{booking}/invoice…` |

### Hotel owner (`role:hotel-owner`, `manage` prefix)

| Module call                                | Route |
| ------------------------------------------ | ----- |
| `manageApi.listHotels` / `getHotel` / `createHotel` / `updateHotel` / `deleteHotel` | `/manage/hotels…` |
| `manageApi.listRoomTypes` / `createRoomType` | `GET|POST /manage/hotels/{hotel}/room-types` |
| `manageApi.updateRoomType` / `deleteRoomType` | `PUT|DELETE /manage/room-types/{roomType}` (shallow) |
| `manageApi.listBookings(hotelId)`           | `GET /manage/hotels/{hotel}/bookings` |
| `manageApi.updateBookingStatus(id, status)` | `PUT /manage/bookings/{booking}/status` |
| `manageApi.uploadHotelImages` etc.          | `/manage/hotels/{hotel}/images…` |

---

## Domain rules mirrored on the client

**Pricing** (`calculatePricing` in `src/lib/utils.ts`, mirrors `PricingService`):

```
base      = price_per_night × nights
extra     = max(0, guests − 2) × (price_per_night × 0.20) × nights
subtotal  = base + extra
tax       = subtotal × 0.12
total     = subtotal + tax
```

**Booking status transitions** (enforced by `AdminBookingController`, so the UI only
offers legal ones):

```
pending    → confirmed | cancelled
confirmed  → checked_in | cancelled
checked_in → checked_out
checked_out, cancelled, refunded → terminal
```

**Roles** come back from the API as plain strings (`["hotel-owner"]`), not objects.
Use `useAuth()`'s `roles`, `hasRole()`, `isHotelOwner` and `isAdmin` rather than
reading `user.role`.

---

## Scripts

| Command            | Description |
| ------------------ | ----------- |
| `npm run dev`      | Dev server on :3000 |
| `npm run build`    | Production build |
| `npm start`        | Serve the production build |
| `npm run lint`     | ESLint |
| `npm run mock:api` | Dev-only mock backend on :8000 |

---

## Project layout

```
src/
  app/                 App Router pages
    auth/…             login, register
    search/            hotel search + filters
    hotels/[slug]/     hotel detail, availability, booking
    bookings/          my bookings, booking detail, payment, review
    profile/           account details
    admin/             hotel-owner dashboard (hotels, bookings, reviews)
  components/          UI, layout, hotel, booking and admin components
  context/AuthContext  session, roles, token bootstrapping
  hooks/               useAuth, useSearch
  lib/
    api.ts             axios client + one module per API area
    config.ts          URL normalisation (the /api/v1 prefix lives here)
    utils.ts           pricing, dates, images, formatting
  types/index.ts       shared types matching the API resources
mock-api/server.mjs    dev-only stand-in for the Laravel API
```

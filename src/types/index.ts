/**
 * Types mirroring the Hotel Booking API (Laravel) responses.
 *
 * Every shape below is taken straight from the API resources / controllers:
 *   app/Http/Resources/HotelResource.php
 *   app/Http/Resources/HotelDetailResource.php
 *   app/Http/Resources/RoomTypeResource.php
 *   app/Http/Resources/BookingResource.php
 *   app/Http/Controllers/Api/V1/*.php
 */

// ═══════════════════════════════════════════
// AUTH / USER
// ═══════════════════════════════════════════

/** Role names come from Spatie: `$user->getRoleNames()` → ["guest"]. */
export type RoleName = 'guest' | 'hotel-owner' | 'admin' | (string & {});

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  /** Present on /login and /profile. Absent on /register. */
  roles?: RoleName[];
  /** Unread notification count — /profile only. */
  notifications?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuthPayload {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

// ═══════════════════════════════════════════
// HOTELS
// ═══════════════════════════════════════════

/** `images_with_urls` accessor on the Hotel / RoomType models. */
export interface ApiImage {
  url: string;
  thumbnail_url: string;
}

export interface Hotel {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  country: string;
  star_rating: number;
  average_rating: number;
  reviews_count?: number;
  cover_image: string | null;
  images: ApiImage[];
  amenities: string[] | null;
  check_in_time: string;
  check_out_time: string;
  /** Cheapest room price — only when `roomTypes` is eager loaded. */
  starting_price?: number | null;

  // ── HotelDetailResource only ──
  state?: string | null;
  zip_code?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  room_types?: RoomType[];
  reviews?: HotelReview[];
  owner?: { name: string; email: string };

  /** Present on the owner's hotel list (`withCount('bookings')`). */
  bookings_count?: number;
  is_active?: boolean;
}

export interface RoomType {
  id: number;
  name: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  total_rooms: number;
  amenities: string[] | null;
  cover_image: string | null;
  images: ApiImage[];
  /** Only when `rooms` is eager loaded, or from the availability endpoint. */
  available_rooms?: number;
}

/** Reviews are flattened by the API: `user` is the reviewer's *name*. */
export interface HotelReview {
  id: number;
  user: string;
  rating: number;
  comment: string | null;
  /** Human readable, e.g. "2 days ago". */
  created_at: string;
}

// ═══════════════════════════════════════════
// AVAILABILITY
// ═══════════════════════════════════════════

/** Matches `PricingService::getBreakdown()`. */
export interface PriceBreakdown {
  price_per_night: number;
  nights: number;
  base_price: number;
  extra_guests: number;
  extra_guest_charge: number;
  subtotal: number;
  /** Formatted by the API as e.g. "12%". */
  tax_rate: string;
  tax: number;
  total: number;
}

/** One entry of `GET /hotels/{hotel}/availability`. */
export interface RoomAvailability {
  room_type: Pick<
    RoomType,
    'id' | 'name' | 'description' | 'capacity' | 'amenities' | 'images'
  >;
  available_rooms: number;
  pricing: PriceBreakdown;
}

export interface AvailabilityResponse {
  data: RoomAvailability[];
  hotel: {
    id: number;
    name: string;
    check_in_time: string;
    check_out_time: string;
  };
  search: {
    check_in: string;
    check_out: string;
    nights: number;
    guests: number;
  };
}

// ═══════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'refunded';

export interface Booking {
  id: number;
  booking_reference: string;
  hotel: {
    id: number;
    name: string;
    city: string;
  };
  room: {
    room_number: string;
    /** The room *type* name, e.g. "Deluxe". */
    room_type: string;
    floor: number;
    price_per_night: number;
  };
  check_in: string;
  check_out: string;
  nights: number;
  guests_count: number;
  total_price: number;
  status: BookingStatus;
  special_requests: string | null;
  is_cancellable: boolean;
  payment?: BookingPayment | null;
  review?: BookingReview | null;
  created_at: string;
  /** Only on the hotel-owner booking list (`with('user')`). */
  user?: User;
}

export interface BookingPayment {
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  transaction_id: string | null;
  paid_at: string | null;
}

export interface BookingReview {
  rating: number;
  comment: string | null;
}

export interface CreateBookingData {
  room_type_id: number;
  check_in: string;
  check_out: string;
  guests_count: number;
  special_requests?: string;
}

// ═══════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'stripe' | 'paypal' | 'cash';

/** `POST /bookings/{booking}/pay` → Stripe PaymentIntent. */
export interface PaymentIntent {
  client_secret: string;
  payment_id: string;
  amount: number;
}

/** `GET /bookings/{booking}/payment-status`. */
export interface PaymentStatusResponse {
  booking_reference: string;
  booking_status: BookingStatus;
  payment: BookingPayment | null;
}

// ═══════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════

export interface CreateReviewData {
  rating: number;
  comment?: string;
}

// ═══════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════

/** Sorting supported by `GET /hotels`. */
export type SortBy = 'price' | 'rating';
export type SortOrder = 'asc' | 'desc';

export interface SearchFilters {
  city?: string;
  country?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  star_rating?: number;
  sort_by?: SortBy;
  sort_order?: SortOrder;
  page?: number;
  per_page?: number;
}

// ═══════════════════════════════════════════
// HOTEL OWNER (`/manage/*`)
// ═══════════════════════════════════════════

export interface HotelFormData {
  name: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  star_rating: number;
  check_in_time?: string;
  check_out_time?: string;
  amenities?: string[];
}

export interface RoomTypeFormData {
  name: string;
  description?: string;
  price_per_night: number;
  capacity: number;
  total_rooms: number;
  amenities?: string[];
}

/** Statuses a hotel owner may set via `PUT /manage/bookings/{id}/status`. */
export type ManageableBookingStatus =
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';

// ═══════════════════════════════════════════
// GENERIC ENVELOPES
// ═══════════════════════════════════════════

export interface PaginationMeta {
  current_page: number;
  last_page?: number;
  per_page?: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  message?: string;
}

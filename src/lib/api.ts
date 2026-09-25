import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/config";
import type {
  CreateBookingData,
  CreateReviewData,
  HotelFormData,
  ManageableBookingStatus,
  RoomTypeFormData,
  SearchFilters,
} from "@/types";

/**
 * Axios client for the Hotel Booking API (Laravel + Sanctum).
 *
 * Every path below maps 1:1 to a route in the backend's `routes/api.php`,
 * which is mounted under `/api/v1`. `API_BASE_URL` already includes that
 * prefix (see `src/lib/config.ts`), so paths here are written exactly as the
 * routes are declared.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// Request interceptor - attach Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token && config.headers) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (
    error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>,
  ) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthenticated - handled by AuthContext
          break;
        case 403:
          toast.error(
            data?.message ||
              "You do not have permission to perform this action",
          );
          break;
        case 404:
          // Let the caller decide what an empty result means, but make a
          // misconfigured base URL obvious instead of silently failing —
          // this is the classic "every page 404s" symptom.
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `[api] 404 ${error.config?.method?.toUpperCase()} ${API_BASE_URL}${error.config?.url}\n` +
                "If every request 404s, check NEXT_PUBLIC_API_URL — the backend serves everything under /api/v1.",
            );
          }
          break;
        case 422:
          if (data?.errors) {
            const firstError = Object.values(data.errors)[0];
            if (firstError && firstError[0]) {
              toast.error(firstError[0]);
            }
          } else if (data?.message) {
            toast.error(data.message);
          }
          break;
        case 429:
          toast.error(
            data?.message || "Too many requests. Please wait a moment.",
          );
          break;
        case 500:
          toast.error("Server error. Please try again later.");
          break;
        default:
          if (data?.message) {
            toast.error(data.message);
          }
      }
    } else if (error.request) {
      toast.error("Unable to connect to the server. Please check backend.");
    }

    return Promise.reject(error);
  },
);

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

type QueryParams = Record<string, string | number | boolean | undefined | null>;

/** Drop empty values so we never send `?city=&guests=` to the API. */
function clean(params?: QueryParams): QueryParams {
  const result: QueryParams = {};
  if (!params) return result;

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    result[key] = value;
  });

  return result;
}

/**
 * Pull a human-readable message out of a Laravel error response.
 *
 * A 422 can be either a field-validation failure
 *   { message, errors: { check_in: ["The check in field must be a date after today."] } }
 * or a business-rule rejection thrown from a service as a ValidationException
 *   { message, errors: { room_type_id: ["No rooms available for the selected dates."] } }
 *
 * Both matter to the user, so prefer the specific field error over the generic
 * "The given data was invalid." wrapper.
 */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  const axiosError = error as AxiosError<{
    message?: string;
    errors?: Record<string, string[]>;
  }>;
  const data = axiosError?.response?.data;

  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (first?.[0]) return first[0];
  }

  if (data?.message) return data.message;
  if (!axiosError?.response && axiosError?.request) {
    return "Unable to reach the server. Is the API running?";
  }

  return fallback;
}

/**
 * True when the API rejected a booking because every room of that type is
 * taken for the requested dates (BookingService::createBooking step 1) rather
 * than because a field was malformed.
 */
export function isNoRoomsAvailableError(error: unknown): boolean {
  const axiosError = error as AxiosError<{ errors?: Record<string, string[]> }>;
  if (axiosError?.response?.status !== 422) return false;

  const roomTypeErrors = axiosError.response.data?.errors?.room_type_id;
  return Boolean(roomTypeErrors?.some((m) => /no rooms available/i.test(m)));
}

/** `GET /search` requires `check_in` to be strictly after today. */
export function isFutureDate(value?: string | null): boolean {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date.getTime() > today.getTime();
}

/**
 * The availability search endpoint only accepts a bookable date range.
 * Anything else has to fall back to the plain hotel listing.
 */
export function canUseAvailabilitySearch(filters: SearchFilters): boolean {
  return Boolean(
    filters.check_in &&
      filters.check_out &&
      isFutureDate(filters.check_in) &&
      filters.check_out > filters.check_in,
  );
}

// ═══════════════════════════════════════════
// AUTH API
// Route::post('/register'), Route::post('/login'),
// Route::post('/logout'), Route::get|put('/profile')
// ═══════════════════════════════════════════
export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => api.post("/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/login", data),

  logout: () => api.post("/logout"),

  getProfile: () => api.get("/profile"),

  /** The API only accepts `name` and `phone` (AuthController@updateProfile). */
  updateProfile: (data: { name?: string; phone?: string | null }) =>
    api.put("/profile", data),
};

// ═══════════════════════════════════════════
// HOTELS API
// Route::get('/hotels'), Route::get('/hotels/{hotel:slug}')
// ═══════════════════════════════════════════
export const hotelsApi = {
  /**
   * GET /hotels
   * Filters: city, country, star_rating, min_price, max_price
   * Sorting: sort_by=price|rating (+ sort_order=asc|desc for price)
   */
  list: (filters: SearchFilters = {}) =>
    api.get("/hotels", {
      params: clean({
        city: filters.city,
        country: filters.country,
        star_rating: filters.star_rating,
        min_price: filters.min_price,
        max_price: filters.max_price,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
        page: filters.page,
        per_page: filters.per_page,
      }),
    }),

  /** Route model binding is `{hotel:slug}` — this must be the slug. */
  getBySlug: (slug: string) => api.get(`/hotels/${slug}`),

  /** Route model binding is `{hotel}` — this must be the numeric id. */
  getReviews: (hotelId: number | string, params?: { page?: number }) =>
    api.get(`/hotels/${hotelId}/reviews`, { params: clean(params) }),
};

// ═══════════════════════════════════════════
// AVAILABILITY & SEARCH API
// Route::get('/search'), Route::get('/hotels/{hotel}/availability')
// ═══════════════════════════════════════════
export const availabilityApi = {
  /**
   * GET /search — hotels that actually have a free room for the dates.
   *
   * `check_in`/`check_out` are REQUIRED and `check_in` must be after today,
   * otherwise the API answers 422. When we do not have a usable date range we
   * transparently fall back to `GET /hotels`, which supports the same
   * filters minus availability.
   */
  search: (filters: SearchFilters = {}) => {
    if (!canUseAvailabilitySearch(filters)) {
      return hotelsApi.list(filters);
    }

    return api.get("/search", {
      params: clean({
        city: filters.city,
        country: filters.country,
        check_in: filters.check_in,
        check_out: filters.check_out,
        guests: filters.guests,
        min_price: filters.min_price,
        max_price: filters.max_price,
        star_rating: filters.star_rating,
      }),
    });
  },

  /** GET /hotels/{hotel}/availability — numeric hotel id. */
  checkHotel: (
    hotelId: number | string,
    params: { check_in: string; check_out: string; guests?: number },
  ) => api.get(`/hotels/${hotelId}/availability`, { params: clean(params) }),
};

// ═══════════════════════════════════════════
// BOOKINGS API
// Route::get|post('/bookings'), Route::get('/bookings/{booking}'),
// Route::post('/bookings/{booking}/cancel')
// ═══════════════════════════════════════════
export const bookingsApi = {
  list: (params?: { status?: string; page?: number }) =>
    api.get("/bookings", { params: clean(params) }),

  /**
   * The API derives the hotel and the physical room from `room_type_id`,
   * so only these five fields are accepted (BookingController@store).
   */
  create: (data: CreateBookingData) => api.post("/bookings", data),

  getById: (id: number | string) => api.get(`/bookings/${id}`),

  /** BookingController@cancel validates `reason` (not `cancellation_reason`). */
  cancel: (id: number | string, reason?: string) =>
    api.post(`/bookings/${id}/cancel`, clean({ reason })),
};

// ═══════════════════════════════════════════
// PAYMENTS API
// Route::post('/bookings/{booking}/pay')
// Route::get('/bookings/{booking}/payment-status')
// ═══════════════════════════════════════════
export const paymentsApi = {
  /**
   * Creates a Stripe PaymentIntent and returns `{ client_secret, payment_id,
   * amount }`. The booking is only confirmed once Stripe calls the
   * `/webhooks/stripe` endpoint — the request body is ignored by the API.
   */
  pay: (bookingId: number | string) => api.post(`/bookings/${bookingId}/pay`),

  getStatus: (bookingId: number | string) =>
    api.get(`/bookings/${bookingId}/payment-status`),
};

// ═══════════════════════════════════════════
// REVIEWS API
// Route::get('/hotels/{hotel}/reviews')
// Route::post('/bookings/{booking}/review')
// ═══════════════════════════════════════════
export const reviewsApi = {
  listByHotel: (hotelId: number | string, params?: { page?: number }) =>
    api.get(`/hotels/${hotelId}/reviews`, { params: clean(params) }),

  /** Only `rating` (1-5) and `comment` are accepted by ReviewController@store. */
  create: (bookingId: number | string, data: CreateReviewData) =>
    api.post(`/bookings/${bookingId}/review`, data),
};

// ═══════════════════════════════════════════
// INVOICES API
// Route::get('/bookings/{booking}/invoice[/download]')
// Route::post('/bookings/{booking}/invoice/email')
// ═══════════════════════════════════════════
export const invoicesApi = {
  download: (bookingId: number | string) =>
    api.get(`/bookings/${bookingId}/invoice/download`, {
      responseType: "blob",
    }),

  view: (bookingId: number | string) =>
    api.get(`/bookings/${bookingId}/invoice`, { responseType: "blob" }),

  email: (bookingId: number | string) =>
    api.post(`/bookings/${bookingId}/invoice/email`),
};

// ═══════════════════════════════════════════
// HOTEL OWNER API — `/manage/*` (role:hotel-owner)
// ═══════════════════════════════════════════
export const manageApi = {
  // ── Hotels: Route::apiResource('hotels', AdminHotelController::class) ──
  listHotels: () => api.get("/manage/hotels"),

  getHotel: (id: number | string) => api.get(`/manage/hotels/${id}`),

  createHotel: (data: HotelFormData) => api.post("/manage/hotels", data),

  updateHotel: (
    id: number | string,
    data: Partial<HotelFormData> & { is_active?: boolean },
  ) => api.put(`/manage/hotels/${id}`, data),

  deleteHotel: (id: number | string) => api.delete(`/manage/hotels/${id}`),

  // ── Room types: apiResource('hotels.room-types')->shallow() ──
  listRoomTypes: (hotelId: number | string) =>
    api.get(`/manage/hotels/${hotelId}/room-types`),

  createRoomType: (hotelId: number | string, data: RoomTypeFormData) =>
    api.post(`/manage/hotels/${hotelId}/room-types`, data),

  /** Shallow route: `/manage/room-types/{roomType}`. */
  updateRoomType: (
    roomTypeId: number | string,
    data: Partial<RoomTypeFormData>,
  ) => api.put(`/manage/room-types/${roomTypeId}`, data),

  deleteRoomType: (roomTypeId: number | string) =>
    api.delete(`/manage/room-types/${roomTypeId}`),

  // ── Images ──
  uploadHotelImages: (hotelId: number | string, formData: FormData) =>
    api.post(`/manage/hotels/${hotelId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  replaceHotelImages: (hotelId: number | string, formData: FormData) =>
    api.put(`/manage/hotels/${hotelId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /** ImageUploadController@deleteHotelImage validates `image_index`. */
  deleteHotelImage: (hotelId: number | string, imageIndex: number) =>
    api.delete(`/manage/hotels/${hotelId}/images`, {
      data: { image_index: imageIndex },
    }),

  reorderHotelImages: (hotelId: number | string, order: number[]) =>
    api.put(`/manage/hotels/${hotelId}/images/reorder`, { order }),

  uploadRoomTypeImages: (roomTypeId: number | string, formData: FormData) =>
    api.post(`/manage/room-types/${roomTypeId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // ── Bookings ──
  listBookings: (
    hotelId: number | string,
    params?: { status?: string; page?: number },
  ) => api.get(`/manage/hotels/${hotelId}/bookings`, { params: clean(params) }),

  updateBookingStatus: (
    bookingId: number | string,
    status: ManageableBookingStatus,
  ) => api.put(`/manage/bookings/${bookingId}/status`, { status }),

  regenerateInvoice: (bookingId: number | string) =>
    api.post(`/manage/bookings/${bookingId}/invoice/regenerate`, null, {
      responseType: "blob",
    }),
};

/** @deprecated kept as an alias — the backend calls these "manage" routes. */
export const adminApi = manageApi;

export default api;

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
          toast.error("You do not have permission to perform this action");
          break;
        case 404:
          // Let caller handle 404
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
          toast.error("Too many requests. Please wait a moment.");
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
// AUTH API
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

  // Matches Route::get('/profile')
  getProfile: () => api.get("/profile"),

  // Matches Route::put('/profile')
  updateProfile: (data: {
    name?: string;
    phone?: string;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
  }) => api.put("/profile", data),
};

// ═══════════════════════════════════════════
// HOTELS API
// ═══════════════════════════════════════════
export const hotelsApi = {
  list: (params?: Record<string, any>) => api.get("/hotels", { params }),

  getBySlug: (slug: string) => api.get(`/hotels/${slug}`),

  getReviews: (hotelId: number | string, params?: Record<string, any>) =>
    api.get(`/hotels/${hotelId}/reviews`, { params }),
};

// ═══════════════════════════════════════════
// AVAILABILITY & SEARCH API
// ═══════════════════════════════════════════
export const availabilityApi = {
  search: async (params: Record<string, any>) => {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleanParams[key] = value;
      }
    });

    try {
      // If city or dates are provided, try availability search first
      if (cleanParams.city || (cleanParams.check_in && cleanParams.check_out)) {
        const response = await api.get("/search", { params: cleanParams });
        const data = response.data?.data || response.data;

        // If availability search found hotels, return them
        if (Array.isArray(data) && data.length > 0) {
          return response;
        }
      }

      // Fallback: list all hotels matching filters
      return await api.get("/hotels", { params: cleanParams });
    } catch (error: any) {
      // If /search endpoint fails, fallback to /hotels
      return await api.get("/hotels", { params: cleanParams });
    }
  },

  checkHotel: (
    hotelId: number | string,
    params: {
      check_in: string;
      check_out: string;
      guests?: number;
    },
  ) => api.get(`/hotels/${hotelId}/availability`, { params }),
};

// ═══════════════════════════════════════════
// BOOKINGS API
// ═══════════════════════════════════════════
export const bookingsApi = {
  list: (params?: Record<string, any>) => api.get("/bookings", { params }),

  create: (data: {
    hotel_id: number;
    room_type_id: number;
    check_in: string;
    check_out: string;
    guests: number;
    special_requests?: string;
  }) => api.post("/bookings", data),

  getById: (id: number | string) => api.get(`/bookings/${id}`),

  // Matches Route::post('/bookings/{booking}/cancel')
  cancel: (id: number | string, reason?: string) =>
    api.post(`/bookings/${id}/cancel`, { cancellation_reason: reason }),
};

// ═══════════════════════════════════════════
// PAYMENTS API
// ═══════════════════════════════════════════
export const paymentsApi = {
  // Matches Route::post('/bookings/{booking}/pay')
  pay: (
    bookingId: number | string,
    data: {
      method?: string;
      payment_method_id?: string;
    },
  ) => api.post(`/bookings/${bookingId}/pay`, data),

  // Matches Route::get('/bookings/{booking}/payment-status')
  getStatus: (bookingId: number | string) =>
    api.get(`/bookings/${bookingId}/payment-status`),
};

// ═══════════════════════════════════════════
// REVIEWS API
// ═══════════════════════════════════════════
export const reviewsApi = {
  // Matches Route::get('/hotels/{hotel}/reviews')
  listByHotel: (hotelId: number | string, params?: Record<string, any>) =>
    api.get(`/hotels/${hotelId}/reviews`, { params }),

  // Matches Route::post('/bookings/{booking}/review')
  create: (
    bookingId: number | string,
    data: {
      rating: number;
      title?: string;
      comment: string;
      pros?: string;
      cons?: string;
    },
  ) => api.post(`/bookings/${bookingId}/review`, data),
};

// ═══════════════════════════════════════════
// INVOICES API
// ═══════════════════════════════════════════
export const invoicesApi = {
  // Matches Route::get('/bookings/{booking}/invoice/download')
  download: (bookingId: number | string) =>
    api.get(`/bookings/${bookingId}/invoice/download`, {
      responseType: "blob",
    }),

  // Matches Route::get('/bookings/{booking}/invoice')
  view: (bookingId: number | string) =>
    api.get(`/bookings/${bookingId}/invoice`),

  // Matches Route::post('/bookings/{booking}/invoice/email')
  email: (bookingId: number | string) =>
    api.post(`/bookings/${bookingId}/invoice/email`),
};

// ═══════════════════════════════════════════
// ADMIN / HOTEL OWNER API
// ═══════════════════════════════════════════
export const adminApi = {
  // ── Hotels ──
  listHotels: (params?: Record<string, any>) =>
    api.get("/manage/hotels", { params }),

  getHotel: (id: number | string) => api.get(`/manage/hotels/${id}`),

  createHotel: (data: {
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zip_code: string;
    stars: number;
    check_in_time: string;
    check_out_time: string;
    amenities: string[];
    is_active: boolean;
  }) => api.post("/manage/hotels", data),

  updateHotel: (id: number | string, data: Record<string, any>) =>
    api.put(`/manage/hotels/${id}`, data),

  deleteHotel: (id: number | string) => api.delete(`/manage/hotels/${id}`),

  // ── Room Types ──
  listRoomTypes: (hotelId: number | string) =>
    api.get(`/manage/hotels/${hotelId}/room-types`),

  createRoomType: (
    hotelId: number | string,
    data: {
      name: string;
      description: string;
      base_price: number;
      max_guests: number;
      bed_type: string;
      room_size?: number;
      amenities: string[];
      total_rooms: number;
      is_active: boolean;
    },
  ) => api.post(`/manage/hotels/${hotelId}/room-types`, data),

  updateRoomType: (roomTypeId: number | string, data: Record<string, any>) =>
    api.put(`/manage/room-types/${roomTypeId}`, data),

  deleteRoomType: (roomTypeId: number | string) =>
    api.delete(`/manage/room-types/${roomTypeId}`),

  // ── Images ──
  uploadHotelImages: (hotelId: number | string, formData: FormData) =>
    api.post(`/manage/hotels/${hotelId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteHotelImage: (hotelId: number | string, imageId: number | string) =>
    api.delete(`/manage/hotels/${hotelId}/images`, {
      data: { image_id: imageId },
    }),

  // ── Bookings ──
  listBookings: (hotelId: number | string, params?: Record<string, any>) =>
    api.get(`/manage/hotels/${hotelId}/bookings`, { params }),

  updateBookingStatus: (bookingId: number | string, status: string) =>
    api.put(`/manage/bookings/${bookingId}/status`, { status }),
};

export default api;

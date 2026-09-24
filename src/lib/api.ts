import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            // Don't redirect if already on auth pages
            if (!window.location.pathname.startsWith('/auth/')) {
              window.location.href = '/auth/login';
            }
          }
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          // Don't toast for 404 - let the component handle it
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
          toast.error('Too many requests. Please slow down.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          if (data?.message) {
            toast.error(data.message);
          }
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// ============== AUTH API ==============
export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => api.post('/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/login', data),

  logout: () => api.post('/logout'),

  getProfile: () => api.get('/user'),

  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put('/user', data),

  changePassword: (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.put('/user/password', data),
};

// ============== HOTELS API ==============
export const hotelsApi = {
  list: (params?: Record<string, any>) =>
    api.get('/hotels', { params }),

  getBySlug: (slug: string) =>
    api.get(`/hotels/${slug}`),

  getFeatured: () =>
    api.get('/hotels', { params: { featured: true, per_page: 6 } }),

  search: (params: Record<string, any>) =>
    api.get('/hotels', { params }),
};

// ============== ROOM TYPES API ==============
export const roomTypesApi = {
  listByHotel: (hotelId: number, params?: Record<string, any>) =>
    api.get(`/hotels/${hotelId}/room-types`, { params }),

  getById: (hotelId: number, roomTypeId: number) =>
    api.get(`/hotels/${hotelId}/room-types/${roomTypeId}`),
};

// ============== AVAILABILITY API ==============
export const availabilityApi = {
  check: (params: {
    hotel_id?: number;
    room_type_id?: number;
    check_in: string;
    check_out: string;
    guests?: number;
  }) => api.get('/availability', { params }),

  checkHotel: (hotelId: number, params: {
    check_in: string;
    check_out: string;
    guests?: number;
  }) => api.get(`/availability/hotel/${hotelId}`, { params }),
};

// ============== BOOKINGS API ==============
export const bookingsApi = {
  list: (params?: Record<string, any>) =>
    api.get('/bookings', { params }),

  create: (data: {
    hotel_id: number;
    room_type_id: number;
    check_in: string;
    check_out: string;
    guests: number;
    special_requests?: string;
  }) => api.post('/bookings', data),

  getById: (id: number) =>
    api.get(`/bookings/${id}`),

  cancel: (id: number, reason?: string) =>
    api.put(`/bookings/${id}/cancel`, { cancellation_reason: reason }),
};

// ============== PAYMENTS API ==============
export const paymentsApi = {
  create: (data: {
    booking_id: number;
    method: 'stripe' | 'paypal';
  }) => api.post('/payments', data),

  getByBooking: (bookingId: number) =>
    api.get(`/bookings/${bookingId}/payment`),

  confirm: (paymentId: number, data?: Record<string, any>) =>
    api.post(`/payments/${paymentId}/confirm`, data),
};

// ============== REVIEWS API ==============
export const reviewsApi = {
  listByHotel: (hotelId: number, params?: Record<string, any>) =>
    api.get(`/hotels/${hotelId}/reviews`, { params }),

  create: (bookingId: number, data: {
    rating: number;
    title: string;
    comment: string;
    pros?: string;
    cons?: string;
  }) => api.post(`/bookings/${bookingId}/review`, data),

  update: (reviewId: number, data: {
    rating: number;
    title: string;
    comment: string;
    pros?: string;
    cons?: string;
  }) => api.put(`/reviews/${reviewId}`, data),

  delete: (reviewId: number) =>
    api.delete(`/reviews/${reviewId}`),
};

// ============== INVOICES API ==============
export const invoicesApi = {
  download: (bookingId: number) =>
    api.get(`/bookings/${bookingId}/invoice`, {
      responseType: 'blob',
    }),

  send: (bookingId: number) =>
    api.post(`/bookings/${bookingId}/invoice/send`),
};

export default api;
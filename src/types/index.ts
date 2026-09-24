export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'guest' | 'admin';
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Hotel {
  id: number;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  stars: number;
  check_in_time: string;
  check_out_time: string;
  amenities: string[];
  images: string[];
  is_active: boolean;
  average_rating?: number;
  reviews_count?: number;
  min_price?: number;
  room_types?: RoomType[];
  reviews?: Review[];
  created_at: string;
  updated_at: string;
}

export interface RoomType {
  id: number;
  hotel_id: number;
  name: string;
  slug: string;
  description: string;
  price_per_night: number;
  max_guests: number;
  bed_type: string;
  room_size?: number;
  amenities: string[];
  images: string[];
  is_active: boolean;
  total_rooms: number;
  available_rooms?: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  room_type_id: number;
  room_number: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance';
}

export interface Booking {
  id: number;
  booking_number: string;
  user_id: number;
  hotel_id: number;
  room_type_id: number;
  room_id?: number;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  base_price: number;
  total_price: number;
  taxes: number;
  status: BookingStatus;
  special_requests?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  hotel?: Hotel;
  room_type?: RoomType;
  room?: Room;
  user?: User;
  payment?: Payment;
  review?: Review;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  currency: string;
  method: 'stripe' | 'paypal' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  stripe_payment_intent_id?: string;
  stripe_client_secret?: string;
  paid_at?: string;
  refunded_at?: string;
  booking?: Booking;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  booking_id: number;
  user_id: number;
  hotel_id: number;
  rating: number;
  title: string;
  comment: string;
  pros?: string;
  cons?: string;
  is_verified: boolean;
  user?: User;
  hotel?: Hotel;
  booking?: Booking;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  city?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  stars?: number;
  amenities?: string[];
  sort_by?: 'price_asc' | 'price_desc' | 'rating' | 'name';
  page?: number;
  per_page?: number;
}

export interface AvailabilityQuery {
  hotel_id?: number;
  room_type_id?: number;
  check_in: string;
  check_out: string;
  guests?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
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

export interface BookingFormData {
  hotel_id: number;
  room_type_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  special_requests?: string;
}

export interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
  pros?: string;
  cons?: string;
}

export interface PaymentFormData {
  booking_id: number;
  method: 'stripe' | 'paypal';
}

export interface InvoiceData {
  booking_id: number;
  url: string;
}
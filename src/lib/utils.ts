import { clsx, type ClassValue } from 'clsx';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Safely coerce any backend value (number, numeric string, null) to a number.
 */
export function toNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const num =
    typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Pick the first field present on an object that resolves to a usable number.
 */
function pickNumber(source: unknown, keys: string[]): number | null {
  if (!source || typeof source !== 'object') return null;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const raw = record[key];
    if (raw === null || raw === undefined || raw === '') continue;
    const num = toNumber(raw, NaN);
    if (!isNaN(num)) return num;
  }
  return null;
}

/** Anything booking-shaped: a typed Booking, or a raw/partial API payload. */
export type BookingPriceSource = Record<string, unknown> | object | null;

export interface BookingPriceBreakdown {
  nights: number;
  nightlyRate: number;
  subtotal: number;
  taxes: number;
  total: number;
}

/**
 * Derive a consistent price breakdown for a booking.
 *
 * Backends name these fields inconsistently (base_price / price_per_night /
 * total_amount / tax_amount ...) and often return them as decimal strings or
 * omit them entirely. Whatever is missing is reconstructed from what is known
 * so the breakdown always adds up to the total.
 */
export function getBookingPriceBreakdown(
  bookingLike?: BookingPriceSource,
): BookingPriceBreakdown {
  if (!bookingLike) {
    return { nights: 1, nightlyRate: 0, subtotal: 0, taxes: 0, total: 0 };
  }

  const booking = bookingLike as Record<string, unknown>;

  // ── Nights ──
  let nights = toNumber(booking.nights, 0);
  if (nights <= 0 && booking.check_in && booking.check_out) {
    nights = calculateNights(booking.check_in as string, booking.check_out as string);
  }
  nights = Math.max(Math.round(nights) || 1, 1);

  // ── Total ──
  let total =
    pickNumber(booking, [
      'total_price',
      'total_amount',
      'grand_total',
      'total',
      'amount',
      'final_price',
    ]) ?? 0;
  if (total <= 0) {
    total = toNumber((booking.payment as Record<string, unknown> | undefined)?.amount, 0);
  }

  // ── Taxes & fees ──
  let taxes =
    pickNumber(booking, [
      'taxes',
      'tax',
      'tax_amount',
      'taxes_and_fees',
      'total_taxes',
      'service_fee',
    ]) ?? 0;
  if (taxes < 0) taxes = 0;

  // ── Subtotal (room cost before taxes) ──
  let subtotal = pickNumber(booking, ['subtotal', 'sub_total', 'room_total']) ?? 0;

  // ── Nightly rate ──
  let nightlyRate =
    pickNumber(booking, [
      'base_price',
      'price_per_night',
      'nightly_rate',
      'rate_per_night',
      'room_price',
      'price',
    ]) ?? 0;

  if (nightlyRate <= 0) {
    nightlyRate = getRoomPrice(booking.room_type ?? booking.roomType);
  }

  if (nightlyRate <= 0 && subtotal > 0) {
    nightlyRate = subtotal / nights;
  }

  // Last resort: back the nightly rate out of the total.
  if (nightlyRate <= 0 && total > 0) {
    const derivedSubtotal = taxes > 0 && taxes < total ? total - taxes : total;
    nightlyRate = derivedSubtotal / nights;
  }

  if (subtotal <= 0) {
    subtotal = nightlyRate * nights;
  }

  // Keep the breakdown internally consistent with the total.
  if (total > 0) {
    if (subtotal > total && taxes <= 0) {
      subtotal = total;
      nightlyRate = total / nights;
    }
    if (taxes <= 0) {
      const remainder = total - subtotal;
      taxes = remainder > 0.005 ? remainder : 0;
    }
  } else {
    total = subtotal + taxes;
  }

  return { nights, nightlyRate, subtotal, taxes, total };
}

export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : Number(amount);
  const validNum = isNaN(num) ? 0 : num;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(validNum);
}

/**
 * Robust room price extractor that supports any backend object structure
 */
export function getRoomPrice(roomType?: any): number {
  if (!roomType) return 0;

  const target = roomType.room_type || roomType.roomType || roomType;

  const rawPrice =
    target.base_price ??
    target.price ??
    target.price_per_night ??
    target.nightly_rate ??
    target.rate ??
    target.amount ??
    target.cost ??
    target.final_price ??
    roomType.base_price ??
    roomType.price ??
    0;

  const num = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : Number(rawPrice);
  return isNaN(num) ? 0 : num;
}

/**
 * Robust hotel minimum price extractor with room_types fallback
 */
export function getHotelMinPrice(hotel?: any): number {
  if (!hotel) return 0;

  const directMin =
    hotel.min_price ??
    hotel.starting_price ??
    hotel.lowest_price ??
    hotel.price_from ??
    hotel.price;

  if (directMin !== undefined && directMin !== null) {
    const num = typeof directMin === 'string' ? parseFloat(directMin.replace(/[^0-9.]/g, '')) : Number(directMin);
    if (!isNaN(num) && num > 0) return num;
  }

  // Calculate lowest price from room_types if available
  if (Array.isArray(hotel.room_types) && hotel.room_types.length > 0) {
    const prices = hotel.room_types
      .map((r: any) => getRoomPrice(r))
      .filter((p: number) => p > 0);

    if (prices.length > 0) {
      return Math.min(...prices);
    }
  }

  return 0;
}

export function formatDate(date: string | Date, formatStr: string = 'MMM dd, yyyy'): string {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) return '';
    return format(parsedDate, formatStr);
  } catch {
    return '';
  }
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  try {
    const start = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
    const end = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
    if (!isValid(start) || !isValid(end)) return 1;
    const diff = differenceInDays(end, start);
    return diff > 0 ? diff : 1;
  } catch {
    return 1;
  }
}

export function getImageUrl(imageSource?: any): string {
  const DEFAULT_PLACEHOLDER =
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';

  if (!imageSource) return DEFAULT_PLACEHOLDER;

  if (Array.isArray(imageSource)) {
    if (imageSource.length === 0) return DEFAULT_PLACEHOLDER;
    return getImageUrl(imageSource[0]);
  }

  let pathStr = '';
  if (typeof imageSource === 'object' && imageSource !== null) {
    pathStr =
      imageSource.url ||
      imageSource.path ||
      imageSource.original_url ||
      imageSource.file_name ||
      '';
  } else if (typeof imageSource === 'string') {
    pathStr = imageSource;
  } else {
    pathStr = String(imageSource);
  }

  if (typeof pathStr !== 'string') return DEFAULT_PLACEHOLDER;

  pathStr = pathStr.trim();
  if (!pathStr || pathStr === 'placeholder-hotel.jpg' || pathStr === 'undefined' || pathStr === 'null') {
    return DEFAULT_PLACEHOLDER;
  }

  if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
    return pathStr;
  }

  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:8000/storage';
  return `${storageUrl}/${pathStr.replace(/^\/+/, '')}`;
}

export function getStatusColor(status: string): { bg: string; text: string; dot: string } {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    checked_in: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    checked_out: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    no_show: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
    completed: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    refunded: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  };
  return colors[status] || colors.pending;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    checked_in: 'Checked In',
    checked_out: 'Checked Out',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}

export function generateBookingDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  return {
    minCheckIn: format(today, 'yyyy-MM-dd'),
    defaultCheckIn: format(tomorrow, 'yyyy-MM-dd'),
    defaultCheckOut: format(dayAfterTomorrow, 'yyyy-MM-dd'),
  };
}

export const AMENITY_ICONS: Record<string, string> = {
  wifi: '📶',
  parking: '🅿️',
  pool: '🏊',
  gym: '💪',
  spa: '💆',
  restaurant: '🍽️',
  bar: '🍸',
  room_service: '🛎️',
  laundry: '👔',
  airport_shuttle: '✈️',
  pet_friendly: '🐾',
  business_center: '💼',
  concierge: '🔑',
  air_conditioning: '❄️',
  heating: '🔥',
  kitchen: '🍳',
  tv: '📺',
  minibar: '🍫',
  balcony: '🏞️',
  ocean_view: '🌊',
};
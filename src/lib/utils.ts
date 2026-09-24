import { clsx, type ClassValue } from "clsx";
import { format, parseISO, differenceInDays, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  formatStr: string = "MMM dd, yyyy",
): string {
  if (!date) return "";
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsedDate)) return "";
  return format(parsedDate, formatStr);
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function calculateNights(
  checkIn: string | Date,
  checkOut: string | Date,
): number {
  const start = typeof checkIn === "string" ? parseISO(checkIn) : checkIn;
  const end = typeof checkOut === "string" ? parseISO(checkOut) : checkOut;
  return Math.max(differenceInDays(end, start), 0);
}

// src/lib/utils.ts

export function getImageUrl(path: unknown): string {
  if (!path) return "/images/placeholder-hotel.jpg";

  // If an array was passed, pick the first item
  if (Array.isArray(path)) {
    return getImageUrl(path[0]);
  }

  // If an object was passed (e.g., { url: '...' } or { src: '...' } or { path: '...' })
  if (typeof path === "object" && path !== null) {
    const obj = path as Record<string, unknown>;
    const extracted = obj.url || obj.src || obj.path || obj.image_url;
    if (typeof extracted === "string") {
      return getImageUrl(extracted);
    }
    return "/images/placeholder-hotel.jpg";
  }

  // Ensure it's a string before calling string methods
  if (typeof path !== "string") {
    return "/images/placeholder-hotel.jpg";
  }

  // If it's already a full URL or absolute path
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }

  const storageUrl =
    process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000/storage";

  return `${storageUrl}/${path.replace(/^\/+/, "")}`;
}

export function getStatusColor(status: string): {
  bg: string;
  text: string;
  dot: string;
} {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    pending: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      dot: "bg-yellow-500",
    },
    confirmed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    checked_in: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-500",
    },
    checked_out: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      dot: "bg-gray-500",
    },
    cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    no_show: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
    completed: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-500",
    },
    failed: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    refunded: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
  };
  return colors[status] || colors.pending;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    checked_in: "Checked In",
    checked_out: "Checked Out",
    cancelled: "Cancelled",
    no_show: "No Show",
    completed: "Completed",
    failed: "Failed",
    refunded: "Refunded",
  };
  return labels[status] || status;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function generateBookingDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  return {
    minCheckIn: format(today, "yyyy-MM-dd"),
    defaultCheckIn: format(tomorrow, "yyyy-MM-dd"),
    defaultCheckOut: format(dayAfterTomorrow, "yyyy-MM-dd"),
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶",
  parking: "🅿️",
  pool: "🏊",
  gym: "💪",
  spa: "💆",
  restaurant: "🍽️",
  bar: "🍸",
  room_service: "🛎️",
  laundry: "👔",
  airport_shuttle: "✈️",
  pet_friendly: "🐾",
  business_center: "💼",
  concierge: "🔑",
  air_conditioning: "❄️",
  heating: "🔥",
  kitchen: "🍳",
  tv: "📺",
  minibar: "🍫",
  balcony: "🏞️",
  ocean_view: "🌊",
};

/** BD-specific formatting helpers for dates, currency, and phone numbers. */

import { BD } from "./constants";

/**
 * Format a UTC ISO 8601 string to Asia/Dhaka (BST) display format.
 *
 * @param utcString - ISO 8601 date string in UTC (e.g. "2026-03-02T10:30:00Z").
 * @param options - Optional Intl.DateTimeFormat options override.
 * @returns Formatted date string in BST (e.g. "2 Mar, 2026, 4:30 PM").
 */
export function formatDateBST(
  utcString: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(BD.LOCALE_EN, {
    timeZone: BD.TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(new Date(utcString));
}

/**
 * Format a number as Bangladeshi Taka (BDT) currency.
 *
 * @param amount - Numeric amount (number or string from API Decimal field).
 * @returns Formatted currency string (e.g. "৳250.00").
 */
export function formatBDT(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(BD.LOCALE_EN, {
    style: "currency",
    currency: BD.CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Validate a Bangladeshi phone number (01XXXXXXXXX, 11 digits).
 *
 * @param phone - Phone number string to validate.
 * @returns True if valid BD phone number.
 */
export function isValidBDPhone(phone: string): boolean {
  return BD.PHONE_REGEX.test(phone);
}

/**
 * Format a BD phone number as 01X-XXXX-XXXX.
 *
 * @param phone - 11-digit BD phone number (e.g. "01712345678").
 * @returns Formatted phone string (e.g. "017-1234-5678").
 */
export function formatBDPhone(phone: string): string {
  if (!isValidBDPhone(phone)) return phone;
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

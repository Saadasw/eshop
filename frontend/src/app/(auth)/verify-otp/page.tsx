/**
 * OTP verification page — renders the OtpForm client component.
 *
 * Wrapped in Suspense because OtpForm reads searchParams via useSearchParams(),
 * which requires a Suspense boundary in Next.js App Router.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { OtpForm } from "@/components/auth/otp-form";

export const metadata: Metadata = {
  title: "Verify OTP | E-Shop",
  description: "Enter the verification code sent to your phone",
};

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <OtpForm />
    </Suspense>
  );
}

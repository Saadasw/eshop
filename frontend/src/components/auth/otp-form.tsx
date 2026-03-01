"use client";

/**
 * OTP verification form for phone login flow.
 *
 * Flow:
 * 1. User receives OTP on phone (sent from login page)
 * 2. User enters 6-digit OTP
 * 3. Supabase verifyOtp confirms the code
 * 4. POST /auth/login with Supabase token
 * 5. Store JWT, redirect to home
 *
 * Supports resending OTP with a cooldown timer.
 */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { login } from "@/lib/api/auth";
import { useAuth } from "@/providers/auth-provider";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { formatBDPhone } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/constants";
import type { ErrorResponse } from "@/types/database";

const RESEND_COOLDOWN_SECONDS = 60;

export function OtpForm() {
  /** Renders OTP verification form with resend capability. */
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const { setAuth } = useAuth();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthRedirect();

  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    /** Count down the resend cooldown timer. */
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    /** Resend OTP to the same phone number. */
    if (resendCooldown > 0 || !phone) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+88${phone}`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("OTP resent to your phone");
    } catch {
      toast.error("Failed to resend OTP");
    }
  }, [phone, resendCooldown]);

  async function handleSubmit(e: FormEvent) {
    /** Verify OTP with Supabase, then authenticate with backend. */
    e.preventDefault();

    if (!phone) {
      toast.error("Phone number is missing. Please go back to login.");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+88${phone}`,
        token: otp,
        type: "sms",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.session) {
        toast.error("Failed to verify OTP");
        return;
      }

      const response = await login({
        supabase_token: data.session.access_token,
        user_agent: navigator.userAgent,
      });

      setAuth(response);
      toast.success("Logged in successfully");
      router.push(ROUTES.HOME);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data as ErrorResponse)?.detail || err.message
          : "Verification failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading || isAuthenticated) return null;

  if (!phone) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
          <CardDescription>
            No phone number provided. Please start from the login page.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href={ROUTES.LOGIN}
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Verify OTP</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to{" "}
          <span className="font-medium text-foreground">
            {formatBDPhone(phone)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              required
              maxLength={6}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={isSubmitting}
              className="text-center text-lg tracking-widest"
              autoComplete="one-time-code"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify & Login"}
          </Button>
          <div className="text-center">
            {resendCooldown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend OTP in {resendCooldown}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href={ROUTES.LOGIN}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}

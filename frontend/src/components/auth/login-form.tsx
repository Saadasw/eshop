"use client";

/**
 * Login form with two modes: email+password and phone+OTP.
 *
 * Flow:
 * 1. Email+Password: Supabase signInWithPassword → backend /auth/login → store JWT
 * 2. Phone+OTP: Supabase signInWithOtp → redirect to /verify-otp
 */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { login } from "@/lib/api/auth";
import { useAuth } from "@/providers/auth-provider";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { isValidBDPhone } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/constants";
import type { ErrorResponse } from "@/types/database";

export function LoginForm() {
  /** Renders login form with email/password and phone/OTP tabs. */
  const router = useRouter();
  const { setAuth } = useAuth();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthRedirect();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone OTP state
  const [phone, setPhone] = useState("");

  async function handleEmailLogin(e: FormEvent) {
    /** Sign in with email+password via Supabase, then authenticate with backend. */
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
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
          : "Login failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePhoneOtp(e: FormEvent) {
    /** Send OTP to phone via Supabase, then redirect to verification page. */
    e.preventDefault();

    if (!isValidBDPhone(phone)) {
      toast.error("Please enter a valid BD phone number (01XXXXXXXXX)");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+88${phone}`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("OTP sent to your phone");
      router.push(`${ROUTES.VERIFY_OTP}?phone=${encodeURIComponent(phone)}`);
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading || isAuthenticated) return null;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="email" className="flex-1">
              Email
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex-1">
              Phone OTP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone">
            <form onSubmit={handlePhoneOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  required
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll send you a one-time verification code
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={ROUTES.REGISTER}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Register
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

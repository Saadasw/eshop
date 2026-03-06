"use client";

/**
 * Registration form for new users.
 *
 * Flow:
 * 1. User fills full_name, email, phone, password
 * 2. Supabase signUp creates the auth user
 * 3. POST /auth/register with Supabase token + profile data
 * 4. Store JWT, redirect to home
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
import { createClient } from "@/lib/supabase/client";
import { register } from "@/lib/api/auth";
import { useAuth } from "@/providers/auth-provider";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { isValidBDPhone } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/constants";
import type { ErrorResponse } from "@/types/database";

export function RegisterForm() {
  /** Renders the registration form with BD phone validation. */
  const router = useRouter();
  const { setAuth } = useAuth();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthRedirect();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    /** Validate inputs, call Supabase signUp, then register with backend. */
    e.preventDefault();

    if (!isValidBDPhone(phone)) {
      toast.error("Please enter a valid BD phone number (01XXXXXXXXX)");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      let supabaseToken = "local";

      if (process.env.NEXT_PUBLIC_AUTH_PROVIDER !== "local") {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          phone: `+88${phone}`,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (!data.session) {
          toast.error("Failed to create auth session");
          return;
        }

        supabaseToken = data.session.access_token;
      }

      const response = await register({
        supabase_token: supabaseToken,
        full_name: fullName,
        email,
        phone,
        password,
      });

      setAuth(response);
      toast.success("Account created successfully");
      router.push(ROUTES.HOME);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data as ErrorResponse)?.detail || err.message
          : "Registration failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading || isAuthenticated) return null;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>
          Register to start shopping or create your own store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Your full name"
              required
              minLength={1}
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-phone">Phone Number</Label>
            <Input
              id="reg-phone"
              type="tel"
              placeholder="01XXXXXXXXX"
              required
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Bangladeshi number starting with 01
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="At least 6 characters"
              required
              minLength={6}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={ROUTES.LOGIN}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

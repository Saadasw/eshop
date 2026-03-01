/**
 * Login page — renders the LoginForm client component.
 */

import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | E-Shop",
  description: "Sign in to your E-Shop account",
};

export default function LoginPage() {
  return <LoginForm />;
}

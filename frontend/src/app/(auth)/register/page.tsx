/**
 * Register page — renders the RegisterForm client component.
 */

import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register | E-Shop",
  description: "Create your E-Shop account",
};

export default function RegisterPage() {
  return <RegisterForm />;
}

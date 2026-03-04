import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">E-Shop</h1>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        Multi-tenant e-commerce platform for local Bangladeshi shops.
      </p>
      <div className="flex gap-3">
        <Button size="lg" asChild>
          <Link href="/shops">
            <Store className="mr-2 h-5 w-5" />
            Browse Shops
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/register">Register</Link>
        </Button>
      </div>
    </div>
  );
}

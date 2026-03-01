import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">E-Shop</h1>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        Multi-tenant e-commerce platform for local Bangladeshi shops.
      </p>
      <Button size="lg">Get Started</Button>
    </div>
  );
}

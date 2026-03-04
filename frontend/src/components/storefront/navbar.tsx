/** Top navigation bar with logo, browse link, cart badge, and user dropdown. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Store, LogOut, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/hooks/use-cart";
import { useShops } from "@/hooks/use-shops";
import { ROUTES, STATIC_PATHS } from "@/lib/utils/constants";

/** Extract shop slug from pathname if the first segment is a dynamic shop route. */
function extractShopSlug(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const first = segments[0];
  if (STATIC_PATHS.includes(first as (typeof STATIC_PATHS)[number])) {
    return null;
  }
  return first;
}

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const shopSlug = extractShopSlug(pathname);
  const { data: cart } = useCart(shopSlug ?? "");

  const isOwner = user?.primary_role === "owner";
  const { data: myShops } = useShops(
    isOwner ? { owner_id: user.user_id, limit: 1 } : undefined,
  );
  const ownerShopSlug = myShops?.items?.[0]?.slug;

  const cartCount = shopSlug && cart ? cart.item_count : 0;

  const userInitials = user
    ? user.full_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={ROUTES.HOME} className="text-lg font-bold">
            E-Shop
          </Link>
          <Link
            href={ROUTES.SHOPS}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Store className="h-4 w-4" />
            Browse Shops
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {shopSlug && user && (
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href={ROUTES.CART(shopSlug)}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>
          )}

          {isLoading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="font-medium">
                  <User className="mr-2 h-4 w-4" />
                  {user.full_name}
                </DropdownMenuItem>
                {ownerShopSlug && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={ROUTES.DASHBOARD(ownerShopSlug)}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.ORDERS}>My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.LOGIN}>Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={ROUTES.REGISTER}>Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

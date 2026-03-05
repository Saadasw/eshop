import type { Metadata } from "next";
import { WishlistPage } from "@/components/storefront/wishlist-page";

export const metadata: Metadata = {
  title: "My Wishlist | E-Shop",
};

export default function Page() {
  return <WishlistPage />;
}

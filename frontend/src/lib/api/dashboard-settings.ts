/** Typed API wrappers for shop settings (config, delivery zones, payment methods, staff). */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  ShopConfigRead,
  ShopConfigUpdate,
  ShopUpdate,
  DeliveryZoneRead,
  DeliveryZoneCreate,
  DeliveryZoneUpdate,
  ShopPaymentMethodRead,
  ShopPaymentMethodCreate,
  ShopPaymentMethodUpdate,
  StaffRead,
  StaffCreate,
  StaffUpdate,
  ShopAddressRead,
  ShopAddressCreate,
  ShopAddressUpdate,
  ShopRead,
} from "@/types/database";

// --- Shop Config ---

/** Get shop configuration. */
export async function getShopConfig(slug: string): Promise<ShopConfigRead> {
  const response = await api.get<ShopConfigRead>(
    API_ROUTES.SHOP.SETTINGS(slug),
  );
  return response.data;
}

/** Update shop configuration. */
export async function updateShopConfig(
  slug: string,
  data: ShopConfigUpdate,
): Promise<ShopConfigRead> {
  const response = await api.patch<ShopConfigRead>(
    API_ROUTES.SHOP.SETTINGS(slug),
    data,
  );
  return response.data;
}

/** Update shop basic info (name, description, contact). */
export async function updateShopInfo(
  slug: string,
  data: ShopUpdate,
): Promise<ShopRead> {
  const response = await api.patch<ShopRead>(
    `${API_ROUTES.SHOPS}/${slug}`,
    data,
  );
  return response.data;
}

// --- Delivery Zones ---

/** List delivery zones. */
export async function listDeliveryZones(
  slug: string,
): Promise<DeliveryZoneRead[]> {
  const response = await api.get<DeliveryZoneRead[]>(
    API_ROUTES.SHOP.DELIVERY_ZONES(slug),
  );
  return response.data;
}

/** Create a delivery zone. */
export async function createDeliveryZone(
  slug: string,
  data: DeliveryZoneCreate,
): Promise<DeliveryZoneRead> {
  const response = await api.post<DeliveryZoneRead>(
    API_ROUTES.SHOP.DELIVERY_ZONES(slug),
    data,
  );
  return response.data;
}

/** Update a delivery zone. */
export async function updateDeliveryZone(
  slug: string,
  zoneId: string,
  data: DeliveryZoneUpdate,
): Promise<DeliveryZoneRead> {
  const response = await api.patch<DeliveryZoneRead>(
    API_ROUTES.SHOP.DELIVERY_ZONE(slug, zoneId),
    data,
  );
  return response.data;
}

/** Delete a delivery zone. */
export async function deleteDeliveryZone(
  slug: string,
  zoneId: string,
): Promise<void> {
  await api.delete(API_ROUTES.SHOP.DELIVERY_ZONE(slug, zoneId));
}

// --- Payment Methods ---

/** List payment methods. */
export async function listPaymentMethods(
  slug: string,
): Promise<ShopPaymentMethodRead[]> {
  const response = await api.get<ShopPaymentMethodRead[]>(
    API_ROUTES.SHOP.PAYMENT_METHODS(slug),
  );
  return response.data;
}

/** Create a payment method. */
export async function createPaymentMethod(
  slug: string,
  data: ShopPaymentMethodCreate,
): Promise<ShopPaymentMethodRead> {
  const response = await api.post<ShopPaymentMethodRead>(
    API_ROUTES.SHOP.PAYMENT_METHODS(slug),
    data,
  );
  return response.data;
}

/** Update a payment method. */
export async function updatePaymentMethod(
  slug: string,
  spmId: string,
  data: ShopPaymentMethodUpdate,
): Promise<ShopPaymentMethodRead> {
  const response = await api.patch<ShopPaymentMethodRead>(
    API_ROUTES.SHOP.PAYMENT_METHOD(slug, spmId),
    data,
  );
  return response.data;
}

// --- Staff ---

/** List staff members. */
export async function listStaff(slug: string): Promise<StaffRead[]> {
  const response = await api.get<StaffRead[]>(API_ROUTES.SHOP.STAFF(slug));
  return response.data;
}

/** Add a staff member. */
export async function createStaff(
  slug: string,
  data: StaffCreate,
): Promise<StaffRead> {
  const response = await api.post<StaffRead>(
    API_ROUTES.SHOP.STAFF(slug),
    data,
  );
  return response.data;
}

/** Update a staff member. */
export async function updateStaff(
  slug: string,
  staffId: string,
  data: StaffUpdate,
): Promise<StaffRead> {
  const response = await api.patch<StaffRead>(
    API_ROUTES.SHOP.STAFF_MEMBER(slug, staffId),
    data,
  );
  return response.data;
}

/** Remove a staff member. */
export async function removeStaff(
  slug: string,
  staffId: string,
): Promise<void> {
  await api.delete(API_ROUTES.SHOP.STAFF_MEMBER(slug, staffId));
}

// --- Addresses ---

/** List shop addresses. */
export async function listAddresses(
  slug: string,
): Promise<ShopAddressRead[]> {
  const response = await api.get<ShopAddressRead[]>(
    API_ROUTES.SHOP.ADDRESSES(slug),
  );
  return response.data;
}

/** Create shop address. */
export async function createAddress(
  slug: string,
  data: ShopAddressCreate,
): Promise<ShopAddressRead> {
  const response = await api.post<ShopAddressRead>(
    API_ROUTES.SHOP.ADDRESSES(slug),
    data,
  );
  return response.data;
}

/** Update shop address. */
export async function updateAddress(
  slug: string,
  addressId: string,
  data: ShopAddressUpdate,
): Promise<ShopAddressRead> {
  const response = await api.patch<ShopAddressRead>(
    API_ROUTES.SHOP.ADDRESS(slug, addressId),
    data,
  );
  return response.data;
}

/** Delete shop address. */
export async function deleteAddress(
  slug: string,
  addressId: string,
): Promise<void> {
  await api.delete(API_ROUTES.SHOP.ADDRESS(slug, addressId));
}

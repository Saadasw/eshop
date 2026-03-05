/** Typed API wrappers for customer address CRUD. */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  CustomerAddressRead,
  CustomerAddressCreate,
  CustomerAddressUpdate,
} from "@/types/database";

/** List all addresses for the current user. */
export async function listAddresses(): Promise<CustomerAddressRead[]> {
  const response = await api.get<CustomerAddressRead[]>(API_ROUTES.ADDRESSES);
  return response.data;
}

/** Create a new delivery address. */
export async function createAddress(
  data: CustomerAddressCreate,
): Promise<CustomerAddressRead> {
  const response = await api.post<CustomerAddressRead>(
    API_ROUTES.ADDRESSES,
    data,
  );
  return response.data;
}

/** Update an address. */
export async function updateAddress(
  addressId: string,
  data: CustomerAddressUpdate,
): Promise<CustomerAddressRead> {
  const response = await api.patch<CustomerAddressRead>(
    API_ROUTES.ADDRESS(addressId),
    data,
  );
  return response.data;
}

/** Delete an address. */
export async function deleteAddress(addressId: string): Promise<void> {
  await api.delete(API_ROUTES.ADDRESS(addressId));
}

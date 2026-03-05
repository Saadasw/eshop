/** TanStack Query hooks for customer address CRUD. */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "@/lib/api/addresses";
import type {
  CustomerAddressCreate,
  CustomerAddressUpdate,
} from "@/types/database";

/** List all addresses for the current user. */
export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: listAddresses,
  });
}

/** Create a new address. */
export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerAddressCreate) => createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

/** Update an address. */
export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      addressId,
      data,
    }: {
      addressId: string;
      data: CustomerAddressUpdate;
    }) => updateAddress(addressId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

/** Delete an address. */
export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

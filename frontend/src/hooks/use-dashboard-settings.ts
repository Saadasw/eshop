/** TanStack Query hooks for shop settings management. */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getShopConfig,
  updateShopConfig,
  updateShopInfo,
  listDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  listStaff,
  createStaff,
  updateStaff,
  removeStaff,
} from "@/lib/api/dashboard-settings";
import type {
  ShopConfigUpdate,
  ShopUpdate,
  DeliveryZoneCreate,
  DeliveryZoneUpdate,
  ShopPaymentMethodCreate,
  ShopPaymentMethodUpdate,
  StaffCreate,
  StaffUpdate,
} from "@/types/database";

// --- Config ---

/** Fetch shop config. */
export function useShopConfig(slug: string) {
  return useQuery({
    queryKey: ["shop-config", slug],
    queryFn: () => getShopConfig(slug),
    enabled: !!slug,
  });
}

/** Mutation to update shop config. */
export function useUpdateShopConfig(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShopConfigUpdate) => updateShopConfig(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-config", slug] });
    },
  });
}

/** Mutation to update shop basic info. */
export function useUpdateShopInfo(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShopUpdate) => updateShopInfo(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", slug] });
    },
  });
}

// --- Delivery Zones ---

/** Fetch delivery zones. */
export function useDeliveryZones(slug: string) {
  return useQuery({
    queryKey: ["delivery-zones", slug],
    queryFn: () => listDeliveryZones(slug),
    enabled: !!slug,
  });
}

/** Mutation to create delivery zone. */
export function useCreateDeliveryZone(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeliveryZoneCreate) => createDeliveryZone(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones", slug] });
    },
  });
}

/** Mutation to update delivery zone. */
export function useUpdateDeliveryZone(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, data }: { zoneId: string; data: DeliveryZoneUpdate }) =>
      updateDeliveryZone(slug, zoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones", slug] });
    },
  });
}

/** Mutation to delete delivery zone. */
export function useDeleteDeliveryZone(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (zoneId: string) => deleteDeliveryZone(slug, zoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones", slug] });
    },
  });
}

// --- Payment Methods ---

/** Fetch payment methods. */
export function usePaymentMethods(slug: string) {
  return useQuery({
    queryKey: ["payment-methods", slug],
    queryFn: () => listPaymentMethods(slug),
    enabled: !!slug,
  });
}

/** Mutation to create payment method. */
export function useCreatePaymentMethod(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShopPaymentMethodCreate) => createPaymentMethod(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", slug] });
    },
  });
}

/** Mutation to update payment method. */
export function useUpdatePaymentMethod(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spmId, data }: { spmId: string; data: ShopPaymentMethodUpdate }) =>
      updatePaymentMethod(slug, spmId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", slug] });
    },
  });
}

// --- Staff ---

/** Fetch staff list. */
export function useStaffList(slug: string) {
  return useQuery({
    queryKey: ["staff", slug],
    queryFn: () => listStaff(slug),
    enabled: !!slug,
  });
}

/** Mutation to add staff. */
export function useCreateStaff(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffCreate) => createStaff(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", slug] });
    },
  });
}

/** Mutation to update staff. */
export function useUpdateStaff(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, data }: { staffId: string; data: StaffUpdate }) =>
      updateStaff(slug, staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", slug] });
    },
  });
}

/** Mutation to remove staff. */
export function useRemoveStaff(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => removeStaff(slug, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", slug] });
    },
  });
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Listing, ListingInput, Order, OrderPatch, OrderStatus, Payout, Store, StoreStats } from '../api/types';
import { PENDING_STATUSES } from '../lib/format';

interface SellerData {
  loading: boolean;
  error: string | null;
  store: Store | null;
  stats: StoreStats | null;
  orders: Order[];
  listings: Listing[];
  payouts: Payout[];
  pendingOrders: Order[];
  toast: string | null;
  notify: (message: string) => void;
  setOrderStatus: (id: string, status: OrderStatus, patch?: OrderPatch) => Promise<void>;
  updateOrder: (id: string, patch: OrderPatch) => Promise<void>;
  saveListing: (input: ListingInput, id?: string) => Promise<Listing>;
  updateStore: (patch: Partial<Store>) => Promise<void>;
}

const SellerDataContext = createContext<SellerData | null>(null);

export function SellerDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getStore(), api.getStats(), api.getOrders(), api.getListings(), api.getPayouts()])
      .then(([s, st, o, l, p]) => {
        setStore(s);
        setStats(st);
        setOrders(o);
        setListings(l);
        setPayouts(p);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load your store'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback((message: string) => setToast(message), []);

  const setOrderStatus = useCallback(async (id: string, status: OrderStatus, patch?: OrderPatch) => {
    const updated = await api.updateOrderStatus(id, status, patch);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  }, []);

  const updateOrder = useCallback(async (id: string, patch: OrderPatch) => {
    const updated = await api.updateOrder(id, patch);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  }, []);

  const saveListing = useCallback(async (input: ListingInput, id?: string) => {
    const saved = await api.saveListing(input, id);
    setListings((prev) => (id ? prev.map((l) => (l.id === id ? saved : l)) : [saved, ...prev]));
    return saved;
  }, []);

  const updateStore = useCallback(async (patch: Partial<Store>) => {
    setStore(await api.updateStore(patch));
  }, []);

  const value = useMemo<SellerData>(
    () => ({
      loading,
      error,
      store,
      stats,
      orders,
      listings,
      payouts,
      pendingOrders: orders.filter((o) => PENDING_STATUSES.includes(o.status)),
      toast,
      notify,
      setOrderStatus,
      updateOrder,
      saveListing,
      updateStore,
    }),
    [loading, error, store, stats, orders, listings, payouts, toast, notify, setOrderStatus, updateOrder, saveListing, updateStore],
  );

  return <SellerDataContext.Provider value={value}>{children}</SellerDataContext.Provider>;
}

export function useSellerData() {
  const ctx = useContext(SellerDataContext);
  if (!ctx) throw new Error('useSellerData must be used inside SellerDataProvider');
  return ctx;
}

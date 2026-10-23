/**
 * Seller API client. Every function is async and returns copies, so swapping
 * the in-memory mock for real `fetch` calls only touches this file.
 */
import * as db from './mockData';
import type { Listing, ListingInput, Order, OrderPatch, OrderStatus, PhotoshootRequest, PhotoshootSession, Store } from './types';

const LATENCY_MS = 250;
const delay = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), LATENCY_MS));

export const api = {
  getStore: () => delay(db.store),
  getStats: () => delay(db.stats),
  getOrders: () => delay(db.orders),
  getListings: () => delay(db.listings),
  getPayouts: () => delay(db.payouts),
  getPhotoshootPackages: () => delay(db.photoshootPackages),
  getPhotoshoots: () => delay(db.photoshoots),

  async updateOrderStatus(id: string, status: OrderStatus, patch: OrderPatch = {}): Promise<Order> {
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new Error(`Order ${id} not found`);
    Object.assign(order, patch);
    order.status = status;
    order.history.push({ event: status, at: new Date().toISOString() });
    if (status === 'awaiting_shipment') {
      const sendBy = new Date();
      sendBy.setDate(sendBy.getDate() + 3);
      order.dueAt = sendBy.toISOString();
    }
    if (status === 'shipped') {
      const deliverBy = new Date();
      deliverBy.setDate(deliverBy.getDate() + 5);
      order.dueAt = deliverBy.toISOString();
    }
    return delay(order);
  },

  async updateOrder(id: string, patch: OrderPatch): Promise<Order> {
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new Error(`Order ${id} not found`);
    Object.assign(order, patch);
    return delay(order);
  },

  async saveListing(input: ListingInput, id?: string): Promise<Listing> {
    if (id) {
      const listing = db.listings.find((l) => l.id === id);
      if (!listing) throw new Error(`Listing ${id} not found`);
      Object.assign(listing, input);
      return delay(listing);
    }
    const listing: Listing = {
      ...input,
      id: `L-${1000 + db.listings.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    db.listings.unshift(listing);
    return delay(listing);
  },

  async updateStore(patch: Partial<Store>): Promise<Store> {
    Object.assign(db.store, patch);
    return delay(db.store);
  },

  async bookPhotoshoot(request: PhotoshootRequest): Promise<PhotoshootSession> {
    const session: PhotoshootSession = {
      ...request,
      id: `PS-${109 + db.photoshoots.length}`,
      status: 'pending',
      // The studio assigns a photographer and models when it confirms.
      photographer: 'To be assigned',
      models: [],
      photos: [],
    };
    db.photoshoots.unshift(session);
    return delay(session);
  },

  async cancelPhotoshoot(id: string): Promise<void> {
    const i = db.photoshoots.findIndex((p) => p.id === id);
    if (i === -1) throw new Error(`Photoshoot ${id} not found`);
    db.photoshoots.splice(i, 1);
    await delay(null);
  },
};

export type OrderStatus =
  | 'awaiting_approval'
  | 'awaiting_shipment'
  | 'overdue'
  | 'shipped'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export interface Order {
  id: string;
  product: string;
  listingId: string;
  customer: string;
  city: string;
  size: string;
  quantity: number;
  amount: number;
  orderedAt: string;
  /** Approve-by, send-by or delivery date depending on status. */
  dueAt: string;
  status: OrderStatus;
  returnReason?: string;
  colour?: string;
  email: string;
  phone: string;
  /** Shipping address lines after the recipient's name, without the country. */
  address: string[];
  country: string;
  deliveryMethod: string;
  deliveryEstimate: string;
  shippingFee: number;
  discount: number;
  payment: OrderPayment;
  courier?: string;
  trackingNumber?: string;
  /** Internal note, only visible to the seller's team. */
  note?: string;
  /** Oldest first. */
  history: { event: OrderEvent; at: string }[];
}

export type OrderEvent = 'placed' | 'paid' | OrderStatus;

export interface OrderPayment {
  brand: string;
  last4: string;
  provider: string;
  reference: string;
  paidAt: string;
}

/** Fields a seller can change on an order besides its status. */
export type OrderPatch = Partial<Pick<Order, 'note' | 'courier' | 'trackingNumber'>>;

export type ListingStatus = 'active' | 'draft' | 'sold_out';

export interface Listing {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  stock: number;
  status: ListingStatus;
  sizes: string[];
  colours: string[];
  description: string;
  createdAt: string;
  /** Main catalogue photo (URL); always the first entry of `images` when that is set. */
  image?: string;
  /** Full photo gallery, up to 5. */
  images?: string[];
  /** Percentage off, 1–90. */
  discountPercent?: number;
  /** ISO dates (yyyy-mm-dd); empty means open-ended. */
  discountFrom?: string;
  discountUntil?: string;
  material?: string;
  careInstructions?: string;
  occasions?: string[];
  fit?: string;
  sizeGuideUrl?: string;
  deliveryEstimate?: string;
  /** Optional campaign / lifestyle photo, preferred on the dashboard. */
  coverImage?: string;
  /** Vertical focal point of the cover photo, 0 (top) to 100 (bottom). */
  coverFocusY?: number;
}

export type ListingInput = Omit<Listing, 'id' | 'createdAt'>;

export type PayoutStatus = 'paid' | 'processing' | 'scheduled' | 'failed';

export interface Payout {
  id: string;
  reference: string;
  amount: number;
  orders: number;
  date: string;
  /** Bank the payout was sent to, as it was at the time. */
  bankName: string;
  status: PayoutStatus;
}

export interface Store {
  name: string;
  ownerFirstName: string;
  slug: string;
  email: string;
  phone: string;
  description: string;
  /** City and country shown on the storefront. */
  location: string;
  /** Image URLs. */
  logo: string;
  banner: string;
  returnPolicy: string;
  shippingPolicy: string;
  /** Handles without the @, and the website without https://. */
  instagram: string;
  twitter: string;
  website: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface StoreStats {
  itemsSold: number;
  itemsSoldTrend: number;
  revenueThisMonth: number;
  revenueTrend: number;
  activeListingsTrend: number;
  totalRevenue: number;
  averageOrderValue: number;
  rating: number;
  storeVisits: number;
  conversionRate: number;
  availableBalance: number;
  pendingClearance: number;
  nextPayoutDate: string;
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  salesByCategory: { category: string; revenue: number }[];
}

export interface PhotoshootPackage {
  id: string;
  name: string;
  price: number;
  looks: number;
  includes: string[];
}

export type PhotoshootStatus = 'pending' | 'confirmed' | 'processing' | 'completed';

export interface PhotoshootSession {
  id: string;
  /** Start and end of the shoot (ISO). */
  startsAt: string;
  endsAt: string;
  status: PhotoshootStatus;
  packageId: string;
  kind: 'Studio' | 'On-location' | 'Outdoor';
  /** Full venue, e.g. "Losóde Studio, Lagos". */
  location: string;
  /** Short area for cards, e.g. "Lagos" or "VI". */
  area: string;
  items: number;
  photographer: string;
  models: string[];
  /** Delivered photo URLs; empty until the shoot is completed. */
  photos: string[];
  /** When edited photos are due, for shoots still in editing. */
  readyBy?: string;
  notes?: string;
}

export type PhotoshootRequest = Pick<PhotoshootSession, 'startsAt' | 'endsAt' | 'packageId' | 'kind' | 'location' | 'area' | 'items' | 'notes'>;

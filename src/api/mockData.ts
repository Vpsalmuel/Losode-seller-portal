import type {
  Listing,
  Order,
  Payout,
  PhotoshootPackage,
  PhotoshootSession,
  Store,
  StoreStats,
} from './types';

/** Mock dates are relative to today so the demo always looks current. */
const day = (offset: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
};

export const store: Store = {
  name: 'N.I.C.K Apparels',
  ownerFirstName: 'Nick',
  slug: 'nick-apparels',
  email: 'nick@nickapparels.com',
  phone: '+234 801 234 5678',
  description: 'A premium contemporary African fashion brand bringing custom Ankara prints and luxurious bespoke native wear to the global stage.',
  location: 'Lagos, Nigeria',
  logo: '/store/logo.jpg',
  banner: '/store/banner.jpg',
  returnPolicy: 'Returns accepted within 7 days of delivery. Items must be in original condition, unworn, with tags attached. Custom sizes are final sale.',
  shippingPolicy: 'Standard delivery within Lagos: 2-3 business days. Other states in Nigeria: 4-6 business days. International delivery: 7-10 business days.',
  instagram: 'nickapparels',
  twitter: 'nickapparels',
  website: 'nickapparels.com',
  bankName: 'GTBank',
  accountNumber: '0123454521',
  accountName: 'N.I.C.K Apparels Inc.',
};

/**
 * Demo login for previews and testing (no real account behind it). Also listed in the README.
 */
export const demoAccount = { email: 'nick@nickapparels.com', password: 'Losode2026!' };

const img = (slug: string) => `/products/${slug}.jpg`;

// Newest first, as the listings page shows them.
export const listings: Listing[] = [
  { id: 'L-1001', name: 'Premium Silk Adire Kimono', category: "Women's Apparel", subCategory: 'Outerwear', price: 65000, stock: 12, status: 'active', sizes: ['S', 'M', 'L'], colours: ['Indigo'], description: 'Hand-dyed adire on pure silk with a relaxed kimono cut.', createdAt: day(-11), image: img('premium-silk-adire-kimono') },
  { id: 'L-1002', name: 'Velvet Embroidered Cap', category: 'Accessories', subCategory: 'Hats & Caps', price: 18000, stock: 4, status: 'active', sizes: ['One size'], colours: ['Navy', 'Red'], description: 'Structured velvet cap with gold thread embroidery.', createdAt: day(-13), image: img('velvet-embroidered-cap') },
  { id: 'L-1003', name: 'Asymmetric Linen Tunic', category: "Women's Apparel", subCategory: 'Tops', price: 35000, stock: 0, status: 'draft', sizes: ['S', 'M', 'L', 'XL'], colours: ['Beige'], description: 'Breathable linen tunic with an asymmetric hem.', createdAt: day(-15), image: img('asymmetric-linen-tunic') },
  { id: 'L-1004', name: 'Handwoven Kente Scarf', category: 'Accessories', subCategory: 'Scarves', price: 22000, stock: 0, status: 'sold_out', sizes: ['One size'], colours: ['Multi'], description: 'Handwoven kente strip scarf from Bonwire weavers.', createdAt: day(-18), image: img('handwoven-kente-scarf') },
  { id: 'L-1011', name: 'Lagos Streetwear Hoodie', category: "Men's Apparel", subCategory: 'Hoodies & Sweats', price: 28000, stock: 18, status: 'active', sizes: ['M', 'L', 'XL', 'XXL'], colours: ['Navy'], description: 'Heavyweight cotton hoodie with embroidered lion crest.', createdAt: day(-21), image: img('lagos-streetwear-hoodie') },
  { id: 'L-1012', name: 'Traditional Beaded Necklace', category: 'Accessories', subCategory: 'Jewellery', price: 15000, stock: 1, status: 'active', sizes: ['One size'], colours: ['Multi'], description: 'Hand-strung glass bead collar necklace.', createdAt: day(-25), image: img('traditional-beaded-necklace') },
  { id: 'L-1005', name: 'Ankara Print Maxi Dress', category: "Women's Apparel", subCategory: 'Dresses', price: 45000, stock: 9, status: 'active', sizes: ['XS', 'S', 'M', 'L'], colours: ['Multi'], description: 'Vibrant African print maxi dress with bold patterns', createdAt: day(-40), image: img('ankara-print-maxi-dress'), coverImage: img('ankara-print-maxi-dress-cover'), coverFocusY: 3 },
  { id: 'L-1006', name: 'Embroidered Agbada Set', category: "Men's Apparel", subCategory: 'Agbada & Kaftans', price: 120000, stock: 3, status: 'active', sizes: ['M', 'L', 'XL'], colours: ['White', 'Gold'], description: 'Luxurious embroidered traditional agbada ensemble', createdAt: day(-45), image: img('embroidered-agbada-set'), coverImage: img('embroidered-agbada-set-cover'), coverFocusY: 7 },
  { id: 'L-1007', name: 'Adire Silk Blouse', category: "Women's Apparel", subCategory: 'Tops', price: 38500, stock: 7, status: 'active', sizes: ['S', 'M', 'L'], colours: ['Indigo', 'White'], description: 'Hand-dyed indigo adire silk with traditional motifs', createdAt: day(-50), image: img('adire-silk-blouse'), coverImage: img('adire-silk-blouse-cover') },
  { id: 'L-1008', name: 'Kente Woven Clutch', category: 'Bags', subCategory: 'Clutches', price: 28000, stock: 5, status: 'active', sizes: ['One size'], colours: ['Gold', 'Green'], description: 'Handwoven kente fabric clutch with gold accents', createdAt: day(-55), coverImage: img('kente-woven-clutch-cover'), coverFocusY: 10 },
  { id: 'L-1013', name: 'Kente Elegance Clutch', category: 'Bags', subCategory: 'Clutches', price: 28000, stock: 6, status: 'active', sizes: ['One size'], colours: ['Black', 'Gold'], description: 'Luxurious Kente Fabric Clutch with Golden Details', createdAt: day(-58), coverImage: img('kente-elegance-clutch-cover'), coverFocusY: 43 },
  { id: 'L-1014', name: 'Drip Heritage Bag', category: 'Bags', subCategory: 'Handbags', price: 28000, stock: 4, status: 'active', sizes: ['One size'], colours: ['Teal', 'Gold'], description: 'Exquisite Kente Fabric Clutch with Gold Highlights', createdAt: day(-60), coverImage: img('drip-heritage-bag-cover') },
  { id: 'L-1009', name: 'Aso-Oke Wrap Skirt', category: "Women's Apparel", subCategory: 'Skirts', price: 32000, stock: 11, status: 'active', sizes: ['S', 'M', 'L'], colours: ['Rose'], description: 'Wrap skirt in handwoven aso-oke.', createdAt: day(-70) },
  { id: 'L-1010', name: 'Beaded Leather Sandals', category: 'Shoes', subCategory: 'Sandals', price: 26000, stock: 2, status: 'active', sizes: ['38', '39', '40', '41'], colours: ['Brown'], description: 'Leather sandals with hand-strung beads.', createdAt: day(-80) },
];

// Newest first.
const baseOrders: BaseOrder[] = [
  { id: 'LSD-9842', product: 'Ankara Print Maxi Dress', listingId: 'L-1005', customer: 'Amara Oke', city: 'Lagos', size: 'M', quantity: 1, amount: 45000, orderedAt: day(-1), dueAt: day(4), status: 'awaiting_shipment' },
  { id: 'LSD-9841', product: 'Embroidered Agbada Set', listingId: 'L-1006', customer: 'Chidi Benson', city: 'Abuja', size: 'L', quantity: 1, amount: 120000, orderedAt: day(-2), dueAt: day(1), status: 'awaiting_approval' },
  { id: 'LSD-9840', product: 'Adire Silk Blouse', listingId: 'L-1007', customer: 'Fatima Yusuf', city: 'Kano', size: 'S', quantity: 1, amount: 38500, orderedAt: day(-3), dueAt: day(7), status: 'shipped' },
  { id: 'LSD-9839', product: 'Kente Woven Clutch', listingId: 'L-1008', customer: 'Chioma Eze', city: 'Port Harcourt', size: 'One size', quantity: 1, amount: 28000, orderedAt: day(-4), dueAt: day(-1), status: 'overdue' },
  { id: 'LSD-9838', product: 'Kente Elegance Clutch', listingId: 'L-1013', customer: 'Kofi Mensah', city: 'Accra', size: 'One size', quantity: 1, amount: 28000, orderedAt: day(-4), dueAt: day(-1), status: 'overdue' },
  { id: 'LSD-9837', product: 'Drip Heritage Bag', listingId: 'L-1014', customer: 'Bisi Akande', city: 'Lagos', size: 'One size', quantity: 1, amount: 28000, orderedAt: day(-4), dueAt: day(-1), status: 'delivered' },
  { id: 'LSD-9836', product: 'Velvet Embroidered Cap', listingId: 'L-1002', customer: 'Ngozi Adele', city: 'London', size: 'One size', quantity: 2, amount: 36000, orderedAt: day(-5), dueAt: day(2), status: 'awaiting_shipment' },
  { id: 'LSD-9835', product: 'Premium Silk Adire Kimono', listingId: 'L-1001', customer: 'Funmi Lawal', city: 'Ibadan', size: 'M', quantity: 1, amount: 65000, orderedAt: day(-5), dueAt: day(2), status: 'awaiting_approval' },
  { id: 'LSD-9834', product: 'Aso-Oke Wrap Skirt', listingId: 'L-1009', customer: 'Grace Okafor', city: 'Enugu', size: 'L', quantity: 1, amount: 32000, orderedAt: day(-6), dueAt: day(3), status: 'awaiting_shipment' },
  { id: 'LSD-9833', product: 'Beaded Leather Sandals', listingId: 'L-1010', customer: 'Ngozi Udeh', city: 'Lagos', size: '39', quantity: 1, amount: 26000, orderedAt: day(-6), dueAt: day(4), status: 'shipped' },
  { id: 'LSD-9830', product: 'Handwoven Kente Scarf', listingId: 'L-1004', customer: 'Kwame Asante', city: 'Kumasi', size: 'One size', quantity: 1, amount: 22000, orderedAt: day(-12), dueAt: day(-6), status: 'delivered' },
  { id: 'LSD-9828', product: 'Ankara Print Maxi Dress', listingId: 'L-1005', customer: 'Bisi Akande', city: 'Lagos', size: 'S', quantity: 1, amount: 45000, orderedAt: day(-15), dueAt: day(-9), status: 'delivered' },
  { id: 'LSD-9825', product: 'Adire Silk Blouse', listingId: 'L-1007', customer: 'Ifeoma Nwosu', city: 'Owerri', size: 'M', quantity: 1, amount: 38500, orderedAt: day(-18), dueAt: day(-11), status: 'returned', returnReason: 'Size too small' },
  { id: 'LSD-9822', product: 'Premium Silk Adire Kimono', listingId: 'L-1001', customer: 'Zainab Bello', city: 'Kano', size: 'L', quantity: 1, amount: 65000, orderedAt: day(-21), dueAt: day(-14), status: 'delivered' },
  { id: 'LSD-9820', product: 'Velvet Embroidered Cap', listingId: 'L-1002', customer: 'Emeka Ike', city: 'Abuja', size: 'One size', quantity: 1, amount: 18000, orderedAt: day(-25), dueAt: day(-20), status: 'cancelled' },
];

type BaseOrder = Omit<
  Order,
  'email' | 'phone' | 'address' | 'country' | 'deliveryMethod' | 'deliveryEstimate' | 'shippingFee' | 'discount' | 'payment' | 'history'
>;

const customers: Record<string, { phone: string; address: string[]; country: string }> = {
  'Amara Oke': { phone: '+234 803 456 7890', address: ['12 Admiralty Way, Lekki Phase 1', 'Lagos, 106104'], country: 'Nigeria' },
  'Chidi Benson': { phone: '+234 806 221 4419', address: ['24 Aminu Kano Crescent, Wuse 2', 'Abuja, 900288'], country: 'Nigeria' },
  'Fatima Yusuf': { phone: '+234 802 778 3150', address: ['7 Murtala Mohammed Way, Nassarawa', 'Kano, 700233'], country: 'Nigeria' },
  'Chioma Eze': { phone: '+234 813 904 2276', address: ['15 Aba Road, GRA Phase 2', 'Port Harcourt, 500272'], country: 'Nigeria' },
  'Kofi Mensah': { phone: '+233 24 418 5530', address: ['9 Oxford Street, Osu', 'Accra, GA-021'], country: 'Ghana' },
  'Bisi Akande': { phone: '+234 809 332 6614', address: ['3 Adeola Odeku Street, Victoria Island', 'Lagos, 101241'], country: 'Nigeria' },
  'Ngozi Adele': { phone: '+44 7700 900 318', address: ['48 Rye Lane, Peckham', 'London, SE15 5BY'], country: 'United Kingdom' },
  'Funmi Lawal': { phone: '+234 805 117 9042', address: ['21 Ring Road, Challenge', 'Ibadan, 200211'], country: 'Nigeria' },
  'Grace Okafor': { phone: '+234 816 440 7781', address: ['6 Ogui Road, New Haven', 'Enugu, 400102'], country: 'Nigeria' },
  'Ngozi Udeh': { phone: '+234 807 659 2208', address: ['30 Allen Avenue, Ikeja', 'Lagos, 100271'], country: 'Nigeria' },
  'Kwame Asante': { phone: '+233 20 761 4492', address: ['14 Prempeh II Street, Adum', 'Kumasi, AK-039'], country: 'Ghana' },
  'Ifeoma Nwosu': { phone: '+234 803 285 1167', address: ['11 Wetheral Road', 'Owerri, 460242'], country: 'Nigeria' },
  'Zainab Bello': { phone: '+234 802 913 5508', address: ['2 Bompai Road, Nassarawa GRA', 'Kano, 700241'], country: 'Nigeria' },
  'Emeka Ike': { phone: '+234 806 504 3392', address: ['5 Gana Street, Maitama', 'Abuja, 904101'], country: 'Nigeria' },
};

const cards = [
  { brand: 'Visa', last4: '4242' },
  { brand: 'Mastercard', last4: '5512' },
  { brand: 'Verve', last4: '0061' },
  { brand: 'Visa', last4: '1881' },
];

const notes: Record<string, string> = {
  'LSD-9842': 'Please check the dress and include a care card before packing.',
  'LSD-9836': 'Gift order: leave the receipt out of the parcel.',
};

const minutesLater = (iso: string, minutes: number) => new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

/** Fills in customer, delivery, payment and history details so every order reads like a real one. */
function withDetails(o: BaseOrder, index: number): Order {
  const customer = customers[o.customer];
  const local = customer.country === 'Nigeria';
  const placedAt = minutesLater(o.orderedAt, -((78 + index * 47) % 420));
  const paidAt = minutesLater(placedAt, 2);
  const shippedAt = minutesLater(placedAt, 26 * 60);
  const listingColour = listings.find((l) => l.id === o.listingId)?.colours[0];
  const d = new Date(paidAt);
  const ddmmyy = [d.getDate(), d.getMonth() + 1, d.getFullYear() % 100].map((n) => String(n).padStart(2, '0')).join('');

  const history: Order['history'] = [
    { event: 'placed', at: placedAt },
    { event: 'paid', at: paidAt },
  ];
  if (o.status === 'cancelled') history.push({ event: 'cancelled', at: shippedAt });
  else if (o.status === 'awaiting_approval') history.push({ event: 'awaiting_approval', at: paidAt });
  else history.push({ event: 'awaiting_shipment', at: paidAt });
  if (o.status === 'overdue') history.push({ event: 'overdue', at: o.dueAt });
  if (['shipped', 'delivered', 'returned'].includes(o.status)) history.push({ event: 'shipped', at: shippedAt });
  if (o.status === 'delivered') history.push({ event: 'delivered', at: o.dueAt });
  if (o.status === 'returned') {
    history.push({ event: 'delivered', at: minutesLater(o.dueAt, -3 * 24 * 60) });
    history.push({ event: 'returned', at: o.dueAt });
  }
  const shipped = history.some((h) => h.event === 'shipped');

  return {
    ...o,
    orderedAt: placedAt,
    colour: listingColour === 'Multi' ? 'Multicolour' : listingColour,
    email: `${o.customer.toLowerCase().replace(' ', '.')}@gmail.com`,
    phone: customer.phone,
    address: customer.address,
    country: customer.country,
    deliveryMethod: local ? 'Standard delivery' : 'International delivery',
    deliveryEstimate: o.city === 'Lagos' ? '2–4 business days' : local ? '3–5 business days' : '7–10 business days',
    shippingFee: o.city === 'Lagos' ? 2500 : local ? 3500 : 15000,
    discount: 0,
    payment: { ...cards[index % cards.length], provider: 'Paystack', reference: `PSK-${o.id.replace('-', '')}-${ddmmyy}`, paidAt },
    courier: shipped ? (local ? 'GIG Logistics' : 'DHL Express') : undefined,
    trackingNumber: shipped ? `${local ? 'GIG' : 'DHL'}${String(48213907 + index * 7919)}` : undefined,
    note: notes[o.id],
    history,
  };
}

export const orders: Order[] = baseOrders.map(withDetails);

export const payouts: Payout[] = [
  { id: 'P-0907', reference: 'LSD-PO-0907', amount: 412500, orders: 11, date: day(5), bankName: 'GTBank', status: 'scheduled' },
  { id: 'P-0906', reference: 'LSD-PO-0906', amount: 286000, orders: 8, date: day(-2), bankName: 'GTBank', status: 'processing' },
  { id: 'P-0905', reference: 'LSD-PO-0905', amount: 538000, orders: 15, date: day(-16), bankName: 'GTBank', status: 'paid' },
  { id: 'P-0905F', reference: 'LSD-PO-0905', amount: 538000, orders: 15, date: day(-18), bankName: 'GTBank', status: 'failed' },
  { id: 'P-0904', reference: 'LSD-PO-0904', amount: 391500, orders: 12, date: day(-30), bankName: 'GTBank', status: 'paid' },
  { id: 'P-0903', reference: 'LSD-PO-0903', amount: 467000, orders: 13, date: day(-44), bankName: 'GTBank', status: 'paid' },
  { id: 'P-0902', reference: 'LSD-PO-0902', amount: 352000, orders: 10, date: day(-58), bankName: 'GTBank', status: 'paid' },
];

const monthLabel = (offset: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleString('en-GB', { month: 'short' });
};

const revenueSeries = [210, 245, 230, 290, 320, 305, 360, 340, 395, 420, 410, 480].map((k) => k * 5000);

export const stats: StoreStats = {
  itemsSold: 156,
  itemsSoldTrend: 12,
  revenueThisMonth: 2400000,
  revenueTrend: 8,
  activeListingsTrend: 12,
  totalRevenue: 4800000,
  averageOrderValue: 32500,
  rating: 4.8,
  storeVisits: 18420,
  conversionRate: 2.6,
  availableBalance: 412500,
  pendingClearance: 286000,
  nextPayoutDate: day(5),
  monthlyRevenue: revenueSeries.map((revenue, i) => ({
    month: monthLabel(i - 11),
    revenue,
    orders: Math.round(revenue / 32500),
  })),
  salesByCategory: [
    { category: 'Dresses', revenue: 1350000 },
    { category: 'Outerwear', revenue: 975000 },
    { category: 'Menswear', revenue: 840000 },
    { category: 'Tops', revenue: 616000 },
    { category: 'Accessories', revenue: 548000 },
    { category: 'Bags', revenue: 471000 },
  ],
};

export const photoshootPackages: PhotoshootPackage[] = [
  { id: 'starter', name: 'Starter', price: 75000, looks: 5, includes: ['1 model', 'Studio backdrop', '10 edited images'] },
  { id: 'campaign', name: 'Campaign', price: 180000, looks: 12, includes: ['2 models', 'Hair & makeup', '30 edited images', 'Listing-ready crops'] },
  { id: 'editorial', name: 'Editorial', price: 350000, looks: 20, includes: ['3 models', 'Creative direction', 'Location shoot', '60 edited images', 'Short video reel'] },
];

/** A time on a day relative to today, e.g. at(13, '09:00'). */
const at = (offset: number, time: string) => {
  const d = new Date(day(offset));
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const shot = (...n: number[]) => n.map((i) => `/photoshoots/shoot-${String(i).padStart(2, '0')}.jpg`);
const extras = shot(25, 26, 27, 28);

// Newest first.
export const photoshoots: PhotoshootSession[] = [
  { id: 'PS-118', startsAt: at(26, '11:00'), endsAt: at(26, '16:00'), status: 'pending', packageId: 'editorial', kind: 'On-location', location: 'On-Location, Victoria Island', area: 'VI', items: 12, photographer: 'Amara Okoye', models: [], photos: [] },
  { id: 'PS-117', startsAt: at(13, '09:00'), endsAt: at(13, '14:00'), status: 'confirmed', packageId: 'campaign', kind: 'Studio', location: 'Losóde Studio, Lagos', area: 'Lagos', items: 8, photographer: 'Tunde Mason', models: ['Adaeze Nwankwo', 'Kemi Ade'], photos: [] },
  { id: 'PS-116', startsAt: at(-5, '10:00'), endsAt: at(-5, '15:00'), status: 'processing', packageId: 'campaign', kind: 'Studio', location: 'Losóde Studio, Lagos', area: 'Lagos', items: 7, photographer: 'Tunde Mason', models: ['Zara Bello'], photos: [], readyBy: day(2) },
  { id: 'PS-115', startsAt: at(-13, '09:00'), endsAt: at(-13, '14:00'), status: 'completed', packageId: 'campaign', kind: 'Studio', location: 'Losóde Studio, Lagos', area: 'Lagos', items: 10, photographer: 'Tunde Mason', models: ['Adaeze Nwankwo', 'Kemi Ade'], photos: [...shot(1, 2, 3, 4, 5, 6, 7, 8), ...extras] },
  { id: 'PS-114', startsAt: at(-31, '11:00'), endsAt: at(-31, '16:00'), status: 'completed', packageId: 'editorial', kind: 'On-location', location: 'On-Location, Victoria Island', area: 'VI', items: 6, photographer: 'Amara Okoye', models: ['Tolu Bakare'], photos: [...shot(5, 6, 7, 8), ...extras] },
  { id: 'PS-113', startsAt: at(-48, '09:00'), endsAt: at(-48, '15:00'), status: 'completed', packageId: 'editorial', kind: 'Studio', location: 'Losóde Studio, Ikeja', area: 'Ikeja', items: 15, photographer: 'Tunde Mason', models: ['Zara Bello', 'Adaeze Nwankwo'], photos: [...shot(9, 10, 11, 12), ...extras] },
  { id: 'PS-112', startsAt: at(-56, '08:00'), endsAt: at(-56, '12:00'), status: 'completed', packageId: 'campaign', kind: 'Outdoor', location: 'Lekki Conservation Centre, Lekki', area: 'Lekki', items: 8, photographer: 'Ifeanyi Obi', models: ['Kemi Ade'], photos: [...shot(13, 14, 15, 16), ...extras] },
  { id: 'PS-111', startsAt: at(-72, '10:00'), endsAt: at(-72, '14:00'), status: 'completed', packageId: 'starter', kind: 'Studio', location: 'Losóde Studio, Lagos', area: 'Lagos', items: 5, photographer: 'Tunde Mason', models: ['Tolu Bakare', 'Zara Bello'], photos: [...shot(17, 18, 19, 20), ...extras] },
  { id: 'PS-110', startsAt: at(-85, '11:00'), endsAt: at(-85, '16:00'), status: 'completed', packageId: 'editorial', kind: 'On-location', location: 'On-Location, Victoria Island', area: 'VI', items: 12, photographer: 'Amara Okoye', models: ['Adaeze Nwankwo'], photos: [...shot(21, 22, 23, 24), ...extras] },
  { id: 'PS-109', startsAt: at(-101, '09:00'), endsAt: at(-101, '13:00'), status: 'completed', packageId: 'starter', kind: 'Studio', location: 'Losóde Studio, Lagos', area: 'Lagos', items: 9, photographer: 'Ifeanyi Obi', models: ['Kemi Ade'], photos: [...extras, ...shot(13, 14, 15, 16)] },
];

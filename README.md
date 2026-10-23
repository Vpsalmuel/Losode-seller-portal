# Losóde Seller Dashboard

React + TypeScript + Vite frontend for Losóde marketplace sellers, built from the
Figma frame `seller-dashboard-redesign` (node 15575:37413).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Demo login

Sign-in is mocked until the Losóde auth API is connected. Use the demo account
(defined in `src/api/mockData.ts`), or create an account on `/signup`, which is
kept in that browser only.

| Email | Password |
| --- | --- |
| `nick@nickapparels.com` | `Losode2026!` |

## Pages

| Route | Page |
| --- | --- |
| `/login`, `/signup` | Sign in and create an account, with the editorial carousel |
| `/` | Dashboard: KPIs, performance summary, new orders, listings, promos |
| `/orders` | Manage Orders: status counts and paged order cards |
| `/orders/:id` | Order details: items, fulfillment, timeline, customer, payment, notes; approve / ship / cancel |
| `/listings` | Manage Listings: stats and listing cards with edit and duplicate |
| `/listings/new`, `/listings/:id/edit` | Listing form with photo upload and validation |
| `/payments` | Earnings, payout destination, transaction history |
| `/analytics` | Revenue trend, revenue by category, top products |
| `/photoshoots` | Upcoming shoots, recent sessions, booking |
| `/photoshoots/sessions` | Previous sessions with filters and sorting |
| `/photoshoots/sessions/:id` | Session gallery with lightbox and zip download |
| `/settings` | Store profile, policies, contact details, social links |

## Deploying

The app is a static single-page app. `vercel.json` builds it with `npm run build`,
serves `dist/`, and sends every route to `index.html` so deep links such as
`/orders/LSD-9842` work on refresh.

## Connecting a real backend

All data goes through `src/api/client.ts`, which currently reads and writes the
in-memory mock in `src/api/mockData.ts`. Replace each function with a `fetch`
call to the Losóde API that returns the same types (`src/api/types.ts`); no page
code needs to change.

## Fonts

The design uses **Domaine Sans Text** (licensed, from Klim) and **Poppins**.
Poppins loads from Google Fonts. Add the licensed Domaine files to
`public/fonts/` as `DomaineSansText-Regular.woff2`, `-Medium.woff2` and
`-Bold.woff2`; until then DM Sans is used as a fallback.

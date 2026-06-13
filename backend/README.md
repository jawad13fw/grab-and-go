# Grab & Go Backend

Express backend API for the React frontend in `../frontend/`.

## Run

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Server: `http://localhost:4000`

## Database

The backend now prefers the configured `MONGODB_URI` first. In development, it then tries local MongoDB and finally falls back to an in-memory MongoDB server if nothing is running.

For deployment, set `MONGODB_URI` to MongoDB Atlas or another persistent MongoDB server. The backend will not fall back to localhost or the in-memory server in production.

If you want the Vehari dataset, run the explicit seed command below after the database is reachable.

## Seed Test Data

Load a compact dataset for testing login, browsing, and a sample order:

```bash
cd backend
npm run seed:test
```

Test accounts:

- Customer: `riya@grabgo.app` / `customer123`
- Vendor: `logan@grabgo.app` / `vendor123`
- Rider: `amber@grabgo.app` / `rider123`
- Admin: `admin@grabgo.app` / `admin123`

## Seed Vehari Data

Seed the production-style Vehari shop dataset used by the homepage and catalog screens:

```bash
cd backend
npm run seed:vehari
```

This is the preferred dataset when you want the local shops and products to appear on the website.

## Seed Realistic Data (Large)

Load a much larger, real-world style dataset with multiple cities, categories,
shops, products, orders, reviews, carts, and notifications:

```bash
cd backend
npm run seed:realistic
```

Optional scale multiplier:

```bash
cd backend
SEED_SCALE=2 npm run seed:realistic
```

Notes:

- This seeder **replaces** existing data before inserting fresh records.
- Fixed test accounts stay available:
	- Customer: `riya@grabgo.app` / `customer123`
	- Vendor: `logan@grabgo.app` / `vendor123`
	- Rider: `amber@grabgo.app` / `rider123`
	- Admin: `admin@grabgo.app` / `admin123`
- All generated users use password: `Test@1234`
- In development, the backend can auto-seed Vehari data on an empty database. In production, seeding is explicit only.

## Environment

Copy [backend/.env.example](backend/.env.example) to .env and set values as needed.

JazzCash required:
- `JAZZCASH_MERCHANT_ID`
- `JAZZCASH_PASSWORD`
- `JAZZCASH_INTEGRITY_SALT`
- `JAZZCASH_ENV` (sandbox or live)
- `JAZZCASH_RETURN_URL` (should point to /api/checkout/jazzcash/return)

Recommended:
- `API_BASE_URL`
- `CLIENT_ORIGIN`

## Auth

- Uses JWT via `Authorization: Bearer <token>`
- Seed users match the frontend mock credentials (see `frontend/src/utils/dummyData.js`).


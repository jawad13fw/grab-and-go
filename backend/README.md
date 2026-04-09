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

## Auth

- Uses JWT via `Authorization: Bearer <token>`
- Seed users match the frontend mock credentials (see `frontend/src/utils/dummyData.js`).


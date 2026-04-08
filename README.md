# Family Tree App

This app reads and writes family data directly from MongoDB Atlas through serverless API routes.

## Run Locally

1. Install dependencies.
2. Start backend API routes (for example on port 3000).
3. Start the app.

```bash
npm install
npm run dev:api
npm run dev
```

Vite now proxies `/api/*` to `http://localhost:3000` in dev mode.

If your backend uses a different port, set:

```bash
VITE_API_PROXY_TARGET=http://localhost:YOUR_PORT
```

If PowerShell says `vercel` is not recognized, use `npx vercel dev` or the npm scripts above.

## MongoDB Atlas Central Sync

MongoDB is the single source of truth when `VITE_CENTRAL_SOURCE_MODE=mongo`.

Frontend environment variables:

- `VITE_CENTRAL_SOURCE_MODE` = `mongo` or `off`
- `VITE_CENTRAL_API_BASE_URL` = optional absolute base URL for API calls (leave empty for same-origin)

Server environment variables (set in deployment provider, not in client bundle):

- `MONGODB_URI`
- `MONGODB_URI_DIRECT` (optional fallback when SRV DNS is blocked)
- `MONGODB_DB_NAME` (default: `FamilyTree`)
- `MONGODB_COLLECTION_NAME` (default: `Data`)
- `MONGODB_AUTH_COLLECTION_NAME` (default: `auth`)
- `MONGODB_FEEDBACK_COLLECTION_NAME` (default: `feedback`)
- `ADMIN_DEFAULT_USERNAME` (default: `admin`)
- `ADMIN_DEFAULT_PASSWORD` (default: `123`)
- `JWT_SECRET` (required in production)

### Mongo SRV DNS Errors

If you see `querySrv ECONNREFUSED` for `_mongodb._tcp...`, your network/DNS is blocking SRV lookups.

Use Atlas `Drivers -> Node.js -> Standard connection string` and set it in `MONGODB_URI_DIRECT`.
The backend will automatically fallback to this direct URI when SRV fails.

## API Endpoints

- `GET /api/family-data` returns normalized family rows
- `POST /api/family-data` creates one member document (admin auth required)
- `PATCH /api/family-data` updates one member document by identity (admin auth required)
- `DELETE /api/family-data?identityNum=...` deletes one member document (admin auth required)
- `POST /api/auth/login` validates admin credentials from Mongo and sets auth cookie
- `GET /api/auth/verify` checks current admin session
- `POST /api/auth/logout` clears admin session cookie
- `POST /api/feedback` stores one feedback document
- `GET /api/feedback` loads feedback entries with optional filters (admin auth required)
- `DELETE /api/feedback` clears feedback entries (admin auth required)

## Notes

- `.env` files are ignored by git.
- Rotate credentials immediately if they were shared publicly.
- Seed the `auth` collection with your admin user if needed; login endpoint auto-seeds default admin if missing.

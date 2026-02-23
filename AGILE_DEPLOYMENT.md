# Production Deployment Guide: `agile.sprout.ph`

To transition the Sprout Web App and the Sprout-PP Chrome Extension from `localhost:3000` to your production domain `agile.sprout.ph`, you will need to make several critical configuration changes. 

## 1. Extension API Endpoints (`sprout-pp`)
The Chrome extension currently hardcodes `http://localhost:3000` to talk to your local backend. You need to swap this to point to your new domain.
- **`sprout-pp/background.ts`**: Change the URL pointing to `/api/chat`.
- **`sprout-pp/components/MessageItem.tsx`**: Change the POST URL `http://localhost:3000/api/insights` to `https://agile.sprout.ph/api/insights`.
- **`sprout-pp/package.json`**: Update the `host_permissions` block from `http://localhost:3000/*` to `https://agile.sprout.ph/*`.
- **Rebuild**: Once changed, run `npm run build` to generate the production extension.

## 2. Authentication Cookies (`dm-agent-dashboard`)
When the Chrome extension makes a `fetch()` request (like adding an insight) to `agile.sprout.ph`, the browser considers this a "Cross-Origin" request (because the extension runs on `chrome-extension://...`).
By default, Next.js sets authentication cookies with `SameSite: Strict`. This means Chrome will block the extension from sending your login session to the server, resulting in a `401 Unauthorized` error.
- **Fix**: In `dm-agent-dashboard/app/api/auth/login/route.ts` and `register/route.ts`, you must change the cookie `serialize` options:
  - `sameSite: 'none'`
  - `secure: true` (Requires the server to be running on HTTPS).

## 3. Database Persistence (SQLite)
Currently, data is saved to a local file (`data/sprout.db`).
- **If deploying to Vercel**: Vercel is *serverless*, meaning the disk is read-only and resets instantly. You CANNOT use local SQLite on Vercel. You would need to migrate to a hosted database like Postgres (Neon/Supabase) or Turso (for SQLite).
- **If deploying to a VPS (EC2/DigitalOcean)**: You *can* use SQLite, but if you use Docker, ensure the `./data` folder is mounted as a **Persistent Volume**. Otherwise, every time the deployment restarts, all users, dashboards, and insights will be permanently deleted.

## 4. Environment Variables
Ensure you have a `.env` or `.env.local` file on your production server containing your secrets (like `JWT_SECRET`). Ensure `NODE_ENV` is set to `production`.

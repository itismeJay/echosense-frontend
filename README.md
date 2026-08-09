# EchoSense frontend

EchoSense is a Next.js reviewer interface for unverified possible-aggression alerts. Alert evidence is available only to authenticated `admin`, `staff`, and `counselor` users.

## API configuration

`NEXT_PUBLIC_API_URL` is the authoritative backend origin. It is normalized at runtime, so a trailing slash is optional. The Render backend remains a deliberate fallback only when the variable is absent.

Copy `.env.example` to `.env.local`, then choose one backend origin:

```dotenv
# Backend running on the same computer as the browser
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend on the EchoSense LAN host (current Phase 3 development setup)
NEXT_PUBLIC_API_URL=http://192.168.1.92:8000

# Production
NEXT_PUBLIC_API_URL=https://echosense-backend-75h3.onrender.com
```

Restart `npm run dev` after changing a public environment variable. For LAN testing, start Next.js on a LAN-accessible interface and open the computer's LAN URL from the test device.

## Backend CORS allowlist

The backend must allow the exact browser origin in use (scheme, host, and port):

- Local browser: `http://localhost:3000`
- LAN browser on the current Phase 3 host: `http://192.168.1.92:3000`
- Deployed Vercel frontend: `https://echosense-frontend.vercel.app`

Do not use the API origin as the frontend CORS origin. If a custom production domain is attached, allow that exact HTTPS origin as well. If both `localhost` and `127.0.0.1` are used during development, allow both explicitly.

## Development

```bash
npm install
npm run dev
```

The alert list polls `GET /alerts/` every three seconds. Notification deep links at `/alert/<positive-id>` redirect to the canonical authenticated `/alerts/<positive-id>` detail page.

## Verification

```bash
npm test
npm run lint
./node_modules/.bin/tsc --noEmit --incremental false
npm run build
git diff --check
```

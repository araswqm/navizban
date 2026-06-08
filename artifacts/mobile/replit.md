# Navizban — Replit Config

This file documents the Replit environment configuration for Navizban.

## Run Commands

- **Mobile App**: `cd artifacts/mobile && npx expo start`
- **API Server**: `cd artifacts/api-server && npx tsx watch src/index.ts`

## Dependencies

This is a pnpm monorepo. Install all dependencies:

```bash
pnpm install
```

## Environment Variables

- `PORT` — API server port (default: 3001)
- `API_BASE_URL` — API base URL for mobile app (default: https://api.navizban.xyz)

## Build

See `scripts/build.sh` for build commands.

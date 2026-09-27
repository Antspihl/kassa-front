# Kassa frontend

Vue cashier and bill review UI for `../kassa-back-lightweight`.

For local development, run `npm ci` and `npm run dev`. Vite serves port 3000 and proxies `/api` to the backend on port 5000. Run `npm run build` to check the production bundle.

For the laptop and ZeroTier iPad deployment, follow the backend project's `compose.yaml` and README. Compose builds this frontend into Nginx, serves it on port 3000, and proxies `/api` to the private backend. Use the Settings menu to import names and drinks and inspect Sheets sync status. Log in there to select the shared paid/unpaid night mode. On unpaid nights, the **Arved** page shows the complete email preview and separate sending confirmation.

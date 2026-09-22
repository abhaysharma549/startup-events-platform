# Hosting Guide for StartupEvents

## Pick The Right Host

This app now saves fetched events to a local JSON file.

- `Vercel` is fine if you only want the UI and API endpoints.
- `Vercel` is not fine if you need `events-cache.json` to persist between invocations.
- `Render` or `Railway` are the better fit if you want the fetched data saved on disk.

Why:

- Vercel Functions use a read-only filesystem with only temporary writable `/tmp` space.
- Render web services have an ephemeral filesystem by default, but support persistent disks.
- Railway supports persistent volumes that you mount into your service.

## Required Environment Variables

Set these on any host:

- `APIFY_API_TOKEN`
- `APIFY_WEBHOOK_SECRET`
- `APIFY_ACTOR_ID`

Set this when you want the JSON cache written to a mounted disk or volume:

- `EVENTS_CACHE_DIR`

Examples:

- Local dev: `EVENTS_CACHE_DIR=./data`
- Render: `EVENTS_CACHE_DIR=/opt/render/project/src/data`
- Railway: `EVENTS_CACHE_DIR=/data`

## Vercel

Use Vercel only if persistent JSON storage is not required.

1. Install the CLI:
   ```bash
   npm install -g vercel
   ```
2. Login:
   ```bash
   vercel login
   ```
3. Deploy:
   ```bash
   vercel --prod
   ```
4. Add `APIFY_API_TOKEN`, `APIFY_WEBHOOK_SECRET`, and `APIFY_ACTOR_ID` in the Vercel dashboard.

Webhook URL:

```text
https://your-app.vercel.app/api/webhooks/apify?secret=YOUR_WEBHOOK_SECRET
```

Important:

- The app will run.
- The JSON cache file will not be durable on Vercel.

## Render

Use Render if you want the JSON file to persist.

1. Push this repo to GitHub.
2. In Render, create a new `Web Service`.
3. Connect the repo.
4. Use:
   - Build command: `npm install`
   - Start command: `npm start`
5. Add environment variables:
   - `APIFY_API_TOKEN`
   - `APIFY_WEBHOOK_SECRET`
   - `APIFY_ACTOR_ID`
   - `EVENTS_CACHE_DIR=/opt/render/project/src/data`
6. Add a persistent disk and mount it at:
   ```text
   /opt/render/project/src/data
   ```
7. Deploy.

Webhook URL:

```text
https://your-app.onrender.com/api/webhooks/apify?secret=YOUR_WEBHOOK_SECRET
```

## Railway

Use Railway if you want the JSON file to persist.

1. Push this repo to GitHub.
2. Create a new Railway project from the repo.
3. Add variables:
   - `APIFY_API_TOKEN`
   - `APIFY_WEBHOOK_SECRET`
   - `APIFY_ACTOR_ID`
   - `EVENTS_CACHE_DIR=/data`
4. Add a volume and mount it at:
   ```text
   /data
   ```
5. Deploy.

Webhook URL:

```text
https://your-app.up.railway.app/api/webhooks/apify?secret=YOUR_WEBHOOK_SECRET
```

## Local Test Before Deploy

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

After a fetch, verify the file exists:

```text
data/events-cache.json
```

## References

- Vercel Functions runtime filesystem: https://vercel.com/docs/functions/runtimes
- Render persistent disks: https://render.com/docs/disks
- Railway volumes: https://docs.railway.com/guides/volumes

# Greco Continuity OS App

## Run Locally

From this directory:

```bash
npm install
npm run dev
```

The app runs at:

```text
http://localhost:5174
```

The reliable-source recon API runs at:

```text
http://localhost:5175
```

`npm run dev` starts both services.

## Morning Recon Button

The **Fetch Reliable Sources** button calls:

```text
/api/recon/fetch
```

The fetch checks every relationship record and uses the safe sources currently configured:

- RSS feeds
- Substack/newsletter feeds where available
- public blogs
- public-interest media feeds
- podcast/blog feed surfaces
- X recent posts when `X_BEARER_TOKEN` is configured
- LinkedIn posts only when official LinkedIn API access and author URNs are configured

The button requests `limit=all`, so it evaluates the full relationship list. At the default pacing of 4 requests/minute, a complete X-enabled pass across many profiles can take a while.

Fetched signals are appended to:

```text
app/data/profile-signals.json
```

They are also available from:

```text
/api/signals
/api/signals?target=Molly%20White
```

The UI intentionally shows only the current fresh queue for now. The saved profile log is kept in the background for later review, engagement history, and follow-up workflows.


## Reliable Source Fetch Throttle

The **Fetch Reliable Sources** routine throttles outbound HTTP requests so morning recon does not burst across RSS feeds, blogs, newsletters, and public source discovery.

Default pacing:

- 4 requests/minute
- up to 2.5 seconds of jitter between paced requests

Tune it when starting the API:

```bash
RECON_REQUESTS_PER_MINUTE=4 RECON_REQUEST_JITTER_MS=2500 npm run dev
```

For a more conservative pass, use `RECON_REQUESTS_PER_MINUTE=3`. For a faster pass, use `RECON_REQUESTS_PER_MINUTE=5`.

## X Source Adapter

Set `X_BEARER_TOKEN` to include recent X posts in the morning recon pass. The adapter reads each target's `x_url`, resolves the handle through X API v2, then fetches recent original posts for scoring.

```bash
X_BEARER_TOKEN=... X_MAX_POSTS=5 RECON_REQUESTS_PER_MINUTE=4 npm run dev
```

## LinkedIn Source Adapter

LinkedIn is intentionally API-only. The app does not crawl logged-in LinkedIn pages. To include LinkedIn posts, configure official LinkedIn API access and add author URNs to relationship records using one of these optional fields:

```text
linkedin_author_urn
linkedin_person_urn
linkedin_organization_urn
```

Then start with:

```bash
LINKEDIN_ACCESS_TOKEN=... LINKEDIN_API_VERSION=202603 LINKEDIN_MAX_POSTS=5 npm run dev
```

## X and LinkedIn Property Receipts

X and LinkedIn property buttons are not rate-limited by default. They open normally and log a local route-open receipt to:

```text
app/data/execution-log.json
```

Like/reply/send behavior should stay human-gated and can be added later as explicit approved execution receipts.


## Manual Social Recon Mode

Manual Social Recon is for X and LinkedIn before official APIs are connected. It keeps the human in the loop:

1. Open the person's X or LinkedIn property from the app.
2. Inspect the profile or post manually while logged in.
3. Paste a post URL, short title, and relevant post text or field note.
4. Click **Capture + Score Signal**.

Captured manual signals are scored with the same project and Tony professional lens, appended to `app/data/profile-signals.json`, and then shown in the fresh signal workflow for drafting and approval.

Use **No Clean Signal, Next** to move through the social queue without capturing anything. This gives you an all-113 review path without automated scraping.

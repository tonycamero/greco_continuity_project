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

This first pass intentionally favors stable public sources:

- RSS feeds
- Substack/newsletter feeds where available
- public blogs
- public-interest media feeds
- podcast/blog feed surfaces

It does not yet fetch X or LinkedIn. Those should be added later through APIs or browser-assisted recon once the operating rhythm is proven.

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

## X and LinkedIn Property Receipts

X and LinkedIn property buttons are not rate-limited by default. They open normally and log a local route-open receipt to:

```text
app/data/execution-log.json
```

Like/reply/send behavior should stay human-gated and can be added later as explicit approved execution receipts.

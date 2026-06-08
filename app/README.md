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


## X and LinkedIn Property Throttles

X and LinkedIn property buttons go through a local pacing gate before opening. This keeps high-value social recon deliberate and logs route opens to:

```text
app/data/execution-log.json
```

Default pacing:

- X: 18 minutes between opens, 12 opens/day, 3 engagement receipts/day
- LinkedIn: 25 minutes between opens, 8 opens/day, 2 engagement receipts/day

You can tune these when starting the API:

```bash
X_MIN_DELAY_MS=1080000 X_DAILY_OPEN_LIMIT=12 LINKEDIN_MIN_DELAY_MS=1500000 LINKEDIN_DAILY_OPEN_LIMIT=8 npm run dev
```

The app currently logs human-opened property routes. Like/reply/send behavior should stay human-gated and can be added later as explicit approved execution receipts.

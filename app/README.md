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

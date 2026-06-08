import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const csvPath = path.join(appRoot, "public", "data", "greco_relationships_hydrated.csv");
const app = express();
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text"
});

const PORT = Number(process.env.RECON_API_PORT || 5175);
const MAX_TARGETS = Number(process.env.RECON_MAX_TARGETS || 24);
const MAX_ITEMS_PER_TARGET = Number(process.env.RECON_MAX_ITEMS_PER_TARGET || 3);

const THEME_KEYWORDS = [
  "trust",
  "coordination",
  "community",
  "creator",
  "ownership",
  "public goods",
  "commons",
  "exchange",
  "money",
  "currency",
  "credit",
  "reputation",
  "identity",
  "governance",
  "platform",
  "local-first",
  "regenerative",
  "ai governance",
  "financial nihilism",
  "cooperative",
  "resilience"
];

const SEED_FEEDS = {
  "Cory Doctorow / Pluralistic": ["https://pluralistic.net/feed/"],
  "Molly White": ["https://www.citationneeded.news/rss/"],
  "Paris Marx / Tech Won't Save Us": ["https://www.techwontsave.us/feed"],
  "Jay Clouse / Creator Science": ["https://creatorscience.com/feed/"],
  "Strong Towns": ["https://www.strongtowns.org/journal?format=rss"],
  "Shareable": ["https://www.shareable.net/feed/"],
  "Institute for Local Self-Reliance": ["https://ilsr.org/feed/"],
  "Post Carbon Institute": ["https://www.postcarbon.org/feed/"],
  "Resilience.org": ["https://www.resilience.org/feed/"],
  "Tim Morgan": ["https://surplusenergyeconomics.wordpress.com/feed/"],
  "P2P Foundation": ["https://blog.p2pfoundation.net/feed"],
  "New Economics Foundation": ["https://neweconomics.org/feed"],
  "Ethical Markets": ["https://www.ethicalmarkets.com/feed/"],
  "Open Source Initiative": ["https://opensource.org/feed/"],
  "Internet Archive / Brewster Kahle": ["https://blog.archive.org/feed/"],
  "EFF": ["https://www.eff.org/rss/updates.xml"],
  "Mozilla Foundation": ["https://foundation.mozilla.org/en/blog/rss/"],
  "RadicalxChange": ["https://www.radicalxchange.org/rss.xml"]
};

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function arrayify(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function readRelationships() {
  const text = await fs.readFile(csvPath, "utf8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return parsed.data.filter((row) => row.name);
}

function priorityWeight(row) {
  if (row.priority_tier === "Tier 1") return 4;
  if (row.priority_tier === "Tier 2") return 3;
  if (row.priority_tier === "Tier 3") return 2;
  return 1;
}

function reliableUrls(row) {
  const seeded = SEED_FEEDS[row.name] || [];
  const urls = new Set(seeded);
  for (const key of ["newsletter_url", "substack_url", "podcast_url", "website"]) {
    const url = clean(row[key]);
    if (!url || url.includes("x.com") || url.includes("linkedin.com")) continue;
    const feedLike =
      url.includes("substack.com") ||
      url.includes("wordpress.com") ||
      url.includes("/feed") ||
      url.endsWith(".xml") ||
      url.includes("rss");
    if (feedLike) urls.add(url);
  }
  return [...urls].slice(0, 3);
}

function probableFeedUrls(url) {
  const normalized = url.replace(/\/$/, "");
  return [url, `${normalized}/feed`, `${normalized}/feed/`, `${normalized}/rss`, `${normalized}/rss.xml`, `${normalized}/atom.xml`];
}

async function fetchText(url, timeoutMs = 4500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "GrecoContinuityOS/0.1 (+local research assistant)",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8"
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return {
      finalUrl: response.url,
      contentType: response.headers.get("content-type") || "",
      text: await response.text()
    };
  } finally {
    clearTimeout(timeout);
  }
}

function discoverFeeds(html, baseUrl) {
  const feeds = [];
  const pattern = /<link[^>]+(?:type=["']application\/(?:rss|atom)\+xml["'][^>]*href=["']([^"']+)["']|href=["']([^"']+)["'][^>]*type=["']application\/(?:rss|atom)\+xml["'])[^>]*>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const href = match[1] || match[2];
    try {
      feeds.push(new URL(href, baseUrl).toString());
    } catch {
      // Ignore invalid discovery URLs.
    }
  }
  return feeds;
}

function textFrom(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return clean(value.text || value["#text"] || value.cdata || "");
  return clean(value);
}

function linkFrom(item) {
  if (typeof item.link === "string") return item.link;
  if (Array.isArray(item.link)) {
    const alternate = item.link.find((link) => link.rel === "alternate") || item.link[0];
    return typeof alternate === "string" ? alternate : alternate?.href || "";
  }
  if (typeof item.link === "object") return item.link.href || item.link.text || "";
  return item.guid?.text || item.id || "";
}

function parseDate(item) {
  const raw = item.pubDate || item.published || item.updated || item.date || item["dc:date"];
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.valueOf()) ? parsed.toISOString() : "";
}

function parseFeed(xml, sourceUrl) {
  const doc = parser.parse(xml);
  const items = arrayify(doc.rss?.channel?.item).length ? arrayify(doc.rss?.channel?.item) : arrayify(doc.feed?.entry);
  return items
    .map((item) => ({
      title: clean(textFrom(item.title)),
      url: clean(linkFrom(item)) || sourceUrl,
      published_at: parseDate(item),
      summary: clean(textFrom(item.description || item.summary || item.content || item["content:encoded"])).slice(0, 500),
      source_url: sourceUrl
    }))
    .filter((item) => item.title);
}

function relevanceFor(row, item) {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();
  const matched = THEME_KEYWORDS.filter((keyword) => haystack.includes(keyword));
  const base = matched.length * 11;
  const priority = priorityWeight(row) * 6;
  const recency = item.published_at
    ? Math.max(0, 20 - Math.floor((Date.now() - new Date(item.published_at).valueOf()) / 86_400_000))
    : 5;
  return { score: Math.min(100, base + priority + recency), matched_keywords: matched };
}

function recommendedAction(row, score) {
  if (score >= 78 && row.warm_path_needed === "Yes") return "Save + prepare human-reviewed reply";
  if (score >= 78) return "Draft reply";
  if (score >= 62) return "Like/save + consider owned post";
  return "Save for context";
}

function riskFor(row, score) {
  if (row.warm_path_needed === "Yes" && score >= 70) return "High";
  if (row.priority_tier === "Tier 1") return "Medium";
  return "Low";
}

async function fetchFeedForRelationship(row) {
  const seen = new Set();
  const queue = reliableUrls(row).flatMap(probableFeedUrls);
  const found = [];
  const errors = [];

  for (const url of queue) {
    if (seen.has(url) || found.length >= MAX_ITEMS_PER_TARGET) continue;
    seen.add(url);
    try {
      const result = await fetchText(url);
      const text = result.text.trim();
      const looksXml = result.contentType.includes("xml") || text.startsWith("<rss") || text.startsWith("<feed");
      if (!looksXml && result.contentType.includes("html")) {
        for (const feedUrl of discoverFeeds(result.text, result.finalUrl)) {
          if (!seen.has(feedUrl)) queue.push(feedUrl);
        }
        continue;
      }
      if (!looksXml) continue;
      for (const item of parseFeed(result.text, result.finalUrl).slice(0, MAX_ITEMS_PER_TARGET)) {
        const relevance = relevanceFor(row, item);
        found.push({
          id: `${row.name}:${item.url}`,
          target_name: row.name,
          priority_tier: row.priority_tier,
          platform: "RSS",
          title: item.title,
          url: item.url,
          published_at: item.published_at,
          summary: item.summary,
          relevance_score: relevance.score,
          matched_keywords: relevance.matched_keywords,
          recommended_action: recommendedAction(row, relevance.score),
          risk: riskFor(row, relevance.score),
          best_first_channel: row.best_first_channel,
          first_move: row.first_move,
          source_url: item.source_url
        });
      }
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  return { found, errors };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "greco-recon", port: PORT });
});

app.get("/api/recon/fetch", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || MAX_TARGETS), 80);
    const relationships = await readRelationships();
    const targets = relationships
      .map((row) => ({ row, urls: reliableUrls(row) }))
      .filter(({ urls }) => urls.length)
      .sort((a, b) => {
        const seedDiff = Number(Boolean(SEED_FEEDS[b.row.name])) - Number(Boolean(SEED_FEEDS[a.row.name]));
        if (seedDiff !== 0) return seedDiff;
        return priorityWeight(b.row) - priorityWeight(a.row);
      })
      .slice(0, limit);

    const signals = [];
    const errors = [];
    for (const target of targets) {
      const result = await fetchFeedForRelationship(target.row);
      signals.push(...result.found);
      if (result.errors.length) errors.push({ target_name: target.row.name, errors: result.errors.slice(0, 3) });
    }

    signals.sort((a, b) => {
      const scoreDiff = b.relevance_score - a.relevance_score;
      if (scoreDiff !== 0) return scoreDiff;
      return String(b.published_at).localeCompare(String(a.published_at));
    });

    res.json({
      fetched_at: new Date().toISOString(),
      target_count: targets.length,
      signal_count: signals.length,
      signals: signals.slice(0, 60),
      errors: errors.slice(0, 20)
    });
  } catch (error) {
    next(error);
  }
});

app.listen(PORT, () => {
  console.log(`Greco recon API listening on http://localhost:${PORT}`);
});

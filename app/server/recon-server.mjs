import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const csvPath = path.join(appRoot, "public", "data", "greco_relationships_hydrated.csv");
const signalStorePath = process.env.SIGNAL_STORE_PATH || path.join(appRoot, "data", "profile-signals.json");
const executionLogPath = process.env.EXECUTION_LOG_PATH || path.join(appRoot, "data", "execution-log.json");
const app = express();
app.use(express.json({ limit: "1mb" }));
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text"
});

const PORT = Number(process.env.RECON_API_PORT || 5175);
const MAX_TARGETS = Number(process.env.RECON_MAX_TARGETS || 24);
const MAX_ITEMS_PER_TARGET = Number(process.env.RECON_MAX_ITEMS_PER_TARGET || 3);
const RECON_REQUESTS_PER_MINUTE = Number(process.env.RECON_REQUESTS_PER_MINUTE || 4);
const RECON_REQUEST_JITTER_MS = Number(process.env.RECON_REQUEST_JITTER_MS || 2500);
const RECON_REQUEST_INTERVAL_MS = RECON_REQUESTS_PER_MINUTE > 0 ? Math.ceil(60_000 / RECON_REQUESTS_PER_MINUTE) : 0;
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN || "";
const X_MAX_POSTS = Number(process.env.X_MAX_POSTS || 5);
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN || "";
const LINKEDIN_API_VERSION = process.env.LINKEDIN_API_VERSION || "202603";
const LINKEDIN_MAX_POSTS = Number(process.env.LINKEDIN_MAX_POSTS || 5);

const CHANNEL_POLICIES = {
  x: {
    label: "X",
    min_delay_ms: 0,
    daily_open_limit: Number(process.env.X_DAILY_OPEN_LIMIT || 200),
    daily_engagement_limit: Number(process.env.X_DAILY_ENGAGEMENT_LIMIT || 50),
    mode: "receipt log"
  },
  linkedin: {
    label: "LinkedIn",
    min_delay_ms: 0,
    daily_open_limit: Number(process.env.LINKEDIN_DAILY_OPEN_LIMIT || 120),
    daily_engagement_limit: Number(process.env.LINKEDIN_DAILY_ENGAGEMENT_LIMIT || 40),
    mode: "receipt log"
  }
};

const THEME_KEYWORDS = [
  "ai",
  "agency",
  "automation",
  "capital",
  "civilization",
  "collective",
  "cooperation",
  "digital public infrastructure",
  "enshittification",
  "extraction",
  "funding",
  "infrastructure",
  "institution",
  "local",
  "power",
  "social",
  "sovereignty",
  "technology",
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

const PROFESSIONAL_LENS = [
  ["fraud", 28],
  ["scam", 26],
  ["scams", 26],
  ["memecoin", 26],
  ["token", 18],
  ["crypto", 24],
  ["blockchain", 18],
  ["web3", 18],
  ["allegations", 16],
  ["corruption", 24],
  ["legitimacy", 22],
  ["trust collapse", 28],
  ["institutional trust", 26],
  ["provenance", 24],
  ["receipt", 18],
  ["receipts", 18],
  ["audit", 20],
  ["authority", 22],
  ["governed", 18],
  ["governance", 20],
  ["identity", 22],
  ["binding", 18],
  ["wallet", 18],
  ["hedera", 22],
  ["consensus", 18],
  ["claim", 16],
  ["claims", 16],
  ["proof", 18],
  ["verification", 20],
  ["platform dependency", 22],
  ["platform power", 20],
  ["debanking", 22],
  ["cbdc", 18],
  ["ai governance", 22],
  ["lineage", 22],
  ["source of truth", 24],
  ["execution", 14],
  ["approval", 14],
  ["social graph", 18],
  ["creator ownership", 16]
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


let lastReconRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function paceReconRequest() {
  if (!RECON_REQUEST_INTERVAL_MS) return 0;
  const now = Date.now();
  const elapsed = now - lastReconRequestAt;
  const jitter = RECON_REQUEST_JITTER_MS > 0 ? Math.floor(Math.random() * RECON_REQUEST_JITTER_MS) : 0;
  const waitMs = lastReconRequestAt ? Math.max(0, RECON_REQUEST_INTERVAL_MS - elapsed + jitter) : 0;
  if (waitMs > 0) await sleep(waitMs);
  lastReconRequestAt = Date.now();
  return waitMs;
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function termMatches(haystack, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (/^[a-z0-9]+$/i.test(term) && term.length <= 3) {
    return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
  }
  return haystack.includes(term);
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

async function readSignalStore() {
  try {
    const text = await fs.readFile(signalStorePath, "utf8");
    const parsed = JSON.parse(text);
    return { signals: Array.isArray(parsed.signals) ? parsed.signals : [] };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return { signals: [] };
  }
}

async function writeSignalStore(store) {
  await fs.mkdir(path.dirname(signalStorePath), { recursive: true });
  await fs.writeFile(signalStorePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}


async function readExecutionLog() {
  try {
    const text = await fs.readFile(executionLogPath, "utf8");
    const parsed = JSON.parse(text);
    return { events: Array.isArray(parsed.events) ? parsed.events : [] };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return { events: [] };
  }
}

async function writeExecutionLog(log) {
  await fs.mkdir(path.dirname(executionLogPath), { recursive: true });
  await fs.writeFile(executionLogPath, `${JSON.stringify(log, null, 2)}\n`, "utf8");
}

function channelKey(value) {
  const normalized = clean(value).toLowerCase();
  if (normalized === "x" || normalized === "twitter") return "x";
  if (normalized === "linkedin") return "linkedin";
  return normalized;
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

function throttleStatus(events, channel) {
  const key = channelKey(channel);
  const policy = CHANNEL_POLICIES[key];
  if (!policy) {
    return {
      channel: key,
      throttled: false,
      allowed: true,
      wait_ms: 0,
      daily_open_count: 0,
      daily_engagement_count: 0,
      policy: null
    };
  }

  const now = Date.now();
  const today = startOfLocalDay();
  const channelEvents = events.filter((event) => event.channel === key);
  const todayEvents = channelEvents.filter((event) => String(event.created_at || "") >= today);
  const opensToday = todayEvents.filter((event) => event.type === "open").length;
  const engagementsToday = todayEvents.filter((event) => event.type === "engagement").length;
  const lastOpen = channelEvents
    .filter((event) => event.type === "open")
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
  const lastOpenAt = lastOpen?.created_at ? new Date(lastOpen.created_at).valueOf() : 0;
  const delayWait = lastOpenAt ? Math.max(0, policy.min_delay_ms - (now - lastOpenAt)) : 0;
  const capWait = opensToday >= policy.daily_open_limit ? Math.max(0, new Date(today).valueOf() + 86_400_000 - now) : 0;
  const waitMs = Math.max(delayWait, capWait);

  return {
    channel: key,
    throttled: true,
    allowed: waitMs === 0,
    wait_ms: waitMs,
    daily_open_count: opensToday,
    daily_engagement_count: engagementsToday,
    last_open_at: lastOpen?.created_at || "",
    next_open_at: waitMs ? new Date(now + waitMs).toISOString() : "",
    policy
  };
}

async function appendSignals(signals) {
  const now = new Date().toISOString();
  const store = await readSignalStore();
  const byId = new Map(store.signals.map((signal) => [signal.id, signal]));
  let appendedCount = 0;
  let updatedCount = 0;

  for (const signal of signals) {
    const existing = byId.get(signal.id);
    if (existing) {
      byId.set(signal.id, {
        ...existing,
        ...signal,
        first_seen_at: existing.first_seen_at || existing.saved_at || now,
        last_seen_at: now,
        seen_count: Number(existing.seen_count || 1) + 1,
        engagement_status: existing.engagement_status || "new"
      });
      updatedCount += 1;
      continue;
    }
    byId.set(signal.id, {
      ...signal,
      saved_at: now,
      first_seen_at: now,
      last_seen_at: now,
      seen_count: 1,
      engagement_status: "new"
    });
    appendedCount += 1;
  }

  const nextSignals = [...byId.values()].sort((a, b) => {
    const scoreDiff = Number(b.relevance_score || 0) - Number(a.relevance_score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return String(b.last_seen_at || b.saved_at || b.published_at).localeCompare(String(a.last_seen_at || a.saved_at || a.published_at));
  });
  await writeSignalStore({ updated_at: now, signals: nextSignals });
  return { appendedCount, updatedCount, totalSaved: nextSignals.length };
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
  await paceReconRequest();
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


async function fetchJson(url, headers = {}, timeoutMs = 6000) {
  await paceReconRequest();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "GrecoContinuityOS/0.1 (+local research assistant)",
        accept: "application/json",
        ...headers
      }
    });
    const text = await response.text();
    if (!response.ok) {
      const reset = response.headers.get("x-rate-limit-reset");
      const resetNote = reset ? `; resets at ${new Date(Number(reset) * 1000).toISOString()}` : "";
      throw new Error(`HTTP ${response.status}${resetNote}: ${text.slice(0, 180)}`);
    }
    return text ? JSON.parse(text) : {};
  } finally {
    clearTimeout(timeout);
  }
}

function xHandle(row) {
  const raw = clean(row.x_url);
  if (!raw) return "";
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const handle = clean(url.pathname.split("/").filter(Boolean)[0] || "").replace(/^@/, "");
    return ["i", "intent", "search", "share", "home"].includes(handle.toLowerCase()) ? "" : handle;
  } catch {
    return clean(raw).replace(/^@/, "").replace(/^x\.com\//, "").split(/[/?#]/)[0];
  }
}

function linkedinAuthorUrn(row) {
  return clean(row.linkedin_author_urn || row.linkedin_urn || row.linkedin_person_urn || row.linkedin_organization_urn);
}

function signalFromItem(row, item, platform) {
  const relevance = relevanceFor(row, item);
  return {
    id: `${row.name}:${platform}:${item.url}`,
    target_name: row.name,
    priority_tier: row.priority_tier,
    platform,
    title: item.title,
    url: item.url,
    published_at: item.published_at,
    summary: item.summary,
    relevance_score: relevance.score,
    matched_keywords: relevance.matched_keywords,
    professional_matches: relevance.professional_matches,
    score_components: relevance.score_components,
    recommended_action: recommendedAction(row, relevance.score),
    risk: riskFor(row, relevance.score),
    intelligence_summary: intelligenceSummary(row, item, relevance.matched_keywords, relevance.professional_matches),
    proposed_reply: proposedReply(row, item, relevance.matched_keywords, relevance.professional_matches),
    owned_post_seed: ownedPostSeed(row, item, relevance.matched_keywords, relevance.professional_matches),
    follow_up_sequence: followUpSequence(row, relevance.score),
    best_first_channel: row.best_first_channel,
    first_move: row.first_move,
    source_url: item.source_url
  };
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
  const matched = THEME_KEYWORDS.filter((keyword) => termMatches(haystack, keyword));
  const professionalMatches = PROFESSIONAL_LENS.filter(([keyword]) => termMatches(haystack, keyword));
  const base = matched.length * 8;
  const professional = professionalMatches.reduce((sum, [, weight]) => sum + weight, 0);
  const priority = priorityWeight(row) * 6;
  const segment = clean(row.ecosystem_segment).toLowerCase();
  const segmentBoost =
    (segment.includes("crypto") && professionalMatches.some(([keyword]) => ["crypto", "fraud", "scam", "memecoin", "token"].includes(keyword))) ||
    (segment.includes("trust") && professionalMatches.some(([keyword]) => ["identity", "verification", "governance", "provenance"].includes(keyword)))
      ? 18
      : 0;
  const recency = item.published_at
    ? Math.max(0, 20 - Math.floor((Date.now() - new Date(item.published_at).valueOf()) / 86_400_000))
    : 5;
  return {
    score: Math.min(100, base + professional + priority + segmentBoost + recency),
    matched_keywords: matched,
    professional_matches: professionalMatches.map(([keyword]) => keyword),
    score_components: {
      category: base,
      professional,
      priority,
      segment: segmentBoost,
      recency
    }
  };
}

function recommendedAction(row, score) {
  if (score >= 78 && row.warm_path_needed === "Yes") return "Human-gated reply";
  if (score >= 78) return "Draft public reply";
  if (score >= 62) return "Like/save + owned post seed";
  if (score >= 42) return "Save + watch";
  return "Archive as weak signal";
}

function riskFor(row, score) {
  if (row.warm_path_needed === "Yes" && score >= 70) return "High";
  if (row.priority_tier === "Tier 1") return "Medium";
  return "Low";
}

function primaryAngle(row, matched) {
  const segment = clean(row.ecosystem_segment).toLowerCase();
  if (matched.includes("public goods") || segment.includes("public goods") || segment.includes("refi")) {
    return "Funding is only the beginning; durable communities need exchange architecture.";
  }
  if (matched.includes("creator") || segment.includes("creator")) {
    return "Audience ownership is not enough; creators eventually need community value-flow ownership.";
  }
  if (matched.includes("trust") || matched.includes("identity") || segment.includes("identity")) {
    return "Trust infrastructure becomes meaningful when it can coordinate obligation and exchange.";
  }
  if (matched.includes("ai") || matched.includes("technology") || matched.includes("automation")) {
    return "As intelligence becomes abundant, stewardship and trust become the scarce coordination layer.";
  }
  if (matched.includes("local") || matched.includes("resilience")) {
    return "Local resilience eventually needs local exchange capacity.";
  }
  return row.current_hook || row.first_move || "This may be a contextual signal for trust-mediated exchange.";
}

function intelligenceSummary(row, item, matched, professionalMatches = []) {
  const angle = primaryAngle(row, matched);
  const professionalLens = professionalMatches.length
    ? ` It also intersects Tony's professional lens: ${professionalMatches.slice(0, 5).join(", ")}.`
    : "";
  return `${row.name} has a fresh public signal near ${matched.slice(0, 4).join(", ") || "the project frame"}.${professionalLens} ${angle}`;
}

function proposedReply(row, item, matched, professionalMatches = []) {
  const angle = primaryAngle(row, matched);
  if (professionalMatches.some((keyword) => ["fraud", "scam", "crypto", "memecoin", "legitimacy", "corruption"].includes(keyword))) {
    return `This is exactly where trust infrastructure stops being abstract. When legitimacy, fraud risk, and public claims collide, communities need systems that preserve provenance, authority, and accountable exchange instead of just another speculative layer.`;
  }
  if (row.warm_path_needed === "Yes") {
    return `This feels adjacent to a question I am mapping: how communities coordinate trust, contribution, and exchange without surrendering the relationship layer. ${angle}`;
  }
  return `This is a useful signal. ${angle} I keep coming back to the idea that community without exchange is fragile.`;
}

function ownedPostSeed(row, item, matched, professionalMatches = []) {
  const terms = [...professionalMatches, ...matched].slice(0, 4).join(", ") || "trust, coordination, and exchange";
  return `A post worth drafting: ${item.title}. Use it to connect ${terms} to the Regenerative Coordination Economy without pitching the book directly.`;
}

function followUpSequence(row, score) {
  const channel = row.best_first_channel || "the best verified public route";
  if (score >= 78) {
    return [
      "Day 0: save the source and draft a human-reviewed public reply.",
      "Day 0: if approved, engage lightly in public without asking for anything.",
      "Day 1: publish a short owned LinkedIn note if the idea deserves a broader frame.",
      `Day 3: if they engage, prepare a private follow-up through ${channel}.`,
      "Day 5-7: invite them into a Future of Civilization conversation only if the exchange is warm."
    ];
  }
  return [
    "Day 0: save the source and mark it as context.",
    "Day 1: look for one more corroborating signal before public engagement.",
    "Day 3: use it as background for a category post if the pattern repeats."
  ];
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
        found.push(signalFromItem(row, item, "RSS"));
      }
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  return { found, errors };
}


async function fetchXForRelationship(row) {
  const handle = xHandle(row);
  if (!X_BEARER_TOKEN || !handle) return { found: [], errors: [] };
  const errors = [];
  try {
    const auth = { authorization: `Bearer ${X_BEARER_TOKEN}` };
    const user = await fetchJson(`https://api.x.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=username,name`, auth);
    const userId = user?.data?.id;
    if (!userId) return { found: [], errors: [`X ${handle}: no user id returned`] };
    const maxResults = Math.max(5, Math.min(100, X_MAX_POSTS));
    const timeline = await fetchJson(
      `https://api.x.com/2/users/${encodeURIComponent(userId)}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics&exclude=retweets,replies`,
      auth
    );
    const found = (timeline.data || []).slice(0, X_MAX_POSTS).map((tweet) => {
      const text = clean(tweet.text);
      const metrics = tweet.public_metrics
        ? ` Likes ${tweet.public_metrics.like_count || 0}; reposts ${tweet.public_metrics.retweet_count || 0}; replies ${tweet.public_metrics.reply_count || 0}.`
        : "";
      const item = {
        title: text.slice(0, 180) || `X post by @${handle}`,
        url: `https://x.com/${handle}/status/${tweet.id}`,
        published_at: tweet.created_at || "",
        summary: `${text}${metrics}`.slice(0, 500),
        source_url: `https://api.x.com/2/users/${userId}/tweets`
      };
      return signalFromItem(row, item, "X");
    });
    return { found, errors };
  } catch (error) {
    errors.push(`X ${handle}: ${error.message}`);
    return { found: [], errors };
  }
}

async function fetchLinkedInForRelationship(row) {
  const authorUrn = linkedinAuthorUrn(row);
  if (!LINKEDIN_ACCESS_TOKEN || !authorUrn) return { found: [], errors: [] };
  const errors = [];
  try {
    const encodedAuthor = encodeURIComponent(authorUrn);
    const data = await fetchJson(
      `https://api.linkedin.com/rest/posts?q=author&author=${encodedAuthor}&count=${Math.max(1, Math.min(20, LINKEDIN_MAX_POSTS))}&sortBy=LAST_MODIFIED`,
      {
        authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        "LinkedIn-Version": LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0"
      }
    );
    const found = (data.elements || []).slice(0, LINKEDIN_MAX_POSTS).map((post) => {
      const postUrn = clean(post.id || post.urn || post.entity);
      const commentary = clean(post.commentary?.text || post.commentary || post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || "");
      const created = post.createdAt || post.created?.time || post.lastModifiedAt || post.lastModified?.time;
      const publishedAt = typeof created === "number" ? new Date(created).toISOString() : "";
      const item = {
        title: commentary.slice(0, 180) || `LinkedIn post by ${row.name}`,
        url: postUrn ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn)}/` : clean(row.linkedin_url),
        published_at: publishedAt,
        summary: commentary.slice(0, 500),
        source_url: "https://api.linkedin.com/rest/posts"
      };
      return signalFromItem(row, item, "LinkedIn");
    });
    return { found, errors };
  } catch (error) {
    errors.push(`LinkedIn ${row.name}: ${error.message}`);
    return { found: [], errors };
  }
}

async function fetchReliableSourcesForRelationship(row) {
  const combined = { found: [], errors: [] };
  for (const fetcher of [fetchFeedForRelationship, fetchXForRelationship, fetchLinkedInForRelationship]) {
    const result = await fetcher(row);
    combined.found.push(...result.found);
    combined.errors.push(...result.errors);
  }
  return combined;
}

function hasReliableSource(row) {
  return Boolean(
    reliableUrls(row).length ||
    (X_BEARER_TOKEN && xHandle(row)) ||
    (LINKEDIN_ACCESS_TOKEN && linkedinAuthorUrn(row))
  );
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "greco-recon", port: PORT, sources: { rss: true, x: Boolean(X_BEARER_TOKEN), linkedin: Boolean(LINKEDIN_ACCESS_TOKEN) } });
});

app.get("/api/signals", async (req, res, next) => {
  try {
    const store = await readSignalStore();
    const target = clean(req.query.target);
    const signals = target ? store.signals.filter((signal) => signal.target_name === target) : store.signals;
    res.json({
      updated_at: store.updated_at || "",
      signal_count: signals.length,
      signals
    });
  } catch (error) {
    next(error);
  }
});


app.get("/api/execution/policies", async (_req, res, next) => {
  try {
    const log = await readExecutionLog();
    res.json({
      checked_at: new Date().toISOString(),
      channels: Object.fromEntries(
        Object.keys(CHANNEL_POLICIES).map((channel) => [channel, throttleStatus(log.events, channel)])
      )
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/execution/open", async (req, res, next) => {
  try {
    const channel = channelKey(req.body?.channel);
    const url = clean(req.body?.url);
    const targetName = clean(req.body?.target_name);
    const signalId = clean(req.body?.signal_id);
    if (!channel || !url) {
      res.status(400).json({ error: "channel and url are required" });
      return;
    }

    const log = await readExecutionLog();
    const status = throttleStatus(log.events, channel);
    const event = {
      id: `${Date.now()}:${channel}:${targetName || url}`,
      type: "open",
      channel,
      target_name: targetName,
      signal_id: signalId,
      url,
      created_at: new Date().toISOString(),
      note: CHANNEL_POLICIES[channel] ? "human-opened property route receipt" : "human-opened property route"
    };
    const events = [event, ...log.events].slice(0, 1000);
    await writeExecutionLog({ updated_at: event.created_at, events });
    res.json({ allowed: true, event, status: throttleStatus(events, channel) });
  } catch (error) {
    next(error);
  }
});


app.post("/api/recon/manual-signal", async (req, res, next) => {
  try {
    const targetName = clean(req.body?.target_name);
    const platform = clean(req.body?.platform || "Manual");
    const url = clean(req.body?.url);
    const title = clean(req.body?.title);
    const summary = clean(req.body?.summary || req.body?.text || req.body?.notes);
    if (!targetName || !summary) {
      res.status(400).json({ error: "target_name and summary/text are required" });
      return;
    }

    const relationships = await readRelationships();
    const row = relationships.find((candidate) => candidate.name === targetName);
    if (!row) {
      res.status(404).json({ error: `No relationship found for ${targetName}` });
      return;
    }

    const fallbackUrl = platform.toLowerCase().includes("linkedin") ? clean(row.linkedin_url) : clean(row.x_url || row.website);
    const item = {
      title: title || summary.slice(0, 180) || `${platform} signal for ${row.name}`,
      url: url || fallbackUrl || `manual://${encodeURIComponent(row.name)}/${Date.now()}`,
      published_at: clean(req.body?.published_at) || new Date().toISOString(),
      summary: summary.slice(0, 700),
      source_url: "manual-social-recon"
    };
    const signal = {
      ...signalFromItem(row, item, platform),
      capture_source: "manual-social-recon",
      engagement_status: "captured"
    };
    const persistence = await appendSignals([signal]);
    res.json({ captured_at: new Date().toISOString(), signal, ...persistence });
  } catch (error) {
    next(error);
  }
});

app.get("/api/recon/fetch", async (req, res, next) => {
  try {
    const relationships = await readRelationships();
    const requestedLimit = clean(req.query.limit || MAX_TARGETS).toLowerCase();
    const limit = requestedLimit === "all" ? relationships.length : Math.min(Number(requestedLimit || MAX_TARGETS), relationships.length, 500);
    const targets = relationships
      .map((row) => ({ row, urls: reliableUrls(row) }))
      .filter(({ row }) => hasReliableSource(row))
      .sort((a, b) => {
        const seedDiff = Number(Boolean(SEED_FEEDS[b.row.name])) - Number(Boolean(SEED_FEEDS[a.row.name]));
        if (seedDiff !== 0) return seedDiff;
        return priorityWeight(b.row) - priorityWeight(a.row);
      })
      .slice(0, limit);

    const signals = [];
    const errors = [];
    for (const target of targets) {
      const result = await fetchReliableSourcesForRelationship(target.row);
      signals.push(...result.found);
      if (result.errors.length) errors.push({ target_name: target.row.name, errors: result.errors.slice(0, 3) });
    }

    signals.sort((a, b) => {
      const scoreDiff = b.relevance_score - a.relevance_score;
      if (scoreDiff !== 0) return scoreDiff;
      return String(b.published_at).localeCompare(String(a.published_at));
    });
    const persistence = await appendSignals(signals);

    res.json({
      fetched_at: new Date().toISOString(),
      target_count: targets.length,
      signal_count: signals.length,
      request_rate_per_minute: RECON_REQUESTS_PER_MINUTE,
      source_status: {
        rss: true,
        x: Boolean(X_BEARER_TOKEN),
        linkedin: Boolean(LINKEDIN_ACCESS_TOKEN),
        linkedin_requires_author_urn: true
      },
      appended_count: persistence.appendedCount,
      updated_count: persistence.updatedCount,
      total_saved: persistence.totalSaved,
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

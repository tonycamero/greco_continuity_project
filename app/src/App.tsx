import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Clipboard,
  Send,
  ExternalLink,
  Filter,
  Globe2,
  Mail,
  Megaphone,
  MessageSquare,
  Mic2,
  RadioTower,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  ThumbsUp,
  UserRound,
} from "lucide-react";

type Relationship = {
  rank: string;
  name: string;
  record_type: string;
  ecosystem_segment: string;
  priority_tier: string;
  relationship_stage: string;
  strategic_fit: string;
  current_hook: string;
  likely_ask: string;
  best_first_channel: string;
  warm_path_needed: string;
  first_move: string;
  risk_note: string;
  website: string;
  contact_url: string;
  public_email: string;
  linkedin_url: string;
  x_url: string;
  bluesky_url: string;
  mastodon_url: string;
  instagram_url: string;
  threads_url: string;
  tiktok_url: string;
  youtube_url: string;
  podcast_url: string;
  newsletter_url: string;
  substack_url: string;
  github_url: string;
  discord_or_community_url: string;
  event_url: string;
  booking_or_speaker_url: string;
  source_urls: string;
  data_confidence: string;
  verification_status: string;
  notes: string;
};

type Signal = {
  id: string;
  platform: string;
  title: string;
  relevance: number;
  risk: "Low" | "Medium" | "High";
  action: "Like" | "Reply" | "Quote" | "Own post" | "Save";
  status: "Recon" | "Drafted" | "Needs approval" | "Approved" | "Logged";
  angle: string;
};

type FreshSignal = {
  id: string;
  target_name: string;
  priority_tier: string;
  platform: string;
  title: string;
  url: string;
  published_at: string;
  summary: string;
  relevance_score: number;
  matched_keywords: string[];
  professional_matches: string[];
  score_components: {
    category: number;
    professional: number;
    priority: number;
    segment: number;
    recency: number;
  };
  recommended_action: string;
  risk: "Low" | "Medium" | "High";
  intelligence_summary: string;
  proposed_reply: string;
  owned_post_seed: string;
  follow_up_sequence: string[];
  best_first_channel: string;
  first_move: string;
  source_url: string;
};

type ChannelStatus = {
  channel: string;
  throttled: boolean;
  allowed: boolean;
  wait_ms: number;
  daily_open_count: number;
  daily_engagement_count: number;
  last_open_at?: string;
  next_open_at?: string;
  policy: {
    label: string;
    min_delay_ms: number;
    daily_open_limit: number;
    daily_engagement_limit: number;
    mode: string;
  } | null;
};

type PolicyResponse = {
  checked_at: string;
  channels: Record<string, ChannelStatus>;
};

type ReconResponse = {
  fetched_at: string;
  target_count: number;
  signal_count: number;
  request_rate_per_minute?: number;
  signals: FreshSignal[];
  source_status?: {
    rss: boolean;
    x: boolean;
    linkedin: boolean;
    linkedin_requires_author_urn: boolean;
  };
  errors: Array<{ target_name: string; errors: string[] }>;
};

type PublishingContact = {
  "Post ID": string;
  Theme: string;
  "Primary Platform": string;
  "Suggested Contacts": string;
  "Why Notify": string;
  "Notification Angle": string;
};

type PublishingPlatform = "X" | "LinkedIn" | "Bluesky" | "Threads" | "Facebook" | "Reddit" | "Email" | "Copy";

type PublishingDay = {
  id: string;
  day: string;
  platform: "LinkedIn" | "X";
  title: string;
  postId: string;
  theme: string;
  sourceAssets: string[];
  body: string;
};

const signalLibrary: Signal[] = [
  {
    id: "financial-nihilism",
    platform: "X",
    title: "Post on financial nihilism, markets, and young economic trust",
    relevance: 96,
    risk: "Medium",
    action: "Reply",
    status: "Needs approval",
    angle: "Trust collapse needs a practical theory of exchange, not only critique."
  },
  {
    id: "creator-ownership",
    platform: "LinkedIn",
    title: "Thread on creators owning audiences but not value flows",
    relevance: 91,
    risk: "Low",
    action: "Own post",
    status: "Drafted",
    angle: "Audience ownership is the first layer; community value-flow ownership is next."
  },
  {
    id: "public-goods",
    platform: "Substack",
    title: "Essay on public goods funding and coordination failures",
    relevance: 89,
    risk: "Low",
    action: "Reply",
    status: "Recon",
    angle: "Funding is not enough. Communities need trust-mediated exchange."
  },
  {
    id: "ai-governance",
    platform: "Podcast",
    title: "Conversation about AI governance and institutional trust",
    relevance: 84,
    risk: "High",
    action: "Save",
    status: "Recon",
    angle: "When intelligence becomes abundant, trust and stewardship become the scarce layer."
  }
];

const throttledChannels: Record<string, "x" | "linkedin"> = {
  x_url: "x",
  linkedin_url: "linkedin"
};

const platformFields = [
  ["Website", "website"],
  ["Contact", "contact_url"],
  ["LinkedIn", "linkedin_url"],
  ["X", "x_url"],
  ["Bluesky", "bluesky_url"],
  ["Mastodon", "mastodon_url"],
  ["Instagram", "instagram_url"],
  ["Threads", "threads_url"],
  ["TikTok", "tiktok_url"],
  ["YouTube", "youtube_url"],
  ["Podcast", "podcast_url"],
  ["Newsletter", "newsletter_url"],
  ["Substack", "substack_url"],
  ["GitHub", "github_url"],
  ["Discord", "discord_or_community_url"],
  ["Event", "event_url"],
  ["Booking", "booking_or_speaker_url"]
] as const;

function scoreRelationship(row: Relationship): number {
  let score = 0;
  if (row.priority_tier === "Tier 1") score += 40;
  if (row.priority_tier === "Tier 2") score += 24;
  if (row.warm_path_needed === "Yes") score += 8;
  if (row.x_url) score += 8;
  if (row.linkedin_url) score += 8;
  if (row.newsletter_url || row.substack_url) score += 8;
  if (row.contact_url || row.public_email) score += 10;
  if (row.data_confidence.toLowerCase().includes("high")) score += 6;
  const rank = Number(row.rank);
  if (rank && rank <= 10) score += 16;
  if (rank && rank > 10 && rank <= 25) score += 8;
  return score;
}

function draftFor(row: Relationship, signal: Signal): string {
  const theme = row.current_hook || signal.angle;
  if (signal.action === "Own post") {
    return `A useful pattern is emerging: ${signal.angle} That is where trust-mediated exchange becomes more than a monetary reform idea. It becomes a coordination layer for communities trying to own their relationships, contributions, and obligations.`;
  }
  if (row.ecosystem_segment.toLowerCase().includes("creator")) {
    return `This feels adjacent to something I keep seeing in creator communities: owning the audience is not the same as owning the value flow. The next question may be how communities coordinate contribution, trust, and exchange without becoming platform-dependent.`;
  }
  if (row.ecosystem_segment.toLowerCase().includes("public goods") || row.ecosystem_segment.toLowerCase().includes("refi")) {
    return `This is exactly where public-goods funding starts to meet exchange architecture. Funding helps the project exist; trust-mediated exchange helps the community keep coordinating value after the grant or campaign ends.`;
  }
  return `This connects with a deeper question I am mapping: how communities coordinate value when trust, contribution, and exchange all have to be governed together. ${theme ? `The hook for me is ${theme.toLowerCase()}.` : ""}`;
}

function draftForFreshSignal(row: Relationship, signal: FreshSignal): string {
  if (signal.proposed_reply) return signal.proposed_reply;
  const keywords = signal.matched_keywords.length ? signal.matched_keywords.slice(0, 3).join(", ") : "trust and coordination";
  const professionalTerms = signal.professional_matches?.length ? signal.professional_matches.slice(0, 3).join(", ") : "";
  if (professionalTerms) {
    return `This is not a side signal. It intersects ${professionalTerms}, which is close to the work I do around trust infrastructure, provenance, authority, identity, and governed execution. The deeper issue is not just whether this specific event is bad, but what kind of systems make claims accountable before communities are asked to trust them.`;
  }
  if (row.ecosystem_segment.toLowerCase().includes("creator")) {
    return `This connects with a pattern I keep seeing around ${keywords}: owning the audience is only the first layer. The deeper question is how communities coordinate contribution, trust, and value flow without becoming dependent on the platform layer.`;
  }
  if (row.ecosystem_segment.toLowerCase().includes("public goods") || row.ecosystem_segment.toLowerCase().includes("refi")) {
    return `This is a useful signal around ${keywords}. Funding gets attention, but durable public goods also need exchange architecture: ways for communities to remember contribution, govern obligation, and keep value moving after the initial campaign.`;
  }
  return `This caught my attention because it sits near ${keywords}. I am increasingly convinced the next economic question is not only money, but how communities coordinate trust, contribution, and exchange without surrendering the relationship layer.`;
}

function sensemakingFor(row: Relationship, freshSignal: FreshSignal | undefined, fallbackSignal: Signal) {
  const title = freshSignal?.title || fallbackSignal.title;
  const summary = freshSignal?.summary || freshSignal?.intelligence_summary || fallbackSignal.angle;
  const hook = row.current_hook || row.strategic_fit || fallbackSignal.angle;
  const segment = row.ecosystem_segment || "movement builder";
  const bridge = bridgeFor(row, freshSignal, fallbackSignal);
  const response = freshSignal ? draftForFreshSignal(row, freshSignal) : draftFor(row, fallbackSignal);
  const restraint = freshSignal?.risk === "High" || fallbackSignal.risk === "High"
    ? "Observe or use a private/warm path first. High-risk signals need context before public interpretation."
    : freshSignal?.recommended_action?.toLowerCase().includes("archive") || fallbackSignal.action === "Save"
      ? "Wait and save the context. Understanding is the move unless the pattern repeats."
      : "Use a question-first contribution. Avoid pitching the book until the bridge has been earned.";

  return {
    said: summary || title,
    asking: `The underlying question appears to be how ${segment.toLowerCase()} can make trust, contribution, and accountability durable without depending entirely on platform or institutional authority.`,
    matters: `This matters because ${row.name} sits near ${hook.toLowerCase()}. A clean bridge here could move the Greco workspace from monetary reform into a broader category conversation.`,
    bridge,
    response,
    restraint
  };
}

function bridgeFor(row: Relationship, freshSignal: FreshSignal | undefined, fallbackSignal: Signal): string {
  const text = `${row.ecosystem_segment} ${row.current_hook} ${row.strategic_fit} ${freshSignal?.matched_keywords.join(" ") ?? ""} ${fallbackSignal.angle}`.toLowerCase();
  if (text.includes("nihilism") || text.includes("trust collapse")) return "Financial Nihilism -> Institutional Trust -> Contribution -> Community Value";
  if (text.includes("creator") || text.includes("ownership") || text.includes("audience")) return "Audience Ownership -> Contribution Memory -> Community Value Flow";
  if (text.includes("public goods") || text.includes("refi") || text.includes("commons")) return "Public Goods -> Funding Limits -> Trust-Mediated Exchange";
  if (text.includes("ai") || text.includes("identity") || text.includes("provenance")) return "AI Trust -> Provenance -> Authority -> Accountable Exchange";
  return "Signal -> Coordination Tension -> Trust-Mediated Exchange";
}

function narrativeCardFor(row: Relationship, freshSignal: FreshSignal | undefined, fallbackSignal: Signal) {
  const bridge = bridgeFor(row, freshSignal, fallbackSignal);
  const categoryFit = row.ecosystem_segment || freshSignal?.matched_keywords.slice(0, 2).join(" / ") || "Regenerative Coordination Economy";
  const posture = freshSignal?.risk === "High" || fallbackSignal.risk === "High"
    ? "Observe first; use a warm private path if action is needed."
    : "Question rather than assertion; advance understanding before advocacy.";
  return {
    currentNarrative: "Trust-Mediated Exchange",
    bridge,
    categoryFit,
    posture
  };
}
function followUpFor(row: Relationship): string[] {
  const invitation = row.likely_ask || "Invite into a Future of Civilization conversation";
  return [
    `Day 0: capture the relevant post, like only if the signal is clean, and save the public context.`,
    `Day 0: post or reply with a precise non-promotional response tied to ${row.current_hook || "trust-mediated exchange"}.`,
    `Day 1: publish a short owned LinkedIn note if the public response deserves a larger frame.`,
    `Day 3: if there is engagement, prepare a private follow-up through ${row.best_first_channel || "the best verified route"}.`,
    `Day 5-7: ${invitation.includes("podcast") ? invitation : `invite them to a Future of Civilization conversation connected to ${invitation}`}.`
  ];
}

function channelCount(row: Relationship): number {
  return platformFields.filter(([, key]) => Boolean(row[key])).length;
}

function formatDelay(ms: number): string {
  if (ms <= 0) return "clear";
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function parsePublishingQueue(markdown: string): PublishingDay[] {
  return markdown
    .split(/\n(?=## Day \d+ - )/g)
    .filter((section) => section.startsWith("## Day "))
    .map((section) => {
      const heading = section.match(/^## (Day \d+) - (LinkedIn|X Thread)/);
      const postId = section.match(/Post ID:\s*(.+)/)?.[1].trim() ?? "";
      const theme = section.match(/Theme:\s*(.+)/)?.[1].trim() ?? "";
      const sourceBlock = section.match(/Source assets:\n\n([\s\S]*?)\n\n(?:Post|Thread):/);
      const sourceAssets = sourceBlock?.[1]
        .split("\n")
        .map((line) => line.replace(/^-\s*/, "").replace(/`/g, "").trim())
        .filter(Boolean) ?? [];
      const body = (section.match(/(?:Post|Thread):\n\n([\s\S]*?)\n\nSuggested notifications:/)?.[1] ?? section)
        .trim();
      const platform = heading?.[2] === "X Thread" ? "X" : "LinkedIn";
      return {
        id: postId || heading?.[1] || section.slice(0, 16),
        day: heading?.[1] ?? "Day",
        platform,
        title: `${heading?.[1] ?? "Day"} · ${theme}`,
        postId,
        theme,
        sourceAssets,
        body
      };
    });
}


function xIntentText(body: string): string {
  const firstThreadPost = body.match(/^1\.\s*([\s\S]*?)(?=\n\n2\.\s|$)/);
  const candidate = (firstThreadPost?.[1] ?? body).trim();
  return candidate.length > 270 ? `${candidate.slice(0, 267).trim()}...` : candidate;
}

function platformPostUrl(platform: PublishingPlatform, post: PublishingDay): string {
  const text = platform === "X" ? xIntentText(post.body) : post.body;
  const encodedText = encodeURIComponent(text);
  const encodedTitle = encodeURIComponent(post.theme || "Regenerative Coordination Economy");
  const shareUrl = encodeURIComponent(window.location.href);
  if (platform === "X") return `https://twitter.com/intent/tweet?text=${encodedText}`;
  if (platform === "LinkedIn") return "https://www.linkedin.com/feed/?shareActive=true";
  if (platform === "Bluesky") return `https://bsky.app/intent/compose?text=${encodedText}`;
  if (platform === "Threads") return `https://www.threads.net/intent/post?text=${encodedText}`;
  if (platform === "Facebook") return `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
  if (platform === "Reddit") return `https://www.reddit.com/submit?title=${encodedTitle}&text=${encodedText}`;
  if (platform === "Email") return `mailto:?subject=${encodedTitle}&body=${encodedText}`;
  return "";
}

function platformCopyNote(platform: PublishingPlatform, post: PublishingDay): string {
  if (platform === "X" && post.platform === "X") return "Copies the full thread and opens X with the first post prefilled.";
  if (platform === "LinkedIn") return "Copies the full post and opens the LinkedIn composer.";
  if (platform === "Facebook") return "Copies the full post. Facebook opens with a link share; paste the copied text as commentary.";
  if (platform === "Copy") return "Copies the full post for any platform or community channel.";
  return "Copies the full post and opens the platform composer when supported.";
}

const primaryPlatforms: PublishingPlatform[] = ["X", "LinkedIn", "Bluesky", "Threads", "Facebook", "Reddit", "Email", "Copy"];

type PropertyIconName =
  | "Website"
  | "Contact"
  | "Email"
  | "LinkedIn"
  | "X"
  | "Bluesky"
  | "Mastodon"
  | "Instagram"
  | "Threads"
  | "TikTok"
  | "YouTube"
  | "Podcast"
  | "Newsletter"
  | "Substack"
  | "GitHub"
  | "Discord"
  | "Event"
  | "Booking"
  | "RSS"
  | "Copy";

const propertyIconAssets: Partial<Record<PropertyIconName, string>> = {
  X: "x",
  LinkedIn: "linkedin",
  Bluesky: "bluesky",
  Threads: "threads",
  YouTube: "youtube",
  Substack: "substack",
  GitHub: "github",
  Instagram: "instagram",
  TikTok: "tiktok",
  Discord: "discord",
  Mastodon: "mastodon"
};

function propertyNameFromSignal(platform: string): PropertyIconName {
  const normalized = platform.toLowerCase();
  if (normalized.includes("x")) return "X";
  if (normalized.includes("linkedin")) return "LinkedIn";
  if (normalized.includes("substack")) return "Substack";
  if (normalized.includes("youtube")) return "YouTube";
  if (normalized.includes("podcast")) return "Podcast";
  if (normalized.includes("rss")) return "RSS";
  return "Website";
}

function PropertyIcon({ name, className = "" }: { name: PropertyIconName; className?: string }) {
  const assetName = propertyIconAssets[name];
  if (assetName) {
    return <img className={`platform-logo ${className}`.trim()} src={`/platform-icons/${assetName}.svg`} alt="" aria-hidden="true" />;
  }
  if (name === "Website") return <Globe2 size={17} />;
  if (name === "Contact" || name === "Email") return <Mail size={17} />;
  if (name === "Podcast") return <Mic2 size={17} />;
  if (name === "Newsletter" || name === "RSS") return <MessageSquare size={17} />;
  if (name === "Event") return <RadioTower size={17} />;
  if (name === "Booking") return <Clock3 size={17} />;
  if (name === "Copy") return <Clipboard size={17} />;
  return <ExternalLink size={17} />;
}

function normalizedName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function relationshipForContact(contact: string, rows: Relationship[]): Relationship | undefined {
  const normalizedContact = normalizedName(contact.split("/")[0] || contact);
  if (!normalizedContact) return undefined;
  return rows.find((row) => {
    const normalizedRow = normalizedName(row.name);
    return normalizedRow === normalizedContact || normalizedRow.includes(normalizedContact) || normalizedContact.includes(normalizedRow);
  });
}

function platformIcon(platform: PublishingPlatform) {
  if (platform === "Facebook") return <img className="platform-logo" src="/platform-icons/facebook.svg" alt="" aria-hidden="true" />;
  if (platform === "Reddit") return <img className="platform-logo" src="/platform-icons/reddit.svg" alt="" aria-hidden="true" />;
  if (platform === "Email") return <Mail size={18} />;
  if (platform === "Copy") return <Clipboard size={18} />;
  return <PropertyIcon name={platform} />;
}

export function App() {
  const [page, setPage] = useState<"pipeline" | "publishing">("pipeline");
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState("Tier 1");
  const [selectedName, setSelectedName] = useState("");
  const [selectedSignalId, setSelectedSignalId] = useState(signalLibrary[0].id);
  const [selectedFreshSignalId, setSelectedFreshSignalId] = useState("");
  const [freshRecon, setFreshRecon] = useState<ReconResponse | null>(null);
  const [isFetchingRecon, setIsFetchingRecon] = useState(false);
  const [reconError, setReconError] = useState("");
  const [channelPolicies, setChannelPolicies] = useState<Record<string, ChannelStatus>>({});
  const [channelNotice, setChannelNotice] = useState("");
  const [mode, setMode] = useState<"Signal" | "Sensemaking" | "Response" | "Approve">("Signal");
  const [publishingDays, setPublishingDays] = useState<PublishingDay[]>([]);
  const [publishingContacts, setPublishingContacts] = useState<PublishingContact[]>([]);
  const [strategyMarkdown, setStrategyMarkdown] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [postLaunchNotice, setPostLaunchNotice] = useState("");
  const [shareDockOpen, setShareDockOpen] = useState(false);

  useEffect(() => {
    Papa.parse<Relationship>("/data/greco_relationships_hydrated.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data.filter((row) => row.name);
        setRelationships(rows);
        setSelectedName(rows[0]?.name ?? "");
      }
    });
  }, []);

  async function fetchExecutionPolicies() {
    try {
      const response = await fetch("/api/execution/policies");
      if (!response.ok) return;
      const data = (await response.json()) as PolicyResponse;
      setChannelPolicies(data.channels);
    } catch {
      // Execution pacing is advisory while the local API is unavailable.
    }
  }

  useEffect(() => {
    fetchExecutionPolicies();
  }, []);

  useEffect(() => {
    async function loadPublishingSystem() {
      const [queueResponse, contactsResponse, strategyResponse] = await Promise.all([
        fetch("/publishing_system/daily_publish_queue.md"),
        fetch("/publishing_system/contact_notification_matrix.csv"),
        fetch("/publishing_system/posting_strategy.md")
      ]);
      const queueMarkdown = await queueResponse.text();
      const days = parsePublishingQueue(queueMarkdown);
      setPublishingDays(days);
      setSelectedPostId((current) => current || days[0]?.postId || "");

      const contactsCsv = await contactsResponse.text();
      const parsedContacts = Papa.parse<PublishingContact>(contactsCsv, {
        header: true,
        skipEmptyLines: true
      });
      setPublishingContacts(parsedContacts.data.filter((row) => row["Post ID"]));

      setStrategyMarkdown(await strategyResponse.text());
    }

    loadPublishingSystem().catch(() => {
      setCopyNotice("Publishing system files could not be loaded.");
    });
  }, []);

  const filtered = useMemo(() => {
    return relationships
      .filter((row) => (tier === "All" ? true : row.priority_tier === tier))
      .filter((row) => {
        const haystack = `${row.name} ${row.ecosystem_segment} ${row.current_hook} ${row.strategic_fit}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .sort((a, b) => scoreRelationship(b) - scoreRelationship(a));
  }, [relationships, query, tier]);

  const selected = relationships.find((row) => row.name === selectedName) ?? filtered[0];
  const selectedSignal = signalLibrary.find((signal) => signal.id === selectedSignalId) ?? signalLibrary[0];
  const relevantFreshSignals = freshRecon?.signals.filter((signal) => signal.target_name === selected?.name) ?? [];
  const selectedFreshSignal =
    relevantFreshSignals.find((signal) => signal.id === selectedFreshSignalId) ?? relevantFreshSignals[0];
  const topMoves = filtered.slice(0, 5);
  const topFreshSignals = freshRecon?.signals.slice(0, 8) ?? [];
  const socialTargets = relationships
    .filter((row) => row.x_url || row.linkedin_url)
    .sort((a, b) => scoreRelationship(b) - scoreRelationship(a));
  const selectedSocialIndex = selected ? socialTargets.findIndex((row) => row.name === selected.name) : -1;
  const socialQueueLabel = selectedSocialIndex >= 0 ? `${selectedSocialIndex + 1}/${socialTargets.length}` : `${socialTargets.length} profiles`;
  const selectedPublishingDay = publishingDays.find((post) => post.postId === selectedPostId) ?? publishingDays[0];
  const selectedPublishingContact = publishingContacts.find((row) => row["Post ID"] === selectedPublishingDay?.postId);
  const publishingProgress = selectedPublishingDay
    ? `${publishingDays.findIndex((post) => post.postId === selectedPublishingDay.postId) + 1}/${publishingDays.length}`
    : "0/0";

  useEffect(() => {
    setShareDockOpen(false);
    setPostLaunchNotice("");
  }, [selectedPostId]);

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyNotice(`${label} copied.`);
    } catch {
      setCopyNotice("Copy failed. Select the text and copy manually.");
    }
  }


  async function launchPlatformPost(post: PublishingDay, platform: PublishingPlatform = post.platform) {
    try {
      await navigator.clipboard.writeText(post.body);
      setPostLaunchNotice(`${platform} copy ready.${platform === "Copy" ? "" : " The composer is opening now."}`);
    } catch {
      setPostLaunchNotice(`${platform} ${platform === "Copy" ? "copy" : "composer"} may need manual copy/paste.`);
    }
    const url = platformPostUrl(platform, post);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  async function openChannelRoute(row: Relationship, label: string, key: keyof Relationship, url: string) {
    const channel = throttledChannels[key as string];
    if (!channel) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    setChannelNotice("");
    try {
      const response = await fetch("/api/execution/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          url,
          target_name: row.name,
          signal_id: selectedFreshSignal?.id || selectedSignal.id
        })
      });
      const data = await response.json();
      if (!response.ok) {
        const wait = formatDelay(Number(data.wait_ms || 0));
        setChannelNotice(`${label} route was not logged. Try again in ${wait}.`);
        if (data.channel && data.policy) setChannelPolicies((current) => ({ ...current, [data.channel]: data }));
        return;
      }
      if (data.status?.channel) setChannelPolicies((current) => ({ ...current, [data.status.channel]: data.status }));
      setChannelNotice(`${label} route opened and receipt-logged. Keep it surgical.`);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setChannelNotice(error instanceof Error ? error.message : `${label} route could not be opened.`);
    }
  }


  async function fetchReliableSources() {
    setIsFetchingRecon(true);
    setReconError("");
    try {
      const response = await fetch("/api/recon/fetch?limit=all");
      if (!response.ok) throw new Error(`Recon API returned ${response.status}`);
      const data = (await response.json()) as ReconResponse;
      setFreshRecon(data);
      setSelectedFreshSignalId(data.signals[0]?.id ?? "");
      const firstHit = data.signals.find((signal) => relationships.some((row) => row.name === signal.target_name));
      if (firstHit) setSelectedName(firstHit.target_name);
      setMode("Signal");
    } catch (error) {
      setReconError(error instanceof Error ? error.message : "Recon fetch failed");
    } finally {
      setIsFetchingRecon(false);
    }
  }

  if (page === "publishing") {
    const contactList = selectedPublishingContact?.["Suggested Contacts"].split(";").map((item) => item.trim()).filter(Boolean) ?? [];
    const notificationText = selectedPublishingContact
      ? `Relevant contacts: ${selectedPublishingContact["Suggested Contacts"]}\n\nWhy notify: ${selectedPublishingContact["Why Notify"]}\n\nAngle: ${selectedPublishingContact["Notification Angle"]}`
      : "";

    return (
      <main className="shell publishing-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Greco Continuity OS</p>
            <h1>Public Signal Publishing Desk</h1>
          </div>
          <div className="status-strip" aria-label="Publishing status">
            <span><Megaphone size={16} /> {publishingDays.length || "..."} daily posts</span>
            <span><Clipboard size={16} /> Copy/paste ready</span>
            <button className="topbar-action" onClick={() => setPage("pipeline")}>
              <ArrowUpRight size={16} />
              Narrative Intelligence
            </button>
          </div>
        </header>

        <section className="publish-brief" aria-label="Publishing logic">
          <div>
            <p className="eyebrow">Category</p>
            <strong>Regenerative Coordination Economy</strong>
            <span>Public market umbrella</span>
          </div>
          <div>
            <p className="eyebrow">Mechanism</p>
            <strong>Trust-Mediated Exchange</strong>
            <span>Greco contribution inside the category</span>
          </div>
          <div>
            <p className="eyebrow">Bridge Line</p>
            <strong>Community without exchange is fragile.</strong>
            <span>Reusable category-forming phrase</span>
          </div>
          <div>
            <p className="eyebrow">Current Post</p>
            <strong>{selectedPublishingDay ? publishingProgress : "Loading"}</strong>
            <span>{selectedPublishingDay?.platform ?? "Publishing queue"}</span>
          </div>
        </section>

        <section className="publishing-workspace">
          <aside className="panel publishing-list-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Daily Queue</p>
                <h2>Choose Post</h2>
              </div>
              <Megaphone size={18} />
            </div>

            <div className="publishing-list">
              {publishingDays.map((post) => (
                <button
                  key={post.postId}
                  className={`publishing-row ${selectedPublishingDay?.postId === post.postId ? "selected" : ""}`}
                  onClick={() => setSelectedPostId(post.postId)}
                >
                  <span className={`platform-pill ${post.platform.toLowerCase()}`}><PropertyIcon name={post.platform} /> {post.platform}</span>
                  <span>
                    <strong>{post.day}</strong>
                    <small>{post.theme}</small>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="panel publish-copy-panel">
            {selectedPublishingDay ? (
              <>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">{selectedPublishingDay.platform} · {selectedPublishingDay.postId}</p>
                    <h2>{selectedPublishingDay.theme}</h2>
                  </div>
                  <button className="copy-button" onClick={() => copyText("Post", selectedPublishingDay.body)}>
                    <Clipboard size={16} />
                    Copy Post
                  </button>
                </div>

                <div className="source-asset-row">
                  {selectedPublishingDay.sourceAssets.map((asset) => (
                    <span key={asset}>{asset.replace("../", "")}</span>
                  ))}
                </div>

                <div className="post-share-row">
                  <button className="share-toggle" onClick={() => setShareDockOpen((current) => !current)} aria-expanded={shareDockOpen}>
                    <Send size={16} />
                    Share
                  </button>
                  <span>{platformCopyNote(selectedPublishingDay.platform, selectedPublishingDay)}</span>
                </div>
                {shareDockOpen && (
                  <div className="platform-launch-dock" aria-label="Post this content to a platform">
                    <span>Share via</span>
                    {primaryPlatforms.map((platform) => (
                      <button key={platform} onClick={() => launchPlatformPost(selectedPublishingDay, platform)} title={`Copy and open ${platform}`} aria-label={`Copy and open ${platform}`}>
                        {platformIcon(platform)}
                      </button>
                    ))}
                  </div>
                )}
                {postLaunchNotice && <p className="post-launch-notice">{postLaunchNotice}</p>}

                <textarea className="post-copyarea" value={selectedPublishingDay.body} readOnly aria-label="Selected publishing post" />

                <div className="copy-footer">
                  <button onClick={() => copyText("Post and notification packet", `${selectedPublishingDay.body}\n\n---\n\n${notificationText}`)}>
                    <Clipboard size={16} />
                    Copy Post + Notify Packet
                  </button>
                  {copyNotice && <span>{copyNotice}</span>}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <strong>Publishing files are loading.</strong>
                <span>The page reads from app/public/publishing_system.</span>
              </div>
            )}
          </section>

          <aside className="panel notification-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Decision Support</p>
                <h2>Notify List</h2>
              </div>
              <button className="copy-icon-button" onClick={() => copyText("Notification packet", notificationText)} aria-label="Copy notification packet">
                <Clipboard size={16} />
              </button>
            </div>

            {selectedPublishingContact ? (
              <div className="notification-stack">
                <div className="notify-card">
                  <span className="label">Why this group</span>
                  <p>{selectedPublishingContact["Why Notify"]}</p>
                </div>
                <div className="notify-card">
                  <span className="label">Notification angle</span>
                  <p>{selectedPublishingContact["Notification Angle"]}</p>
                </div>
                <div className="contact-chip-list">
                  {contactList.map((contact) => {
                    const contactRow = relationshipForContact(contact, relationships);
                    return (
                      <span key={contact} className="contact-chip">
                        <strong>{contact}</strong>
                        {contactRow?.x_url && (
                          <button onClick={() => openChannelRoute(contactRow, "X", "x_url", contactRow.x_url)} aria-label={`Open X for ${contact}`}>
                            <PropertyIcon name="X" />
                          </button>
                        )}
                        {contactRow?.linkedin_url && (
                          <button onClick={() => openChannelRoute(contactRow, "LinkedIn", "linkedin_url", contactRow.linkedin_url)} aria-label={`Open LinkedIn for ${contact}`}>
                            <PropertyIcon name="LinkedIn" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <strong>No contact matrix row selected.</strong>
                <span>Choose a post from the queue.</span>
              </div>
            )}

            <div className="strategy-card">
              <p className="eyebrow">Operating Logic</p>
              <textarea value={strategyMarkdown} readOnly aria-label="Publishing strategy" />
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Greco Continuity OS</p>
          <h1>Narrative Intelligence</h1>
        </div>
        <div className="status-strip" aria-label="Pipeline status">
          <span><UserRound size={16} /> {relationships.length || "..."} records</span>
          <span><ShieldCheck size={16} /> Human gated</span>
          <span><Sparkles size={16} /> Codex executed</span>
          <button className="topbar-action" onClick={() => setPage("publishing")}>
            <Megaphone size={16} />
            Publishing Desk
          </button>
        </div>
      </header>

      <section className="metrics" aria-label="Relationship summary">
        <div>
          <strong>{relationships.filter((row) => row.priority_tier === "Tier 1").length}</strong>
          <span>Tier 1 targets</span>
        </div>
        <div>
          <strong>{relationships.filter((row) => row.warm_path_needed === "Yes").length}</strong>
          <span>warm path only</span>
        </div>
        <div>
          <strong><PropertyIcon name="X" /> {relationships.filter((row) => row.x_url).length}</strong>
          <span>X routes</span>
        </div>
        <div>
          <strong><PropertyIcon name="LinkedIn" /> {relationships.filter((row) => row.linkedin_url).length}</strong>
          <span>LinkedIn routes</span>
        </div>
      </section>

      <section className="recon-toolbar" aria-label="Reliable source fetch">
        <div>
          <p className="eyebrow">Signal Intake</p>
          <strong>{freshRecon ? `${freshRecon.signal_count} fresh signals from ${freshRecon.target_count} targets` : "Fetch reliable sources across all relationship records"}</strong>
          <span>
            {freshRecon
              ? `Last fetch: ${new Date(freshRecon.fetched_at).toLocaleString()}`
              : "All 113 records. RSS/blogs plus X API when configured; LinkedIn only through official API access. Pacing: 4 requests/min."}
          </span>
          {reconError && <em>{reconError}</em>}
        </div>
        <button onClick={fetchReliableSources} disabled={isFetchingRecon}>
          <RadioTower size={17} />
          {isFetchingRecon ? "Fetching all..." : "Fetch All Reliable Sources"}
        </button>
      </section>

      <section className="workspace">
        <aside className="panel relationship-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Today</p>
              <h2>Highest-Leverage Moves</h2>
            </div>
            <Filter size={18} />
          </div>

          <label className="searchbox">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, hooks, segments" />
          </label>

          <div className="segmented" role="group" aria-label="Priority filter">
            {["Tier 1", "Tier 2", "Tier 3", "All"].map((item) => (
              <button key={item} className={tier === item ? "active" : ""} onClick={() => setTier(item)}>
                {item}
              </button>
            ))}
          </div>

          <div className="relationship-list">
            {topFreshSignals.length > 0 && (
              <div className="morning-queue">
                <p className="eyebrow">Highest-Leverage Signals</p>
                {topFreshSignals.map((signal) => (
                  <div key={signal.id} className={`queue-item ${selectedFreshSignalId === signal.id ? "selected" : ""}`}>
                    <button
                      className="queue-row"
                      onClick={() => {
                        setSelectedName(signal.target_name);
                        setSelectedFreshSignalId(signal.id);
                        setMode("Signal");
                      }}
                    >
                      <span>
                        <strong><PropertyIcon name={propertyNameFromSignal(signal.platform)} /> {signal.target_name}</strong>
                        <small>{signal.title}</small>
                      </span>
                      <em>{signal.relevance_score}</em>
                    </button>
                    <a className="queue-open" href={signal.url} target="_blank" rel="noreferrer" aria-label={`Open live post for ${signal.target_name}`}>
                      <ExternalLink size={15} />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {topMoves.map((row) => (
              <button
                key={row.name}
                className={`relationship-row ${selected?.name === row.name ? "selected" : ""}`}
                onClick={() => setSelectedName(row.name)}
              >
                <span className="rank">{row.rank || "OS"}</span>
                <span>
                  <strong>{row.name}</strong>
                  <small>{row.current_hook || row.ecosystem_segment}</small>
                </span>
                <em>{scoreRelationship(row)}</em>
              </button>
            ))}
          </div>
        </aside>

        {selected && (
          <section className="panel cockpit">
            <div className="panel-header">
              <div>
                <p className="eyebrow">{selected.priority_tier} · {selected.relationship_stage}</p>
                <h2>{selected.name}</h2>
              </div>
              <a className="icon-link" href={selected.website || selected.contact_url} target="_blank" rel="noreferrer" aria-label="Open public route">
                <ExternalLink size={18} />
              </a>
            </div>

            <div className="relationship-brief">
              <div>
                <span className="label"><Tags size={14} /> Segment</span>
                <p>{selected.ecosystem_segment || "Unclassified"}</p>
              </div>
              <div>
                <span className="label"><Clock3 size={14} /> Best first channel</span>
                <p>{selected.best_first_channel || "Research needed before outreach"}</p>
              </div>
              <div>
                <span className="label"><ShieldCheck size={14} /> Risk note</span>
                <p>{selected.risk_note || "No special risk note yet. Re-verify before outreach."}</p>
              </div>
            </div>


            {(() => {
              const narrative = narrativeCardFor(selected, selectedFreshSignal, selectedSignal);
              return (
                <div className="narrative-card">
                  <div>
                    <span className="label"><Sparkles size={14} /> Current Narrative</span>
                    <strong>{narrative.currentNarrative}</strong>
                  </div>
                  <div>
                    <span className="label"><ArrowUpRight size={14} /> Bridge</span>
                    <p>{narrative.bridge}</p>
                  </div>
                  <div>
                    <span className="label"><Tags size={14} /> Category Fit</span>
                    <p>{narrative.categoryFit}</p>
                  </div>
                  <div>
                    <span className="label"><ShieldCheck size={14} /> Recommended Posture</span>
                    <p>{narrative.posture}</p>
                  </div>
                </div>
              );
            })()}

            <div className="workflow-panel">
              <div className="workflow-heading">
                <span className="eyebrow">Judgment Workflow</span>
                <strong>Understand before acting</strong>
                <p>Move from signal to meaning, then choose whether to respond, wait, or deepen the relationship.</p>
              </div>
              <div className="mode-tabs" role="group" aria-label="Workflow mode">
                {(["Signal", "Sensemaking", "Response", "Approve"] as const).map((item) => (
                  <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {mode === "Signal" && selectedFreshSignal && (
              <div className="intelligence-stack">
                <div className="intel-card primary">
                  <span className="signal-top">
                    <strong><PropertyIcon name={propertyNameFromSignal(selectedFreshSignal.platform)} /> {selectedFreshSignal.platform} · {selectedFreshSignal.recommended_action}</strong>
                    <em>{selectedFreshSignal.relevance_score}%</em>
                  </span>
                  <h3>
                    <a href={selectedFreshSignal.url} target="_blank" rel="noreferrer">
                      {selectedFreshSignal.title}
                    </a>
                  </h3>
                  <p>{selectedFreshSignal.intelligence_summary}</p>
                  <div className="keyword-row">
                    {(selectedFreshSignal.matched_keywords.length ? selectedFreshSignal.matched_keywords : ["context signal"]).slice(0, 6).map((keyword) => (
                      <span key={keyword}>{keyword}</span>
                    ))}
                  </div>
                  {selectedFreshSignal.professional_matches?.length ? (
                    <div className="professional-lens">
                      <span className="label"><ShieldCheck size={14} /> Tony lens</span>
                      <div className="keyword-row">
                        {selectedFreshSignal.professional_matches.slice(0, 6).map((keyword) => (
                          <span key={keyword}>{keyword}</span>
                        ))}
                      </div>
                      <small>
                        Score: professional {selectedFreshSignal.score_components.professional}, category {selectedFreshSignal.score_components.category}, recency {selectedFreshSignal.score_components.recency}
                      </small>
                    </div>
                  ) : null}
                  <a className="source-link" href={selectedFreshSignal.url} target="_blank" rel="noreferrer">
                    <PropertyIcon name={selectedFreshSignal ? propertyNameFromSignal(selectedFreshSignal.platform) : "Website"} />
                    Open source signal
                  </a>
                </div>

                {relevantFreshSignals.length > 1 && (
                  <div className="signals compact">
                    {relevantFreshSignals.map((signal) => (
                      <div key={signal.id} className={`signal-item ${selectedFreshSignal?.id === signal.id ? "selected" : ""}`}>
                        <button className="signal" onClick={() => setSelectedFreshSignalId(signal.id)}>
                          <span className="signal-top">
                            <strong><PropertyIcon name={propertyNameFromSignal(signal.platform)} /> {signal.recommended_action}</strong>
                            <em>{signal.relevance_score}%</em>
                          </span>
                          <span>{signal.title}</span>
                        </button>
                        <a className="signal-open" href={signal.url} target="_blank" rel="noreferrer" aria-label={`Open live source for ${signal.title}`}>
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode === "Signal" && freshRecon && !selectedFreshSignal && (
              <div className="empty-state">
                <strong>No fresh reliable-source signal for this target yet.</strong>
                <span>Use the engagement surface for manual observation, or fetch again after more sources are added.</span>
              </div>
            )}

            {mode === "Signal" && !freshRecon && !selectedFreshSignal && (
              <div className="signals">
                {signalLibrary.map((signal) => (
                  <button
                    key={signal.id}
                    className={`signal ${selectedSignalId === signal.id ? "selected" : ""}`}
                    onClick={() => setSelectedSignalId(signal.id)}
                  >
                    <span className="signal-top">
                      <strong><PropertyIcon name={propertyNameFromSignal(signal.platform)} /> {signal.platform}</strong>
                      <em>{signal.relevance}%</em>
                    </span>
                    <span>{signal.title}</span>
                    <small>{signal.angle}</small>
                  </button>
                ))}
              </div>
            )}



            {mode === "Sensemaking" && (() => {
              const sensemaking = sensemakingFor(selected, selectedFreshSignal, selectedSignal);
              return (
                <div className="sensemaking-surface">
                  <div className="sensemaking-card wide">
                    <span className="label"><MessageSquare size={14} /> What they said</span>
                    <p>{sensemaking.said}</p>
                  </div>
                  <div className="sensemaking-card">
                    <span className="label"><Search size={14} /> What they are really asking</span>
                    <p>{sensemaking.asking}</p>
                  </div>
                  <div className="sensemaking-card">
                    <span className="label"><ShieldCheck size={14} /> Why it matters</span>
                    <p>{sensemaking.matters}</p>
                  </div>
                  <div className="sensemaking-card">
                    <span className="label"><ArrowUpRight size={14} /> Bridge</span>
                    <p>{sensemaking.bridge}</p>
                  </div>
                  <div className="sensemaking-card">
                    <span className="label"><ThumbsUp size={14} /> Suggested response</span>
                    <p>{sensemaking.response}</p>
                  </div>
                  <div className="sensemaking-card wide restraint">
                    <span className="label"><Clock3 size={14} /> Restraint note</span>
                    <p>{sensemaking.restraint}</p>
                  </div>
                </div>
              );
            })()}
            {mode === "Response" && (
              <div className="draft-box">
                <div className="draft-meta">
                  <span>
                    <ThumbsUp size={14} />
                    Recommended response: {selectedFreshSignal?.recommended_action || selectedSignal.action}
                  </span>
                  <span>Risk: {selectedFreshSignal?.risk || selectedSignal.risk}</span>
                </div>
                <textarea
                  value={selectedFreshSignal ? draftForFreshSignal(selected, selectedFreshSignal) : draftFor(selected, selectedSignal)}
                  readOnly
                  aria-label="Prepared response"
                />
                {selectedFreshSignal?.owned_post_seed && (
                  <div className="owned-post-seed">
                    <span className="label"><Sparkles size={14} /> Owned post seed</span>
                    <p>{selectedFreshSignal.owned_post_seed}</p>
                  </div>
                )}
                {selectedFreshSignal && (
                  <a className="source-link" href={selectedFreshSignal.url} target="_blank" rel="noreferrer">
                    <PropertyIcon name={selectedFreshSignal ? propertyNameFromSignal(selectedFreshSignal.platform) : "Website"} />
                    Open source signal
                  </a>
                )}
              </div>
            )}

            {mode === "Approve" && (
              <div className="approval-grid">
                <div className="judgment-banner">
                  <ShieldCheck size={22} />
                  <div>
                    <strong>Human Judgment Required</strong>
                    <p>The system prepares context, options, and risk. The human decides whether to respond, wait, or deepen understanding first.</p>
                  </div>
                </div>
                <div className="approval-card">
                  <CheckCircle2 size={22} />
                  <strong>Human gate</strong>
                  <p>{selectedFreshSignal ? `Review this ${selectedFreshSignal.risk.toLowerCase()}-risk signal, the exact draft, and the source context before any public action.` : "Review the exact post, draft, channel, and relationship risk before any public action."}</p>
                </div>
                <div className="approval-card">
                  <ArrowUpRight size={22} />
                  <strong>Prepared action</strong>
                  <p>Codex can help carry out the approved browser action and log the receipt once platform access is available.</p>
                </div>
                {selectedFreshSignal?.follow_up_sequence?.length ? (
                  <div className="approval-card wide">
                    <Clock3 size={22} />
                    <strong>Recommended sequence</strong>
                    <ol>
                      {selectedFreshSignal.follow_up_sequence.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}

        {selected && (
          <aside className="panel action-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Channels</p>
                <h2>Engagement Surface</h2>
              </div>
              <span className="channel-count">{channelCount(selected)}</span>
            </div>

            <div className="channels">
              {platformFields.map(([label, key]) => {
                const value = selected[key];
                const throttleKey = throttledChannels[key];
                const policy = throttleKey ? channelPolicies[throttleKey] : null;
                const meta = policy ? `${policy.daily_open_count} today` : "";
                return value ? (
                  throttleKey ? (
                    <button key={key} className={`channel-link ${policy && !policy.allowed ? "cooling" : ""}`} onClick={() => openChannelRoute(selected, label, key, value)}>
                      <PropertyIcon name={label} />
                      <span>{label}</span>
                      {meta && <em>{meta}</em>}
                    </button>
                  ) : (
                    <a key={key} href={value} target="_blank" rel="noreferrer">
                      <PropertyIcon name={label} />
                      <span>{label}</span>
                    </a>
                  )
                ) : (
                  <span key={key} className="disabled-channel">
                    <PropertyIcon name={label} />
                    <span>{label}</span>
                  </span>
                );
              })}
            </div>

            <div className="throttle-panel">
              <p className="eyebrow">Property Log</p>
              <div>
                <strong>X</strong>
                <span>{channelPolicies.x ? `${channelPolicies.x.daily_open_count} opens logged today` : "policy ready"}</span>
              </div>
              <div>
                <strong>LinkedIn</strong>
                <span>{channelPolicies.linkedin ? `${channelPolicies.linkedin.daily_open_count} opens logged today` : "policy ready"}</span>
              </div>
              {channelNotice && <em>{channelNotice}</em>}
            </div>

            <div className="followup">
              <p className="eyebrow">Follow-Up Sequence</p>
              <ol>
                {(selectedFreshSignal?.follow_up_sequence?.length ? selectedFreshSignal.follow_up_sequence : followUpFor(selected)).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
          </aside>
        )}
      </section>
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  Globe2,
  Linkedin,
  Mail,
  MessageSquare,
  Mic2,
  RadioTower,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  ThumbsUp,
  UserRound,
  X
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
  errors: Array<{ target_name: string; errors: string[] }>;
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
  ["Website", "website", Globe2],
  ["Contact", "contact_url", Mail],
  ["LinkedIn", "linkedin_url", Linkedin],
  ["X", "x_url", X],
  ["Newsletter", "newsletter_url", MessageSquare],
  ["Substack", "substack_url", MessageSquare],
  ["YouTube", "youtube_url", RadioTower],
  ["Podcast", "podcast_url", Mic2]
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

export function App() {
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
  const [mode, setMode] = useState<"Recon" | "Draft" | "Approve">("Recon");

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
      const response = await fetch("/api/recon/fetch?limit=32");
      if (!response.ok) throw new Error(`Recon API returned ${response.status}`);
      const data = (await response.json()) as ReconResponse;
      setFreshRecon(data);
      setSelectedFreshSignalId(data.signals[0]?.id ?? "");
      const firstHit = data.signals.find((signal) => relationships.some((row) => row.name === signal.target_name));
      if (firstHit) setSelectedName(firstHit.target_name);
      setMode("Recon");
    } catch (error) {
      setReconError(error instanceof Error ? error.message : "Recon fetch failed");
    } finally {
      setIsFetchingRecon(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Greco Continuity OS</p>
          <h1>Recon-to-Response Pipeline</h1>
        </div>
        <div className="status-strip" aria-label="Pipeline status">
          <span><UserRound size={16} /> {relationships.length || "..."} records</span>
          <span><ShieldCheck size={16} /> Human gated</span>
          <span><Sparkles size={16} /> Codex executed</span>
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
          <strong>{relationships.filter((row) => row.x_url).length}</strong>
          <span>X routes</span>
        </div>
        <div>
          <strong>{relationships.filter((row) => row.linkedin_url).length}</strong>
          <span>LinkedIn routes</span>
        </div>
      </section>

      <section className="recon-toolbar" aria-label="Reliable source fetch">
        <div>
          <p className="eyebrow">Morning Recon</p>
          <strong>{freshRecon ? `${freshRecon.signal_count} fresh signals from ${freshRecon.target_count} targets` : "Fetch reliable public sources when your machine is running"}</strong>
          <span>
            {freshRecon
              ? `Last fetch: ${new Date(freshRecon.fetched_at).toLocaleString()}`
              : "RSS, Substack, blogs, podcasts, and public websites first. Pacing: 4 requests/min by default."}
          </span>
          {reconError && <em>{reconError}</em>}
        </div>
        <button onClick={fetchReliableSources} disabled={isFetchingRecon}>
          <RadioTower size={17} />
          {isFetchingRecon ? "Fetching..." : "Fetch Reliable Sources"}
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
                <p className="eyebrow">Fresh Signal Queue</p>
                {topFreshSignals.map((signal) => (
                  <div key={signal.id} className={`queue-item ${selectedFreshSignalId === signal.id ? "selected" : ""}`}>
                    <button
                      className="queue-row"
                      onClick={() => {
                        setSelectedName(signal.target_name);
                        setSelectedFreshSignalId(signal.id);
                        setMode("Recon");
                      }}
                    >
                      <span>
                        <strong>{signal.target_name}</strong>
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

            <div className="mode-tabs" role="group" aria-label="Workflow mode">
              {(["Recon", "Draft", "Approve"] as const).map((item) => (
                <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>
                  {item}
                </button>
              ))}
            </div>

            {mode === "Recon" && selectedFreshSignal && (
              <div className="intelligence-stack">
                <div className="intel-card primary">
                  <span className="signal-top">
                    <strong>{selectedFreshSignal.platform} · {selectedFreshSignal.recommended_action}</strong>
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
                    <ExternalLink size={15} />
                    Open source signal
                  </a>
                </div>

                {relevantFreshSignals.length > 1 && (
                  <div className="signals compact">
                    {relevantFreshSignals.map((signal) => (
                      <div key={signal.id} className={`signal-item ${selectedFreshSignal?.id === signal.id ? "selected" : ""}`}>
                        <button className="signal" onClick={() => setSelectedFreshSignalId(signal.id)}>
                          <span className="signal-top">
                            <strong>{signal.recommended_action}</strong>
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

            {mode === "Recon" && freshRecon && !selectedFreshSignal && (
              <div className="empty-state">
                <strong>No fresh reliable-source signal for this target yet.</strong>
                <span>Use the execution buttons for manual recon, or fetch again after more sources are added.</span>
              </div>
            )}

            {mode === "Recon" && !freshRecon && !selectedFreshSignal && (
              <div className="signals">
                {signalLibrary.map((signal) => (
                  <button
                    key={signal.id}
                    className={`signal ${selectedSignalId === signal.id ? "selected" : ""}`}
                    onClick={() => setSelectedSignalId(signal.id)}
                  >
                    <span className="signal-top">
                      <strong>{signal.platform}</strong>
                      <em>{signal.relevance}%</em>
                    </span>
                    <span>{signal.title}</span>
                    <small>{signal.angle}</small>
                  </button>
                ))}
              </div>
            )}

            {mode === "Draft" && (
              <div className="draft-box">
                <div className="draft-meta">
                  <span>
                    <ThumbsUp size={14} />
                    Proposed action: {selectedFreshSignal?.recommended_action || selectedSignal.action}
                  </span>
                  <span>Risk: {selectedFreshSignal?.risk || selectedSignal.risk}</span>
                </div>
                <textarea
                  value={selectedFreshSignal ? draftForFreshSignal(selected, selectedFreshSignal) : draftFor(selected, selectedSignal)}
                  readOnly
                  aria-label="Draft response"
                />
                {selectedFreshSignal?.owned_post_seed && (
                  <div className="owned-post-seed">
                    <span className="label"><Sparkles size={14} /> Owned post seed</span>
                    <p>{selectedFreshSignal.owned_post_seed}</p>
                  </div>
                )}
                {selectedFreshSignal && (
                  <a className="source-link" href={selectedFreshSignal.url} target="_blank" rel="noreferrer">
                    <ExternalLink size={15} />
                    Open source signal
                  </a>
                )}
              </div>
            )}

            {mode === "Approve" && (
              <div className="approval-grid">
                <div className="approval-card">
                  <CheckCircle2 size={22} />
                  <strong>Human gate</strong>
                  <p>{selectedFreshSignal ? `Review this ${selectedFreshSignal.risk.toLowerCase()}-risk signal, the exact draft, and the source context before any public action.` : "Review the exact post, draft, channel, and relationship risk before any public action."}</p>
                </div>
                <div className="approval-card">
                  <ArrowUpRight size={22} />
                  <strong>Execution</strong>
                  <p>Codex can execute the approved browser action and log the receipt once platform access is available.</p>
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
                <h2>Execution Surface</h2>
              </div>
              <span className="channel-count">{channelCount(selected)}</span>
            </div>

            <div className="channels">
              {platformFields.map(([label, key, Icon]) => {
                const value = selected[key];
                const throttleKey = throttledChannels[key];
                const policy = throttleKey ? channelPolicies[throttleKey] : null;
                const meta = policy ? `${policy.daily_open_count} today` : "";
                return value ? (
                  throttleKey ? (
                    <button key={key} className={`channel-link ${policy && !policy.allowed ? "cooling" : ""}`} onClick={() => openChannelRoute(selected, label, key, value)}>
                      <Icon size={16} />
                      <span>{label}</span>
                      {meta && <em>{meta}</em>}
                    </button>
                  ) : (
                    <a key={key} href={value} target="_blank" rel="noreferrer">
                      <Icon size={16} />
                      <span>{label}</span>
                    </a>
                  )
                ) : (
                  <span key={key} className="disabled-channel">
                    <Icon size={16} />
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

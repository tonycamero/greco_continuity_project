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

export function App() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState("Tier 1");
  const [selectedName, setSelectedName] = useState("");
  const [selectedSignalId, setSelectedSignalId] = useState(signalLibrary[0].id);
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
  const topMoves = filtered.slice(0, 5);

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

            {mode === "Recon" && (
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
                  <span><ThumbsUp size={14} /> Proposed action: {selectedSignal.action}</span>
                  <span>Risk: {selectedSignal.risk}</span>
                </div>
                <textarea value={draftFor(selected, selectedSignal)} readOnly aria-label="Draft response" />
              </div>
            )}

            {mode === "Approve" && (
              <div className="approval-grid">
                <div className="approval-card">
                  <CheckCircle2 size={22} />
                  <strong>Human gate</strong>
                  <p>Review the exact post, draft, channel, and relationship risk before any public action.</p>
                </div>
                <div className="approval-card">
                  <ArrowUpRight size={22} />
                  <strong>Execution</strong>
                  <p>Codex can execute the approved browser action and log the receipt once platform access is available.</p>
                </div>
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
                return value ? (
                  <a key={key} href={value} target="_blank" rel="noreferrer">
                    <Icon size={16} />
                    <span>{label}</span>
                  </a>
                ) : (
                  <span key={key} className="disabled-channel">
                    <Icon size={16} />
                    <span>{label}</span>
                  </span>
                );
              })}
            </div>

            <div className="followup">
              <p className="eyebrow">Follow-Up Sequence</p>
              <ol>
                {followUpFor(selected).map((item) => (
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

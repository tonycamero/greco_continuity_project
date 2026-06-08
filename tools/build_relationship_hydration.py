#!/usr/bin/env python3
"""
Build an app-ready relationship import file from the current Greco lists.

The output is intentionally conservative: only public/professional routes are
included, with confidence notes and source URLs so Tier 1 outreach remains
judgment-led and human-approved.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "greco_relationships_hydrated.csv"


FIELDS = [
    "rank",
    "name",
    "record_type",
    "ecosystem_segment",
    "priority_tier",
    "relationship_stage",
    "strategic_fit",
    "current_hook",
    "likely_ask",
    "best_first_channel",
    "warm_path_needed",
    "first_move",
    "risk_note",
    "website",
    "contact_url",
    "public_email",
    "linkedin_url",
    "x_url",
    "bluesky_url",
    "mastodon_url",
    "instagram_url",
    "threads_url",
    "tiktok_url",
    "youtube_url",
    "podcast_url",
    "newsletter_url",
    "substack_url",
    "github_url",
    "discord_or_community_url",
    "event_url",
    "booking_or_speaker_url",
    "source_urls",
    "data_confidence",
    "verification_status",
    "notes",
]


def clean(value: str | None) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def parse_top_100() -> list[dict[str, str]]:
    text = (ROOT / "100_highest_leverage_relationships.md").read_text(encoding="utf-8")
    rows: list[dict[str, str]] = []
    in_table = False
    for line in text.splitlines():
        if line.startswith("| Rank | Relationship |"):
            in_table = True
            continue
        if in_table and line.startswith("## Highest Priority"):
            break
        if not in_table or not line.startswith("|"):
            continue
        if set(line.replace("|", "").replace("-", "").replace(":", "").strip()) == set():
            continue
        cells = [clean(c) for c in line.strip("|").split("|")]
        if len(cells) != 5 or not cells[0].isdigit():
            continue
        rows.append(
            {
                "rank": cells[0],
                "name": cells[1],
                "record_type": cells[2],
                "strategic_fit": cells[3],
                "likely_ask": cells[4],
            }
        )
    return rows


def read_relationship_dashboard() -> dict[str, dict[str, str]]:
    path = ROOT / "greco_relationship_dashboard.csv"
    out: dict[str, dict[str, str]] = {}
    if not path.exists():
        return out
    with path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            name = clean(row.get("Name"))
            if not name:
                continue
            out[name] = {
                "ecosystem_segment": clean(row.get("Category")),
                "priority_tier": clean(row.get("Priority Tier")),
                "relationship_stage": clean(row.get("Relationship Stage")),
                "strategic_fit": clean(row.get("Strategic Fit")),
                "current_hook": clean(row.get("Current Hook")),
                "first_move": clean(row.get("Next Best Action")),
                "risk_note": clean(row.get("Risk")),
                "likely_ask": clean(row.get("Suggested Ask")),
                "notes": clean(row.get("Notes")),
            }
    return out


def read_ecosystem_contacts() -> dict[str, dict[str, str]]:
    path = ROOT / "greco_ecosystem_contacts.csv"
    out: dict[str, dict[str, str]] = {}
    if not path.exists():
        return out
    with path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            name = clean(row.get("Name"))
            if not name:
                continue
            out[name] = {
                "ecosystem_segment": clean(row.get("Ecosystem Segment")),
                "strategic_fit": clean(row.get("Role/Relevance")),
                "website": clean(row.get("Website")),
                "contact_url": clean(row.get("Email/Contact URL")),
                "linkedin_url": clean(row.get("LinkedIn")),
                "x_url": clean(row.get("X/Twitter")),
                "youtube_url": clean(row.get("YouTube/Podcast")),
                "newsletter_url": clean(row.get("Newsletter/Substack")),
                "source_urls": clean(row.get("Source URLs")),
                "notes": clean(row.get("Notes")),
            }
    return out


MANUAL: dict[str, dict[str, str]] = {
    "Kyla Scanlon": {
        "ecosystem_segment": "Cultural Translators / Gen Z economics",
        "website": "https://www.kylascanlon.com/",
        "contact_url": "https://www.kylascanlon.com/",
        "linkedin_url": "https://www.linkedin.com/in/kyla-scanlon/",
        "x_url": "https://x.com/kylascan",
        "instagram_url": "https://www.instagram.com/kylascan/",
        "tiktok_url": "https://www.tiktok.com/@kylascan",
        "youtube_url": "https://www.youtube.com/@KylaScanlon",
        "newsletter_url": "https://kylascanlon.com/",
        "source_urls": "https://www.kylascanlon.com/ | https://linktr.ee/kylascan222",
        "best_first_channel": "Website/newsletter route or warm intro; social only after a polished essay hook exists",
        "first_move": "Prepare a 1-page financial-nihilism-to-trust-mediated-exchange brief",
        "risk_note": "Do not pitch monetary reform; pitch a younger-language trust and coordination frame",
        "data_confidence": "High for official website; social handles should be verified immediately before use",
    },
    "Hank Green / Complexly": {
        "ecosystem_segment": "Universe Tier / Mass education",
        "website": "https://complexly.org/",
        "contact_url": "https://complexly.org/contact",
        "linkedin_url": "https://www.linkedin.com/company/complexly/",
        "x_url": "https://x.com/hankgreen",
        "instagram_url": "https://www.instagram.com/hankgreen/",
        "tiktok_url": "https://www.tiktok.com/@hankgreen1",
        "youtube_url": "https://www.youtube.com/@vlogbrothers",
        "newsletter_url": "https://complexly.org/",
        "source_urls": "https://complexly.org/ | https://hankgreen.com/ | https://www.linkedin.com/company/complexly",
        "best_first_channel": "Complexly contact or warm media/education introduction",
        "first_move": "Do not pitch until a Crash Course-style explainer outline is exceptional",
        "risk_note": "Very high visibility; needs public-interest education framing, not book promotion",
        "data_confidence": "High for organization routes; personal socials public but should be verified",
    },
    "Kevin Owocki": {
        "ecosystem_segment": "Cultural Translators / ReFi and public goods",
        "website": "https://owocki.com/",
        "contact_url": "https://owocki.com/",
        "linkedin_url": "https://www.linkedin.com/in/kevinowocki/",
        "x_url": "https://x.com/owocki",
        "youtube_url": "https://www.youtube.com/@greenpillnetwork",
        "podcast_url": "https://greenpill.network/podcast",
        "newsletter_url": "https://greenpill.network/",
        "source_urls": "https://owocki.com/ | https://greenpill.network/",
        "best_first_channel": "Greenpill/official site or warm ReFi/public-goods intro",
        "first_move": "Pitch a Greco-as-pre-crypto-public-goods-exchange-theorist conversation",
        "risk_note": "Avoid sounding anti-crypto; distinguish anti-speculation from pro-coordination",
        "data_confidence": "High",
    },
    "Greenpill Network": {
        "ecosystem_segment": "ReFi / public goods",
        "website": "https://greenpill.network/",
        "contact_url": "https://greenpill.network/",
        "x_url": "https://x.com/greenpillnet",
        "youtube_url": "https://www.youtube.com/@greenpillnetwork",
        "podcast_url": "https://greenpill.network/podcast",
        "discord_or_community_url": "https://greenpill.network/",
        "source_urls": "https://greenpill.network/",
        "best_first_channel": "Podcast/community route",
        "first_move": "Offer Chapter 21 as a dialogue on post-speculative regenerative exchange",
        "data_confidence": "Medium-high; verify current community links before use",
    },
    "Funding the Commons": {
        "ecosystem_segment": "Public goods funding",
        "website": "https://www.fundingthecommons.io/",
        "contact_url": "https://www.fundingthecommons.io/",
        "linkedin_url": "https://www.linkedin.com/company/funding-the-commons",
        "x_url": "https://x.com/FundingCommons",
        "youtube_url": "https://www.youtube.com/@FundingTheCommons",
        "event_url": "https://www.fundingthecommons.io/",
        "source_urls": "https://www.fundingthecommons.io/ | https://www.linkedin.com/company/funding-the-commons",
        "best_first_channel": "Event/program contact or warm public-goods introduction",
        "first_move": "Develop a panel/session pitch around funding, exchange, and trust-mediated contribution",
        "data_confidence": "High for site and LinkedIn; social handles should be verified",
    },
    "Gitcoin": {
        "ecosystem_segment": "Public goods funding",
        "website": "https://www.gitcoin.co/",
        "contact_url": "https://support.gitcoin.co/",
        "linkedin_url": "https://www.linkedin.com/company/gitcoin/",
        "x_url": "https://x.com/gitcoin",
        "github_url": "https://github.com/gitcoinco",
        "discord_or_community_url": "https://www.gitcoin.co/",
        "source_urls": "https://www.gitcoin.co/ | https://github.com/gitcoinco",
        "best_first_channel": "Warm path through Greenpill/public-goods network",
        "first_move": "Use Gitcoin as category proof before direct ask",
        "risk_note": "Do not cold pitch as a book audience; use a mechanism-design bridge",
        "data_confidence": "Medium-high",
    },
    "ReFi DAO": {
        "ecosystem_segment": "Regenerative finance",
        "website": "https://refidao.com/",
        "contact_url": "https://refidao.com/",
        "linkedin_url": "https://www.linkedin.com/company/refidao/",
        "x_url": "https://x.com/refidaoist",
        "discord_or_community_url": "https://refidao.com/",
        "source_urls": "https://refidao.com/about",
        "best_first_channel": "Community/session route",
        "first_move": "Pitch a ReFi reading seminar on Greco and regenerative exchange",
        "data_confidence": "Medium-high",
    },
    "Cory Doctorow / Pluralistic": {
        "ecosystem_segment": "Digital rights / anti-extraction",
        "website": "https://pluralistic.net/",
        "contact_url": "https://craphound.com/contact/",
        "x_url": "https://x.com/doctorow",
        "mastodon_url": "https://mamot.fr/@pluralistic",
        "newsletter_url": "https://pluralistic.net/plura-list/",
        "substack_url": "https://pluralistic.net/plura-list/",
        "source_urls": "https://pluralistic.net/ | https://craphound.com/contact/",
        "best_first_channel": "Pluralistic-compatible essay/link route; warm intro preferred",
        "first_move": "Write the essay first: 'Money systems enshittify too'",
        "risk_note": "High bar for relevance and rigor; send only if the essay earns the ask",
        "data_confidence": "Medium-high",
    },
    "Molly White": {
        "ecosystem_segment": "Crypto skepticism / trust",
        "website": "https://www.mollywhite.net/",
        "contact_url": "https://www.mollywhite.net/contact/",
        "public_email": "molly@mollywhite.net",
        "linkedin_url": "https://www.linkedin.com/in/mollyawhite/",
        "x_url": "https://x.com/molly0xfff",
        "bluesky_url": "https://bsky.app/profile/molly.wiki",
        "mastodon_url": "https://hachyderm.io/@molly0xfff",
        "instagram_url": "https://www.instagram.com/molly0xfff/",
        "threads_url": "https://www.threads.net/@molly0xfff",
        "tiktok_url": "https://www.tiktok.com/@molly0xfff",
        "youtube_url": "https://www.youtube.com/@molly0xfff",
        "newsletter_url": "https://www.citationneeded.news/",
        "source_urls": "https://www.mollywhite.net/contact/ | https://www.mollywhite.net/social/",
        "best_first_channel": "Email only with critique-oriented ask; ask for falsification, not endorsement",
        "first_move": "Prepare 'after crypto, what still needs solving?' brief",
        "risk_note": "Avoid any blockchain-coded language unless distinguishing from speculation/scams",
        "data_confidence": "High",
    },
    "Paris Marx / Tech Won't Save Us": {
        "ecosystem_segment": "Tech critique / platform politics",
        "website": "https://www.techwontsave.us/",
        "contact_url": "https://www.techwontsave.us/",
        "x_url": "https://x.com/parismarx",
        "podcast_url": "https://www.techwontsave.us/",
        "newsletter_url": "https://www.techwontsave.us/",
        "source_urls": "https://www.techwontsave.us/ | https://www.patreon.com/techwontsaveus/about",
        "best_first_channel": "Podcast pitch through show route",
        "first_move": "Frame as governance before tech: exchange systems are not saved by software alone",
        "risk_note": "Needs anti-solutionist framing, not techno-optimist category language",
        "data_confidence": "Medium",
    },
    "Nathan Schneider": {
        "ecosystem_segment": "Platform cooperativism / governable spaces",
        "website": "https://nathanschneider.info/",
        "contact_url": "https://nathanschneider.info/contact/",
        "public_email": "n@nathanschneider.info",
        "linkedin_url": "https://www.linkedin.com/in/ntnsndr/",
        "x_url": "https://x.com/ntnsndr",
        "bluesky_url": "https://bsky.app/profile/ntnsndr.bsky.social",
        "mastodon_url": "https://social.coop/@ntnsndr",
        "instagram_url": "https://www.instagram.com/ntnsndr/",
        "newsletter_url": "https://nathanschneider.info/contact/",
        "source_urls": "https://nathanschneider.info/contact/",
        "best_first_channel": "Email with precise conceptual overlap",
        "first_move": "Ask for critique of Credit Commons as governable exchange space",
        "risk_note": "Respect academic precision; avoid flattening into a simple influencer pitch",
        "data_confidence": "High",
    },
    "Platform Cooperativism Consortium": {
        "ecosystem_segment": "Platform cooperativism",
        "website": "https://platform.coop/",
        "contact_url": "https://platform.coop/contact/",
        "linkedin_url": "https://www.linkedin.com/company/platform-cooperativism-consortium/",
        "x_url": "https://x.com/platformcoop",
        "newsletter_url": "https://platform.coop/",
        "source_urls": "https://platform.coop/about/pcc/",
        "best_first_channel": "Institutional contact or webinar proposal",
        "first_move": "Pitch exchange architecture for cooperative platforms",
        "data_confidence": "High",
    },
    "Trebor Scholz": {
        "ecosystem_segment": "Platform cooperativism",
        "website": "https://platform.coop/",
        "contact_url": "https://platform.coop/contact/",
        "linkedin_url": "https://www.linkedin.com/in/treborscholz/",
        "x_url": "https://x.com/trebors",
        "source_urls": "https://platform.coop/about/pcc/",
        "best_first_channel": "Through PCC or academic/institutional route",
        "first_move": "Ask for platform-coop relevance check",
        "data_confidence": "Medium",
    },
    "Li Jin": {
        "ecosystem_segment": "Creator economy / category creation",
        "website": "https://atelier.ventures/",
        "contact_url": "https://atelier.ventures/",
        "linkedin_url": "https://www.linkedin.com/in/lijin18/",
        "x_url": "https://x.com/ljin18",
        "newsletter_url": "https://li.substack.com/",
        "substack_url": "https://li.substack.com/",
        "source_urls": "https://linktr.ee/LIJIN | https://atelier.ventures/",
        "best_first_channel": "Newsletter/category note or warm creator-economy intro",
        "first_move": "Send category memo: creator economy's missing exchange layer",
        "data_confidence": "Medium",
    },
    "Jay Clouse / Creator Science": {
        "ecosystem_segment": "Creator operators",
        "website": "https://creatorscience.com/",
        "contact_url": "https://creatorscience.com/contact/",
        "linkedin_url": "https://www.linkedin.com/in/jayclouse/",
        "x_url": "https://x.com/jayclouse",
        "instagram_url": "https://www.instagram.com/jayclouse/",
        "youtube_url": "https://www.youtube.com/@CreatorScienceYT",
        "podcast_url": "https://creatorscience.com/podcast",
        "newsletter_url": "https://creatorscience.kit.com/",
        "source_urls": "https://creatorscience.kit.com/ | https://www.linkedin.com/in/jayclouse",
        "best_first_channel": "Creator Science contact/newsletter route",
        "first_move": "Pitch 'community businesses need trust-mediated exchange' as a creator operator idea",
        "data_confidence": "High",
    },
    "Colin and Samir": {
        "ecosystem_segment": "Creator economy mainstream",
        "website": "https://www.colinandsamir.com/",
        "contact_url": "https://www.colinandsamir.com/contact",
        "linkedin_url": "https://www.linkedin.com/company/colin-and-samir",
        "x_url": "https://x.com/ColinandSamir",
        "instagram_url": "https://www.instagram.com/colinandsamir/",
        "youtube_url": "https://www.youtube.com/@ColinandSamir",
        "newsletter_url": "https://www.colinandsamir.com/",
        "source_urls": "https://www.colinandsamir.com/ | https://www.linkedin.com/company/colin-and-samir",
        "best_first_channel": "Creator-economy show/newsletter route after a creator-specific hook is polished",
        "first_move": "Pitch audience ownership -> value-flow ownership",
        "data_confidence": "Medium-high",
    },
    "Greg Isenberg": {
        "ecosystem_segment": "Community businesses / AI startups",
        "website": "https://www.gregisenberg.com/",
        "contact_url": "https://www.gregisenberg.com/",
        "linkedin_url": "https://www.linkedin.com/in/gisenberg/",
        "x_url": "https://x.com/gregisenberg",
        "instagram_url": "https://www.instagram.com/gregisenberg/",
        "youtube_url": "https://www.youtube.com/@gregisenberg",
        "newsletter_url": "https://www.gregisenberg.com/",
        "source_urls": "https://www.getfused.io/creators/greg-isenberg | https://www.gregisenberg.com/",
        "best_first_channel": "Short builder memo or social response to community-business thread",
        "first_move": "Test the meme 'community without exchange is fragile'",
        "data_confidence": "Medium",
    },
    "Vitalik Buterin": {
        "ecosystem_segment": "Public goods / mechanism design",
        "website": "https://vitalik.eth.limo/",
        "contact_url": "https://vitalik.eth.limo/",
        "x_url": "https://x.com/VitalikButerin",
        "github_url": "https://github.com/vbuterin",
        "source_urls": "https://vitalik.eth.limo/",
        "best_first_channel": "Warm path only through public-goods/mechanism-design network",
        "warm_path_needed": "Yes",
        "first_move": "Do not cold pitch; build credibility through Greenpill/Funding the Commons first",
        "risk_note": "Extremely high-noise target; only route a precise conceptual note through trusted intermediary",
        "data_confidence": "Medium-high",
    },
    "Bankless": {
        "ecosystem_segment": "Crypto media / Ethereum",
        "website": "https://www.bankless.com/",
        "contact_url": "https://www.bankless.com/contact",
        "x_url": "https://x.com/BanklessHQ",
        "youtube_url": "https://www.youtube.com/@Bankless",
        "podcast_url": "https://www.bankless.com/podcast",
        "newsletter_url": "https://www.bankless.com/",
        "source_urls": "https://www.bankless.com/",
        "best_first_channel": "Warm public-goods route or guest pitch after ReFi validation",
        "risk_note": "No speculation frame; use public goods and reciprocal credit",
        "data_confidence": "Medium",
    },
    "Ethereum Foundation public goods orbit": {
        "ecosystem_segment": "Public goods / Ethereum",
        "website": "https://ethereum.foundation/",
        "contact_url": "https://ethereum.foundation/contact",
        "x_url": "https://x.com/ethereumfndn",
        "github_url": "https://github.com/ethereum",
        "source_urls": "https://ethereum.foundation/",
        "best_first_channel": "Warm route via Gitcoin/Funding the Commons/Owocki",
        "warm_path_needed": "Yes",
        "data_confidence": "Medium",
    },
    "Glen Weyl / Plurality Institute": {
        "ecosystem_segment": "Plurality / coordination",
        "website": "https://www.plurality.institute/",
        "contact_url": "https://www.plurality.institute/",
        "x_url": "https://x.com/glenweyl",
        "source_urls": "https://www.plurality.institute/",
        "best_first_channel": "Concept note via Plurality/coordination network",
        "first_move": "Connect trust-mediated exchange to plurality and public goods",
        "data_confidence": "Medium",
    },
    "Primavera De Filippi": {
        "ecosystem_segment": "Blockchain governance / commons",
        "website": "https://primaveradefilippi.net/",
        "contact_url": "https://primaveradefilippi.net/",
        "linkedin_url": "https://www.linkedin.com/in/primaveradefilippi/",
        "x_url": "https://x.com/yaoeo",
        "source_urls": "https://primaveradefilippi.net/",
        "best_first_channel": "Academic/commons route",
        "data_confidence": "Medium",
    },
    "Audrey Tang": {
        "ecosystem_segment": "Digital democracy / civic trust",
        "website": "https://audrey.tang.social/",
        "contact_url": "https://audrey.tang.social/",
        "x_url": "https://x.com/audreyt",
        "github_url": "https://github.com/audreyt",
        "source_urls": "https://audrey.tang.social/",
        "best_first_channel": "Warm civic-tech route only",
        "warm_path_needed": "Yes",
        "data_confidence": "Medium",
    },
    "Project Liberty": {
        "ecosystem_segment": "Digital identity / social web",
        "website": "https://www.projectliberty.io/",
        "contact_url": "https://www.projectliberty.io/contact",
        "linkedin_url": "https://www.linkedin.com/company/projectliberty/",
        "x_url": "https://x.com/projliberty",
        "source_urls": "https://www.projectliberty.io/about/",
        "best_first_channel": "Institutional contact or event route",
        "data_confidence": "High",
    },
    "Decentralized Identity Foundation": {
        "ecosystem_segment": "Digital identity standards",
        "website": "https://identity.foundation/",
        "contact_url": "https://identity.foundation/join/",
        "linkedin_url": "https://www.linkedin.com/company/decentralized-identity-foundation/",
        "x_url": "https://x.com/DecentralizedID",
        "github_url": "https://github.com/decentralized-identity",
        "source_urls": "https://identity.foundation/join/",
        "best_first_channel": "Working-group/join route; likely source of warm-path mapping",
        "data_confidence": "Medium-high",
    },
    "Content Authenticity Initiative": {
        "ecosystem_segment": "Content provenance / trust",
        "website": "https://contentauthenticity.org/",
        "contact_url": "https://contentauthenticity.org/contact",
        "linkedin_url": "https://www.linkedin.com/company/content-authenticity-initiative/",
        "x_url": "https://x.com/contentauth",
        "source_urls": "https://contentauthenticity.org/our-members",
        "best_first_channel": "Institutional/provenance essay route",
        "data_confidence": "Medium-high",
    },
    "Ink & Switch": {
        "ecosystem_segment": "Local-first software",
        "website": "https://www.inkandswitch.com/",
        "contact_url": "https://www.inkandswitch.com/contact/",
        "x_url": "https://x.com/inkandswitch",
        "github_url": "https://github.com/inkandswitch",
        "newsletter_url": "https://www.inkandswitch.com/",
        "source_urls": "https://www.inkandswitch.com/essay/local-first/",
        "best_first_channel": "Research-note route",
        "first_move": "Frame local-first exchange as the economic counterpart to local-first data",
        "data_confidence": "High",
    },
    "Martin Kleppmann": {
        "ecosystem_segment": "Local-first / distributed systems",
        "website": "https://martin.kleppmann.com/",
        "contact_url": "https://martin.kleppmann.com/",
        "x_url": "https://x.com/martinkl",
        "github_url": "https://github.com/ept",
        "source_urls": "https://martin.kleppmann.com/",
        "best_first_channel": "Technical-review route only after local-first exchange note is precise",
        "data_confidence": "Medium",
    },
    "Local-First Conf": {
        "ecosystem_segment": "Local-first event",
        "website": "https://www.localfirstconf.com/",
        "contact_url": "https://www.localfirstconf.com/",
        "event_url": "https://www.localfirstconf.com/",
        "source_urls": "https://www.localfirstconf.com/local-first-conf-2025",
        "best_first_channel": "Talk proposal/session route",
        "data_confidence": "High",
    },
    "Maggie Appleton": {
        "ecosystem_segment": "Visual systems / local-first / AI",
        "website": "https://maggieappleton.com/",
        "contact_url": "https://maggieappleton.com/",
        "x_url": "https://x.com/Mappletons",
        "github_url": "https://github.com/MaggieAppleton",
        "newsletter_url": "https://maggieappleton.com/",
        "source_urls": "https://maggieappleton.com/",
        "best_first_channel": "Visual essay collaboration only after framework has visual map",
        "data_confidence": "Medium",
    },
    "DXOS": {
        "ecosystem_segment": "Local-first software",
        "website": "https://www.dxos.org/",
        "contact_url": "https://www.dxos.org/",
        "github_url": "https://github.com/dxos",
        "x_url": "https://x.com/dxos_org",
        "source_urls": "https://www.dxos.org/",
        "best_first_channel": "Builder dialogue",
        "data_confidence": "Medium",
    },
    "Radicle": {
        "ecosystem_segment": "Sovereign developer collaboration",
        "website": "https://radicle.xyz/",
        "contact_url": "https://radicle.xyz/",
        "github_url": "https://github.com/radicle-dev",
        "x_url": "https://x.com/radicle",
        "source_urls": "https://radicle.xyz/",
        "best_first_channel": "Open-source sovereignty essay route",
        "data_confidence": "Medium",
    },
    "Open Source Pledge": {
        "ecosystem_segment": "Open-source funding",
        "website": "https://opensourcepledge.com/",
        "contact_url": "https://opensourcepledge.com/",
        "linkedin_url": "https://www.linkedin.com/company/open-source-pledge/",
        "x_url": "https://x.com/osspledge",
        "github_url": "https://github.com/opensourcepledge",
        "source_urls": "https://opensourcepledge.com/",
        "best_first_channel": "Maintainer-funding essay route",
        "data_confidence": "High",
    },
    "Sentry / Open Source Pledge founders": {
        "ecosystem_segment": "Open-source funding",
        "website": "https://sentry.io/",
        "contact_url": "https://sentry.io/contact/",
        "linkedin_url": "https://www.linkedin.com/company/sentry/",
        "x_url": "https://x.com/getsentry",
        "github_url": "https://github.com/getsentry",
        "source_urls": "https://opensourcepledge.com/ | https://sentry.io/",
        "best_first_channel": "Through Open Source Pledge, not generic Sentry contact",
        "data_confidence": "Medium",
    },
    "GitHub open source programs": {
        "ecosystem_segment": "Open-source platform",
        "website": "https://github.com/open-source",
        "contact_url": "https://support.github.com/",
        "linkedin_url": "https://www.linkedin.com/company/github/",
        "x_url": "https://x.com/github",
        "github_url": "https://github.com/github",
        "source_urls": "https://github.com/open-source",
        "best_first_channel": "Use as distribution/context source; direct outreach later",
        "data_confidence": "High",
    },
    "Tidelift": {
        "ecosystem_segment": "Open-source sustainability",
        "website": "https://tidelift.com/",
        "contact_url": "https://tidelift.com/contact",
        "linkedin_url": "https://www.linkedin.com/company/tidelift/",
        "x_url": "https://x.com/tidelift",
        "source_urls": "https://tidelift.com/",
        "best_first_channel": "Maintainer economy / obligation framing",
        "data_confidence": "High",
    },
    "Sovereign Tech Agency": {
        "ecosystem_segment": "Public digital infrastructure",
        "website": "https://www.sovereign.tech/",
        "contact_url": "https://www.sovereign.tech/contact",
        "linkedin_url": "https://www.linkedin.com/company/sovereigntechagency/",
        "x_url": "https://x.com/sovtechfund",
        "source_urls": "https://www.sovereign.tech/",
        "best_first_channel": "Policy/public digital infrastructure route",
        "data_confidence": "Medium-high",
    },
    "NLnet Foundation": {
        "ecosystem_segment": "Open internet funding",
        "website": "https://nlnet.nl/",
        "contact_url": "https://nlnet.nl/contact/",
        "x_url": "https://x.com/NLnetFDN",
        "source_urls": "https://nlnet.nl/",
        "best_first_channel": "Open-internet funding essay/source route",
        "data_confidence": "High",
    },
    "Open Source Initiative": {
        "ecosystem_segment": "Open-source advocacy",
        "website": "https://opensource.org/",
        "contact_url": "https://opensource.org/contact",
        "linkedin_url": "https://www.linkedin.com/company/open-source-initiative/",
        "x_url": "https://x.com/OpenSourceOrg",
        "source_urls": "https://opensource.org/",
        "best_first_channel": "Webinar/article route",
        "data_confidence": "High",
    },
    "Our Changing Climate": {
        "ecosystem_segment": "Climate media / youth",
        "website": "https://www.ourchangingclimate.com/",
        "contact_url": "https://www.ourchangingclimate.com/contact",
        "instagram_url": "https://www.instagram.com/ourchangingclimate/",
        "youtube_url": "https://www.youtube.com/@OurChangingClimate",
        "source_urls": "https://www.ourchangingclimate.com/",
        "best_first_channel": "Video essay route after climate-resilience exchange pitch is tight",
        "data_confidence": "Medium",
    },
    "Not Just Bikes": {
        "ecosystem_segment": "Urbanism / local systems",
        "website": "https://www.notjustbikes.com/",
        "contact_url": "https://www.notjustbikes.com/contact",
        "youtube_url": "https://www.youtube.com/@NotJustBikes",
        "x_url": "https://x.com/notjustbikes",
        "source_urls": "https://www.notjustbikes.com/",
        "best_first_channel": "Do not first wave; develop local-infrastructure analogy",
        "data_confidence": "Medium",
    },
    "Strong Towns": {
        "ecosystem_segment": "Local resilience / municipal finance",
        "website": "https://www.strongtowns.org/",
        "contact_url": "https://www.strongtowns.org/contact",
        "linkedin_url": "https://www.linkedin.com/company/strong-towns/",
        "x_url": "https://x.com/StrongTowns",
        "podcast_url": "https://www.strongtowns.org/podcast",
        "newsletter_url": "https://www.strongtowns.org/",
        "source_urls": "https://www.strongtowns.org/",
        "best_first_channel": "Article/podcast pitch",
        "data_confidence": "High",
    },
    "Shareable": {
        "ecosystem_segment": "Solidarity economy / sharing",
        "website": "https://www.shareable.net/",
        "contact_url": "https://www.shareable.net/contact/",
        "linkedin_url": "https://www.linkedin.com/company/shareable/",
        "x_url": "https://x.com/shareable",
        "newsletter_url": "https://www.shareable.net/participate/",
        "source_urls": "https://www.shareable.net/participate/",
        "best_first_channel": "Excerpt/article route",
        "data_confidence": "High",
    },
    "Institute for Local Self-Reliance": {
        "ecosystem_segment": "Localism / cooperative economics",
        "website": "https://ilsr.org/",
        "contact_url": "https://ilsr.org/contact/",
        "linkedin_url": "https://www.linkedin.com/company/institute-for-local-self-reliance/",
        "x_url": "https://x.com/ilsr",
        "podcast_url": "https://ilsr.org/podcasts/",
        "newsletter_url": "https://ilsr.org/",
        "source_urls": "https://ilsr.org/",
        "best_first_channel": "Podcast/newsletter route",
        "data_confidence": "High",
    },
    "Post Carbon Institute": {
        "ecosystem_segment": "Post-growth / energy resilience",
        "website": "https://www.postcarbon.org/",
        "contact_url": "https://www.postcarbon.org/contact/",
        "linkedin_url": "https://www.linkedin.com/company/post-carbon-institute/",
        "x_url": "https://x.com/postcarbon",
        "podcast_url": "https://www.resilience.org/podcasts/",
        "newsletter_url": "https://www.postcarbon.org/",
        "source_urls": "https://www.postcarbon.org/ | https://www.resilience.org/podcasts/",
        "best_first_channel": "Resilience essay/podcast route",
        "data_confidence": "High",
    },
    "Resilience.org": {
        "ecosystem_segment": "Post-growth / resilience media",
        "website": "https://www.resilience.org/",
        "contact_url": "https://www.resilience.org/contact/",
        "x_url": "https://x.com/resilienceorg",
        "podcast_url": "https://www.resilience.org/podcasts/",
        "newsletter_url": "https://www.resilience.org/",
        "source_urls": "https://www.resilience.org/",
        "best_first_channel": "Book excerpt or article pitch",
        "data_confidence": "High",
    },
    "Tim Morgan": {
        "ecosystem_segment": "Energy economics / post-growth",
        "website": "https://surplusenergyeconomics.wordpress.com/",
        "contact_url": "https://surplusenergyeconomics.wordpress.com/",
        "source_urls": "https://surplusenergyeconomics.wordpress.com/",
        "best_first_channel": "Blog comment/contact route if no better email exists; warm intro preferred",
        "first_move": "Prepare overlap brief on money as claim and real productive capacity",
        "risk_note": "May resist category language; lead with analytical compatibility",
        "data_confidence": "Medium",
    },
    "Schumacher Center": {
        "ecosystem_segment": "Local currencies / new economics",
        "website": "https://centerforneweconomics.org/",
        "contact_url": "https://centerforneweconomics.org/contact/",
        "linkedin_url": "https://www.linkedin.com/company/schumacher-center-for-a-new-economics/",
        "x_url": "https://x.com/center4newecon",
        "youtube_url": "https://www.youtube.com/@SchumacherCenter",
        "newsletter_url": "https://centerforneweconomics.org/share/",
        "source_urls": "https://centerforneweconomics.org/apply/local-currencies-program/",
        "best_first_channel": "Relationship-first institutional note",
        "data_confidence": "High",
    },
    "BerkShares": {
        "ecosystem_segment": "Local currencies",
        "website": "https://berkshares.org/",
        "contact_url": "https://berkshares.org/contact/",
        "source_urls": "https://berkshares.org/ | https://centerforneweconomics.org/apply/local-currencies-program/",
        "best_first_channel": "Through Schumacher/BerkShares continuity path",
        "data_confidence": "Medium-high",
    },
    "Credit Commons Society": {
        "ecosystem_segment": "Mutual credit / commons",
        "website": "https://creditcommonssociety.org/",
        "contact_url": "https://creditcommonssociety.org/contact/",
        "source_urls": "https://creditcommonssociety.org/ | https://creditcommonssociety.org/mutual-credit/",
        "best_first_channel": "Technical/practitioner review request",
        "data_confidence": "High",
    },
    "Mutual Credit Services": {
        "ecosystem_segment": "Mutual credit implementation",
        "website": "https://www.mutualcredit.services/",
        "contact_url": "https://www.mutualcredit.services/about",
        "source_urls": "https://www.mutualcredit.services/",
        "best_first_channel": "Practitioner webinar/dialogue route",
        "data_confidence": "High",
    },
    "IRTA": {
        "ecosystem_segment": "Reciprocal trade / barter industry",
        "website": "https://irta.com/",
        "contact_url": "https://irta.com/contact/",
        "linkedin_url": "https://www.linkedin.com/company/international-reciprocal-trade-association/",
        "x_url": "https://x.com/irtaofficial",
        "source_urls": "https://irta.com/",
        "best_first_channel": "Industry/practitioner review",
        "data_confidence": "Medium-high",
    },
    "Grassroots Economics": {
        "ecosystem_segment": "Community currencies / CAVs",
        "website": "https://grassrootseconomics.org/",
        "contact_url": "https://grassrootseconomics.org/contact/",
        "linkedin_url": "https://www.linkedin.com/company/grassroots-economics/",
        "x_url": "https://x.com/GrassrootsEcon",
        "github_url": "https://github.com/GrassrootsEconomics",
        "source_urls": "https://grassrootseconomics.org/about/",
        "best_first_channel": "Case-study dialogue",
        "data_confidence": "High",
    },
    "Community Exchange System": {
        "ecosystem_segment": "LETS / local exchange",
        "website": "https://www.community-exchange.org/",
        "contact_url": "https://www.community-exchange.org/",
        "source_urls": "https://www.community-exchange.org/",
        "best_first_channel": "Practitioner circulation after verification",
        "data_confidence": "Medium",
    },
    "P2P Foundation": {
        "ecosystem_segment": "Commons / peer production",
        "website": "https://p2pfoundation.net/",
        "contact_url": "https://p2pfoundation.net/contact/",
        "linkedin_url": "https://www.linkedin.com/company/p2p-foundation/",
        "x_url": "https://x.com/P2P_Foundation",
        "source_urls": "https://p2pfoundation.net/home-page/the-p2p-foundations-web-ecosystem",
        "best_first_channel": "Repost/review through commons framing",
        "data_confidence": "High",
    },
    "Michel Bauwens": {
        "ecosystem_segment": "Commons / P2P",
        "website": "https://p2pfoundation.net/",
        "contact_url": "https://p2pfoundation.net/contact/",
        "x_url": "https://x.com/mbauwens",
        "source_urls": "https://p2pfoundation.net/the-p2p-foundation/who-we-are",
        "best_first_channel": "Commons-focused note or warm P2P route",
        "data_confidence": "Medium-high",
    },
    "Commons Strategies Group": {
        "ecosystem_segment": "Commons governance",
        "website": "https://commonsstrategies.org/",
        "contact_url": "https://commonsstrategies.org/contact/",
        "source_urls": "https://commonsstrategies.org/",
        "best_first_channel": "Salon/dialogue route",
        "data_confidence": "Medium",
    },
    "New Economics Foundation": {
        "ecosystem_segment": "New economics policy",
        "website": "https://neweconomics.org/",
        "contact_url": "https://neweconomics.org/contact",
        "linkedin_url": "https://www.linkedin.com/company/new-economics-foundation/",
        "x_url": "https://x.com/NEF",
        "source_urls": "https://neweconomics.org/",
        "best_first_channel": "Policy review/excerpt route",
        "data_confidence": "High",
    },
    "Ethical Markets": {
        "ecosystem_segment": "Sustainable finance / Hazel Henderson continuity",
        "website": "https://www.ethicalmarkets.com/",
        "contact_url": "https://www.ethicalmarkets.com/contact/",
        "x_url": "https://x.com/EthicalMarkets",
        "source_urls": "https://www.ethicalmarkets.com/",
        "best_first_channel": "Review/archive route",
        "data_confidence": "High",
    },
    "Chelsea Green network": {
        "ecosystem_segment": "Publisher ecosystem / sustainability",
        "website": "https://www.chelseagreen.com/",
        "contact_url": "https://www.chelseagreen.com/contact-us/",
        "linkedin_url": "https://www.linkedin.com/company/chelsea-green-publishing/",
        "x_url": "https://x.com/chelseagreen",
        "source_urls": "https://www.chelseagreen.com/",
        "best_first_channel": "Comparable/category intelligence, not primary ask",
        "data_confidence": "High",
    },
    "Berrett-Koehler author community": {
        "ecosystem_segment": "Publisher ecosystem",
        "website": "https://www.bkconnection.com/",
        "contact_url": "https://www.bkconnection.com/contact",
        "linkedin_url": "https://www.linkedin.com/company/berrett-koehler-publishers/",
        "x_url": "https://x.com/BKpub",
        "source_urls": "https://www.bkconnection.com/",
        "best_first_channel": "Through Jeevan/BK editorial context",
        "warm_path_needed": "Yes",
        "data_confidence": "High",
    },
    "Patreon": {
        "ecosystem_segment": "Creator monetization",
        "website": "https://www.patreon.com/",
        "contact_url": "https://support.patreon.com/",
        "linkedin_url": "https://www.linkedin.com/company/patreon/",
        "x_url": "https://x.com/Patreon",
        "youtube_url": "https://www.youtube.com/@patreon",
        "source_urls": "https://www.patreon.com/ | https://www.axios.com/2025/08/05/patreon-10-billion-creator-economy-ai",
        "best_first_channel": "Use as category proof; route through creator economy rather than corporate support",
        "data_confidence": "High",
    },
    "Jack Conte": {
        "ecosystem_segment": "Creator monetization",
        "website": "https://www.patreon.com/",
        "contact_url": "https://www.patreon.com/",
        "linkedin_url": "https://www.linkedin.com/in/jackconte/",
        "x_url": "https://x.com/jackconte",
        "instagram_url": "https://www.instagram.com/jackconte/",
        "youtube_url": "https://www.youtube.com/@jackconte",
        "source_urls": "https://www.patreon.com/",
        "best_first_channel": "Warm creator-platform route only",
        "warm_path_needed": "Yes",
        "data_confidence": "Medium",
    },
    "Substack": {
        "ecosystem_segment": "Newsletter/audience ownership",
        "website": "https://substack.com/",
        "contact_url": "https://support.substack.com/",
        "linkedin_url": "https://www.linkedin.com/company/substack/",
        "x_url": "https://x.com/SubstackInc",
        "source_urls": "https://substack.com/",
        "best_first_channel": "Essay placement/category proof, not corporate cold outreach",
        "data_confidence": "High",
    },
    "Beehiiv": {
        "ecosystem_segment": "Newsletter infrastructure",
        "website": "https://www.beehiiv.com/",
        "contact_url": "https://www.beehiiv.com/contact",
        "linkedin_url": "https://www.linkedin.com/company/beehiiv/",
        "x_url": "https://x.com/beehiiv",
        "source_urls": "https://www.beehiiv.com/",
        "best_first_channel": "Audience ownership essay route",
        "data_confidence": "High",
    },
    "Circle": {
        "ecosystem_segment": "Community platform",
        "website": "https://circle.so/",
        "contact_url": "https://circle.so/contact",
        "linkedin_url": "https://www.linkedin.com/company/circleco/",
        "x_url": "https://x.com/circleapp",
        "source_urls": "https://circle.so/",
        "best_first_channel": "Community-builder framework route",
        "data_confidence": "Medium-high",
    },
    "Skool": {
        "ecosystem_segment": "Community platform / learning communities",
        "website": "https://www.skool.com/",
        "contact_url": "https://www.skool.com/",
        "x_url": "https://x.com/skoolcommunities",
        "source_urls": "https://www.skool.com/",
        "best_first_channel": "Creator-community operator route; likely through creators, not platform",
        "data_confidence": "Medium",
    },
    "Kajabi": {
        "ecosystem_segment": "Creator commerce",
        "website": "https://kajabi.com/",
        "contact_url": "https://kajabi.com/contact",
        "linkedin_url": "https://www.linkedin.com/company/kajabi/",
        "x_url": "https://x.com/Kajabi",
        "source_urls": "https://kajabi.com/state-of-creator-commerce-25",
        "best_first_channel": "Creator commerce report bridge",
        "data_confidence": "High",
    },
    "ConvertKit / Kit": {
        "ecosystem_segment": "Creator email/audience ownership",
        "website": "https://kit.com/",
        "contact_url": "https://kit.com/contact",
        "linkedin_url": "https://www.linkedin.com/company/kit/",
        "x_url": "https://x.com/kit",
        "source_urls": "https://kit.com/",
        "best_first_channel": "Audience ownership essay route",
        "data_confidence": "Medium-high",
    },
    "Mighty Networks": {
        "ecosystem_segment": "Community platform",
        "website": "https://www.mightynetworks.com/",
        "contact_url": "https://www.mightynetworks.com/contact",
        "linkedin_url": "https://www.linkedin.com/company/mighty-networks/",
        "x_url": "https://x.com/MightyNetworks",
        "source_urls": "https://www.mightynetworks.com/",
        "best_first_channel": "Community value-flow concept",
        "data_confidence": "High",
    },
    "Farcaster": {
        "ecosystem_segment": "Decentralized social",
        "website": "https://www.farcaster.xyz/",
        "contact_url": "https://www.farcaster.xyz/",
        "x_url": "https://x.com/farcaster_xyz",
        "github_url": "https://github.com/farcasterxyz",
        "source_urls": "https://www.farcaster.xyz/",
        "best_first_channel": "Protocol/community essay route",
        "data_confidence": "Medium-high",
    },
    "Bluesky / AT Protocol": {
        "ecosystem_segment": "Open social web",
        "website": "https://bsky.social/",
        "contact_url": "https://bsky.social/about/contact",
        "x_url": "https://x.com/bsky",
        "github_url": "https://github.com/bluesky-social",
        "source_urls": "https://bsky.social/ | https://atproto.com/",
        "best_first_channel": "AT Protocol trust/portability essay route",
        "data_confidence": "Medium-high",
    },
    "Mastodon / ActivityPub community": {
        "ecosystem_segment": "Federated social web",
        "website": "https://joinmastodon.org/",
        "contact_url": "https://joinmastodon.org/contact",
        "github_url": "https://github.com/mastodon/mastodon",
        "source_urls": "https://joinmastodon.org/ | https://activitypub.rocks/",
        "best_first_channel": "Fediverse/community route; decentralized, no single gate",
        "data_confidence": "Medium-high",
    },
    "Protocol Labs": {
        "ecosystem_segment": "Decentralized web / public goods",
        "website": "https://protocol.ai/",
        "contact_url": "https://protocol.ai/contact/",
        "linkedin_url": "https://www.linkedin.com/company/protocol-labs/",
        "x_url": "https://x.com/protocollabs",
        "github_url": "https://github.com/protocol",
        "source_urls": "https://protocol.ai/",
        "best_first_channel": "Public goods/decentralized web route",
        "data_confidence": "High",
    },
    "Filecoin public goods programs": {
        "ecosystem_segment": "Public goods / decentralized storage",
        "website": "https://fil.org/",
        "contact_url": "https://fil.org/",
        "x_url": "https://x.com/FilFoundation",
        "github_url": "https://github.com/filecoin-project",
        "source_urls": "https://fil.org/",
        "best_first_channel": "Mechanism design/public goods bridge",
        "data_confidence": "Medium",
    },
    "Octant": {
        "ecosystem_segment": "Public goods funding",
        "website": "https://octant.app/",
        "contact_url": "https://octant.app/",
        "x_url": "https://x.com/octantapp",
        "source_urls": "https://octant.app/",
        "best_first_channel": "Public goods funding experiment bridge",
        "data_confidence": "Medium",
    },
    "Hypercerts": {
        "ecosystem_segment": "Impact certificates / public goods",
        "website": "https://www.hypercerts.org/",
        "contact_url": "https://www.hypercerts.org/",
        "x_url": "https://x.com/hypercerts",
        "github_url": "https://github.com/hypercerts-org",
        "source_urls": "https://www.hypercerts.org/",
        "best_first_channel": "Claims/redeemability discussion",
        "data_confidence": "Medium",
    },
    "Ethereum Attestation Service": {
        "ecosystem_segment": "Attestation / reputation primitives",
        "website": "https://attest.org/",
        "contact_url": "https://attest.org/",
        "x_url": "https://x.com/eas_eth",
        "github_url": "https://github.com/ethereum-attestation-service",
        "source_urls": "https://attest.org/",
        "best_first_channel": "Reputation/obligation layer concept note",
        "data_confidence": "Medium",
    },
    "Holochain": {
        "ecosystem_segment": "Agent-centric distributed apps",
        "website": "https://www.holochain.org/",
        "contact_url": "https://www.holochain.org/contact/",
        "linkedin_url": "https://www.linkedin.com/company/holochain/",
        "x_url": "https://x.com/holochain",
        "github_url": "https://github.com/holochain",
        "source_urls": "https://www.holochain.org/",
        "best_first_channel": "Mutual-credit / non-token systems route",
        "data_confidence": "High",
    },
    "Encointer": {
        "ecosystem_segment": "Community currencies / identity",
        "website": "https://encointer.org/",
        "contact_url": "https://encointer.org/contact/",
        "x_url": "https://x.com/encointer",
        "github_url": "https://github.com/encointer",
        "source_urls": "https://encointer.org/",
        "best_first_channel": "Community currency + identity bridge",
        "data_confidence": "High",
    },
    "Solarpunk Magazine": {
        "ecosystem_segment": "Solarpunk media",
        "website": "https://solarpunkmagazine.com/",
        "contact_url": "https://solarpunkmagazine.com/contact/",
        "x_url": "https://x.com/solarpunklitmag",
        "instagram_url": "https://www.instagram.com/solarpunkmagazine/",
        "source_urls": "https://solarpunkmagazine.com/",
        "best_first_channel": "Essay placement",
        "data_confidence": "Medium-high",
    },
    "Andrewism": {
        "ecosystem_segment": "Solarpunk / mutual aid creator",
        "website": "https://andrewism.net/",
        "contact_url": "https://andrewism.net/",
        "youtube_url": "https://www.youtube.com/@Andrewism",
        "source_urls": "https://andrewism.net/",
        "best_first_channel": "Video/podcast topic after solarpunk exchange angle is polished",
        "data_confidence": "Medium",
    },
    "Srsly Wrong": {
        "ecosystem_segment": "Utopian systems / podcast",
        "website": "https://srslywrong.com/",
        "contact_url": "https://srslywrong.com/contact/",
        "x_url": "https://x.com/SrslyWrong",
        "podcast_url": "https://srslywrong.com/",
        "source_urls": "https://srslywrong.com/",
        "best_first_channel": "Podcast pitch",
        "data_confidence": "Medium-high",
    },
    "Better Offline / Ed Zitron": {
        "ecosystem_segment": "Tech platform critique",
        "website": "https://www.betteroffline.com/",
        "contact_url": "https://www.betteroffline.com/",
        "x_url": "https://x.com/edzitron",
        "podcast_url": "https://www.betteroffline.com/",
        "newsletter_url": "https://www.wheresyoured.at/",
        "source_urls": "https://www.betteroffline.com/ | https://www.wheresyoured.at/",
        "best_first_channel": "Platform extraction essay route",
        "data_confidence": "Medium",
    },
    "Platformer / Casey Newton": {
        "ecosystem_segment": "Tech platforms / creators",
        "website": "https://www.platformer.news/",
        "contact_url": "https://www.platformer.news/",
        "x_url": "https://x.com/CaseyNewton",
        "newsletter_url": "https://www.platformer.news/",
        "substack_url": "https://www.platformer.news/",
        "source_urls": "https://www.platformer.news/",
        "best_first_channel": "Creator-platform trust essay route",
        "data_confidence": "Medium",
    },
    "Taylor Lorenz": {
        "ecosystem_segment": "Internet culture / creators",
        "website": "https://www.usermag.co/",
        "contact_url": "https://www.usermag.co/",
        "x_url": "https://x.com/TaylorLorenz",
        "instagram_url": "https://www.instagram.com/taylorlorenz/",
        "newsletter_url": "https://www.usermag.co/",
        "source_urls": "https://www.usermag.co/",
        "best_first_channel": "Creator ownership / internet culture pitch",
        "data_confidence": "Medium",
    },
    "The Information Creator Economy": {
        "ecosystem_segment": "Creator economy media",
        "website": "https://www.theinformation.com/",
        "contact_url": "https://www.theinformation.com/contact",
        "linkedin_url": "https://www.linkedin.com/company/the-information/",
        "x_url": "https://x.com/theinformation",
        "newsletter_url": "https://www.theinformation.com/newsletters",
        "source_urls": "https://www.theinformation.com/",
        "best_first_channel": "Category/media pitch",
        "data_confidence": "High",
    },
    "Creator Economy Expo": {
        "ecosystem_segment": "Creator economy event",
        "website": "https://creatoreconomyexpo.com/",
        "contact_url": "https://creatoreconomyexpo.com/contact/",
        "event_url": "https://creatoreconomyexpo.com/",
        "source_urls": "https://creatoreconomyexpo.com/",
        "best_first_channel": "Talk/session proposal",
        "data_confidence": "Medium-high",
    },
    "VidSummit": {
        "ecosystem_segment": "Creator economy event",
        "website": "https://vidsummit.com/",
        "contact_url": "https://vidsummit.com/contact/",
        "event_url": "https://vidsummit.com/",
        "source_urls": "https://vidsummit.com/",
        "best_first_channel": "Panel/session route only with creator-specific pitch",
        "data_confidence": "Medium-high",
    },
    "On Air Fest / Patreon creator events": {
        "ecosystem_segment": "Creator events",
        "website": "https://www.onairfest.com/",
        "contact_url": "https://www.onairfest.com/contact",
        "event_url": "https://www.onairfest.com/",
        "source_urls": "https://www.onairfest.com/ | https://www.patreon.com/",
        "best_first_channel": "Creator trust/value-flow event idea",
        "data_confidence": "Medium",
    },
    "Internet Archive / Brewster Kahle": {
        "ecosystem_segment": "Open knowledge / preservation",
        "website": "https://archive.org/",
        "contact_url": "https://archive.org/about/contact.php",
        "linkedin_url": "https://www.linkedin.com/company/internet-archive/",
        "x_url": "https://x.com/internetarchive",
        "source_urls": "https://archive.org/about/",
        "best_first_channel": "Open knowledge / commons conversation",
        "data_confidence": "High",
    },
    "EFF": {
        "ecosystem_segment": "Digital rights",
        "website": "https://www.eff.org/",
        "contact_url": "https://www.eff.org/about/contact",
        "linkedin_url": "https://www.linkedin.com/company/electronic-frontier-foundation/",
        "x_url": "https://x.com/EFF",
        "source_urls": "https://www.eff.org/",
        "best_first_channel": "Platform dependency and trust essay route",
        "data_confidence": "High",
    },
    "Mozilla Foundation": {
        "ecosystem_segment": "Internet health / public interest tech",
        "website": "https://foundation.mozilla.org/",
        "contact_url": "https://foundation.mozilla.org/contact/",
        "linkedin_url": "https://www.linkedin.com/company/mozilla-foundation/",
        "x_url": "https://x.com/mozilla",
        "source_urls": "https://foundation.mozilla.org/",
        "best_first_channel": "Trust infrastructure/public-interest tech route",
        "data_confidence": "High",
    },
    "New_ Public": {
        "ecosystem_segment": "Healthy digital publics",
        "website": "https://newpublic.org/",
        "contact_url": "https://newpublic.org/contact",
        "linkedin_url": "https://www.linkedin.com/company/new-public/",
        "x_url": "https://x.com/newpublic",
        "source_urls": "https://newpublic.org/",
        "best_first_channel": "Community governance route",
        "data_confidence": "Medium-high",
    },
    "Civic Hall": {
        "ecosystem_segment": "Civic tech",
        "website": "https://civichall.org/",
        "contact_url": "https://civichall.org/contact/",
        "linkedin_url": "https://www.linkedin.com/company/civichall/",
        "x_url": "https://x.com/CivicHall",
        "source_urls": "https://civichall.org/",
        "best_first_channel": "Civic tech/community coordination route",
        "data_confidence": "High",
    },
    "RadicalxChange": {
        "ecosystem_segment": "Mechanism design / plurality",
        "website": "https://www.radicalxchange.org/",
        "contact_url": "https://www.radicalxchange.org/contact/",
        "linkedin_url": "https://www.linkedin.com/company/radicalxchange/",
        "x_url": "https://x.com/radxchange",
        "source_urls": "https://www.radicalxchange.org/",
        "best_first_channel": "Trust-mediated exchange / mechanism design essay route",
        "data_confidence": "High",
    },
    "Metagov": {
        "ecosystem_segment": "Online governance research",
        "website": "https://metagov.org/",
        "contact_url": "https://metagov.org/contact/",
        "github_url": "https://github.com/metagov",
        "x_url": "https://x.com/metagov_project",
        "source_urls": "https://metagov.org/",
        "best_first_channel": "Governance research route",
        "data_confidence": "High",
    },
    "DAOstar": {
        "ecosystem_segment": "DAO standards",
        "website": "https://daostar.org/",
        "contact_url": "https://daostar.org/",
        "github_url": "https://github.com/metagov/daostar",
        "x_url": "https://x.com/DAOstar_One",
        "source_urls": "https://daostar.org/",
        "best_first_channel": "DAO standards/governance route",
        "data_confidence": "Medium",
    },
    "Black Socialists in America / Dual Power App orbit": {
        "ecosystem_segment": "Mutual aid / dual power",
        "website": "https://blacksocialists.us/",
        "contact_url": "https://blacksocialists.us/contact",
        "x_url": "https://x.com/BlackSocialists",
        "source_urls": "https://blacksocialists.us/",
        "best_first_channel": "Only after careful ideological/context fit; mutual aid and local exchange frame",
        "risk_note": "Sensitive political context; avoid extractive outreach",
        "data_confidence": "Medium",
    },
    "Bioregional learning centers": {
        "ecosystem_segment": "Bioregionalism / local resilience",
        "website": "https://capitalinstitute.org/bioregional-financing-facilities/",
        "contact_url": "https://capitalinstitute.org/contact/",
        "source_urls": "https://capitalinstitute.org/bioregional-financing-facilities/",
        "best_first_channel": "Map specific bioregional conveners before outreach",
        "first_move": "Create a regional exchange-capacity memo",
        "data_confidence": "Low-medium; this is a network category, not one contact",
    },
    "MrBeast / Jimmy Donaldson": {
        "ecosystem_segment": "Universe Tier / creator scale",
        "website": "https://www.mrbeast.com/",
        "contact_url": "https://www.mrbeast.com/pages/contact",
        "linkedin_url": "https://www.linkedin.com/company/mrbeast/",
        "x_url": "https://x.com/MrBeast",
        "instagram_url": "https://www.instagram.com/mrbeast/",
        "tiktok_url": "https://www.tiktok.com/@mrbeast",
        "youtube_url": "https://www.youtube.com/@MrBeast",
        "source_urls": "https://www.guinnessworldrecords.com/world-records/most-subscribers-on-youtube",
        "best_first_channel": "Do not cold pitch; route through creator-economy collaborators only",
        "warm_path_needed": "Yes",
        "first_move": "Use as universe-tier category imagination, not first-wave outreach",
        "data_confidence": "Medium",
    },
    "Marques Brownlee / MKBHD": {
        "ecosystem_segment": "Universe Tier / tech trust",
        "website": "https://mkbhd.com/",
        "contact_url": "https://mkbhd.com/",
        "linkedin_url": "https://www.linkedin.com/company/mkbhd/",
        "x_url": "https://x.com/MKBHD",
        "instagram_url": "https://www.instagram.com/mkbhd/",
        "threads_url": "https://www.threads.net/@mkbhd",
        "youtube_url": "https://www.youtube.com/@mkbhd",
        "source_urls": "https://www.axios.com/2026/04/10/marques-brownlee-consumer-tech-reviews",
        "best_first_channel": "Warm tech-media route; no outreach until trust-as-technology hook is sharp",
        "warm_path_needed": "Yes",
        "data_confidence": "Medium",
    },
    "Lex Fridman": {
        "ecosystem_segment": "Universe Tier / AI civilization",
        "website": "https://lexfridman.com/",
        "contact_url": "https://lexfridman.com/contact/",
        "linkedin_url": "https://www.linkedin.com/in/lexfridman/",
        "x_url": "https://x.com/lexfridman",
        "instagram_url": "https://www.instagram.com/lexfridman/",
        "youtube_url": "https://www.youtube.com/@lexfridman",
        "podcast_url": "https://lexfridman.com/podcast/",
        "source_urls": "https://lexfridman.com/",
        "best_first_channel": "Warm long-form route only",
        "warm_path_needed": "Yes",
        "first_move": "Develop civilization-scale thesis: money, trust, AI, and coordination",
        "data_confidence": "High",
    },
    "Kurzgesagt": {
        "ecosystem_segment": "Universe Tier / visual education",
        "website": "https://kurzgesagt.org/",
        "contact_url": "https://kurzgesagt.org/contact/",
        "linkedin_url": "https://www.linkedin.com/company/kurzgesagt/",
        "x_url": "https://x.com/Kurz_Gesagt",
        "instagram_url": "https://www.instagram.com/kurz_gesagt/",
        "youtube_url": "https://www.youtube.com/@kurzgesagt",
        "source_urls": "https://kurzgesagt.org/",
        "best_first_channel": "Visual explainer outline first",
        "warm_path_needed": "Yes",
        "data_confidence": "High",
    },
}


def normalize_key(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip()).casefold()


def find_manual(name: str) -> dict[str, str]:
    if name in MANUAL:
        return MANUAL[name]
    lower = normalize_key(name)
    for key, value in MANUAL.items():
        if normalize_key(key) == lower:
            return value
    return {}


def default_priority(rank: int) -> str:
    if rank <= 25:
        return "Tier 1"
    if rank <= 60:
        return "Tier 2"
    return "Tier 3"


def infer_best_channel(row: dict[str, str]) -> str:
    if row.get("best_first_channel"):
        return row["best_first_channel"]
    if row.get("contact_url"):
        return "Official contact page"
    if row.get("newsletter_url") or row.get("substack_url"):
        return "Newsletter/publication route"
    if row.get("podcast_url"):
        return "Podcast route"
    if row.get("linkedin_url"):
        return "LinkedIn research/warm intro"
    if row.get("x_url") or row.get("bluesky_url") or row.get("mastodon_url"):
        return "Public social route after context brief"
    if row.get("website"):
        return "Official website research route"
    return "Research needed before outreach"


def merge_sources(*sources: str) -> str:
    seen: list[str] = []
    for source in sources:
        for piece in clean(source).split("|"):
            item = clean(piece)
            if item and item not in seen:
                seen.append(item)
    return " | ".join(seen)


def build() -> list[dict[str, str]]:
    top_rows = parse_top_100()
    dashboard = read_relationship_dashboard()
    ecosystem = read_ecosystem_contacts()
    rows: list[dict[str, str]] = []
    used_names = set()

    for base in top_rows:
        name = base["name"]
        rank = int(base["rank"])
        row = {field: "" for field in FIELDS}
        row.update(base)
        row["priority_tier"] = default_priority(rank)
        row["relationship_stage"] = "Research"
        row["verification_status"] = "Needs pre-outreach verification"

        for source in (ecosystem.get(name, {}), dashboard.get(name, {}), find_manual(name)):
            for key, value in source.items():
                if key == "source_urls":
                    row["source_urls"] = merge_sources(row.get("source_urls", ""), value)
                elif key == "notes":
                    row["notes"] = " | ".join([x for x in [row.get("notes"), value] if x])
                elif value:
                    row[key] = value

        row["best_first_channel"] = infer_best_channel(row)
        row["warm_path_needed"] = row.get("warm_path_needed") or ("Yes" if rank <= 25 and "contact" not in row["best_first_channel"].lower() else "")
        row["data_confidence"] = row.get("data_confidence") or ("Medium" if row.get("website") else "Low")
        row["verification_status"] = "Verified public routes listed; re-check before outreach" if row.get("website") or row.get("contact_url") else "Research needed"
        rows.append(row)
        used_names.add(normalize_key(name))

    # Add high-value dashboard entries that are not in the top-100 table.
    for name, extras in sorted(dashboard.items()):
        if normalize_key(name) in used_names:
            continue
        row = {field: "" for field in FIELDS}
        row.update(extras)
        row["name"] = name
        row["rank"] = ""
        row["record_type"] = "Person/Organization"
        row["priority_tier"] = row.get("priority_tier") or "Tier 1"
        row["relationship_stage"] = row.get("relationship_stage") or "Research"
        for source in (ecosystem.get(name, {}), find_manual(name)):
            for key, value in source.items():
                if key == "source_urls":
                    row["source_urls"] = merge_sources(row.get("source_urls", ""), value)
                elif key == "notes":
                    row["notes"] = " | ".join([x for x in [row.get("notes"), value] if x])
                elif value:
                    row[key] = value
        row["best_first_channel"] = infer_best_channel(row)
        row["data_confidence"] = row.get("data_confidence") or ("Medium" if row.get("website") else "Low")
        row["verification_status"] = "Verified public routes listed; re-check before outreach" if row.get("website") else "Research needed"
        rows.append(row)
        used_names.add(normalize_key(name))

    # Add manually enriched moonshots not already represented.
    for name, extras in MANUAL.items():
        if normalize_key(name) in used_names:
            continue
        row = {field: "" for field in FIELDS}
        row.update(extras)
        row["name"] = name
        row["record_type"] = "Person/Organization"
        row["ecosystem_segment"] = row.get("ecosystem_segment") or "Universe Tier"
        row["priority_tier"] = "Universe"
        row["relationship_stage"] = "Research"
        row["likely_ask"] = row.get("likely_ask") or "Do not ask until the right artifact exists"
        row["best_first_channel"] = infer_best_channel(row)
        row["verification_status"] = "Verified public routes listed; re-check before outreach" if row.get("website") else "Research needed"
        rows.append(row)

    return rows


def main() -> None:
    rows = build()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} relationship records to {OUTPUT}")


if __name__ == "__main__":
    main()

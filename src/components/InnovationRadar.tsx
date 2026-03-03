import { useEffect, useMemo, useState } from "react";
import { useInnovationRadar } from "../innovationRadar/useInnovationRadar";

type Repo = {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  language: string | null;
};

type GitHubSearchResponse = {
  items?: Repo[];
};

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.03)",
      borderRadius: 16,
      padding: 14,
      boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 12, opacity: 0.9 }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "inherit",
  borderRadius: 10,
  padding: "8px 10px",
  outline: "none",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.18)",
  borderRadius: 12,
  padding: 12,
};

const watchItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.18)",
  textDecoration: "none",
};

export default function InnovationRadar() {
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [minStars, setMinStars] = useState(5);
  const [days, setDays] = useState(14);
  const [query, setQuery] = useState("xrpl OR xrp-ledger OR interledger");

  const { headlines, signals, refresh } = useInnovationRadar({
    autoStart: true,
    maxHeadlines: 25,
    maxSignals: 15,
  });

  const ghQuery = useMemo(() => {
    const since = daysAgoISO(days);
    const q = `${query} in:name,description,readme updated:>=${since} stars:>=${minStars}`;
    return `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=20`;
  }, [query, days, minStars]);

  const ghHeaders = useMemo(() => {
    const token =
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env as Record<string, string>).VITE_GITHUB_TOKEN;
    const headers: HeadersInit = { Accept: "application/vnd.github.v3+json" };
    if (typeof token === "string" && token.trim()) {
      (headers as Record<string, string>).Authorization = `Bearer ${token.trim()}`;
    }
    return headers;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(ghQuery, { headers: ghHeaders })
      .then(async (r) => {
        const body = await r.text();
        if (!r.ok) {
          if (r.status === 403) {
            const rateLimitMsg =
              body && body.includes("rate limit")
                ? " GitHub rate limit reached (60/hr without token). Add VITE_GITHUB_TOKEN in .env for higher limits."
                : "";
            throw new Error(`GitHub API error: 403.${rateLimitMsg}`);
          }
          throw new Error(`GitHub API error: ${r.status}`);
        }
        return JSON.parse(body) as GitHubSearchResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setRepos((data.items ?? []).slice(0, 20));
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unknown error");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [ghQuery]);

  const watchlist = [
    { name: "xrpldna", url: "https://github.com/search?q=xrpldna&type=repositories" },
    { name: "xrpl-commons", url: "https://github.com/xrpl-commons" },
    { name: "xrpl-labs", url: "https://github.com/XRPL-Labs" },
    { name: "ripple", url: "https://github.com/ripple" },
    { name: "xrplf", url: "https://github.com/XRPLF" },
  ];

  return (
    <div style={{ width: 980 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "baseline", marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>Innovation Radar</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Scan what builders are shipping (projects → signals → where XRPL is heading).
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 }}>
        <Panel title="New & Active Projects (GitHub)">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <Control label="Query">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={inputStyle}
                placeholder='ex: "xrpl OR xrp-ledger OR hooks"'
              />
            </Control>
            <Control label="Days">
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                style={{ ...inputStyle, width: 90 }}
              />
            </Control>
            <Control label="Min Stars">
              <input
                type="number"
                min={0}
                max={50000}
                value={minStars}
                onChange={(e) => setMinStars(Number(e.target.value))}
                style={{ ...inputStyle, width: 110 }}
              />
            </Control>
          </div>

          {loading && <div style={{ fontSize: 12, opacity: 0.7 }}>Loading…</div>}
          {error && <div style={{ fontSize: 12, opacity: 0.8 }}>Error: {error}</div>}

          <div style={{ display: "grid", gap: 10 }}>
            {repos.map((r) => (
              <div key={r.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <a href={r.html_url} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
                    {r.full_name}
                  </a>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    ⭐ {r.stargazers_count} · 🍴 {r.forks_count}
                  </div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  Updated: {new Date(r.updated_at).toLocaleString()}
                  {r.language ? ` · ${r.language}` : ""}
                </div>
                {r.description && (
                  <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9, lineHeight: 1.35 }}>
                    {r.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <div style={{ display: "grid", gap: 14 }}>
          <Panel title="Watchlist (Manual Signals)">
            <div style={{ display: "grid", gap: 8 }}>
              {watchlist.map((w) => (
                <a key={w.name} href={w.url} target="_blank" rel="noreferrer" style={watchItemStyle}>
                  {w.name}
                  <span style={{ marginLeft: "auto", opacity: 0.6, fontSize: 12 }}>↗</span>
                </a>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7, lineHeight: 1.4 }}>
              Add any project/handle you want. This is where you track xrpldna and emerging teams.
            </div>
          </Panel>

          <Panel title="RSS & Radar (Live)">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>Headlines from configured feeds</span>
              <button
                type="button"
                onClick={refresh}
                style={{
                  fontSize: 11,
                  padding: "4px 8px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                Refresh
              </button>
            </div>
            <div style={{ display: "grid", gap: 8, maxHeight: 280, overflowY: "auto" }}>
              {headlines.length === 0 && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>Polling RSS… new headlines will appear here.</div>
              )}
              {headlines.map((h) => (
                <a
                  key={h.id}
                  href={h.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...watchItemStyle,
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "flex-start" }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{h.title || "(No title)"}</span>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>{Math.round(h.relevanceScore * 100)}%</span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    {h.sourceLabel} · {new Date(h.publishedAt).toLocaleString()}
                  </div>
                  {h.description && (
                    <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.3 }}>{h.description.slice(0, 120)}{h.description.length > 120 ? "…" : ""}</div>
                  )}
                </a>
              ))}
            </div>
          </Panel>

          <Panel title="Trend Signals">
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
              Keyword and activity signals from radar events
            </div>
            <div style={{ display: "grid", gap: 8, maxHeight: 220, overflowY: "auto" }}>
              {signals.length === 0 && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>Signals will appear as headlines are processed.</div>
              )}
              {signals.map((s) => (
                <div key={s.id} style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{s.title}</span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{Math.round(s.relevanceScore * 100)}%</span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>{s.description}</div>
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
                    {s.type} · {new Date(s.at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

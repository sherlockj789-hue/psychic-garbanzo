"use client";

import { useMemo, useState } from "react";
import { useNav } from "@/lib/nav";
import { CAREERS, CAREER_GROUPS } from "@/data/careers";
import { Search } from "lucide-react";

const colorBg: Record<string, string> = {
  sun: "bg-sun", mint: "bg-mint", ocean: "bg-ocean text-white", coral: "bg-coral text-white",
};

export function CareersView({
  initialGroup,
  initialQ,
}: {
  initialGroup?: string;
  initialQ?: string;
}) {
  const { navigate } = useNav();
  const [q, setQ] = useState(initialQ ?? "");
  const [active, setActive] = useState<string>(initialGroup ?? "All");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return CAREERS.filter((c) => {
      const matchGroup = active === "All" || c.group === active;
      const matchQ =
        !query || c.name.toLowerCase().includes(query) || c.tagline.toLowerCase().includes(query);
      return matchGroup && matchQ;
    });
  }, [q, active]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display-tf)] text-5xl sm:text-6xl">
            Every dream job
          </h1>
          <p className="mt-2 max-w-lg text-foreground/70">
            {CAREERS.length} careers. Each with 12 grades of real lessons, real videos, and a Job
            Simulator.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search careers…"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-11 pr-4 shadow-pop-sm outline-none focus:ring-2 focus:ring-mint"
            aria-label="Search careers"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {["All", ...CAREER_GROUPS].map((g) => {
          const isActive = active === g;
          return (
            <button
              key={g}
              onClick={() => setActive(g)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "border-transparent bg-ink text-background"
                  : "border-border bg-card hover:bg-sun/40"
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <button
            key={c.slug}
            onClick={() => navigate({ name: "career", slug: c.slug })}
            className="card-pop block p-5 text-left"
          >
            <div className="flex items-start gap-3">
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-ink/20 text-2xl ${colorBg[c.color]}`}
              >
                {c.emoji}
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase text-foreground/60">{c.group}</div>
                <h3 className="font-[family-name:var(--font-display-tf)] text-xl leading-tight">
                  {c.name}
                </h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-foreground/70">{c.tagline}</p>
            <div className="mt-3 text-xs text-foreground/60">12 grades · 120 lessons · job sim</div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full card-pop p-10 text-center">
            <div className="text-4xl">🔎</div>
            <p className="mt-2 font-[family-name:var(--font-display-tf)] text-2xl">
              Nothing matches yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

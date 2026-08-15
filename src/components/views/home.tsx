"use client";

import { useMemo, useState } from "react";
import { useNav } from "@/lib/nav";
import { CAREERS, CAREER_GROUPS } from "@/data/careers";
import { Search, ArrowRight, BookOpen, Gamepad2, Video, Compass } from "lucide-react";

export function HomeView() {
  const { navigate } = useNav();
  const [q, setQ] = useState("");

  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return CAREERS.filter(
      (c) => c.name.toLowerCase().includes(query) || c.group.toLowerCase().includes(query),
    ).slice(0, 6);
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      navigate({ name: "careers" });
      return;
    }
    const match = CAREERS.find(
      (c) =>
        c.name.toLowerCase() === query.toLowerCase() ||
        c.slug === query.toLowerCase().replace(/\s+/g, "-"),
    );
    if (match) navigate({ name: "career", slug: match.slug });
    else navigate({ name: "careers", q: query });
  }

  const popular = CAREERS.filter((c) =>
    ["youtuber-streamer", "game-developer", "doctor-surgeon", "astronaut", "chef-baker", "professional-athlete"].includes(
      c.slug,
    ),
  );

  const colorBg: Record<string, string> = {
    sun: "bg-sun", mint: "bg-mint", ocean: "bg-ocean text-white", coral: "bg-coral text-white",
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-14 text-center sm:pb-24 sm:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold shadow-pop-sm">
            <span className="h-2 w-2 rounded-full bg-mint" /> Free · 12 grades · Real, expert-grounded lessons
          </div>

          <h1 className="mt-6 font-[family-name:var(--font-display-tf)] text-5xl leading-[0.95] tracking-tight text-ink sm:text-7xl">
            What do you
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">wanna be</span>
              <span className="absolute inset-x-0 bottom-1 -z-0 h-4 rounded-sm bg-sun" />
            </span>
            ?
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/80">
            Type a dream job. Get a full 12-grade curriculum — real lessons researched from expert
            sources, real videos, and games you actually learn from. When you&apos;re ready, try the
            Job Simulator.
          </p>

          <form onSubmit={submit} className="relative mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Try 'YouTuber', 'Doctor', 'Astronaut'…"
                className="w-full rounded-full border border-border bg-card py-3 pl-12 pr-28 text-lg shadow-pop-sm outline-none focus:ring-2 focus:ring-mint"
                aria-label="Search careers"
              />
              <button
                type="submit"
                className="btn-pop btn-neon absolute right-1.5 top-1.5 text-sm"
              >
                Go <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="card-pop absolute left-0 right-0 top-full z-20 mt-2 p-2 text-left">
                {suggestions.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => navigate({ name: "career", slug: s.slug })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-sun/40"
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <span className="font-semibold">{s.name}</span>
                    <span className="ml-auto text-xs text-foreground/50">{s.group}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-foreground/60">
            <span>Trusted sources:</span>
            {["BLS.gov", "Khan Academy", "CrashCourse", "Osmosis", "TED-Ed"].map((s) => (
              <span key={s} className="rounded-full border border-border bg-card px-2.5 py-1 font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Popular careers */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-display-tf)] text-4xl">Popular dreams</h2>
            <button
              onClick={() => navigate({ name: "careers" })}
              className="hidden text-sm font-semibold text-primary hover:underline sm:block"
            >
              Browse all {CAREERS.length} →
            </button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((c) => (
              <button
                key={c.slug}
                onClick={() => navigate({ name: "career", slug: c.slug })}
                className="card-pop block p-5 text-left"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-ink/20 text-2xl ${colorBg[c.color]}`}
                >
                  {c.emoji}
                </div>
                <div className="mt-3 text-xs font-semibold uppercase text-foreground/60">{c.group}</div>
                <h3 className="font-[family-name:var(--font-display-tf)] text-2xl leading-tight">{c.name}</h3>
                <p className="mt-1 text-sm text-foreground/70">{c.tagline}</p>
                <div className="mt-3 text-xs font-semibold text-primary">Start Grade 1 →</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center font-[family-name:var(--font-display-tf)] text-4xl">
          How Wise World School works
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Compass, n: "01", t: "Pick a career", d: "Search any dream. 60 careers, each a real path — not a vibe.", c: "bg-sun" },
            { icon: BookOpen, n: "02", t: "Go grade by grade", d: "1st to 12th. Each grade has 10 real lessons, researched from expert sources.", c: "bg-mint" },
            { icon: Gamepad2, n: "03", t: "Play to learn", d: "Every lesson has a fun game that actually teaches. Plus real videos and a job sim.", c: "bg-coral text-white" },
          ].map((s) => (
            <div key={s.n} className="card-pop p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 font-[family-name:var(--font-display-tf)] text-sm font-bold ${s.c}`}
                >
                  {s.n}
                </div>
                <s.icon className="h-5 w-5 text-foreground/40" />
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-display-tf)] text-2xl">{s.t}</h3>
              <p className="mt-2 text-foreground/75">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: BookOpen, t: "Real lessons", d: "Researched live from expert sources — not generic AI filler. Education, tools, pay, ethics, case studies." },
            { icon: Video, t: "Real videos", d: "Found fresh from YouTube — so they actually exist and actually teach. No dead embeds." },
            { icon: Gamepad2, t: "Fun games", d: "Timed quizzes, branching scenarios, memory matches, sequencing — built to be played, designed to teach." },
          ].map((f) => (
            <div key={f.t} className="card-pop p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-[family-name:var(--font-display-tf)] text-xl">{f.t}</h3>
              <p className="mt-2 text-sm text-foreground/75">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Groups */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <h2 className="font-[family-name:var(--font-display-tf)] text-3xl">Or browse by category</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {CAREER_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => navigate({ name: "careers", group: g })}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium hover:bg-sun/40"
            >
              {g}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

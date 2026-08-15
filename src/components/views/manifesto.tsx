"use client";

import { useNav } from "@/lib/nav";
import { CAREERS } from "@/data/careers";

export function ManifestoView() {
  const { navigate } = useNav();

  const beliefs = [
    { k: "01", t: "A real school, not a simulator.", d: "You can't say 'I did a simulation, I'm ready.' You learn first — 12 grades, real lessons — then try the simulator as a taste.", c: "bg-sun" },
    { k: "02", t: "Grades, but not the kind that shamed you.", d: "1st through 12th grade for every career. You move up when you're ready. Nobody gets held back — nobody gets pushed.", c: "bg-mint" },
    { k: "03", t: "Real lessons, from real sources.", d: "Every lesson is researched from expert sources — real education paths, real tools, real pay, real ethics. Not generic filler.", c: "bg-coral text-white" },
    { k: "04", t: "Videos that actually exist.", d: "We find real, currently-available videos for every lesson — no dead embeds, no broken links. If one breaks, the next is one tap away.", c: "bg-ocean text-white" },
    { k: "05", t: "Games that are actually fun.", d: "Timed quizzes, branching scenarios, memory matches, sequencing — built to be played, designed to teach. Not boring.", c: "bg-sun" },
    { k: "06", t: "Free means free.", d: "No tuition. No paywall. No credit card. Learning shouldn't be gated.", c: "bg-mint" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold shadow-pop-sm">
        Manifesto
      </div>
      <h1 className="mt-6 font-[family-name:var(--font-display-tf)] text-5xl leading-[1] tracking-tight sm:text-6xl">
        A real school for <span className="bg-sun px-2">real life</span>.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-foreground/80">
        Wise World School isn&apos;t a game. It&apos;s a school. {CAREERS.length} careers, 12 grades
        each, with lessons researched from real expert sources — plus real videos, fun games, and a
        job simulator. Free, forever.
      </p>

      <div className="mt-12 space-y-4">
        {beliefs.map((b) => (
          <div key={b.k} className="card-pop flex items-start gap-5 p-6">
            <div
              className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-ink/20 font-[family-name:var(--font-display-tf)] text-lg font-bold ${b.c}`}
            >
              {b.k}
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-display-tf)] text-2xl leading-tight">{b.t}</h3>
              <p className="mt-2 text-foreground/75">{b.d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card-pop mt-14 bg-ocean p-10 text-center text-white">
        <h2 className="font-[family-name:var(--font-display-tf)] text-4xl">Ready to actually learn?</h2>
        <p className="mt-3 text-white/85">Pick a career. Start at Grade 1. Work up.</p>
        <button onClick={() => navigate({ name: "careers" })} className="btn-pop btn-neon mt-6 text-sm">
          Open the library →
        </button>
      </div>
    </div>
  );
}

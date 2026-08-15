"use client";

import { useEffect } from "react";
import { useNav } from "@/lib/nav";
import { getCareer } from "@/data/careers";
import { GRADES } from "@/data/curriculum";
import { useProgress } from "@/lib/progress";
import { LESSONS_PER_GRADE } from "@/data/curriculum";
import { ArrowLeft, FlaskConical, Star } from "lucide-react";

const colorBg: Record<string, string> = {
  sun: "bg-sun", mint: "bg-mint", ocean: "bg-ocean text-white", coral: "bg-coral text-white",
};

export function CareerDetailView({ slug }: { slug: string }) {
  const { navigate } = useNav();
  const career = getCareer(slug);
  const xp = useProgress((s) => s.totalXp());
  const goal = useProgress((s) => s.goalCareer);
  const setGoal = useProgress((s) => s.setGoalCareer);
  const stageProgress = useProgress((s) => s.stageProgress);

  useEffect(() => {
    if (career && goal !== career.slug) setGoal(career.slug);
  }, [career, goal, setGoal]);

  if (!career) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="text-6xl">🤷</div>
        <h1 className="mt-4 font-[family-name:var(--font-display-tf)] text-4xl">
          Career not in the school yet
        </h1>
        <p className="mt-2 text-foreground/70">We don&apos;t have this role yet — check back soon.</p>
        <button onClick={() => navigate({ name: "careers" })} className="btn-pop btn-neon mt-6 text-sm">
          Browse careers
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <button
        onClick={() => navigate({ name: "careers" })}
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="mr-1 inline h-4 w-4" /> All careers
      </button>

      <div className="card-pop mt-4 p-6 sm:p-10">
        <div className="flex flex-wrap items-start gap-6">
          <div
            className={`inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-ink/20 text-4xl ${colorBg[career.color]}`}
          >
            {career.emoji}
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="text-xs font-semibold uppercase text-foreground/60">{career.group}</div>
            <h1 className="mt-1 font-[family-name:var(--font-display-tf)] text-4xl leading-tight sm:text-5xl">
              Become a {career.name}
            </h1>
            <p className="mt-3 max-w-2xl text-foreground/75">{career.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border bg-card px-3 py-1 font-semibold">
                12 grades
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1 font-semibold">
                {LESSONS_PER_GRADE * 12} lessons
              </span>
              <span className="rounded-full border border-border bg-sun px-3 py-1 font-semibold">
                Free forever
              </span>
            </div>
            <div className="mt-5">
              <button
                onClick={() => navigate({ name: "sim", slug: career.slug })}
                className="btn-pop text-sm"
              >
                <FlaskConical className="h-4 w-4 text-coral" /> Try the Job Simulator →
              </button>
              <p className="mt-2 text-xs text-foreground/60">
                Simulations are separate from lessons. Learn first, then try the real decisions.
              </p>
            </div>
          </div>
          <div className="card-pop min-w-[180px] p-4 text-center">
            <div className="text-xs font-semibold uppercase text-foreground/60">Your progress</div>
            <div className="mt-1 flex items-center justify-center gap-1 text-sm">
              <Star className="h-4 w-4 text-sun" /> {xp} XP
            </div>
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-[family-name:var(--font-display-tf)] text-3xl">Your 12 grades</h2>
      <p className="mt-1 text-foreground/70">
        Start at Grade 1. Each grade has {LESSONS_PER_GRADE} lessons. Move up when you&apos;re ready.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GRADES.map((g) => {
          const prog = stageProgress(career.slug, g.num, LESSONS_PER_GRADE);
          const bg =
            g.num % 4 === 0
              ? "bg-coral text-white"
              : g.num % 3 === 0
                ? "bg-ocean text-white"
                : g.num % 2 === 0
                  ? "bg-mint"
                  : "bg-sun";
          return (
            <button
              key={g.num}
              onClick={() => navigate({ name: "grade", slug: career.slug, grade: g.num })}
              className="card-pop block p-5 text-left"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-ink/20 font-[family-name:var(--font-display-tf)] text-xl font-bold ${bg}`}
                >
                  {g.num}
                </div>
                <div className="flex-1">
                  <h3 className="font-[family-name:var(--font-display-tf)] text-xl leading-tight">
                    {g.title}
                  </h3>
                  <p className="mt-1 text-xs text-foreground/70">{g.focus}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground/70">{g.summary}</p>
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full border border-border bg-background">
                  <div className="h-full bg-mint" style={{ width: `${prog.pct}%` }} />
                </div>
                <div className="mt-1 text-xs text-foreground/60">
                  {prog.done}/{LESSONS_PER_GRADE} lessons
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

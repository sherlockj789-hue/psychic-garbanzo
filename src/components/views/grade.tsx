"use client";

import { useNav } from "@/lib/nav";
import { getCareer } from "@/data/careers";
import { GRADES, getGradeLessons, LESSONS_PER_GRADE } from "@/data/curriculum";
import { useProgress, lessonKey } from "@/lib/progress";
import { ArrowLeft, Check, Clock, Zap, ArrowRight } from "lucide-react";

const kindLabel: Record<string, string> = {
  intro: "intro", vocabulary: "read + game", tools: "read + check", "day-in-life": "reading",
  technique: "read + scenario", ethics: "read + scenario", money: "read + check",
  "case-study": "case study", practice: "practice", recap: "recap",
};

export function GradeView({ slug, grade }: { slug: string; grade: number }) {
  const { navigate } = useNav();
  const career = getCareer(slug);
  const stage = GRADES[grade - 1];
  const lessons = getGradeLessons(slug, grade);
  const me = useProgress();
  const prog = me.stageProgress(slug, grade, LESSONS_PER_GRADE);
  const canMoveOn = prog.pct >= 70;

  if (!career || !stage) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-[family-name:var(--font-display-tf)] text-3xl">Stage not found</h1>
        <button onClick={() => navigate({ name: "careers" })} className="btn-pop btn-neon mt-6 text-sm">
          Careers
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <button
        onClick={() => navigate({ name: "career", slug })}
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="mr-1 inline h-4 w-4" /> {career.name}
      </button>

      <div className="card-pop mt-4 p-6 sm:p-8">
        <div className="hud">Grade {grade} · no age limit</div>
        <h1 className="mt-3 font-[family-name:var(--font-display-tf)] text-4xl leading-tight text-glow sm:text-5xl">
          {stage.title}
        </h1>
        <p className="mt-2 text-foreground/75">{stage.summary}</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary transition-all" style={{ width: `${prog.pct}%` }} />
        </div>
        <div className="mt-2 text-xs text-foreground/60">
          {prog.done}/{LESSONS_PER_GRADE} mastered ·{" "}
          {canMoveOn ? "next grade unlocked" : "70% unlocks the next grade"}
        </div>
      </div>

      <ol className="mt-8 space-y-3">
        {lessons.map((l) => {
          const done = me.isLessonDone(lessonKey(slug, grade, l.index));
          return (
            <li key={l.index}>
              <button
                onClick={() =>
                  navigate({ name: "lesson", slug, grade, lesson: l.index })
                }
                className="card-pop flex w-full items-center gap-4 p-4 text-left"
              >
                <div
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-[family-name:var(--font-display-tf)] font-bold ${
                    done
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border bg-card"
                  }`}
                >
                  {done ? <Check className="h-5 w-5" /> : l.index}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-[family-name:var(--font-display-tf)] text-lg leading-tight">
                    {l.title.replaceAll("{career}", career.name)}
                  </h2>
                  <p className="flex flex-wrap items-center gap-x-3 text-xs text-foreground/60">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {l.minutes} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-3 w-3" /> {l.xp} XP
                    </span>
                    <span>{kindLabel[l.kind] ?? "reading"}</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-foreground/40" />
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => navigate({ name: "sim", slug })}
          className="card-pop block p-5 text-left"
        >
          <div className="hud">Show your work</div>
          <h3 className="mt-2 font-[family-name:var(--font-display-tf)] text-xl">Job simulator</h3>
          <p className="mt-1 text-xs text-foreground/70">
            Run a real shift of {career.name} decisions. Separate from lessons.
          </p>
        </button>
        <button
          onClick={() =>
            navigate({ name: "grade", slug, grade: Math.min(12, grade + 1) })
          }
          className={`card-pop block p-5 text-left ${canMoveOn ? "" : "opacity-50"}`}
        >
          <div className="hud">Move on</div>
          <h3 className="mt-2 font-[family-name:var(--font-display-tf)] text-xl">
            Grade {Math.min(12, grade + 1)}
          </h3>
          <p className="mt-1 text-xs text-foreground/70">
            {canMoveOn ? "You understand this — go ahead." : "Master 70% of this grade first."}
          </p>
        </button>
      </div>
    </div>
  );
}

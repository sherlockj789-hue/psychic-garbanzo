"use client";

import { useEffect, useState } from "react";
import { useNav } from "@/lib/nav";
import { getCareer } from "@/data/careers";
import { GRADES, LESSONS_PER_GRADE } from "@/data/curriculum";
import { useProgress, lessonKey } from "@/lib/progress";
import type { Lesson } from "@/lib/types";
import { VideoEmbed } from "@/components/site/video-embed";
import { AiTeacher } from "@/components/site/ai-teacher";
import { GamePlayer } from "@/components/games/game-player";
import { ArrowLeft, Clock, Zap, Loader2, Check, ArrowRight, ExternalLink, Gamepad2 } from "lucide-react";

export function LessonView({ slug, grade, lesson }: { slug: string; grade: number; lesson: number }) {
  const { navigate } = useNav();
  const career = getCareer(slug);
  const gradeObj = GRADES[grade - 1];
  const [data, setData] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [reflection, setReflection] = useState("");
  const [gameDone, setGameDone] = useState(false);
  const [completed, setCompleted] = useState(false);

  const me = useProgress();
  const key = lessonKey(slug, grade, lesson);
  const alreadyDone = me.isLessonDone(key);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/lesson?career=${encodeURIComponent(slug)}&grade=${grade}&lesson=${lesson}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load lesson"))))
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, grade, lesson]);

  if (!career || !gradeObj) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-[family-name:var(--font-display-tf)] text-3xl">Lesson not found</h1>
        <button onClick={() => navigate({ name: "careers" })} className="btn-pop mt-6 text-sm">
          Careers
        </button>
      </div>
    );
  }

  const canComplete = data ? choice === data.check.correct && gameDone : false;

  function onComplete() {
    if (!data) return;
    me.recordLesson({
      kind: "lesson",
      key,
      label: `${career!.name} · ${data.title}`,
      xp: data.xp,
      at: Date.now(),
    });
    setCompleted(true);
  }

  function onNext() {
    if (lesson < LESSONS_PER_GRADE) {
      navigate({ name: "lesson", slug, grade, lesson: lesson + 1 });
    } else {
      navigate({ name: "grade", slug, grade: Math.min(12, grade + 1) });
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <button
        onClick={() => navigate({ name: "grade", slug, grade })}
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="mr-1 inline h-4 w-4" /> {gradeObj.title}
      </button>

      {loading && (
        <div className="mt-12 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Researching a real lesson about {career.name}…</p>
          <p className="max-w-xs text-center text-xs text-foreground/50">
            Each lesson is gathered fresh from expert sources the first time it&apos;s opened — this
            can take a few seconds.
          </p>
        </div>
      )}

      {error && (
        <div className="card-pop mt-8 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => navigate({ name: "grade", slug, grade })} className="btn-pop mt-4 text-sm">
            Back to grade
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="mt-4 flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-sun font-[family-name:var(--font-display-tf)] font-bold">
              {lesson}
            </div>
            <div className="text-xs text-foreground/60">
              {career.name} · Grade {grade} · Lesson {lesson}/{LESSONS_PER_GRADE}
            </div>
          </div>

          <h1 className="mt-3 font-[family-name:var(--font-display-tf)] text-4xl leading-tight">
            {data.title}
          </h1>

          <div className="mt-2 flex items-center gap-3 text-xs text-foreground/60">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {data.minutes} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3" /> {data.xp} XP
            </span>
          </div>

          <div className="mt-8 space-y-6">
            <VideoEmbed key={data.title} career={slug} topic={data.title} />

            {data.sections.map((s, i) => (
              <section key={i} className="card-pop p-5">
                <h2 className="font-[family-name:var(--font-display-tf)] text-xl">{s.heading}</h2>
                <div className="mt-2 whitespace-pre-line leading-relaxed text-foreground/85">
                  {s.body}
                </div>
              </section>
            ))}

            {data.keyTerms.length > 0 && (
              <section className="card-pop p-5">
                <h2 className="font-[family-name:var(--font-display-tf)] text-xl">Key terms</h2>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {data.keyTerms.map((t, i) => (
                    <div key={i} className="rounded-lg border border-border bg-muted/40 p-3">
                      <dt className="font-[family-name:var(--font-display-tf)] text-sm font-bold text-primary">
                        {t.term}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground/80">{t.def}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {/* Fun game */}
            <section className="card-pop overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border/60 bg-ocean/10 px-4 py-2.5">
                <Gamepad2 className="h-4 w-4 text-ocean" />
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean">
                  Play to learn
                </span>
              </div>
              <div className="p-5">
                <GamePlayer
                  type={data.game}
                  career={slug}
                  topic={`${data.title} — ${career.name}`}
                  onDone={() => setGameDone(true)}
                />
              </div>
            </section>

            {/* Quick check */}
            <section className="card-pop bg-mint/30 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                Quick check
              </div>
              <h2 className="mt-1 font-[family-name:var(--font-display-tf)] text-xl">{data.check.q}</h2>
              <div className="mt-3 space-y-2">
                {data.check.options.map((opt, i) => {
                  const isPicked = choice === i;
                  const isCorrect = choice !== null && i === data.check.correct;
                  const isWrong = isPicked && i !== data.check.correct;
                  return (
                    <button
                      key={i}
                      onClick={() => setChoice(i)}
                      disabled={choice !== null}
                      className={`w-full rounded-xl border border-border px-4 py-2.5 text-left font-medium transition ${
                        isCorrect
                          ? "border-mint bg-mint/60"
                          : isWrong
                            ? "border-destructive bg-destructive/20"
                            : "bg-card hover:bg-sun/40"
                      } ${choice !== null ? "opacity-90" : ""}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {choice !== null && (
                <p className="mt-3 text-sm">
                  {choice === data.check.correct ? "✅ " : "❌ "}
                  {data.check.explain}
                  {choice !== data.check.correct && (
                    <button onClick={() => setChoice(null)} className="ml-2 underline">
                      Try again
                    </button>
                  )}
                </p>
              )}
            </section>

            {/* Reflect */}
            <section className="card-pop bg-sun/30 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                Reflect
              </div>
              <h2 className="mt-1 font-[family-name:var(--font-display-tf)] text-xl">{data.reflect}</h2>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Write your answer here — for you, not for a grade."
                className="mt-3 min-h-[100px] w-full rounded-xl border border-border bg-card p-3 outline-none focus:ring-2 focus:ring-mint"
              />
            </section>

            {/* Sources */}
            {data.sources.length > 0 && (
              <section className="card-pop p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sources used
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {data.sources.map((s, i) => (
                    <li key={i}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> {s.title || s.host}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="mt-8">
            <AiTeacher context={`${career.name} · ${data.title}`} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!completed && !alreadyDone ? (
              <button
                onClick={onComplete}
                disabled={!canComplete}
                className={`btn-pop text-sm ${canComplete ? "btn-neon" : "cursor-not-allowed opacity-40"}`}
              >
                <Check className="h-4 w-4" /> Mark complete (+{data.xp} XP)
              </button>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  <Check className="h-4 w-4" /> Mastered
                </span>
                <button onClick={onNext} className="btn-pop btn-neon text-sm">
                  {lesson < LESSONS_PER_GRADE ? "Next lesson" : "Next grade"} <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => navigate({ name: "grade", slug, grade })}
              className="ml-auto text-sm text-foreground/60 hover:text-foreground"
            >
              Back to grade
            </button>
          </div>
        </>
      )}
    </div>
  );
}

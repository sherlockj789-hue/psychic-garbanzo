"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, BookOpen, Lightbulb, Repeat, CheckCircle2, ArrowRight } from "lucide-react";

export type SkillLesson = {
  slug: string;
  title: string;
  what: string;
  why: string;
  practice: string;
  example: string;
  keyPoints: string[];
};

export function SkillLessonView({
  slug,
  title,
  onReady,
}: {
  slug: string;
  title: string;
  onReady: () => void;
}) {
  const [data, setData] = useState<SkillLesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [readDone, setReadDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/skill?slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Couldn't load this lesson."))))
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, title]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
        <p className="font-[family-name:var(--font-display-tf)] text-lg">Writing your mini-lesson…</p>
        <p className="text-xs text-muted-foreground">Real, practical content — gathered fresh.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{error ?? "No lesson available."}</p>
        <button
          onClick={() => onReady()}
          className="btn-pop mt-2 text-sm"
        >
          Skip to the game →
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
          1
        </span>
        Learn
        <ArrowRight className="h-3 w-3" />
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground">
          2
        </span>
        Play
      </div>

      <div className="card-pop p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ocean">
          <BookOpen className="h-3.5 w-3.5" /> What it is
        </div>
        <p className="mt-2 leading-relaxed text-foreground/85">{data.what}</p>
      </div>

      <div className="card-pop p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-coral">
          <Lightbulb className="h-3.5 w-3.5" /> Why it matters
        </div>
        <p className="mt-2 leading-relaxed text-foreground/85">{data.why}</p>
      </div>

      <div className="card-pop p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ocean">
          <Repeat className="h-3.5 w-3.5" /> How to practice it
        </div>
        <p className="mt-2 leading-relaxed text-foreground/85">{data.practice}</p>
      </div>

      <div className="card-pop bg-sun/30 p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
          A real example
        </div>
        <p className="mt-2 leading-relaxed text-foreground/85">{data.example}</p>
      </div>

      {data.keyPoints.length > 0 && (
        <div className="card-pop p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Key takeaways
          </div>
          <ul className="mt-3 space-y-2">
            {data.keyPoints.map((p, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-start gap-2 text-sm text-foreground/85"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                <span>{p}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 pt-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={readDone}
            onChange={(e) => setReadDone(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          I read the lesson — I&apos;m ready to play
        </label>
        <button
          onClick={onReady}
          disabled={!readDone}
          className={`btn-pop text-sm ${readDone ? "btn-neon" : "cursor-not-allowed opacity-40"}`}
        >
          <ArrowRight className="h-4 w-4" /> {readDone ? "Play the game" : "Read first to unlock"}
        </button>
        {!readDone && (
          <p className="text-xs text-muted-foreground">
            Check the box above to unlock the game.
          </p>
        )}
      </div>
    </motion.div>
  );
}

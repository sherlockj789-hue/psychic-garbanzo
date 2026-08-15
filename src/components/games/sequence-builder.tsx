"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListOrdered,
  RotateCw,
  Trophy,
  Clock,
  Check,
  X,
  Sparkles,
  Hash,
} from "lucide-react";
import type { SequenceContent } from "@/lib/types";
import {
  GameError,
  GameLoading,
  GameProps,
  clamp,
  formatDuration,
  shuffle,
  useGameFetch,
  useFx,
  FxLayer,
  useShake,
} from "./shared";

/**
 * Sequence Builder — a juiced ordering game (type "sequence").
 *
 * `prompt` at top. The `steps` are shuffled and shown as a column of tappable
 * chips. Player builds the correct order by clicking chips in sequence:
 *   - clicked correctly → locks into "Your sequence" list with a green pop +
 *     checkmark, particle burst, "+1" popup.
 *   - clicked wrong → that chip shakes red, mistake counter++, brief "✗" popup.
 *
 * HUD: mistakes, ⏱ timer (counts up), progress (x/total placed).
 * On complete: show the full correct sequence with numbers, mistakes, time,
 * score (100 - mistakes×15, min 0). "🎉" if 0 mistakes. "Play again".
 * Call onDone(mistakes <= steps.length / 2).
 */

export function SequenceBuilder({ career, topic, onDone, onPlayAgain }: GameProps) {
  const { data, loading, error, retry } = useGameFetch<SequenceContent>(
    "sequence",
    career,
    topic,
  );

  if (loading) return <GameLoading text="Mixing up the steps…" />;
  if (error) return <GameError message={error} onRetry={retry} />;
  if (!data || !Array.isArray(data.steps) || data.steps.length < 3) {
    return (
      <GameError
        message="No sequence came back. Try a new round."
        onRetry={retry}
      />
    );
  }

  return (
    <SequenceBoard
      content={data}
      onDone={onDone}
      onPlayAgain={onPlayAgain}
    />
  );
}

function SequenceBoard({
  content,
  onDone,
  onPlayAgain,
}: {
  content: SequenceContent;
  onDone?: (passed: boolean) => void;
  onPlayAgain: () => void;
}) {
  const total = content.steps.length;

  const [shuffled, setShuffled] = useState<{ text: string; originalIndex: number }[]>(
    () => shuffle(content.steps.map((s, i) => ({ text: s, originalIndex: i }))),
  );
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);

  const fx = useFx();
  const { controls: shakeControls, trigger: shake } = useShake();
  const remainingRef = useRef<HTMLDivElement>(null);

  // Count-up timer. setState lives inside the interval callback (async). The
  // sync `if (done) return;` guard isn't a setState, so the rule is happy.
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 500);
    return () => window.clearInterval(id);
  }, [startTime, done]);

  function clickStep(originalIndex: number, cellEl?: HTMLElement) {
    if (done) return;
    const expected = placed.length;

    // Compute FX position relative to the remaining-list container.
    const container = remainingRef.current;
    let x = 50;
    let y = 50;
    if (container && cellEl) {
      const cr = cellEl.getBoundingClientRect();
      const pr = container.getBoundingClientRect();
      x = cr.left - pr.left + cr.width / 2;
      y = cr.top - pr.top + cr.height / 2;
    }

    if (originalIndex === expected) {
      // Correct! Lock it in with a green pop.
      const newPlaced = [...placed, originalIndex];
      setPlaced(newPlaced);
      fx.burst(x, y, "var(--mint)");
      fx.popup(x, y, `+${newPlaced.length}`, "var(--ink)", "md");

      if (newPlaced.length === total) {
        // Finished — schedule the result screen + onDone.
        window.setTimeout(() => {
          if (!doneRef.current) {
            doneRef.current = true;
            setDone(true);
            const won = mistakes <= total / 2;
            onDone?.(won);
          }
        }, 650);
      }
    } else {
      // Wrong! Shake + bump mistakes + brief "✗".
      setMistakes((m) => m + 1);
      setWrongIdx(originalIndex);
      shake(6);
      fx.popup(x, y, "✗", "var(--destructive)", "md");
      window.setTimeout(() => setWrongIdx(null), 500);
    }
  }

  if (done) {
    return (
      <SequenceResult
        steps={content.steps}
        mistakes={mistakes}
        elapsed={elapsed}
        total={total}
        onPlayAgain={onPlayAgain}
      />
    );
  }

  const remaining = shuffled.filter((s) => !placed.includes(s.originalIndex));
  const progressPct = (placed.length / total) * 100;
  const passed = mistakes <= total / 2;

  return (
    <motion.div animate={shakeControls} className="space-y-3">
      {/* HUD */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="hud !bg-sun/40 !text-ink">
          <Hash className="h-3.5 w-3.5" /> {placed.length}/{total} placed
        </span>
        <span className="hud !bg-coral/20 !text-ink">
          <X className="h-3.5 w-3.5" /> {mistakes} mistake{mistakes === 1 ? "" : "s"}
        </span>
        <span className="hud ml-auto">
          <Clock className="h-3.5 w-3.5" /> {formatDuration(elapsed)}
        </span>
      </div>

      {/* Prompt */}
      <div className="rounded-2xl border border-border bg-ocean/10 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ocean">
          <ListOrdered className="h-3.5 w-3.5" /> Put these in order
        </div>
        <p className="mt-0.5 font-[family-name:var(--font-display-tf)] text-base sm:text-lg">
          {content.prompt}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-mint"
          animate={{ width: `${progressPct}%` }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
        />
      </div>

      {/* Placed list */}
      <div className="card-pop p-4 sm:p-5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Your sequence
        </div>
        <ol className="mt-2 space-y-1.5">
          <AnimatePresence initial={false}>
            {placed.map((origIdx, pos) => (
              <motion.li
                key={origIdx}
                layout
                initial={{ opacity: 0, x: -16, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: [1, 1.06, 1],
                  backgroundColor: ["rgba(132,204,22,0.4)", "rgba(132,204,22,0.4)"],
                }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className="flex items-center gap-3 rounded-xl border border-mint bg-mint/40 px-3 py-2"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 16, delay: 0.05 }}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-bold text-ink"
                >
                  {pos + 1}
                </motion.span>
                <span className="flex-1 text-sm font-medium leading-snug">
                  {content.steps[origIdx]}
                </span>
                <Check className="h-4 w-4 text-ocean" />
              </motion.li>
            ))}
          </AnimatePresence>
          {placed.length === 0 && (
            <li className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
              Click step 1 below to start →
            </li>
          )}
        </ol>
      </div>

      {/* Remaining (shuffled) — wrapped for FX overlay positioning. */}
      <div className="relative">
        <div ref={remainingRef} className="card-pop p-4 sm:p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pick the next step
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <AnimatePresence>
              {remaining.map((s) => {
                const isWrong = wrongIdx === s.originalIndex;
                return (
                  <motion.button
                    key={s.originalIndex}
                    type="button"
                    onClick={(e) =>
                      clickStep(s.originalIndex, e.currentTarget as HTMLElement)
                    }
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={
                      isWrong
                        ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                        : { opacity: 1, scale: 1 }
                    }
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: isWrong ? 0.5 : 0.2 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                      isWrong
                        ? "border-destructive bg-destructive/20"
                        : "border-border bg-card hover:border-ocean/50 hover:bg-sun/30"
                    }`}
                    aria-label={`Place this step: ${s.text}`}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        isWrong
                          ? "bg-destructive text-white"
                          : "bg-muted text-foreground/70"
                      }`}
                    >
                      {isWrong ? <X className="h-3 w-3" /> : "?"}
                    </span>
                    <span className="flex-1 leading-snug">{s.text}</span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
        <FxLayer bursts={fx.bursts} popups={fx.popups} />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Tip:{" "}
        {passed
          ? "You're on track — keep going!"
          : "Too many mistakes will cost you the round. Slow down."}
      </p>
    </motion.div>
  );
}

function SequenceResult({
  steps,
  mistakes,
  elapsed,
  total,
  onPlayAgain,
}: {
  steps: string[];
  mistakes: number;
  elapsed: number;
  total: number;
  onPlayAgain: () => void;
}) {
  const passed = mistakes <= total / 2;
  // Score formula: 100 base, -15 per mistake, min 0.
  const score = clamp(100 - mistakes * 15, 0, 100);
  const perfect = mistakes === 0;
  const stars = score >= 85 ? 3 : score >= 60 ? 2 : 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={`card-pop relative overflow-hidden p-0 ${
        passed ? "border-mint" : "border-coral"
      }`}
    >
      <div
        className={`flex items-center gap-4 px-5 py-5 ${
          passed ? "bg-mint/40" : "bg-sun/40"
        }`}
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${
            passed ? "bg-mint text-ink" : "bg-sun text-ink"
          }`}
        >
          <Trophy className="h-8 w-8" />
        </motion.div>
        <div>
          <div
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              passed ? "text-ocean" : "text-ink/70"
            }`}
          >
            {passed ? "Sequence unlocked" : "Sequence complete"}
          </div>
          <h3 className="font-[family-name:var(--font-display-tf)] text-2xl leading-tight sm:text-3xl">
            {perfect ? "🎉 Perfect order!" : passed ? "Right order, well done!" : "You finished — but messy."}
          </h3>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 + i * 0.1, type: "spring", stiffness: 400 }}
              className={`text-3xl ${i < stars ? "" : "opacity-25 grayscale"}`}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Score" value={String(score)} accent="sun" />
          <Stat label="Mistakes" value={String(mistakes)} accent="coral" />
          <Stat label="Time" value={formatDuration(elapsed)} accent="ocean" />
        </div>

        <div className="mt-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3" /> Correct order
          </div>
          <ol className="mt-2 space-y-1.5">
            {steps.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ocean text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium leading-snug">{s}</span>
              </motion.li>
            ))}
          </ol>
        </div>

        <button
          onClick={onPlayAgain}
          className="btn-pop btn-neon mx-auto mt-5 flex text-sm"
          aria-label="Play a new round"
        >
          <RotateCw className="h-4 w-4" /> Play again
        </button>
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "sun" | "coral" | "ocean";
}) {
  const bg = {
    sun: "bg-sun/50",
    coral: "bg-coral/20",
    ocean: "bg-ocean/15",
  }[accent];
  return (
    <div className={`rounded-xl border border-border p-3 text-center ${bg}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-[family-name:var(--font-display-tf)] text-2xl">
        {value}
      </div>
    </div>
  );
}

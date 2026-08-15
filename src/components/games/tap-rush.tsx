"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Clock,
  Zap,
  Flame,
  RotateCw,
  Trophy,
  Skull,
  Target,
} from "lucide-react";
import type { QuizContent } from "@/lib/types";
import {
  GameError,
  GameLoading,
  GameProps,
  useGameFetch,
  useFx,
  FxLayer,
  useShake,
} from "./shared";

/**
 * Tap Rush — a WHACK-A-MOLE arcade game built on top of the quiz content.
 *
 * The current question/prompt stays pinned at the top. Answer chips (the 4
 * options of the current question, picked at random) POP UP from random holes
 * in a 3×3 grid, stay visible ~1s, then retract. Player taps a popped chip:
 *   - correct chip → squash-pop, green particle burst, "+10 ×N!" popup,
 *     combo++, multiplier rises.
 *   - wrong chip → red flash on that hole, screen shake, lose 1 ❤️, combo reset.
 *   - correct chip retracts untouched → combo reset (forgiving: no life lost).
 *
 * HUD: ❤️×3, ⏱ 60s shrinking bar, Score, 🔥 combo × multiplier.
 * Escalating: as score rises, pop-ups get faster and more wrong chips appear.
 * Advance to next question every ~3 correct taps. End: 0 lives, timer 0, or
 * all questions cleared. onDone(score >= 30 || cleared).
 *
 * Accessibility: number keys 1–9 map to the 9 holes.
 */

const GAME_MS = 60000;
const PASS_SCORE = 30;
const MAX_LIVES = 3;
const TAPS_PER_Q = 3;

type Chip = {
  id: number;
  text: string;
  isCorrect: boolean;
  popping?: boolean;
};

export function TapRush({ career, topic, onDone, onPlayAgain }: GameProps) {
  const { data, loading, error, retry } = useGameFetch<QuizContent>(
    "quiz",
    career,
    topic,
  );

  if (loading) return <GameLoading text="Warming up the holes…" />;
  if (error) return <GameError message={error} onRetry={retry} />;
  if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
    return (
      <GameError message="No questions for this round. Try a new one." onRetry={retry} />
    );
  }

  return (
    <TapBoard
      content={data}
      onDone={onDone}
      onPlayAgain={onPlayAgain}
    />
  );
}

function TapBoard({
  content,
  onDone,
  onPlayAgain,
}: {
  content: QuizContent;
  onDone?: (passed: boolean) => void;
  onPlayAgain: () => void;
}) {
  const total = content.questions.length;
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_MS);
  const [holes, setHoles] = useState<(Chip | null)[]>(() => Array(9).fill(null));
  const [correctTaps, setCorrectTaps] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [cleared, setCleared] = useState(false);
  const doneRef = useRef(false);

  const fx = useFx();
  const { controls: shakeControls, trigger: shake } = useShake();
  const containerRef = useRef<HTMLDivElement>(null);

  const q = content.questions[qIndex];
  const multiplier = 1 + Math.floor(combo / 3);

  // Difficulty curve — rises with score.
  const wrongProb = Math.min(0.65, 0.3 + score * 0.004);
  const spawnInterval = Math.max(560, 1100 - score * 4);
  const visibleMs = Math.max(950, 1500 - score * 3);
  const maxConcurrent = Math.min(4, 1 + Math.floor(score / 25));

  // Refs for the spawn loop to read fresh state without re-creating the loop.
  const holesRef = useRef(holes);
  const qRef = useRef(q);
  const stateRef = useRef({ wrongProb, visibleMs, maxConcurrent, qIndex, total, correctTaps });
  useEffect(() => {
    holesRef.current = holes;
  });
  useEffect(() => {
    qRef.current = q;
  });
  useEffect(() => {
    stateRef.current = {
      wrongProb,
      visibleMs,
      maxConcurrent,
      qIndex,
      total,
      correctTaps,
    };
  });

  // Track max combo via state (updated in the tap event handler — lint-safe).
  // No ref access during render.

  // Spawn loop — ticks fast; on each tick, maybe fill an empty hole.
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      const s = stateRef.current;
      const h = holesRef.current;
      const active = h.filter(Boolean).length;
      if (active >= s.maxConcurrent) return;
      const emptyIdx: number[] = [];
      for (let i = 0; i < 9; i++) if (!h[i]) emptyIdx.push(i);
      if (emptyIdx.length === 0) return;
      const idx = emptyIdx[Math.floor(Math.random() * emptyIdx.length)];
      const question = qRef.current;
      if (!question || !question.options || question.options.length < 4) return;
      const isCorrect = Math.random() > s.wrongProb;
      let text: string;
      if (isCorrect) {
        text = question.options[question.correct];
      } else {
        const wrongOpts = question.options.filter(
          (o, i) => i !== question.correct && o,
        );
        text = wrongOpts[Math.floor(Math.random() * wrongOpts.length)];
      }
      const chipId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
      const chip: Chip = { id: chipId, text, isCorrect };
      setHoles((prev) => {
        if (prev[idx]) return prev; // slot got filled by a parallel spawn
        const next = prev.slice();
        next[idx] = chip;
        return next;
      });
      // Schedule retract (untouched chip disappears).
      window.setTimeout(
        () => {
          setHoles((prev) => {
            const c = prev[idx];
            if (!c || c.id !== chipId || c.popping) return prev;
            if (c.isCorrect) {
              // Missed a correct chip → combo reset (forgiving: no life lost).
              setCombo(0);
            }
            const next = prev.slice();
            next[idx] = null;
            return next;
          });
        },
        s.visibleMs,
      );
    }, Math.max(280, spawnInterval / 2));
    return () => window.clearInterval(id);
  }, [done, spawnInterval]);

  // Countdown timer.
  useEffect(() => {
    if (done) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      const remaining = Math.max(0, GAME_MS - (Date.now() - start));
      setTimeLeft(remaining);
      if (remaining <= 0) window.clearInterval(id);
    }, 100);
    return () => window.clearInterval(id);
  }, [done]);

  // End conditions: 0 lives, timer 0. (Question-cleared handled in advanceQuestion.)
  useEffect(() => {
    if (done || doneRef.current) return;
    if (lives <= 0 || timeLeft <= 0) {
      const passed = lives > 0 ? true : score >= PASS_SCORE;
      const t = window.setTimeout(() => {
        doneRef.current = true;
        setDone(true);
        setWon(passed);
        onDone?.(passed);
      }, 300);
      return () => window.clearTimeout(t);
    }
  }, [lives, timeLeft, done, score, onDone]);

  function advanceQuestion() {
    setHoles(Array(9).fill(null));
    setCorrectTaps(0);
    if (qIndex + 1 >= total) {
      // Cleared all questions — win!
      if (!doneRef.current) {
        doneRef.current = true;
        setDone(true);
        setWon(true);
        setCleared(true);
        onDone?.(true);
      }
    } else {
      setQIndex((i) => i + 1);
    }
  }

  function tap(holeIdx: number) {
    if (done) return;
    const chip = holesRef.current[holeIdx];
    if (!chip || chip.popping) return;

    // Mark chip as popping → triggers squash animation.
    setHoles((prev) =>
      prev.map((c, i) => (i === holeIdx && c ? { ...c, popping: true } : c)),
    );

    // Compute hole center in container coords for FX placement.
    const container = containerRef.current;
    let x = 50;
    let y = 50;
    if (container) {
      const cell = container.children[holeIdx] as HTMLElement | undefined;
      if (cell) {
        const cr = cell.getBoundingClientRect();
        const pr = container.getBoundingClientRect();
        x = cr.left - pr.left + cr.width / 2;
        y = cr.top - pr.top + cr.height / 2;
      }
    }

    if (chip.isCorrect) {
      const pts = 10 * multiplier;
      const newCombo = combo + 1;
      setScore((s) => s + pts);
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      fx.burst(x, y, "var(--mint)");
      fx.popup(
        x,
        y,
        `+${pts}${multiplier > 1 ? ` ×${multiplier}` : ""}`,
        "var(--ink)",
        "lg",
      );
      const next = correctTaps + 1;
      setCorrectTaps(next);
      if (next >= TAPS_PER_Q) {
        // Brief beat for the squash to land, then advance.
        window.setTimeout(() => advanceQuestion(), 360);
      }
    } else {
      setLives((l) => Math.max(0, l - 1));
      setCombo(0);
      shake(10);
      fx.burst(x, y, "var(--destructive)");
      fx.popup(x, y, "✗", "var(--destructive)", "lg");
    }

    // Remove chip after the squash-pop finishes.
    window.setTimeout(() => {
      setHoles((prev) =>
        prev.map((c, i) => (i === holeIdx ? null : c)),
      );
    }, 320);
  }

  // Latest tap function in a ref so the keydown listener stays stable.
  const tapRef = useRef(tap);
  useEffect(() => {
    tapRef.current = tap;
  });

  // Keyboard 1-9 → tap the corresponding hole.
  useEffect(() => {
    if (done) return;
    function onKey(e: KeyboardEvent) {
      const k = parseInt(e.key, 10);
      if (!isNaN(k) && k >= 1 && k <= 9) {
        e.preventDefault();
        tapRef.current(k - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done]);

  if (done) {
    return (
      <TapResult
        score={score}
        maxCombo={maxCombo}
        won={won}
        cleared={cleared}
        total={total}
        onPlayAgain={onPlayAgain}
      />
    );
  }

  const timePct = (timeLeft / GAME_MS) * 100;
  const timeLow = timePct < 25;

  return (
    <motion.div animate={shakeControls} className="space-y-3">
      {/* HUD */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="hud !bg-coral/15 !text-ink">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart
              key={i}
              className={`h-3.5 w-3.5 ${i < lives ? "fill-coral text-coral" : "text-muted-foreground/40"}`}
            />
          ))}
        </span>
        <span className="hud !bg-sun/40 !text-ink">
          <Zap className="h-3.5 w-3.5" /> {score}
        </span>
        <AnimatePresence mode="popLayout">
          {combo > 0 && (
            <motion.span
              key={combo}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className={`hud ${combo >= 3 ? "!bg-coral !text-white" : "!bg-muted"}`}
            >
              <Flame className="h-3.5 w-3.5" /> {combo} ×{multiplier}
            </motion.span>
          )}
        </AnimatePresence>
        <span className="hud ml-auto">
          <Target className="h-3.5 w-3.5" /> {qIndex + 1}/{total}
        </span>
      </div>

      {/* Timer bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full ${timeLow ? "bg-coral" : "bg-mint"}`}
          animate={{ width: `${timePct}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>

      {/* Pinned question prompt */}
      <div className="card-pop p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tap the right answer
        </div>
        <h3 className="mt-1 font-[family-name:var(--font-display-tf)] text-base leading-snug sm:text-lg">
          {q?.q}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            <Clock className="mr-1 inline h-3 w-3" />
            {Math.ceil(timeLeft / 1000)}s
          </span>
          <span>
            {correctTaps}/{TAPS_PER_Q} taps to advance
          </span>
          <span className="ml-auto hidden sm:inline">
            Press 1–9 to tap a hole
          </span>
        </div>
      </div>

      {/* 3×3 grid of holes */}
      <div className="relative">
        <div
          ref={containerRef}
          className="grid grid-cols-3 gap-2 sm:gap-3"
        >
          {holes.map((chip, i) => (
            <Hole
              key={i}
              holeIdx={i}
              chip={chip}
              onTap={(idx) => tapRef.current(idx)}
            />
          ))}
        </div>
        <FxLayer bursts={fx.bursts} popups={fx.popups} />
      </div>
    </motion.div>
  );
}

function Hole({
  chip,
  holeIdx,
  onTap,
}: {
  chip: Chip | null;
  holeIdx: number;
  onTap: (idx: number) => void;
}) {
  return (
    <div className="relative aspect-square select-none">
      {/* Hole mound — dark rounded circle */}
      <div className="absolute inset-x-1 bottom-1 top-4 rounded-[50%] bg-ink/85 shadow-[inset_0_6px_14px_rgba(0,0,0,0.45)]" />
      <div className="absolute inset-x-3 bottom-2 top-7 rounded-[50%] bg-ink" />
      {/* Dirt rim */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 rounded-[50%] bg-coral/30" />

      <AnimatePresence>
        {chip && (
          <motion.button
            type="button"
            onClick={() => onTap(holeIdx)}
            initial={{ y: "110%", scale: 0.5, opacity: 0 }}
            animate={
              chip.popping
                ? chip.isCorrect
                  ? {
                      scale: [1, 1.35, 0],
                      rotate: [0, 18, 0],
                      y: "25%",
                      opacity: [1, 1, 0],
                    }
                  : {
                      scale: [1, 1.2, 0],
                      rotate: [0, -12, 0],
                      y: "25%",
                      opacity: [1, 1, 0],
                    }
                : { y: "5%", scale: 1, opacity: 1 }
            }
            exit={{ y: "130%", scale: 0.4, opacity: 0 }}
            transition={
              chip.popping
                ? { duration: 0.32, ease: "easeOut" }
                : { type: "spring", stiffness: 480, damping: 22 }
            }
            className={`absolute left-1/2 top-1/2 z-10 flex max-w-[90%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 px-2 py-2 text-center text-[10px] font-bold leading-tight shadow-pop-sm sm:text-xs ${
              chip.popping
                ? chip.isCorrect
                  ? "border-mint bg-mint text-ink"
                  : "border-destructive bg-destructive text-white"
                : "border-border bg-card text-ink hover:border-ocean/40 hover:bg-sun/30"
            }`}
            aria-label={`Hole ${holeIdx + 1}${chip ? `: ${chip.text}` : ""}`}
          >
            {chip.text}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function TapResult({
  score,
  maxCombo,
  won,
  cleared,
  total,
  onPlayAgain,
}: {
  score: number;
  maxCombo: number;
  won: boolean;
  cleared: boolean;
  total: number;
  onPlayAgain: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={`card-pop overflow-hidden p-0 ${won ? "border-mint" : "border-coral"}`}
    >
      <div
        className={`flex items-center gap-4 px-5 py-5 ${
          won ? "bg-mint/40" : "bg-coral/15"
        }`}
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${
            won ? "bg-mint text-ink" : "bg-coral text-white"
          }`}
        >
          {won ? <Trophy className="h-8 w-8" /> : <Skull className="h-8 w-8" />}
        </motion.div>
        <div>
          <div
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              won ? "text-ocean" : "text-destructive"
            }`}
          >
            {cleared ? "All clear" : won ? "Time's up — nice run" : "Game over"}
          </div>
          <h3 className="font-[family-name:var(--font-display-tf)] text-2xl leading-tight sm:text-3xl">
            {cleared
              ? "You cleared it all! 🎉"
              : won
                ? "Solid whacking!"
                : "Out of lives!"}
          </h3>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-3">
          <ResultStat label="Final score" value={String(score)} accent="sun" />
          <ResultStat
            label="Max combo"
            value={`${maxCombo} 🔥`}
            accent="coral"
          />
          <ResultStat
            label="Questions"
            value={`${cleared ? total : "—"}${cleared ? `/${total}` : ""}`}
            accent="mint"
          />
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {won
            ? "You're locking in real career knowledge, fast."
            : `Hit ${PASS_SCORE}+ points to pass — give it another whirl.`}
        </p>

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

function ResultStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "sun" | "mint" | "coral";
}) {
  const bg = {
    sun: "bg-sun/50",
    mint: "bg-mint/50",
    coral: "bg-coral/20",
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

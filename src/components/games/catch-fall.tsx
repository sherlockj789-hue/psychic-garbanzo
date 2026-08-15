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
  MoveHorizontal,
  Check,
} from "lucide-react";
import type { ArcadeContent } from "@/lib/types";
import {
  GameError,
  GameLoading,
  GameProps,
  useGameFetch,
  useFx,
  FxLayer,
  useShake,
  clamp,
} from "./shared";

/**
 * Catch Fall — a real arcade basket-catch game (type "arcade").
 *
 * The `prompt` is pinned at the top ("Catch: tools a plumber actually uses").
 * A basket at the bottom moves left/right via arrow keys, A/D, mouse move, or
 * touch drag. Item chips spawn at random x at the top and FALL with increasing
 * speed (gravity-like acceleration). Items rotate slightly as they fall.
 *
 * Basket overlap → caught:
 *   - goodTarget → +points × multiplier, green sparkle burst, "+10" popup, combo++.
 *   - badTarget → red flash, screen shake, lose 1 ❤️ (start with 3), combo reset.
 *
 * Item falls past the bottom → missed:
 *   - goodTarget missed → combo reset (forgiving: no life lost).
 *   - badTarget missed → nothing (you successfully avoided it).
 *
 * HUD: ❤️×3, Score, 🔥 combo, ⏱ 45s timer.
 * Escalating: spawn rate and fall speed increase over time.
 * End: 0 lives, timer 0, or 15 good catches. onDone(score >= 40 || 15 caught).
 *
 * All items look identical (neutral chip) — the player must READ the text and
 * decide whether it fits the prompt.
 */

const GAME_MS = 45000;
const PASS_SCORE = 40;
const MAX_LIVES = 3;
const TARGET_GOOD = 15; // good catches to "clear"
const BASKET_W = 22; // percent of play area width
const BASKET_Y = 86; // percent (top edge of basket)
const PLAY_H = 440; // px, fallback height

type Item = {
  id: number;
  text: string;
  isGood: boolean;
  x: number; // percent (0-100)
  y: number; // percent (0-100)
  vy: number; // percent per ~16ms frame
  rot: number;
};

export function CatchFall({ career, topic, onDone, onPlayAgain }: GameProps) {
  const { data, loading, error, retry } = useGameFetch<ArcadeContent>(
    "arcade",
    career,
    topic,
  );

  if (loading) return <GameLoading text="Setting up the conveyor…" />;
  if (error) return <GameError message={error} onRetry={retry} />;
  if (
    !data ||
    !Array.isArray(data.goodTargets) ||
    !Array.isArray(data.badTargets) ||
    data.goodTargets.length === 0
  ) {
    return (
      <GameError message="No items to catch. Try a new round." onRetry={retry} />
    );
  }

  return (
    <CatchBoard
      content={data}
      onDone={onDone}
      onPlayAgain={onPlayAgain}
    />
  );
}

function CatchBoard({
  content,
  onDone,
  onPlayAgain,
}: {
  content: ArcadeContent;
  onDone?: (passed: boolean) => void;
  onPlayAgain: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [basketX, setBasketX] = useState(50 - BASKET_W / 2);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_MS);
  const [caught, setCaught] = useState(0);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [maxCombo, setMaxCombo] = useState(0);
  const doneRef = useRef(false);

  const fx = useFx();
  const { controls: shakeControls, trigger: shake } = useShake();
  const containerRef = useRef<HTMLDivElement>(null);

  const multiplier = 1 + Math.floor(combo / 3);

  // Refs for the rAF game loop to read fresh state without re-creating the loop.
  const itemsRef = useRef<Item[]>(items);
  const basketXRef = useRef(basketX);
  const keysRef = useRef<Record<string, boolean>>({});
  const elapsedRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const fxRef = useRef(fx);
  const shakeRef = useRef(shake);
  const multRef = useRef(multiplier);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);

  useEffect(() => {
    itemsRef.current = items;
  });
  useEffect(() => {
    basketXRef.current = basketX;
  });
  useEffect(() => {
    fxRef.current = fx;
  });
  useEffect(() => {
    shakeRef.current = shake;
  });
  useEffect(() => {
    multRef.current = multiplier;
  });

  // Game loop — requestAnimationFrame. setState inside rAF callback is async
  // (not synchronous in the effect body), so the set-state-in-effect rule is
  // satisfied. Same pattern as the existing setInterval timers.
  useEffect(() => {
    if (done) return;
    let raf = 0;
    let last = performance.now();
    const goodPool = content.goodTargets;
    const badPool = content.badTargets;
    function loop(t: number) {
      const dt = Math.min(50, t - last);
      last = t;
      elapsedRef.current += dt;
      const elapsed = elapsedRef.current;

      // Difficulty curve — ramps up over ~30s.
      const gravity = 0.0045 + Math.min(0.009, (elapsed / 1000) * 0.00022);
      const initialVy = 0.22 + Math.min(0.45, (elapsed / 1000) * 0.013);
      const spawnEvery = Math.max(540, 1300 - (elapsed / 1000) * 18);

      // Spawn a new item.
      if (t - lastSpawnRef.current > spawnEvery) {
        lastSpawnRef.current = t;
        const isGood = Math.random() > 0.35; // ~65% good, ~35% bad
        const pool = isGood ? goodPool : badPool;
        if (pool && pool.length > 0) {
          const text = pool[Math.floor(Math.random() * pool.length)];
          const x = 6 + Math.random() * 84;
          const newItem: Item = {
            id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
            text,
            isGood,
            x,
            y: -6,
            vy: initialVy,
            rot: (Math.random() - 0.5) * 4,
          };
          itemsRef.current = [...itemsRef.current, newItem];
        }
      }

      // Keyboard basket movement (continuous).
      const kbSpeed = 0.16 * dt;
      if (keysRef.current["arrowleft"] || keysRef.current["a"]) {
        basketXRef.current = Math.max(0, basketXRef.current - kbSpeed);
      }
      if (keysRef.current["arrowright"] || keysRef.current["d"]) {
        basketXRef.current = Math.min(
          100 - BASKET_W,
          basketXRef.current + kbSpeed,
        );
      }

      // Update items, check collisions.
      const w = containerRef.current?.clientWidth ?? 0;
      const h = containerRef.current?.clientHeight ?? PLAY_H;
      const newItems: Item[] = [];
      for (const item of itemsRef.current) {
        const ni: Item = {
          ...item,
          y: item.y + item.vy * (dt / 16),
          vy: item.vy + gravity * (dt / 16),
          rot: item.rot + 0.08 * (dt / 16),
        };

        // Basket collision (basket spans y BASKET_Y .. BASKET_Y+8).
        if (ni.y >= BASKET_Y - 2 && ni.y <= BASKET_Y + 8) {
          const bx = basketXRef.current;
          if (ni.x >= bx - 4 && ni.x <= bx + BASKET_W + 4) {
            // Caught!
            const fx = fxRef.current;
            const px = (ni.x / 100) * w;
            const py = (BASKET_Y / 100) * h;
            if (ni.isGood) {
              const pts = 10 * multRef.current;
              comboRef.current += 1;
              const nc = comboRef.current;
              setScore((s) => s + pts);
              setCombo(nc);
              if (nc > maxComboRef.current) {
                maxComboRef.current = nc;
                setMaxCombo(nc);
              }
              setCaught((n) => n + 1);
              fx.burst(px, py, "var(--mint)");
              fx.popup(
                px,
                py,
                `+${pts}${multRef.current > 1 ? ` ×${multRef.current}` : ""}`,
                "var(--ink)",
                "lg",
              );
            } else {
              comboRef.current = 0;
              setLives((l) => Math.max(0, l - 1));
              setCombo(0);
              shakeRef.current(10);
              fx.burst(px, py, "var(--destructive)");
              fx.popup(px, py, "✗", "var(--destructive)", "lg");
            }
            continue; // remove (caught)
          }
        }

        // Off-screen past bottom.
        if (ni.y > 106) {
          if (ni.isGood) {
            comboRef.current = 0;
            setCombo(0); // missed a good one
          }
          continue;
        }

        newItems.push(ni);
      }
      itemsRef.current = newItems;
      setItems(newItems);
      setBasketX(basketXRef.current);

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [done, content.goodTargets, content.badTargets]);

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

  // End conditions: 0 lives, timer 0, or 15 caught.
  useEffect(() => {
    if (done || doneRef.current) return;
    const hitClear = caught >= TARGET_GOOD;
    if (lives <= 0 || timeLeft <= 0 || hitClear) {
      const passed = hitClear || (lives > 0 && score >= PASS_SCORE);
      const t = window.setTimeout(() => {
        doneRef.current = true;
        setDone(true);
        setWon(passed);
        if (hitClear) setCleared(true);
        onDone?.(passed);
      }, 300);
      return () => window.clearTimeout(t);
    }
  }, [lives, timeLeft, caught, done, score, onDone]);

  // Keyboard listeners for basket movement.
  useEffect(() => {
    if (done) return;
    function down(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d"].includes(k)) {
        keysRef.current[k] = true;
        e.preventDefault();
      }
    }
    function up(e: KeyboardEvent) {
      keysRef.current[e.key.toLowerCase()] = false;
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [done]);

  // Pointer (mouse + touch + pen) basket movement.
  function onPointerMove(e: React.PointerEvent) {
    if (done) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100 - BASKET_W / 2;
    basketXRef.current = clamp(x, 0, 100 - BASKET_W);
    setBasketX(basketXRef.current);
  }

  if (done) {
    return (
      <CatchResult
        score={score}
        maxCombo={maxCombo}
        caught={caught}
        target={TARGET_GOOD}
        won={won}
        cleared={cleared}
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
        <span className="hud !bg-mint/40 !text-ink">
          <Check className="h-3.5 w-3.5" /> {caught}/{TARGET_GOOD}
        </span>
        <span className="hud ml-auto">
          <Clock className="h-3.5 w-3.5" /> {Math.ceil(timeLeft / 1000)}s
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

      {/* Prompt */}
      <div className="card-pop p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Catch the right ones
        </div>
        <h3 className="mt-0.5 font-[family-name:var(--font-display-tf)] text-base leading-snug sm:text-lg">
          {content.prompt}
        </h3>
      </div>

      {/* Play area */}
      <div
        ref={containerRef}
        onPointerMove={onPointerMove}
        className="relative h-[420px] w-full touch-none overflow-hidden rounded-2xl border-2 border-border sm:h-[480px]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--sun) 30%, var(--background)) 0%, color-mix(in oklab, var(--mint) 22%, var(--background)) 60%, color-mix(in oklab, var(--ocean) 16%, var(--background)) 100%)",
        }}
      >
        {/* Falling items — all identical-looking; the player must read text. */}
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute max-w-[88px] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-border bg-card px-2 py-1 text-center text-[10px] font-bold leading-tight shadow-pop-sm sm:text-[11px]"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `translate(-50%, -50%) rotate(${item.rot}deg)`,
              color: "var(--ink)",
            }}
          >
            {item.text}
          </div>
        ))}

        {/* Basket */}
        <div
          className="absolute z-20 transition-none"
          style={{
            left: `${basketX}%`,
            top: `${BASKET_Y}%`,
            width: `${BASKET_W}%`,
          }}
        >
          {/* Catch lip */}
          <div className="mx-auto h-2 w-full rounded-t-full bg-ocean/50" />
          {/* Main bowl */}
          <div className="mx-auto flex h-7 w-full items-center justify-center rounded-b-2xl rounded-t-md bg-ocean shadow-pop-sm">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">
              catch
            </span>
          </div>
        </div>

        {/* FX overlay */}
        <FxLayer bursts={fx.bursts} popups={fx.popups} />

        {/* Controls hint */}
        <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-ink/50">
          <MoveHorizontal className="mr-1 inline h-3 w-3" />
          ← → · A/D · drag
        </div>
      </div>
    </motion.div>
  );
}

function CatchResult({
  score,
  maxCombo,
  caught,
  target,
  won,
  cleared,
  onPlayAgain,
}: {
  score: number;
  maxCombo: number;
  caught: number;
  target: number;
  won: boolean;
  cleared: boolean;
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
            {cleared ? "All caught" : won ? "Time's up — nice catch" : "Game over"}
          </div>
          <h3 className="font-[family-name:var(--font-display-tf)] text-2xl leading-tight sm:text-3xl">
            {cleared ? "Basket master! 🎉" : won ? "Solid catching!" : "Out of lives!"}
          </h3>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-3">
          <ResultStat label="Final score" value={String(score)} accent="sun" />
          <ResultStat label="Caught" value={`${caught}/${target}`} accent="mint" />
          <ResultStat label="Max combo" value={`${maxCombo} 🔥`} accent="coral" />
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {won
            ? "You're recognizing the right moves fast."
            : `Hit ${PASS_SCORE}+ points to pass — try again.`}
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  RotateCw,
  Trophy,
  Clock,
  Footprints,
  Sparkles,
  Check,
  Flame,
  Skull,
} from "lucide-react";
import type { MemoryContent } from "@/lib/types";
import {
  GameError,
  GameLoading,
  GameProps,
  formatDuration,
  shuffle,
  useGameFetch,
  useFx,
  FxLayer,
  Confetti,
  useShake,
} from "./shared";

/**
 * Memory Match — a juiced flip-and-match game (type "memory").
 *
 * Built from REAL career term ↔ definition pairs (from /api/game?type=memory).
 * Card flip animation (rotateY 0→180). On click, flip up. Two flipped:
 *   - match (term ↔ its meaning) → pulse green, particle burst, stay up, combo++.
 *   - no match → brief red shake, flip back after 0.8s.
 *
 * HUD: Moves, ⏱ timer (counts UP), 🔥 combo, matches found / total.
 * Time pressure: a countdown bar (90s) — if it runs out, game over.
 * Win: all matched → big celebration (confetti), "🎉 All matched!".
 */

const MAX_PAIRS = 6;
const GAME_MS = 90000; // 90s countdown

type Card = {
  uid: string;
  pairId: number;
  side: "a" | "b";
  text: string;
  matched: boolean;
};

export function MemoryMatch({ career, topic, onDone, onPlayAgain }: GameProps) {
  const { data, loading, error, retry } = useGameFetch<MemoryContent>(
    "memory",
    career,
    topic,
  );

  const pairs = useMemo(() => {
    if (!data || !Array.isArray(data.pairs)) return [];
    return data.pairs
      .filter((p) => p.term && p.def)
      .slice(0, MAX_PAIRS)
      .map((p, i) => ({
        pairId: i,
        a: p.term,
        b: p.def,
      }));
  }, [data]);

  if (loading) return <GameLoading text="Shuffling the deck…" />;
  if (error) return <GameError message={error} onRetry={retry} />;
  if (pairs.length === 0) {
    return (
      <GameError
        message="No terms available for memory match. Try a new round."
        onRetry={retry}
      />
    );
  }

  return (
    <MemoryBoard pairs={pairs} prompt={data?.prompt} onDone={onDone} onPlayAgain={onPlayAgain} />
  );
}

function MemoryBoard({
  pairs,
  prompt,
  onDone,
  onPlayAgain,
}: {
  pairs: { pairId: number; a: string; b: string }[];
  prompt?: string;
  onDone?: (passed: boolean) => void;
  onPlayAgain: () => void;
}) {
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(pairs));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_MS);
  const [allMatched, setAllMatched] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [maxCombo, setMaxCombo] = useState(0);
  const doneRef = useRef(false);
  const lockedRef = useRef(false);

  const fx = useFx();
  const { controls: shakeControls, trigger: shake } = useShake();
  const gridRef = useRef<HTMLDivElement>(null);

  // Count-up timer (for display).
  useEffect(() => {
    if (allMatched || timeUp) return;
    const id = window.setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 500);
    return () => window.clearInterval(id);
  }, [startTime, allMatched, timeUp]);

  // Countdown timer (for time pressure).
  useEffect(() => {
    if (allMatched || timeUp) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      const remaining = Math.max(0, GAME_MS - (Date.now() - start));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(id);
        setTimeUp(true);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [allMatched, timeUp]);

  // Time-up = game over. setState inside setTimeout (async — lint-safe).
  useEffect(() => {
    if (allMatched || doneRef.current) return;
    if (timeUp) {
      const t = window.setTimeout(() => {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.(false);
        }
      }, 400);
      return () => window.clearTimeout(t);
    }
  }, [timeUp, allMatched, onDone]);

  function clickCard(uid: string) {
    if (lockedRef.current || allMatched || timeUp) return;
    if (flipped.includes(uid)) return;
    const card = deck.find((c) => c.uid === uid);
    if (!card || card.matched) return;

    const nextFlipped = [...flipped, uid];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [uid1, uid2] = nextFlipped;
      const c1 = deck.find((c) => c.uid === uid1);
      const c2 = deck.find((c) => c.uid === uid2);

      if (c1 && c2 && c1.pairId === c2.pairId && c1.side !== c2.side) {
        // Match — flip them green, particle burst, combo++.
        const newDeck = deck.map((c) =>
          c.uid === uid1 || c.uid === uid2 ? { ...c, matched: true } : c,
        );

        // Particle burst at the second card's position.
        const container = gridRef.current;
        if (container) {
          const idx = newDeck.findIndex((c) => c.uid === uid2);
          const cell = container.children[idx] as HTMLElement | undefined;
          if (cell) {
            const cr = cell.getBoundingClientRect();
            const pr = container.getBoundingClientRect();
            const x = cr.left - pr.left + cr.width / 2;
            const y = cr.top - pr.top + cr.height / 2;
            fx.burst(x, y, "var(--mint)");
            const newCombo = combo + 1;
            fx.popup(
              x,
              y,
              newCombo > 1 ? `Match! ×${newCombo}` : "Match!",
              "var(--ink)",
              "md",
            );
          }
        }

        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((m) => Math.max(m, newCombo));

        window.setTimeout(() => {
          setDeck(newDeck);
          setFlipped([]);
          if (newDeck.every((c) => c.matched) && !doneRef.current) {
            doneRef.current = true;
            setAllMatched(true);
            onDone?.(true);
          }
        }, 220);
      } else {
        // No match — brief red shake, flip back after 0.8s.
        lockedRef.current = true;
        setCombo(0);
        shake(6);
        window.setTimeout(() => {
          setFlipped([]);
          lockedRef.current = false;
        }, 800);
      }
    }
  }

  const matchedPairIds = new Set(
    deck.filter((c) => c.matched).map((c) => c.pairId),
  );
  const matchedPairs = matchedPairIds.size;
  const totalPairs = pairs.length;
  const timePct = (timeLeft / GAME_MS) * 100;
  const timeLow = timePct < 25;

  // Time-up screen.
  if (timeUp && !allMatched) {
    return (
      <MemoryResult
        moves={moves}
        elapsed={elapsed}
        pairs={matchedPairs}
        totalPairs={totalPairs}
        maxCombo={maxCombo}
        timedOut
        onPlayAgain={onPlayAgain}
      />
    );
  }

  // Win screen.
  if (allMatched) {
    return (
      <MemoryResult
        moves={moves}
        elapsed={elapsed}
        pairs={matchedPairs}
        totalPairs={totalPairs}
        maxCombo={maxCombo}
        onPlayAgain={onPlayAgain}
      />
    );
  }

  return (
    <motion.div animate={shakeControls} className="space-y-3">
      {/* HUD */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="hud !bg-mint/40 !text-ink">
          <Sparkles className="h-3.5 w-3.5" /> {matchedPairs}/{totalPairs}
        </span>
        <span className="hud">
          <Footprints className="h-3.5 w-3.5" /> {moves} moves
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
              <Flame className="h-3.5 w-3.5" /> {combo}
            </motion.span>
          )}
        </AnimatePresence>
        <span className="hud ml-auto">
          <Clock className="h-3.5 w-3.5" /> {formatDuration(elapsed)}
        </span>
      </div>

      {/* Countdown bar (time pressure) */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full ${timeLow ? "bg-coral" : "bg-ocean"}`}
          animate={{ width: `${timePct}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>
      <div className="text-center text-[10px] text-muted-foreground">
        ⏱ {Math.ceil(timeLeft / 1000)}s left to clear the deck
      </div>

      {/* Card grid */}
      <div className="relative">
        <div
          ref={gridRef}
          className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3"
        >
          {deck.map((card) => (
            <CardTile
              key={card.uid}
              card={card}
              revealed={flipped.includes(card.uid) || card.matched}
              onClick={() => clickCard(card.uid)}
            />
          ))}
        </div>
        <FxLayer bursts={fx.bursts} popups={fx.popups} />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {prompt ?? "Match each term to its meaning."} 🔍 Flip two cards — a term and its definition are a pair.
      </p>
    </motion.div>
  );
}

function CardTile({
  card,
  revealed,
  onClick,
}: {
  card: Card;
  revealed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={card.matched}
      aria-label={revealed ? card.text : "Face-down card — flip to reveal"}
      className="relative aspect-[3/4] w-full select-none"
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          rotateY: revealed ? 180 : 0,
          scale: card.matched ? 0.95 : 1,
        }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {/* Face-down */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-border bg-gradient-to-br from-ocean/15 to-mint/20 text-2xl shadow-pop-sm"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Brain className="h-7 w-7 text-ocean/60" />
          </motion.div>
        </div>
        {/* Face-up */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition-colors ${
            card.matched
              ? "border-mint bg-mint/50"
              : "border-ocean/40 bg-card"
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {card.matched && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="absolute right-1 top-1"
            >
              <Check className="h-3.5 w-3.5 text-ocean" />
            </motion.div>
          )}
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              card.side === "a" ? "text-coral" : "text-ocean"
            }`}
          >
            {card.side === "a" ? "Term" : "Meaning"}
          </span>
          <span className="mt-1 line-clamp-4 text-[11px] font-medium leading-tight text-ink sm:text-xs">
            {card.text}
          </span>
        </div>
      </motion.div>
    </button>
  );
}

function MemoryResult({
  moves,
  elapsed,
  pairs,
  totalPairs,
  maxCombo,
  timedOut,
  onPlayAgain,
}: {
  moves: number;
  elapsed: number;
  pairs: number;
  totalPairs: number;
  maxCombo: number;
  timedOut?: boolean;
  onPlayAgain: () => void;
}) {
  const efficiency = pairs > 0 ? pairs / moves : 0;
  const stars = efficiency >= 0.8 ? 3 : efficiency >= 0.55 ? 2 : 1;
  const won = !timedOut && pairs === totalPairs;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={`card-pop relative overflow-hidden p-0 ${
        won ? "border-mint" : "border-coral"
      }`}
    >
      {won && <Confetti />}
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
          {won ? <Trophy className="h-8 w-8" /> : timedOut ? <Clock className="h-8 w-8" /> : <Skull className="h-8 w-8" />}
        </motion.div>
        <div>
          <div
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              won ? "text-ocean" : "text-destructive"
            }`}
          >
            {won ? "All matched" : timedOut ? "Time's up" : "Game over"}
          </div>
          <h3 className="font-[family-name:var(--font-display-tf)] text-2xl leading-tight sm:text-3xl">
            {won ? "🎉 All matched!" : timedOut ? "So close!" : "Out of moves!"}
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
              transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 400 }}
              className={`text-3xl ${i < stars ? "" : "opacity-25 grayscale"}`}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultStat label="Pairs" value={`${pairs}/${totalPairs}`} accent="mint" />
          <ResultStat label="Moves" value={String(moves)} accent="sun" />
          <ResultStat label="Time" value={formatDuration(elapsed)} accent="ocean" />
          <ResultStat label="Max combo" value={`${maxCombo} 🔥`} accent="coral" />
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {won
            ? "You cleared all the pairs — sharp memory!"
            : timedOut
              ? `You matched ${pairs}/${totalPairs} before time ran out.`
              : "Try again — you've got this."}
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
  accent: "sun" | "mint" | "ocean" | "coral";
}) {
  const bg = {
    sun: "bg-sun/50",
    mint: "bg-mint/50",
    ocean: "bg-ocean/15",
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

function buildDeck(pairs: { pairId: number; a: string; b: string }[]): Card[] {
  const cards: Card[] = [];
  for (const p of pairs) {
    cards.push({
      uid: `${p.pairId}-a`,
      pairId: p.pairId,
      side: "a",
      text: p.a,
      matched: false,
    });
    cards.push({
      uid: `${p.pairId}-b`,
      pairId: p.pairId,
      side: "b",
      text: p.b,
      matched: false,
    });
  }
  return shuffle(cards);
}

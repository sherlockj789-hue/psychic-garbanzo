"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Heart,
  Coins,
  ArrowRight,
  RotateCw,
  Sparkles,
  Trophy,
  Skull,
  MessageSquare,
} from "lucide-react";
import type { ScenarioContent, ScenarioNode } from "@/lib/types";
import { GameError, GameLoading, GameProps, clamp, useGameFetch } from "./shared";

/**
 * Scenario Storm — a juiced branching-narrative game (type "scenario").
 *
 * Keeps the branching structure (nodes/choices/ending) but adds GAME FEEL:
 *   - Three meters at top: Skill (ocean), Rep (coral), Money (sun) — animate
 *     width changes with framer-motion spring when deltas apply. Show the
 *     numeric value + a small icon. Money can exceed 100% (show raw number).
 *   - Current node text in a "scene card" with a subtle entrance animation
 *     (fade + slide up).
 *   - Choices as buttons; on click: apply deltas, show floating "+2 skill" /
 *     "-1 rep" chips that rise & fade, show the choice's `feedback` as a
 *     brief toast, then AnimatePresence transition to the next node.
 *   - On ending node: full-screen-ish result (win=green bg, lose=red bg),
 *     ending title + body, final meter values, a verdict line, "Play again"
 *     + (if onDone provided) call onDone(ending.win).
 *
 * Lint rule compliance: all state setters fire inside event handlers or
 * setTimeout callbacks (async). No setState synchronous in effect bodies.
 */

type Delta = { skill?: number; rep?: number; money?: number };
type FloatChip = {
  id: number;
  label: string;
  positive: boolean;
};

export function ScenarioStorm({ career, topic, onDone, onPlayAgain }: GameProps) {
  const { data, loading, error, retry } = useGameFetch<ScenarioContent>(
    "scenario",
    career,
    topic,
  );

  if (loading) return <GameLoading text="Designing your scenario…" />;
  if (error) return <GameError message={error} onRetry={retry} />;
  if (!data || !data.nodes || !data.nodes[data.start]) {
    return (
      <GameError
        message="This scenario didn't load right. Try a new round."
        onRetry={retry}
      />
    );
  }

  return (
    <ScenarioBoard
      content={data}
      onDone={onDone}
      onPlayAgain={onPlayAgain}
    />
  );
}

function ScenarioBoard({
  content,
  onDone,
  onPlayAgain,
}: {
  content: ScenarioContent;
  onDone?: (passed: boolean) => void;
  onPlayAgain: () => void;
}) {
  const [nodeId, setNodeId] = useState(content.start);
  const [skill, setSkill] = useState(50);
  const [rep, setRep] = useState(50);
  const [money, setMoney] = useState(100);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [floats, setFloats] = useState<FloatChip[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const endedRef = useRef(false);
  const floatIdRef = useRef(0);

  const node: ScenarioNode | undefined = content.nodes[nodeId];

  function applyDelta(d: Delta) {
    const chips: FloatChip[] = [];
    if (typeof d.skill === "number") {
      setSkill((s) => clamp(s + d.skill!, 0, 100));
      chips.push({
        id: ++floatIdRef.current,
        label: `${d.skill! > 0 ? "+" : ""}${d.skill} skill`,
        positive: d.skill! > 0,
      });
    }
    if (typeof d.rep === "number") {
      setRep((r) => clamp(r + d.rep!, 0, 100));
      chips.push({
        id: ++floatIdRef.current,
        label: `${d.rep! > 0 ? "+" : ""}${d.rep} rep`,
        positive: d.rep! > 0,
      });
    }
    if (typeof d.money === "number") {
      setMoney((m) => Math.max(0, m + d.money!));
      chips.push({
        id: ++floatIdRef.current,
        label: `${d.money! > 0 ? "+" : ""}$${d.money}`,
        positive: d.money! > 0,
      });
    }
    if (chips.length > 0) {
      setFloats((f) => [...f, ...chips]);
      // Auto-remove each chip after its rise animation (setTimeout = async).
      chips.forEach((c) => {
        window.setTimeout(() => {
          setFloats((f) => f.filter((x) => x.id !== c.id));
        }, 1100);
      });
    }
  }

  function choose(choice: {
    text: string;
    next: string;
    skill?: number;
    rep?: number;
    money?: number;
    feedback?: string;
  }) {
    applyDelta(choice);
    setHistory((h) => [...h, choice.text]);
    if (choice.feedback) setFeedback(choice.feedback);

    window.setTimeout(() => {
      setFeedback(null);
      setNodeId(choice.next);
      const target = content.nodes[choice.next];
      if (target?.ending && !endedRef.current) {
        endedRef.current = true;
        // small delay so player sees the ending screen first
        window.setTimeout(() => onDone?.(target.ending!.win), 400);
      }
    }, 950);
  }

  return (
    <div className="space-y-3">
      {/* Scene header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="rounded-2xl border border-border bg-ocean/10 px-4 py-2.5"
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ocean">
          <Sparkles className="h-3.5 w-3.5" /> Scene
        </div>
        <p className="mt-0.5 font-[family-name:var(--font-display-tf)] text-base sm:text-lg">
          {content.setting}
        </p>
      </motion.div>

      {/* Meters (with floating delta chips overlay) */}
      <div className="relative grid grid-cols-3 gap-2 sm:gap-3">
        <Meter
          label="Skill"
          value={skill}
          max={100}
          icon={<Brain className="h-3.5 w-3.5" />}
          colorClass="bg-ocean"
          trackClass="bg-ocean/15"
          textClass="text-ocean"
        />
        <Meter
          label="Rep"
          value={rep}
          max={100}
          icon={<Heart className="h-3.5 w-3.5" />}
          colorClass="bg-coral"
          trackClass="bg-coral/15"
          textClass="text-coral"
        />
        <Meter
          label="Money"
          value={money}
          max={Math.max(200, money)}
          icon={<Coins className="h-3.5 w-3.5" />}
          colorClass="bg-sun"
          trackClass="bg-sun/30"
          textClass="text-ink"
        />

        {/* Floating delta chips — rise from the meters and fade. */}
        <div className="pointer-events-none absolute inset-x-0 -top-2 z-20 flex justify-center gap-2">
          <AnimatePresence>
            {floats.map((f) => (
              <motion.div
                key={f.id}
                initial={{ y: 20, opacity: 0, scale: 0.7 }}
                animate={{ y: -40, opacity: [0, 1, 1, 0], scale: [0.7, 1.15, 1] }}
                transition={{ duration: 1.05, ease: "easeOut" }}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-pop-sm ${
                  f.positive
                    ? "border-mint bg-mint text-ink"
                    : "border-destructive bg-destructive text-white"
                }`}
              >
                {f.label}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {node?.ending ? (
          <EndingCard
            key={`ending-${nodeId}`}
            node={node}
            skill={skill}
            rep={rep}
            money={money}
            onPlayAgain={onPlayAgain}
            history={history}
          />
        ) : node ? (
          <NodeCard
            key={nodeId}
            node={node}
            feedback={feedback}
            onChoose={choose}
          />
        ) : (
          <div className="card-pop p-6 text-center text-sm text-muted-foreground">
            This scene is missing. Try a new round.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Meter({
  label,
  value,
  max,
  icon,
  colorClass,
  trackClass,
  textClass,
}: {
  label: string;
  value: number;
  max: number;
  icon: React.ReactNode;
  colorClass: string;
  trackClass: string;
  textClass: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="rounded-2xl border border-border bg-card p-2.5 sm:p-3">
      <div
        className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${textClass}`}
      >
        {icon}
        <span>{label}</span>
        <span className="ml-auto font-mono text-ink/70">
          {label === "Money" ? `$${Math.round(value)}` : Math.round(value)}
        </span>
      </div>
      <div className={`mt-1.5 h-2 w-full overflow-hidden rounded-full ${trackClass}`}>
        <motion.div
          className={`h-full ${colorClass}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        />
      </div>
    </div>
  );
}

function NodeCard({
  node,
  feedback,
  onChoose,
}: {
  node: ScenarioNode;
  feedback: string | null;
  onChoose: (c: {
    text: string;
    next: string;
    skill?: number;
    rep?: number;
    money?: number;
    feedback?: string;
  }) => void;
}) {
  const disabled = feedback !== null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="card-pop overflow-hidden p-0"
    >
      <div className="p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
          {node.text}
        </p>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-xl border border-ocean/30 bg-ocean/10 p-3 text-sm">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
                <span className="text-foreground/85">{feedback}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 grid gap-2.5">
          {node.choices?.map((c, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => onChoose(c)}
              disabled={disabled}
              whileHover={disabled ? undefined : { x: 4, scale: 1.01 }}
              whileTap={disabled ? undefined : { scale: 0.98 }}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition hover:border-ocean/50 hover:bg-sun/30 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
              aria-label={`Choose: ${c.text}`}
            >
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground/70 group-hover:bg-ocean group-hover:text-white">
                {i + 1}
              </span>
              <span className="flex-1 leading-snug">{c.text}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-ocean" />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function EndingCard({
  node,
  skill,
  rep,
  money,
  onPlayAgain,
  history,
}: {
  node: ScenarioNode;
  skill: number;
  rep: number;
  money: number;
  onPlayAgain: () => void;
  history: string[];
}) {
  const ending = node.ending!;
  const avg = (skill + rep) / 2;
  const verdict =
    ending.win && avg >= 70
      ? "Outstanding — you played this like a pro."
      : ending.win
        ? "Solid — you held it together."
        : "Rough run — you'll do better next time.";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`card-pop relative overflow-hidden p-0 ${
        ending.win ? "border-mint" : "border-destructive/60"
      }`}
    >
      {/* Full-bg color wash */}
      <div
        className={`absolute inset-x-0 top-0 h-40 ${
          ending.win
            ? "bg-gradient-to-b from-mint/60 to-transparent"
            : "bg-gradient-to-b from-destructive/30 to-transparent"
        }`}
      />

      <div className="relative px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
              ending.win ? "bg-mint text-ink" : "bg-destructive text-white"
            }`}
          >
            {ending.win ? (
              <Trophy className="h-7 w-7" />
            ) : (
              <Skull className="h-7 w-7" />
            )}
          </motion.div>
          <div>
            <div
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                ending.win ? "text-ocean" : "text-destructive"
              }`}
            >
              {ending.win ? "Win" : "Game over"}
            </div>
            <h3 className="font-[family-name:var(--font-display-tf)] text-2xl leading-tight sm:text-3xl">
              {ending.title}
            </h3>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-foreground/85 sm:text-base">
          {ending.body}
        </p>

        {/* Final meter values */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <FinalStat label="Skill" value={String(Math.round(skill))} icon={<Brain className="h-3 w-3" />} accent="ocean" />
          <FinalStat label="Rep" value={String(Math.round(rep))} icon={<Heart className="h-3 w-3" />} accent="coral" />
          <FinalStat label="Money" value={`$${Math.round(money)}`} icon={<Coins className="h-3 w-3" />} accent="sun" />
        </div>

        {/* Verdict */}
        <div
          className={`mt-3 rounded-xl border p-3 text-sm font-medium ${
            ending.win
              ? "border-mint/40 bg-mint/20 text-ink"
              : "border-destructive/40 bg-destructive/10 text-ink"
          }`}
        >
          {verdict}
        </div>

        {history.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Your path
            </div>
            <ol className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-foreground/75 scroll-soft">
              {history.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold">
                    {i + 1}
                  </span>
                  <span className="flex-1">{h}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <button
          onClick={onPlayAgain}
          className="btn-pop btn-neon mt-5 text-sm"
          aria-label="Play scenario again"
        >
          <RotateCw className="h-4 w-4" /> Play again
        </button>
      </div>
    </motion.div>
  );
}

function FinalStat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "ocean" | "coral" | "sun";
}) {
  const cls = {
    ocean: "border-ocean/30 bg-ocean/10 text-ocean",
    coral: "border-coral/30 bg-coral/10 text-coral",
    sun: "border-sun/40 bg-sun/20 text-ink",
  }[accent];
  return (
    <div className={`rounded-xl border p-2 text-center ${cls}`}>
      <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-[family-name:var(--font-display-tf)] text-xl">
        {value}
      </div>
    </div>
  );
}

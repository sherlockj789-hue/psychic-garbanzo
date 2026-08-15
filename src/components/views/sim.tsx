"use client";

import { useEffect, useState, type JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNav } from "@/lib/nav";
import { getCareer } from "@/data/careers";
import type { SimShift, SimChoice } from "@/lib/ai";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Wallet,
  Star,
  Zap,
  Loader2,
  FlaskConical,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type Resources = {
  money: number;
  skill: number;
  rep: number;
  energy: number;
};

type LogEntry = {
  eventTitle: string;
  choiceLabel: string;
  outcome: string;
  deltas: { money: number; rep: number; skill: number; energy: number };
};

type MeterColor = "sun" | "mint" | "ocean" | "coral";

const INITIAL_METER = 50;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function scoreFromResources(r: Resources, startingMoney: number): number {
  // Money is normalized to 0–100 against startingMoney (doubling = 100, broke = 0).
  const moneyScore = clamp((r.money / Math.max(1, startingMoney)) * 50, 0, 100);
  return Math.round(
    (clamp(r.skill, 0, 100) +
      clamp(r.rep, 0, 100) +
      clamp(r.energy, 0, 100) +
      moneyScore) /
      4,
  );
}

function verdictFor(score: number): { label: string; tone: string } {
  if (score >= 85) return { label: "Outstanding shift", tone: "text-mint" };
  if (score >= 70) return { label: "Solid shift", tone: "text-ocean" };
  if (score >= 50) return { label: "You got through it", tone: "text-sun" };
  return { label: "Rough shift — learn from it", tone: "text-coral" };
}

function MeterBar({
  icon,
  label,
  value,
  max,
  color,
  display,
}: {
  icon: JSX.Element;
  label: string;
  value: number;
  max: number;
  color: MeterColor;
  display: string;
}): JSX.Element {
  const pct = clamp((value / Math.max(1, max)) * 100, 0, 100);
  const colorClass: Record<MeterColor, string> = {
    sun: "bg-sun",
    mint: "bg-mint",
    ocean: "bg-ocean",
    coral: "bg-coral",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-pop-sm">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/70">
          {icon}
          <span className="sr-only sm:not-sr-only">{label}</span>
        </span>
        <span
          className="font-[family-name:var(--font-mono-tf)] text-sm font-bold text-foreground"
          aria-live="polite"
        >
          {display}
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <motion.div
          className={`h-full ${colorClass[color]}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
        />
      </div>
    </div>
  );
}

function DeltaChip({ label, value }: { label: string; value: number }): JSX.Element {
  const positive = value > 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-[family-name:var(--font-mono-tf)] text-xs font-semibold ${
        positive ? "bg-mint/50 text-foreground" : "bg-destructive/20 text-foreground"
      }`}
    >
      {positive ? "+" : ""}
      {value} {label}
    </span>
  );
}

export function SimView({ slug }: { slug: string }): JSX.Element {
  const { navigate } = useNav();
  const career = getCareer(slug);

  const [round, setRound] = useState(0);
  const [shift, setShift] = useState<SimShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resources, setResources] = useState<Resources>({
    money: 0,
    skill: INITIAL_METER,
    rep: INITIAL_METER,
    energy: INITIAL_METER,
  });
  const [eventIdx, setEventIdx] = useState(0);
  const [pendingChoice, setPendingChoice] = useState<number | null>(null);
  const [lastChoice, setLastChoice] = useState<SimChoice | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [done, setDone] = useState(false);

  // Fetch the shift on mount and whenever `round` bumps (retry).
  // CRITICAL: no synchronous setState in the effect body — all setState
  // calls happen inside the async .then / .catch callbacks.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sim?career=${encodeURIComponent(slug)}`)
      .then((r) =>
        r.ok
          ? (r.json() as Promise<SimShift>)
          : Promise.reject(
              new Error(r.status === 404 ? "Career not found" : "Failed to load shift"),
            ),
      )
      .then((data: SimShift) => {
        if (cancelled) return;
        setShift(data);
        setResources({
          money: data.startingMoney,
          skill: INITIAL_METER,
          rep: INITIAL_METER,
          energy: INITIAL_METER,
        });
        setEventIdx(0);
        setPendingChoice(null);
        setLastChoice(null);
        setLog([]);
        setDone(false);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load shift");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, round]);

  // ---- Early returns for not-found / loading / error states ----

  if (!career) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="text-6xl">🧭</div>
        <h1 className="mt-4 font-[family-name:var(--font-display-tf)] text-4xl">
          Simulator not found
        </h1>
        <p className="mt-2 text-foreground/70">
          This career isn&apos;t in the school yet.
        </p>
        <button
          onClick={() => navigate({ name: "careers" })}
          className="btn-pop btn-neon mt-6 text-sm"
        >
          Browse careers
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-coral" />
        <h1 className="mt-4 font-[family-name:var(--font-display-tf)] text-3xl">
          <FlaskConical className="mr-2 inline h-7 w-7 text-coral" />
          {career.name} Simulator
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Setting up your {career.name.toLowerCase()} shift…
        </p>
        <p className="mx-auto mt-3 max-w-xs text-xs text-foreground/50">
          Each shift is generated fresh from real career info the first time it&apos;s opened.
        </p>
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 font-[family-name:var(--font-display-tf)] text-3xl">
          Couldn&apos;t load the shift
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "Unknown error"}
        </p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            setRound((r) => r + 1);
          }}
          className="btn-pop btn-neon mt-6 text-sm"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  // ---- Game state derived values ----

  const currentEvent = shift.events[eventIdx];
  const isLast = eventIdx >= shift.events.length - 1;
  const score = scoreFromResources(resources, shift.startingMoney);
  const verdict = verdictFor(score);

  // ---- Handlers (synchronous setState in event handlers — allowed by lint) ----

  function onChoose(idx: number): void {
    if (pendingChoice !== null || !currentEvent) return;
    const choice = currentEvent.choices[idx];
    if (!choice) return;
    const deltas = {
      money: choice.money ?? 0,
      rep: choice.rep ?? 0,
      skill: choice.skill ?? 0,
      energy: choice.energy ?? 0,
    };
    setPendingChoice(idx);
    setLastChoice(choice);
    setResources((r) => ({
      money: Math.max(0, r.money + deltas.money),
      skill: clamp(r.skill + deltas.skill, 0, 100),
      rep: clamp(r.rep + deltas.rep, 0, 100),
      energy: clamp(r.energy + deltas.energy, 0, 100),
    }));
    setLog((l) => [
      ...l,
      {
        eventTitle: currentEvent.title,
        choiceLabel: choice.label,
        outcome: choice.outcome,
        deltas,
      },
    ]);
  }

  function onContinue(): void {
    if (isLast) {
      setDone(true);
    } else {
      setEventIdx((i) => i + 1);
      setPendingChoice(null);
      setLastChoice(null);
    }
  }

  function onRunAgain(): void {
    setResources({
      money: shift.startingMoney,
      skill: INITIAL_METER,
      rep: INITIAL_METER,
      energy: INITIAL_METER,
    });
    setEventIdx(0);
    setPendingChoice(null);
    setLastChoice(null);
    setLog([]);
    setDone(false);
  }

  const progressCount = done ? shift.events.length : eventIdx;
  const progressPct = (progressCount / shift.events.length) * 100;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <button
        onClick={() => navigate({ name: "career", slug })}
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="mr-1 inline h-4 w-4" /> Back to {career.name}
      </button>

      {/* Header card */}
      <div className="card-pop mt-4 overflow-hidden">
        <div className="bg-coral p-5 text-white sm:p-7">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl">
              {career.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Job Simulator
              </div>
              <h1 className="font-[family-name:var(--font-display-tf)] text-2xl leading-tight sm:text-3xl">
                {career.name} shift
              </h1>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/90">{shift.intro}</p>
        </div>
      </div>

      {/* Meters */}
      <div
        className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="Your resources"
      >
        <MeterBar
          icon={<Wallet className="h-3.5 w-3.5" />}
          label="Money"
          value={resources.money}
          max={shift.startingMoney}
          color="sun"
          display={`$${Math.round(resources.money)}`}
        />
        <MeterBar
          icon={<Brain className="h-3.5 w-3.5" />}
          label="Skill"
          value={resources.skill}
          max={100}
          color="ocean"
          display={`${Math.round(resources.skill)}`}
        />
        <MeterBar
          icon={<Star className="h-3.5 w-3.5" />}
          label="Reputation"
          value={resources.rep}
          max={100}
          color="mint"
          display={`${Math.round(resources.rep)}`}
        />
        <MeterBar
          icon={<Zap className="h-3.5 w-3.5" />}
          label="Energy"
          value={resources.energy}
          max={100}
          color="coral"
          display={`${Math.round(resources.energy)}`}
        />
      </div>

      {/* Progress */}
      <div className="mt-5 flex items-center gap-3">
        <div className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-foreground/60">
          Event {Math.min(eventIdx + 1, shift.events.length)} of {shift.events.length}
        </div>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-coral"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key={`event-${eventIdx}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {currentEvent && (
              <section className="card-pop mt-5 p-5 sm:p-6" aria-live="polite">
                <h2 className="font-[family-name:var(--font-display-tf)] text-2xl leading-tight">
                  {currentEvent.title}
                </h2>
                <p className="mt-2 leading-relaxed text-foreground/80">
                  {currentEvent.situation}
                </p>

                <div className="mt-4 grid gap-2.5">
                  {currentEvent.choices.map((choice, i) => {
                    const isPicked = pendingChoice === i;
                    const isDimmed = pendingChoice !== null && !isPicked;
                    return (
                      <button
                        key={i}
                        onClick={() => onChoose(i)}
                        disabled={pendingChoice !== null}
                        aria-pressed={isPicked}
                        className={`w-full rounded-xl border px-4 py-3 text-left font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                          isPicked
                            ? "border-coral bg-coral/15"
                            : isDimmed
                              ? "border-border bg-muted/40 opacity-60"
                              : "border-border bg-card hover:border-coral/60 hover:bg-coral/5"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span>{choice.label}</span>
                          {isPicked && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-coral" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {pendingChoice !== null && lastChoice && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="mt-4 rounded-xl border border-coral/30 bg-coral/10 p-4"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wider text-coral">
                        What happened
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                        {lastChoice.outcome}
                      </p>
                      {(lastChoice.money ||
                        lastChoice.rep ||
                        lastChoice.skill ||
                        lastChoice.energy) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {lastChoice.money ? (
                            <DeltaChip label="money" value={lastChoice.money} />
                          ) : null}
                          {lastChoice.skill ? (
                            <DeltaChip label="skill" value={lastChoice.skill} />
                          ) : null}
                          {lastChoice.rep ? (
                            <DeltaChip label="rep" value={lastChoice.rep} />
                          ) : null}
                          {lastChoice.energy ? (
                            <DeltaChip label="energy" value={lastChoice.energy} />
                          ) : null}
                        </div>
                      )}
                      <button
                        onClick={onContinue}
                        className="btn-pop btn-neon mt-4 text-sm"
                      >
                        {isLast ? "See results" : "Continue"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <section className="card-pop mt-5 overflow-hidden">
              <div className="bg-ocean p-6 text-white sm:p-8">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  Shift complete
                </div>
                <div className="mt-2 flex items-end gap-4">
                  <div className="font-[family-name:var(--font-display-tf)] text-6xl leading-none">
                    {score}
                  </div>
                  <div className="pb-1">
                    <div className="text-sm text-white/70">/ 100</div>
                    <div className="font-[family-name:var(--font-display-tf)] text-lg">
                      {verdict.label}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-border bg-sun/20 p-3">
                    <div className="text-xs font-semibold uppercase text-foreground/60">
                      Money
                    </div>
                    <div className="mt-1 font-[family-name:var(--font-display-tf)] text-xl">
                      ${Math.round(resources.money)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-ocean/10 p-3">
                    <div className="text-xs font-semibold uppercase text-foreground/60">
                      Skill
                    </div>
                    <div className="mt-1 font-[family-name:var(--font-display-tf)] text-xl">
                      {Math.round(resources.skill)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-mint/30 p-3">
                    <div className="text-xs font-semibold uppercase text-foreground/60">
                      Rep
                    </div>
                    <div className="mt-1 font-[family-name:var(--font-display-tf)] text-xl">
                      {Math.round(resources.rep)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-coral/10 p-3">
                    <div className="text-xs font-semibold uppercase text-foreground/60">
                      Energy
                    </div>
                    <div className="mt-1 font-[family-name:var(--font-display-tf)] text-xl">
                      {Math.round(resources.energy)}
                    </div>
                  </div>
                </div>

                <h3 className="mt-6 font-[family-name:var(--font-display-tf)] text-xl">
                  What happened on your shift
                </h3>
                <ol className="scroll-soft mt-3 max-h-96 space-y-2 overflow-y-auto pr-2">
                  {log.map((entry, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-border bg-muted/40 p-3"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                        {i + 1}. {entry.eventTitle}
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-foreground">
                        {entry.choiceLabel}
                      </div>
                      <div className="mt-0.5 text-sm leading-relaxed text-foreground/75">
                        {entry.outcome}
                      </div>
                      {(entry.deltas.money ||
                        entry.deltas.rep ||
                        entry.deltas.skill ||
                        entry.deltas.energy) && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {entry.deltas.money ? (
                            <DeltaChip label="money" value={entry.deltas.money} />
                          ) : null}
                          {entry.deltas.skill ? (
                            <DeltaChip label="skill" value={entry.deltas.skill} />
                          ) : null}
                          {entry.deltas.rep ? (
                            <DeltaChip label="rep" value={entry.deltas.rep} />
                          ) : null}
                          {entry.deltas.energy ? (
                            <DeltaChip label="energy" value={entry.deltas.energy} />
                          ) : null}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={onRunAgain}
                    className="btn-pop btn-neon text-sm"
                  >
                    <RefreshCw className="h-4 w-4" /> Run the shift again
                  </button>
                  <button
                    onClick={() => navigate({ name: "career", slug })}
                    className="btn-pop text-sm"
                  >
                    Back to lessons
                  </button>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

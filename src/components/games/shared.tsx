"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { Loader2, RotateCw, AlertCircle } from "lucide-react";
import type { GameType } from "@/lib/types";

/**
 * Shared utilities for the five arcade-style mini-games.
 *
 * - `useGameFetch` hits `/api/game` and stores state. Setters are only called
 *   inside `.then()` / `.catch()` / `.finally()` callbacks (async, never
 *   synchronous in the effect body) so the `react-hooks/set-state-in-effect`
 *   rule stays happy.
 * - `GameLoading` / `GameError` give a consistent shell across all games.
 * - `useFx` + `FxLayer` provide a particle-burst + score-popup overlay that
 *   every game uses for "juicy" hit feedback.
 * - `useShake` returns framer-motion animation controls + a trigger() that
 *   plays a screen-shake keyframe sequence on the wrapper motion.div.
 */

export type GameProps = {
  career: string;
  topic: string;
  onDone?: (passed: boolean) => void;
  onPlayAgain: () => void;
};

export function GameLoading({ text }: { text: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
      >
        <Loader2 className="h-10 w-10 text-primary" />
      </motion.div>
      <p className="font-[family-name:var(--font-display-tf)] text-lg">{text}</p>
      <motion.p
        className="text-xs text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
      >
        Crafting something fresh from real career content…
      </motion.p>
    </div>
  );
}

export function GameError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="max-w-sm text-sm text-destructive">{message}</p>
      <button onClick={onRetry} className="btn-pop mt-2 text-sm">
        <RotateCw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}

/**
 * Fetches game content from `/api/game`. The `nonce` lets us re-run the effect
 * when the user clicks "Try again" on an error. All state setters live inside
 * async callbacks (`.then`, `.catch`, `.finally`), never synchronous in the
 * effect body — so the `react-hooks/set-state-in-effect` rule is respected.
 *
 * Note: when `career` is "" (skills lab), we substitute "skills-lab" so the API
 * doesn't reject the request with a 400.
 */
export function useGameFetch<T>(type: GameType, career: string, topic: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const effectiveCareer = career && career.length > 0 ? career : "skills-lab";
    const url =
      `/api/game?type=${type}` +
      `&career=${encodeURIComponent(effectiveCareer)}` +
      `&topic=${encodeURIComponent(topic)}`;
    fetch(url, { signal: controller.signal })
      .then((r) =>
        r.ok
          ? r.json()
          : Promise.reject(new Error("Couldn't build this game. Try again in a moment.")),
      )
      .then((d) => {
        setData(d as T);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Something went wrong.");
      })
      .finally(() => {
        setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, [type, career, topic, nonce]);

  return {
    data,
    loading,
    error,
    retry: () => {
      setLoading(true);
      setError(null);
      setNonce((n) => n + 1);
    },
  };
}

/** Tiny deterministic-ish shuffle (Math.random-based). Returns a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Format milliseconds as M:SS. */
export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

// ============================================================
// FX LAYER — particles + floating score popups + screen shake
// Used by every arcade game for "juicy" hit feedback.
// ============================================================

type Burst = { id: number; x: number; y: number; color: string };
type Popup = {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size?: "sm" | "md" | "lg";
};

/**
 * Manages transient particle bursts + floating popups. Each `burst`/`popup`
 * call schedules a self-cleanup via setTimeout (async — safe per lint rule).
 * The returned `bursts` / `popups` arrays are passed to `<FxLayer>`.
 */
export function useFx() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const idRef = useRef(0);

  const burst = (x: number, y: number, color = "var(--mint)") => {
    const id = ++idRef.current;
    setBursts((b) => [...b.slice(-10), { id, x, y, color }]);
    window.setTimeout(() => {
      setBursts((b) => b.filter((z) => z.id !== id));
    }, 700);
  };

  const popup = (
    x: number,
    y: number,
    text: string,
    color = "var(--ink)",
    size: "sm" | "md" | "lg" = "md",
  ) => {
    const id = ++idRef.current;
    setPopups((p) => [...p.slice(-10), { id, x, y, text, color, size }]);
    window.setTimeout(() => {
      setPopups((p) => p.filter((z) => z.id !== id));
    }, 1000);
  };

  return { bursts, popups, burst, popup };
}

/** Absolute-positioned overlay that renders bursts + popups. Pointer-events:none. */
export function FxLayer({
  bursts,
  popups,
}: {
  bursts: Burst[];
  popups: Popup[];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {bursts.map((b) => (
          <BurstFx key={b.id} burst={b} />
        ))}
        {popups.map((p) => (
          <PopupFx key={p.id} popup={p} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function BurstFx({ burst }: { burst: Burst }) {
  // 9 particles flying outward in random directions. Stable per-instance.
  const particles = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 28 + Math.random() * 38;
        const size = 5 + Math.random() * 7;
        return { angle, dist, size };
      }),
    [],
  );
  return (
    <div className="absolute" style={{ left: burst.x, top: burst.y }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: burst.color,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.dist,
            y: Math.sin(p.angle) * p.dist,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function PopupFx({ popup }: { popup: Popup }) {
  const sizeClass =
    popup.size === "lg" ? "text-3xl" : popup.size === "sm" ? "text-base" : "text-xl";
  return (
    <motion.div
      className={`absolute whitespace-nowrap font-[family-name:var(--font-display-tf)] font-bold ${sizeClass}`}
      style={{
        left: popup.x,
        top: popup.y,
        color: popup.color,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ y: 0, opacity: 0, scale: 0.6 }}
      animate={{ y: -55, opacity: [0, 1, 1, 0], scale: [0.6, 1.2, 1, 0.9] }}
      transition={{ duration: 0.95, ease: "easeOut" }}
    >
      {popup.text}
    </motion.div>
  );
}

/**
 * Screen shake. Apply `controls` to a wrapping motion.div, then call
 * `trigger(intensity)` from an event handler to play the shake.
 */
export function useShake() {
  const controls = useAnimationControls();
  const trigger = (intensity = 8) => {
    controls.start({
      x: [
        0,
        -intensity,
        intensity,
        -intensity * 0.7,
        intensity * 0.7,
        -intensity * 0.4,
        intensity * 0.4,
        0,
      ],
      transition: { duration: 0.42, ease: "easeInOut" },
    });
  };
  return { controls, trigger };
}

/** A confetti-like celebratory burst — used on game-wins (memory, sequence). */
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
        const dist = 120 + Math.random() * 180;
        const colors = ["var(--sun)", "var(--mint)", "var(--ocean)", "var(--coral)", "var(--violet)"];
        return {
          angle,
          dist,
          size: 7 + Math.random() * 8,
          color: colors[i % colors.length],
          rot: Math.random() * 360,
          delay: Math.random() * 0.18,
        };
      }),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/3"
          style={{
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: p.rot }}
          animate={{
            x: Math.cos(p.angle) * p.dist,
            y: Math.sin(p.angle) * p.dist + 80,
            opacity: 0,
            rotate: p.rot + 360,
          }}
          transition={{ duration: 1.3, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

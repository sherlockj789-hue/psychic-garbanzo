"use client";

import { useState } from "react";
import { GamePlayer } from "@/components/games/game-player";
import { SkillLessonView } from "@/components/views/skill-lesson";
import { SKILLS, SKILL_GROUPS, colorBg, GAME_TYPES } from "@/data/skills";
import type { GameType } from "@/lib/types";
import { Search, X, RotateCw, BookOpen, Gamepad2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SkillsView({ initialSlug }: { initialSlug?: string }) {
  const [q, setQ] = useState("");
  const initialSkill = initialSlug ? SKILLS.find((s) => s.slug === initialSlug) ?? null : null;
  const [selected, setSelected] = useState(initialSkill);
  // Two-step flow: "learn" first, then "play".
  const [phase, setPhase] = useState<"learn" | "play">(initialSkill ? "learn" : "learn");
  const [gameType, setGameType] = useState<GameType>(initialSkill?.game ?? "quiz");
  const [round, setRound] = useState(0);

  function selectSkill(s: (typeof SKILLS)[number]) {
    setSelected(s);
    setGameType(s.game);
    setPhase("learn");
    setRound((r) => r + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeSkill() {
    setSelected(null);
    setPhase("learn");
  }

  const filtered = SKILLS.filter(
    (s) =>
      !q.trim() ||
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      s.tagline.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase text-foreground/60">Practice lab</div>
          <h1 className="font-[family-name:var(--font-display-tf)] text-5xl sm:text-6xl">
            Grown-up skills
          </h1>
          <p className="mt-2 max-w-lg text-foreground/70">
            The stuff no one teaches you in regular school: money, thinking, people, work.{" "}
            <strong>Learn first, then play</strong> — each skill is a real lesson followed by a fun game.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search skills…"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-11 pr-4 shadow-pop-sm outline-none focus:ring-2 focus:ring-mint"
            aria-label="Search skills"
          />
        </div>
      </div>

      {selected ? (
        <div className="mt-8">
          {/* Skill header */}
          <div className="card-pop p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div
                className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-ink/20 text-2xl ${colorBg[selected.color]}`}
              >
                {selected.emoji}
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase text-foreground/60">
                  {selected.group}
                </div>
                <h2 className="font-[family-name:var(--font-display-tf)] text-2xl">{selected.title}</h2>
                <p className="text-sm text-foreground/70">{selected.tagline}</p>
              </div>
              <button onClick={closeSkill} className="btn-pop !px-3 !py-1.5 text-xs">
                <X className="h-3.5 w-3.5" /> Close
              </button>
            </div>

            {/* Phase toggle (only show "Play" once they've learned) */}
            <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4">
              <button
                onClick={() => setPhase("learn")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  phase === "learn"
                    ? "bg-primary text-white"
                    : "border border-border bg-card text-foreground/70 hover:bg-sun/30"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Learn
              </button>
              <button
                onClick={() => setPhase("play")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  phase === "play"
                    ? "bg-primary text-white"
                    : "border border-border bg-card text-foreground/70 hover:bg-sun/30"
                }`}
              >
                <Gamepad2 className="h-3.5 w-3.5" /> Play
              </button>
            </div>
          </div>

          {/* Phase content */}
          <div className="mt-5">
            <AnimatePresence mode="wait">
              {phase === "learn" ? (
                <motion.div
                  key="learn"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <SkillLessonView
                    slug={selected.slug}
                    title={selected.title}
                    onReady={() => setPhase("play")}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="card-pop p-5"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground">
                      1
                    </span>
                    Learn
                    <ArrowLeft className="h-3 w-3 rotate-180" />
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                      2
                    </span>
                    Play
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Game:
                    </span>
                    {GAME_TYPES.map((g) => (
                      <button
                        key={g.type}
                        onClick={() => {
                          setGameType(g.type);
                          setRound((r) => r + 1);
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          gameType === g.type
                            ? "border-transparent bg-ink text-background"
                            : "border-border bg-card hover:bg-sun/40"
                        }`}
                      >
                        {g.emoji} {g.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setRound((r) => r + 1)}
                      className="btn-pop !px-3 !py-1 text-xs"
                    >
                      <RotateCw className="h-3.5 w-3.5" /> New round
                    </button>
                  </div>

                  <div className="mt-5">
                    <GamePlayer
                      key={`${selected.slug}-${gameType}-${round}`}
                      type={gameType}
                      career=""
                      topic={selected.title}
                    />
                  </div>

                  <button
                    onClick={() => setPhase("learn")}
                    className="mt-5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Re-read the lesson
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        SKILL_GROUPS.map((g) => {
          const list = filtered.filter((s) => s.group === g);
          if (list.length === 0) return null;
          return (
            <section key={g} className="mt-10">
              <h2 className="font-[family-name:var(--font-display-tf)] text-3xl">{g}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => selectSkill(s)}
                    className="card-pop block p-5 text-left"
                  >
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-ink/20 text-2xl ${colorBg[s.color]}`}
                    >
                      {s.emoji}
                    </div>
                    <h3 className="mt-3 font-[family-name:var(--font-display-tf)] text-xl leading-tight">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-foreground/70">{s.tagline}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <BookOpen className="h-3 w-3" /> Learn &amp; play →
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

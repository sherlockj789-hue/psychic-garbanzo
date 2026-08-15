"use client";

import { useNav } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { Menu, X, GraduationCap, Sparkles } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const { route, navigate } = useNav();
  const xp = useProgress((s) => s.totalXp());
  const goal = useProgress((s) => s.goalCareer);
  const [open, setOpen] = useState(false);

  const isActive = (name: string) => route.name === name;

  const links: { name: Parameters<typeof navigate>[0]["name"]; label: string }[] = [
    { name: "home", label: "Home" },
    { name: "careers", label: "Careers" },
    { name: "skills", label: "Practice" },
    { name: "manifesto", label: "Manifesto" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <button
          onClick={() => navigate({ name: "home" })}
          className="flex items-center gap-2"
          aria-label="Wise World School home"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-[family-name:var(--font-display-tf)] text-xl font-bold tracking-tight">
            Wise World School
          </span>
        </button>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
          {links.map((l) => (
            <button
              key={l.name}
              onClick={() => navigate({ name: l.name })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(l.name)
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {goal && (
            <button
              onClick={() => navigate({ name: "career", slug: goal })}
              className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold sm:inline-flex"
            >
              <Sparkles className="mr-1 h-3.5 w-3.5 text-coral" />
              My path
            </button>
          )}
          <div className="hidden rounded-full border border-border bg-muted px-3 py-1.5 font-[family-name:var(--font-mono-tf)] text-xs text-muted-foreground sm:block">
            {xp} XP
          </div>
          <button
            className="btn-pop !px-3 !py-1.5 text-xs sm:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/60 bg-background px-4 py-3 sm:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <button
                key={l.name}
                onClick={() => {
                  navigate({ name: l.name });
                  setOpen(false);
                }}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
                  isActive(l.name) ? "bg-primary/15 text-primary" : "text-foreground/80"
                }`}
              >
                {l.label}
              </button>
            ))}
            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2 font-[family-name:var(--font-mono-tf)] text-xs text-muted-foreground">
              <span>Total XP</span>
              <span className="font-bold text-foreground">{xp}</span>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

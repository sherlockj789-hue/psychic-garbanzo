"use client";

import { useNav } from "@/lib/nav";
import { CAREERS } from "@/data/careers";

export function SiteFooter() {
  const { navigate } = useNav();
  const popular = CAREERS.filter((c) =>
    ["youtuber-streamer", "game-developer", "doctor-surgeon", "astronaut", "chef-baker", "pilot"].includes(
      c.slug,
    ),
  );

  return (
    <footer className="mt-16 border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/15 text-primary text-sm">
                ✳
              </span>
              <span className="font-[family-name:var(--font-display-tf)] text-lg font-bold">
                Wise World School
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-foreground/70">
              A real digital school. Pick any of {CAREERS.length} careers and work through 12 grades
              of honest, expert-grounded lessons — with videos, games, and a job simulator. Free,
              forever.
            </p>
            <button
              onClick={() => navigate({ name: "manifesto" })}
              className="mt-4 text-sm font-semibold text-primary hover:underline"
            >
              Read the manifesto →
            </button>
          </div>

          <div>
            <div className="font-[family-name:var(--font-mono-tf)] text-xs uppercase tracking-wider text-muted-foreground">
              Explore
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <button onClick={() => navigate({ name: "careers" })} className="text-foreground/75 hover:text-foreground">
                  All careers
                </button>
              </li>
              <li>
                <button onClick={() => navigate({ name: "skills" })} className="text-foreground/75 hover:text-foreground">
                  Practice lab
                </button>
              </li>
              <li>
                <button onClick={() => navigate({ name: "manifesto" })} className="text-foreground/75 hover:text-foreground">
                  Manifesto
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-[family-name:var(--font-mono-tf)] text-xs uppercase tracking-wider text-muted-foreground">
              Popular
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {popular.map((c) => (
                <li key={c.slug}>
                  <button
                    onClick={() => navigate({ name: "career", slug: c.slug })}
                    className="text-foreground/75 hover:text-foreground"
                  >
                    {c.emoji} {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-foreground/60 sm:flex-row">
          <p className="font-medium">Wise World School · Free forever · Learn at your own pace.</p>
          <p className="opacity-70">Built with curiosity. Real lessons, real videos, real games.</p>
        </div>
      </div>
    </footer>
  );
}

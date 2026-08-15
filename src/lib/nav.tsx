"use client";

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";

export type Route =
  | { name: "home" }
  | { name: "careers"; group?: string; q?: string }
  | { name: "career"; slug: string }
  | { name: "grade"; slug: string; grade: number }
  | { name: "lesson"; slug: string; grade: number; lesson: number }
  | { name: "sim"; slug: string }
  | { name: "skills" }
  | { name: "skill"; slug: string }
  | { name: "manifesto" };

function parseHash(hash: string): Route {
  // strip leading '#' and any leading '/'
  let h = hash.replace(/^#/, "");
  if (h.startsWith("/")) h = h.slice(1);
  if (!h) return { name: "home" };

  const [pathPart, queryPart] = h.split("?");
  const segs = pathPart.split("/").filter(Boolean);
  const params = new URLSearchParams(queryPart ?? "");

  const top = segs[0];

  if (top === "careers") {
    return {
      name: "careers",
      group: params.get("group") ?? undefined,
      q: params.get("q") ?? undefined,
    };
  }
  if (top === "career" && segs[1]) {
    const slug = segs[1];
    if (segs[2] === "grade" && segs[3]) {
      const grade = Number(segs[3]);
      if (segs[4] === "lesson" && segs[5]) {
        return { name: "lesson", slug, grade, lesson: Number(segs[5]) };
      }
      return { name: "grade", slug, grade };
    }
    return { name: "career", slug };
  }
  if (top === "sim" && segs[1]) return { name: "sim", slug: segs[1] };
  if (top === "skills") {
    if (segs[1]) return { name: "skill", slug: segs[1] };
    return { name: "skills" };
  }
  if (top === "manifesto") return { name: "manifesto" };
  return { name: "home" };
}

export function routeToHash(r: Route): string {
  switch (r.name) {
    case "home": return "#/";
    case "careers": {
      const p = new URLSearchParams();
      if (r.group) p.set("group", r.group);
      if (r.q) p.set("q", r.q);
      const qs = p.toString();
      return `#/careers${qs ? "?" + qs : ""}`;
    }
    case "career": return `#/career/${r.slug}`;
    case "grade": return `#/career/${r.slug}/grade/${r.grade}`;
    case "lesson": return `#/career/${r.slug}/grade/${r.grade}/lesson/${r.lesson}`;
    case "sim": return `#/sim/${r.slug}`;
    case "skills": return `#/skills`;
    case "skill": return `#/skills/${r.slug}`;
    case "manifesto": return `#/manifesto`;
  }
}

type NavCtx = {
  route: Route;
  navigate: (r: Route) => void;
};

const Ctx = createContext<NavCtx | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === "undefined" ? { name: "home" } : parseHash(window.location.hash),
  );

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    // ensure there's always a hash so back-button behaves
    if (!window.location.hash) window.location.replace("#/");
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((r: Route) => {
    const hash = routeToHash(r);
    if (window.location.hash === hash) {
      // same hash — still update state in case params differ
      setRoute(parseHash(hash));
    } else {
      window.location.hash = hash;
    }
    // scroll to top on navigation
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return <Ctx.Provider value={{ route, navigate }}>{children}</Ctx.Provider>;
}

export function useNav() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNav must be used within NavProvider");
  return ctx;
}

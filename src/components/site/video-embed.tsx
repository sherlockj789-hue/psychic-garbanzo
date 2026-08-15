"use client";

import { useEffect, useState } from "react";
import type { VideoResult } from "@/lib/types";
import { Play, AlertCircle, Youtube, Loader2 } from "lucide-react";

export function VideoEmbed({ career, topic }: { career: string; topic: string }) {
  const [videos, setVideos] = useState<VideoResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [broken, setBroken] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/videos?career=${encodeURIComponent(career)}&topic=${encodeURIComponent(topic)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((d) => {
        if (cancelled) return;
        setVideos(d.videos ?? []);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [career, topic]);

  const available = (videos ?? []).filter((_, i) => !broken.has(i));
  const active = available[Math.min(activeIdx, Math.max(0, available.length - 1))];

  function reportBroken() {
    if (!active || !videos) return;
    const idx = videos.indexOf(active);
    setBroken((b) => new Set(b).add(idx));
    setActiveIdx((i) => Math.min(i + 1, available.length - 1));
  }

  return (
    <section className="card-pop overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <Youtube className="h-4 w-4 text-coral" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Watch &amp; learn
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {videos ? `${available.length} real videos found` : "searching…"}
        </span>
      </div>

      {!videos && !error && (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Finding real, available videos…
        </div>
      )}

      {error && (
        <div className="p-6 text-sm">
          <div className="flex items-center gap-2 font-[family-name:var(--font-display-tf)] text-lg">
            <AlertCircle className="h-4 w-4 text-destructive" /> Couldn&apos;t load videos
          </div>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} tutorial`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-primary hover:underline"
          >
            Search YouTube for &ldquo;{topic}&rdquo; →
          </a>
        </div>
      )}

      {videos && available.length === 0 && (
        <div className="p-6 text-sm">
          <div className="font-[family-name:var(--font-display-tf)] text-lg">No videos found</div>
          <p className="mt-1 text-muted-foreground">
            We searched YouTube for real, current videos but came up empty. Try a manual search:
          </p>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} tutorial`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-primary hover:underline"
          >
            Search YouTube →
          </a>
        </div>
      )}

      {active && (
        <>
          <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
            <iframe
              key={active.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?rel=0`}
              title={active.title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="p-4">
            <div className="font-[family-name:var(--font-display-tf)] text-lg leading-tight">
              {active.title}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>via {active.creator}</span>
              <button
                onClick={reportBroken}
                className="underline hover:text-foreground"
                type="button"
              >
                video broken? try next →
              </button>
            </div>

            {available.length > 1 && (
              <div className="mt-4 border-t border-border/60 pt-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  More videos
                </div>
                <div className="scroll-soft grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {available.map((v, i) => (
                    <button
                      key={v.youtubeId}
                      onClick={() => setActiveIdx(videos.indexOf(v))}
                      className={`flex gap-2 rounded-lg border p-1.5 text-left transition ${
                        v.youtubeId === active.youtubeId
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-sun/30"
                      }`}
                    >
                      <img
                        src={v.thumbnail}
                        alt=""
                        className="h-12 w-20 shrink-0 rounded object-cover"
                        loading="lazy"
                      />
                      <span className="line-clamp-2 text-xs font-medium">{v.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

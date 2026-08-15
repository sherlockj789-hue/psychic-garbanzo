"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProgressEntry } from "@/lib/types";

type ProgressState = {
  entries: ProgressEntry[];
  goalCareer: string | null;
  setGoalCareer: (slug: string) => void;
  isLessonDone: (key: string) => boolean;
  recordLesson: (entry: ProgressEntry) => void;
  stageProgress: (careerSlug: string, grade: number, total: number) => { done: number; pct: number };
  totalXp: () => number;
  reset: () => void;
};

const lessonKey = (careerSlug: string, grade: number, lesson: number) =>
  `${careerSlug}/${grade}/${lesson}`;

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      entries: [],
      goalCareer: null,
      setGoalCareer: (slug) => set({ goalCareer: slug }),
      isLessonDone: (key) => get().entries.some((e) => e.key === key),
      recordLesson: (entry) =>
        set((s) =>
          s.entries.some((e) => e.key === entry.key)
            ? s
            : { entries: [...s.entries, entry] },
        ),
      stageProgress: (careerSlug, grade, total) => {
        const done = get().entries.filter(
          (e) => e.key.startsWith(`${careerSlug}/${grade}/`),
        ).length;
        return { done, pct: total ? Math.round((done / total) * 100) : 0 };
      },
      totalXp: () => get().entries.reduce((s, e) => s + e.xp, 0),
      reset: () => set({ entries: [], goalCareer: null }),
    }),
    { name: "wise-world-school-progress" },
  ),
);

export { lessonKey };

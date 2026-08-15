import type { Grade, LessonBlueprint, GameType } from "@/lib/types";

export const GRADES: Grade[] = [
  { num: 1,  title: "Grade 1 — First Look",        focus: "What this job actually is",          summary: "Meet the field. See the day-to-day. Learn the words." },
  { num: 2,  title: "Grade 2 — The Tools",         focus: "The gear, apps, and materials",       summary: "Every craft has tools. Learn what they are and why." },
  { num: 3,  title: "Grade 3 — Core Tasks",        focus: "What you actually do all day",        summary: "Break the job into tasks a beginner can already start." },
  { num: 4,  title: "Grade 4 — People Skills",     focus: "How to talk, listen, work with others", summary: "No job is solo. Learn how the humans work." },
  { num: 5,  title: "Grade 5 — Safety & Ethics",   focus: "Rules that protect you and others",   summary: "Do it right. Do it safely. Don't be a jerk." },
  { num: 6,  title: "Grade 6 — Money Basics",      focus: "How this job earns money",            summary: "Pricing, pay, invoices, taxes — for this line of work." },
  { num: 7,  title: "Grade 7 — Problem Solving",   focus: "When it doesn't go to plan",          summary: "Every job is problems in a trench coat. Here's how pros think." },
  { num: 8,  title: "Grade 8 — Deep Practice",     focus: "The hard parts, done slow",           summary: "Slow reps on the tricky stuff. Get past 'kinda good'." },
  { num: 9,  title: "Grade 9 — Case Studies",      focus: "Real stories, real people",           summary: "Learn from what the greats did — and what they messed up." },
  { num: 10, title: "Grade 10 — Advanced Craft",   focus: "Techniques amateurs never touch",     summary: "This is where hobbyist ends and professional begins." },
  { num: 11, title: "Grade 11 — Business of You",  focus: "Getting hired, getting clients",      summary: "Resumes, portfolios, contracts, self-promotion." },
  { num: 12, title: "Grade 12 — Mastery & Legacy", focus: "Growing, teaching, lasting",          summary: "Stay sharp for decades. Give it forward." },
];

export const LESSONS_PER_GRADE = 10;

// 10 lesson archetypes reused across every grade, flavored by the grade's theme.
// Title uses "{career}" as a placeholder replaced at render.
// `angle` instructs the AI what to actually research & write about.
const ARCHETYPES: Omit<LessonBlueprint, "index">[] = [
  {
    kind: "intro",
    title: "Intro — {grade}",
    minutes: 6,
    xp: 15,
    angle:
      "An honest introduction to this grade's focus for someone who wants to become a {career}. Explain what this stage is really about, why it matters on the real path to this career, and what a beginner should walk away understanding. Set expectations: no hype, just the truth.",
    game: "quiz",
  },
  {
    kind: "vocabulary",
    title: "The words a {career} actually uses",
    minutes: 8,
    xp: 20,
    angle:
      "Teach the real, current vocabulary and jargon working {career}s use day to day — not generic words. For each term give a precise definition and a one-line example of it being used in the real work. Include at least 5 genuinely field-specific terms.",
    game: "memory",
  },
  {
    kind: "tools",
    title: "The tools a {career} relies on",
    minutes: 7,
    xp: 15,
    angle:
      "Cover the real tools, software, equipment, or materials a working {career} uses today (name specific, real products/tools where accurate). Explain what each is for and why a pro reaches for it. Note which are essential vs. nice-to-have and realistic starting costs.",
    game: "arcade",
  },
  {
    kind: "day-in-life",
    title: "A real day as a {career}",
    minutes: 6,
    xp: 15,
    angle:
      "Describe an authentic day in the life of a {career} — the actual rhythm, tasks, and time breakdown a real practitioner experiences. Be concrete about the boring 80% and the exciting 20%. Cite real working conditions where known.",
    game: "arcade",
  },
  {
    kind: "technique",
    title: "A core technique of the {career} trade",
    minutes: 8,
    xp: 20,
    angle:
      "Teach ONE genuine, foundational technique or method a {career} must learn at this stage. Break it into clear steps a beginner could actually try. Explain why it works and the most common way beginners get it wrong.",
    game: "scenario",
  },
  {
    kind: "ethics",
    title: "Safety, ethics & professionalism for a {career}",
    minutes: 7,
    xp: 15,
    angle:
      "Cover the real safety rules, legal duties, licensing/consent issues, and professional ethics a {career} must follow. Reference real regulations, codes of conduct, or professional bodies where they exist. Be specific, not generic.",
    game: "scenario",
  },
  {
    kind: "money",
    title: "How a {career} actually makes money",
    minutes: 7,
    xp: 15,
    angle:
      "Explain how {career}s really earn: typical pay ranges (with real, current figures and currency), employment vs. freelance, pricing models, how long it takes to become profitable, and the biggest money mistakes beginners make in this field.",
    game: "quiz",
  },
  {
    kind: "case-study",
    title: "A real case study from the {career} world",
    minutes: 9,
    xp: 25,
    angle:
      "Tell a real, named case study from the {career} field — a real person, company, project, or public event. Explain what happened, what they did well, what went wrong, and the concrete lesson a learner should take from it. Use real, verifiable facts.",
    game: "scenario",
  },
  {
    kind: "practice",
    title: "Practice challenge — try the {career} work",
    minutes: 10,
    xp: 25,
    angle:
      "Give a small but real practice challenge a beginner could actually do this week to build {career} skill — using free/cheap tools. Describe the task, what 'good' looks like, how to self-check, and how long it should take. Make it genuinely doable.",
    game: "sequence",
  },
  {
    kind: "recap",
    title: "Recap — what you now know about being a {career}",
    minutes: 5,
    xp: 15,
    angle:
      "Recap the most important takeaways from this grade for a future {career}. Tie the threads together, name the 3 things that matter most, and point clearly to what to focus on in the next grade. Keep it tight and honest.",
    game: "quiz",
  },
];

function archetypeGame(kind: LessonBlueprint["kind"]): GameType {
  const a = ARCHETYPES.find((x) => x.kind === kind);
  return (a?.game as GameType) ?? "quiz";
}

export function getGradeLessons(_careerSlug: string, gradeNum: number): LessonBlueprint[] {
  const grade = GRADES[gradeNum - 1];
  if (!grade) return [];
  return ARCHETYPES.map((a, i) => ({
    index: i + 1,
    kind: a.kind,
    title: a.title.replace("{grade}", grade.title.split(" — ")[1]),
    minutes: a.minutes,
    xp: a.xp,
    angle: a.angle,
  }));
}

export function getLessonBlueprint(gradeNum: number, lessonIdx: number): LessonBlueprint | undefined {
  const grade = GRADES[gradeNum - 1];
  if (!grade) return undefined;
  const a = ARCHETYPES[lessonIdx - 1];
  if (!a) return undefined;
  return {
    index: lessonIdx,
    kind: a.kind,
    title: a.title.replace("{grade}", grade.title.split(" — ")[1]),
    minutes: a.minutes,
    xp: a.xp,
    angle: a.angle,
  };
}

export function lessonGameType(lessonKind: LessonBlueprint["kind"]): GameType {
  return archetypeGame(lessonKind);
}

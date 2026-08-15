// Shared types for Wise World School.

export type CareerGroup =
  | "Creators"
  | "Sports & Body"
  | "Medicine"
  | "Public Service"
  | "Tech"
  | "Science"
  | "Business"
  | "Design & Style"
  | "Trades"
  | "Food"
  | "Travel"
  | "Animals & Outdoors";

export type Career = {
  slug: string;
  name: string;
  emoji: string;
  group: CareerGroup;
  tagline: string;
  color: "sun" | "mint" | "ocean" | "coral";
};

// ---- Curriculum structure (no content — content comes from /api/lesson) ----

export type LessonKind =
  | "intro"
  | "vocabulary"
  | "tools"
  | "day-in-life"
  | "technique"
  | "ethics"
  | "money"
  | "case-study"
  | "practice"
  | "recap";

export type LessonBlueprint = {
  index: number; // 1..LESSONS_PER_GRADE
  kind: LessonKind;
  title: string; // template — {career} replaced at render
  minutes: number;
  xp: number;
  /** The angle the LLM should write about for this lesson. */
  angle: string;
};

export type Grade = {
  num: number; // 1..12
  title: string;
  summary: string;
  focus: string;
};

// ---- API response shapes ----

export type LessonSection = { heading: string; body: string };

export type LessonCheck = {
  q: string;
  options: string[];
  correct: number;
  explain: string;
};

export type KeyTerm = { term: string; def: string };

export type Source = { title: string; url: string; host: string };

export type GameType = "quiz" | "scenario" | "memory" | "sequence" | "arcade";

export type Lesson = {
  career: string;
  grade: number;
  lesson: number;
  title: string;
  kind: LessonKind;
  minutes: number;
  xp: number;
  sections: LessonSection[];
  keyTerms: KeyTerm[];
  check: LessonCheck;
  reflect: string;
  game: GameType;
  sources: Source[];
};

export type VideoResult = {
  youtubeId: string;
  title: string;
  url: string;
  creator: string;
  thumbnail: string;
};

// ---- Game content shapes (returned by /api/game) ----

export type QuizQuestion = {
  q: string;
  options: string[];
  correct: number;
  explain: string;
};

export type QuizContent = {
  type: "quiz";
  topic: string;
  questions: QuizQuestion[];
};

export type ScenarioNode = {
  id: string;
  text: string;
  choices?: { text: string; next: string; skill?: number; rep?: number; money?: number; feedback?: string }[];
  ending?: { title: string; body: string; win: boolean };
};

export type ScenarioContent = {
  type: "scenario";
  topic: string;
  setting: string;
  start: string;
  nodes: Record<string, ScenarioNode>;
};

export type SequenceContent = {
  type: "sequence";
  topic: string;
  prompt: string;
  steps: string[]; // in correct order
};

export type ArcadeContent = {
  type: "arcade";
  topic: string;
  prompt: string;          // e.g. "Catch: things a nurse actually does"
  goodTargets: string[];   // items to catch
  badTargets: string[];    // items to avoid
};

export type MemoryPair = { term: string; def: string };
export type MemoryContent = {
  type: "memory";
  topic: string;
  prompt: string;
  pairs: MemoryPair[];
};

export type GameContent = QuizContent | ScenarioContent | SequenceContent | ArcadeContent | MemoryContent;

// ---- Progress (localStorage) ----

export type ProgressEntry = {
  kind: "lesson";
  key: string; // `${careerSlug}/${grade}/${lesson}`
  label: string;
  xp: number;
  at: number;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

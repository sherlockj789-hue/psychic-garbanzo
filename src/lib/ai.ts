import "server-only";
import ZAI from "z-ai-web-dev-sdk";
import type {
  Lesson,
  LessonBlueprint,
  VideoResult,
  ChatMessage,
  QuizContent,
  ScenarioContent,
  SequenceContent,
  ArcadeContent,
  MemoryContent,
  Source,
} from "@/lib/types";
import { getCareer } from "@/data/careers";
import { GRADES, getLessonBlueprint, lessonGameType } from "@/data/curriculum";

// ---- Skill mini-lesson type ----
export type SkillLesson = {
  slug: string;
  title: string;
  what: string;
  why: string;
  practice: string;
  example: string;
  keyPoints: string[];
};


// ---- Job Simulator types ----
export type SimChoice = {
  label: string;
  money?: number;
  rep?: number;
  skill?: number;
  energy?: number;
  outcome: string;
};
export type SimEvent = {
  title: string;
  situation: string;
  choices: SimChoice[];
};
export type SimShift = {
  intro: string;
  startingMoney: number;
  events: SimEvent[];
};

// ---- SDK singleton ----
let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZai() {
  if (!_zai) _zai = await ZAI.create();
  return _zai;
}

// ---- In-memory caches ----
const lessonCache = new Map<string, Lesson>();
const videoCache = new Map<string, VideoResult[]>();
const quizCache = new Map<string, QuizContent>();
const scenarioCache = new Map<string, ScenarioContent>();
const sequenceCache = new Map<string, SequenceContent>();
const shiftCache = new Map<string, SimShift>();
const arcadeCache = new Map<string, ArcadeContent>();
const skillCache = new Map<string, SkillLesson>();
const memoryCache = new Map<string, MemoryContent>();

// ---- Helpers ----

type SearchResult = {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
  favicon: string;
};

async function searchWeb(query: string, num = 6): Promise<SearchResult[]> {
  try {
    const zai = await getZai();
    const res = await zai.functions.invoke("web_search", { query, num });
    return Array.isArray(res) ? (res as SearchResult[]) : [];
  } catch {
    return [];
  }
}

/** Extract a JSON object/array from a model response that may include fences or prose. */
function extractJson(text: string): unknown {
  let t = text.trim();
  // strip markdown code fences
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // find first { or [ and last matching close
  const start = t.search(/[{[]/);
  if (start === -1) throw new Error("No JSON found in response");
  const open = t[start];
  const close = open === "{" ? "}" : "]";
  const end = t.lastIndexOf(close);
  if (end === -1) throw new Error("Malformed JSON in response");
  const slice = t.slice(start, end + 1);
  return JSON.parse(slice);
}

async function chatJson(system: string, user: string): Promise<unknown> {
  const zai = await getZai();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    thinking: { type: "disabled" },
  });
  const content = completion.choices[0]?.message?.content ?? "";
  return extractJson(content);
}

async function chatText(system: string, user: string): Promise<string> {
  const zai = await getZai();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    thinking: { type: "disabled" },
  });
  return completion.choices[0]?.message?.content ?? "";
}

// ============================================================
// LESSON GENERATION — web-search-grounded, expert-style content
// ============================================================

const LESSON_SYSTEM = `You are the lead curriculum writer for Wise World School, a free career school.
You write honest, specific, expert-level lessons that teach someone how to ACTUALLY become a given career.

Rules:
- Use ONLY real, accurate, verifiable information. Ground every fact in the provided search results when possible, and your genuine knowledge of real requirements (education, certifications, tools, regulations, pay).
- Be specific: name real tools, real certifications, real professional bodies, real salary figures with currency. No vague filler.
- Be honest: if the path is long, say so. If pay is low at first, say so. No hype, no motivational fluff.
- Write for a motivated beginner. Clear, direct, practical. Short paragraphs.
- In "body" fields you may use \\n for line breaks and "• " for bullet points. Keep bodies focused.
- The "check" must test a real, non-trivial understanding from the lesson (not a trick). 4 options, exactly one correct.
- "keyTerms" must be genuinely field-specific (not generic English words).
- "sources" lists the real sources you relied on (title, url, host). Include 2-5 when available.
- Output STRICT JSON only. No markdown, no commentary.`;

export async function generateLesson(
  careerSlug: string,
  gradeNum: number,
  lessonIdx: number,
): Promise<Lesson | null> {
  const cacheKey = `${careerSlug}/${gradeNum}/${lessonIdx}`;
  const cached = lessonCache.get(cacheKey);
  if (cached) return cached;

  const career = getCareer(careerSlug);
  const grade = GRADES[gradeNum - 1];
  const bp = getLessonBlueprint(gradeNum, lessonIdx);
  if (!career || !grade || !bp) return null;

  // 1. Gather real, current information via web search.
  const queries = [
    `how to become a ${career.name} ${grade.focus.toLowerCase()}`,
    `${career.name} requirements education salary`,
  ];
  const results = (
    await Promise.all(queries.map((q) => searchWeb(q, 5)))
  ).flat();
  const deduped = results.filter(
    (r, i, arr) => arr.findIndex((x) => x.url === r.url) === i,
  );
  const searchContext = deduped
    .slice(0, 8)
    .map((r, i) => `${i + 1}. ${r.name}\n${r.url}\n${r.snippet}`)
    .join("\n\n");
  const sources: Source[] = deduped
    .slice(0, 6)
    .map((r) => ({ title: r.name, url: r.url, host: r.host_name }));

  const angle = bp.angle
    .replaceAll("{career}", career.name)
    .replaceAll("{grade}", grade.title);

  const user = `Career: ${career.name}
Grade: ${grade.title} (focus: ${grade.focus})
Lesson ${lessonIdx} of ${10}: "${bp.title}"
Lesson angle: ${angle}

Real search results about this career (use these to ground facts; cite them in sources):
${searchContext || "(no search results available — rely on your accurate knowledge of this career)"}

Write this lesson. Output JSON with EXACTLY this shape:
{
  "title": string,
  "sections": [{"heading": string, "body": string}],
  "keyTerms": [{"term": string, "def": string}],
  "check": {"q": string, "options": [string,string,string,string], "correct": number, "explain": string},
  "reflect": string,
  "sources": [{"title": string, "url": string, "host": string}]
}
Provide 3-5 sections, 4-6 keyTerms, and 2-5 sources. The "correct" index is 0-based.`;

  let parsed: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    try {
      parsed = (await chatJson(LESSON_SYSTEM, user)) as Record<string, unknown>;
    } catch {
      /* retry once */
    }
  }
  if (!parsed) return fallbackLesson(career.name, careerSlug, gradeNum, bp);

  const lesson: Lesson = {
    career: careerSlug,
    grade: gradeNum,
    lesson: lessonIdx,
    title: String(parsed.title ?? bp.title.replaceAll("{career}", career.name)),
    kind: bp.kind,
    minutes: bp.minutes,
    xp: bp.xp,
    sections: Array.isArray(parsed.sections)
      ? (parsed.sections as { heading: string; body: string }[]).map((s) => ({
          heading: String(s.heading ?? ""),
          body: String(s.body ?? ""),
        }))
      : [],
    keyTerms: Array.isArray(parsed.keyTerms)
      ? (parsed.keyTerms as { term: string; def: string }[]).map((t) => ({
          term: String(t.term ?? ""),
          def: String(t.def ?? ""),
        }))
      : [],
    check: normalizeCheck(parsed.check),
    reflect: String(parsed.reflect ?? "What is one thing you'd want to practice first?"),
    game: lessonGameType(bp.kind),
    sources: Array.isArray(parsed.sources) && (parsed.sources as unknown[]).length
      ? (parsed.sources as Source[]).map((s) => ({
          title: String(s.title ?? ""),
          url: String(s.url ?? ""),
          host: String(s.host ?? ""),
        }))
      : sources,
  };

  lessonCache.set(cacheKey, lesson);
  return lesson;
}

function normalizeCheck(raw: unknown): Lesson["check"] {
  if (typeof raw !== "object" || raw === null) {
    return {
      q: "What's the most important thing to take from this lesson?",
      options: ["A", "B", "C", "D"],
      correct: 0,
      explain: "Review the lesson sections above.",
    };
  }
  const c = raw as Record<string, unknown>;
  const options = Array.isArray(c.options)
    ? (c.options as unknown[]).map((o) => String(o))
    : [];
  while (options.length < 4) options.push("—");
  return {
    q: String(c.q ?? ""),
    options: options.slice(0, 4),
    correct: Math.min(3, Math.max(0, Number(c.correct ?? 0) || 0)),
    explain: String(c.explain ?? ""),
  };
}

function fallbackLesson(
  careerName: string,
  careerSlug: string,
  gradeNum: number,
  bp: LessonBlueprint,
): Lesson {
  const grade = GRADES[gradeNum - 1];
  return {
    career: careerSlug,
    grade: gradeNum,
    lesson: bp.index,
    title: bp.title.replaceAll("{career}", careerName),
    kind: bp.kind,
    minutes: bp.minutes,
    xp: bp.xp,
    sections: [
      {
        heading: "About this lesson",
        body: `This ${grade.title} lesson focuses on: ${grade.focus}.\n\nWe're gathering real, expert-grounded content for ${careerName}. If this lesson didn't load fully, please refresh in a moment — each lesson is researched fresh the first time it's opened.`,
      },
    ],
    keyTerms: [],
    check: {
      q: `What is the main focus of ${grade.title}?`,
      options: [grade.focus, "Memorizing facts", "Watching ads", "Nothing in particular"],
      correct: 0,
      explain: grade.summary,
    },
    reflect: "What's one thing you already know about this career?",
    game: lessonGameType(bp.kind),
    sources: [],
  };
}

// ============================================================
// VIDEO FINDER — real, currently-available YouTube videos
// ============================================================

const YT_ID_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export async function findVideos(careerSlug: string, _topic?: string): Promise<VideoResult[]> {
  // Videos are searched by CAREER (not the noisy lesson title) so results are
  // reliable and reusable across a career's lessons. Cached per career.
  const cached = videoCache.get(careerSlug);
  if (cached) return cached;

  const career = getCareer(careerSlug);
  if (!career) return [];

  const queries = [
    `${career.name} tutorial for beginners youtube`,
    `${career.name} day in the life youtube`,
    `how to become a ${career.name} youtube`,
  ];
  const results = (await Promise.all(queries.map((q) => searchWeb(q, 6)))).flat();

  const seen = new Set<string>();
  const videos: VideoResult[] = [];
  for (const r of results) {
    const m = r.url.match(YT_ID_RE);
    if (!m) continue;
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const creator = r.host_name.replace(/^www\./, "");
    videos.push({
      youtubeId: id,
      title: r.name.replace(/ - YouTube$/i, "").trim(),
      url: `https://www.youtube.com/watch?v=${id}`,
      creator,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    });
    if (videos.length >= 6) break;
  }

  videoCache.set(careerSlug, videos);
  return videos;
}

// ============================================================
// AI TEACHER
// ============================================================

export async function teacherChat(
  question: string,
  context: string | undefined,
  history: ChatMessage[],
): Promise<string> {
  const system = `You are the Wise World School AI teacher — patient, honest, and practical.
You help learners understand careers and skills. You give real, accurate information and admit clearly when you don't know something.
Keep answers concise and useful. Use plain language. When relevant, suggest a concrete next step.${context ? `\nContext: ${context}` : ""}`;

  const messages = [
    { role: "system" as const, content: system },
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: question },
  ];

  // Retry up to 3 times so the teacher never appears "broken" to the learner.
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const zai = await getZai();
      const completion = await zai.chat.completions.create({
        messages,
        thinking: { type: "disabled" },
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (text && text.length > 0) return text;
      throw new Error("Empty response");
    } catch (e) {
      lastErr = e;
      // brief backoff before retry
      if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }

  // All retries failed — return a graceful, still-useful fallback instead of an error.
  // This keeps the teacher "always on" from the user's perspective.
  const careerHint = context ? ` (about ${context})` : "";
  return (
    `I had trouble reaching my full knowledge right now, but here's what I can tell you${careerHint}:\n\n` +
    `That's a great question. If you're learning this in a lesson above, re-read the "Key terms" ` +
    `and sections — they usually cover the answer. You can also try asking me again in a moment, ` +
    `or rephrase your question to be more specific.\n\n` +
    `(If this keeps happening, refresh the page — the connection resets automatically.)`
  );
}

// ============================================================
// GAME CONTENT GENERATORS
// ============================================================

const GAME_SYSTEM_BASE =
  "You create educational game content for Wise World School. All content must be factually accurate about the real career. Output STRICT JSON only — no markdown, no commentary.";

export async function generateQuiz(careerSlug: string, topic: string): Promise<QuizContent> {
  const cacheKey = `${careerSlug}::${topic}`;
  const cached = quizCache.get(cacheKey);
  if (cached) return cached;

  const career = getCareer(careerSlug);
  const careerName = career?.name ?? topic;
  const user = `Create 5 multiple-choice quiz questions about "${topic}" for someone learning to become a ${careerName}.
Each question must test a real, non-trivial fact about the career (real tools, real requirements, real facts).
JSON shape:
{"type":"quiz","topic":"${topic}","questions":[{"q":string,"options":[string,string,string,string],"correct":number,"explain":string}]}
"correct" is 0-based. Make wrong options plausible but clearly wrong.`;

  let parsed: QuizContent | null = null;
  try {
    const raw = await chatJson(`${GAME_SYSTEM_BASE} You write quiz questions.`, user);
    parsed = raw as QuizContent;
    if (!parsed || !Array.isArray(parsed.questions)) parsed = null;
  } catch {
    /* ignore */
  }
  if (!parsed) {
    parsed = {
      type: "quiz",
      topic,
      questions: [
        {
          q: `What does a ${careerName} primarily do?`,
          options: ["A", "B", "C", "D"],
          correct: 0,
          explain: "Refresh to load real questions.",
        },
      ],
    };
  }
  quizCache.set(cacheKey, parsed);
  return parsed;
}

export async function generateScenario(careerSlug: string, topic: string): Promise<ScenarioContent> {
  const cacheKey = `${careerSlug}::${topic}`;
  const cached = scenarioCache.get(cacheKey);
  if (cached) return cached;

  const career = getCareer(careerSlug);
  const careerName = career?.name ?? topic;
  const user = `Create a branching scenario game about "${topic}" for a future ${careerName}.
The player makes real-feeling decisions and sees consequences on three meters: skill, rep, money (each choice may adjust them).
Use 5-7 nodes total. Exactly one node is the start; include 2 endings (one good, one bad). Keep node ids short (e.g. "n1").
JSON shape:
{"type":"scenario","topic":"${topic}","setting":string,"start":"n1","nodes":{"n1":{"text":string,"choices":[{"text":string,"next":string,"skill":number,"rep":number,"money":number,"feedback":string}]},"n2":{"text":string,"ending":{"title":string,"body":string,"win":boolean}}}}
Deltas are small integers (-3..+3). All "next" ids must exist in nodes.`;

  let parsed: ScenarioContent | null = null;
  try {
    const raw = await chatJson(`${GAME_SYSTEM_BASE} You design branching scenarios.`, user);
    parsed = raw as ScenarioContent;
    if (!parsed || !parsed.nodes || !parsed.start) parsed = null;
  } catch {
    /* ignore */
  }
  if (!parsed) {
    parsed = {
      type: "scenario",
      topic,
      setting: `A day as a ${careerName}`,
      start: "n1",
      nodes: {
        n1: {
          text: "Scenario content is loading. Try again in a moment.",
          ending: { title: "Paused", body: "Refresh to play.", win: true },
        },
      },
    };
  }
  scenarioCache.set(cacheKey, parsed);
  return parsed;
}

export async function generateSequence(careerSlug: string, topic: string): Promise<SequenceContent> {
  const cacheKey = `${careerSlug}::${topic}`;
  const cached = sequenceCache.get(cacheKey);
  if (cached) return cached;

  const career = getCareer(careerSlug);
  const careerName = career?.name ?? topic;
  const user = `Create a sequence game about "${topic}" for a future ${careerName}.
Give a real, ordered multi-step process a ${careerName} actually follows (6 steps). The player must put them in the correct order.
JSON shape:
{"type":"sequence","topic":"${topic}","prompt":string,"steps":[string,string,string,string,string,string]}
Steps must be in the CORRECT order. Each step short (under 12 words).`;

  let parsed: SequenceContent | null = null;
  try {
    const raw = await chatJson(`${GAME_SYSTEM_BASE} You write ordered procedures.`, user);
    parsed = raw as SequenceContent;
    if (!parsed || !Array.isArray(parsed.steps) || parsed.steps.length < 4) parsed = null;
  } catch {
    /* ignore */
  }
  if (!parsed) {
    parsed = {
      type: "sequence",
      topic,
      prompt: `Put these ${careerName} steps in order.`,
      steps: ["Step one", "Step two", "Step three", "Step four"],
    };
  }
  sequenceCache.set(cacheKey, parsed);
  return parsed;
}

// ============================================================
// JOB SIMULATOR — realistic career "shift" decision sim
// ============================================================

const SIM_SYSTEM = `You design realistic career decision simulations for Wise World School, a free career school.
Use real, accurate career knowledge — real tools, real situations, real trade-offs a person in this job actually faces on a single shift.

Rules:
- Each event must be a believable decision that genuinely comes up during a real shift for this career. No generic filler.
- Each event has exactly 3 choices, each with a clear trade-off (no obviously "correct" answer — every choice costs something).
- Deltas: money is in realistic local currency units (small range like ±50..±300 is typical; sometimes larger for high-stakes roles). rep / skill / energy are small integers in the range -3..+3.
- Each choice's "outcome" is a single concrete sentence describing what actually happens — honest, specific, no motivational fluff.
- "startingMoney" is realistic for one shift in this career (e.g. 100–2000 in local currency; higher for medical/legal/business, lower for creative/entry roles).
- "intro" is one or two sentences setting the scene for the shift.
- Output STRICT JSON only — no markdown fences, no commentary.`;

function numOr(v: unknown, d: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function normalizeShift(raw: Record<string, unknown>, careerName: string): SimShift | null {
  const eventsRaw = Array.isArray(raw.events) ? (raw.events as unknown[]) : [];
  const events: SimEvent[] = [];
  for (const e of eventsRaw) {
    if (typeof e !== "object" || e === null) continue;
    const ev = e as Record<string, unknown>;
    const title = String(ev.title ?? "").trim();
    const situation = String(ev.situation ?? "").trim();
    if (!title || !situation) continue;
    const choicesRaw = Array.isArray(ev.choices) ? (ev.choices as unknown[]) : [];
    const choices: SimChoice[] = [];
    for (const c of choicesRaw) {
      if (typeof c !== "object" || c === null) continue;
      const ch = c as Record<string, unknown>;
      const label = String(ch.label ?? "").trim();
      const outcome = String(ch.outcome ?? "").trim();
      if (!label || !outcome) continue;
      choices.push({
        label,
        money: numOr(ch.money, 0),
        rep: numOr(ch.rep, 0),
        skill: numOr(ch.skill, 0),
        energy: numOr(ch.energy, 0),
        outcome,
      });
      if (choices.length >= 3) break;
    }
    if (choices.length < 2) continue;
    events.push({ title, situation, choices });
    if (events.length >= 8) break;
  }
  if (events.length < 4) return null;
  const startingMoney = Math.max(1, Math.round(numOr(raw.startingMoney, 200)));
  const intro =
    String(raw.intro ?? "").trim() || `A realistic shift as a ${careerName}. Make the calls a real ${careerName} makes.`;
  return { intro, startingMoney, events };
}

function fallbackShift(careerName: string): SimShift {
  return {
    intro: `A realistic shift as a ${careerName}. You'll face the kinds of decisions a real ${careerName} actually makes — each one trades something for something else.`,
    startingMoney: 250,
    events: [
      {
        title: "Start of shift",
        situation: "You arrive at work. The first task is waiting — how do you begin?",
        choices: [
          { label: "Set up carefully and review the plan", skill: 2, rep: 0, money: 0, energy: -1, outcome: "You start organized. The rest of the shift goes smoother." },
          { label: "Dive straight in", skill: -1, rep: 1, money: 10, energy: -2, outcome: "Fast start, but you miss a small detail that costs you later." },
          { label: "Check in with the team first", skill: 0, rep: 2, money: 0, energy: 1, outcome: "People feel heard. Slight delay, but better coordination." },
        ],
      },
      {
        title: "A problem comes up",
        situation: "Something doesn't go as planned mid-shift. What do you do?",
        choices: [
          { label: "Pause and diagnose it properly", skill: 2, rep: 0, money: -20, energy: -1, outcome: "You find the real cause. It costs time but the fix holds." },
          { label: "Patch it fast and move on", skill: -1, rep: 1, money: 30, energy: -1, outcome: "Quick fix gets you moving, but it might come back later." },
          { label: "Ask a more experienced coworker", skill: 1, rep: 1, money: 0, energy: 0, outcome: "You learn the right way to handle it for next time." },
        ],
      },
      {
        title: "A customer / client moment",
        situation: "Someone you're serving is unhappy. How do you handle it?",
        choices: [
          { label: "Listen, then fix it", skill: 0, rep: 3, money: -15, energy: -1, outcome: "They leave happier than they came — and remember it." },
          { label: "Explain the policy firmly", skill: 0, rep: -1, money: 0, energy: 1, outcome: "You're technically right, but they're not pleased." },
          { label: "Offer a small freebie", skill: 0, rep: 2, money: -30, energy: 0, outcome: "Costs you a bit, but they smile and tell a friend." },
        ],
      },
      {
        title: "Tired stretch",
        situation: "Energy is dipping. The shift isn't over yet. What do you do?",
        choices: [
          { label: "Push through — caffeine later", skill: -1, rep: 0, money: 10, energy: -3, outcome: "You finish the work, but you're wrecked by the end." },
          { label: "Take a real 5-minute break", skill: 1, rep: 0, money: 0, energy: 2, outcome: "Refreshed. Better focus for the rest of the shift." },
          { label: "Switch to easier tasks", skill: 0, rep: -1, money: -10, energy: 1, outcome: "Safer, but the hard stuff is still waiting tomorrow." },
        ],
      },
      {
        title: "End-of-shift records",
        situation: "The work is done, but the records need updating. Your call?",
        choices: [
          { label: "Do it properly now", skill: 1, rep: 1, money: 0, energy: -1, outcome: "Tomorrow-you thanks present-you. Clean handoff." },
          { label: "Quick notes, finish tomorrow", skill: 0, rep: -1, money: 0, energy: 1, outcome: "You'll pay for it in the morning, but you leave on time." },
          { label: "Skip it", skill: 0, rep: -2, money: 0, energy: 2, outcome: "Out the door fast. Risky if anyone checks the logs." },
        ],
      },
    ],
  };
}

export async function generateShift(careerSlug: string): Promise<SimShift | null> {
  const cached = shiftCache.get(careerSlug);
  if (cached) return cached;

  const career = getCareer(careerSlug);
  if (!career) return null;

  // Ground the scenarios in real, current info about this career.
  const results = await searchWeb(`${career.name} challenges decisions day to day`, 5);
  const searchContext = results
    .slice(0, 5)
    .map((r, i) => `${i + 1}. ${r.name}\n${r.snippet}`)
    .join("\n\n");

  const user = `Career: ${career.name} (${career.group})
Tagline: ${career.tagline}

Real context about what this career actually involves (use these to ground the scenarios):
${searchContext || "(no search results — rely on your accurate knowledge of this career)"}

Design a single realistic "shift" simulation: 6 decision events a ${career.name} faces during one work shift.
Each event has a short title, a 1–2 sentence situation, and exactly 3 choices. Each choice has small integer deltas
(money may be larger like ±200; rep / skill / energy are small like -3..+3) and a concrete outcome sentence.

Output JSON with EXACTLY this shape:
{
  "intro": string,
  "startingMoney": number,
  "events": [
    {
      "title": string,
      "situation": string,
      "choices": [
        { "label": string, "money": number, "rep": number, "skill": number, "energy": number, "outcome": string }
      ]
    }
  ]
}`;

  let parsed: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    try {
      parsed = (await chatJson(SIM_SYSTEM, user)) as Record<string, unknown>;
    } catch {
      /* retry once */
    }
  }

  const shift = parsed ? normalizeShift(parsed, career.name) : null;
  const final = shift ?? fallbackShift(career.name);
  shiftCache.set(careerSlug, final);
  return final;
}

// ============================================================
// ARCADE GAME (Catch Fall) — generate good/bad targets
// ============================================================

export async function generateArcade(careerSlug: string, topic: string): Promise<ArcadeContent> {
  const cacheKey = `${careerSlug}::${topic}`;
  const cached = arcadeCache.get(cacheKey);
  if (cached) return cached;

  const career = careerSlug ? getCareer(careerSlug) : undefined;
  const careerName = career?.name ?? topic;
  const user = `Create content for a "catch the right items" arcade game about "${topic}" for someone learning about ${careerName}.
Give 8 items a learner should CATCH (correct/good for this topic) and 6 items they should AVOID (wrong/distractors).
Items must be short (1-4 words), genuinely accurate, and clearly good or bad for the topic.
JSON shape:
{"type":"arcade","topic":"${topic}","prompt":string,"goodTargets":[string x8],"badTargets":[string x6]}
The prompt should tell the player what to catch (e.g. "Catch: tools a ${careerName} actually uses").`;

  let parsed: ArcadeContent | null = null;
  try {
    const raw = await chatJson(`${GAME_SYSTEM_BASE} You design arcade game content.`, user);
    const p = raw as Record<string, unknown>;
    if (p && Array.isArray(p.goodTargets) && Array.isArray(p.badTargets) && p.goodTargets.length >= 4 && p.badTargets.length >= 3) {
      parsed = {
        type: "arcade",
        topic: String(p.topic ?? topic),
        prompt: String(p.prompt ?? `Catch: things related to ${topic}`),
        goodTargets: (p.goodTargets as unknown[]).map((s) => String(s)),
        badTargets: (p.badTargets as unknown[]).map((s) => String(s)),
      };
    }
  } catch {
    /* ignore */
  }
  if (!parsed) {
    parsed = {
      type: "arcade",
      topic,
      prompt: `Catch: things related to ${topic}`,
      goodTargets: ["correct", "right", "true", "good", "yes", "real", "valid", "proper"],
      badTargets: ["wrong", "false", "bad", "no", "fake", "invalid"],
    };
  }
  arcadeCache.set(cacheKey, parsed);
  return parsed;
}

// ============================================================
// SKILL MINI-LESSON — learn-first content for the Practice lab
// ============================================================

const SKILL_SYSTEM = `You are the skills curriculum writer for Wise World School.
You write honest, practical mini-lessons about grown-up life skills (money, mind, people, work).
Rules:
- Use real, accurate, actionable information. No fluff, no hype.
- Be specific and practical — a beginner should be able to act on it today.
- Keep sections concise but substantive.
- "keyPoints" are 4-5 sharp takeaways.
- Output STRICT JSON only — no markdown, no commentary.`;

export async function generateSkill(slug: string, title: string): Promise<SkillLesson> {
  const cached = skillCache.get(slug);
  if (cached) return cached;

  const user = `Skill: ${title}
Write a mini-lesson that teaches this skill to a beginner. Output JSON with EXACTLY this shape:
{
  "title": string,
  "what": string,        // what this skill actually is — 2-4 sentences, plain language
  "why": string,         // why it matters in real life — 2-3 sentences, concrete
  "practice": string,    // how to actually practice/build it — 3-5 sentences, actionable steps
  "example": string,     // a short, real-world example showing the skill in action — 2-4 sentences
  "keyPoints": string[]  // 4-5 sharp, memorable takeaways (each under 12 words)
}`;

  let parsed: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    try {
      parsed = (await chatJson(SKILL_SYSTEM, user)) as Record<string, unknown>;
    } catch {
      /* retry */
    }
  }

  const lesson: SkillLesson = parsed
    ? {
        slug,
        title: String(parsed.title ?? title),
        what: String(parsed.what ?? ""),
        why: String(parsed.why ?? ""),
        practice: String(parsed.practice ?? ""),
        example: String(parsed.example ?? ""),
        keyPoints: Array.isArray(parsed.keyPoints)
          ? (parsed.keyPoints as unknown[]).map((s) => String(s)).slice(0, 6)
          : [],
      }
    : {
        slug,
        title,
        what: `${title} is a core life skill that helps you handle real-world situations better.`,
        why: "It matters because it directly affects how well you navigate work, money, and relationships.",
        practice: "Start small. Practice a little every day. Notice what works and adjust.",
        example: "Imagine a moment where this skill would have made your day easier — that's your practice target.",
        keyPoints: ["Start small", "Practice daily", "Notice and adjust", "Be patient with yourself"],
      };

  skillCache.set(slug, lesson);
  return lesson;
}

// ============================================================
// MEMORY GAME — real career term ↔ definition pairs
// ============================================================

export async function generateMemory(careerSlug: string, topic: string): Promise<MemoryContent> {
  const cacheKey = `${careerSlug}::${topic}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  const career = careerSlug ? getCareer(careerSlug) : undefined;
  const careerName = career?.name ?? topic;
  const user = `Create 6 term-and-definition pairs about "${topic}" for someone learning about ${careerName}.
Each term must be a REAL, field-specific word or concept a ${careerName} actually uses (not generic English).
Each definition must be SHORT — under 10 words, plain language, concrete.
JSON shape:
{"type":"memory","topic":"${topic}","prompt":string,"pairs":[{"term":string,"def":string} x6]}
The prompt should tell the player the goal, e.g. "Match each ${careerName} term to its meaning."`;

  let parsed: MemoryContent | null = null;
  try {
    const raw = await chatJson(`${GAME_SYSTEM_BASE} You create matching-pair content.`, user);
    const p = raw as Record<string, unknown>;
    if (p && Array.isArray(p.pairs) && p.pairs.length >= 4) {
      const pairs = (p.pairs as unknown[]).map((x) => {
        const r = x as Record<string, unknown>;
        return { term: String(r.term ?? ""), def: String(r.def ?? "") };
      }).filter((x) => x.term && x.def);
      if (pairs.length >= 4) {
        parsed = {
          type: "memory",
          topic: String(p.topic ?? topic),
          prompt: String(p.prompt ?? `Match each ${careerName} term to its meaning.`),
          pairs: pairs.slice(0, 6),
        };
      }
    }
  } catch {
    /* ignore */
  }
  if (!parsed) {
    parsed = {
      type: "memory",
      topic,
      prompt: `Match each ${careerName} term to its meaning.`,
      pairs: [
        { term: "Term one", def: "First meaning" },
        { term: "Term two", def: "Second meaning" },
        { term: "Term three", def: "Third meaning" },
        { term: "Term four", def: "Fourth meaning" },
      ],
    };
  }
  memoryCache.set(cacheKey, parsed);
  return parsed;
}

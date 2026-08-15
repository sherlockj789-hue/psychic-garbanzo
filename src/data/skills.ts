import type { GameType } from "@/lib/types";

export type SkillGroup = "Money" | "Mind" | "People" | "Work";

export type Skill = {
  slug: string;
  title: string;
  emoji: string;
  group: SkillGroup;
  tagline: string;
  color: "sun" | "mint" | "ocean" | "coral";
  game: GameType;
};

export const SKILLS: Skill[] = [
  // ---- Money (10) ----
  { slug: "budgeting-saving", title: "Budgeting & Saving", emoji: "💰", group: "Money", tagline: "Keep more than you spend. Boring, powerful.", color: "mint", game: "scenario" },
  { slug: "investing", title: "Investing Basics", emoji: "📈", group: "Money", tagline: "Make money while you sleep — slowly.", color: "ocean", game: "quiz" },
  { slug: "money-management", title: "Money Management", emoji: "🏦", group: "Money", tagline: "The grown-up skill nobody teaches you.", color: "sun", game: "scenario" },
  { slug: "tax-preparation", title: "Taxes, Explained", emoji: "🧾", group: "Money", tagline: "Less scary when you know the words.", color: "coral", game: "sequence" },
  { slug: "negotiation", title: "Negotiation", emoji: "🤝", group: "Money", tagline: "Ask for more. Politely.", color: "coral", game: "scenario" },
  { slug: "credit-scores", title: "Credit Scores & Loans", emoji: "💳", group: "Money", tagline: "The number that follows you everywhere.", color: "ocean", game: "quiz" },
  { slug: "debt-management", title: "Getting Out of Debt", emoji: "⛓️", group: "Money", tagline: "Break the chain, one payment at a time.", color: "coral", game: "sequence" },
  { slug: "side-hustles", title: "Side Hustles", emoji: "🛠️", group: "Money", tagline: "Earn extra without quitting your day job.", color: "sun", game: "scenario" },
  { slug: "insurance-basics", title: "Insurance Basics", emoji: "🛡️", group: "Money", tagline: "Buy peace of mind before you need it.", color: "ocean", game: "quiz" },
  { slug: "retirement-planning", title: "Retirement Planning", emoji: "🌅", group: "Money", tagline: "Pay your future self, starting now.", color: "mint", game: "scenario" },

  // ---- Mind (10) ----
  { slug: "critical-thinking", title: "Critical Thinking", emoji: "🧠", group: "Mind", tagline: "Don't believe everything you think.", color: "ocean", game: "quiz" },
  { slug: "creativity", title: "Creativity", emoji: "💡", group: "Mind", tagline: "A muscle, not a gift.", color: "sun", game: "scenario" },
  { slug: "resilience", title: "Resilience", emoji: "🪨", group: "Mind", tagline: "Bounce back without breaking.", color: "coral", game: "scenario" },
  { slug: "decision-making", title: "Decision Making", emoji: "⚖️", group: "Mind", tagline: "Choose well when it's hard.", color: "ocean", game: "scenario" },
  { slug: "active-learning", title: "Active Learning", emoji: "📚", group: "Mind", tagline: "Learn how to learn.", color: "mint", game: "sequence" },
  { slug: "focus-concentration", title: "Focus & Concentration", emoji: "🎯", group: "Mind", tagline: "Do one thing, fully.", color: "coral", game: "arcade" },
  { slug: "problem-solving", title: "Problem Solving", emoji: "🧩", group: "Mind", tagline: "Break big problems into small wins.", color: "ocean", game: "scenario" },
  { slug: "adaptability", title: "Adaptability", emoji: "🌊", group: "Mind", tagline: "Bend without breaking when things change.", color: "ocean", game: "scenario" },
  { slug: "self-awareness", title: "Self-Awareness", emoji: "🪞", group: "Mind", tagline: "Know yourself — strengths, gaps, triggers.", color: "mint", game: "quiz" },
  { slug: "mental-models", title: "Mental Models", emoji: "🗂️", group: "Mind", tagline: "Think with better frameworks.", color: "sun", game: "sequence" },

  // ---- People (9) ----
  { slug: "communication", title: "Communication", emoji: "🗣️", group: "People", tagline: "Be understood. Understand back.", color: "coral", game: "scenario" },
  { slug: "emotional-intelligence", title: "Emotional Intelligence", emoji: "💗", group: "People", tagline: "Read the room. Including yourself.", color: "mint", game: "scenario" },
  { slug: "teamwork", title: "Teamwork", emoji: "👥", group: "People", tagline: "Ship things with humans.", color: "sun", game: "scenario" },
  { slug: "leadership", title: "Leadership", emoji: "🧭", group: "People", tagline: "Point people at the same hill.", color: "ocean", game: "scenario" },
  { slug: "conflict-resolution", title: "Conflict Resolution", emoji: "🕊️", group: "People", tagline: "Turn fights into fixes.", color: "coral", game: "scenario" },
  { slug: "networking", title: "Networking", emoji: "🌐", group: "People", tagline: "Build real connections before you need them.", color: "ocean", game: "scenario" },
  { slug: "active-listening", title: "Active Listening", emoji: "👂", group: "People", tagline: "Hear what's actually being said.", color: "mint", game: "quiz" },
  { slug: "giving-feedback", title: "Giving Feedback", emoji: "💬", group: "People", tagline: "Tell the truth kindly.", color: "coral", game: "scenario" },
  { slug: "empathy", title: "Empathy", emoji: "🫶", group: "People", tagline: "Feel what others feel, then act.", color: "sun", game: "scenario" },

  // ---- Work (9) ----
  { slug: "time-management", title: "Time Management", emoji: "⏰", group: "Work", tagline: "Do the important thing first.", color: "sun", game: "sequence" },
  { slug: "attention-to-detail", title: "Attention to Detail", emoji: "🔎", group: "Work", tagline: "Catch the small stuff that ruins big stuff.", color: "ocean", game: "quiz" },
  { slug: "tech-savviness", title: "Tech Savviness", emoji: "🖥️", group: "Work", tagline: "Don't fear the tools — learn them.", color: "ocean", game: "arcade" },
  { slug: "data-analysis", title: "Data Analysis", emoji: "📊", group: "Work", tagline: "Ask numbers questions until they confess.", color: "mint", game: "quiz" },
  { slug: "writing-clearly", title: "Writing Clearly", emoji: "✍️", group: "Work", tagline: "Say what you mean, then stop.", color: "coral", game: "sequence" },
  { slug: "public-speaking", title: "Public Speaking", emoji: "🎤", group: "Work", tagline: "Stand up, speak up, don't panic.", color: "sun", game: "scenario" },
  { slug: "project-planning", title: "Project Planning", emoji: "📋", group: "Work", tagline: "Turn chaos into a checklist.", color: "ocean", game: "sequence" },
  { slug: "interviewing", title: "Interviewing", emoji: "💼", group: "Work", tagline: "Get hired for the job you want.", color: "mint", game: "scenario" },
  { slug: "giving-presentations", title: "Giving Presentations", emoji: "📽️", group: "Work", tagline: "Hold a room without losing them.", color: "coral", game: "scenario" },
];

export const SKILL_GROUPS: SkillGroup[] = ["Money", "Mind", "People", "Work"];

export const colorBg: Record<string, string> = {
  sun: "bg-sun", mint: "bg-mint", ocean: "bg-ocean text-white", coral: "bg-coral text-white",
};

export const GAME_TYPES: { type: GameType; label: string; emoji: string }[] = [
  { type: "quiz", label: "Tap Rush", emoji: "🔨" },
  { type: "scenario", label: "Scenario", emoji: "🌳" },
  { type: "memory", label: "Memory", emoji: "🃏" },
  { type: "sequence", label: "Sequence", emoji: "🔢" },
  { type: "arcade", label: "Catch Fall", emoji: "🧺" },
];

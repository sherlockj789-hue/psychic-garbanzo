import type { Career, CareerGroup } from "@/lib/types";

const c = (
  slug: string,
  name: string,
  emoji: string,
  group: CareerGroup,
  color: Career["color"],
  tagline: string,
): Career => ({ slug, name, emoji, group, color, tagline });

export const CAREERS: Career[] = [
  // Creators
  c("youtuber-streamer", "YouTuber / Streamer", "🎥", "Creators", "coral", "Make stuff, ship stuff, do it again tomorrow."),
  c("tiktoker-influencer", "TikToker / Influencer", "📱", "Creators", "sun", "Attention is a craft, not a fluke."),
  c("voice-actor", "Voice Actor", "🎙️", "Creators", "mint", "One mic, a hundred lives."),
  c("vfx-artist", "VFX Artist", "✨", "Creators", "ocean", "Make the impossible look obvious."),
  c("movie-director", "Movie Director", "🎬", "Creators", "coral", "Point the whole crew at the same story."),
  c("music-producer", "Music Producer", "🎛️", "Creators", "ocean", "Turn ideas into songs people play twice."),
  c("actor-musician", "Actor / Musician", "🎭", "Creators", "sun", "Auditions, gigs, and the slow build."),
  c("singer-dancer", "Singer / Dancer", "💃", "Creators", "coral", "The stage. The reps. The joy."),
  c("artist-animator", "Artist / Animator", "🖌️", "Creators", "mint", "Frame by frame, drawing what you see inside."),
  c("3d-modeler", "3D Modeler", "🧊", "Creators", "ocean", "Sculpt worlds one polygon at a time."),

  // Sports & Body
  c("professional-athlete", "Professional Athlete", "🏆", "Sports & Body", "sun", "Bodies, brains, and boring reps."),
  c("firefighter", "Firefighter", "🚒", "Sports & Body", "coral", "Show up when everyone else is running out."),
  c("paramedic-emt", "Paramedic / EMT", "🚑", "Sports & Body", "coral", "Calm hands in loud moments."),

  // Medicine
  c("doctor-surgeon", "Doctor / Surgeon", "🩺", "Medicine", "mint", "Long path, huge payoff for people who care."),
  c("nurse", "Nurse", "💉", "Medicine", "mint", "The people who actually keep the hospital running."),
  c("veterinarian", "Veterinarian", "🐾", "Medicine", "coral", "Medicine for the ones who can't talk."),
  c("pharmacist", "Pharmacist", "💊", "Medicine", "mint", "The last check before a mistake becomes a story."),
  c("nutritionist", "Nutritionist / Dietitian", "🥗", "Medicine", "mint", "Small food changes, big life changes."),
  c("optometrist", "Optometrist", "👓", "Medicine", "ocean", "Sharpen how the world looks."),
  c("chiropractor", "Chiropractor", "🦴", "Medicine", "mint", "Hands-on care for backs, necks, and posture."),
  c("dental-hygienist", "Dental Hygienist", "🦷", "Medicine", "mint", "Keep smiles healthy, appointment by appointment."),

  // Public Service
  c("police-detective", "Police Officer / Detective", "🕵️", "Public Service", "ocean", "Ask the right questions, take the right notes."),
  c("lawyer-judge", "Lawyer / Judge", "⚖️", "Public Service", "ocean", "Argue for a living. Read a lot."),
  c("teacher-professor", "Teacher / Professor", "🍎", "Public Service", "sun", "The most patient job on Earth."),
  c("park-ranger", "Park Ranger", "🌲", "Public Service", "mint", "Trees, trails, and telling kids the rules gently."),

  // Tech
  c("game-developer", "Video Game Developer", "🎮", "Tech", "ocean", "Build the worlds you wanted to live in."),
  c("app-developer", "App Developer", "📲", "Tech", "ocean", "Ship the thing. Then fix the thing."),
  c("web-designer", "Web Designer", "🌐", "Tech", "coral", "Pixels + words + why-does-this-button-exist."),
  c("cybersecurity", "Cybersecurity Expert", "🛡️", "Tech", "ocean", "Think like the attacker. Defend like a nerd."),
  c("it-consultant", "IT Consultant", "🖥️", "Tech", "ocean", "The person companies call when nothing works."),
  c("robotics", "Robotics Specialist", "🤖", "Tech", "ocean", "Teach metal to move on purpose."),
  c("data-analyst", "Data Analyst", "📊", "Tech", "ocean", "Ask numbers questions until they confess."),

  // Science
  c("astronaut", "Astronaut", "🚀", "Science", "ocean", "Years of prep for minutes of view."),
  c("scientist-inventor", "Scientist / Inventor", "🔬", "Science", "mint", "Be wrong on purpose until you're right."),
  c("botanist", "Botanist", "🌿", "Science", "mint", "The world runs on plants."),
  c("meteorologist", "Meteorologist", "🌦️", "Science", "ocean", "Read the sky like a book."),

  // Business
  c("ceo-owner", "CEO / Business Owner", "🏢", "Business", "sun", "Everyone's problem is your problem."),
  c("marketing-manager", "Marketing Manager", "📣", "Business", "coral", "Understand humans. Say the true thing well."),
  c("financial-advisor", "Financial Advisor", "💼", "Business", "mint", "Help other people make peace with money."),
  c("real-estate", "Real Estate Agent", "🏠", "Business", "sun", "Homes are big deals. Be a good guide."),
  c("accountant", "Accountant", "🧮", "Business", "ocean", "The books balance because you made them."),
  c("project-manager", "Project Manager", "📋", "Business", "mint", "Herd cats. Ship things. Repeat."),
  c("hr-manager", "Human Resources Manager", "🧑‍💼", "Business", "coral", "People are the whole company."),
  c("event-planner", "Event Planner", "🎉", "Business", "sun", "Make chaos look effortless."),

  // Design & Style
  c("interior-designer", "Interior Designer", "🛋️", "Design & Style", "mint", "Empty rooms into places people love."),
  c("makeup-artist", "Makeup Artist", "💄", "Design & Style", "coral", "Faces as canvases."),
  c("fashion-stylist", "Fashion Stylist", "👗", "Design & Style", "coral", "Clothes tell the story before they speak."),
  c("tattoo-artist", "Tattoo Artist", "🖊️", "Design & Style", "ocean", "Ink that lives with someone forever."),

  // Trades
  c("electrician", "Electrician", "⚡", "Trades", "sun", "Make wires do what you want, safely."),
  c("plumber", "Plumber", "🔧", "Trades", "ocean", "The person cities can't live without."),
  c("mechanic", "Mechanic", "🔩", "Trades", "ocean", "Diagnose. Fix. Explain in plain English."),
  c("carpenter", "Carpenter", "🪚", "Trades", "sun", "Measure twice. Cut once. Sleep well."),
  c("welder", "Welder", "🔥", "Trades", "coral", "Fuse metal — safely, precisely, hot."),
  c("engineer", "Engineer", "🛠️", "Trades", "ocean", "Design the things everything else stands on."),

  // Food
  c("chef-baker", "Chef / Baker", "👩‍🍳", "Food", "coral", "Feed people. Repeat with intent."),

  // Travel
  c("pilot", "Pilot", "✈️", "Travel", "ocean", "Checklists that save lives."),
  c("flight-attendant", "Flight Attendant", "🧳", "Travel", "sun", "Calm in a metal tube at 35,000 ft."),
  c("tour-guide", "Tour Guide", "🗺️", "Travel", "mint", "Tell great stories. Never lose the group."),
  c("hotel-manager", "Hotel Manager", "🏨", "Travel", "sun", "Every guest is opening night."),
  c("cruise-captain", "Cruise Ship Captain", "🚢", "Travel", "ocean", "Steer the floating town."),

  // Animals & Outdoors
  c("dog-trainer", "Dog Trainer", "🐕", "Animals & Outdoors", "sun", "Train the human. The dog follows."),
];

export const CAREER_GROUPS: CareerGroup[] = [
  "Creators",
  "Tech",
  "Business",
  "Medicine",
  "Science",
  "Public Service",
  "Sports & Body",
  "Design & Style",
  "Trades",
  "Food",
  "Travel",
  "Animals & Outdoors",
];

export function getCareer(slug: string): Career | undefined {
  return CAREERS.find((x) => x.slug === slug);
}

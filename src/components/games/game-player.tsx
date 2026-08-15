"use client";

import { useState } from "react";
import type { JSX } from "react";
import type { GameType } from "@/lib/types";
import { TapRush } from "./tap-rush";
import { ScenarioStorm } from "./scenario-storm";
import { MemoryMatch } from "./memory-match";
import { SequenceBuilder } from "./sequence-builder";
import { CatchFall } from "./catch-fall";

/**
 * GamePlayer renders the right arcade-style mini-game for a lesson or
 * skills-lab topic.
 *
 * Contract:
 *   GET /api/game?type=<type>&career=<slug>&topic=<topic>  returns JSON content
 *   For "memory", no dedicated API — we fetch type=quiz and build pairs.
 *   For "arcade", the API returns { prompt, goodTargets[8], badTargets[6] }.
 *
 * `onDone(passed)` fires once per round when the player finishes. "Play again"
 * bumps the internal `round` state, which re-mounts the chosen game (via key)
 * so a fresh fetch + clean state starts immediately.
 *
 * State resets are done via the `key` prop (re-mount), NOT via setState in an
 * effect — so the `react-hooks/set-state-in-effect` rule stays happy.
 */
export function GamePlayer({
  type,
  career,
  topic,
  onDone,
}: {
  type: GameType;
  career: string;
  topic: string;
  onDone?: (passed: boolean) => void;
}): JSX.Element {
  const [round, setRound] = useState(0);
  const playAgain = () => setRound((r) => r + 1);

  const common = { career, topic, onDone, onPlayAgain: playAgain };

  switch (type) {
    case "quiz":
      return <TapRush key={round} {...common} />;
    case "scenario":
      return <ScenarioStorm key={round} {...common} />;
    case "memory":
      return <MemoryMatch key={round} {...common} />;
    case "sequence":
      return <SequenceBuilder key={round} {...common} />;
    case "arcade":
      return <CatchFall key={round} {...common} />;
    default:
      return <TapRush key={round} {...common} />;
  }
}

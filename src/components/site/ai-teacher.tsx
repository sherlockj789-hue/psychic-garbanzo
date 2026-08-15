"use client";

import { useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { Send, Loader2, Bot, RotateCcw } from "lucide-react";

export function AiTeacher({ context }: { context?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setError(null);
    setBusy(true);
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    try {
      const res = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context, history }),
      });
      if (!res.ok) throw new Error("Teacher unavailable");
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.text }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
      boxRef.current?.focus();
    }
  }

  const suggestions = ["Explain this simpler", "Give me a real example", "Quiz me on this", "What should I learn next?"];

  return (
    <section className="card-pop p-5">
      <div className="flex items-center gap-2">
        <span className="hud">
          <Bot className="h-3 w-3" /> AI teacher
        </span>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setError(null); }} className="btn-pop !px-3 !py-1 text-xs">
            <RotateCcw className="h-3 w-3" /> New chat
          </button>
        )}
      </div>

      <div className="scroll-soft mt-4 max-h-[300px] space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-foreground/60">
              Stuck? Ask anything about this lesson — or start with one of these:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-primary/60"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`whitespace-pre-line rounded-xl border px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-8 border-border bg-secondary/60"
                : "mr-4 border-primary/30 bg-primary/10"
            }`}
          >
            {m.content}
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-primary">
            <Loader2 className="h-3 w-3 animate-spin" /> thinking…
          </div>
        )}
        {error && <div className="text-xs text-destructive">{error}</div>}
      </div>

      <form
        className="mt-4 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <textarea
          ref={boxRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={2}
          placeholder="Ask your teacher…"
          className="min-h-[46px] flex-1 resize-none rounded-xl border border-border bg-input/40 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-pop btn-neon text-sm">
          <Send className="h-4 w-4" /> Ask
        </button>
      </form>
    </section>
  );
}

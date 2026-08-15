"use client";

import { useEffect, useRef, useState } from "react";
import { useNav } from "@/lib/nav";
import type { ChatMessage } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Loader2, MessageCircle, RotateCcw, Sparkles } from "lucide-react";

/**
 * A floating "Ask the AI Teacher" button available on EVERY view.
 * Opens a slide-in chat panel. Uses the built-in z-ai model (always on,
 * no API key needed — it never "shuts down" like a third-party key would).
 * The backend retries 3x and returns a graceful fallback, so the user
 * should never see a hard error.
 */
export function FloatingTeacher() {
  const { route } = useNav();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build a helpful context string from the current route.
  const context = (() => {
    switch (route.name) {
      case "career": return `Career: ${route.slug}`;
      case "grade": return `Career: ${route.slug}, Grade ${route.grade}`;
      case "lesson": return `Career: ${route.slug}, Grade ${route.grade}, Lesson ${route.lesson}`;
      case "sim": return `Career simulator: ${route.slug}`;
      case "skills": return "Skills practice lab";
      case "skill": return `Skill: ${route.slug}`;
      case "careers": return "Browsing careers";
      default: return "Wise World School";
    }
  })();

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
    } catch {
      setError("Connection hiccup — try again in a second.");
    } finally {
      setBusy(false);
      boxRef.current?.focus();
    }
  }

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  // Focus the textarea when opening.
  useEffect(() => {
    if (open) boxRef.current?.focus();
  }, [open]);

  const suggestions = [
    "Explain this simpler",
    "Give me a real example",
    "Quiz me on this",
    "What should I learn next?",
  ];

  return (
    <>
      {/* Floating button */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border border-ocean/30 bg-gradient-to-br from-ocean to-violet text-white shadow-lg shadow-ocean/30 hover:scale-105 sm:h-16 sm:w-16"
        aria-label={open ? "Close AI teacher" : "Ask the AI teacher"}
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Bot className="h-7 w-7" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-mint" />
          </span>
        )}
      </motion.button>

      {/* Slide-in panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="card-pop fixed bottom-0 right-0 top-0 z-50 flex h-full w-full max-w-md flex-col rounded-none border-y-0 border-r-0 sm:bottom-5 sm:right-5 sm:top-auto sm:h-[600px] sm:max-h-[85vh] sm:rounded-2xl sm:border"
            >
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-ocean/10 to-mint/10 px-4 py-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-ocean to-violet text-white">
                  <Bot className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-[family-name:var(--font-display-tf)] text-base font-bold">
                    AI Teacher
                    <Sparkles className="h-3.5 w-3.5 text-sun" />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-mint" />
                    Always on · built-in
                  </div>
                </div>
                {messages.length > 0 && (
                  <button
                    onClick={() => { setMessages([]); setError(null); }}
                    className="btn-pop !px-2.5 !py-1 text-xs"
                    aria-label="New chat"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="btn-pop !px-2.5 !py-1 text-xs sm:hidden"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="scroll-soft flex-1 space-y-3 overflow-y-auto p-4"
              >
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm text-foreground/70">
                        Hi! I&apos;m your AI teacher. Ask me anything about the career or skill
                        you&apos;re learning — I&apos;ll explain, give examples, quiz you, or point
                        you forward.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => void send(s)}
                          className="rounded-full border border-border bg-card px-2.5 py-1 text-xs hover:border-primary/60"
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
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-line rounded-2xl border px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "border-primary/30 bg-primary/15 text-ink"
                          : "border-border bg-card text-foreground/85"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {busy && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> thinking…
                  </div>
                )}
                {error && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                    {error}
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                className="flex items-end gap-2 border-t border-border/60 p-3"
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
                  rows={1}
                  placeholder="Ask anything…"
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-input/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="btn-pop btn-neon !px-3 !py-2.5 text-sm"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

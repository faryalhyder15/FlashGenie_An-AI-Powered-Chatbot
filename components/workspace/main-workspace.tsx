"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { WorkspaceSidebar } from "./sidebar";
import { StudyToolsPanel } from "./study-tools";
import { ToastStack, type ToastItem } from "./toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Paperclip,
  Send,
  Loader2,
  Sparkles,
  RefreshCw,
  FileText,
  UploadCloud,
  Trophy,
  Film,
  Bot,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };
type ToolType = "flashcards" | "quiz" | "visual" | "video";

let toastIdCounter = 0;

export function MainWorkspace({
  userId,
  initialConversations,
}: {
  userId: string;
  initialConversations: any[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(
    initialConversations[0]?.id || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeToolData, setActiveToolData] = useState<{ type: ToolType; data: any } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  const pushToast = useCallback((message: string, variant: "success" | "error" = "success") => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (conversations.length === 0) {
      handleNewStudy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSelectStudy = async (id: string) => {
    setActiveId(id);
    setActiveToolData(null);
    setMessages([]);
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(
          (data.messages || []).map((m: any) => ({ role: m.role, content: m.content }))
        );
      } else {
        pushToast(data.error || "Couldn't load that study session.", "error");
      }
    } catch (err) {
      pushToast("Network error while loading that study session.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudy = async (id: string) => {
    const previous = conversations;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
      setActiveToolData(null);
    }
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
    } catch (err: any) {
      setConversations(previous);
      pushToast(err.message || "Couldn't delete that study session.", "error");
    }
  };

  const handleRenameStudy = async (id: string, title: string) => {
    const previous = conversations;
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to rename");
      }
    } catch (err: any) {
      setConversations(previous);
      pushToast(err.message || "Couldn't rename that study session.", "error");
    }
  };

  const handleNewStudy = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/conversations", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.id) {
        setConversations((prev) => [data, ...prev]);
        setActiveId(data.id);
        setMessages([]);
        setActiveToolData(null);
      } else {
        pushToast(data.error || "Couldn't start a new study session.", "error");
      }
    } catch (err) {
      pushToast("Network error while creating a new study session.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeId || loading) return;
    const userMsg = input;
    setInput("");
    setActiveToolData(null);
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, message: userMsg }),
      });
      const data = await res.json();
      if (res.ok && data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        pushToast(data.error || "The tutor couldn't respond. Try again.", "error");
      }
    } catch (err) {
      pushToast("Network error — message wasn't sent.", "error");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!activeId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", activeId);

    setLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        const charCount = data.source?.extracted_text?.length ?? 0;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `📄 Got it — I've read through **${file.name}**${
              charCount ? ` (~${charCount.toLocaleString()} characters)` : ""
            }. Ask me anything about it, or generate flashcards, a quiz, a visual map, or a storyboard from the tools above.`,
          },
        ]);
        pushToast(`${file.name} uploaded and processed.`);
      } else {
        pushToast(data.error || "Upload failed. Check storage rules.", "error");
      }
    } catch (err) {
      pushToast("Network error during upload.", "error");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setIsDragging(false);
      dragCounter.current = 0;
    }
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleToolSelect = async (tool: string) => {
    if (!activeId) return;
    setLoading(true);
    setActiveToolData(null);
    try {
      const endpointMap: Record<string, string> = {
        visual: "/api/generate-visual",
        flashcards: "/api/generate-flashcards",
        quiz: "/api/generate-quiz",
        video: "/api/generate-storyboard",
      };

      const endpoint = endpointMap[tool];
      if (!endpoint) return;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId }),
      });

      const data = await res.json();
      if (res.ok) {
        setActiveToolData({ type: tool as ToolType, data });
      } else {
        pushToast(data.error || "Couldn't generate that. Try again.", "error");
      }
    } catch (err) {
      pushToast("Network error while generating study material.", "error");
    } finally {
      setLoading(false);
    }
  };

  const hasEmptyState = messages.length === 0 && !loading && !activeToolData;

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <WorkspaceSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectStudy}
        onNew={handleNewStudy}
        onDelete={handleDeleteStudy}
        onRename={handleRenameStudy}
      />

      <div
        className="flex-1 flex flex-col h-full bg-background min-w-0 relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-primary/5 backdrop-blur-[1px] border-4 border-dashed border-primary/40 m-3 rounded-2xl pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-primary-700">
              <UploadCloud className="h-10 w-10" />
              <p className="font-medium">Drop your file to upload</p>
              <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {activeToolData?.type === "flashcards" && (
            <FlashcardsView data={activeToolData.data} />
          )}
          {activeToolData?.type === "quiz" && <QuizView data={activeToolData.data} />}
          {activeToolData?.type === "visual" && <VisualMapView data={activeToolData.data} />}
          {activeToolData?.type === "video" && <StoryboardView data={activeToolData.data} />}

          {hasEmptyState && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3">
              <div className="p-3.5 bg-primary/10 rounded-full text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground text-lg">
                  Your workspace is ready
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Drop a PDF, DOCX, or TXT file anywhere in this panel — or click the paperclip
                  below — then ask questions or generate flashcards, a quiz, a visual map, or a
                  storyboard.
                </p>
              </div>
            </div>
          )}

          {!activeToolData &&
            messages.map((m, idx) => (
              <div key={idx} className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] p-4 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm card-shadow"
                  )}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

          {loading && !activeToolData && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm p-2 pl-9">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              FlashGenie is thinking…
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border bg-background shrink-0">
          <StudyToolsPanel
            onToolSelect={handleToolSelect}
            activeTool={activeToolData?.type}
            disabled={!activeId || loading}
          />
          <div className="p-4 pt-3">
          <div className="max-w-4xl mx-auto relative flex items-end gap-1 border border-border rounded-xl p-2 bg-card focus-within:ring-2 focus-within:ring-primary/40 card-shadow">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
              accept=".pdf,.docx,.txt,image/*"
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!activeId || loading}
              className="text-muted-foreground hover:text-primary shrink-0"
              title="Upload a PDF, DOCX, or TXT file"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea
              placeholder={
                activeId ? "Ask a question about your uploaded materials…" : "Start a new study to begin"
              }
              value={input}
              disabled={!activeId}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="border-0 focus-visible:ring-0 resize-none min-h-[40px] max-h-32 text-sm shadow-none"
              rows={1}
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim() || !activeId}
              size="icon"
              className="shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="max-w-4xl mx-auto text-[11px] text-muted-foreground mt-1.5 px-1">
            FlashGenie can make mistakes — check important information from your source material.
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Flashcards — literal index cards with a real 3D flip                    */
/* ---------------------------------------------------------------------- */

function FlashcardsView({ data }: { data: any }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const cards = data.flashcards || [];

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <h3 className="font-display font-semibold text-foreground text-lg flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-tool-flashcards" /> Flashcard Deck
        <span className="text-xs font-sans font-normal text-muted-foreground">
          ({cards.length} cards — click to flip)
        </span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
        {cards.map((card: any, idx: number) => {
          const isFlipped = !!flipped[idx];
          return (
            <div
              key={idx}
              className="perspective h-44"
              onClick={() => setFlipped((prev) => ({ ...prev, [idx]: !prev[idx] }))}
            >
              <div
                className={cn(
                  "relative w-full h-full preserve-3d transition-transform duration-500 cursor-pointer",
                  isFlipped && "rotate-y-180"
                )}
              >
                <div className="absolute inset-0 backface-hidden rounded-xl border border-tool-flashcards/25 bg-tool-flashcards/[0.06] p-5 flex flex-col justify-between card-shadow">
                  <div className="text-[11px] font-semibold text-tool-flashcards uppercase tracking-wide">
                    Card {idx + 1} · Question
                  </div>
                  <div className="text-base font-medium text-foreground">{card.front}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Click to flip
                  </div>
                </div>
                <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border border-tool-flashcards/25 bg-card p-5 flex flex-col justify-between card-shadow">
                  <div className="text-[11px] font-semibold text-tool-flashcards uppercase tracking-wide">
                    Card {idx + 1} · Answer
                  </div>
                  <div className="text-sm text-foreground">{card.back}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Click to flip back
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Quiz — multiple choice with a running + final score                    */
/* ---------------------------------------------------------------------- */

function QuizView({ data }: { data: any }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const questions = data.questions || [];
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = questions.filter((q: any) => selectedAnswers[q.id] === q.answer).length;
  const isComplete = answeredCount === questions.length && questions.length > 0;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-tool-quiz" /> {data.title || "Knowledge Quiz"}
        </h3>
        <span className="text-xs font-medium text-muted-foreground">
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-tool-quiz transition-all duration-300"
          style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
        />
      </div>

      {isComplete && (
        <div className="flex items-center gap-3 rounded-xl border border-tool-quiz/30 bg-tool-quiz/[0.06] p-4">
          <Trophy className="h-8 w-8 text-tool-quiz shrink-0" />
          <div>
            <p className="font-semibold text-foreground">
              You scored {correctCount} / {questions.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {correctCount === questions.length
                ? "Perfect score — nice work!"
                : "Review the explanations below to lock it in."}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q: any) => (
          <div key={q.id} className="space-y-2.5 border border-border rounded-xl p-4 bg-card card-shadow">
            <p className="font-medium text-sm text-foreground">
              {q.id}. {q.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options?.map((opt: string) => {
                const isSelected = selectedAnswers[q.id] === opt;
                const isCorrectOpt = opt === q.answer;
                const showState = !!selectedAnswers[q.id];
                return (
                  <button
                    key={opt}
                    onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: opt })}
                    className={cn(
                      "justify-start text-left text-xs h-auto py-2.5 px-3 rounded-lg border transition-colors",
                      !showState && "border-border bg-background hover:border-tool-quiz/40",
                      showState && isSelected && isCorrectOpt && "border-emerald-400 bg-emerald-50 text-emerald-800",
                      showState && isSelected && !isCorrectOpt && "border-rose-400 bg-rose-50 text-rose-800",
                      showState && !isSelected && "border-border bg-background opacity-60"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {selectedAnswers[q.id] && (
              <p
                className={cn(
                  "text-xs p-2.5 rounded-lg",
                  selectedAnswers[q.id] === q.answer
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800"
                )}
              >
                {selectedAnswers[q.id] === q.answer ? "Correct! " : `Not quite. Correct answer: ${q.answer}. `}
                {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Visual Map — connected concept steps                                   */
/* ---------------------------------------------------------------------- */

function VisualMapView({ data }: { data: any }) {
  const steps = data.steps || [];
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h3 className="font-display font-semibold text-foreground text-lg flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-tool-visual" /> {data.title || "Concept Map"}
      </h3>
      <div className="space-y-0">
        {steps.map((step: any, idx: number) => (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-9 w-9 rounded-full bg-tool-visual text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {idx + 1}
              </div>
              {idx < steps.length - 1 && <div className="w-px flex-1 bg-tool-visual/30 my-1 min-h-[24px]" />}
            </div>
            <div className={cn("pb-6 pt-1", idx === steps.length - 1 && "pb-0")}>
              <p className="font-medium text-sm text-foreground">{step.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Storyboard — horizontal filmstrip with sprocket-hole styling           */
/* ---------------------------------------------------------------------- */

function StoryboardView({ data }: { data: any }) {
  const scenes = data.scenes || [];
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h3 className="font-display font-semibold text-foreground text-lg flex items-center gap-2">
        <Film className="h-5 w-5 text-tool-storyboard" /> {data.title || "Concept Storyboard"}
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {scenes.map((s: any) => (
          <div
            key={s.scene}
            className="shrink-0 w-72 rounded-xl border border-tool-storyboard/25 bg-card overflow-hidden card-shadow"
          >
            <div className="flex justify-between px-2 py-1 bg-tool-storyboard/10">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-tool-storyboard/30" />
              ))}
            </div>
            <div className="p-4 space-y-2.5">
              <span className="text-[11px] font-semibold text-tool-storyboard uppercase tracking-wide">
                Scene {s.scene}
              </span>
              <p className="text-sm font-medium text-foreground">🎬 {s.visual}</p>
              <p className="text-xs text-muted-foreground italic">"{s.narration}"</p>
            </div>
            <div className="flex justify-between px-2 py-1 bg-tool-storyboard/10">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-tool-storyboard/30" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
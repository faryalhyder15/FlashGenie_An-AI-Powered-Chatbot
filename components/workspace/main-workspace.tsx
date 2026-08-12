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
  Menu,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

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

  const [activeToolData, setActiveToolData] = useState<{
    type: ToolType;
    data: any;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Mobile sidebar
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  const pushToast = useCallback(
    (
      message: string,
      variant: "success" | "error" = "success"
    ) => {
      const id = ++toastIdCounter;

      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          variant,
        },
      ]);
    },
    []
  );

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
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSelectStudy = async (id: string) => {
    setActiveId(id);
    setActiveToolData(null);
    setMessages([]);
    setLoading(true);

    // Close mobile sidebar after selecting a study
    setMobileSidebarOpen(false);

    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();

      if (res.ok) {
        setMessages(
          (data.messages || []).map((m: any) => ({
            role: m.role,
            content: m.content,
          }))
        );
      } else {
        pushToast(
          data.error || "Couldn't load that study session.",
          "error"
        );
      }
    } catch {
      pushToast(
        "Network error while loading that study session.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudy = async (id: string) => {
    const previous = conversations;

    setConversations((prev) =>
      prev.filter((c) => c.id !== id)
    );

    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
      setActiveToolData(null);
    }

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error || "Failed to delete"
        );
      }
    } catch (err: any) {
      setConversations(previous);

      pushToast(
        err.message ||
          "Couldn't delete that study session.",
        "error"
      );
    }
  };

  const handleRenameStudy = async (
    id: string,
    title: string
  ) => {
    const previous = conversations;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title } : c
      )
    );

    try {
      const res = await fetch(
        `/api/conversations/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title }),
        }
      );

      if (!res.ok) {
        const data = await res.json();

        throw new Error(
          data.error || "Failed to rename"
        );
      }
    } catch (err: any) {
      setConversations(previous);

      pushToast(
        err.message ||
          "Couldn't rename that study session.",
        "error"
      );
    }
  };

  const handleNewStudy = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/conversations",
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (res.ok && data.id) {
        setConversations((prev) => [
          data,
          ...prev,
        ]);

        setActiveId(data.id);
        setMessages([]);
        setActiveToolData(null);

        setMobileSidebarOpen(false);
      } else {
        pushToast(
          data.error ||
            "Couldn't start a new study session.",
          "error"
        );
      }
    } catch {
      pushToast(
        "Network error while creating a new study session.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (
      !input.trim() ||
      !activeId ||
      loading
    ) {
      return;
    }

    const userMsg = input;

    setInput("");
    setActiveToolData(null);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMsg,
      },
    ]);

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: activeId,
          message: userMsg,
        }),
      });

      const data = await res.json();

      if (res.ok && data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
          },
        ]);
      } else {
        pushToast(
          data.error ||
            "The tutor couldn't respond. Try again.",
          "error"
        );
      }
    } catch {
      pushToast(
        "Network error — message wasn't sent.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!activeId) return;

    const formData = new FormData();

    formData.append("file", file);
    formData.append(
      "conversationId",
      activeId
    );

    setLoading(true);

    try {
      const res = await fetch(
        "/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok) {
        const charCount =
          data.source?.extracted_text?.length ??
          0;

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `📄 Got it — I've read through **${file.name}**${
              charCount
                ? ` (~${charCount.toLocaleString()} characters)`
                : ""
            }. Ask me anything about it, or generate flashcards, a quiz, a visual map, or a storyboard from the tools above.`,
          },
        ]);

        pushToast(
          `${file.name} uploaded and processed.`
        );
      } else {
        pushToast(
          data.error ||
            "Upload failed. Check storage rules.",
          "error"
        );
      }
    } catch {
      pushToast(
        "Network error during upload.",
        "error"
      );
    } finally {
      setLoading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      uploadFile(file);
    }
  };

  const handleDragEnter = (
    e: React.DragEvent
  ) => {
    e.preventDefault();

    dragCounter.current++;

    if (
      e.dataTransfer.types.includes("Files")
    ) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (
    e: React.DragEvent
  ) => {
    e.preventDefault();

    dragCounter.current--;

    if (dragCounter.current <= 0) {
      setIsDragging(false);
      dragCounter.current = 0;
    }
  };

  const handleDragOver = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent
  ) => {
    e.preventDefault();

    dragCounter.current = 0;
    setIsDragging(false);

    const file =
      e.dataTransfer.files?.[0];

    if (file) {
      uploadFile(file);
    }
  };

  const handleToolSelect = async (
    tool: string
  ) => {
    if (!activeId) return;

    setLoading(true);
    setActiveToolData(null);

    try {
      const endpointMap: Record<
        string,
        string
      > = {
        visual: "/api/generate-visual",
        flashcards:
          "/api/generate-flashcards",
        quiz: "/api/generate-quiz",
        video:
          "/api/generate-storyboard",
      };

      const endpoint =
        endpointMap[tool];

      if (!endpoint) return;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          conversationId: activeId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setActiveToolData({
          type: tool as ToolType,
          data,
        });
      } else {
        pushToast(
          data.error ||
            "Couldn't generate that. Try again.",
          "error"
        );
      }
    } catch {
      pushToast(
        "Network error while generating study material.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const hasEmptyState =
    messages.length === 0 &&
    !loading &&
    !activeToolData;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <ToastStack
        toasts={toasts}
        onDismiss={dismissToast}
      />

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() =>
            setMobileSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-300 md:static md:z-auto md:block md:translate-x-0",
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        )}
      >
        <WorkspaceSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectStudy}
          onNew={handleNewStudy}
          onDelete={handleDeleteStudy}
          onRename={handleRenameStudy}
        />
      </div>

      {/* Main application */}
      <div
        className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Mobile header */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur md:hidden">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() =>
              setMobileSidebarOpen(true)
            }
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>

            <span className="truncate font-display text-lg font-semibold text-foreground">
              FlashGenie
            </span>
          </div>
        </header>

        {/* Desktop top spacing */}
        <div className="hidden md:block h-2 shrink-0" />

        {/* Drag/drop overlay */}
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-30 m-3 flex items-center justify-center rounded-2xl border-4 border-dashed border-primary/40 bg-primary/5 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3 px-6 text-center text-primary-700">
              <UploadCloud className="h-10 w-10" />

              <p className="font-medium">
                Drop your file to upload
              </p>

              <p className="text-xs text-muted-foreground">
                PDF, DOCX, or TXT
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 md:px-6 scrollbar-thin">
          <div className="mx-auto w-full max-w-5xl space-y-4 pb-4">
            {activeToolData?.type ===
              "flashcards" && (
              <FlashcardsView
                data={activeToolData.data}
              />
            )}

            {activeToolData?.type ===
              "quiz" && (
              <QuizView
                data={activeToolData.data}
              />
            )}

            {activeToolData?.type ===
              "visual" && (
              <VisualMapView
                data={activeToolData.data}
              />
            )}

            {activeToolData?.type ===
              "video" && (
              <StoryboardView
                data={activeToolData.data}
              />
            )}

            {hasEmptyState && (
              <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center text-muted-foreground">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-7 w-7" />
                </div>

                <p className="font-display text-lg font-semibold text-foreground">
                  Your workspace is ready
                </p>

                <p className="mt-2 max-w-md text-sm leading-relaxed">
                  Drop a PDF, DOCX, or TXT file
                  anywhere in this panel, or
                  tap the paperclip below.
                </p>
              </div>
            )}

            {!activeToolData &&
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex w-full gap-2",
                    m.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  )}
                >
                  {m.role ===
                    "assistant" && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "min-w-0 max-w-[88%] overflow-hidden rounded-2xl px-3 py-2.5 text-sm leading-relaxed break-words sm:max-w-[80%] sm:p-4",
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border bg-card text-foreground card-shadow"
                    )}
                  >
                    {m.content}
                  </div>

                  {m.role === "user" && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

            {loading &&
              !activeToolData && (
                <div className="flex items-center gap-2 px-2 py-2 pl-9 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  FlashGenie is thinking…
                </div>
              )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom composer */}
        <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur">
          {/* Tools */}
          <div className="mx-auto w-full max-w-5xl overflow-hidden px-2 pt-2 sm:px-4 sm:pt-3">
            <StudyToolsPanel
              onToolSelect={handleToolSelect}
              activeTool={
                activeToolData?.type
              }
              disabled={
                !activeId || loading
              }
            />
          </div>

          {/* Input */}
          <div className="px-2 pb-2 pt-1 sm:px-4 sm:pb-3">
            <div className="mx-auto w-full max-w-4xl">
              <div className="flex min-w-0 items-end gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 sm:p-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={
                    handleFileInputChange
                  }
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={
                    !activeId || loading
                  }
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary"
                  title="Upload file"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                <Textarea
                  placeholder={
                    activeId
                      ? "Ask FlashGenie…"
                      : "Start a new study"
                  }
                  value={input}
                  disabled={!activeId}
                  onChange={(e) =>
                    setInput(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="min-h-[38px] min-w-0 flex-1 resize-none border-0 px-2 py-2 text-sm shadow-none focus-visible:ring-0"
                  rows={1}
                />

                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={
                    loading ||
                    !input.trim() ||
                    !activeId
                  }
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl"
                  aria-label="Send message"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <p className="hidden px-1 pt-1.5 text-[11px] text-muted-foreground sm:block">
                FlashGenie can make mistakes — check
                important information from your source
                material.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ---------------------------------------------------------------------- */
/* FLASHCARDS */
/* ---------------------------------------------------------------------- */

function FlashcardsView({
  data,
}: {
  data: any;
}) {
  const [flipped, setFlipped] =
    useState<Record<number, boolean>>({});

  const cards = data.flashcards || [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <Sparkles className="h-5 w-5 text-tool-flashcards" />
        Flashcard Deck

        <span className="text-xs font-normal text-muted-foreground">
          ({cards.length} cards)
        </span>
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        {cards.map(
          (card: any, idx: number) => {
            const isFlipped =
              !!flipped[idx];

            return (
              <div
                key={idx}
                className="perspective h-44 w-full"
                onClick={() =>
                  setFlipped((prev) => ({
                    ...prev,
                    [idx]: !prev[idx],
                  }))
                }
              >
                <div
                  className={cn(
                    "relative h-full w-full preserve-3d transition-transform duration-500",
                    isFlipped &&
                      "rotate-y-180"
                  )}
                >
                  <div className="absolute inset-0 flex flex-col justify-between rounded-xl border border-tool-flashcards/25 bg-tool-flashcards/[0.06] p-4 card-shadow sm:p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-tool-flashcards">
                      Card {idx + 1} · Question
                    </div>

                    <div className="break-words text-sm font-medium text-foreground sm:text-base">
                      {card.front}
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      Click to flip
                    </div>
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-between rounded-xl border border-tool-flashcards/25 bg-card p-4 card-shadow sm:p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-tool-flashcards">
                      Card {idx + 1} · Answer
                    </div>

                    <div className="break-words text-sm text-foreground">
                      {card.back}
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      Click to flip back
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}


/* ---------------------------------------------------------------------- */
/* QUIZ */
/* ---------------------------------------------------------------------- */

function QuizView({
  data,
}: {
  data: any;
}) {
  const [selectedAnswers, setSelectedAnswers] =
    useState<Record<number, string>>({});

  const questions =
    data.questions || [];

  const answeredCount =
    Object.keys(selectedAnswers)
      .length;

  const correctCount =
    questions.filter(
      (q: any) =>
        selectedAnswers[q.id] ===
        q.answer
    ).length;

  const isComplete =
    answeredCount ===
      questions.length &&
    questions.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold text-foreground">
          <FileText className="h-5 w-5 shrink-0 text-tool-quiz" />
          <span className="truncate">
            {data.title ||
              "Knowledge Quiz"}
          </span>
        </h3>

        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {answeredCount}/
          {questions.length}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-tool-quiz transition-all duration-300"
          style={{
            width: `${
              questions.length
                ? (answeredCount /
                    questions.length) *
                  100
                : 0
            }%`,
          }}
        />
      </div>

      {isComplete && (
        <div className="flex items-start gap-3 rounded-xl border border-tool-quiz/30 bg-tool-quiz/[0.06] p-3 sm:p-4">
          <Trophy className="mt-0.5 h-7 w-7 shrink-0 text-tool-quiz sm:h-8 sm:w-8" />

          <div className="min-w-0">
            <p className="font-semibold text-foreground">
              You scored{" "}
              {correctCount} /{" "}
              {questions.length}
            </p>

            <p className="text-xs text-muted-foreground">
              {correctCount ===
              questions.length
                ? "Perfect score — nice work!"
                : "Review the explanations below to lock it in."}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q: any) => (
          <div
            key={q.id}
            className="space-y-2.5 rounded-xl border border-border bg-card p-3 card-shadow sm:p-4"
          >
            <p className="break-words text-sm font-medium text-foreground">
              {q.id}. {q.question}
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {q.options?.map(
                (opt: string) => {
                  const isSelected =
                    selectedAnswers[
                      q.id
                    ] === opt;

                  const isCorrectOpt =
                    opt === q.answer;

                  const showState =
                    !!selectedAnswers[
                      q.id
                    ];

                  return (
                    <button
                      key={opt}
                      onClick={() =>
                        setSelectedAnswers(
                          {
                            ...selectedAnswers,
                            [q.id]:
                              opt,
                          }
                        )
                      }
                      className={cn(
                        "min-w-0 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors",
                        !showState &&
                          "border-border bg-background hover:border-tool-quiz/40",
                        showState &&
                          isSelected &&
                          isCorrectOpt &&
                          "border-emerald-400 bg-emerald-50 text-emerald-800",
                        showState &&
                          isSelected &&
                          !isCorrectOpt &&
                          "border-rose-400 bg-rose-50 text-rose-800",
                        showState &&
                          !isSelected &&
                          "border-border bg-background opacity-60"
                      )}
                    >
                      {opt}
                    </button>
                  );
                }
              )}
            </div>

            {selectedAnswers[q.id] && (
              <p
                className={cn(
                  "break-words rounded-lg p-2.5 text-xs",
                  selectedAnswers[q.id] ===
                    q.answer
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800"
                )}
              >
                {selectedAnswers[q.id] ===
                q.answer
                  ? "Correct! "
                  : `Not quite. Correct answer: ${q.answer}. `}

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
/* VISUAL MAP */
/* ---------------------------------------------------------------------- */

function VisualMapView({
  data,
}: {
  data: any;
}) {
  const steps = data.steps || [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <Sparkles className="h-5 w-5 shrink-0 text-tool-visual" />

        <span className="break-words">
          {data.title ||
            "Concept Map"}
        </span>
      </h3>

      <div>
        {steps.map(
          (step: any, idx: number) => (
            <div
              key={idx}
              className="flex gap-3 sm:gap-4"
            >
              <div className="flex shrink-0 flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tool-visual text-sm font-semibold text-white sm:h-9 sm:w-9">
                  {idx + 1}
                </div>

                {idx <
                  steps.length - 1 && (
                  <div className="my-1 min-h-[24px] w-px flex-1 bg-tool-visual/30" />
                )}
              </div>

              <div
                className={cn(
                  "min-w-0 pb-5 pt-1",
                  idx ===
                    steps.length - 1 &&
                    "pb-0"
                )}
              >
                <p className="break-words text-sm font-medium text-foreground">
                  {step.title}
                </p>

                <p className="mt-0.5 break-words text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}


/* ---------------------------------------------------------------------- */
/* STORYBOARD */
/* ---------------------------------------------------------------------- */

function StoryboardView({
  data,
}: {
  data: any;
}) {
  const scenes = data.scenes || [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <Film className="h-5 w-5 shrink-0 text-tool-storyboard" />

        <span className="break-words">
          {data.title ||
            "Concept Storyboard"}
        </span>
      </h3>

      {/* Horizontal scroll ONLY inside storyboard */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex w-max gap-4">
          {scenes.map((s: any) => (
            <div
              key={s.scene}
              className="w-[82vw] max-w-[340px] shrink-0 overflow-hidden rounded-xl border border-tool-storyboard/25 bg-card card-shadow"
            >
              <div className="flex justify-between bg-tool-storyboard/10 px-2 py-1">
                {Array.from({
                  length: 8,
                }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-tool-storyboard/30"
                  />
                ))}
              </div>

              <div className="space-y-2.5 p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-tool-storyboard">
                  Scene {s.scene}
                </span>

                <p className="break-words text-sm font-medium text-foreground">
                  🎬 {s.visual}
                </p>

                <p className="break-words text-xs italic text-muted-foreground">
                  "{s.narration}"
                </p>
              </div>

              <div className="flex justify-between bg-tool-storyboard/10 px-2 py-1">
                {Array.from({
                  length: 8,
                }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-tool-storyboard/30"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
"use client";

import { Brain, FileCheck, Waypoints, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyToolsProps {
  onToolSelect: (tool: string) => void;
  activeTool?: string | null;
  disabled?: boolean;
}

const tools = [
  {
    id: "flashcards",
    label: "Flashcards",
    icon: Brain,
    text: "text-tool-flashcards",
    bg: "bg-tool-flashcards/10",
    border: "border-tool-flashcards/30",
    activeBg: "bg-tool-flashcards/15",
  },
  {
    id: "quiz",
    label: "Quiz",
    icon: FileCheck,
    text: "text-tool-quiz",
    bg: "bg-tool-quiz/10",
    border: "border-tool-quiz/30",
    activeBg: "bg-tool-quiz/15",
  },
  {
    id: "visual",
    label: "Visual Map",
    icon: Waypoints,
    text: "text-tool-visual",
    bg: "bg-tool-visual/10",
    border: "border-tool-visual/30",
    activeBg: "bg-tool-visual/15",
  },
  {
    id: "video",
    label: "Storyboard",
    icon: Clapperboard,
    text: "text-tool-storyboard",
    bg: "bg-tool-storyboard/10",
    border: "border-tool-storyboard/30",
    activeBg: "bg-tool-storyboard/15",
  },
];

export function StudyToolsPanel({ onToolSelect, activeTool, disabled }: StudyToolsProps) {
  return (
    <div className="flex items-center gap-2 px-4 pt-3 overflow-x-auto scrollbar-thin">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1 shrink-0">
        Generate:
      </span>
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            type="button"
            disabled={disabled}
            onClick={() => onToolSelect(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all shrink-0",
              "disabled:cursor-not-allowed disabled:opacity-40",
              t.text,
              isActive ? cn(t.activeBg, t.border) : cn(t.bg, "border-transparent hover:border-current/30")
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
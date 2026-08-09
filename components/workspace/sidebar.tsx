"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Plus, Search, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export function WorkspaceSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: SidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-secondary/40 flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-2 text-primary-700 font-display text-xl font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
             <Sparkles className="h-4 w-4" />
          </span>
          <span>FlashGenie</span>
        </div>
        <Button onClick={onNew} className="w-full gap-2">
          <Plus className="h-4 w-4" /> New Study
        </Button>
      </div>

      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your studies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-background"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            {conversations.length === 0
              ? "No studies yet — create one to get started."
              : "No studies match your search."}
          </p>
        )}
        {filtered.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={cn(
              "group relative flex items-center justify-between gap-2 rounded-lg py-2.5 pl-3 pr-2 text-sm cursor-pointer transition-colors border-l-[3px]",
              activeId === chat.id
                ? "bg-card border-l-primary text-foreground font-medium card-shadow"
                : "border-l-transparent hover:bg-card/70 text-foreground/80"
            )}
          >
            <span className="truncate">{chat.title}</span>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const t = prompt("Rename this study:", chat.title);
                  if (t && t.trim()) onRename(chat.id, t.trim());
                }}
                className="p-1.5 rounded-md hover:bg-accent hover:text-primary"
                aria-label="Rename study"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this study session? This can't be undone.")) onDelete(chat.id);
                }}
                className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete study"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <LogoutButton className="w-full justify-start" />
      </div>
    </aside>
  );
}
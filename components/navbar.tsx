"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

/**
 * Responsive top navigation.
 * - Desktop: logo, Dashboard link, Logout button, all inline.
 * - Mobile: logo + hamburger, which expands into a stacked menu.
 *
 * `isAuthed` is passed down from a server component (layout) that already
 * knows the session, so this stays a lightweight client component.
 */
export function Navbar({ isAuthed }: { isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navLink = isAuthed
    ? { href: "/dashboard", label: "Dashboard" }
    : { href: "/login", label: "Login" };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>FlashGenie</span>
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-3 md:flex">
          <Link
            href={navLink.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === navLink.href && "bg-accent text-accent-foreground"
            )}
          >
            {navLink.label}
          </Link>
          {isAuthed ? (
            <LogoutButton />
          ) : (
            <Button asChild size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-border bg-white px-4 py-3 md:hidden">
          <Link
            href={navLink.href}
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent"
          >
            {navLink.label}
          </Link>
          {isAuthed ? (
            <div className="px-1 pt-1">
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Get Started
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

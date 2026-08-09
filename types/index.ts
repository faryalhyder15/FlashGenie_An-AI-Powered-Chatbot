/**
 * Shared app-wide types.
 * Deck / Flashcard types are stubbed now and will be wired to
 * Supabase-generated types once the database tables are created (Day 2+).
 */

export interface AppUser {
  id: string;
  email: string;
  fullName?: string | null;
}

export interface Deck {
  id: string;
  title: string;
  description?: string | null;
  cardCount: number;
  createdAt: string;
}

export interface ActionResult<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
}

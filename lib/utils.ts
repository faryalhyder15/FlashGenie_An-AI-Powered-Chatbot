import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names safely, resolving conflicts
 * (e.g. "p-2 p-4" -> "p-4"). Used by every shadcn/ui component.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

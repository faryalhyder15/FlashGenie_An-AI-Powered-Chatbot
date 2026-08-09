import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * Full-area loading state — used for page-level or section-level loading,
 * as opposed to the inline <Spinner /> used inside buttons.
 */
export function Loader({
  label = "Loading...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground", className)}>
      <Spinner className="h-6 w-6 text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

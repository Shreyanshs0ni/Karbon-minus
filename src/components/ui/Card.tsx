import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl border-border/80 p-6 text-foreground transition-colors duration-300 hover:border-accent/25",
        className,
      )}
    >
      {children}
    </div>
  );
}

import { cn } from "@/lib/utils";

export function Button({
  className,
  children,
  variant = "primary",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      type={type}
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 disabled:opacity-45",
        variant === "primary" &&
          "bg-accent text-[#06131d] shadow-[0_0_24px_-8px_var(--accent-glow)] hover:brightness-105 dark:text-[#06131d]",
        variant === "secondary" &&
          "border border-border/90 bg-panel/90 text-foreground backdrop-blur-sm hover:border-accent/35 hover:bg-accent/10 dark:bg-white/[0.06] dark:hover:bg-accent/15",
        variant === "ghost" &&
          "text-accent hover:bg-accent-bg-hover dark:hover:bg-accent/15",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

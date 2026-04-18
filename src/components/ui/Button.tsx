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
        "rounded-lg px-4 py-2 text-sm font-medium transition",
        variant === "primary" &&
          "bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500",
        variant === "secondary" &&
          "border border-border bg-card text-foreground hover:bg-panel",
        variant === "ghost" && "text-accent hover:bg-accent-bg-hover",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-border/90 bg-input-bg px-3 py-2.5 text-sm text-foreground shadow-inner placeholder:text-subtle backdrop-blur-sm transition-colors duration-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/35",
        className,
      )}
      {...props}
    />
  );
}

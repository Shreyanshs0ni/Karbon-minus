import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-subtle focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:focus:border-emerald-500 dark:focus:ring-emerald-500",
        className,
      )}
      {...props}
    />
  );
}

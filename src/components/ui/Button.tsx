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
          "bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50",
        variant === "secondary" &&
          "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
        variant === "ghost" && "text-emerald-800 hover:bg-emerald-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

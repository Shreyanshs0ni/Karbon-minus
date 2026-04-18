"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/context/ProjectContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export function Nav({ projectId }: { projectId?: string }) {
  const pathname = usePathname();
  const { loadDemo } = useProject();
  const { theme, toggleTheme } = useTheme();

  const base = projectId ? `/project/${projectId}` : "";

  const links = projectId
    ? [
        { href: `${base}`, label: "Overview" },
        { href: `${base}/materials`, label: "Materials" },
        { href: `${base}/optimize`, label: "Optimize" },
        { href: `${base}/report`, label: "Report" },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-[var(--nav-bg)] shadow-sm backdrop-blur-md dark:border-white/10 supports-[backdrop-filter]:bg-[var(--nav-bg)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-accent"
        >
          <Image
            src="/Logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain brightness-75 contrast-125 dark:brightness-100 dark:contrast-100"
            priority
          />
          <span className="font-serif text-lg tracking-tight">
            Karbon Minus
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-5 text-sm md:gap-6">
          <Link
            href="/"
            className={cn(
              "relative pb-1 text-foreground transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-accent after:transition-transform after:duration-300 hover:text-accent hover:after:scale-x-100",
              pathname === "/" && "font-medium text-accent after:scale-x-100",
            )}
          >
            Projects
          </Link>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative pb-1 text-foreground transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-accent after:transition-transform after:duration-300 hover:text-accent hover:after:scale-x-100",
                pathname === l.href &&
                  "font-medium text-accent after:scale-x-100",
              )}
            >
              {l.label}
            </Link>
          ))}
          {!projectId && (
            <button
              type="button"
              onClick={() => void loadDemo()}
              className="rounded border border-accent-border px-2 py-1 text-accent hover:bg-accent-bg-hover"
            >
              Load demo
            </button>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={theme === "dark"}
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className={cn(
              "relative inline-flex h-7 w-12 items-center rounded-full border border-border-strong/90 bg-white/45 p-0.5 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              theme === "dark" && "border-accent-border/70 bg-accent/40",
            )}
          >
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)] transition-transform duration-300",
                theme === "dark" && "translate-x-5 bg-slate-50",
              )}
            >
              <span
                aria-hidden
                className="text-[11px] leading-none text-accent"
              >
                {theme === "dark" ? "☾" : "☀"}
              </span>
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}

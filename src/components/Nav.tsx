"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/context/ProjectContext";
import { cn } from "@/lib/utils";

export function Nav({ projectId }: { projectId?: string }) {
  const pathname = usePathname();
  const { loadDemo } = useProject();

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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-semibold text-emerald-900">
          Karbon Minus
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/"
            className={cn(pathname === "/" && "font-medium text-emerald-800")}
          >
            Projects
          </Link>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                pathname === l.href && "font-medium text-emerald-800",
              )}
            >
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => void loadDemo()}
            className="rounded border border-emerald-200 px-2 py-1 text-emerald-800 hover:bg-emerald-50"
          >
            Load demo
          </button>
        </nav>
      </div>
    </header>
  );
}

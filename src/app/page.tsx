"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/Button";
import Spline from "@splinetool/react-spline/next";

export default function LandingPage() {
  return (
    <>
      <Nav minimal />
      <main className="h-[100%] overflow-hidden">
        <section className="relative z-50 overflow-hidden px-4 pb-24 pt-16 md:pb-32 md:pt-20">
          <div
            className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full bg-accent/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="glass-panel mx-auto max-w-2xl px-6 py-8 md:px-10 md:py-10">
              <p className="eyebrow">Indian construction procurement</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-[3.25rem]">
                Decide faster on embodied carbon and cost
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
                Karbon Minus helps you compare materials, run cost–carbon
                optimization, and prepare negotiation briefs—all aligned with your
                carbon budget and cost ceiling.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <SignedOut>
                <Link href="/sign-up">
                  <Button className="min-w-[10.5rem] px-8 py-2.5 text-base">
                    Get started
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/projects">
                  <Button className="min-w-[10.5rem] px-8 py-2.5 text-base">
                    Go to projects
                  </Button>
                </Link>
              </SignedIn>
            </div>
            </div>
          </div>
        </section>

        <section className="absolute bottom-0 ">
          <Spline scene="https://prod.spline.design/8OmNtmq6yAb4HYWP/scene.splinecode" />
        </section>
      </main>
    </>
  );
}

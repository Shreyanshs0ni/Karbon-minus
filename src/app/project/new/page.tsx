"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useProject } from "@/context/ProjectContext";

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject } = useProject();
  const [name, setName] = useState("");
  const [carbon, setCarbon] = useState("500000");
  const [cost, setCost] = useState("50000000");
  const [area, setArea] = useState("10000");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cb = Number(carbon);
    const cc = Number(cost);
    const ar = Number(area);
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!(cb > 0) || !(cc > 0)) {
      setError("Carbon budget and cost ceiling must be positive numbers.");
      return;
    }
    if (!(ar > 0)) {
      setError("Assumed building area must be a positive number.");
      return;
    }
    const id = createProject({
      name: name.trim(),
      carbonBudget: cb,
      costCeiling: cc,
      assumedBuildingArea: ar,
    });
    router.push(`/project/${id}`);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-lg px-4 py-10">
        <Link href="/" className="text-sm text-accent hover:underline">
          ← Back
        </Link>
        <Card className="mt-6">
          <h1 className="text-xl font-semibold text-foreground">New project</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-label">
                Project name
              </label>
              <Input
                className="mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Commercial tower — Pune"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-label">
                Carbon budget (kgCO₂e)
              </label>
              <Input
                className="mt-1"
                type="number"
                min={0.001}
                step="any"
                value={carbon}
                onChange={(e) => setCarbon(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-label">
                Cost ceiling (INR)
              </label>
              <Input
                className="mt-1"
                type="number"
                min={0.001}
                step="any"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-label">
                Assumed building area (m²)
              </label>
              <Input
                className="mt-1"
                type="number"
                min={0.001}
                step="any"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
              <p className="mt-1 text-xs text-subtle">
                Used for per-m² cost and carbon in reports.
              </p>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full">
              Create project
            </Button>
          </form>
        </Card>
      </main>
    </>
  );
}

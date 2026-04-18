import { NextResponse } from "next/server";
import demosFile from "../../../../data/demo-projects.json";
import { getMaterialById } from "@/lib/db";
import { buildProjectMaterial } from "@/lib/materials";
import type { Project, ProjectMaterial } from "@/types";

type DemoFile = {
  project: Project;
  materials: Array<{
    materialId: string;
    quantity: number;
    description: string;
  }>;
  assumedBuildingArea?: number;
};

type DemosRoot = { demos: DemoFile[] };

const demos = (demosFile as DemosRoot).demos;

function pickDemo(exclude: Set<string>): DemoFile | null {
  if (demos.length === 0) return null;
  const available = demos.filter((d) => !exclude.has(d.project.id));
  if (available.length === 0) return null;
  const i = Math.floor(Math.random() * available.length);
  return available[i]!;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const excludeRaw = searchParams.get("exclude");
  const excludeList = excludeRaw
    ? excludeRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const exclude = new Set(excludeList);

  const demo = pickDemo(exclude);
  if (!demo) {
    if (demos.length === 0) {
      return NextResponse.json(
        { error: "no_demos_configured" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "all_demos_used" }, { status: 404 });
  }

  const demoTemplateId = demo.project.id;
  const project: Project = {
    ...demo.project,
    assumedBuildingArea:
      demo.assumedBuildingArea ?? demo.project.assumedBuildingArea,
  };

  const materials: ProjectMaterial[] = [];
  for (const line of demo.materials) {
    const mat = getMaterialById(line.materialId);
    if (!mat) continue;
    materials.push(buildProjectMaterial(mat, line.quantity));
  }

  return NextResponse.json({ project, materials, demoTemplateId });
}

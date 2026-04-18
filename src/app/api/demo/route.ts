import { NextResponse } from "next/server";
import demoFile from "../../../../data/demo-project.json";
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

const demo = demoFile as DemoFile;

export async function GET() {
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

  return NextResponse.json({ project, materials });
}

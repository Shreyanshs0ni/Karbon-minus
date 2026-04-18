import materialsFile from "../../data/materials.json";
import type { MaterialEntry, MaterialCategory } from "@/types";

type MaterialsFile = {
  materials: MaterialEntry[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalMaterials: number;
    categories: MaterialCategory[];
  };
};

const data = materialsFile as MaterialsFile;

export function getAllMaterials(): MaterialEntry[] {
  return data.materials;
}

export function getMaterialById(id: string): MaterialEntry | undefined {
  return data.materials.find((m) => m.id === id);
}

export function getMaterialsMetadata(): MaterialsFile["metadata"] {
  return data.metadata;
}

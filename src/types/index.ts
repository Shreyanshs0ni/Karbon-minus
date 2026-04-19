export type MaterialCategory =
  | "steel"
  | "cement"
  | "insulation"
  | "glass"
  | "aggregates"
  | "timber";

export type MaterialUnit = "kg" | "m²" | "m³" | "pieces";

export interface SupplierOption {
  id: string;
  name: string;
  unitPrice: number;
  embodiedCarbon: number;
  region: string;
  hasEPD: boolean;
  estimatedCarbon?: {
    value: number;
    confidence: "high" | "medium" | "low";
    referenceIds: string[];
  };
}

export interface MaterialEntry {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  description: string;
  suppliers: SupplierOption[];
}

export interface Project {
  id: string;
  name: string;
  carbonBudget: number;
  costCeiling: number;
  assumedBuildingArea?: number;
  /** Frozen at project creation: baseline procurement totals (empty project = 0). */
  baselineTotalCost: number;
  /** Frozen at project creation: baseline embodied carbon (kgCO₂e). */
  baselineTotalCarbon: number;
  /** Set for projects created from a catalog demo; used to avoid loading the same template twice. */
  demoTemplateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMaterial {
  id: string;
  materialId: string;
  materialName: string;
  category: string;
  selectedSupplierId: string;
  supplierName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  embodiedCarbon: number;
  isEstimated: boolean;
  totalCost: number;
  totalCarbon: number;
}

export interface MaterialCombination {
  id: string;
  selections: Array<{
    materialId: string;
    supplierId: string;
    supplierName: string;
    quantity: number;
    cost: number;
    carbon: number;
  }>;
  totalCost: number;
  totalCarbon: number;
  isFeasible: boolean;
  isOnParetoFrontier: boolean;
  costSavings: number;
  carbonSavings: number;
}

export interface OptimizationResult {
  combinations: MaterialCombination[];
  paretoFrontier: MaterialCombination[];
  baseline: MaterialCombination;
  feasibleCount: number;
  totalCombinations: number;
  executionTimeMs: number;
  infeasibleReason?: "carbon" | "cost" | "both";
}

export interface NegotiationBrief {
  supplierId: string;
  supplierName: string;
  talkingPoints: string[];
  carbonComparison: {
    supplierCarbon: number;
    categoryAverage: number;
    percentile: number;
  };
  strategies: string[];
  volumeDiscountOpportunity: string;
  carbonImprovementSuggestions: string[];
  priority: "cost" | "carbon" | "balanced";
}

export interface AlternativeSuggestion {
  currentMaterial: ProjectMaterial;
  alternative: MaterialEntry;
  alternativeSupplier: SupplierOption;
  carbonSavings: number;
  carbonSavingsPercent: number;
  costDifference: number;
  costDifferencePercent: number;
  explanation: string;
}

export interface ProcurementReport {
  project: Project;
  selectedMaterials: ProjectMaterial[];
  totalCost: number;
  totalCarbon: number;
  costSavings: number;
  carbonSavings: number;
  executiveSummary: string;
  categoryBreakdown: Array<{
    category: string;
    cost: number;
    carbon: number;
    percentage: number;
  }>;
  comparisonTable: Array<{
    material: string;
    selected: { supplier: string; cost: number; carbon: number };
    baseline: { supplier: string; cost: number; carbon: number };
  }>;
  metricsPerSqm: {
    costPerSqm: number;
    carbonPerSqm: number;
    assumedArea: number;
  };
}

export interface StoredProjectBundle {
  project: Project;
  materials: ProjectMaterial[];
  lastOptimization?: OptimizationResult;
  selectedCombinationId?: string;
}

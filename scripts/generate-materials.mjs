import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const categories = [
  {
    key: "steel",
    unit: "kg",
    names: [
      "TMT Fe500D Rebar",
      "TMT Fe550D Rebar",
      "Structural Steel Section ISMB",
      "Steel Wire Mesh",
      "Galvanized Steel Sheet",
      "Steel Angles ISA",
      "Steel Channels ISMC",
      "Steel Plates HR",
      "Steel Round Bars",
      "Steel Binding Wire",
    ],
  },
  {
    key: "cement",
    unit: "kg",
    names: [
      "OPC 53 Grade Cement",
      "PPC Cement",
      "PSC Slag Cement",
      "White Portland Cement",
      "Rapid Hardening Cement",
      "Low-Alkali Cement",
      "Sulphate Resisting Cement",
      "Fly Ash Blended Cement",
      "Masonry Cement",
      "Oil Well Cement",
    ],
  },
  {
    key: "insulation",
    unit: "m²",
    names: [
      "Rockwool Batt Insulation",
      "Glass Wool Roll",
      "XPS Board 50mm",
      "EPS Thermocol Board",
      "PIR Foam Board",
      "Reflective Foil Insulation",
      "Acoustic Mineral Wool",
      "Cork Board Insulation",
      "Sheep Wool Insulation",
      "Recycled Denim Batt",
    ],
  },
  {
    key: "glass",
    unit: "m²",
    names: [
      "Clear Float Glass 6mm",
      "Low-E Double Glazed Unit",
      "Toughened Safety Glass",
      "Laminated Glass",
      "Tinted Solar Glass",
      "Acoustic Laminated Glass",
      "Frosted Privacy Glass",
      "Spandrel Ceramic Glass",
      "Fire-Rated Glass",
      "Structural Glazing Panel",
    ],
  },
  {
    key: "aggregates",
    unit: "kg",
    names: [
      "Crushed Stone 20mm",
      "River Sand Fine",
      "M-Sand Manufactured",
      "Fly Ash Aggregate",
      "Recycled Concrete Aggregate",
      "Granite Chips 10mm",
      "Ballast Stone",
      "Dolomite Chips",
      "Laterite Gravel",
      "Quarry Dust",
    ],
  },
  {
    key: "timber",
    unit: "m³",
    names: [
      "Teak Wood Planks",
      "Sal Wood Beams",
      "Pine Plywood BWR",
      "MDF Board 18mm",
      "Hardwood Flooring Oak",
      "Bamboo Composite Board",
      "Rubberwood Furniture Grade",
      "Cedar Cladding",
      "Marine Plywood",
      "Particle Board E1",
    ],
  },
];

const supplierPools = [
  ["Tata Steel", "JSW Steel", "SAIL", "Essar Steel", "Jindal Panther"],
  [
    "UltraTech Cement",
    "ACC Limited",
    "Ambuja Cements",
    "Dalmia Bharat",
    "Shree Cement",
  ],
  [
    "Rockwool India",
    "Owens Corning",
    "Saint-Gobain ISOVER",
    "U.P. Twiga",
    "HIL Limited",
  ],
  [
    "Saint-Gobain Glass",
    "Asahi India Glass",
    "Gujarat Guardian",
    "Modiguard Glass",
    "Hindusthan National Glass",
  ],
  [
    "Lafarge Aggregates",
    "Robo Silicon",
    "Thriveni Sands",
    "NCC Aggregates",
    "UltraTech ReadyMix",
  ],
  [
    "Greenply Industries",
    "Kitply Industries",
    "Century Plyboards",
    "Merino Industries",
    "Archidply",
  ],
];

const regions = [
  "Bangalore",
  "Mumbai",
  "Chennai",
  "Hyderabad",
  "Kolkata",
  "Ahmedabad",
  "Pune",
  "Delhi NCR",
];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const materials = [];
let idx = 0;

for (let c = 0; c < categories.length; c++) {
  const cat = categories[c];
  const pool = supplierPools[c];
  for (let i = 0; i < cat.names.length; i++) {
    idx++;
    const id = `${cat.key}-${String(i + 1).padStart(3, "0")}`;
    const name = cat.names[i];
    const nSup = 3 + (hashSeed(id) % 3);
    const suppliers = [];
    for (let s = 0; s < nSup; s++) {
      const base = hashSeed(id + s);
      const unitPrice =
        cat.key === "steel"
          ? 55 + (base % 25)
          : cat.key === "cement"
            ? 6 + (base % 8)
            : cat.key === "aggregates"
              ? 0.8 + (base % 100) / 100
              : cat.key === "timber"
                ? 45000 + (base % 20000)
                : 800 + (base % 1200);
      const embodiedCarbon =
        cat.key === "steel"
          ? 1.8 + (base % 80) / 100
          : cat.key === "cement"
            ? 0.85 + (base % 30) / 100
            : cat.key === "insulation"
              ? 2 + (base % 100) / 100
              : cat.key === "glass"
                ? 25 + (base % 150) / 10
                : cat.key === "aggregates"
                  ? 0.02 + (base % 15) / 1000
                  : 180 + (base % 80);
      const hasEPD = (base + s) % 4 !== 0;
      const sup = {
        id: `sup-${id}-${s + 1}`,
        name: pool[(base + s) % pool.length],
        unitPrice: Math.round(unitPrice * 100) / 100,
        embodiedCarbon: Math.round(embodiedCarbon * 1000) / 1000,
        region: regions[(base + s * 3) % regions.length],
        hasEPD,
      };
      if (!hasEPD) {
        sup.estimatedCarbon = {
          value: Math.round(embodiedCarbon * 1.05 * 1000) / 1000,
          confidence: ["high", "medium", "low"][base % 3],
          referenceIds: [`${cat.key}-ref-1`, `${cat.key}-ref-2`],
        };
      }
      suppliers.push(sup);
    }
    materials.push({
      id,
      name,
      category: cat.key,
      unit: cat.unit,
      description: `${name} for Indian construction supply chains; regional availability varies.`,
      suppliers,
    });
  }
}

const out = {
  materials,
  metadata: {
    version: "1.0.0",
    lastUpdated: new Date().toISOString().slice(0, 10),
    totalMaterials: materials.length,
    categories: [
      "steel",
      "cement",
      "insulation",
      "glass",
      "aggregates",
      "timber",
    ],
  },
};

fs.writeFileSync(
  path.join(root, "data", "materials.json"),
  JSON.stringify(out, null, 2),
);
console.log("Wrote", materials.length, "materials");

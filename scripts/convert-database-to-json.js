/* eslint-disable no-console */
/**
 * Convert software/Database.csv into:
 * - software/tools/<slug>.json (one per row)
 * - software/tools/index.json (manifest list)
 *
 * Run:
 *   node scripts/convert-database-to-json.js
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
 
const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(ROOT, "software", "Database.csv");
const OUT_DIR = path.join(ROOT, "software", "tools");
const INDEX_PATH = path.join(OUT_DIR, "index.json");
 
function normalizeCsvText(data) {
  return data.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
 
function parseCSV(data) {
  const rows = [];
  let row = [];
  let insideQuotes = false;
  let currentCell = "";
  const text = normalizeCsvText(data);
 
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(currentCell.trim());
      currentCell = "";
    } else if (char === "\n" && !insideQuotes) {
      row.push(currentCell.trim());
      if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
        rows.push(row);
      }
      row = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }
  if (currentCell.length > 0 || row.length > 0) {
    row.push(currentCell.trim());
    if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
      rows.push(row);
    }
  }
  return rows;
}
 
function rowsToObjects(parsed) {
  if (!parsed.length) return [];
  const headers = parsed[0];
  return parsed.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cells[i] != null ? cells[i] : "";
    });
    return obj;
  });
}
 
/** CSV used /# as line breaks; also allow "/ #" */
function normalizeNewlineMarkers(s) {
  return String(s || "").replace(/\/\s*#/g, "\n");
}
 
function isDashOrEmpty(s) {
  const t = String(s ?? "").trim().toLowerCase();
  return t === "" || t === "-" || t === "any" || t === "none";
}
 
function parseYesNoUnknown(s) {
  const t = String(s ?? "").trim().toLowerCase();
  if (t === "yes") return true;
  if (t === "no") return false;
  if (t.includes("yes")) return true;
  if (t.includes("no")) return false;
  return false;
}
 
function splitList(s) {
  const t = normalizeNewlineMarkers(String(s ?? "")).trim();
  if (isDashOrEmpty(t)) return [];
  return t
    .split(/\n+/)
    .map((x) => x.trim())
    .filter((x) => x && !isDashOrEmpty(x));
}
 
function slugify(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
 
function stableId(row) {
  const key = `${row.Developer ?? ""}|||${row.Product ?? ""}|||${row["Product Type"] ?? ""}`;
  return crypto.createHash("sha1").update(key).digest("hex").slice(0, 12);
}
 
function normalizeRamStorage(s) {
  const t = String(s ?? "").trim();
  if (isDashOrEmpty(t)) return "0 GB";
  // keep original but standardize spacing like "8 GB", "120 MB"
  const m = t.match(/([\d.]+)\s*([kKmMgGtT]?[bB])/);
  if (!m) return t;
  const num = m[1];
  const unit = m[2].toUpperCase();
  return `${num} ${unit}`;
}
 
function pricingStructureFromCsv(s) {
  const t = normalizeNewlineMarkers(String(s ?? "")).toLowerCase();
  if (t.includes("free")) return "Free";
  if (t.includes("subscription")) return "Subscription";
  if (t.includes("paid")) return "One-off Payment";
  return false;
}
 
function toolTypeFromCsv(s) {
  const t = String(s ?? "").trim();
  if (isDashOrEmpty(t)) return false;
  // Normalize common variants
  // IMPORTANT: match `index.html` dropdown option values exactly
  if (/stand\s*alone/i.test(t)) return "Stand Alone";
  if (/plug\s*-?\s*in/i.test(t)) return "Plug In";
  if (/web\s*app/i.test(t)) return "Web App";
  if (/spreadsheet/i.test(t)) return "Spreadsheet";
  if (/mobile\s*app/i.test(t)) return "Mobile App";
  return t;
}
 
function buildEmptyFeatureHierarchy() {
  return {
    buildingInformationModelling: {
      exportAndImportTools: {
        cis2Export: false,
        dxfExport: false,
        exportMaterialQuantities: false,
        ifcExport: false,
        ifcImport: false,
        pdfExport: false,
      },
      detailingTools: {
        detailedPlanSectionDrawings: false,
        reinforcementDetailingSheets: false,
        reinforcement3dModelling: false,
      },
    },
    embodiedCarbonAssessment: {
      carbonFactorLibrary: false,
    },
    parametricModelling: false,
    analysis: {
      analysis2d: false,
      analysis3d: false,
      compositeBeamAnalysis: false,
      compositeSectionAnalysis: false,
      constructionStageAnalysis: false,
      dynamicAnalysis: false,
      finiteElementAnalysis: false,
      footfallAnalysis: false,
      globalBucklingAnalysis: false,
      lateralStabilityAnalysis: false,
      localBucklingAnalysis: false,
      nonLinearAnalysis: false,
      responseSpectrumAnalysis: false,
      rigorousAnalysis: false,
      sectionAnalysis: false,
      staticAnalysis: false,
      strutAndTieAnalysis: false,
      tensionCompressionElementAnalysis: false,
      timberAnalysis: false,
      vibrationDesignAndAnalysis: false,
    },
    geotechnicalAnalysis: {
      pileLateralStability: false,
      pileSinking: false,
      slipCircles: false,
      soilStructureInteraction: false,
    },
    design: {
      designForFire: false,
      calculationOfLoadsToStandards: {
        seismicLoads: false,
        snowLoads: false,
        windLoads: false,
      },
      designOfCompositeElements: {
        compositeBeams: false,
        compositeColumns: false,
        compositeDecksAndSlabs: false,
      },
      designOfConcreteElements: {
        concreteBeams: false,
        concreteColumns: false,
        concreteCoreShearWalls: false,
        concreteCouplingBeams: false,
        concreteCracking: false,
        concreteFlatSlabs1Way: false,
        concreteFlatSlabs2Way: false,
        concreteHollowcoreSlabs: false,
        concreteJoistFloors: false,
        concretePostTensioning: false,
        concreteReinforcedBlockWalls: false,
        concreteRetainingWalls: false,
        concreteRibbedSlabs: false,
        concreteWaffleSlabs: false,
        concreteWalls: false,
      },
      designOfSteelElements: {
        steelBeams: false,
        steelColumns: false,
        steelJoistFloors: false,
      },
      designOfTimberElements: {
        timberBeams: false,
        timberColumns: false,
        timberJoistFloors: false,
        timberStudWalls: false,
        timberPanelWalls: false,
      },
      designOfMasonryElements: {
        masonryRetainingWalls: false,
        masonryWalls: false,
      },
      designOfConnections: {
        baseplateConnections: false,
        concreteAnchorsConnections: false,
        concretePunchingShear: false,
        corbelConnections: false,
        steelToConcreteConnections: false,
        steelToSteelConnections: false,
        timberToSteelConnections: false,
        timberToTimberConnections: false,
      },
      designOfFoundations: {
        footings: false,
        matFoundations: false,
        pileCaps: false,
        piles: false,
        sheetPiles: false,
      },
    },
    structureTypes: {
      accessRamps: false,
      aluminiumBars: false,
      boxCulverts: false,
      bridges: false,
      portalFrames: false,
      staircases: false,
    },
  };
}
 
const FEATURE_LABEL_TO_PATH = new Map([
  // BIM / Export & Import
  ["CIS/2 Export", "buildingInformationModelling.exportAndImportTools.cis2Export"],
  ["DXF Export", "buildingInformationModelling.exportAndImportTools.dxfExport"],
  ["Export Material Quantities", "buildingInformationModelling.exportAndImportTools.exportMaterialQuantities"],
  ["IFC Export", "buildingInformationModelling.exportAndImportTools.ifcExport"],
  ["IFC Import", "buildingInformationModelling.exportAndImportTools.ifcImport"],
  ["PDF Export", "buildingInformationModelling.exportAndImportTools.pdfExport"],
  // BIM / Detailing
  ["Detailed Plan / Section Drawings", "buildingInformationModelling.detailingTools.detailedPlanSectionDrawings"],
  ["Reinforcement Detailing / Sheets", "buildingInformationModelling.detailingTools.reinforcementDetailingSheets"],
  ["Reinforcement 3D Modelling", "buildingInformationModelling.detailingTools.reinforcement3dModelling"],
  // ECA
  ["Carbon Factor Library", "embodiedCarbonAssessment.carbonFactorLibrary"],
  ["Embodied Carbon Assessment", "__category.embodiedCarbonAssessment"],
  // Parametric
  ["Parametric Modelling", "parametricModelling"],
  // Analysis
  ["2D Analysis", "analysis.analysis2d"],
  ["3D Analysis", "analysis.analysis3d"],
  ["Composite Beam Analysis", "analysis.compositeBeamAnalysis"],
  ["Composite Section Analysis", "analysis.compositeSectionAnalysis"],
  ["Construction Stage Analysis", "analysis.constructionStageAnalysis"],
  ["Dynamic Analysis", "analysis.dynamicAnalysis"],
  ["Finite Element Analysis", "analysis.finiteElementAnalysis"],
  ["Footfall Analysis", "analysis.footfallAnalysis"],
  ["Global Buckling Analysis", "analysis.globalBucklingAnalysis"],
  ["Lateral Stability Analysis", "analysis.lateralStabilityAnalysis"],
  ["Local Buckling Analysis", "analysis.localBucklingAnalysis"],
  ["Non-linear Analysis", "analysis.nonLinearAnalysis"],
  ["Response Spectrum Analysis", "analysis.responseSpectrumAnalysis"],
  ["Rigorous Analysis", "analysis.rigorousAnalysis"],
  ["Rigorous Analysis ", "analysis.rigorousAnalysis"],
  ["Section Analysis", "analysis.sectionAnalysis"],
  ["Static Analysis", "analysis.staticAnalysis"],
  ["Strut and Tie Analysis", "analysis.strutAndTieAnalysis"],
  ["Tension / Compression Element Analysis", "analysis.tensionCompressionElementAnalysis"],
  ["Timber Analysis", "analysis.timberAnalysis"],
  ["Vibration Design & Analysis", "analysis.vibrationDesignAndAnalysis"],
  // Geotech
  ["Geotechnical Analysis", "__category.geotechnicalAnalysis"],
  ["Pile Lateral Stability", "geotechnicalAnalysis.pileLateralStability"],
  ["Pile Sinking", "geotechnicalAnalysis.pileSinking"],
  ["Slip Circles", "geotechnicalAnalysis.slipCircles"],
  ["Soil Structure Interaction", "geotechnicalAnalysis.soilStructureInteraction"],
  // Design - Element Design
  ["Design for Fire", "design.designForFire"],
  // Loads to Standards
  ["Seismic Loads", "design.calculationOfLoadsToStandards.seismicLoads"],
  ["Snow Loads", "design.calculationOfLoadsToStandards.snowLoads"],
  ["Wind Loads", "design.calculationOfLoadsToStandards.windLoads"],
  // Composite Elements
  ["Composite Beams", "design.designOfCompositeElements.compositeBeams"],
  ["Composite Columns", "design.designOfCompositeElements.compositeColumns"],
  ["Composite Decks and Slabs", "design.designOfCompositeElements.compositeDecksAndSlabs"],
  // Concrete Elements
  ["Concrete Beams", "design.designOfConcreteElements.concreteBeams"],
  ["Concrete Columns", "design.designOfConcreteElements.concreteColumns"],
  ["Concrete Core / Shear Walls", "design.designOfConcreteElements.concreteCoreShearWalls"],
  ["Concrete Coupling Beams", "design.designOfConcreteElements.concreteCouplingBeams"],
  ["Concrete Cracking", "design.designOfConcreteElements.concreteCracking"],
  ["Concrete Flat Slabs (1 Way)", "design.designOfConcreteElements.concreteFlatSlabs1Way"],
  ["Concrete Flat Slabs (2 Way)", "design.designOfConcreteElements.concreteFlatSlabs2Way"],
  ["Concrete Hollowcore Slabs", "design.designOfConcreteElements.concreteHollowcoreSlabs"],
  ["Concrete Joist Floors", "design.designOfConcreteElements.concreteJoistFloors"],
  ["Concrete Post Tensioning", "design.designOfConcreteElements.concretePostTensioning"],
  ["Concrete Reinforced Block Walls", "design.designOfConcreteElements.concreteReinforcedBlockWalls"],
  ["Concrete Retaining Walls", "design.designOfConcreteElements.concreteRetainingWalls"],
  ["Concrete Ribbed Slabs", "design.designOfConcreteElements.concreteRibbedSlabs"],
  ["Concrete Waffle Slabs", "design.designOfConcreteElements.concreteWaffleSlabs"],
  ["Concrete Walls", "design.designOfConcreteElements.concreteWalls"],
  // Steel Elements
  ["Steel Beams", "design.designOfSteelElements.steelBeams"],
  ["Steel Columns", "design.designOfSteelElements.steelColumns"],
  ["Steel Joist Floors", "design.designOfSteelElements.steelJoistFloors"],
  // Timber Elements
  ["Timber Beams", "design.designOfTimberElements.timberBeams"],
  ["Timber Columns", "design.designOfTimberElements.timberColumns"],
  ["Timber Joist Floors", "design.designOfTimberElements.timberJoistFloors"],
  ["Timber Stud Walls", "design.designOfTimberElements.timberStudWalls"],
  ["Timber Panel Walls", "design.designOfTimberElements.timberPanelWalls"],
  // Masonry Elements
  ["Masonry Retaining Walls", "design.designOfMasonryElements.masonryRetainingWalls"],
  ["Masonry Walls", "design.designOfMasonryElements.masonryWalls"],
  // Connections
  ["Baseplate Connections", "design.designOfConnections.baseplateConnections"],
  ["Concrete Anchors Connections", "design.designOfConnections.concreteAnchorsConnections"],
  ["Concrete Punching Shear", "design.designOfConnections.concretePunchingShear"],
  ["Corbel Connections", "design.designOfConnections.corbelConnections"],
  ["Steel to Concrete Connections", "design.designOfConnections.steelToConcreteConnections"],
  ["Steel to Steel Connections", "design.designOfConnections.steelToSteelConnections"],
  ["Timber to Steel Connections", "design.designOfConnections.timberToSteelConnections"],
  ["Timber to Timber Connections", "design.designOfConnections.timberToTimberConnections"],
  // Foundations
  ["Footings", "design.designOfFoundations.footings"],
  ["Mat Foundations", "design.designOfFoundations.matFoundations"],
  ["Pile Caps", "design.designOfFoundations.pileCaps"],
  ["Piles", "design.designOfFoundations.piles"],
  ["Sheet Piles", "design.designOfFoundations.sheetPiles"],
  // Structures
  ["Access Ramps", "structureTypes.accessRamps"],
  ["Aluminium Bars", "structureTypes.aluminiumBars"],
  ["Box Culverts", "structureTypes.boxCulverts"],
  ["Bridges", "structureTypes.bridges"],
  ["Portal Frames", "structureTypes.portalFrames"],
  ["Staircases", "structureTypes.staircases"],
  // Parent labels that appear in CSV
  ["Building Information Modelling", "__category.buildingInformationModelling"],
  ["Export & Import Tools", "__category.exportAndImportTools"],
  ["Detailing Tools", "__category.detailingTools"],
  // Rename category label to avoid confusion with geotechnical analysis
  ["Analysis", "__category.analysis"],
  ["Design", "__category.design"],
  ["Calculation of Loads to Standards", "__category.calculationOfLoadsToStandards"],
  ["Design of Composite Elements", "__category.designOfCompositeElements"],
  ["Design of Concrete Elements", "__category.designOfConcreteElements"],
  ["Design of Steel Elements", "__category.designOfSteelElements"],
  ["Design of Timber Elements", "__category.designOfTimberElements"],
  ["Design of Masonry Elements", "__category.designOfMasonryElements"],
  ["Design of Connections", "__category.designOfConnections"],
  ["Design of Foundations", "__category.designOfFoundations"],
  ["Structures", "__category.structureTypes"],
]);
 
function setPathBool(root, dottedPath, value) {
  const parts = dottedPath.split(".");
  let node = root;
  for (let i = 0; i < parts.length - 1; i++) {
    node = node[parts[i]];
    if (!node) return;
  }
  node[parts[parts.length - 1]] = value;
}
 
function setCategory(root, cat) {
  // Ensure at least one leaf flips to true so category is discoverable
  // (categories themselves are not stored as booleans; leafs are)
  if (cat === "buildingInformationModelling") return;
  if (cat === "analysis") return;
  if (cat === "design") return;
  if (cat === "geotechnicalAnalysis") return;
  if (cat === "embodiedCarbonAssessment") return;
  if (cat === "exportAndImportTools") return;
  if (cat === "detailingTools") return;
  if (cat === "calculationOfLoadsToStandards") return;
  if (cat === "designOfCompositeElements") return;
  if (cat === "designOfConcreteElements") return;
  if (cat === "designOfSteelElements") return;
  if (cat === "designOfTimberElements") return;
  if (cat === "designOfMasonryElements") return;
  if (cat === "designOfConnections") return;
  if (cat === "designOfFoundations") return;
  if (cat === "structureTypes") return;
}
 
function extractFeatureTokens(featuresRaw) {
  const t = normalizeNewlineMarkers(String(featuresRaw ?? "")).trim();
  if (isDashOrEmpty(t)) return [];
  return t
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)
    // IMPORTANT: do NOT split on "/" because some feature names contain it (e.g. "CIS/2 Export").
    .map((x) => x.replace(/^#+\s*/, "").trim())
    .filter((x) => x && !isDashOrEmpty(x))
    .map((x) => x.replace(/^\[|\]$/g, "").trim());
}
 
function buildFeatures(featuresRaw) {
  const features = buildEmptyFeatureHierarchy();
  const tokens = extractFeatureTokens(featuresRaw);
  const flat = new Set();
 
  for (const label of tokens) {
    // Rename category labels for clearer UI
    const normalizedLabel =
      label === "Analysis"
        ? "Structural Analysis"
        : label === "Design"
          ? "Design Calculations"
          : label;

    const mapped = FEATURE_LABEL_TO_PATH.get(label);
    if (!mapped) {
      // Keep unknown labels in flat list so they are not lost
      flat.add(normalizedLabel);
      continue;
    }
    if (mapped.startsWith("__category.")) {
      setCategory(features, mapped.slice("__category.".length));
      continue;
    }
    setPathBool(features, mapped, true);
    flat.add(normalizedLabel);
  }
 
  // Also infer a few parent-y things
  if (flat.has("Carbon Factor Library") || flat.has("Embodied Carbon Assessment")) {
    // nothing else needed; leaf already exists
  }
  if (flat.has("Parametric Modelling")) {
    // leaf already exists
  }
 
  return { features, featuresFlat: Array.from(flat).sort((a, b) => a.localeCompare(b)) };
}
 
function buildTool(row) {
  const id = stableId(row);
  const developer = String(row.Developer ?? "").trim();
  const product = String(row.Product ?? "").trim();
 
  const { features, featuresFlat } = buildFeatures(row.Features);
  const geotech =
    Boolean(features?.geotechnicalAnalysis?.pileLateralStability) ||
    Boolean(features?.geotechnicalAnalysis?.pileSinking) ||
    Boolean(features?.geotechnicalAnalysis?.slipCircles) ||
    Boolean(features?.geotechnicalAnalysis?.soilStructureInteraction);
 
  const otherInterfaces = splitList(row.Other);
  const otherNationalAnnexes = splitList(row["Other National Annexes"]);
  const otherCodes = splitList(row["Other Codes"]);
 
  return {
    id,
    developer: developer || false,
    product: product || false,
    toolType: toolTypeFromCsv(row["Product Type"]),
 
    links: {
      guidance: isDashOrEmpty(row["Link to Guidance"]) ? false : String(row["Link to Guidance"]).trim(),
      specifications: isDashOrEmpty(row["Link to Full Specs"]) ? false : String(row["Link to Full Specs"]).trim(),
    },
 
    complianceAndCertification: {
      certifiedByQualifiedEngineer: parseYesNoUnknown(
        row["Codified Design Checks Certified By Qualified Engineer"]
      ),
      fullDesignChecks: String(row["Level of Structural Checks"] ?? "")
        .toLowerCase()
        .includes("full"),
      iso9001Compliant: parseYesNoUnknown(row["ISO 9001 Compliant"]),
    },
 
    components: {
      structuralAnalysis: String(row.Components ?? "").toLowerCase().includes("analysis"),
      geotechnicalAnalysis: geotech,
      designCalculations: String(row.Components ?? "").toLowerCase().includes("design"),
      buildingInformationModelling: String(row.Components ?? "").toLowerCase().includes("bim"),
      parametricModelling: String(row.Components ?? "").toLowerCase().includes("parametric"),
      embodiedCarbonAssessment: String(row.Components ?? "").toLowerCase().includes("carbon"),
    },
 
    materials: {
      concrete: parseYesNoUnknown(row.Concrete),
      steel: parseYesNoUnknown(row.Steel),
      timber: parseYesNoUnknown(row.Timber),
      masonry: parseYesNoUnknown(row.Masonry),
      composites: parseYesNoUnknown(row.Composites),
      polymers: parseYesNoUnknown(row.Polymers),
    },
 
    features,
    featuresFlat,
 
    designCodes: {
      eurocodes: parseYesNoUnknown(row.Eurocodes),
      ukNationalAnnex: parseYesNoUnknown(row["UK National Annex"]),
      otherNationalAnnexes,
      britishStandards: parseYesNoUnknown(row["British Standards"]),
      otherCodes,
    },
 
    levelOfStructuralChecks: isDashOrEmpty(row["Level of Structural Checks"])
      ? false
      : String(row["Level of Structural Checks"]).trim(),
 
    systemRequirements: {
      noInternetAccessRequired: String(row["Internet Access Required"] ?? "")
        .toLowerCase()
        .trim()
        .startsWith("no"),
      operatingSystem: isDashOrEmpty(row["Operating System"]) ? false : splitList(row["Operating System"]),
      processors: isDashOrEmpty(row.Processors) ? false : String(row.Processors).trim(),
      maximumRam: normalizeRamStorage(row["Memory (RAM)"]),
      maximumStorage: normalizeRamStorage(row["Storage Requirements"]),
      internetAccessRequired: isDashOrEmpty(row["Internet Access Required"])
        ? false
        : String(row["Internet Access Required"]).trim(),
    },
 
    interfaces: {
      python: parseYesNoUnknown(row.Python),
      csharp: parseYesNoUnknown(row["C#"]),
      grasshopper: parseYesNoUnknown(row.Grasshopper),
      other: otherInterfaces.length ? otherInterfaces : false,
    },
 
    pricing: {
      pricingStructure: pricingStructureFromCsv(row["Pricing Structure"]),
      raw: isDashOrEmpty(row["Pricing Structure"]) ? false : splitList(row["Pricing Structure"]),
    },
 
    secondarySoftwareRequirements: isDashOrEmpty(row["Secondary Software Requirements"])
      ? false
      : splitList(row["Secondary Software Requirements"]),
 
    raw: {
      // Preserve a few original fields for debugging / future mapping
      productTypeCsv: isDashOrEmpty(row["Product Type"]) ? false : String(row["Product Type"]).trim(),
    },
  };
}
 
function main() {
  const csv = fs.readFileSync(CSV_PATH, "utf8");
  const rows = rowsToObjects(parseCSV(csv));
 
  fs.mkdirSync(OUT_DIR, { recursive: true });
 
  const manifest = [];
  const usedSlugs = new Map();
 
  for (const row of rows) {
    if (!row || (!row.Developer && !row.Product)) continue;
    const tool = buildTool(row);
    const base = slugify(`${tool.developer || "unknown"}-${tool.product || tool.id}`);
    const n = (usedSlugs.get(base) ?? 0) + 1;
    usedSlugs.set(base, n);
    const slug = n === 1 ? base : `${base}-${n}`;
    const filename = `${slug}.json`;
    const outPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(outPath, JSON.stringify(tool, null, 2) + "\n", "utf8");
    manifest.push({
      id: tool.id,
      file: `software/tools/${filename}`,
      developer: tool.developer,
      product: tool.product,
      toolType: tool.toolType,
    });
  }
 
  // Stable sort for diffs
  manifest.sort((a, b) => {
    const da = String(a.developer ?? "").toLowerCase();
    const db = String(b.developer ?? "").toLowerCase();
    if (da !== db) return da.localeCompare(db);
    const pa = String(a.product ?? "").toLowerCase();
    const pb = String(b.product ?? "").toLowerCase();
    return pa.localeCompare(pb);
  });
 
  fs.writeFileSync(INDEX_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), tools: manifest }, null, 2) + "\n", "utf8");
  console.log(`Wrote ${manifest.length} tools to ${OUT_DIR}`);
  console.log(`Wrote manifest ${INDEX_PATH}`);
}
 
main();


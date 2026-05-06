 /**
 * Digital tools directory — loads software/Database.csv and renders filterable cards.
 * Copyright © The Institution of Structural Engineers (IStructE).
 */

(function () {
  "use strict";

  const TOOLS_INDEX_PATH = "software/tools/index.json";

  /** Checkbox id → { field, expect } where row[field].toLowerCase() must include expect */
  const CHECKBOX_MAP = {
    "certified by qualified engineer": { type: "bool", path: "complianceAndCertification.certifiedByQualifiedEngineer" },
    full: { type: "bool", path: "complianceAndCertification.fullDesignChecks" },
    "iso 9001 compliant": { type: "bool", path: "complianceAndCertification.iso9001Compliant" },

    concrete: { type: "bool", path: "materials.concrete" },
    masonry: { type: "bool", path: "materials.masonry" },
    steel: { type: "bool", path: "materials.steel" },
    timber: { type: "bool", path: "materials.timber" },
    polymers: { type: "bool", path: "materials.polymers" },
    composites: { type: "bool", path: "materials.composites" },

    eurocodes: { type: "bool", path: "designCodes.eurocodes" },
    "united kingdom": { type: "bool", path: "designCodes.ukNationalAnnex" },
    "british standards": { type: "bool", path: "designCodes.britishStandards" },

    python: { type: "bool", path: "interfaces.python" },
    "c#": { type: "bool", path: "interfaces.csharp" },
    grasshopper: { type: "bool", path: "interfaces.grasshopper" },

    "no internet access required": { type: "bool", path: "systemRequirements.noInternetAccessRequired" },
  };

  let allRows = [];
  let filtered = [];
  /** @type {{version:number,type:string,nodes:any[]}|null} */
  let featureTree = null;

  function getByPath(obj, dottedPath) {
    if (!obj || !dottedPath) return undefined;
    const parts = dottedPath.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function extractNumericValue(text) {
    const match = String(text).match(/[\d.]+/);
    if (!match) return NaN;
    let value = parseFloat(match[0]);
    const u = String(text).toUpperCase();
    if (u.includes("GB")) return value;
    if (u.includes("MB")) return value / 1000;
    if (u.includes("KB")) return value / 1000000;
    return value;
  }

  function isDashOrEmpty(s) {
    const t = String(s).toLowerCase().trim();
    return t === "" || t === "-" || t === "any";
  }

  function passesFilters(row, filters) {
    for (const f of filters) {
      if (f.type === "multisearch") {
        const words = f.searchText.toLowerCase().split(/\s+/).filter(Boolean);
        const values = f.fields.map((field) =>
          String(getByPath(row, field) ?? "").toLowerCase().trim()
        );
        const allBlank = values.every((v) => isDashOrEmpty(v));
        const hasMatch = words.every((word) =>
          values.some((v) => !isDashOrEmpty(v) && v.includes(word))
        );
        if (!hasMatch && !allBlank) return false;
      } else if (f.type === "anymatch") {
        const text = String(getByPath(row, f.field) ?? "").toLowerCase().trim();
        if (isDashOrEmpty(text)) continue;
        const ok = f.keywords.some((kw) => text.includes(kw));
        if (!ok) return false;
      } else if (f.type === "includes") {
        const text = String(getByPath(row, f.field) ?? "").toLowerCase().trim();
        if (isDashOrEmpty(text)) continue;
        if (!text.includes(f.expect)) return false;
      } else if (f.type === "searchwords") {
        const text = String(getByPath(row, f.field) ?? "").toLowerCase().trim();
        if (isDashOrEmpty(text)) continue;
        const searchWords = f.searchText.split(/\s+/).filter(Boolean);
        const cellWords = text.split(/\s+/);
        if (
          !searchWords.every((word) =>
            cellWords.some((cw) => cw.includes(word))
          )
        ) {
          return false;
        }
      } else if (f.type === "numbermax") {
        const text = String(getByPath(row, f.field) ?? "").toLowerCase().trim();
        if (isDashOrEmpty(text)) continue;
        const num = extractNumericValue(text);
        if (isNaN(num) || num > f.maxValue) return false;
      } else if (f.type === "boolpath") {
        const v = Boolean(getByPath(row, f.path));
        if (!v) return false;
      } else if (f.type === "featureOrComponentRequirement") {
        const set = new Set((row.featuresFlat || []).map((x) => String(x).toLowerCase()));
        const featureOk = (f.featureValues || []).some((v) => set.has(String(v).toLowerCase()));
        const componentOk = Boolean(f.componentPath) && Boolean(getByPath(row, f.componentPath));
        if (!featureOk && !componentOk) return false;
      }
    }
    return true;
  }

  function buildFilters() {
    const filters = [];
    const form = document.getElementById("filterForm");
    if (!form) return filters;

    const globalQ = document.getElementById("globalSearch");
    if (globalQ && globalQ.value.trim()) {
      const q = globalQ.value.toLowerCase().trim();
      const words = q.split(/\s+/).filter(Boolean);
      filters.push({
        type: "global",
        words,
      });
    }

    form.querySelectorAll("input[type=checkbox]").forEach((input) => {
      if (!input.checked) return;
      // Feature checkboxes use data-feature and should not go through CHECKBOX_MAP
      if (input.dataset && input.dataset.feature) return;
      const id = input.id.toLowerCase();
      const spec = CHECKBOX_MAP[id];
      if (spec) {
        if (spec.type === "bool") {
          filters.push({ type: "boolpath", path: spec.path });
        }
      }
    });

    const typeSel = document.getElementById("softwareTypeDropdown");
    if (typeSel && typeSel.value.trim()) {
      filters.push({
        type: "includes",
        field: "toolType",
        expect: typeSel.value.toLowerCase().trim(),
      });
    }

    const osSel = document.getElementById("osDropdown");
    if (osSel && osSel.value.trim()) {
      filters.push({
        type: "includes",
        field: "systemRequirements.operatingSystem",
        expect: osSel.value.toLowerCase().trim(),
      });
    }

    const priceSel = document.getElementById("priceDropdown");
    if (priceSel && priceSel.value.trim()) {
      filters.push({
        type: "includes",
        field: "pricing.pricingStructure",
        expect: priceSel.value.toLowerCase().trim(),
      });
    }

    const selectedLeaf = new Set(
      Array.from(form.querySelectorAll('input[type="checkbox"][data-feature]:checked'))
        .map((i) => i.dataset.feature)
        .filter(Boolean)
    );

    // Leaf selections become AND requirements
    form.querySelectorAll('input[type="checkbox"][data-feature]:checked').forEach((i) => {
      const feature = i.dataset.feature;
      if (!feature) return;
      filters.push({
        type: "featureOrComponentRequirement",
        featureValues: [feature],
        componentPath: i.dataset.componentPath || null,
      });
    });

    // Category selections:
    // - If any descendant leaf is selected, the category selection is overridden (ignored).
    // - Otherwise, include (componentPath OR any descendant leaf features).
    form.querySelectorAll('input[type="checkbox"][data-feature-group]:checked').forEach((i) => {
      let groupLeaf = [];
      try {
        groupLeaf = JSON.parse(i.dataset.featureGroupValues || "[]");
      } catch {
        groupLeaf = [];
      }
      const hasSelectedChild = Array.isArray(groupLeaf) && groupLeaf.some((v) => selectedLeaf.has(v));
      if (hasSelectedChild) return;

      const cp = i.dataset.componentPath || null;
      filters.push({
        type: "featureOrComponentRequirement",
        featureValues: Array.isArray(groupLeaf) ? groupLeaf.filter(Boolean) : [],
        componentPath: cp,
      });
    });

    const secondary = document.getElementById("Secondary Software");
    if (secondary && secondary.value.trim()) {
      filters.push({
        type: "searchwords",
        field: "secondarySoftwareRequirements",
        searchText: secondary.value.toLowerCase().trim(),
      });
    }

    const country = document.getElementById("Country");
    if (country && country.value.trim()) {
      filters.push({
        type: "multisearch",
        fields: ["designCodes.otherNationalAnnexes", "designCodes.otherCodes"],
        searchText: country.value.toLowerCase().trim(),
      });
    }

    const ram = document.getElementById("RAM");
    if (ram && ram.value.trim() !== "") {
      filters.push({
        type: "numbermax",
        field: "systemRequirements.maximumRam",
        maxValue: parseFloat(ram.value),
      });
    }

    const storage = document.getElementById("Storage");
    if (storage && storage.value.trim() !== "") {
      filters.push({
        type: "numbermax",
        field: "systemRequirements.maximumStorage",
        maxValue: parseFloat(storage.value),
      });
    }

    return filters;
  }

  function passesGlobal(row, words) {
    const blob = [
      row.developer,
      row.product,
      row.toolType,
      JSON.stringify(row.components || {}),
      (row.featuresFlat || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return words.every((w) => blob.includes(w));
  }

  function applyFilters() {
    const raw = buildFilters();
    const global = raw.filter((f) => f.type === "global");
    const rest = raw.filter((f) => f.type !== "global");
    const words = global.length ? global[0].words : null;

    filtered = allRows.filter((row) => {
      if (words && !passesGlobal(row, words)) return false;
      return passesFilters(row, rest);
    });

    sortFiltered();
    renderCards();
    updateCount();
  }

  function sortFiltered() {
    const sel = document.getElementById("sortSelect");
    const mode = sel ? sel.value : "product-asc";

    const cmp = (a, b, field, num) => {
      const va = String(getByPath(a, field) ?? "").toLowerCase().trim();
      const vb = String(getByPath(b, field) ?? "").toLowerCase().trim();
      if (va === "-" && !num) return 1;
      if (vb === "-" && !num) return -1;
      if (num) {
        const na = extractNumericValue(va);
        const nb = extractNumericValue(vb);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
      }
      return va.localeCompare(vb);
    };

    filtered.sort((a, b) => {
      let r = 0;
      switch (mode) {
        case "product-desc":
          r = cmp(a, b, "product", false);
          return -r;
        case "developer-asc":
          r = cmp(a, b, "developer", false);
          return r;
        case "developer-desc":
          r = cmp(a, b, "developer", false);
          return -r;
        case "pricing-asc":
          r = cmp(a, b, "pricing.pricingStructure", false);
          return r;
        case "storage-asc":
          r = cmp(a, b, "systemRequirements.maximumStorage", true);
          return r;
        case "product-asc":
        default:
          r = cmp(a, b, "product", false);
          return r;
      }
    });
  }

  function safeUrl(href) {
    const t = String(href).trim();
    if (/^https?:\/\//i.test(t)) return t;
    return "";
  }

  /** CSV used /# as line breaks; also allow "/ #" */
  function normalizeNewlineMarkers(s) {
    return String(s || "").replace(/\/\s*#/g, "\n");
  }

  function stripHtmlTags(text) {
    return String(text || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ");
  }

  function findClosingBracket(s, openIdx) {
    let depth = 0;
    for (let i = openIdx; i < s.length; i++) {
      if (s[i] === "[") depth++;
      else if (s[i] === "]") {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  /**
   * [Label {tooltip}] → bold Label; tooltip text dropped unless body starts with "Including:".
   * In that case, list lines come from the brace body after stripping "Including:" and /# markers.
   */
  function parseBracketInner(inner) {
    const openBrace = inner.indexOf("{");
    if (openBrace === -1) {
      return { header: stripHtmlTags(inner).trim(), lines: null };
    }
    let header = inner.slice(0, openBrace).trim();
    header = header.replace(/:+\s*$/, "");
    header = stripHtmlTags(header).trim();
    let depth = 0;
    let endBrace = -1;
    for (let k = openBrace; k < inner.length; k++) {
      if (inner[k] === "{") depth++;
      else if (inner[k] === "}") {
        depth--;
        if (depth === 0) {
          endBrace = k;
          break;
        }
      }
    }
    if (endBrace === -1) {
      return {
        header: stripHtmlTags(inner.replace(/[{}]/g, "")).trim() || "—",
        lines: null,
      };
    }
    let body = inner.slice(openBrace + 1, endBrace).trim();
    const inc = /^(?:including|inluding)\s*:\s*/i;
    let lines = null;
    if (inc.test(body)) {
      body = normalizeNewlineMarkers(body.replace(inc, ""));
      lines = body
        .split(/\n+/)
        .map((x) =>
          stripHtmlTags(x)
            .replace(/^\s*-\s*/, "")
            .trim()
        )
        .filter(Boolean);
    }
    return { header: header || "—", lines };
  }

    /**
       * Helper to append text that might contain HTML links.
       * It parses <a> tags and creates actual DOM nodes.
       */
    function appendTextWithLinks(container, text) {
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*?>(.*?)<\/a>/gi;
        let lastIdx = 0;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
            // Append text before the link
            if (match.index > lastIdx) {
                container.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
            }

            // Create the anchor element
            const a = document.createElement("a");
            a.href = match[2];
            a.textContent = match[3];
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            // Optional: add a class for styling if needed
            a.style.color = "var(--color-primary, #007bff)";
            a.style.textDecoration = "underline";

            container.appendChild(a);
            lastIdx = linkRegex.lastIndex;
        }

        // Append remaining text
        if (lastIdx < text.length) {
            container.appendChild(document.createTextNode(text.slice(lastIdx)));
        }
    }

    function appendPlainLines(container, text) {
        if (!text) return;

        // Split by newlines to respect the formatting
        const parts = text.split(/\n+/);

        parts.forEach((line, idx) => {
            if (idx > 0) container.appendChild(document.createElement("br"));

            const trimmedLine = line.trim();

            // Check if the line contains what looks like an HTML tag
            if (trimmedLine.includes("<a") && trimmedLine.includes("</a>")) {
                // Create a temporary span to hold the parsed HTML
                const tempSpan = document.createElement("span");
                // We use innerHTML here ONLY on the specific line from the CSV 
                // to turn the <a> string into a real clickable element
                tempSpan.innerHTML = trimmedLine;

                // Append the parsed nodes to the container
                while (tempSpan.firstChild) {
                    container.appendChild(tempSpan.firstChild);
                }
            } else {
                // If no link, just append as safe text
                container.appendChild(document.createTextNode(trimmedLine));
            }
        });
    }
    /** Renders formatted description into container (safe DOM). */
    function appendFormattedCell(container, raw) {
        let s = normalizeNewlineMarkers(String(raw || ""));
        let i = 0;
        while (i < s.length) {
            const open = s.indexOf("[", i);
            if (open === -1) {
                appendPlainLines(container, s.slice(i));
                break;
            }
            if (open > i) appendPlainLines(container, s.slice(i, open));

            const close = findClosingBracket(s, open);
            if (close === -1) {
                appendPlainLines(container, s.slice(open));
                break;
            }

            const inner = s.slice(open + 1, close);
            const parsed = parseBracketInner(inner);

            if (container.childNodes.length > 0) {
                container.appendChild(document.createElement("br"));
            }

            const strong = document.createElement("strong");
            strong.textContent = parsed.header;
            container.appendChild(strong);
            container.appendChild(document.createElement("br"));

            if (parsed.lines && parsed.lines.length) {
                parsed.lines.forEach((line) => {
                    container.appendChild(document.createElement("br"));
                    // Use link-aware appender for list items too
                    appendTextWithLinks(container, line);
                });
            }

            i = close + 1;
            if (s[i] === "\n") i++;
        }
    }

  function toPlainText(raw) {
    const d = document.createElement("div");
    appendFormattedCell(d, raw);
    return d.textContent.replace(/\s+/g, " ").trim();
  }

  /** One-line badge text: newlines become middots */
  function toBadgePlain(raw) {
    return toPlainText(raw)
      .replace(/\s*\n\s*/g, " · ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatMultiline(text) {
    return normalizeNewlineMarkers(String(text || ""));
  }

  function materialTags(row) {
    const pairs = [
      ["materials.concrete", "Concrete"],
      ["materials.masonry", "Masonry"],
      ["materials.steel", "Steel"],
      ["materials.timber", "Timber"],
      ["materials.polymers", "Polymers"],
      ["materials.composites", "Composites"],
    ];
    return pairs
      .filter(([field]) => Boolean(getByPath(row, field)))
      .map(([, label]) => label);
  }

    function renderCards() {
        const grid = document.getElementById("cardGrid");
        if (!grid) return;
        grid.textContent = "";

        const frag = document.createDocumentFragment();

        filtered.forEach((row) => {
            const card = document.createElement("article");
            card.className = "tool-card";

            const head = document.createElement("header");
            head.className = "tool-card__head";

            const title = document.createElement("h3");
            title.className = "tool-card__title";
            const productRaw = row.product || "—";
            if (isDashOrEmpty(productRaw)) title.textContent = "—";
            else title.textContent = String(productRaw);

            const dev = document.createElement("p");
            dev.className = "tool-card__developer";
            dev.textContent = row.developer || "";

            head.appendChild(title);
            head.appendChild(dev);

            // 1. Create one single container for ALL badges
            const badges = document.createElement("div");
            badges.className = "tool-card__badges";

            // 2. Add the Product Type badge
            const typeBadge = document.createElement("span");
            typeBadge.className = "badge badge--type";
            typeBadge.textContent = toBadgePlain(row.toolType || "—");
            badges.appendChild(typeBadge);

            // 3. Process and add all Pricing badges to that SAME container
            const priceRaw = Array.isArray(row.pricing && row.pricing.raw)
              ? row.pricing.raw.join("\n")
              : (row.pricing && row.pricing.pricingStructure) || "—";
            const priceParts = String(priceRaw).split('\n').filter(p => p.trim() !== "");

            priceParts.forEach(part => {
                const priceBadge = document.createElement("span");
                priceBadge.className = "badge badge--price";
                priceBadge.textContent = toBadgePlain(part);
                badges.appendChild(priceBadge);
            });

            const tags = document.createElement("div");
            tags.className = "tool-card__tags";

            const toProperCase = (str) =>
                str
                    .replace(/([a-z])([A-Z])/g, "$1 $2")
                    .replace(/\b\w/g, (c) => c.toUpperCase());

            materialTags(row).forEach((label) => {
                const t = document.createElement("span");
                t.className = "tag";
                t.textContent = label;
                tags.appendChild(t);
            });

            Object.entries(row.components || {})
                .filter(([, v]) => Boolean(v))
                .forEach(([k]) => {
                    const t = document.createElement("span");
                    t.className = "tag";
                    t.textContent = toProperCase(k);
                    tags.appendChild(t);
                });

            const actions = document.createElement("div");
            actions.className = "tool-card__actions";
            const g = safeUrl(row.links && row.links.guidance);
            if (g) {
                const a = document.createElement("a");
                a.className = "btn btn--primary";
                a.href = g;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = "Guidance";
                actions.appendChild(a);
            }
            const sp = safeUrl(row.links && row.links.specifications);
            if (sp) {
                const a2 = document.createElement("a");
                a2.className = "btn btn--ghost";
                a2.href = sp;
                a2.target = "_blank";
                a2.rel = "noopener noreferrer";
                a2.textContent = "Specifications";
                actions.appendChild(a2);
            }

            const details = document.createElement("details");
            details.className = "tool-card__details";
            const summ = document.createElement("summary");
            summ.textContent = "Full details";
            details.appendChild(summ);

            const dl = document.createElement("dl");
            dl.className = "tool-card__dl";
            const addRow = (dt, ddText) => {
                if (!ddText || isDashOrEmpty(ddText)) return;
                const dtEl = document.createElement("dt");
                dtEl.textContent = dt;
                const ddEl = document.createElement("dd");
                ddEl.className = "tool-card__dd-rich";
                // Some JSON values contain <a href="...">...</a> (from the original dataset).
                // Render those links as real anchors (safe parsing limited to <a>).
                appendPlainLines(ddEl, normalizeNewlineMarkers(String(ddText)));
                dl.appendChild(dtEl);
                dl.appendChild(ddEl);
            };

            addRow("Features", Array.isArray(row.featuresFlat) ? row.featuresFlat.join(",\n") : "");
            addRow(
                "Components",
                Object.entries(row.components || {})
                    .filter(([, v]) => v)
                    .map(([k]) => toProperCase(k))
                    .join(",\r\n")
            );
            addRow("Certified by qualified engineer", String(row.complianceAndCertification && row.complianceAndCertification.certifiedByQualifiedEngineer));
            addRow("ISO 9001", String(row.complianceAndCertification && row.complianceAndCertification.iso9001Compliant));
            addRow("Structural check level", row.levelOfStructuralChecks || "");
            addRow("Eurocodes", String(row.designCodes && row.designCodes.eurocodes));
            addRow("UK National Annex", String(row.designCodes && row.designCodes.ukNationalAnnex));
            addRow("Other national annexes", Array.isArray(row.designCodes && row.designCodes.otherNationalAnnexes) ? row.designCodes.otherNationalAnnexes.join(",\n") : "");
            addRow("British Standards", String(row.designCodes && row.designCodes.britishStandards));
            addRow("Other codes", Array.isArray(row.designCodes && row.designCodes.otherCodes) ? row.designCodes.otherCodes.join(",\n") : "");
            addRow("Operating system", Array.isArray(row.systemRequirements && row.systemRequirements.operatingSystem) ? row.systemRequirements.operatingSystem.join(",\n") : "");
            addRow("Processors", row.systemRequirements && row.systemRequirements.processors);
            addRow("Memory (RAM)", row.systemRequirements && row.systemRequirements.maximumRam);
            addRow("Storage", row.systemRequirements && row.systemRequirements.maximumStorage);
            addRow("Internet access", row.systemRequirements && row.systemRequirements.internetAccessRequired);
            addRow("Python", String(row.interfaces && row.interfaces.python));
            addRow("C#", String(row.interfaces && row.interfaces.csharp));
            addRow("Grasshopper", String(row.interfaces && row.interfaces.grasshopper));
            addRow("Other interfaces", Array.isArray(row.interfaces && row.interfaces.other) ? row.interfaces.other.join(",\n") : "");
            addRow("Secondary software", Array.isArray(row.secondarySoftwareRequirements) ? row.secondarySoftwareRequirements.join(",\n") : "");

            details.appendChild(dl);

            card.appendChild(head);
            card.appendChild(badges); // All badges are in here
            if (tags.childElementCount) card.appendChild(tags);
            card.appendChild(actions);
            card.appendChild(details);

            frag.appendChild(card);
        });

        grid.appendChild(frag);
    }

  function updateCount() {
    const el = document.getElementById("resultCount");
    if (el) {
      const n = filtered.length;
      el.textContent =
        n === allRows.length
          ? `${n} tools`
          : `${n} of ${allRows.length} tools`;
    }
  }

  function updatePluginVisibility() {
    const inputArea = document.getElementById("pluginFor");
    const inputbar = document.getElementById("Secondary Software");
    const typeSel = document.getElementById("softwareTypeDropdown");
    if (!inputArea || !inputbar || !typeSel) return;
    const v = typeSel.value;
    if (v === "Plug In" || v === "") {
      inputArea.style.display = "";
    } else {
      inputArea.style.display = "none";
      inputbar.value = "";
    }
  }

  async function loadFeatureOptionList() {
    const url = `software/feature-filter-options.json?v=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load feature filter list");
    featureTree = await res.json();
    renderFeatureAccordion();
  }

  function renderFeatureAccordion() {
    const host = document.getElementById("featureAccordion");
    if (!host) return;
    host.textContent = "";
    if (!featureTree || !Array.isArray(featureTree.nodes)) return;

    const CATEGORY_COMPONENT_PATH = {
      analysis: "components.structuralAnalysis",
      design: "components.designCalculations",
      "building-information-modelling": "components.buildingInformationModelling",
      "parametric-modelling": "components.parametricModelling",
      "embodied-carbon-assessment": "components.embodiedCarbonAssessment",
      "geotechnical-analysis": "components.geotechnicalAnalysis",
    };

    const LEAF_COMPONENT_PATH = {
      "Parametric Modelling": "components.parametricModelling",
    };

    const makeLeaf = (node) => {
      const box = document.createElement("div");
      box.className = "feature-acc__group feature-acc__group--leaf";

      const wrap = document.createElement("label");
      wrap.className = "checkbox-label feature-acc__leaf feature-acc__leaf--card";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.feature = node.value;
      const leafCp = LEAF_COMPONENT_PATH[node.value];
      if (leafCp) input.dataset.componentPath = leafCp;
      input.addEventListener("change", applyFilters);
      const span = document.createElement("span");
      span.textContent = node.label;
      wrap.appendChild(input);
      wrap.appendChild(span);
      box.appendChild(wrap);
      return box;
    };

    const collectLeafValues = (node) => {
      const out = [];
      const walk = (n) => {
        const kids = Array.isArray(n.children) ? n.children : null;
        if (!kids || !kids.length) {
          if (n && n.value) out.push(n.value);
          return;
        }
        kids.forEach(walk);
      };
      walk(node);
      return out;
    };

    const makeNode = (node, depth) => {
      const hasChildren = Array.isArray(node.children) && node.children.length;
      if (!hasChildren && node.value) return makeLeaf(node);

      const details = document.createElement("details");
      details.className = "feature-acc__group";
      if (depth === 0) details.open = false;
      const summary = document.createElement("summary");
      const summaryInner = document.createElement("div");
      summaryInner.className = "feature-acc__summary";

      const clearDescendants = () => {
        // Uncheck all nested feature checkboxes and close nested groups
        details
          .querySelectorAll('input[type="checkbox"][data-feature], input[type="checkbox"][data-feature-group]')
          .forEach((cb) => {
            if (cb !== input) cb.checked = false;
          });
        details.querySelectorAll("details.feature-acc__group").forEach((d) => {
          if (d !== details) d.open = false;
        });
      };

      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.featureGroup = "1";
      const leafValues = collectLeafValues(node);
      input.dataset.featureGroupValues = JSON.stringify(leafValues);
      const cp = CATEGORY_COMPONENT_PATH[node.id];
      if (cp) input.dataset.componentPath = cp;
      input.addEventListener("click", (e) => e.stopPropagation());
      input.addEventListener("change", () => {
        // Visibility is driven by the parent checkbox state
        details.open = Boolean(input.checked);
        if (!input.checked) clearDescendants();
        applyFilters();
      });

      const span = document.createElement("span");
      span.textContent = node.label;
      span.className = "feature-acc__summary-text";
      // Clicking the text toggles the checkbox and therefore visibility.
      span.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        input.checked = !input.checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // Prevent native <summary> toggle; open/close is checkbox-driven
      summary.addEventListener("click", (e) => {
        // allow checkbox itself to work normally
        if (e.target === input) return;
        e.preventDefault();
      });

      const row = document.createElement("div");
      row.className = "feature-acc__summary-row";
      row.appendChild(input);
      row.appendChild(span);

      summaryInner.appendChild(row);
      summary.appendChild(summaryInner);

      const body = document.createElement("div");
      body.className = "feature-acc__body";
      if (depth > 0) body.classList.add("feature-acc__child");

      (node.children || []).forEach((child) => body.appendChild(makeNode(child, depth + 1)));
      details.appendChild(summary);
      details.appendChild(body);
      return details;
    };

    featureTree.nodes.forEach((n) => host.appendChild(makeNode(n, 0)));
  }

  async function loadTools() {
    const indexUrl = `${TOOLS_INDEX_PATH}?v=${Date.now()}`;
    const indexRes = await fetch(indexUrl, { cache: "no-store" });
    if (!indexRes.ok) throw new Error(`Could not load ${TOOLS_INDEX_PATH}: ${indexRes.status}`);
    const index = await indexRes.json();
    const list = Array.isArray(index.tools) ? index.tools : [];

    const tools = await Promise.all(
      list.map(async (t) => {
        const res = await fetch(`${t.file}?v=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Could not load tool JSON: ${t.file}`);
        return await res.json();
      })
    );
    allRows = tools;
    filtered = allRows.slice();
    sortFiltered();
    renderCards();
    updateCount();
  }

  function bindForm() {
    const form = document.getElementById("filterForm");
    if (!form) return;
    form.addEventListener("change", () => {
      updatePluginVisibility();
      applyFilters();
    });
    form.addEventListener("input", () => {
      updatePluginVisibility();
      applyFilters();
    });

    const gs = document.getElementById("globalSearch");
    if (gs) {
      let t;
      gs.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(applyFilters, 200);
      });
    }

    const sortSel = document.getElementById("sortSelect");
    if (sortSel) sortSel.addEventListener("change", applyFilters);

    const toggleAll = document.getElementById("toggleAllDetails");
    if (toggleAll) {
      toggleAll.addEventListener("click", () => {
        const all = Array.from(document.querySelectorAll(".tool-card__details"));
        if (!all.length) return;
        const shouldOpen = all.some((d) => !d.open);
        all.forEach((d) => (d.open = shouldOpen));
        toggleAll.textContent = shouldOpen ? "Collapse all" : "Expand all";
      });
    }

    const reset = document.getElementById("resetFilters");
    if (reset) {
      reset.addEventListener("click", (e) => {
        e.preventDefault();
        form.reset();
        form
          .querySelectorAll('input[type="checkbox"][data-feature]')
          .forEach((i) => (i.checked = false));
        form
          .querySelectorAll('input[type="checkbox"][data-feature-group]')
          .forEach((i) => (i.checked = false));
        const ram = document.getElementById("RAM");
        if (ram) ram.value = "";
        const storage = document.getElementById("Storage");
        if (storage) storage.value = "";
        updatePluginVisibility();
        applyFilters();
      });
    }

    updatePluginVisibility();
  }

  window.showWebPage = function () {
    const d = document.getElementById("disclaimer");
    const b = document.getElementById("blur-overlay");
    if (d) d.remove();
    if (b) b.remove();
  };

  document.addEventListener("DOMContentLoaded", async () => {
    bindForm();
    try {
      await loadFeatureOptionList();
    } catch (e) {
      console.error(e);
    }
    try {
      await loadTools();
    } catch (e) {
      console.error(e);
      const grid = document.getElementById("cardGrid");
      if (grid) {
        grid.textContent = "";
        const p = document.createElement("p");
        p.className = "load-error";
        p.textContent =
          "Unable to load the software database. Please refresh the page or try again later.";
        grid.appendChild(p);
      }
    }
  });
})();


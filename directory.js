/**
 * Digital tools directory — loads software/Database.csv and renders filterable cards.
 * Copyright © The Institution of Structural Engineers (IStructE).
 */

(function () {
  "use strict";

  const CSV_PATH = "software/Database.csv";

  const COL = {
    developer: "Developer",
    product: "Product",
    productType: "Product Type",
    components: "Components",
    features: "Features",
    codifiedCert: "Codified Design Checks Certified By Qualified Engineer",
    iso9001: "ISO 9001 Compliant",
    linkGuidance: "Link to Guidance",
    concrete: "Concrete",
    masonry: "Masonry",
    steel: "Steel",
    timber: "Timber",
    polymers: "Polymers",
    composites: "Composites",
    eurocodes: "Eurocodes",
    ukNa: "UK National Annex",
    otherNa: "Other National Annexes",
    britishStd: "British Standards",
    otherCodes: "Other Codes",
    checkLevel: "Level of Structural Checks",
    python: "Python",
    csharp: "C#",
    grasshopper: "Grasshopper",
    otherApi: "Other",
    os: "Operating System",
    processors: "Processors",
    ram: "Memory (RAM)",
    storage: "Storage Requirements",
    internet: "Internet Access Required",
    linkSpecs: "Link to Full Specs",
    pricing: "Pricing Structure",
    secondary: "Secondary Software Requirements",
  };

  /** Checkbox id → { field, expect } where row[field].toLowerCase() must include expect */
  const CHECKBOX_MAP = {
    "certified by qualified engineer": {
      field: COL.codifiedCert,
      expect: "yes",
    },
    full: { field: COL.checkLevel, expect: "full" },
    "iso 9001 compliant": { field: COL.iso9001, expect: "yes" },
    analysis: { field: COL.components, expect: "analysis" },
    design: { field: COL.components, expect: "design" },
    bim: { field: COL.components, expect: "bim" },
    parametric: { field: COL.components, expect: "parametric" },
    carbon: { field: COL.components, expect: "carbon" },
    concrete: { field: COL.concrete, expect: "yes" },
    masonry: { field: COL.masonry, expect: "yes" },
    steel: { field: COL.steel, expect: "yes" },
    timber: { field: COL.timber, expect: "yes" },
    polymers: { field: COL.polymers, expect: "yes" },
    composites: { field: COL.composites, expect: "yes" },
    eurocodes: { field: COL.eurocodes, expect: "yes" },
    "united kingdom": { field: COL.ukNa, expect: "yes" },
    "british standards": { field: COL.britishStd, expect: "yes" },
    python: { field: COL.python, expect: "yes" },
    "c#": { field: COL.csharp, expect: "yes" },
    grasshopper: { field: COL.grasshopper, expect: "yes" },
    "no internet access required": { field: COL.internet, expect: "no" },
  };

  let allRows = [];
  let filtered = [];
  /** @type {{value:string,label:string}[]} */
  let featureOptionList = [];

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

  function cellLower(row, field) {
    return String(row[field] ?? "").toLowerCase().trim();
  }

  function isDashOrEmpty(s) {
    const t = String(s).toLowerCase().trim();
    return t === "" || t === "-" || t === "any";
  }

  function passesFilters(row, filters) {
    for (const f of filters) {
      if (f.type === "multisearch") {
        const words = f.searchText.toLowerCase().split(/\s+/).filter(Boolean);
        const values = f.fields.map((field) => cellLower(row, field));
        const allBlank = values.every((v) => isDashOrEmpty(v));
        const hasMatch = words.every((word) =>
          values.some((v) => !isDashOrEmpty(v) && v.includes(word))
        );
        if (!hasMatch && !allBlank) return false;
      } else if (f.type === "anymatch") {
        const text = cellLower(row, f.field);
        if (isDashOrEmpty(text)) continue;
        const ok = f.keywords.some((kw) => text.includes(kw));
        if (!ok) return false;
      } else if (f.type === "includes") {
        const text = cellLower(row, f.field);
        if (isDashOrEmpty(text)) continue;
        if (!text.includes(f.expect)) return false;
      } else if (f.type === "searchwords") {
        const text = cellLower(row, f.field);
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
        const text = cellLower(row, f.field);
        if (isDashOrEmpty(text)) continue;
        const num = extractNumericValue(text);
        if (isNaN(num) || num > f.maxValue) return false;
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
      const id = input.id.toLowerCase();
      const spec = CHECKBOX_MAP[id];
      if (spec) {
        filters.push({
          type: "includes",
          field: spec.field,
          expect: spec.expect,
        });
      }
    });

    const typeSel = document.getElementById("softwareTypeDropdown");
    if (typeSel && typeSel.value.trim()) {
      filters.push({
        type: "includes",
        field: COL.productType,
        expect: typeSel.value.toLowerCase().trim(),
      });
    }

    const osSel = document.getElementById("osDropdown");
    if (osSel && osSel.value.trim()) {
      filters.push({
        type: "includes",
        field: COL.os,
        expect: osSel.value.toLowerCase().trim(),
      });
    }

    const priceSel = document.getElementById("priceDropdown");
    if (priceSel && priceSel.value.trim()) {
      filters.push({
        type: "includes",
        field: COL.pricing,
        expect: priceSel.value.toLowerCase().trim(),
      });
    }

    form.querySelectorAll(".feature-select").forEach((select) => {
      const v = select.value.trim().toLowerCase();
      if (!v) return;
      if (v.includes(";")) {
        filters.push({
          type: "anymatch",
          field: COL.features,
          keywords: v.split(";").map((s) => s.trim().toLowerCase()),
        });
      } else {
        filters.push({
          type: "includes",
          field: COL.features,
          expect: v,
        });
      }
    });

    const secondary = document.getElementById("Secondary Software");
    if (secondary && secondary.value.trim()) {
      filters.push({
        type: "searchwords",
        field: COL.secondary,
        searchText: secondary.value.toLowerCase().trim(),
      });
    }

    const country = document.getElementById("Country");
    if (country && country.value.trim()) {
      filters.push({
        type: "multisearch",
        fields: [COL.otherNa, COL.otherCodes],
        searchText: country.value.toLowerCase().trim(),
      });
    }

    const ram = document.getElementById("RAM");
    if (ram && ram.value.trim() !== "") {
      filters.push({
        type: "numbermax",
        field: COL.ram,
        maxValue: parseFloat(ram.value),
      });
    }

    const storage = document.getElementById("Storage");
    if (storage && storage.value.trim() !== "") {
      filters.push({
        type: "numbermax",
        field: COL.storage,
        maxValue: parseFloat(storage.value),
      });
    }

    return filters;
  }

  function passesGlobal(row, words) {
    const blob = [
      row[COL.developer],
      row[COL.product],
      row[COL.productType],
      row[COL.components],
      row[COL.features],
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
      const va = String(a[field] ?? "").toLowerCase().trim();
      const vb = String(b[field] ?? "").toLowerCase().trim();
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
          r = cmp(a, b, COL.product, false);
          return -r;
        case "developer-asc":
          r = cmp(a, b, COL.developer, false);
          return r;
        case "developer-desc":
          r = cmp(a, b, COL.developer, false);
          return -r;
        case "pricing-asc":
          r = cmp(a, b, COL.pricing, false);
          return r;
        case "storage-asc":
          r = cmp(a, b, COL.storage, true);
          return r;
        case "product-asc":
        default:
          r = cmp(a, b, COL.product, false);
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

  function appendPlainLines(container, text) {
    const t = stripHtmlTags(text).trim();
    if (!t) return;
    const parts = t.split(/\n+/);
    parts.forEach((line, idx) => {
      if (idx > 0) container.appendChild(document.createElement("br"));
      container.appendChild(document.createTextNode(line.trim()));
    });
  }

  /** Renders formatted description into container (safe DOM, no innerHTML). */
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

            // --- NEW LOGIC: Add line break before the block if container isn't empty ---
            if (container.childNodes.length > 0) {
                container.appendChild(document.createElement("br"));
            }

            const strong = document.createElement("strong");
            strong.textContent = parsed.header;
            container.appendChild(strong);

            if (parsed.lines && parsed.lines.length) {
                parsed.lines.forEach((line) => {
                    container.appendChild(document.createElement("br"));
                    container.appendChild(document.createTextNode(line));
                });
            }

            i = close + 1;
            // Skip the immediate newline after a bracket if it exists to avoid double-spacing
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
      [COL.concrete, "Concrete"],
      [COL.masonry, "Masonry"],
      [COL.steel, "Steel"],
      [COL.timber, "Timber"],
      [COL.polymers, "Polymers"],
      [COL.composites, "Composites"],
    ];
    return pairs
      .filter(([field]) => cellLower(row, field) === "yes")
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
      const productRaw = row[COL.product] || "—";
      if (isDashOrEmpty(productRaw)) title.textContent = "—";
      else appendFormattedCell(title, productRaw);

      const dev = document.createElement("p");
      dev.className = "tool-card__developer";
      dev.textContent = row[COL.developer] || "";

      head.appendChild(title);
      head.appendChild(dev);

      const badges = document.createElement("div");
      badges.className = "tool-card__badges";
      const typeBadge = document.createElement("span");
      typeBadge.className = "badge badge--type";
      typeBadge.textContent = toBadgePlain(row[COL.productType] || "—");
      badges.appendChild(typeBadge);
      const priceBadge = document.createElement("span");
      priceBadge.className = "badge badge--price";
      priceBadge.textContent = toBadgePlain(row[COL.pricing] || "—");
      badges.appendChild(priceBadge);

      const tags = document.createElement("div");
      tags.className = "tool-card__tags";
      materialTags(row).forEach((label) => {
        const t = document.createElement("span");
        t.className = "tag";
        t.textContent = label;
        tags.appendChild(t);
      });

      const summary = document.createElement("p");
      summary.className = "tool-card__summary";
      const compRaw = row[COL.components] || "";
      const compPlain = toPlainText(compRaw);
      if (compPlain.length > 220) {
        summary.textContent = compPlain.slice(0, 217) + "…";
      } else if (compRaw.trim()) {
        appendFormattedCell(summary, compRaw);
      }

      const actions = document.createElement("div");
      actions.className = "tool-card__actions";
      const g = safeUrl(row[COL.linkGuidance]);
      if (g) {
        const a = document.createElement("a");
        a.className = "btn btn--primary";
        a.href = g;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "Guidance";
        actions.appendChild(a);
      }
      const sp = safeUrl(row[COL.linkSpecs]);
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
        appendFormattedCell(ddEl, ddText);
        dl.appendChild(dtEl);
        dl.appendChild(ddEl);
      };

      addRow("Features", row[COL.features]);
      addRow("Components", row[COL.components]);
      addRow("Codified checks (qualified engineer)", row[COL.codifiedCert]);
      addRow("ISO 9001", row[COL.iso9001]);
      addRow("Structural check level", row[COL.checkLevel]);
      addRow("Eurocodes", row[COL.eurocodes]);
      addRow("UK National Annex", row[COL.ukNa]);
      addRow("Other national annexes", row[COL.otherNa]);
      addRow("British Standards", row[COL.britishStd]);
      addRow("Other codes", row[COL.otherCodes]);
      addRow("Operating system", row[COL.os]);
      addRow("Processors", row[COL.processors]);
      addRow("Memory (RAM)", row[COL.ram]);
      addRow("Storage", row[COL.storage]);
      addRow("Internet access", row[COL.internet]);
      addRow("Python", row[COL.python]);
      addRow("C#", row[COL.csharp]);
      addRow("Grasshopper", row[COL.grasshopper]);
      addRow("Other interfaces", row[COL.otherApi]);
      addRow("Secondary software", row[COL.secondary]);

      details.appendChild(dl);

      card.appendChild(head);
      card.appendChild(badges);
      if (tags.childElementCount) card.appendChild(tags);
      card.appendChild(summary);
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

  function fillFeatureSelect(selectEl) {
    selectEl.textContent = "";
    featureOptionList.forEach((o) => {
      const op = document.createElement("option");
      op.value = o.value;
      op.textContent = o.label;
      selectEl.appendChild(op);
    });
  }

  async function loadFeatureOptionList() {
    const url = `software/feature-filter-options.json?v=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load feature filter list");
    featureOptionList = await res.json();
    document.querySelectorAll(".feature-select").forEach(fillFeatureSelect);
  }

  function addFeatureSelect() {
    const wrap = document.getElementById("featureSearch");
    if (!wrap) return;
    const first = wrap.querySelector(".feature-select");
    if (!first) return;
    const clone = document.createElement("select");
    clone.className = "feature-select";
    clone.setAttribute("aria-label", "Feature filter");
    fillFeatureSelect(clone);
    clone.value = "";
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "btn-remove-feature";
    rm.setAttribute("aria-label", "Remove feature filter");
    rm.textContent = "×";
    rm.addEventListener("click", () => {
      clone.parentElement.remove();
      applyFilters();
    });
    const row = document.createElement("div");
    row.className = "feature-row";
    row.appendChild(clone);
    row.appendChild(rm);
    const addBtn = document.getElementById("addFeatureFilter");
    if (addBtn) wrap.insertBefore(row, addBtn);
    else wrap.appendChild(row);
    clone.addEventListener("change", applyFilters);
  }

  async function loadCsv() {
    const url = `${CSV_PATH}?v=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load ${CSV_PATH}: ${res.status}`);
    const text = await res.text();
    const parsed = parseCSV(text);
    allRows = rowsToObjects(parsed);
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

    const addFeat = document.getElementById("addFeatureFilter");
    if (addFeat) addFeat.addEventListener("click", addFeatureSelect);

    const reset = document.getElementById("resetFilters");
    if (reset) {
      reset.addEventListener("click", (e) => {
        e.preventDefault();
        form.reset();
        document.querySelectorAll("#featureSearch .feature-row").forEach((row, i) => {
          if (i > 0) row.remove();
        });
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
      await loadCsv();
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


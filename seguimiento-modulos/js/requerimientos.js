/* ==================================================== requerimientos.js */
(function () {
  "use strict";
  const D = window.APP_DATA;
  const PAGE_SIZE = 15;

  const TABS = [
    {
      id: "autoatencion",
      label: "AutoAtención",
      data: D.req_autoatencion,
      statusKey: "Estado",
      filter1: { key: "Tema", label: "Tema" },
      filter2: { key: "Responsable", label: "Responsable" },
      searchFields: ["Descripcion segun Bases de Licitación", "Id Requerimiento", "Tema"],
      columns: [
        { key: "Id Requerimiento", label: "ID", cls: "nowrap strong" },
        { key: "Tema", label: "Tema", cls: "nowrap" },
        { key: "Fase", label: "Fase", cls: "nowrap" },
        { key: "Descripcion segun Bases de Licitación", label: "Descripción" },
        { key: "Estado", label: "Estado", badge: true },
        { key: "Responsable", label: "Responsable", cls: "nowrap" },
      ],
    },
    {
      id: "rad",
      label: "RAD",
      data: D.req_rad,
      statusKey: "Estado QA",
      filter1: { key: "Módulo", label: "Módulo" },
      filter2: { key: "Responsable", label: "Responsable" },
      searchFields: ["Descripcion segun Doc. B", "Id Requerimiento", "Acción"],
      columns: [
        { key: "Id Requerimiento", label: "ID", cls: "nowrap strong" },
        { key: "Módulo", label: "Módulo", cls: "nowrap" },
        { key: "Acción", label: "Acción", cls: "nowrap" },
        { key: "Descripcion segun Doc. B", label: "Descripción" },
        { key: "Estado QA", label: "Estado", badge: true },
        { key: "Responsable", label: "Responsable", cls: "nowrap" },
      ],
    },
    {
      id: "lm",
      label: "Licencias Médicas",
      data: D.req_lm,
      statusKey: "Estado QA",
      filter1: { key: "Forma de Entrega", label: "Origen" },
      filter2: null,
      searchFields: ["Requerimiento", "Id Requerimiento"],
      columns: [
        { key: "Id Requerimiento", label: "ID", cls: "nowrap strong" },
        { key: "Requerimiento", label: "Requerimiento" },
        { key: "Forma de Entrega", label: "Origen", cls: "nowrap" },
        { key: "Estado QA", label: "Estado", badge: true },
      ],
    },
    {
      id: "calificaciones",
      label: "Calificaciones",
      data: D.req_calificaciones,
      statusKey: "Estado QA",
      filter1: { key: "Tema", label: "Tema" },
      filter2: null,
      searchFields: ["Requerimiento", "Id Requerimiento", "Tema"],
      columns: [
        { key: "Id Requerimiento", label: "ID", cls: "nowrap strong" },
        { key: "Tema", label: "Tema", cls: "nowrap" },
        { key: "Requerimiento", label: "Requerimiento" },
        { key: "Forma de Entrega", label: "Origen", cls: "nowrap" },
        { key: "Estado QA", label: "Estado", badge: true },
      ],
    },
    {
      id: "otros",
      label: "Otros módulos",
      data: [],
      empty: true,
      note: "FORCAP, Portal SIRH y VALS",
    },
  ];

  let activeTabId = TABS[0].id;
  let state = { search: "", f1: "", f2: "", page: 1 };

  // ------------------------------------------------------------- summary
  const totalReq = D.req_autoatencion.length + D.req_rad.length + D.req_lm.length + D.req_calificaciones.length
    + D.req_forcap.length + D.req_portal.length + D.req_vals.length;
  const aaListo = D.req_autoatencion.filter((r) => r["Estado"] === "Listo").length;
  const radListo = D.req_rad.filter((r) => r["Estado QA"] === "Listo").length;
  document.getElementById("reqSummary").innerHTML = `
    <div class="stat-tile stat-tile--accent-1">
      <span class="stat-tile__icon">📊</span>
      <span class="stat-tile__label">Total requerimientos registrados</span>
      <span class="stat-tile__value">${totalReq}</span>
      <span class="stat-tile__foot">Los 7 módulos del proyecto</span>
    </div>
    <div class="stat-tile stat-tile--accent-good">
      <span class="stat-tile__icon">✅</span>
      <span class="stat-tile__label">AutoAtención — Listos</span>
      <span class="stat-tile__value">${aaListo}/${D.req_autoatencion.length}</span>
      <span class="stat-tile__foot">${UI.pct(aaListo / D.req_autoatencion.length, 0)} completado</span>
    </div>
    <div class="stat-tile stat-tile--accent-good">
      <span class="stat-tile__icon">✅</span>
      <span class="stat-tile__label">RAD — Listos</span>
      <span class="stat-tile__value">${radListo}/${D.req_rad.length}</span>
      <span class="stat-tile__foot">${UI.pct(radListo / D.req_rad.length, 0)} completado</span>
    </div>
    <div class="stat-tile">
      <span class="stat-tile__icon">📄</span>
      <span class="stat-tile__label">LM + Calificaciones</span>
      <span class="stat-tile__value">${D.req_lm.length + D.req_calificaciones.length}</span>
      <span class="stat-tile__foot">Requerimientos base — estado QA pendiente de carga</span>
    </div>`;

  // ---------------------------------------------------------------- tabs
  const tabsEl = document.getElementById("reqTabs");
  tabsEl.innerHTML = TABS.map(
    (t) => `<button data-tab="${t.id}" class="${t.id === activeTabId ? "active" : ""}">${t.label}<span class="tab-count">${t.data.length}</span></button>`
  ).join("");
  tabsEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTabId = btn.dataset.tab;
      state = { search: "", f1: "", f2: "", page: 1 };
      document.getElementById("rSearch").value = "";
      tabsEl.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.tab === activeTabId));
      setupFilters();
      render();
    });
  });

  function currentTab() {
    return TABS.find((t) => t.id === activeTabId);
  }

  function uniqueSorted(data, key) {
    return [...new Set(data.map((r) => r[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "es"));
  }

  function setupFilters() {
    const tab = currentTab();
    const sel1 = document.getElementById("rFilter1");
    const sel2 = document.getElementById("rFilter2");
    sel1.innerHTML = "";
    sel2.innerHTML = "";
    if (tab.empty) {
      sel1.style.display = "none";
      sel2.style.display = "none";
      document.getElementById("rSearch").style.display = "none";
      return;
    }
    document.getElementById("rSearch").style.display = "";
    if (tab.filter1) {
      sel1.style.display = "";
      sel1.innerHTML = `<option value="">${tab.filter1.label} (todos)</option>` + uniqueSorted(tab.data, tab.filter1.key).map((v) => `<option value="${UI.esc(v)}">${UI.esc(v)}</option>`).join("");
    } else sel1.style.display = "none";
    if (tab.filter2) {
      sel2.style.display = "";
      sel2.innerHTML = `<option value="">${tab.filter2.label} (todos)</option>` + uniqueSorted(tab.data, tab.filter2.key).map((v) => `<option value="${UI.esc(v)}">${UI.esc(v)}</option>`).join("");
    } else sel2.style.display = "none";
  }

  function applyFilters(tab) {
    const s = state.search.trim().toLowerCase();
    return tab.data.filter((r) => {
      if (tab.filter1 && state.f1 && r[tab.filter1.key] !== state.f1) return false;
      if (tab.filter2 && state.f2 && r[tab.filter2.key] !== state.f2) return false;
      if (s) {
        const hay = tab.searchFields.map((k) => r[k]).filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }

  function render() {
    const tab = currentTab();
    document.getElementById("rEmptyNotice").style.display = tab.empty ? "" : "none";
    document.getElementById("rTableWrap").style.display = tab.empty ? "none" : "";
    document.getElementById("rPagination").style.display = tab.empty ? "none" : "";
    document.getElementById("rCount").textContent = tab.empty ? `${tab.note}` : "";

    if (tab.empty) return;

    const filtered = applyFilters(tab);
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = filtered.slice(start, start + PAGE_SIZE);

    document.getElementById("rCount").textContent = `${total} de ${tab.data.length} requerimientos`;

    document.getElementById("rThead").innerHTML = `<tr>${tab.columns.map((c) => `<th>${c.label}</th>`).join("")}</tr>`;
    const tbody = document.getElementById("rBody");
    if (!pageRows.length) {
      tbody.innerHTML = `<tr><td colspan="${tab.columns.length}"><div class="empty-state">Sin resultados para los filtros aplicados.</div></td></tr>`;
    } else {
      tbody.innerHTML = pageRows
        .map(
          (r) =>
            `<tr>${tab.columns
              .map((c) => {
                const v = r[c.key];
                if (c.badge) return `<td>${UI.statusBadge(v)}</td>`;
                return `<td class="${c.cls || ""}">${v ? UI.esc(v) : '<span class="cell-muted">—</span>'}</td>`;
              })
              .join("")}</tr>`
        )
        .join("");
    }

    const pag = document.getElementById("rPagination");
    let html = `<button ${state.page === 1 ? "disabled" : ""} data-page="${state.page - 1}">‹ Anterior</button>`;
    for (let p = 1; p <= pages; p++) {
      if (pages > 7 && Math.abs(p - state.page) > 2 && p !== 1 && p !== pages) {
        if (p === 2 || p === pages - 1) html += `<span class="p-status">…</span>`;
        continue;
      }
      html += `<button class="${p === state.page ? "active" : ""}" data-page="${p}">${p}</button>`;
    }
    html += `<button ${state.page === pages ? "disabled" : ""} data-page="${state.page + 1}">Siguiente ›</button>`;
    pag.innerHTML = html;
    pag.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.page = Number(btn.dataset.page);
        render();
      });
    });
  }

  document.getElementById("rSearch").addEventListener(
    "input",
    UI.debounce((e) => {
      state.search = e.target.value;
      state.page = 1;
      render();
    }, 180)
  );
  document.getElementById("rFilter1").addEventListener("change", (e) => {
    state.f1 = e.target.value;
    state.page = 1;
    render();
  });
  document.getElementById("rFilter2").addEventListener("change", (e) => {
    state.f2 = e.target.value;
    state.page = 1;
    render();
  });
  document.getElementById("rReset").addEventListener("click", () => {
    state = { search: "", f1: "", f2: "", page: 1 };
    document.getElementById("rSearch").value = "";
    document.getElementById("rFilter1").value = "";
    document.getElementById("rFilter2").value = "";
    render();
  });

  setupFilters();
  render();
})();

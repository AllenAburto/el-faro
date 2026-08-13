/* ==================================================== requerimientos.js */
(function () {
  "use strict";
  const D = window.APP_DATA;
  const PAGE_SIZE = 15;
  const REQ_STATUS_OPTIONS = ["Listo", "Maqueta", "Pendiente", "Observado"];

  const TABS = [
    {
      id: "autoatencion",
      label: "AutoAtención",
      baseData: D.req_autoatencion,
      storeKey: "req_autoatencion",
      idKey: "Id Requerimiento",
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
      editable: true,
      hasResponsable: true,
    },
    {
      id: "rad",
      label: "RAD",
      baseData: D.req_rad,
      storeKey: "req_rad",
      idKey: "Id Requerimiento",
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
      editable: true,
      hasResponsable: true,
    },
    {
      id: "lm",
      label: "Licencias Médicas",
      baseData: D.req_lm,
      storeKey: "req_lm",
      idKey: "Id Requerimiento",
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
      editable: true,
      hasResponsable: false,
    },
    {
      id: "calificaciones",
      label: "Calificaciones",
      baseData: D.req_calificaciones,
      storeKey: "req_calificaciones",
      idKey: "Id Requerimiento",
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
      editable: true,
      hasResponsable: false,
    },
    {
      id: "otros",
      label: "Otros módulos",
      baseData: [],
      data: [],
      empty: true,
      note: "FORCAP, Portal SIRH y VALS",
    },
  ];

  // pre-filtro desde la búsqueda global (?tab=&q=)
  const urlParams = new URLSearchParams(location.search);
  const urlTab = urlParams.get("tab");

  let activeTabId = TABS.some((t) => t.id === urlTab) ? urlTab : TABS[0].id;
  let state = { search: urlParams.get("q") || "", f1: "", f2: "", festado: "", page: 1 };

  function liveRows(tab) {
    if (!tab.editable) return tab.baseData;
    return Store.list(tab.storeKey, tab.baseData, tab.idKey);
  }

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
  function renderTabButtons() {
    tabsEl.innerHTML = TABS.map(
      (t) => `<button data-tab="${t.id}" class="${t.id === activeTabId ? "active" : ""}">${t.label}<span class="tab-count">${liveRows(t).length}</span></button>`
    ).join("");
    tabsEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTabId = btn.dataset.tab;
        state = { search: "", f1: "", f2: "", festado: "", page: 1 };
        document.getElementById("rSearch").value = "";
        renderTabButtons();
        setupFilters();
        render();
      });
    });
  }

  function currentTab() {
    return TABS.find((t) => t.id === activeTabId);
  }

  function uniqueSorted(data, key) {
    return [...new Set(data.map((r) => r[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "es"));
  }

  function setupFilters() {
    const tab = currentTab();
    const rows = liveRows(tab);
    const sel1 = document.getElementById("rFilter1");
    const sel2 = document.getElementById("rFilter2");
    const selEstado = document.getElementById("rFilterEstado");
    sel1.innerHTML = "";
    sel2.innerHTML = "";
    selEstado.innerHTML = "";
    document.getElementById("rNewBtn").style.display = tab.editable ? "" : "none";
    if (tab.empty) {
      sel1.style.display = "none";
      sel2.style.display = "none";
      selEstado.style.display = "none";
      document.getElementById("rSearch").style.display = "none";
      return;
    }
    document.getElementById("rSearch").style.display = "";
    if (tab.filter1) {
      sel1.style.display = "";
      sel1.innerHTML = `<option value="">${tab.filter1.label} (todos)</option>` + uniqueSorted(rows, tab.filter1.key).map((v) => `<option value="${UI.esc(v)}">${UI.esc(v)}</option>`).join("");
    } else sel1.style.display = "none";
    if (tab.filter2) {
      sel2.style.display = "";
      sel2.innerHTML = `<option value="">${tab.filter2.label} (todos)</option>` + uniqueSorted(rows, tab.filter2.key).map((v) => `<option value="${UI.esc(v)}">${UI.esc(v)}</option>`).join("");
    } else sel2.style.display = "none";
    selEstado.style.display = "";
    selEstado.innerHTML = `<option value="">Estado (todos)</option>` + REQ_STATUS_OPTIONS.map((v) => `<option value="${UI.esc(v)}">${UI.esc(v)}</option>`).join("");
  }

  function applyFilters(tab, rows) {
    const s = state.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab.filter1 && state.f1 && r[tab.filter1.key] !== state.f1) return false;
      if (tab.filter2 && state.f2 && r[tab.filter2.key] !== state.f2) return false;
      if (state.festado && r[tab.statusKey] !== state.festado) return false;
      if (s) {
        const hay = tab.searchFields.map((k) => r[k]).filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }

  const LONG_FIELDS = ["Descripcion segun Bases de Licitación", "Descripcion segun Doc. B", "Requerimiento"];

  function fieldsForColumns(tab, includeId) {
    return tab.columns
      .filter((c) => includeId || c.key !== tab.idKey)
      .map((c) => {
        if (c.badge) return { key: c.key, label: "Estado", type: "select", options: REQ_STATUS_OPTIONS, required: true };
        if (c.key === tab.idKey) return { key: c.key, label: "ID requerimiento", type: "text", required: true };
        if (LONG_FIELDS.includes(c.key)) return { key: c.key, label: c.label, type: "textarea", full: true };
        return { key: c.key, label: c.label, type: "text" };
      });
  }

  function openEditModal(tab, row) {
    UI.openModal({
      title: `Editar requerimiento ${row[tab.idKey] || ""}`,
      fields: fieldsForColumns(tab, false),
      initial: row,
      submitLabel: "Guardar cambios",
      onDelete: () => {
        if (UI.confirmDelete(`¿Eliminar el requerimiento ${row[tab.idKey] || ""}? Solo afecta a este navegador.`)) {
          Store.remove(tab.storeKey, row[tab.idKey], tab.idKey);
          renderTabButtons();
          render();
        }
      },
      onSubmit: (values) => {
        Store.update(tab.storeKey, row[tab.idKey], values, tab.idKey);
        renderTabButtons();
        render();
      },
    });
  }

  function openNewModal(tab) {
    UI.openModal({
      title: `Nuevo requerimiento — ${tab.label}`,
      fields: fieldsForColumns(tab, true),
      initial: { [tab.statusKey]: "Pendiente" },
      submitLabel: "Registrar",
      onSubmit: (values) => {
        if (!values[tab.idKey]) {
          window.alert("El ID del requerimiento es obligatorio.");
          return;
        }
        Store.create(tab.storeKey, values, tab.idKey);
        renderTabButtons();
        render();
      },
    });
  }

  function render() {
    const tab = currentTab();
    document.getElementById("rEmptyNotice").style.display = tab.empty ? "" : "none";
    document.getElementById("rTableWrap").style.display = tab.empty ? "none" : "";
    document.getElementById("rPagination").style.display = tab.empty ? "none" : "";
    document.getElementById("rCount").textContent = tab.empty ? `${tab.note}` : "";
    document.getElementById("rDirtyPill").innerHTML = tab.editable ? UI.dirtyPillHtml(Store.counts(tab.storeKey)) : "";
    document.getElementById("rExportBtn").style.display = tab.editable ? "" : "none";
    document.getElementById("rResetBtn").style.display = tab.editable ? "" : "none";

    if (tab.empty) return;

    const rows = liveRows(tab);
    const filtered = applyFilters(tab, rows);
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = filtered.slice(start, start + PAGE_SIZE);

    document.getElementById("rCount").textContent = `${total} de ${rows.length} requerimientos`;

    document.getElementById("rThead").innerHTML =
      `<tr>${tab.columns.map((c) => `<th>${c.label}</th>`).join("")}${tab.editable ? "<th></th>" : ""}</tr>`;
    const tbody = document.getElementById("rBody");
    if (!pageRows.length) {
      tbody.innerHTML = `<tr><td colspan="${tab.columns.length + 1}"><div class="empty-state">Sin resultados para los filtros aplicados.</div></td></tr>`;
    } else {
      tbody.innerHTML = pageRows
        .map((r) => {
          const cells = tab.columns
            .map((c) => {
              const v = r[c.key];
              if (c.badge) {
                const localTag = r._local ? '<span class="badge-local">local</span>' : r._edited ? '<span class="badge-local">editado</span>' : "";
                return `<td>${UI.statusBadge(v)}${localTag}</td>`;
              }
              return `<td class="${c.cls || ""}">${v ? UI.esc(v) : '<span class="cell-muted">—</span>'}</td>`;
            })
            .join("");
          const actions = tab.editable
            ? `<td class="row-actions"><button class="btn-icon" title="Editar" data-edit="${UI.esc(r[tab.idKey])}">✎</button></td>`
            : "";
          return `<tr>${cells}${actions}</tr>`;
        })
        .join("");
      if (tab.editable) {
        tbody.querySelectorAll("[data-edit]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const row = rows.find((r) => String(r[tab.idKey]) === btn.dataset.edit);
            if (row) openEditModal(tab, row);
          });
        });
      }
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
  document.getElementById("rFilterEstado").addEventListener("change", (e) => {
    state.festado = e.target.value;
    state.page = 1;
    render();
  });
  document.getElementById("rReset").addEventListener("click", () => {
    state = { search: "", f1: "", f2: "", festado: "", page: 1 };
    document.getElementById("rSearch").value = "";
    document.getElementById("rFilter1").value = "";
    document.getElementById("rFilter2").value = "";
    document.getElementById("rFilterEstado").value = "";
    render();
  });
  document.getElementById("rNewBtn").addEventListener("click", () => {
    const tab = currentTab();
    if (tab.editable) openNewModal(tab);
  });
  document.getElementById("rExportBtn").addEventListener("click", () => {
    const tab = currentTab();
    if (!tab.editable) return;
    Store.exportChanges(tab.storeKey, `requerimientos_${tab.id}_cambios.json`);
  });
  document.getElementById("rResetBtn").addEventListener("click", () => {
    const tab = currentTab();
    if (!tab.editable || !Store.isDirty(tab.storeKey)) return;
    if (window.confirm(`¿Restablecer los cambios locales de "${tab.label}"? Se perderán las ediciones hechas en este navegador.`)) {
      Store.resetAll(tab.storeKey);
      renderTabButtons();
      render();
    }
  });

  renderTabButtons();
  setupFilters();
  render();
  if (state.search) document.getElementById("rSearch").value = state.search;
})();

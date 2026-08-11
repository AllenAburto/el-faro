/* ============================================================ bitacora.js */
(function () {
  "use strict";
  const D = window.APP_DATA;
  const STORE_KEY = "bitacora";
  const PAGE_SIZE = 15;
  const MODULOS = ["Autoatención", "RAD", "VALS", "Portal SIRH", "FORCAP"];
  const ESTADOS = ["Abierto", "Cerrado", "Archivado"];
  const IMPACTOS = ["Alto", "Medio", "Bajo"];

  let state = { search: "", modulo: "", origen: "", impacto: "", page: 1 };

  function liveData() {
    return Store.list(STORE_KEY, D.bitacora, "id");
  }

  function matchesModulo(row, modulo) {
    return (row.modulo || "").toLowerCase().includes(modulo.toLowerCase());
  }

  // -------------------------------------------------------------- summary
  function renderSummary(rows) {
    const total = rows.length;
    const abiertos = rows.filter((r) => r.estado === "Abierto").length;
    const cerrados = rows.filter((r) => r.estado === "Cerrado").length;
    const archivados = rows.filter((r) => r.estado === "Archivado").length;
    const pctAvance = total ? cerrados / total : 0;
    document.getElementById("bitSummary").innerHTML = `
      <div class="stat-tile stat-tile--accent-1">
        <span class="stat-tile__icon">📋</span>
        <span class="stat-tile__label">Total compromisos</span>
        <span class="stat-tile__value">${UI.num(total)}</span>
        <span class="stat-tile__foot">${UI.pct(pctAvance, 1)} cerrados</span>
      </div>
      <div class="stat-tile stat-tile--accent-warn">
        <span class="stat-tile__icon">🔄</span>
        <span class="stat-tile__label">Abiertos</span>
        <span class="stat-tile__value">${UI.num(abiertos)}</span>
      </div>
      <div class="stat-tile stat-tile--accent-good">
        <span class="stat-tile__icon">✅</span>
        <span class="stat-tile__label">Cerrados</span>
        <span class="stat-tile__value">${UI.num(cerrados)}</span>
      </div>
      <div class="stat-tile">
        <span class="stat-tile__icon">📦</span>
        <span class="stat-tile__label">Archivados</span>
        <span class="stat-tile__value">${UI.num(archivados)}</span>
      </div>`;

    const modRows = MODULOS.map((m) => {
      const rs = rows.filter((r) => matchesModulo(r, m));
      return {
        label: m,
        total: rs.length,
        segments: [
          { name: "Abiertos", value: rs.filter((r) => r.estado === "Abierto").length, color: "var(--status-warning)" },
          { name: "Cerrados", value: rs.filter((r) => r.estado === "Cerrado").length, color: "var(--status-good)" },
          { name: "Archivados", value: rs.filter((r) => r.estado === "Archivado").length, color: "var(--text-muted)" },
        ],
      };
    }).filter((r) => r.total > 0);
    Charts.stackedBars(document.getElementById("chartCompModulo"), modRows, [
      { name: "Abiertos", color: "var(--status-warning)" },
      { name: "Cerrados", color: "var(--status-good)" },
      { name: "Archivados", color: "var(--text-muted)" },
    ]);
  }

  // --------------------------------------------------------------- filters
  function uniqueSorted(rows, key) {
    return [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "es"));
  }

  function setupFilters(rows) {
    const selModulo = document.getElementById("bModulo");
    selModulo.innerHTML = `<option value="">Módulo (todos)</option>` + MODULOS.map((m) => `<option value="${UI.esc(m)}">${UI.esc(m)}</option>`).join("");
    const selOrigen = document.getElementById("bOrigen");
    selOrigen.innerHTML = `<option value="">Origen (todos)</option>` + uniqueSorted(rows, "origen").map((v) => `<option value="${UI.esc(v)}">${UI.esc(v)}</option>`).join("");
    const selImpacto = document.getElementById("bImpacto");
    selImpacto.innerHTML = `<option value="">Impacto (todos)</option>` + IMPACTOS.map((v) => `<option value="${UI.esc(v)}">${UI.esc(v)}</option>`).join("");
  }

  function applyFilters(rows) {
    const s = state.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (state.modulo && !matchesModulo(r, state.modulo)) return false;
      if (state.origen && r.origen !== state.origen) return false;
      if (state.impacto && r.impacto !== state.impacto) return false;
      if (s) {
        const hay = [r.descripcion, r.accion, r.responsable, r.observaciones, r.componente]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }

  // ----------------------------------------------------------------- form
  function fieldsFor() {
    return [
      { key: "fecha_registro", label: "Fecha de registro", type: "date" },
      { key: "modulo", label: "Módulo", type: "select", options: MODULOS, placeholder: "Selecciona…" },
      { key: "componente", label: "Componente / Subetapa", type: "text" },
      { key: "origen", label: "Origen del registro", type: "text" },
      { key: "impacto", label: "Impacto", type: "select", options: IMPACTOS, placeholder: "Selecciona…" },
      { key: "responsable", label: "Responsable", type: "text" },
      { key: "descripcion", label: "Descripción", type: "textarea", full: true },
      { key: "accion", label: "Acción o compromiso", type: "textarea", full: true },
      { key: "fecha_comprometida", label: "Fecha comprometida", type: "date" },
      { key: "estado", label: "Estado", type: "select", options: ESTADOS, placeholder: "Selecciona…" },
      { key: "observaciones", label: "Observaciones", type: "textarea", full: true },
    ];
  }

  function openNewModal() {
    UI.openModal({
      title: "Nuevo registro de compromiso",
      fields: fieldsFor(),
      initial: { estado: "Abierto" },
      submitLabel: "Registrar",
      onSubmit: (values) => {
        Store.create(STORE_KEY, values, "id");
        render();
      },
    });
  }

  function openEditModal(row) {
    UI.openModal({
      title: `Editar registro N° ${row.n ?? ""}`,
      fields: fieldsFor(),
      initial: row,
      submitLabel: "Guardar cambios",
      onDelete: () => {
        if (UI.confirmDelete(`¿Eliminar el registro N° ${row.n ?? ""}? Solo afecta a este navegador.`)) {
          Store.remove(STORE_KEY, row.id, "id");
          render();
        }
      },
      onSubmit: (values) => {
        Store.update(STORE_KEY, row.id, values, "id");
        render();
      },
    });
  }

  // ---------------------------------------------------------------- render
  function render() {
    const all = liveData();
    renderSummary(all);
    setupFilters(all);

    const filtered = applyFilters(all).sort((a, b) => {
      const da = a.fecha_registro || "";
      const db = b.fecha_registro || "";
      return db.localeCompare(da);
    });
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = filtered.slice(start, start + PAGE_SIZE);

    document.getElementById("bCount").textContent = `${total} de ${all.length} registros`;

    const dirty = Store.counts(STORE_KEY);
    document.getElementById("bitDirtyPill").innerHTML = UI.dirtyPillHtml(dirty);

    const tbody = document.getElementById("bitBody");
    if (!pageRows.length) {
      tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">Sin resultados para los filtros aplicados.</div></td></tr>`;
    } else {
      tbody.innerHTML = pageRows
        .map((r) => {
          const descAccion = [r.descripcion, r.accion ? `<em>${UI.esc(r.accion)}</em>` : ""].filter(Boolean).join("<br>");
          return `<tr>
            <td class="col-num cell-muted">${r.n ?? ""}${r._local ? '<span class="badge-local">local</span>' : r._edited ? '<span class="badge-local">editado</span>' : ""}</td>
            <td class="nowrap cell-muted">${UI.dateEs(r.fecha_registro)}</td>
            <td class="nowrap strong">${UI.esc(r.modulo)}</td>
            <td style="max-width:300px">${UI.esc(r.descripcion || "")}${r.accion ? `<div class="text-muted" style="margin-top:3px;font-size:12px">↳ ${UI.esc(r.accion)}</div>` : ""}</td>
            <td class="nowrap">${UI.esc(r.responsable || "")}</td>
            <td>${r.impacto ? UI.statusBadge(r.impacto) : '<span class="cell-muted">—</span>'}</td>
            <td class="nowrap cell-muted">${UI.dateEs(r.fecha_comprometida)}</td>
            <td>${UI.statusBadge(r.estado)}</td>
            <td class="row-actions">
              <button class="btn-icon" title="Editar" data-edit="${UI.esc(r.id)}">✎</button>
              <button class="btn-icon btn-icon--danger" title="Eliminar" data-del="${UI.esc(r.id)}">🗑️</button>
            </td>
          </tr>`;
        })
        .join("");
      tbody.querySelectorAll("[data-edit]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = all.find((r) => String(r.id) === btn.dataset.edit);
          if (row) openEditModal(row);
        });
      });
      tbody.querySelectorAll("[data-del]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = all.find((r) => String(r.id) === btn.dataset.del);
          if (row && UI.confirmDelete(`¿Eliminar el registro N° ${row.n ?? ""}? Solo afecta a este navegador.`)) {
            Store.remove(STORE_KEY, row.id, "id");
            render();
          }
        });
      });
    }

    const pag = document.getElementById("bitPagination");
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

  document.getElementById("bSearch").addEventListener("input", UI.debounce((e) => {
    state.search = e.target.value;
    state.page = 1;
    render();
  }, 180));
  ["bModulo", "bOrigen", "bImpacto"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (e) => {
      const map = { bModulo: "modulo", bOrigen: "origen", bImpacto: "impacto" };
      state[map[id]] = e.target.value;
      state.page = 1;
      render();
    });
  });
  document.getElementById("bReset").addEventListener("click", () => {
    state = { search: "", modulo: "", origen: "", impacto: "", page: 1 };
    document.getElementById("bSearch").value = "";
    render();
  });
  document.getElementById("bitNewBtn").addEventListener("click", openNewModal);
  document.getElementById("bitExportBtn").addEventListener("click", () => {
    Store.exportChanges(STORE_KEY, "bitacora_cambios.json");
  });
  document.getElementById("bitResetBtn").addEventListener("click", () => {
    if (!Store.isDirty(STORE_KEY)) return;
    if (window.confirm("¿Restablecer todos los cambios locales de la Bitácora? Se perderán las altas, ediciones y bajas hechas en este navegador.")) {
      Store.resetAll(STORE_KEY);
      render();
    }
  });

  render();
})();

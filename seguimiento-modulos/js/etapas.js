/* =========================================================== etapas.js */
(function () {
  "use strict";
  const baseRows = window.APP_DATA.etapas;
  const STORE_KEY = "etapas";
  const ID_KEY = "id";
  const PAGE_SIZE = 25;

  // Reglas de negocio de Estado — misma lógica que la fórmula del Excel
  // (hoja Etapas!Q), portada a JS para poder recalcular al editar fechas.
  // Fechas comparables como strings "YYYY-MM-DD" (orden lexicográfico = orden cronológico).
  function computeEstado(row) {
    const M = row["Fecha Inicio Programada"] || "";
    const N = row["Fecha Inicio Real"] || "";
    const O = row["Fecha Fin Máxima"] || "";
    const P = row["Fecha Fin Real"] || "";
    const T = new Date().toISOString().slice(0, 10); // hoy

    if (!M && !N && !O && !P) return "COMPLETAR";

    if (P) {
      if (!O) return "Finalizado";
      if (P < O) return "Finalizado anticipado";
      if (P === O) return "Finalizado";
      return "Finalizado con desfase";
    }

    if (N) {
      if (!O) return "No planificado";
      if (O <= T) return "Atrasado";
      if (!M) return "En curso";
      if (N > M) return "Inicio retrasado";
      if (N < M) return "Inicio anticipado";
      return "En curso";
    }

    if (!M) return "COMPLETAR";
    if (T >= M) return "No iniciado";
    return "Programado";
  }

  function liveRows() {
    return Store.list(STORE_KEY, baseRows, ID_KEY);
  }

  // pre-filtro desde la búsqueda global (?q=&modulo=)
  const urlParams = new URLSearchParams(location.search);

  let state = {
    search: urlParams.get("q") || "",
    modulo: urlParams.get("modulo") || "",
    fase: "",
    etapa: "",
    estado: "",
    responsable: "",
    sortKey: "N°",
    sortDir: 1,
    page: 1,
  };

  function uniqueSorted(rows, key) {
    return [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), "es")
    );
  }

  function fillSelect(id, values) {
    const sel = document.getElementById(id);
    const placeholder = sel.querySelector("option");
    sel.innerHTML = "";
    if (placeholder) sel.appendChild(placeholder);
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });
  }

  function setupFilters(rows) {
    fillSelect("fModulo", uniqueSorted(rows, "Módulo"));
    fillSelect("fFase", uniqueSorted(rows, "Fase"));
    fillSelect("fEtapa", uniqueSorted(rows, "Etapa"));
    fillSelect("fEstado", uniqueSorted(rows, "Estado"));
    fillSelect("fResponsable", uniqueSorted(rows, "Responsable"));
  }

  function applyFilters(rows) {
    const s = state.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (state.modulo && r["Módulo"] !== state.modulo) return false;
      if (state.fase && r["Fase"] !== state.fase) return false;
      if (state.etapa && r["Etapa"] !== state.etapa) return false;
      if (state.estado && r["Estado"] !== state.estado) return false;
      if (state.responsable && r["Responsable"] !== state.responsable) return false;
      if (s) {
        // "Anterior" (P3-02, investigado — ver README.md § 8) NO es una
        // dependencia por actividad: toma el mismo valor para todas las
        // filas de una misma Etapa. Es el nombre legado de la etapa
        // completa, no de "la tarea anterior a esta" — se incluye aquí
        // solo para que el buscador también encuentre filas por ese
        // nombre viejo, nunca para construir un grafo de dependencias.
        const hay = [
          r["Actividades/Tarea"], r["Componente/Subetapa"], r["Productos/Entregables"],
          r["Anterior"], r["Objetivo"], r["Criterios de Cumplimiento"], r["Módulo"],
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }

  function sortRows(list) {
    const key = state.sortKey;
    const dir = state.sortDir;
    return list.slice().sort((a, b) => {
      let av = a[key], bv = b[key];
      if (av === undefined || av === null) av = "";
      if (bv === undefined || bv === null) bv = "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "es", { numeric: true }) * dir;
    });
  }

  const RESPONSABLES = ["MINSAL", "PROVEEDOR"];
  const MODULOS_LIST = uniqueSorted(baseRows, "Módulo");
  const FASES_LIST = uniqueSorted(baseRows, "Fase");
  const ETAPAS_LIST = uniqueSorted(baseRows, "Etapa");

  const EDIT_FIELDS = [
    { key: "Fecha Inicio Programada", label: "Inicio programado", type: "date" },
    { key: "Fecha Inicio Real", label: "Inicio real", type: "date" },
    { key: "Fecha Fin Máxima", label: "Fin máximo", type: "date" },
    { key: "Fecha Fin Real", label: "Fin real", type: "date" },
    { key: "Responsable", label: "Responsable", type: "select", options: RESPONSABLES, placeholder: "Selecciona…" },
  ];

  const NEW_FIELDS = [
    { key: "Módulo", label: "Módulo", type: "select", options: MODULOS_LIST, placeholder: "Selecciona…", required: true },
    { key: "Fase", label: "Fase", type: "select", options: FASES_LIST, placeholder: "Selecciona…" },
    { key: "Etapa", label: "Etapa", type: "select", options: ETAPAS_LIST, placeholder: "Selecciona…", required: true },
    { key: "Componente/Subetapa", label: "Componente / Subetapa", type: "text" },
    { key: "Actividades/Tarea", label: "Actividad / Tarea", type: "text", full: true, required: true },
    { key: "Responsable", label: "Responsable", type: "select", options: RESPONSABLES, placeholder: "Selecciona…" },
    { key: "Fecha Inicio Programada", label: "Inicio programado", type: "date" },
    { key: "Fecha Inicio Real", label: "Inicio real", type: "date" },
    { key: "Fecha Fin Máxima", label: "Fin máximo", type: "date" },
    { key: "Fecha Fin Real", label: "Fin real", type: "date" },
  ];

  function openEditModal(row) {
    UI.openModal({
      title: `Editar actividad: ${row["Actividades/Tarea"] || row["Componente/Subetapa"] || ""}`,
      fields: EDIT_FIELDS,
      initial: row,
      submitLabel: "Guardar cambios",
      onDelete: () => {
        if (UI.confirmDelete(`¿Eliminar la actividad "${row["Actividades/Tarea"] || ""}"? Solo afecta a este navegador.`)) {
          Store.remove(STORE_KEY, row[ID_KEY], ID_KEY);
          render();
        }
      },
      onSubmit: (values) => {
        const merged = Object.assign({}, row, values);
        merged["Estado"] = computeEstado(merged);
        Store.update(STORE_KEY, row[ID_KEY], Object.assign({}, values, { Estado: merged["Estado"] }), ID_KEY);
        render();
      },
    });
  }

  function openNewModal() {
    UI.openModal({
      title: "Nueva actividad",
      fields: NEW_FIELDS,
      submitLabel: "Registrar",
      onSubmit: (values) => {
        if (!values["Módulo"] || !values["Etapa"] || !values["Actividades/Tarea"]) {
          window.alert("Módulo, Etapa y Actividad/Tarea son obligatorios.");
          return;
        }
        values["Estado"] = computeEstado(values);
        Store.create(STORE_KEY, values, ID_KEY);
        render();
      },
    });
  }

  function render() {
    const allRows = liveRows();
    setupFilters(allRows);
    document.getElementById("etDirtyPill").innerHTML = UI.dirtyPillHtml(Store.counts(STORE_KEY));

    const filtered = sortRows(applyFilters(allRows));
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const startIdx = (state.page - 1) * PAGE_SIZE;
    const pageRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

    document.getElementById("countPill").textContent = `${total} de ${allRows.length} actividades`;

    const tbody = document.getElementById("etapasBody");
    if (!pageRows.length) {
      tbody.innerHTML = `<tr><td colspan="11"><div class="empty-state">Sin resultados para los filtros aplicados.</div></td></tr>`;
    } else {
      tbody.innerHTML = pageRows
        .map(
          (r) => `<tr>
            <td class="col-num cell-muted">${r["N°"] ?? ""}</td>
            <td class="strong nowrap">${UI.esc(r["Módulo"])}</td>
            <td class="nowrap">${UI.esc(r["Fase"])}</td>
            <td class="nowrap">${UI.esc(r["Etapa"])}</td>
            <td>${UI.esc(r["Componente/Subetapa"])}</td>
            <td>${UI.esc(r["Actividades/Tarea"])}</td>
            <td class="nowrap">${UI.esc(r["Responsable"])}</td>
            <td class="nowrap cell-muted">${UI.dateEs(r["Fecha Inicio Programada"])}</td>
            <td class="nowrap cell-muted">${UI.dateEs(r["Fecha Fin Máxima"])}</td>
            <td>${UI.statusBadge(r["Estado"])}${r._local ? '<span class="badge-local">local</span>' : r._edited ? '<span class="badge-local">editado</span>' : ""}</td>
            <td class="row-actions"><button class="btn-icon" title="Editar fechas" data-edit="${UI.esc(r.id)}">✎</button></td>
          </tr>`
        )
        .join("");
      tbody.querySelectorAll("[data-edit]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = allRows.find((r) => String(r.id) === btn.dataset.edit);
          if (row) openEditModal(row);
        });
      });
    }

    // pagination controls
    const pag = document.getElementById("pagination");
    let html = "";
    html += `<button ${state.page === 1 ? "disabled" : ""} data-page="${state.page - 1}">‹ Anterior</button>`;
    const windowSize = 5;
    let startP = Math.max(1, state.page - Math.floor(windowSize / 2));
    let endP = Math.min(pages, startP + windowSize - 1);
    startP = Math.max(1, endP - windowSize + 1);
    for (let p = startP; p <= endP; p++) {
      html += `<button class="${p === state.page ? "active" : ""}" data-page="${p}">${p}</button>`;
    }
    html += `<span class="p-status">de ${pages}</span>`;
    html += `<button ${state.page === pages ? "disabled" : ""} data-page="${state.page + 1}">Siguiente ›</button>`;
    pag.innerHTML = html;
    pag.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.page = Number(btn.dataset.page);
        render();
        document.querySelector(".table-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // sort indicators
    document.querySelectorAll("#etapasTable th[data-key]").forEach((th) => {
      th.classList.remove("sorted-asc", "sorted-desc");
      if (th.dataset.key === state.sortKey) th.classList.add(state.sortDir === 1 ? "sorted-asc" : "sorted-desc");
    });
  }

  document.getElementById("fSearch").addEventListener(
    "input",
    UI.debounce((e) => {
      state.search = e.target.value;
      state.page = 1;
      render();
    }, 180)
  );
  ["fModulo", "fFase", "fEtapa", "fEstado", "fResponsable"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (e) => {
      const map = { fModulo: "modulo", fFase: "fase", fEtapa: "etapa", fEstado: "estado", fResponsable: "responsable" };
      state[map[id]] = e.target.value;
      state.page = 1;
      render();
    });
  });
  document.getElementById("btnReset").addEventListener("click", () => {
    state = { ...state, search: "", modulo: "", fase: "", etapa: "", estado: "", responsable: "", page: 1 };
    document.getElementById("fSearch").value = "";
    ["fModulo", "fFase", "fEtapa", "fEstado", "fResponsable"].forEach((id) => (document.getElementById(id).value = ""));
    render();
  });
  document.getElementById("etNewBtn").addEventListener("click", openNewModal);
  document.getElementById("etExportBtn").addEventListener("click", () => {
    Store.exportChanges(STORE_KEY, "etapas_cambios.json");
  });
  document.getElementById("etResetBtn").addEventListener("click", () => {
    if (!Store.isDirty(STORE_KEY)) return;
    if (window.confirm("¿Restablecer todos los cambios locales de Etapas? Se perderán las ediciones hechas en este navegador.")) {
      Store.resetAll(STORE_KEY);
      render();
    }
  });
  document.querySelectorAll("#etapasTable th[data-key]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (state.sortKey === key) state.sortDir *= -1;
      else {
        state.sortKey = key;
        state.sortDir = 1;
      }
      render();
    });
  });

  render();
  // refleja el pre-filtro en los controles visibles (los <select> recién
  // reciben sus opciones dentro de render()->setupFilters(), por eso se
  // fija el valor después de la primera pasada)
  if (state.search) document.getElementById("fSearch").value = state.search;
  if (state.modulo) document.getElementById("fModulo").value = state.modulo;
})();

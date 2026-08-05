/* =========================================================== etapas.js */
(function () {
  "use strict";
  const rows = window.APP_DATA.etapas;
  const PAGE_SIZE = 25;

  let state = {
    search: "",
    modulo: "",
    fase: "",
    etapa: "",
    estado: "",
    responsable: "",
    sortKey: "N°",
    sortDir: 1,
    page: 1,
  };

  function uniqueSorted(key) {
    return [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), "es")
    );
  }

  function fillSelect(id, values) {
    const sel = document.getElementById(id);
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });
  }
  fillSelect("fModulo", uniqueSorted("Módulo"));
  fillSelect("fFase", uniqueSorted("Fase"));
  fillSelect("fEtapa", uniqueSorted("Etapa"));
  fillSelect("fEstado", uniqueSorted("Estado"));
  fillSelect("fResponsable", uniqueSorted("Responsable"));

  function applyFilters() {
    const s = state.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (state.modulo && r["Módulo"] !== state.modulo) return false;
      if (state.fase && r["Fase"] !== state.fase) return false;
      if (state.etapa && r["Etapa"] !== state.etapa) return false;
      if (state.estado && r["Estado"] !== state.estado) return false;
      if (state.responsable && r["Responsable"] !== state.responsable) return false;
      if (s) {
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

  function render() {
    const filtered = sortRows(applyFilters());
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const startIdx = (state.page - 1) * PAGE_SIZE;
    const pageRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

    document.getElementById("countPill").textContent = `${total} de ${rows.length} actividades`;

    const tbody = document.getElementById("etapasBody");
    if (!pageRows.length) {
      tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state">Sin resultados para los filtros aplicados.</div></td></tr>`;
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
            <td>${UI.statusBadge(r["Estado"])}</td>
          </tr>`
        )
        .join("");
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
})();

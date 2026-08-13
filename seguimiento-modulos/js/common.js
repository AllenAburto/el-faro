/* =========================================================================
   Utilidades compartidas: tema, navegación, formato, badges, tooltip
   ========================================================================= */
(function () {
  "use strict";

  const THEME_KEY = "sm-theme";

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) applyTheme(saved);
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    const setIcon = () => {
      const current = document.documentElement.getAttribute("data-theme");
      const isDark = current
        ? current === "dark"
        : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      btn.textContent = isDark ? "☀️" : "🌙";
      btn.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    };
    setIcon();
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const isDark = current
        ? current === "dark"
        : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const next = isDark ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
      setIcon();
    });
  }

  function initNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".app-nav a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === path) {
        a.classList.add("active");
        // P5-04 (Plan de Trabajo Fase 5): además del estilo visual, marca
        // la página actual para lectores de pantalla y otras tecnologías
        // de asistencia (equivalente accesible del subrayado activo).
        a.setAttribute("aria-current", "page");
      }
    });
  }

  // -------------------------------------------------------------- formato
  function pct(v, digits) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    return (v * 100).toFixed(digits === undefined ? 1 : digits) + "%";
  }
  function num(v) {
    if (v === null || v === undefined || isNaN(v)) return "0";
    return Number(v).toLocaleString("es-CL");
  }
  function dateEs(v) {
    if (!v) return "—";
    const d = new Date(v + "T00:00:00");
    if (isNaN(d.getTime())) return v;
    return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  }
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ------------------------------------------------------------- estados
  const STATUS_MAP = {
    "Finalizado": { cls: "badge-good", css: "var(--status-good)" },
    "Finalizado anticipado": { cls: "badge-teal", css: "var(--series-3)" },
    "Finalizado con desfase": { cls: "badge-serious", css: "var(--status-serious)" },
    "En curso": { cls: "badge-info", css: "var(--series-1)" },
    "Inicio anticipado": { cls: "badge-teal", css: "var(--series-3)" },
    "Inicio retrasado": { cls: "badge-serious", css: "var(--status-serious)" },
    "Programado": { cls: "badge-neutral", css: "var(--text-secondary)" },
    "No iniciado": { cls: "badge-warning", css: "var(--status-warning)" },
    "Atrasado": { cls: "badge-critical", css: "var(--status-critical)" },
    "No planificado": { cls: "badge-serious", css: "var(--status-serious)" },
    "Falta planificación": { cls: "badge-serious", css: "var(--status-serious)" },
    "COMPLETAR": { cls: "badge-critical", css: "var(--status-critical)" },
    "Listo": { cls: "badge-good", css: "var(--status-good)" },
    "Maqueta": { cls: "badge-info", css: "var(--series-1)" },
    "Pendiente": { cls: "badge-warning", css: "var(--status-warning)" },
    "Observado": { cls: "badge-serious", css: "var(--status-serious)" },
    "Si": { cls: "badge-good", css: "var(--status-good)" },
    "No": { cls: "badge-neutral", css: "var(--text-secondary)" },
    "Abierto": { cls: "badge-warning", css: "var(--status-warning)" },
    "Cerrado": { cls: "badge-good", css: "var(--status-good)" },
    "Archivado": { cls: "badge-neutral", css: "var(--text-secondary)" },
    "Alto": { cls: "badge-critical", css: "var(--status-critical)" },
    "Medio": { cls: "badge-warning", css: "var(--status-warning)" },
    "Bajo": { cls: "badge-neutral", css: "var(--text-secondary)" },
  };
  function statusBadge(value) {
    if (!value) return '<span class="badge badge-neutral">Sin dato</span>';
    const info = STATUS_MAP[value] || { cls: "badge-neutral" };
    return `<span class="badge ${info.cls}">${esc(value)}</span>`;
  }
  function statusColor(value) {
    const info = STATUS_MAP[value];
    return info ? info.css : "var(--text-muted)";
  }

  // -------------------------------------------------------------- tooltip
  let tipEl = null;
  function ensureTip() {
    if (!tipEl) {
      tipEl = document.createElement("div");
      tipEl.className = "viz-tooltip";
      document.body.appendChild(tipEl);
    }
    return tipEl;
  }
  function showTip(x, y, html) {
    const t = ensureTip();
    t.innerHTML = html;
    t.style.left = x + "px";
    t.style.top = y + "px";
    t.classList.add("show");
  }
  function hideTip() {
    if (tipEl) tipEl.classList.remove("show");
  }

  // -------------------------------------------------------------- debounce
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // ---------------------------------------------------------------- modal
  let modalRoot = null;
  function ensureModalRoot() {
    if (!modalRoot) {
      modalRoot = document.createElement("div");
      modalRoot.className = "modal-overlay";
      modalRoot.hidden = true;
      modalRoot.innerHTML = '<div class="modal" role="dialog" aria-modal="true"></div>';
      modalRoot.addEventListener("click", (e) => {
        if (e.target === modalRoot) closeModal();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modalRoot.hidden) closeModal();
      });
      document.body.appendChild(modalRoot);
    }
    return modalRoot;
  }

  function closeModal() {
    if (modalRoot) modalRoot.hidden = true;
  }

  function fieldHtml(field, value) {
    const id = "mf_" + field.key.replace(/[^a-zA-Z0-9_-]/g, "_");
    const v = value === undefined || value === null ? "" : value;
    const cls = field.full ? "form-field form-field--full" : "form-field";
    let input;
    if (field.type === "select") {
      input = `<select id="${id}" name="${field.key}" ${field.required ? "required" : ""}>` +
        (field.placeholder ? `<option value="">${esc(field.placeholder)}</option>` : "") +
        field.options.map((o) => `<option value="${esc(o)}" ${String(o) === String(v) ? "selected" : ""}>${esc(o)}</option>`).join("") +
        `</select>`;
    } else if (field.type === "textarea") {
      input = `<textarea id="${id}" name="${field.key}" ${field.required ? "required" : ""}>${esc(v)}</textarea>`;
    } else {
      const type = field.type || "text";
      input = `<input id="${id}" name="${field.key}" type="${type}" value="${esc(v)}" ${field.required ? "required" : ""}>`;
    }
    return `<div class="${cls}"><label for="${id}">${esc(field.label)}</label>${input}</div>`;
  }

  function openModal(opts) {
    const root = ensureModalRoot();
    const modal = root.querySelector(".modal");
    const values = opts.initial || {};
    modal.innerHTML = `
      <div class="modal__head">
        <h3>${esc(opts.title)}</h3>
        <button type="button" class="modal__close" aria-label="Cerrar">✕</button>
      </div>
      <form id="modalForm">
        <div class="form-grid">
          ${opts.fields.map((fld) => fieldHtml(fld, values[fld.key])).join("")}
        </div>
        <div class="modal__foot">
          ${opts.onDelete ? '<button type="button" class="btn-secondary btn-danger" id="modalDeleteBtn" style="margin-right:auto">🗑️ Eliminar</button>' : ""}
          <button type="button" class="btn-secondary" id="modalCancelBtn">Cancelar</button>
          <button type="submit" class="btn-primary">${esc(opts.submitLabel || "Guardar")}</button>
        </div>
      </form>`;
    root.hidden = false;
    modal.querySelector(".modal__close").addEventListener("click", closeModal);
    modal.querySelector("#modalCancelBtn").addEventListener("click", closeModal);
    if (opts.onDelete) {
      modal.querySelector("#modalDeleteBtn").addEventListener("click", () => {
        closeModal();
        opts.onDelete();
      });
    }
    modal.querySelector("#modalForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const out = {};
      opts.fields.forEach((fld) => (out[fld.key] = fd.get(fld.key) || ""));
      closeModal();
      opts.onSubmit(out);
    });
    const firstInput = modal.querySelector("input, select, textarea");
    if (firstInput) firstInput.focus();
  }

  function confirmDelete(message) {
    return window.confirm(message || "¿Eliminar este registro? Esta acción se puede deshacer con “Restablecer cambios”.");
  }

  function dirtyPillHtml(counts) {
    if (!counts || counts.total === 0) return "";
    const parts = [];
    if (counts.additions) parts.push(`${counts.additions} nuevo(s)`);
    if (counts.edits) parts.push(`${counts.edits} editado(s)`);
    if (counts.deletions) parts.push(`${counts.deletions} eliminado(s)`);
    return `<span class="dirty-pill">✎ ${parts.join(" · ")} sin exportar</span>`;
  }

  // ------------------------------------------------- tooltips informativos
  // Ícono "ⓘ" inline para aclarar términos o métricas ambiguas
  // (ej. "Requerimientos — Listos + Maqueta"). Reutiliza el motor de
  // tooltips de charts.js (showTip/hideTip) — funciona con delegación de
  // eventos, así que sirve también para contenido inyectado dinámicamente.
  function infoTip(text) {
    return `<span class="info-tip" tabindex="0" data-tip="${esc(text)}">${window.Icons ? window.Icons.svg("info", { size: 13 }) : "ⓘ"}</span>`;
  }
  function initInfoTips() {
    function showFor(el) {
      const rect = el.getBoundingClientRect();
      showTip(rect.left + rect.width / 2, rect.top, esc(el.dataset.tip));
    }
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest(".info-tip");
      if (t) showFor(t);
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(".info-tip")) hideTip();
    });
    document.addEventListener("focusin", (e) => {
      const t = e.target.closest(".info-tip");
      if (t) showFor(t);
    });
    document.addEventListener("focusout", (e) => {
      if (e.target.closest(".info-tip")) hideTip();
    });

    // P5-03 (Plan de Trabajo Fase 5): en pantallas táctiles no existe
    // "hover", así que el ⓘ no mostraba nada al tocarlo. Un tap alterna
    // el tooltip (mostrar la primera vez, ocultar si se toca de nuevo el
    // mismo ícono) y tocar en cualquier otro lugar de la página lo
    // cierra. Con mouse esto no cambia nada perceptible: el hover ya
    // muestra el tooltip antes de que llegue el click.
    let openInfoTipEl = null;
    document.addEventListener("click", (e) => {
      const t = e.target.closest(".info-tip");
      if (!t) {
        if (openInfoTipEl) {
          hideTip();
          openInfoTipEl = null;
        }
        return;
      }
      if (openInfoTipEl === t) {
        hideTip();
        openInfoTipEl = null;
      } else {
        showFor(t);
        openInfoTipEl = t;
      }
    });
  }

  // ===================================================================
  // Semáforo real — Plan de Trabajo Fase 0 (P0-01/P0-02)
  // Se recalcula en cada render contra la fecha del sistema, en vez de
  // leer un valor congelado del Excel (que hoy dice "NORMAL"/"Verde" sin
  // relación con los compromisos vencidos). Reglas explícitas y visibles
  // en el tooltip de cada chip del hero, para que sean auditables.
  // ===================================================================
  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }
  function isVencido(row) {
    return row.estado === "Abierto" && !!row.fecha_comprometida && row.fecha_comprometida < todayIso();
  }
  function computeSemaforo(bitacoraRows) {
    const rows = bitacoraRows || [];
    const abiertos = rows.filter((r) => r.estado === "Abierto");
    const vencidos = rows.filter(isVencido);
    const porImpacto = { Alto: 0, Medio: 0, Bajo: 0 };
    vencidos.forEach((r) => {
      if (porImpacto[r.impacto] !== undefined) porImpacto[r.impacto]++;
    });
    const pctVencidos = abiertos.length ? vencidos.length / abiertos.length : 0;

    let estado, estadoRegla;
    if (porImpacto.Alto > 0) {
      estado = "CRÍTICO";
      estadoRegla = `Crítico: ${porImpacto.Alto} compromiso(s) de impacto Alto vencido(s) en la Bitácora.`;
    } else if (pctVencidos > 0.3) {
      estado = "CRÍTICO";
      estadoRegla = `Crítico: ${pct(pctVencidos, 0)} de los compromisos abiertos están vencidos (umbral: 30%).`;
    } else if (porImpacto.Medio > 0) {
      estado = "EN RIESGO";
      estadoRegla = `En riesgo: ${porImpacto.Medio} compromiso(s) de impacto Medio vencido(s) en la Bitácora.`;
    } else {
      estado = "NORMAL";
      estadoRegla = "Normal: sin compromisos vencidos de impacto Alto o Medio, y menos del 30% de los abiertos vencidos.";
    }
    // Nota: el plan también propone comparar avance real vs. avance esperado
    // según cronograma. No se implementa aquí porque el 94% de las actividades
    // no tiene Fecha Fin Máxima real (son fechas correlativas de relleno, no
    // una planificación) — ver Fase 3 del Plan de Trabajo. Agregar esa
    // comparación ahora produciría el mismo tipo de dato falso que esta fase
    // busca eliminar.

    let plazos, plazosRegla;
    if (porImpacto.Alto > 0) {
      plazos = "Rojo";
      plazosRegla = `Rojo: hay compromisos de impacto Alto vencidos (${porImpacto.Alto}).`;
    } else if (vencidos.length > 0) {
      plazos = "Amarillo";
      plazosRegla = `Amarillo: hay ${vencidos.length} compromiso(s) vencido(s) (impacto Medio/Bajo).`;
    } else {
      plazos = "Verde";
      plazosRegla = "Verde: no hay compromisos vencidos en la Bitácora.";
    }

    return {
      estado, estadoRegla, plazos, plazosRegla,
      vencidos, totalVencidos: vencidos.length,
      vencidosAlto: porImpacto.Alto, vencidosMedio: porImpacto.Medio, vencidosBajo: porImpacto.Bajo,
      totalAbiertos: abiertos.length, pctVencidos,
    };
  }

  // ===================================================================
  // Catálogo canónico de módulos y normalización defensiva — Plan de
  // Trabajo Fase 1 (P1-01/P1-03, código). La hoja Bitácora del Excel
  // escribe el módulo con variantes ("Autoatención" vs "AutoAtención",
  // valores combinados como "autoatención, RAD") y algunos responsables
  // llevan espacios finales que hacen que la misma persona se cuente dos
  // veces ("Melany Orellana" vs "Melany Orellana "). Esto normaliza solo
  // en el portal, para mostrar y agrupar de forma consistente — no toca
  // el Excel maestro ni los datos de origen (ver "Regla de oro" del plan;
  // los hallazgos que sí requieren corregirse en el Excel — catálogo
  // formal, ids duplicados, criterios de QA faltantes — quedan listados
  // aparte para seguimiento con el equipo funcional).
  // ===================================================================
  const CANONICAL_MODULOS = [
    "AutoAtención", "Licencias Médicas", "FORCAP", "Calificaciones",
    "RAD", "VALS", "Portal SIRH", "Observatorio",
  ];
  // clave sin tildes/mayúsculas → nombre canónico
  const MODULO_ALIASES = {
    "autoatencion": "AutoAtención",
    "auto atencion": "AutoAtención",
    "lm": "Licencias Médicas",
    "licencias medicas": "Licencias Médicas",
    "forcap": "FORCAP",
    "calificaciones": "Calificaciones",
    "rad": "RAD",
    "vals": "VALS",
    "portal sirh": "Portal SIRH",
    "observatorio": "Observatorio",
  };
  function stripAccents(s) {
    return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function moduloKey(s) {
    return stripAccents(String(s || "").trim().toLowerCase());
  }
  /** Normaliza un único nombre de módulo a su forma canónica. Si no se
   *  reconoce, devuelve el texto original recortado — nunca se descarta
   *  información por no encontrar coincidencia. */
  function normalizeModulo(raw) {
    const key = moduloKey(raw);
    if (!key) return "";
    return MODULO_ALIASES[key] || String(raw).trim();
  }
  /** Divide un campo de módulo potencialmente multivalor (p.ej.
   *  "autoatención, RAD") en una lista de nombres canónicos sin duplicados. */
  function moduloTokens(raw) {
    if (!raw) return [];
    return String(raw)
      .split(/[,/]| y /i)
      .map((p) => normalizeModulo(p))
      .filter((n, i, arr) => n && arr.indexOf(n) === i);
  }
  /** Texto legible para mostrar un módulo (incluye el caso multivalor),
   *  con nombres canónicos: "autoatención, RAD" → "AutoAtención, RAD". */
  function moduloDisplay(raw) {
    const tokens = moduloTokens(raw);
    return tokens.length ? tokens.join(", ") : String(raw || "").trim();
  }
  /** ¿El campo de módulo (posiblemente multivalor) de una fila incluye el
   *  módulo canónico dado? Reemplaza el matching por substring/lowercase
   *  usado antes, que era frágil ante variantes no previstas. */
  function moduloMatches(raw, modulo) {
    return moduloTokens(raw).includes(modulo);
  }
  /** Normaliza un nombre de responsable: recorta espacios (incluidos los
   *  finales que duplicaban el conteo de una misma persona) y prolija el
   *  separador "/" en campos con varios responsables. No cambia nombres
   *  reales, solo espacios en blanco. */
  function normalizeResponsable(raw) {
    return String(raw || "")
      .replace(/\s*\/\s*/g, " / ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ===================================================================
  // Avance ponderado por etapa/módulo — Plan de Trabajo Fase 3 (P3-04).
  // El "% Avance" que ya trae el Excel (resumen_etapa/resumen_modulo)
  // solo cuenta como avance las actividades "Finalizado*" — todo lo demás
  // pesa 0, aunque esté en curso o atrasado. Con datos donde la enorme
  // mayoría de actividades sigue "Programado" (no ha empezado) eso es
  // razonable, pero esconde el progreso real de lo que sí se está
  // trabajando. Este cálculo pondera cada estado según cuánto avanzó,
  // como métrica complementaria — nunca reemplaza el "% Avance" simple,
  // se muestra junto a él y con su fórmula visible en el tooltip.
  // ===================================================================
  const AVANCE_PONDERADO_PESOS = {
    "Finalizado": 1, "Finalizado anticipado": 1, "Finalizado con desfase": 1,
    "En curso": 0.5, "Inicio anticipado": 0.5, "Inicio retrasado": 0.5,
    "Atrasado": 0.25,
    "Programado": 0, "No iniciado": 0, "Falta planificación": 0, "COMPLETAR": 0,
  };
  /** row: una fila de resumen_etapa o resumen_modulo (columnas = nombres de
   *  Estado con la cantidad de actividades en ese estado, + "Total"). */
  function weightedAvance(row) {
    const total = row["Total"] || 0;
    if (!total) return 0;
    let sum = 0;
    Object.keys(AVANCE_PONDERADO_PESOS).forEach((estado) => {
      sum += (row[estado] || 0) * AVANCE_PONDERADO_PESOS[estado];
    });
    return sum / total;
  }

  // ------------------------------------------------ banner global de cambios
  // P0-04: visible en las 6 páginas (no solo en la página de la colección
  // editada) cuando exista al menos una colección con cambios locales sin
  // exportar. Lee localStorage directo (mismo formato que local-records.js)
  // para no depender de que ese script esté cargado en páginas de solo
  // lectura como Glosario o Componentes.
  const EDITABLE_COLLECTIONS = [
    { key: "bitacora", label: "Bitácora", href: "bitacora.html" },
    { key: "etapas", label: "Etapas", href: "etapas.html" },
    { key: "req_autoatencion", label: "Requerimientos · AutoAtención", href: "requerimientos.html?tab=autoatencion" },
    { key: "req_rad", label: "Requerimientos · RAD", href: "requerimientos.html?tab=rad" },
    { key: "req_lm", label: "Requerimientos · Licencias Médicas", href: "requerimientos.html?tab=lm" },
    { key: "req_calificaciones", label: "Requerimientos · Calificaciones", href: "requerimientos.html?tab=calificaciones" },
  ];
  function readStoreDirtyCount(key) {
    try {
      const raw = localStorage.getItem("sm-store::" + key);
      if (!raw) return 0;
      const st = JSON.parse(raw);
      return Object.keys(st.edits || {}).length + (st.additions || []).length + (st.deletions || []).length;
    } catch (e) {
      return 0;
    }
  }
  function renderGlobalDirtyBanner() {
    const dirty = EDITABLE_COLLECTIONS.map((c) => Object.assign({}, c, { count: readStoreDirtyCount(c.key) })).filter((c) => c.count > 0);
    let el = document.querySelector(".global-dirty-banner");
    if (!dirty.length) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      const header = document.querySelector(".app-header");
      if (!header) return;
      el = document.createElement("div");
      el.className = "global-dirty-banner";
      header.insertAdjacentElement("afterend", el);
    }
    el.innerHTML = `
      <span class="global-dirty-banner__icon">${window.Icons ? window.Icons.svg("edit", { size: 15 }) : "✎"}</span>
      <span>Tienes cambios locales sin exportar, guardados solo en <strong>este navegador</strong>:
        ${dirty.map((c) => `<a href="${c.href}">${esc(c.label)} (${c.count})</a>`).join(", ")}.
      </span>`;
  }
  function initGlobalDirtyBanner() {
    renderGlobalDirtyBanner();
    document.addEventListener("store:change", renderGlobalDirtyBanner);
  }

  window.UI = {
    initTheme, initNav, pct, num, dateEs, esc,
    statusBadge, statusColor, showTip, hideTip, debounce,
    openModal, closeModal, confirmDelete, dirtyPillHtml, infoTip,
    todayIso, isVencido, computeSemaforo, initGlobalDirtyBanner,
    CANONICAL_MODULOS, normalizeModulo, moduloTokens, moduloDisplay, moduloMatches,
    normalizeResponsable, weightedAvance,
  };

  // -------------------------------------------------------- búsqueda global
  // Índice liviano construido una vez desde window.APP_DATA (disponible en
  // todas las páginas). Cada resultado sabe a qué página navegar y con qué
  // query string, para que la página destino pueda pre-filtrar su tabla.
  let searchIndex = null;
  function buildSearchIndex() {
    const D = window.APP_DATA;
    if (!D) return [];
    const idx = [];
    (D.resumen_modulo || []).forEach((m) => {
      if (m["Módulo"] === "Total general") return;
      idx.push({
        group: "Módulos", icon: "layers", title: m["Módulo"],
        sub: `${UI.pct(m["% Avance"], 0)} de avance · ${m["Total"]} actividades`,
        href: `etapas.html?modulo=${encodeURIComponent(m["Módulo"])}`,
        text: (m["Módulo"] || "").toLowerCase(),
      });
    });
    const reqTabs = [
      { data: D.req_autoatencion, tab: "autoatencion", label: "AutoAtención" },
      { data: D.req_rad, tab: "rad", label: "RAD" },
      { data: D.req_lm, tab: "lm", label: "Licencias Médicas" },
      { data: D.req_calificaciones, tab: "calificaciones", label: "Calificaciones" },
    ];
    reqTabs.forEach(({ data, tab, label }) => {
      (data || []).forEach((r) => {
        const desc = r["Descripcion segun Bases de Licitación"] || r["Descripcion segun Doc. B"] || r["Requerimiento"] || "";
        const id = r["Id Requerimiento"] || "";
        idx.push({
          group: "Requerimientos", icon: "file-text", title: `${id} — ${desc}`.slice(0, 90),
          sub: `${label} · ${r["Estado"] || r["Estado QA"] || ""}`,
          href: `requerimientos.html?tab=${tab}&q=${encodeURIComponent(id)}`,
          text: `${id} ${desc} ${label}`.toLowerCase(),
        });
      });
    });
    (D.etapas || []).forEach((e) => {
      const title = e["Actividades/Tarea"] || e["Componente/Subetapa"] || "";
      if (!title) return;
      idx.push({
        group: "Actividades / Etapas", icon: "calendar", title,
        sub: `${e["Módulo"] || ""} · ${e["Etapa"] || ""} · ${e["Estado"] || ""}`,
        href: `etapas.html?q=${encodeURIComponent(title)}`,
        text: `${e["Módulo"]} ${e["Etapa"]} ${e["Componente/Subetapa"]} ${title}`.toLowerCase(),
      });
    });
    (D.bitacora || []).forEach((b) => {
      const title = b.descripcion || b.accion || "";
      if (!title) return;
      idx.push({
        group: "Bitácora", icon: "briefcase", title: title.slice(0, 90),
        sub: `${moduloDisplay(b.modulo)} · ${b.estado || ""} · ${dateEs(b.fecha_registro)}`,
        href: `bitacora.html?q=${encodeURIComponent((b.accion || b.descripcion || "").slice(0, 60))}`,
        text: `${moduloDisplay(b.modulo)} ${b.descripcion} ${b.accion} ${normalizeResponsable(b.responsable)}`.toLowerCase(),
      });
    });
    return idx;
  }

  function ensureSearchOverlay() {
    let overlay = document.getElementById("globalSearchOverlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "globalSearchOverlay";
    overlay.className = "search-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="search-panel" role="dialog" aria-modal="true" aria-label="Búsqueda global">
        <div class="search-panel__input-row">
          ${svgIcon("search", 17)}
          <input type="text" id="globalSearchInput" placeholder="Buscar módulos, requerimientos, actividades, compromisos…" autocomplete="off">
          <kbd>Esc</kbd>
        </div>
        <div class="search-panel__results" id="globalSearchResults"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeSearch();
    });
    return overlay;
  }

  function svgIcon(name, size) {
    return window.Icons ? window.Icons.svg(name, { size: size || 18 }) : "";
  }

  function openSearch() {
    const overlay = ensureSearchOverlay();
    if (!searchIndex) searchIndex = buildSearchIndex();
    overlay.hidden = false;
    const input = document.getElementById("globalSearchInput");
    input.value = "";
    renderSearchResults("");
    setTimeout(() => input.focus(), 10);
  }
  function closeSearch() {
    const overlay = document.getElementById("globalSearchOverlay");
    if (overlay) overlay.hidden = true;
  }

  function renderSearchResults(query) {
    const results = document.getElementById("globalSearchResults");
    const q = query.trim().toLowerCase();
    let items = searchIndex;
    if (q) items = items.filter((it) => it.text.includes(q));
    if (!q) {
      results.innerHTML = `<div class="search-empty">Escribe para buscar entre ${searchIndex.length.toLocaleString("es-CL")} registros del proyecto…</div>`;
      return;
    }
    if (!items.length) {
      results.innerHTML = `<div class="search-empty">Sin resultados para “${esc(query)}”.</div>`;
      return;
    }
    const groups = {};
    items.slice(0, 60).forEach((it) => {
      (groups[it.group] = groups[it.group] || []).push(it);
    });
    let html = "";
    Object.keys(groups).forEach((g) => {
      html += `<div class="search-group__label">${esc(g)}</div>`;
      html += groups[g]
        .slice(0, 6)
        .map(
          (it) => `<button type="button" class="search-result" data-href="${esc(it.href)}">
            <span class="search-result__icon">${svgIcon(it.icon, 18)}</span>
            <span class="search-result__main">
              <span class="search-result__title">${esc(it.title)}</span>
              <span class="search-result__sub">${esc(it.sub)}</span>
            </span>
          </button>`
        )
        .join("");
    });
    results.innerHTML = html;
    results.querySelectorAll(".search-result").forEach((btn, i) => {
      btn.addEventListener("click", () => (window.location.href = btn.dataset.href));
      if (i === 0) btn.classList.add("is-active");
    });
  }

  function initGlobalSearch() {
    const trigger = document.getElementById("globalSearchBtn");
    if (!trigger) return;
    trigger.addEventListener("click", openSearch);
    document.addEventListener("keydown", (e) => {
      const isK = e.key === "k" || e.key === "K";
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        openSearch();
        return;
      }
      const overlay = document.getElementById("globalSearchOverlay");
      if (overlay && !overlay.hidden && e.key === "Escape") closeSearch();
    });
    // P5-01 (Plan de Trabajo Fase 5): antes se filtraba y volvía a pintar
    // la lista de resultados en cada tecla presionada. Con debounce se
    // espera una pausa breve antes de filtrar/renderizar — menos trabajo
    // de DOM mientras la persona todavía está escribiendo, sin cambiar el
    // comportamiento percibido (120ms es imperceptible al tipear).
    const debouncedSearch = debounce((value) => renderSearchResults(value), 120);
    document.addEventListener("input", (e) => {
      if (e.target && e.target.id === "globalSearchInput") {
        debouncedSearch(e.target.value);
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.target && e.target.id === "globalSearchInput" && e.key === "Enter") {
        const first = document.querySelector("#globalSearchResults .search-result");
        if (first) window.location.href = first.dataset.href;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
    initGlobalSearch();
    initInfoTips();
    initGlobalDirtyBanner();
  });
})();

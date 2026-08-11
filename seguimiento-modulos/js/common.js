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
      if (href === path) a.classList.add("active");
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
  }

  window.UI = {
    initTheme, initNav, pct, num, dateEs, esc,
    statusBadge, statusColor, showTip, hideTip, debounce,
    openModal, closeModal, confirmDelete, dirtyPillHtml, infoTip,
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
        sub: `${b.modulo || ""} · ${b.estado || ""} · ${dateEs(b.fecha_registro)}`,
        href: `bitacora.html?q=${encodeURIComponent((b.accion || b.descripcion || "").slice(0, 60))}`,
        text: `${b.modulo} ${b.descripcion} ${b.accion} ${b.responsable}`.toLowerCase(),
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
    document.addEventListener("input", (e) => {
      if (e.target && e.target.id === "globalSearchInput") {
        renderSearchResults(e.target.value);
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
  });
})();

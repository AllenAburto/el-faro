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

  window.UI = {
    initTheme, initNav, pct, num, dateEs, esc,
    statusBadge, statusColor, showTip, hideTip, debounce,
    openModal, closeModal, confirmDelete, dirtyPillHtml,
  };

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
  });
})();

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

  window.UI = {
    initTheme, initNav, pct, num, dateEs, esc,
    statusBadge, statusColor, showTip, hideTip, debounce,
  };

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
  });
})();

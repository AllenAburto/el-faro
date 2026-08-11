/* ================================================================= icons.js
   Set de íconos vectoriales en línea (estilo trazo, 24×24, sin dependencias
   externas) que reemplaza los emojis del dashboard por SVG profesionales.
   Uso: Icons.svg("target", { size: 22, cls: "kpi-icon" })
   ========================================================================= */
(function () {
  "use strict";

  const PATHS = {
    // --------------------------------------------------------- indicadores
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.4"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/>',
    layers: '<polygon points="12,3 21,8 12,13 3,8"/><polyline points="3,13 12,18 21,13"/><polyline points="3,18 12,23 21,18"/>',
    package: '<path d="M3 8l9-5 9 5-9 5-9-5z"/><path d="M3 8v8l9 5 9-5V8"/><line x1="12" y1="13" x2="12" y2="21"/>',
    layout: '<rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="10" y1="10" x2="10" y2="20"/>',
    award: '<circle cx="12" cy="8" r="5"/><path d="M8.3 12.6L6.8 21l5.2-3 5.2 3-1.5-8.4"/>',
    "alert-triangle": '<path d="M12 3l10 18H2L12 3z"/><line x1="12" y1="9.5" x2="12" y2="14"/><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none"/>',
    activity: '<polyline points="2,12 7,12 10,20 14,4 17,12 22,12"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><polyline points="8,12.5 11,15.5 16.5,9"/>',
    "alert-circle": '<circle cx="12" cy="12" r="9"/><line x1="12" y1="7.5" x2="12" y2="13"/><circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none"/>',
    "alert-octagon": '<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5z"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2.3" width="6" height="3.6" rx="1"/>',
    "refresh-cw": '<path d="M4 12a8 8 0 0 1 14-5.3L21 9"/><polyline points="21,3 21,9 15,9"/><path d="M20 12a8 8 0 0 1-14 5.3L3 15"/><polyline points="3,21 3,15 9,15"/>',
    clock: '<circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 16,14"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
    "pause-circle": '<circle cx="12" cy="12" r="9"/><line x1="10" y1="9" x2="10" y2="15"/><line x1="14" y1="9" x2="14" y2="15"/>',
    "file-text": '<path d="M6 2h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17.4" cy="8.5" r="2.6"/><path d="M15.6 14.2c2.7.4 4.8 2.8 4.8 5.8"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="3" y1="12" x2="21" y2="12"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><line x1="10" y1="13" x2="14" y2="13"/>',
    "bar-chart": '<line x1="6" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/>',
    percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="7" cy="7" r="2.3"/><circle cx="17" cy="17" r="2.3"/>',

    // ------------------------------------------------------------------ ui
    download: '<path d="M12 3v12"/><polyline points="7,10 12,15 17,10"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><line x1="20" y1="20" x2="15.3" y2="15.3"/>',
    "chevron-down": '<polyline points="6,9 12,15 18,9"/>',
    x: '<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>',
    info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none"/>',
    "rotate-ccw": '<polyline points="1,4 1,10 7,10"/><path d="M3.5 15a9 9 0 1 0 2.1-9.5L1 10"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
    trash: '<polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    sun: '<circle cx="12" cy="12" r="4.3"/><line x1="12" y1="2" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22"/><line x1="4.2" y1="4.2" x2="6" y2="6"/><line x1="18" y1="18" x2="19.8" y2="19.8"/><line x1="2" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22" y2="12"/><line x1="4.2" y1="19.8" x2="6" y2="18"/><line x1="18" y1="6" x2="19.8" y2="4.2"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    trophy: '<circle cx="12" cy="8" r="5"/><path d="M8.3 12.6L6.8 21l5.2-3 5.2 3-1.5-8.4"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="13,6 19,12 13,18"/>',
  };

  function svg(name, opts) {
    opts = opts || {};
    const size = opts.size || 20;
    const sw = opts.strokeWidth || 2;
    const cls = opts.cls ? ` class="${opts.cls}"` : "";
    const body = PATHS[name] || PATHS.info;
    return (
      `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
      `stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`
    );
  }

  window.Icons = { svg, PATHS };
})();

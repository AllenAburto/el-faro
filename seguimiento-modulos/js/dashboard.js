/* ========================================================= dashboard.js */
(function () {
  "use strict";
  const D = window.APP_DATA;
  const meta = D.dashboard_meta;

  document.getElementById("lastUpdate").textContent = "Actualizado: " + UI.dateEs(meta.actualizado);
  document.getElementById("footUpdate").textContent = UI.dateEs(meta.actualizado);

  // ------------------------------------------------------------ status strip
  const strip = document.getElementById("statusStrip");
  const stripItems = [
    { label: "Estado general", value: meta.estado_general, badge: true },
    { label: "Plazos", value: meta.plazos, badge: true },
    { label: "Planificación", value: meta.planificacion, badge: true },
    { label: "Avance / Progreso", value: UI.pct(meta.avance_progreso, 1) },
  ];
  const colorForWord = (w) => ({
    NORMAL: "var(--status-good)", Verde: "var(--status-good)",
    Amarillo: "var(--status-warning)", Rojo: "var(--status-critical)",
  }[w] || "var(--text-secondary)");
  strip.innerHTML = stripItems
    .map((it) => {
      const color = it.badge ? colorForWord(it.value) : "var(--text-primary)";
      return `<div class="kpi-chip"><span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block"></span>${it.label}: <strong style="color:${it.badge ? color : "var(--text-primary)"}">${UI.esc(it.value)}</strong></div>`;
    })
    .join("");

  // ------------------------------------------------------------- kpi cards
  const kpis = [
    { label: "Total actividades", value: UI.num(meta.total), icon: "📋", accent: "" },
    { label: "Finalizadas", value: UI.num(meta.finalizados), icon: "✅", accent: "accent-good" },
    { label: "En curso", value: UI.num(meta.en_curso), icon: "🔄", accent: "accent-1" },
    { label: "Atrasadas", value: UI.num(meta.atrasados), icon: "🚨", accent: "accent-critical" },
    { label: "Programadas", value: UI.num(meta.programado), icon: "📅", accent: "" },
    { label: "No iniciadas", value: UI.num(meta.no_iniciado), icon: "⏸️", accent: "accent-warn" },
    { label: "No planificadas", value: UI.num(meta.no_planificado), icon: "📄", accent: "" },
    { label: "Finalizado con desfase", value: UI.num(meta.finalizado_desfase), icon: "⏱️", accent: "" },
  ];
  document.getElementById("kpiCards").innerHTML = kpis
    .map(
      (k) => `<div class="stat-tile ${k.accent ? "stat-tile--" + k.accent : ""}">
        <span class="stat-tile__icon">${k.icon}</span>
        <span class="stat-tile__label">${k.label}</span>
        <span class="stat-tile__value">${k.value}</span>
      </div>`
    )
    .join("");

  // ---------------------------------------------------------- big % blocks
  const alcance = D.alcance_modulo;
  document.getElementById("avanceGeneral").textContent = UI.pct(alcance.avance_general, 1);
  document.getElementById("meterGeneral").style.width = UI.pct(alcance.avance_general, 1);
  document.getElementById("avanceMaquetas").textContent = UI.pct(alcance.avance_con_maquetas, 1);
  document.getElementById("meterMaquetas").style.width = UI.pct(alcance.avance_con_maquetas, 1);
  document.getElementById("avanceFaseI").textContent = UI.pct(alcance.avance_fase_I, 1);
  document.getElementById("meterFaseI").style.width = UI.pct(alcance.avance_fase_I, 1);

  // ---------------------------------------------------- avance por etapa
  const ESTADO_ORDER = [
    { key: "Finalizado", color: "var(--status-good)" },
    { key: "Finalizado con desfase", color: "var(--status-serious)" },
    { key: "En curso", color: "var(--series-1)" },
    { key: "Atrasado", color: "var(--status-critical)" },
    { key: "No iniciado", color: "var(--status-warning)" },
    { key: "Programado", color: "var(--baseline)" },
  ];
  const etapaRows = D.resumen_etapa.map((r) => ({
    label: r["Etapa"],
    total: r["Total"],
    segments: ESTADO_ORDER.map((e) => ({ name: e.key, value: r[e.key] || 0, color: e.color })),
  }));
  Charts.stackedBars(document.getElementById("chartEtapas"), etapaRows);
  document.getElementById("legendEstados").innerHTML = ESTADO_ORDER.map(
    (e) => `<span class="legend__item"><span class="legend__swatch" style="background:${e.color}"></span>${e.key}</span>`
  ).join("");

  // ------------------------------------------------------------ responsable
  const respColors = { MINSAL: "var(--series-1)", PROVEEDOR: "var(--series-2)" };
  const respSegs = D.resumen_responsable.map((r) => ({
    name: r["Responsable"],
    value: r["Total"],
    color: respColors[r["Responsable"]] || "var(--series-4)",
  }));
  Charts.donut(document.getElementById("chartResponsable"), respSegs, {
    size: 140,
    stroke: 18,
    centerValue: UI.num(meta.total),
    centerLabel: "actividades",
  });

  // -------------------------------------------------------------- módulos
  const moduloRows = D.resumen_modulo
    .slice()
    .sort((a, b) => b["% Avance"] - a["% Avance"])
    .map((r) => ({
      label: r["Módulo"],
      value: r["% Avance"],
      display: UI.pct(r["% Avance"], 1),
      color: "var(--series-1)",
      tooltip: `${r["Finalizado"]} finalizadas de ${r["Total"]}`,
    }));
  Charts.simpleBars(document.getElementById("chartModulos"), moduloRows, { max: 1 });

  // ---------------------------------------------------- requerimientos fase
  const reqFaseRows = D.req_por_fase
    .filter((r) => r["Fase"] !== "Total general")
    .map((r) => ({
      label: "Fase " + r["Fase"],
      total: r["Total general"],
      segments: [
        { name: "Listo", value: r["Listo"] || 0, color: "var(--status-good)" },
        { name: "Maqueta", value: r["Maqueta"] || 0, color: "var(--series-1)" },
        { name: "Pendiente", value: r["Pendiente"] || 0, color: "var(--status-warning)" },
      ],
    }));
  Charts.stackedBars(document.getElementById("chartReqFase"), reqFaseRows);
  document.getElementById("legendReq").innerHTML = [
    { name: "Listo", color: "var(--status-good)" },
    { name: "Maqueta", color: "var(--series-1)" },
    { name: "Pendiente", color: "var(--status-warning)" },
  ]
    .map((e) => `<span class="legend__item"><span class="legend__swatch" style="background:${e.color}"></span>${e.name}</span>`)
    .join("");

  // --------------------------------------------------------- donut req global
  const avReq = D.avance_requerimientos;
  Charts.donut(
    document.getElementById("donutReq"),
    [
      { name: "Listos", value: avReq.listos, color: "var(--status-good)" },
      { name: "Maquetas", value: avReq.maquetas, color: "var(--series-1)" },
      { name: "Pendientes", value: avReq.pendientes, color: "var(--status-warning)" },
    ],
    { size: 150, stroke: 20, centerValue: UI.num(avReq.total), centerLabel: "requerimientos" }
  );

  // ---------------------------------------------------- pendientes/resp
  const pendRows = D.pendientes_por_fase_responsable
    .filter((r) => r["Fase"] !== "Total general")
    .map((r) => ({
      label: "Fase " + r["Fase"],
      total: r["Total general"],
      segments: [
        { name: "Indra", value: r["Indra"] || 0, color: "var(--series-2)" },
        { name: "SIRH", value: r["SIRH"] || 0, color: "var(--series-7)" },
      ],
    }));
  Charts.stackedBars(document.getElementById("chartPendResp"), pendRows, [
    { name: "Indra", color: "var(--series-2)" },
    { name: "SIRH", color: "var(--series-7)" },
  ]);

  // -------------------------------------------------------- tabla componentes
  const compRows = D.resumen_componente.slice().sort((a, b) => b["% Avance"] - a["% Avance"]);
  const tblHtml = `
    <table class="data-table">
      <thead><tr>
        <th>Componente / Subetapa</th>
        <th class="col-num">Total</th>
        <th class="col-num">Finalizado</th>
        <th class="col-num">Con desfase</th>
        <th>% Avance</th>
      </tr></thead>
      <tbody>
        ${compRows
          .map(
            (r) => `<tr>
              <td class="strong">${UI.esc(r["Componente"])}</td>
              <td class="col-num">${r["Total"]}</td>
              <td class="col-num">${r["Finalizado"]}</td>
              <td class="col-num">${r["Finalizado con desfase"]}</td>
              <td style="min-width:160px">
                <div class="meter-row">
                  <div class="meter"><span style="width:${(r["% Avance"] * 100).toFixed(1)}%; background:${
                    r["% Avance"] >= 0.5 ? "var(--status-good)" : r["% Avance"] > 0 ? "var(--status-warning)" : "var(--baseline)"
                  }"></span></div>
                  <span class="meter-value">${UI.pct(r["% Avance"], 0)}</span>
                </div>
              </td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
  document.getElementById("tableComponentes").innerHTML = tblHtml;
})();

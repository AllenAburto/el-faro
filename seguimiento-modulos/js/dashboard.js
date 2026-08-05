/* ========================================================= dashboard.js */
(function () {
  "use strict";
  const D = window.APP_DATA;
  const meta = D.dashboard_meta;

  document.getElementById("lastUpdate").textContent = "Actualizado: " + UI.dateEs(meta.actualizado);
  document.getElementById("footUpdate").textContent = UI.dateEs(meta.actualizado);

  const totalReq = D.avance_global_requerimientos["Total requerimientos"];
  document.getElementById("pageSubtitle").textContent =
    `Visión consolidada del proyecto: ${UI.num(meta.total)} actividades planificadas en 10 etapas para 7 módulos ` +
    `nuevos del SIRH, más el seguimiento de ${UI.num(totalReq)} requerimientos funcionales levantados a la fecha.`;
  document.getElementById("indicadoresHint").textContent =
    `${UI.num(meta.total)} actividades · 10 etapas · 7 módulos`;

  // -------------------------------------------------------- semáforo cards
  const ESTADO_COLOR = { NORMAL: "var(--status-good)", "EN RIESGO": "var(--status-warning)", "CRÍTICO": "var(--status-critical)" };
  const PLAZOS_INFO = {
    Verde: { icon: "✅", color: "var(--status-good)" },
    Amarillo: { icon: "⚠️", color: "var(--status-warning)" },
    Rojo: { icon: "🔴", color: "var(--status-critical)" },
  };
  const plazosInfo = PLAZOS_INFO[meta.plazos] || PLAZOS_INFO.Verde;
  const estadoColor = ESTADO_COLOR[meta.estado_general] || "var(--text-secondary)";

  const semaforoCards = [
    { icon: "🚦", label: "Estado general", value: meta.estado_general, color: estadoColor },
    { icon: plazosInfo.icon, label: "Plazos", value: meta.plazos, color: plazosInfo.color },
    { icon: "📈", label: "Avance", value: UI.pct(meta.avance_progreso, 1), color: "var(--series-1)" },
  ];
  document.getElementById("semaforoCards").innerHTML = semaforoCards
    .map(
      (c) => `<div class="semaforo-card">
        <span class="semaforo-card__icon">${c.icon}</span>
        <div class="semaforo-card__body">
          <span class="semaforo-card__label">${UI.esc(c.label)}</span>
          <span class="semaforo-card__value" style="color:${c.color}">${UI.esc(c.value)}</span>
        </div>
      </div>`
    )
    .join("");

  document.getElementById("meterAvanceGeneral").style.width = UI.pct(meta.avance_progreso, 1);
  document.getElementById("avanceGeneralValue").textContent = UI.pct(meta.avance_progreso, 1);
  document.getElementById("avanceGeneralValue").style.color = "var(--series-1)";

  // ------------------------------------------------------------- kpi cards
  const kpis = [
    { label: "Total actividades", value: UI.num(meta.total), icon: "📋", accent: "" },
    { label: "Finalizadas", value: UI.num(meta.finalizados), icon: "✅", accent: "accent-good" },
    { label: "Finalizadas con desfase", value: UI.num(meta.finalizados_desfase), icon: "⏱️", accent: "" },
    { label: "En curso", value: UI.num(meta.en_curso), icon: "🔄", accent: "accent-1" },
    { label: "Inicio retrasado (en curso)", value: UI.num(meta.inicio_retrasado), icon: "⏳", accent: "" },
    { label: "Programadas", value: UI.num(meta.programado), icon: "📅", accent: "" },
    { label: "No iniciadas", value: UI.num(meta.no_iniciado), icon: "⏸️", accent: "accent-warn" },
    { label: "Atrasadas", value: UI.num(meta.atrasados), icon: "🚨", accent: "accent-critical" },
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

  // ---------------------------------------------------------- avance general
  const avReq = D.avance_global_requerimientos;
  document.getElementById("valActividades").textContent = UI.pct(meta.avance_progreso, 1);
  document.getElementById("meterActividades").style.width = UI.pct(meta.avance_progreso, 1);
  document.getElementById("valListos").textContent = UI.pct(avReq["% Avance (Listos)"], 1);
  document.getElementById("meterListos").style.width = UI.pct(avReq["% Avance (Listos)"], 1);
  document.getElementById("valListosMaq").textContent = UI.pct(avReq["% Avance (Listos + Maquetas)"], 1);
  document.getElementById("meterListosMaq").style.width = UI.pct(avReq["% Avance (Listos + Maquetas)"], 1);

  // ---------------------------------------------------- avance por etapa
  const ESTADO_ORDER = [
    "Finalizado", "Finalizado anticipado", "Finalizado con desfase",
    "En curso", "Inicio anticipado", "Inicio retrasado",
    "Atrasado", "No iniciado", "Programado", "Falta planificación", "COMPLETAR",
  ].map((key) => ({ key, color: UI.statusColor(key) }));

  document.getElementById("etapaHint").textContent = `${UI.num(meta.total)} actividades · 10 etapas`;
  const etapaRows = D.resumen_etapa.map((r) => ({
    label: r["Etapa"],
    total: r["Total"],
    segments: ESTADO_ORDER.map((e) => ({ name: e.key, value: r[e.key] || 0, color: e.color })),
  }));
  Charts.stackedBars(document.getElementById("chartEtapas"), etapaRows);
  const usedStates = new Set();
  D.resumen_etapa.forEach((r) => ESTADO_ORDER.forEach((e) => { if (r[e.key]) usedStates.add(e.key); }));
  document.getElementById("legendEstados").innerHTML = ESTADO_ORDER.filter((e) => usedStates.has(e.key))
    .map((e) => `<span class="legend__item"><span class="legend__swatch" style="background:${e.color}"></span>${e.key}</span>`)
    .join("");

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
      tooltip: `${(r["Finalizado"] || 0) + (r["Finalizado anticipado"] || 0)} finalizadas de ${r["Total"]}`,
    }));
  Charts.simpleBars(document.getElementById("chartModulos"), moduloRows, { max: 1 });

  // ---------------------------------------------------- requerimientos / módulo
  const reqModRows = D.req_por_modulo
    .filter((r) => r["Módulo"] !== "Total general")
    .map((r) => ({
      label: r["Módulo"],
      total: r["Total"],
      segments: [
        { name: "Listo", value: r["Listo"] || 0, color: "var(--status-good)" },
        { name: "Maqueta", value: r["Maqueta"] || 0, color: "var(--series-1)" },
        { name: "Pendiente", value: r["Pendiente"] || 0, color: "var(--status-warning)" },
        { name: "Observado", value: r["Observado"] || 0, color: "var(--status-serious)" },
      ],
    }));
  const reqTotalGeneral = D.req_por_modulo.find((r) => r["Módulo"] === "Total general");
  document.getElementById("reqModuloHint").textContent = `${UI.num(reqTotalGeneral["Total"])} requerimientos definidos`;
  Charts.stackedBars(document.getElementById("chartReqModulo"), reqModRows);
  document.getElementById("legendReqModulo").innerHTML = [
    { name: "Listo", color: "var(--status-good)" },
    { name: "Maqueta", color: "var(--series-1)" },
    { name: "Pendiente", color: "var(--status-warning)" },
    { name: "Observado", color: "var(--status-serious)" },
  ]
    .map((e) => `<span class="legend__item"><span class="legend__swatch" style="background:${e.color}"></span>${e.name}</span>`)
    .join("");

  // --------------------------------------------------------- donut req global
  const reqObservados = reqTotalGeneral["Observado"] || 0;
  const reqSinEstado = avReq["Total requerimientos"] - avReq["Listos"] - avReq["Maquetas"] - avReq["Pendientes"] - reqObservados;
  const donutReqSegs = [
    { name: "Listos", value: avReq["Listos"], color: "var(--status-good)" },
    { name: "Maquetas", value: avReq["Maquetas"], color: "var(--series-1)" },
    { name: "Pendientes", value: avReq["Pendientes"], color: "var(--status-warning)" },
    { name: "Observados", value: reqObservados, color: "var(--status-serious)" },
  ];
  if (reqSinEstado > 0) {
    donutReqSegs.push({ name: "Sin estado QA aún", value: reqSinEstado, color: "var(--baseline)" });
  }
  Charts.donut(document.getElementById("donutReq"), donutReqSegs, {
    size: 150, stroke: 20, centerValue: UI.num(avReq["Total requerimientos"]), centerLabel: "requerimientos",
  });

  // ------------------------------------------------------ componentes destacados
  const compSorted = D.resumen_componente.slice().sort((a, b) => b["% Avance"] - a["% Avance"]);
  const mejor = compSorted[0];
  const menor = compSorted[compSorted.length - 1];
  document.getElementById("mejorAvanceNombre").textContent = mejor["Componente / Subetapa"];
  document.getElementById("mejorAvancePct").textContent = UI.pct(mejor["% Avance"], 1);
  document.getElementById("menorAvanceNombre").textContent = menor["Componente / Subetapa"];
  document.getElementById("menorAvancePct").textContent = UI.pct(menor["% Avance"], 1);

  // -------------------------------------------------------- tabla componentes
  document.getElementById("compHint").textContent =
    `${D.resumen_componente.length} componentes del ciclo de vida — ordenados por % de avance`;
  const tblHtml = `
    <table class="data-table">
      <thead><tr>
        <th>Componente / Subetapa</th>
        <th class="col-num">Total</th>
        <th class="col-num">Finalizado anticipado</th>
        <th class="col-num">Finalizado</th>
        <th class="col-num">Con desfase</th>
        <th>% Avance</th>
      </tr></thead>
      <tbody>
        ${compSorted
          .map(
            (r) => `<tr>
              <td class="strong">${UI.esc(r["Componente / Subetapa"])}</td>
              <td class="col-num">${r["Total"]}</td>
              <td class="col-num">${r["Finalizado anticipado"] || 0}</td>
              <td class="col-num">${r["Finalizado"] || 0}</td>
              <td class="col-num">${r["Finalizado con desfase"] || 0}</td>
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

/* ========================================================= dashboard.js */
(function () {
  "use strict";
  const D = window.APP_DATA;
  const meta = D.dashboard_meta;

  document.getElementById("footUpdate").textContent = UI.dateEs(meta.actualizado);

  const totalReq = D.avance_global_requerimientos["Total requerimientos"];
  document.getElementById("pageSubtitle").textContent =
    `Visión consolidada del proyecto: ${UI.num(meta.total)} actividades planificadas en 10 etapas para 7 módulos ` +
    `nuevos del SIRH, más el seguimiento de ${UI.num(totalReq)} requerimientos funcionales levantados a la fecha.`;
  document.getElementById("indicadoresHint").textContent =
    `${UI.num(meta.total)} actividades · 10 etapas · 7 módulos`;

  // ------------------------------------------------------------- kpi cards
  const kpis = [
    { label: "Total actividades", value: UI.num(meta.total), icon: "clipboard", accent: "" },
    { label: "Finalizadas", value: UI.num(meta.finalizados), icon: "check-circle", accent: "accent-good" },
    {
      label: "Finalizadas con desfase", value: UI.num(meta.finalizados_desfase), icon: "clock", accent: "",
      tip: "Actividades que terminaron después de su Fecha Fin Máxima planificada.",
    },
    { label: "En curso", value: UI.num(meta.en_curso), icon: "refresh-cw", accent: "accent-1" },
    {
      label: "Inicio retrasado (en curso)", value: UI.num(meta.inicio_retrasado), icon: "clock", accent: "",
      tip: "Actividades ya iniciadas, pero que comenzaron después de su Fecha Inicio Programada.",
    },
    { label: "Programadas", value: UI.num(meta.programado), icon: "calendar", accent: "" },
    { label: "No iniciadas", value: UI.num(meta.no_iniciado), icon: "pause-circle", accent: "accent-warn" },
    { label: "Atrasadas", value: UI.num(meta.atrasados), icon: "alert-octagon", accent: "accent-critical" },
  ];
  document.getElementById("kpiCards").innerHTML = kpis
    .map(
      (k) => `<div class="stat-tile ${k.accent ? "stat-tile--" + k.accent : ""}">
        <span class="stat-tile__icon">${Icons.svg(k.icon, { size: 18 })}</span>
        <span class="stat-tile__label">${k.label}${k.tip ? UI.infoTip(k.tip) : ""}</span>
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

  // ------------------------------------------------------------ compromisos
  const bitRows = Store.list("bitacora", D.bitacora || [], "id");
  const bitTotal = bitRows.length;
  const bitAbiertos = bitRows.filter((r) => r.estado === "Abierto").length;
  const bitCerrados = bitRows.filter((r) => r.estado === "Cerrado").length;
  const bitArchivados = bitRows.filter((r) => r.estado === "Archivado").length;
  // sem: semáforo/vencidos calculado sobre los datos ya editados localmente
  // (bitRows), reutilizado más abajo también para el hero — ver P0-01/P0-02.
  const sem = UI.computeSemaforo(bitRows);
  document.getElementById("compromisosHint").textContent =
    `${UI.num(bitTotal)} registros · ${UI.pct(bitTotal ? bitCerrados / bitTotal : 0, 1)} cerrados`;
  document.getElementById("compromisosCards").innerHTML = [
    { icon: "clipboard", label: "Total compromisos", value: UI.num(bitTotal), accent: "accent-1" },
    { icon: "refresh-cw", label: "Abiertos", value: UI.num(bitAbiertos), accent: "accent-warn" },
    { icon: "check-circle", label: "Cerrados", value: UI.num(bitCerrados), accent: "accent-good" },
    { icon: "archive", label: "Archivados", value: UI.num(bitArchivados), accent: "" },
    {
      icon: "alert-octagon", label: "Vencidos", value: UI.num(sem.totalVencidos),
      accent: sem.vencidosAlto > 0 ? "accent-critical" : sem.totalVencidos > 0 ? "accent-warn" : "accent-good",
      tip: `${sem.vencidosAlto} de impacto Alto · ${sem.vencidosMedio} Medio · ${sem.vencidosBajo} Bajo. Abiertos con Fecha Comprometida ya pasada.`,
    },
  ]
    .map(
      (k) => `<div class="stat-tile ${k.accent ? "stat-tile--" + k.accent : ""}">
        <span class="stat-tile__icon">${Icons.svg(k.icon, { size: 18 })}</span>
        <span class="stat-tile__label">${k.label}${k.tip ? UI.infoTip(k.tip) : ""}</span>
        <span class="stat-tile__value">${k.value}</span>
      </div>`
    )
    .join("");
  const BIT_MODULOS = ["Autoatención", "RAD", "VALS", "Portal SIRH", "FORCAP"];
  const compModRows = BIT_MODULOS.map((m) => {
    const rs = bitRows.filter((r) => (r.modulo || "").toLowerCase().includes(m.toLowerCase()));
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
  Charts.stackedBars(document.getElementById("chartCompromisosModulo"), compModRows, [
    { name: "Abiertos", color: "var(--status-warning)" },
    { name: "Cerrados", color: "var(--status-good)" },
    { name: "Archivados", color: "var(--text-muted)" },
  ]);

  // =========================================================== hero (arriba)
  // Se arma al final porque reutiliza valores ya calculados más arriba
  // (meta, avReq, bitTotal/bitAbiertos, sem) — el orden de ejecución no
  // afecta el resultado visual, solo el orden en que se completan los <div>.
  //
  // Plan de Trabajo — Fase 0 (P0-01): Estado general y Plazos ya NO se leen
  // del Excel (venían fijos en "NORMAL"/"Verde" sin relación con la realidad
  // de la Bitácora) — se recalculan en `sem` (más arriba) contra la fecha
  // del sistema. Ver UI.computeSemaforo en common.js para las reglas.
  const ESTADO_COLOR = { NORMAL: "var(--status-good)", "EN RIESGO": "var(--status-warning)", "CRÍTICO": "var(--status-critical)" };
  const PLAZOS_INFO = {
    Verde: { icon: "check-circle", color: "var(--status-good)" },
    Amarillo: { icon: "alert-triangle", color: "var(--status-warning)" },
    Rojo: { icon: "alert-circle", color: "var(--status-critical)" },
  };
  const plazosInfo = PLAZOS_INFO[sem.plazos] || PLAZOS_INFO.Verde;
  const estadoColor = ESTADO_COLOR[sem.estado] || "#fff";

  document.getElementById("heroStatus").innerHTML = [
    { icon: "activity", label: `Estado general: ${sem.estado}`, color: estadoColor, tip: sem.estadoRegla },
    { icon: plazosInfo.icon, label: `Plazos: ${sem.plazos}`, color: plazosInfo.color, tip: sem.plazosRegla },
  ]
    .map(
      (c) => `<span class="hero__chip" title="${UI.esc(c.tip)}"><span style="color:${c.color};display:flex">${Icons.svg(c.icon, { size: 15 })}</span>${UI.esc(c.label)}</span>`
    )
    .join("");

  const finalizadasTotal = meta.finalizados + (meta.finalizados_desfase || 0);
  const heroKpis = [
    {
      icon: "target", label: "Avance general del proyecto",
      value: UI.pct(meta.avance_progreso, 1),
      sub: `${UI.num(meta.total)} actividades planificadas`,
    },
    {
      icon: "file-text", label: "Total requerimientos",
      value: UI.num(totalReq),
      sub: `${UI.pct(avReq["% Avance (Listos)"], 0)} listos a la fecha`,
    },
    {
      icon: "check-circle", label: "Actividades completadas",
      value: `${UI.num(finalizadasTotal)} / ${UI.num(meta.total)}`,
      sub: `${UI.pct(meta.total ? finalizadasTotal / meta.total : 0, 1)} del cronograma`,
    },
    {
      // P0-02: reemplaza "Compromisos pendientes" (todos los abiertos) por
      // "Compromisos vencidos" (los que ya pasaron su fecha comprometida),
      // que es la señal accionable, con desglose por impacto.
      icon: "alert-octagon", label: "Compromisos vencidos", accent: sem.vencidosAlto > 0 ? "critical" : sem.totalVencidos > 0 ? "warning" : "good",
      value: UI.num(sem.totalVencidos),
      sub: `de ${UI.num(sem.totalAbiertos)} abiertos · ${sem.vencidosAlto} Alto · ${sem.vencidosMedio} Medio · ${sem.vencidosBajo} Bajo`,
      tip: "Registros de la Bitácora en estado \"Abierto\" cuya Fecha Comprometida ya pasó respecto de hoy.",
    },
  ];
  document.getElementById("heroKpis").innerHTML = heroKpis
    .map(
      (k) => `<div class="hero-kpi${k.accent ? " hero-kpi--" + k.accent : ""}">
        <div class="hero-kpi__icon">${Icons.svg(k.icon, { size: 18 })}</div>
        <div class="hero-kpi__value">${k.value}</div>
        <div class="hero-kpi__label">${UI.esc(k.label)}${k.tip ? UI.infoTip(k.tip) : ""}</div>
        <div class="hero-kpi__sub">${UI.esc(k.sub)}</div>
      </div>`
    )
    .join("");

  // fecha de última actualización, en el header
  document.getElementById("lastUpdate").textContent = "Actualizado: " + UI.dateEs(meta.actualizado);
})();

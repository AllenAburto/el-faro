/* ========================================================== glosario.js */
(function () {
  "use strict";
  const D = window.APP_DATA;

  const STATUS_TERMS = [
    "COMPLETAR", "Falta planificación", "Programado", "No iniciado",
    "Inicio anticipado", "En curso", "Inicio retrasado", "Atrasado",
    "Finalizado anticipado", "Finalizado", "Finalizado con desfase",
  ];
  const STATUS_ICON = {
    "COMPLETAR": "🚩", "Falta planificación": "🧩", "Programado": "📅", "No iniciado": "⏸️",
    "Inicio anticipado": "⏩", "En curso": "🔄", "Inicio retrasado": "🐢", "Atrasado": "🚨",
    "Finalizado anticipado": "🏁", "Finalizado": "✅", "Finalizado con desfase": "⏱️",
  };

  const generalTerms = D.glosario.filter((g) => !STATUS_TERMS.includes(g.Termino));
  const statusTerms = D.glosario.filter((g) => STATUS_TERMS.includes(g.Termino));

  document.getElementById("glossaryList").innerHTML = generalTerms
    .map((g) => `<dt>${UI.esc(g.Termino)}</dt><dd>${UI.esc(g.Definicion)}</dd>`)
    .join("");

  document.getElementById("tiposList").innerHTML =
    '<div class="legend" style="flex-direction:column;gap:8px">' +
    D.tipos.map((t) => `<span class="legend__item"><span class="legend__swatch" style="background:var(--series-1)"></span>${UI.esc(t["Tipo"])}</span>`).join("") +
    "</div>";

  document.getElementById("modulosList").innerHTML =
    '<div class="legend" style="flex-direction:column;gap:8px">' +
    D.modulos_lista.map((m) => `<span class="legend__item"><span class="legend__swatch" style="background:var(--series-3)"></span>${UI.esc(m["Módulo"])}</span>`).join("") +
    "</div>";

  document.getElementById("etapasList").innerHTML =
    '<div class="legend" style="flex-direction:column;gap:8px">' +
    D.etapas_lista.map((e) => `<span class="legend__item"><span class="legend__swatch" style="background:var(--series-7)"></span>${UI.esc(e["Etapa"])}</span>`).join("") +
    "</div>";

  document.getElementById("estadosGrid").innerHTML = statusTerms
    .map(
      (s) => `<div class="card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:16px">${STATUS_ICON[s.Termino] || "•"}</span>
          ${UI.statusBadge(s.Termino)}
        </div>
        <p style="margin:0;font-size:12.5px;color:var(--text-secondary);line-height:1.5">${UI.esc(s.Definicion)}</p>
      </div>`
    )
    .join("");

  // ------------------------------------------------------------- RACI
  const raci = D.raci_ejemplo;
  const cols = ["Resp. Estratégico", "Resp. Funcional", "Equipo Funcional", "Equipo Técnico", "Key Users"];
  const letterClass = { R: "r", A: "a", C: "c", I: "i" };
  function renderLetters(v) {
    if (!v) return "—";
    return v
      .split("/")
      .map((l) => `<span class="raci-letter ${letterClass[l.trim()] || ""}">${l.trim()}</span>`)
      .join("/");
  }
  document.getElementById("raciTable").innerHTML = `
    <thead><tr><th>Actividad</th>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>
      ${raci
        .map(
          (row) => `<tr><td class="strong" style="text-align:left">${UI.esc(row["Actividad"])}</td>${cols
            .map((c) => `<td>${renderLetters(row[c])}</td>`)
            .join("")}</tr>`
        )
        .join("")}
    </tbody>`;
})();

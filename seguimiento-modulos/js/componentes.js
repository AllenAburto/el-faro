/* ========================================================= componentes.js */
(function () {
  "use strict";
  const D = window.APP_DATA;

  const compSorted = D.resumen_componente.slice().sort((a, b) => b["% Avance"] - a["% Avance"]);

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

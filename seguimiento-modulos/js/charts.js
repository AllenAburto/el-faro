/* =========================================================================
   Charts — componentes de visualización en SVG/HTML puro (sin dependencias)
   ========================================================================= */
(function () {
  "use strict";

  const PALETTE = [
    "var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)",
    "var(--series-5)", "var(--series-6)", "var(--series-7)", "var(--series-8)",
  ];

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  /* ------------------------------------------------------ barra simple % */
  // rows: [{label, value(0..1 or raw), display, color}]
  function simpleBars(container, rows, opts) {
    opts = opts || {};
    const max = opts.max || Math.max(1, ...rows.map((r) => r.value));
    const wrap = el("div", "barchart");
    rows.forEach((r) => {
      const row = el("div", "barchart__row");
      const pctWidth = Math.max(0, Math.min(100, (r.value / max) * 100));
      row.innerHTML = `
        <div class="barchart__label" title="${UI.esc(r.label)}">${UI.esc(r.label)}</div>
        <div class="barchart__track">
          <div class="barchart__seg" style="width:${pctWidth}%; background:${r.color || "var(--series-1)"}"></div>
        </div>
        <div class="barchart__val">${r.display !== undefined ? r.display : r.value}</div>`;
      const track = row.querySelector(".barchart__track");
      track.style.cursor = "default";
      track.addEventListener("mousemove", (ev) => {
        UI.showTip(ev.clientX, ev.clientY, `<b>${UI.esc(r.label)}</b>${r.tooltip || r.display || r.value}`);
      });
      track.addEventListener("mouseleave", UI.hideTip);
      wrap.appendChild(row);
    });
    container.innerHTML = "";
    container.appendChild(wrap);
  }

  /* --------------------------------------------------- barra apilada (%) */
  // rows: [{label, segments:[{name,value,color}], total}]
  function stackedBars(container, rows, legendItems) {
    const wrap = el("div", "barchart");
    rows.forEach((r) => {
      const row = el("div", "barchart__row");
      const label = el("div", "barchart__label", UI.esc(r.label));
      label.title = r.label;
      const track = el("div", "barchart__track");
      const total = r.total || r.segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
      r.segments.forEach((seg, i) => {
        if (!seg.value) return;
        const w = (seg.value / total) * 100;
        const bar = el("div", "barchart__seg seg-gap");
        bar.style.width = w + "%";
        bar.style.background = seg.color;
        bar.addEventListener("mousemove", (ev) => {
          UI.showTip(
            ev.clientX,
            ev.clientY,
            `<b>${UI.esc(r.label)}</b>${UI.esc(seg.name)}: ${seg.value} (${(w).toFixed(1)}%)`
          );
        });
        bar.addEventListener("mouseleave", UI.hideTip);
        track.appendChild(bar);
      });
      const val = el("div", "barchart__val", r.total !== undefined ? r.total : total);
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(val);
      wrap.appendChild(row);
    });
    container.innerHTML = "";
    container.appendChild(wrap);
    if (legendItems) {
      const legend = el("div", "legend");
      legend.style.marginTop = "14px";
      legendItems.forEach((li) => {
        const item = el(
          "span",
          "legend__item",
          `<span class="legend__swatch" style="background:${li.color}"></span>${UI.esc(li.name)}`
        );
        legend.appendChild(item);
      });
      container.appendChild(legend);
    }
  }

  /* ---------------------------------------------------------------- dona */
  // segments: [{name, value, color}]
  function donut(container, segments, opts) {
    opts = opts || {};
    const size = opts.size || 160;
    const stroke = opts.stroke || 20;
    const r = (size - stroke) / 2;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;
    const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;

    let offset = 0;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.style.transform = "rotate(-90deg)";

    const bg = document.createElementNS(svgNS, "circle");
    bg.setAttribute("cx", c); bg.setAttribute("cy", c); bg.setAttribute("r", r);
    bg.setAttribute("fill", "none");
    bg.setAttribute("stroke", "var(--gridline)");
    bg.setAttribute("stroke-width", stroke);
    svg.appendChild(bg);

    segments.forEach((seg) => {
      if (!seg.value) return;
      const frac = seg.value / total;
      const gap = 2; // px gap between segments
      const len = Math.max(0, frac * circumference - gap);
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", c); circle.setAttribute("cy", c); circle.setAttribute("r", r);
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", seg.color);
      circle.setAttribute("stroke-width", stroke);
      circle.setAttribute("stroke-linecap", "round");
      circle.setAttribute("stroke-dasharray", `${len} ${circumference - len}`);
      circle.setAttribute("stroke-dashoffset", -offset);
      circle.style.cursor = "default";
      circle.addEventListener("mousemove", (ev) => {
        UI.showTip(ev.clientX, ev.clientY, `<b>${UI.esc(seg.name)}</b>${seg.value} (${UI.pct(frac, 1)})`);
      });
      circle.addEventListener("mouseleave", UI.hideTip);
      svg.appendChild(circle);
      offset += frac * circumference;
    });

    const figure = el("div", "donut-figure");
    figure.style.width = size + "px";
    figure.style.height = size + "px";
    figure.appendChild(svg);
    if (opts.centerValue !== undefined) {
      const center = el(
        "div",
        "donut-center",
        `<strong>${UI.esc(opts.centerValue)}</strong><span>${UI.esc(opts.centerLabel || "")}</span>`
      );
      figure.appendChild(center);
    }

    const wrap = el("div", "donut-wrap");
    wrap.appendChild(figure);
    const legend = el("div", "legend");
    legend.style.flexDirection = "column";
    legend.style.gap = "10px";
    segments.forEach((seg) => {
      const frac = seg.value / total;
      const item = el(
        "div",
        "legend__item",
        `<span class="legend__swatch" style="background:${seg.color}"></span>
         <span style="min-width:118px;display:inline-block">${UI.esc(seg.name)}</span>
         <strong style="font-variant-numeric:tabular-nums">${seg.value}</strong>
         <span class="text-muted" style="font-variant-numeric:tabular-nums">(${UI.pct(frac, 1)})</span>`
      );
      legend.appendChild(item);
    });
    wrap.appendChild(legend);

    container.innerHTML = "";
    container.appendChild(wrap);
  }

  window.Charts = { simpleBars, stackedBars, donut, PALETTE };
})();

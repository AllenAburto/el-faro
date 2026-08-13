# Seguimiento Nuevos Módulos SIRH — manual de mantenimiento

Portal estático de seguimiento del proyecto "Nuevos Módulos SIRH" (MINSAL).
Publicado en GitHub Pages:
**https://allenaburto.github.io/el-faro/seguimiento-modulos/**

Este documento existe porque el portal lo mantiene una sola persona
(riesgo de "bus factor"). Si te toca continuar este trabajo sin haber
participado en su construcción, esta página debería bastar para que
puedas actualizar datos, corregir un bug o agregar una función sin tener
que releer todo el código primero.

## 1. Qué es esto, en una frase

Un sitio 100% estático (HTML + CSS + JS, sin build step, sin framework,
sin backend) que lee todos sus datos desde un único archivo JavaScript
(`js/app-data.js`) generado a partir del Excel maestro
(`Seguimiento_Nuevos_Modulos_V2_Dashboard.xlsx`, versionado en este
mismo repo). Se despliega automáticamente a GitHub Pages en cada push a
`main`.

## 2. Mapa de archivos

```
seguimiento-modulos/
├── Seguimiento_Nuevos_Modulos_V2_Dashboard.xlsx   ← fuente de verdad de los datos
├── index.html            Resumen (dashboard con Hero KPI + gráficos)
├── etapas.html            294 actividades del cronograma (filtro + alta + edición)
├── requerimientos.html   Requerimientos por módulo (filtro + alta + edición)
├── bitacora.html          Compromisos/reuniones (filtro + alta + edición)
├── componentes.html       Avance por Componente/Subetapa (solo lectura)
├── glosario.html           Glosario, catálogos y matriz RACI (solo lectura)
├── css/style.css          Todo el CSS del sitio (un solo archivo)
├── js/
│   ├── app-data.js         Datos — GENERADO por scripts/extract.py, no editar a mano
│   ├── common.js           window.UI — utilidades compartidas (ver sección 5)
│   ├── icons.js             window.Icons — librería de íconos SVG
│   ├── local-records.js    window.Store — CRUD en localStorage (ver sección 6)
│   ├── charts.js            window.Charts — barras/donut/etc. hechos con <div>, sin librería
│   ├── dashboard.js, etapas.js, requerimientos.js, bitacora.js,
│   │   componentes.js, glosario.js   controladores de cada página
└── scripts/
    ├── extract.py           Excel → js/app-data.js
    ├── validate.py          valida js/app-data.js, falla el build si hay errores
    └── requirements.txt
```

Y en la raíz del repo: `.github/workflows/deploy-pages.yml` (el pipeline
de despliegue) — es lo único que corre en un servidor; todo lo demás es
HTML/JS que corre en el navegador de quien visita el sitio.

## 3. Cómo actualizar los datos (lo que vas a hacer más seguido)

Los datos **no se editan directamente en `js/app-data.js`** — ese archivo
es un artefacto generado. El flujo correcto:

1. Edita `Seguimiento_Nuevos_Modulos_V2_Dashboard.xlsx` (la hoja que
   corresponda: Indicadores, Etapas, Bitácora, Req. \*, Tablas y Glosario).
2. Corre el pipeline localmente para revisar antes de subir:
   ```bash
   cd seguimiento-modulos
   pip install -r scripts/requirements.txt
   python3 scripts/extract.py            # regenera js/app-data.js
   python3 scripts/validate.py           # revisa calidad de datos
   ```
   Si `validate.py` termina con `exit code 1`, hay un ERROR que hay que
   corregir antes de subir (mira la sección "ERRORES" que imprime). Las
   "ADVERTENCIAS" no bloquean nada — son hallazgos ya documentados,
   pendientes de que el equipo funcional los corrija en el Excel (ver
   sección 8).
3. Sube el `.xlsx` y el `js/app-data.js` regenerado, o simplemente sube
   solo el `.xlsx`: el GitHub Action (`deploy-pages.yml`) corre
   `extract.py` + `validate.py` automáticamente en cada push a `main`, así
   que el sitio publicado siempre queda sincronizado con el Excel
   versionado — no dependas de acordarte de regenerar `app-data.js` a mano.
4. Si `validate.py` falla en el Action, el despliegue se cancela (revisa
   la pestaña Actions del repo para ver el error).

**Nunca edites `js/app-data.js` a mano** — el próximo `extract.py` (local
o en CI) lo va a sobrescribir igual, y mientras tanto queda desincronizado
del Excel.

## 4. Cache-busting — bumpear la versión en cada cambio de JS/CSS

Todas las etiquetas `<script src="...">` y `<link href="...">` de las 6
páginas HTML llevan un query string `?v=YYYYMMDDx` (ej. `?v=20260813c`).
**Cada vez que cambies cualquier archivo en `css/` o `js/`, sube ese
número** (misma fecha + siguiente letra, o la fecha del día si es un día
distinto) **en las 6 páginas HTML a la vez**. Si no lo haces, GitHub
Pages/el navegador de quien visita el sitio puede seguir sirviendo una
versión cacheada del archivo viejo — esto ya causó un bug real de "no
carga nada" en una sesión anterior. Un one-liner útil:

```bash
grep -rl "v=VIEJO" *.html | xargs sed -i 's/v=VIEJO/v=NUEVO/g'
```

## 5. `window.UI` (`js/common.js`) — qué hay ahí

Utilidades compartidas por todas las páginas. Las más importantes:

- **Formato**: `pct(v, digits)`, `num(v)`, `dateEs(v)`, `esc(s)` (escape HTML).
- **Estados**: `statusBadge(value)` / `statusColor(value)` — mapean los 11
  estados de actividad + otros catálogos (Listo/Maqueta/Pendiente/Observado,
  Abierto/Cerrado/Archivado, Alto/Medio/Bajo) a un badge de color.
- **Semáforo real** (`todayIso`, `isVencido`, `computeSemaforo`) — recalcula
  Estado general/Plazos en cada carga contra la Bitácora real y la fecha
  del sistema, en vez de leer el valor congelado del Excel. Ver sección 7.
- **Catálogo canónico de módulos** (`CANONICAL_MODULOS`, `normalizeModulo`,
  `moduloTokens`, `moduloDisplay`, `moduloMatches`) y
  **normalización de responsable** (`normalizeResponsable`) — corrigen
  variantes de escritura del Excel (`"Autoatención"` vs `"AutoAtención"`,
  espacios finales en nombres) solo para mostrar/agrupar, sin tocar el
  Excel. Si agregas un módulo nuevo al catálogo del proyecto, agrégalo
  también a `CANONICAL_MODULOS`/`MODULO_ALIASES` aquí (y al equivalente en
  `scripts/validate.py`, deben mantenerse sincronizados a mano).
- **Avance ponderado** (`weightedAvance(row)`) — para filas de
  `resumen_etapa`/`resumen_modulo`, calcula un avance que también cuenta
  parcialmente lo "En curso"/"Atrasado", no solo lo "Finalizado".
- **Modal genérico** (`openModal`/`closeModal`) — lo usan
  etapas.js/requerimientos.js/bitacora.js para el formulario de alta/edición.
- **Búsqueda global** (Ctrl+K) — índice construido una vez desde
  `window.APP_DATA`, filtra en el cliente.
- **Banner de cambios sin exportar** (`initGlobalDirtyBanner`) — visible en
  las 6 páginas, lee `localStorage` directo (no depende de que
  `local-records.js` esté cargado en esa página).

## 6. `window.Store` (`js/local-records.js`) — el sistema de edición local

**Importante de entender**: este sitio es 100% estático — no hay backend
ni base de datos. Cuando alguien crea/edita/elimina un registro en
Etapas, Requerimientos o Bitácora, el cambio se guarda **solo en el
`localStorage` de su propio navegador** (clave `sm-store::<coleccion>`,
formato `{edits: {}, additions: [], deletions: []}`). Nadie más ve esos
cambios, y se pierden si limpian el navegador.

El flujo pensado para que esos cambios lleguen al Excel maestro es
manual: la persona que edita usa el botón **"Exportar cambios"** (hoy
solo en Bitácora — ver más abajo) para descargar un JSON con sus
ediciones/altas/bajas, se lo envía a quien mantiene el Excel, y esa
persona los aplica a mano. Desde la Fase 2 del Plan de Trabajo, ese JSON
incluye un campo `version_datos` con la fecha del Excel sobre el que se
hicieron los cambios (el mismo `dashboard_meta.actualizado`) — sirve para
notar si el export quedó desactualizado antes de aplicarlo a ciegas.

`Store.exportChanges()` solo está conectada a un botón en `bitacora.html`
hoy — Etapas y Requerimientos tienen "Restablecer cambios" pero no
"Exportar". Si se vuelve un problema real (gente pierde ediciones sin
poder mandarlas), agregar el mismo botón ahí es sencillo: llamar
`Store.exportChanges(STORE_KEY, "archivo.json")` como ya hace `bitacora.js`.

## 7. El "semáforo" (Estado general / Plazos) — por qué se recalcula

Hasta la Fase 0 del Plan de Trabajo, el hero mostraba "Estado general:
NORMAL" / "Plazos: Verde" leyendo un valor **congelado** del Excel, sin
relación con la realidad (el Excel podía decir "Verde" con 48
compromisos vencidos en la Bitácora). Ahora `UI.computeSemaforo()`
recalcula ambos valores **en cada carga de página**, contra la fecha del
sistema, con reglas explícitas (visibles en el tooltip de cada chip del
hero — ver el código en `common.js` para el detalle exacto). El valor
`dashboard_meta.estado_general`/`.plazos` que trae `app-data.js` (calculado
por el Excel) se conserva en los datos solo como referencia/histórico,
la interfaz ya no lo usa para el semáforo visible.

## 8. Calidad de datos conocida — qué está pendiente y dónde

`scripts/validate.py` es la fuente de verdad actualizada sobre qué
problemas de datos existen hoy en el Excel maestro. Corre
`python3 scripts/validate.py` para ver la lista vigente. A la fecha de
este documento, las advertencias conocidas (no bloquean el despliegue,
pendientes de que el equipo funcional las corrija en el Excel) son:

- 4 ids duplicados (64-67) en la hoja "Req. AutoAtención".
- 5 filas con `Id Requerimiento = "XXXXXXX"` (placeholder) en esa misma hoja.
- 60 requerimientos (RAD + LM + Calificaciones) sin "Estado QA".
- 276 de 294 actividades sin "Fecha Fin Máxima" real (son fechas de
  relleno correlativas, no una planificación real — por eso el portal
  evita mostrar métricas de "atraso vs. línea base": serían falsas).

Estos son los mismos hallazgos documentados en el "Plan de Trabajo —
Portal de Seguimiento Nuevos Módulos SIRH" (Fase 1/Fase 3), sección
"Regla de oro": son problemas del **contenido del Excel**, no del código
del portal, y requieren que alguien con el contexto funcional decida
cómo corregirlos (no son ambigüedades que el código pueda resolver por
su cuenta sin inventar datos).

## 9. Convenciones del código

- **Sin build step, sin dependencias externas** — todo el JS es vanilla,
  cargado con `<script src>` plano. No hay `npm install` ni bundler.
- **Un IIFE por archivo JS**, expone su API pública (si la tiene) en
  `window.<Nombre>` (`UI`, `Store`, `Charts`, `Icons`).
- **Diseño con CSS custom properties** (`css/style.css`, bloque `:root`):
  paleta de color, tipografía y layout centralizados en variables. El
  modo oscuro se define dos veces — una vez bajo
  `@media (prefers-color-scheme: dark)` (para quien no eligió tema
  explícito) y otra vez bajo `:root[data-theme="dark"]` (para el toggle
  manual) — si agregas o cambias un color, actualiza **ambos** bloques o
  el modo oscuro queda inconsistente.
- **Contraste**: los textos secundarios usan `--text-secondary` /
  `--text-muted`, ya auditados para AA (4.5:1) en ambos temas — si agregas
  un color de texto nuevo, verifica el contraste contra el fondo real
  antes de usarlo (herramienta: cualquier calculadora de contraste WCAG).
- **Accesibilidad**: el link de navegación activo lleva `aria-current="page"`
  además de la clase visual `.active` (`UI.initNav()`); los tooltips
  (`.info-tip`) son enfocables por teclado (`tabindex="0"`). Pendiente:
  los gráficos (`js/charts.js`) son `<div>` con color, sin tabla de datos
  alternativa ni `aria-label` — no son accesibles a lectores de pantalla
  hoy (ver Plan de Trabajo, Fase 5, P5-02/P5-03).
- **No hay suite de pruebas automatizada.** La verificación de cada
  cambio se hace manualmente con Playwright (captura de errores de
  consola en las 6 páginas + capturas de pantalla) antes de cada commit.
  Si el proyecto crece, valdría la pena formalizar esos scripts de
  verificación en `scripts/` junto al resto del pipeline.

## 10. Cómo agregar una página nueva

1. Copia la estructura de una página existente (header + nav + `<script>`
   tags al final, mismo orden: `app-data.js` → `icons.js` → `common.js` →
   [`local-records.js` si vas a editar datos] → [`charts.js` si vas a graficar] →
   tu-pagina.js).
2. Agrega el link en `.app-nav` de **las 6 páginas** (no hay un
   include/partial — el header se repite literal en cada HTML).
3. Si tu página necesita datos nuevos que no existen en el Excel, agrégalos
   primero ahí, actualiza `scripts/extract.py` para extraerlos, y
   `scripts/validate.py` si aplican reglas de calidad.
4. Bumpea el cache-busting (sección 4) en las 6 páginas.

---
_Última actualización de este documento: agosto de 2026, como parte de la
Fase 5 del Plan de Trabajo — Portal de Seguimiento Nuevos Módulos SIRH._

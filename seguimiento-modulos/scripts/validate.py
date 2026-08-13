#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate.py — Control de calidad de datos para el pipeline del portal.

Plan de Trabajo — Fase 2 (P2-03). Se ejecuta después de `extract.py` (en
local o en el GitHub Action de despliegue) y revisa `js/app-data.js` contra
un conjunto de reglas explícitas. Distingue dos niveles:

  ERROR — el build falla (exit code 1). Reservado para problemas que
          romperían el portal o indican un bug en extract.py: ids
          duplicados donde nunca deberían darse, un Módulo o Estado que la
          interfaz no sabe interpretar, fechas no-ISO, o un total de
          actividades que no cuadra con las filas reales.

  WARN  — se imprime pero NO rompe el build. Reservado para problemas de
          contenido ya conocidos y documentados como pendientes de
          corregir en el Excel maestro por el equipo funcional (ver
          "Regla de oro" y sección de hallazgos del Plan de Trabajo,
          Fase 1). Bloquear el despliegue por estos no ayuda: el
          portal ya los sobrelleva (badges "—", `normalizeModulo` con
          fallback, etc.) y bloquear cada deploy hasta que gestión
          corrija el Excel dejaría el sitio sin poder publicar nada.

Uso:
    python3 scripts/validate.py
    python3 scripts/validate.py --app-data js/app-data.js
"""
import argparse
import json
import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent

# Debe reflejar UI.CANONICAL_MODULOS / MODULO_ALIASES en js/common.js.
CANONICAL_MODULOS = {
    "AutoAtención", "Licencias Médicas", "FORCAP", "Calificaciones",
    "RAD", "VALS", "Portal SIRH", "Observatorio",
}
MODULO_ALIASES = {
    "autoatencion": "AutoAtención",
    "auto atencion": "AutoAtención",
    "lm": "Licencias Médicas",
    "licencias medicas": "Licencias Médicas",
    "forcap": "FORCAP",
    "calificaciones": "Calificaciones",
    "rad": "RAD",
    "vals": "VALS",
    "portal sirh": "Portal SIRH",
    "observatorio": "Observatorio",
}

# Debe reflejar STATUS_TERMS en js/glosario.js (fórmula "Estado" del Excel).
ETAPA_ESTADOS = {
    "COMPLETAR", "Falta planificación", "Programado", "No iniciado",
    "Inicio anticipado", "En curso", "Inicio retrasado", "Atrasado",
    "Finalizado anticipado", "Finalizado", "Finalizado con desfase",
}
BITACORA_ESTADOS = {"Abierto", "Cerrado", "Archivado"}
BITACORA_IMPACTOS = {"Alto", "Medio", "Bajo"}

ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

REQ_SHEETS = [
    "req_autoatencion", "req_rad", "req_lm", "req_calificaciones",
    "req_forcap", "req_portal", "req_vals",
]


def strip_accents(s):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def normalize_modulo(raw):
    key = strip_accents(str(raw or "").strip().lower())
    if not key:
        return ""
    return MODULO_ALIASES.get(key, str(raw).strip())


def modulo_tokens(raw):
    if not raw:
        return []
    parts = re.split(r"[,/]| y ", str(raw), flags=re.IGNORECASE)
    out = []
    for p in parts:
        n = normalize_modulo(p.strip())
        if n and n not in out:
            out.append(n)
    return out


def load_app_data(path: Path) -> dict:
    content = path.read_text(encoding="utf-8")
    m = re.search(r"window\.APP_DATA\s*=\s*", content)
    if not m:
        raise SystemExit(f"No se encontró 'window.APP_DATA =' en {path}")
    end = content.rfind(";")
    return json.loads(content[m.end():end])


class Report:
    def __init__(self):
        self.errors = []
        self.warnings = []

    def error(self, rule, msg):
        self.errors.append(f"[{rule}] {msg}")

    def warn(self, rule, msg):
        self.warnings.append(f"[{rule}] {msg}")


def check_ids(data, rep: Report):
    """R1 — unicidad de ids."""
    for key in ("etapas", "bitacora"):
        ids = [r.get("id") for r in data.get(key, [])]
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        if dupes:
            # Los ids de etapas/bitacora se generan en extract.py (et-N /
            # bit-N) a partir de la fila — un duplicado aquí solo puede
            # deberse a un bug del script, nunca al Excel de origen.
            rep.error("R1-ids", f"{key}: ids duplicados generados por extract.py: {dupes}")

    for key in REQ_SHEETS:
        ids = [r.get("id") for r in data.get(key, []) if r.get("id") is not None]
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        if dupes:
            # Columna "id" real del Excel (hoja Req. *) — el caso conocido
            # es Req. AutoAtención filas 64-67 (P1-04 del plan, pendiente
            # de corrección en el Excel maestro por el equipo funcional).
            rep.warn("R1-ids", f"{key}: ids duplicados en el Excel de origen: {dupes} (ver P1-04 del Plan de Trabajo)")


def check_modulos(data, rep: Report):
    """R2 — módulo dentro del catálogo canónico."""
    for r in data.get("etapas", []):
        m = r.get("Módulo")
        if m and m not in CANONICAL_MODULOS:
            rep.error("R2-modulo", f"etapas id={r.get('id')}: Módulo {m!r} no está en el catálogo canónico {sorted(CANONICAL_MODULOS)}")

    unknown_bit = []
    for r in data.get("bitacora", []):
        raw = r.get("modulo")
        if not raw:
            continue
        for tok in modulo_tokens(raw):
            if tok not in CANONICAL_MODULOS:
                unknown_bit.append((r.get("id"), raw, tok))
    if unknown_bit:
        # La Bitácora es texto más libre; el portal ya normaliza con
        # fallback (UI.normalizeModulo) así que esto no rompe nada, pero
        # vale la pena revisarlo — puede ser un módulo nuevo sin alias.
        sample = unknown_bit[:5]
        rep.warn("R2-modulo", f"bitacora: {len(unknown_bit)} registro(s) con token de módulo no reconocido, ej: {sample}")


def check_estados(data, rep: Report):
    """R3 — estado dentro del catálogo del glosario."""
    for r in data.get("etapas", []):
        e = r.get("Estado")
        if e and e not in ETAPA_ESTADOS:
            rep.error("R3-estado", f"etapas id={r.get('id')}: Estado {e!r} no está en el catálogo de 11 estados del glosario")

    for r in data.get("bitacora", []):
        e = r.get("estado")
        if e and e not in BITACORA_ESTADOS:
            rep.error("R3-estado", f"bitacora id={r.get('id')}: estado {e!r} no está en {sorted(BITACORA_ESTADOS)}")
        imp = r.get("impacto")
        if imp and imp not in BITACORA_IMPACTOS:
            rep.error("R3-estado", f"bitacora id={r.get('id')}: impacto {imp!r} no está en {sorted(BITACORA_IMPACTOS)}")


def check_dates(data, rep: Report):
    """R4 — fechas en formato ISO y coherentes (fin >= inicio)."""
    def iso_ok(v):
        return v is None or v == "" or bool(ISO_DATE_RE.match(str(v)))

    for r in data.get("etapas", []):
        for k in ("Fecha Inicio Programada", "Fecha Inicio Real", "Fecha Fin Máxima", "Fecha Fin Real"):
            v = r.get(k)
            if v and not iso_ok(v):
                rep.error("R4-fechas", f"etapas id={r.get('id')}: {k}={v!r} no tiene formato ISO (YYYY-MM-DD)")
        ini, fin = r.get("Fecha Inicio Real"), r.get("Fecha Fin Real")
        if ini and fin and iso_ok(ini) and iso_ok(fin) and fin < ini:
            rep.warn("R4-fechas", f"etapas id={r.get('id')}: Fecha Fin Real ({fin}) es anterior a Fecha Inicio Real ({ini})")
        inip, finm = r.get("Fecha Inicio Programada"), r.get("Fecha Fin Máxima")
        if inip and finm and iso_ok(inip) and iso_ok(finm) and finm < inip:
            rep.warn("R4-fechas", f"etapas id={r.get('id')}: Fecha Fin Máxima ({finm}) es anterior a Fecha Inicio Programada ({inip})")

    for r in data.get("bitacora", []):
        for k in ("fecha_registro", "fecha_comprometida", "fecha_real", "fecha_real_cierre"):
            v = r.get(k)
            if v and not iso_ok(v):
                rep.error("R4-fechas", f"bitacora id={r.get('id')}: {k}={v!r} no tiene formato ISO (YYYY-MM-DD)")


def check_dashboard_meta(data, rep: Report):
    """R5 — dashboard_meta.total coincide con el número real de actividades."""
    meta = data.get("dashboard_meta", {})
    total_real = len(data.get("etapas", []))
    total_meta = meta.get("total")
    if total_meta != total_real:
        rep.error("R5-meta", f"dashboard_meta.total={total_meta!r} no coincide con el total real de etapas ({total_real})")

    # Chequeo blando: la suma de los 9 contadores conocidos debería ser el
    # total. Se deja como WARN (no ERROR) porque el Excel distingue 11
    # estados y dashboard_meta solo expone 9 contadores — "Inicio
    # anticipado" y "Finalizado anticipado" no tienen un contador propio
    # documentado y podrían sumarse a "en_curso"/"finalizados". Mientras
    # esos dos estados no aparezcan en los datos reales esto no genera
    # falsos positivos; si algún día aparecen, este WARN lo hará visible
    # sin bloquear el despliegue.
    known_keys = [
        "finalizados", "finalizados_desfase", "en_curso", "inicio_retrasado",
        "programado", "no_iniciado", "atrasados", "no_planificado", "completar_info",
    ]
    suma = sum((meta.get(k) or 0) for k in known_keys)
    if total_meta is not None and suma != total_meta:
        rep.warn("R5-meta", f"la suma de los 9 contadores conocidos ({suma}) no coincide con dashboard_meta.total ({total_meta}) — revisar si aparecieron actividades 'Inicio anticipado' o 'Finalizado anticipado'")


def check_fecha_fin_maxima(data, rep: Report):
    """R6 — toda actividad no finalizada debería tener Fecha Fin Máxima.

    Deliberadamente solo WARN, nunca ERROR: el propio Plan de Trabajo
    señala que esta regla "solo se activa una vez cierre la Fase 3" (P3-01,
    levantar fechas fin máximas reales con el equipo funcional). Hoy la
    inmensa mayoría de las 294 filas no la tiene — es un hallazgo
    documentado, no un bug del pipeline.
    """
    finalizado_like = {"Finalizado", "Finalizado anticipado", "Finalizado con desfase"}
    faltantes = [
        r.get("id") for r in data.get("etapas", [])
        if r.get("Estado") not in finalizado_like and not r.get("Fecha Fin Máxima")
    ]
    if faltantes:
        rep.warn(
            "R6-fecha-fin-maxima",
            f"{len(faltantes)} actividad(es) no finalizada(s) sin Fecha Fin Máxima "
            f"(pendiente de P3-01 del Plan de Trabajo — gestión, no código)",
        )


def check_req_known_issues(data, rep: Report):
    """Hallazgos adicionales del Plan de Trabajo (Fase 1) sobre las hojas
    Req. * — no forman parte de las 6 reglas P2-03 originales, pero se
    incluyen aquí para que el pipeline sea la fuente única de verdad sobre
    qué está pendiente de corregir en el Excel maestro (P1-05, P1-06)."""
    for key in REQ_SHEETS:
        rows = data.get(key, [])
        placeholders = [r.get("id") for r in rows if r.get("Id Requerimiento") == "XXXXXXX"]
        if placeholders:
            rep.warn("P1-05-placeholder", f"{key}: {len(placeholders)} fila(s) con Id Requerimiento = 'XXXXXXX' (ids internos: {placeholders}, ver P1-05 del Plan de Trabajo)")

        if any("Estado QA" in r for r in rows):
            faltan_qa = sum(1 for r in rows if not r.get("Estado QA"))
            if faltan_qa:
                rep.warn("P1-06-estado-qa", f"{key}: {faltan_qa} requerimiento(s) sin Estado QA (ver P1-06 del Plan de Trabajo)")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--app-data", default=str(ROOT_DIR / "js" / "app-data.js"))
    args = ap.parse_args()

    path = Path(args.app_data)
    if not path.exists():
        raise SystemExit(f"No se encontró {path} (¿corriste extract.py primero?)")

    data = load_app_data(path)
    rep = Report()

    check_ids(data, rep)
    check_modulos(data, rep)
    check_estados(data, rep)
    check_dates(data, rep)
    check_dashboard_meta(data, rep)
    check_fecha_fin_maxima(data, rep)
    check_req_known_issues(data, rep)

    print(f"validate.py — {path}")
    print(f"  {len(rep.errors)} error(es), {len(rep.warnings)} advertencia(s)\n")

    if rep.warnings:
        print("ADVERTENCIAS (no bloquean el despliegue — hallazgos de datos ya documentados):")
        for w in rep.warnings:
            print(f"  ⚠ {w}")
        print()

    if rep.errors:
        print("ERRORES (bloquean el despliegue):")
        for e in rep.errors:
            print(f"  ✗ {e}")
        print()
        print("FALLÓ — corrige los errores arriba antes de desplegar.")
        sys.exit(1)

    print("OK — sin errores. El build puede continuar.")
    sys.exit(0)


if __name__ == "__main__":
    main()

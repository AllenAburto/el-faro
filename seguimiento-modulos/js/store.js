/* =============================================================================
   store.js — capa de registro/edición local (CRUD) para un sitio 100% estático.

   Este dashboard se publica en GitHub Pages sin backend ni base de datos: no hay
   dónde "guardar" un alta/edición/baja de forma compartida. Por eso el registro
   de cambios se guarda en localStorage del navegador (persiste entre visitas en
   el mismo equipo/navegador, pero NO se sincroniza entre personas ni con el
   Excel maestro). Cada colección editable expone:
     - Store.list(key, base, idField)        -> arreglo "vivo" (base + cambios)
     - Store.create(key, record, idField)    -> agrega un registro nuevo
     - Store.update(key, id, patch, idField) -> aplica cambios a un registro
     - Store.remove(key, id, idField)        -> marca un registro como eliminado
     - Store.resetOne(key, id)               -> deshace los cambios de 1 registro
     - Store.resetAll(key)                   -> deshace TODOS los cambios de la colección
     - Store.isDirty(key)                    -> true si hay cambios sin exportar
     - Store.exportChanges(key, filename)    -> descarga los cambios en JSON
   para que el equipo pueda enviarlos y así incorporarlos al Excel maestro.
   ========================================================================= */
(function () {
  "use strict";

  const PREFIX = "sm-store::";

  function loadRaw(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return { edits: {}, additions: [], deletions: [] };
      const parsed = JSON.parse(raw);
      return {
        edits: parsed.edits || {},
        additions: parsed.additions || [],
        deletions: parsed.deletions || [],
      };
    } catch (e) {
      console.warn("Store: no se pudo leer", key, e);
      return { edits: {}, additions: [], deletions: [] };
    }
  }

  function saveRaw(key, data) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.warn("Store: no se pudo guardar (¿localStorage lleno o deshabilitado?)", e);
    }
    document.dispatchEvent(new CustomEvent("store:change", { detail: { key } }));
  }

  function uid() {
    return "loc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function list(key, base, idField) {
    idField = idField || "id";
    const st = loadRaw(key);
    const delSet = new Set(st.deletions);
    const out = [];
    base.forEach((row) => {
      const id = row[idField];
      if (delSet.has(String(id))) return;
      const patch = st.edits[id];
      out.push(patch ? Object.assign({}, row, patch, { _edited: true }) : row);
    });
    st.additions.forEach((row) => out.push(Object.assign({ _local: true }, row)));
    return out;
  }

  function create(key, record, idField) {
    idField = idField || "id";
    const st = loadRaw(key);
    const row = Object.assign({}, record);
    if (!row[idField]) row[idField] = uid();
    st.additions.push(row);
    saveRaw(key, st);
    return row[idField];
  }

  function update(key, id, patch, idField) {
    idField = idField || "id";
    const st = loadRaw(key);
    const idx = st.additions.findIndex((r) => String(r[idField]) === String(id));
    if (idx !== -1) {
      st.additions[idx] = Object.assign({}, st.additions[idx], patch);
    } else {
      st.edits[id] = Object.assign({}, st.edits[id], patch);
    }
    saveRaw(key, st);
  }

  function remove(key, id, idField) {
    idField = idField || "id";
    const st = loadRaw(key);
    const idx = st.additions.findIndex((r) => String(r[idField]) === String(id));
    if (idx !== -1) {
      st.additions.splice(idx, 1);
    } else {
      if (!st.deletions.includes(String(id))) st.deletions.push(String(id));
      delete st.edits[id];
    }
    saveRaw(key, st);
  }

  function resetOne(key, id) {
    const st = loadRaw(key);
    delete st.edits[id];
    st.deletions = st.deletions.filter((d) => d !== String(id));
    st.additions = st.additions.filter((r) => String(r.id) !== String(id));
    saveRaw(key, st);
  }

  function resetAll(key) {
    saveRaw(key, { edits: {}, additions: [], deletions: [] });
  }

  function isDirty(key) {
    const st = loadRaw(key);
    return (
      Object.keys(st.edits).length > 0 || st.additions.length > 0 || st.deletions.length > 0
    );
  }

  function counts(key) {
    const st = loadRaw(key);
    return {
      edits: Object.keys(st.edits).length,
      additions: st.additions.length,
      deletions: st.deletions.length,
      total: Object.keys(st.edits).length + st.additions.length + st.deletions.length,
    };
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportChanges(key, filename) {
    const st = loadRaw(key);
    const payload = {
      coleccion: key,
      exportado: new Date().toISOString(),
      ediciones: st.edits,
      altas: st.additions,
      eliminaciones: st.deletions,
    };
    download(filename || `cambios_${key}.json`, JSON.stringify(payload, null, 2));
  }

  window.Store = {
    list, create, update, remove, resetOne, resetAll, isDirty, counts, exportChanges,
  };
})();

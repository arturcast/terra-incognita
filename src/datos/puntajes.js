/**
 * puntajes.js — El recuento de la expedición y la tabla de los mejores.
 *
 * Puro, salvo el almacén, que se inyecta (localStorage en el navegador, un
 * objeto de mentira en las pruebas). La tabla vive en el computador del
 * stand: no hace falta internet, y quien vuelve al día siguiente se encuentra.
 *
 * Puntos por etapa:
 *   El Mapa     — solo lo juega el Jugador 1: su nota total (0-100) × 10.
 *   El Camino   — los puntos de su carrera.
 *   El Regreso  — los puntos de su vuelo.
 */

/**
 * Dónde se guarda la tabla. La versión va en el nombre: al cambiarla, la
 * tabla vieja se borra sola al arrancar (así se limpiaron los puntajes de
 * prueba el 2026-09-26). Para vaciarla en el stand: panel de mandos (tecla J)
 * → «Borrar tabla de puntajes».
 */
export const CLAVE_TABLA = 'ti.mejores.v2';
const CLAVES_VIEJAS = ['ti.mejores'];
export const MAX_TABLA = 50;       // se guardan 50; se muestran los 10 primeros
export const MAX_NOMBRE = 10;

export const ETAPAS_RECUENTO = [
  { id: 'mapa', nombre: 'El Mapa' },
  { id: 'camino', nombre: 'El Camino' },
  { id: 'regreso', nombre: 'El Regreso' },
];

/** Lo que alcanzó cada jugador en cada etapa. null = no jugó esa etapa. */
export function recuento(puntajes = {}) {
  const camino = (puntajes.camino && puntajes.camino.resultados) || [];
  const regreso = (puntajes.regreso && puntajes.regreso.resultados) || [];
  const n = Math.max(1, camino.length, regreso.length);
  const jugadores = [];
  for (let k = 0; k < n; k++) {
    const porEtapa = {
      mapa: k === 0 && puntajes.mapa ? Math.round((puntajes.mapa.total || 0) * 10) : null,
      camino: camino[k] ? camino[k].puntos : null,
      regreso: regreso[k] ? regreso[k].puntos : null,
    };
    const total = Object.values(porEtapa).reduce((a, v) => a + (v || 0), 0);
    jugadores.push({ jugador: k + 1, porEtapa, total, titulo: titulo(total) });
  }
  let ganador = -1;
  if (n > 1) {
    const [a, b] = jugadores;
    ganador = a.total === b.total ? -1 : a.total > b.total ? 0 : 1;
  }
  return { jugadores, ganador };
}

/** Cómo le fue, en una frase corta, según su total. */
export function titulo(total) {
  if (total >= 5000) return 'Leyenda del territorio';
  if (total >= 3000) return 'Gran explorador';
  if (total >= 1500) return 'Buena expedición';
  return 'Primera expedición';
}

/** Nombre limpio: mayúsculas, sin espacios de sobra, con tope de largo. */
export function limpiarNombre(nombre) {
  const n = String(nombre || '').toUpperCase().replace(/\s+/g, ' ').trim().slice(0, MAX_NOMBRE);
  return n || 'SIN NOMBRE';
}

/** La tabla de los mejores, guardada en un almacén tipo localStorage. */
export class TablaPuntajes {
  constructor(almacen = (typeof localStorage !== 'undefined' ? localStorage : null)) {
    this.almacen = almacen;
    try { for (const k of CLAVES_VIEJAS) this.almacen && this.almacen.removeItem && this.almacen.removeItem(k); }
    catch (_) { /* almacenamiento bloqueado */ }
    this.filas = this._leer();
  }

  /** Vacía la tabla (lo usa el operador desde el panel de mandos). */
  borrar() {
    this.filas = [];
    this._guardar();
  }

  _leer() {
    try {
      const f = JSON.parse(this.almacen && this.almacen.getItem(CLAVE_TABLA)) || [];
      return Array.isArray(f) ? f : [];
    } catch (_) { return []; }
  }

  _guardar() {
    try { this.almacen && this.almacen.setItem(CLAVE_TABLA, JSON.stringify(this.filas)); }
    catch (_) { /* almacenamiento bloqueado: la partida sigue igual */ }
  }

  /**
   * Anota una partida y devuelve su puesto (1 = el mejor). Los empates
   * quedan detrás de quien ya estaba: llegó primero.
   */
  anotar(nombre, puntos, detalle = {}) {
    const fila = { nombre: limpiarNombre(nombre), puntos: Math.round(puntos), fecha: Date.now(), detalle };
    let i = this.filas.findIndex((f) => f.puntos < fila.puntos);
    if (i < 0) i = this.filas.length;
    this.filas.splice(i, 0, fila);
    if (this.filas.length > MAX_TABLA) this.filas.length = MAX_TABLA;
    this._guardar();
    return i + 1;
  }

  mejores(n = 10) { return this.filas.slice(0, n); }
}

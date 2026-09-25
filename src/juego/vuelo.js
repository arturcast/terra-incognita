/**
 * vuelo.js — La lógica de la Etapa 3, "El Regreso". Sin dibujo ni mando: es
 * pura, se prueba en Node (tests/regreso.test.js).
 *
 * Es un Flappy Bird, y eso fue una petición explícita: «el flappy birds es
 * mucho más sencillo de hacer una versión idéntica al juego». Así que la
 * física es la de siempre —gravedad constante, un impulso por pulsación— y lo
 * que cambia es qué representa cada cosa:
 *
 *   LA PALOMA      — el mensajero. Lleva de vuelta lo que se encontró.
 *   LOS SOBRES     — el informe: tantos como hallazgos trajo de El Camino.
 *   LOS AROS       — las recomendaciones. Atravesar uno entrega un sobre.
 *   LOS PUESTOS    — el seguimiento: volver a pasar y verificar que cambió.
 *   LAS COLUMNAS   — las excusas del seguimiento, meses después.
 *
 * Dos decisiones del usuario (2026-09-22), que viven aquí como constantes por
 * si hay que probar lo contrario en el stand:
 *   - Chocar NO termina la partida (`FIN_AL_CHOCAR`). En el original se muere;
 *     aquí, con dos jugadores, eso dejaría a una persona mirando 50 segundos.
 *     La paloma cae, pierde un sobre y vuelve.
 *   - Los dos juegan en EL MISMO cielo (`MISMO_CIELO`): las mismas columnas
 *     para los dos, que es lo que hace la competencia comparable.
 */

/** Chocar no saca del juego: cuesta un sobre y tiempo. Decisión D2. */
export const FIN_AL_CHOCAR = false;
/** Los dos jugadores vuelan el mismo cielo, no en pantalla partida. Decisión D3. */
export const MISMO_CIELO = true;

export const VUELO = {
  alto: 720,             // alto lógico; el dibujo escala a la pantalla real
  suelo: 86,             // franja de tierra, medida desde abajo
  techo: 10,
  gravedad: 1500,        // px/s²
  impulso: -430,         // px/s que da cada aleteo
  velocidad: 195,        // px/s a los que avanza el mundo
  radio: 24,             // de la paloma, para los choques
  xPaloma: 260,          // a qué distancia del borde vuela

  hueco: 200,            // alto del paso entre columnas
  separacion: 270,       // px entre una columna y la siguiente
  margen: 130,           // lo que nunca se pega al techo ni al suelo
  saltoMax: 150,         // cuánto puede subir o bajar el paso de una a otra
  anchoColumna: 62,

  probAro: 0.55,         // cuántos pasos llevan un aro dorado
  radioAro: 46,          // hay que pasar cerca del centro para entregar

  duracion: 60,          // s de vuelo
  reaparicion: 1.4,      // s en el suelo tras chocar
  invulnerable: 1.2,     // s de gracia al volver
  puestoCada: 14,        // s entre puestos de control

  sobresBase: 3,         // aunque venga de una carrera floja, siempre lleva algo
  puntos: { entrega: 100, seguimiento: 60 },
};

/** Lo que dicen las columnas. Son las excusas del seguimiento, no las de la visita. */
export const EXCUSAS_REGRESO = [
  'Ya está resuelto',
  'No hubo presupuesto',
  'Cambió el responsable',
  'Lo vemos el otro trimestre',
  'Estamos en cierre de mes',
  'Eso ya lo sabíamos',
];

/** Azar reproducible: el mismo número da el mismo cielo. */
export function azar(semilla) {
  let a = (semilla >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Genera el cielo completo. Garantías que comprueban las pruebas:
 *  - el paso nunca se pega al techo ni al suelo (VUELO.margen);
 *  - entre dos columnas seguidas, el paso no se mueve más de lo que la paloma
 *    alcanza a subir o bajar en ese tramo (VUELO.saltoMax);
 *  - el aro siempre está dentro del paso: ninguno es imposible.
 */
export function generarCielo(semilla) {
  const rnd = azar(semilla);
  const columnas = [];
  const puestos = [];

  const alto = VUELO.alto - VUELO.suelo;
  const min = VUELO.margen, max = alto - VUELO.margen;
  // La primera columna llega con margen para que nadie choque sin haber volado.
  const x0 = VUELO.xPaloma + VUELO.velocidad * 2.2;
  const total = Math.ceil((VUELO.duracion + 4) * VUELO.velocidad / VUELO.separacion);

  let y = (min + max) / 2;
  for (let i = 0; i < total; i++) {
    const objetivo = min + rnd() * (max - min);
    const d = Math.max(-VUELO.saltoMax, Math.min(VUELO.saltoMax, objetivo - y));
    y = Math.max(min, Math.min(max, y + d));
    columnas.push({
      x: x0 + i * VUELO.separacion,
      y,                                   // centro del paso
      aro: i > 1 && rnd() < VUELO.probAro, // las dos primeras, limpias
      texto: EXCUSAS_REGRESO[Math.floor(rnd() * EXCUSAS_REGRESO.length)],
    });
  }

  // Puestos de control: cada tantos segundos, siempre entre dos columnas.
  const paso = VUELO.puestoCada * VUELO.velocidad;
  for (let x = x0 + paso; x < x0 + total * VUELO.separacion; x += paso) {
    const entre = columnas.findIndex((c) => c.x > x);
    puestos.push({ x: entre > 0 ? (columnas[entre - 1].x + columnas[entre].x) / 2 : x });
  }

  return { columnas, puestos };
}

/** El vuelo de UN jugador. Dos jugadores = dos Vuelos sobre el mismo cielo. */
export class Vuelo {
  /**
   * @param {{columnas: Array, puestos: Array}} cielo
   * @param {number} hallazgos los que trajo de El Camino: son sus sobres.
   */
  constructor(cielo, hallazgos = 0) {
    this.columnas = cielo.columnas.map((c) => ({ ...c, pasada: false, aroTomado: false }));
    this.puestos = cielo.puestos.map((p) => ({ ...p, pasado: false }));
    this.sobres = VUELO.sobresBase + Math.max(0, hallazgos | 0);
    this.sobresIniciales = this.sobres;

    this.t = 0;
    this.distancia = 0;
    this.y = (VUELO.alto - VUELO.suelo) / 2;
    this.vy = 0;
    this.giro = 0;             // inclinación, solo para dibujar
    this.caido = 0;            // s que le faltan para volver
    this.invulnerable = 0;
    this.aleteos = 0;

    this.entregas = 0;
    this.seguimientos = 0;
    this.choques = 0;
    this.perdidos = 0;         // sobres que se cayeron al chocar
    this.pasos = 0;            // columnas cruzadas sin chocar
    this.eventos = [];

    this._i = 0;
    this._p = 0;
  }

  get terminado() { return this.t >= VUELO.duracion; }
  get volando() { return this.caido <= 0; }
  get x() { return this.distancia + VUELO.xPaloma; }
  get puntos() {
    return this.entregas * VUELO.puntos.entrega + this.seguimientos * VUELO.puntos.seguimiento;
  }
  /** Lo que todavía no ha entregado. Si llega a cero, ya no hay nada que dar. */
  get porEntregar() { return this.sobres; }

  _evento(tipo, datos = {}) { this.eventos.push({ tipo, ...datos }); }

  /** Lo que se ve por delante, para dibujar. */
  visibles(ancho) {
    const desde = this.distancia - VUELO.xPaloma, hasta = this.distancia + ancho;
    return {
      columnas: this.columnas.filter((c) => c.x > desde - VUELO.anchoColumna && c.x < hasta),
      puestos: this.puestos.filter((p) => p.x > desde - 60 && p.x < hasta),
    };
  }

  _chocar(motivo) {
    this.choques++;
    this._evento('choque', { motivo });
    if (this.sobres > 0) { this.sobres--; this.perdidos++; }
    this.caido = VUELO.reaparicion;
    this.vy = 0;
  }

  /**
   * Un paso de simulación.
   * @param {number} dt segundos
   * @param {boolean} aletear se pulsó en este fotograma
   */
  actualizar(dt, aletear) {
    this.eventos = [];
    if (this.terminado) return;
    this.t += dt;
    this.distancia += VUELO.velocidad * dt;   // el mundo avanza igual para todos
    if (this.invulnerable > 0) this.invulnerable -= dt;

    const sueloY = VUELO.alto - VUELO.suelo;

    if (this.caido > 0) {
      // Cayó: se queda un momento fuera de juego y vuelve al centro.
      this.caido -= dt;
      this.y = Math.min(sueloY - VUELO.radio, this.y + 420 * dt);
      this.giro = 1.2;
      if (this.caido <= 0) {
        this.y = sueloY / 2;
        this.vy = 0;
        this.giro = 0;
        this.invulnerable = VUELO.invulnerable;
        this._evento('vuelve');
      }
    } else {
      if (aletear) {
        this.vy = VUELO.impulso;
        this.aleteos++;
        this._evento('aleteo');
      }
      this.vy += VUELO.gravedad * dt;
      this.y += this.vy * dt;
      this.giro = Math.max(-0.5, Math.min(1.1, this.vy / 700));

      if (this.y < VUELO.techo + VUELO.radio) {      // el techo no mata: rebota
        this.y = VUELO.techo + VUELO.radio;
        this.vy = 0;
      }
      if (this.y > sueloY - VUELO.radio) {
        this.y = sueloY - VUELO.radio;
        if (this.invulnerable <= 0) this._chocar('suelo');
      }
    }

    // --- lo que se cruza
    const x = this.x;
    while (this._i < this.columnas.length && this.columnas[this._i].x <= x) {
      const c = this.columnas[this._i++];
      c.pasada = true;
      if (this.caido > 0) continue;               // estaba en el suelo: no cuenta
      const dentro = Math.abs(this.y - c.y) < VUELO.hueco / 2 - VUELO.radio * 0.4;
      if (!dentro) {
        if (this.invulnerable <= 0) this._chocar(c.texto);
        continue;
      }
      this.pasos++;
      if (c.aro && Math.abs(this.y - c.y) < VUELO.radioAro && this.sobres > 0) {
        c.aroTomado = true;
        this.sobres--;
        this.entregas++;
        this._evento('entrega', { quedan: this.sobres });
      } else if (c.aro && this.sobres === 0) {
        this._evento('sinSobres');
      }
    }

    while (this._p < this.puestos.length && this.puestos[this._p].x <= x) {
      const p = this.puestos[this._p++];
      p.pasado = true;
      if (this.caido > 0) continue;
      this.seguimientos++;
      this._evento('seguimiento');
    }
  }

  /** Todo lo que el tablero y la revelación necesitan. */
  resultado() {
    return {
      entregas: this.entregas,
      sobresIniciales: this.sobresIniciales,
      sinEntregar: this.sobres,
      seguimientos: this.seguimientos,
      choques: this.choques,
      perdidos: this.perdidos,
      pasos: this.pasos,
      aleteos: this.aleteos,
      puntos: this.puntos,
    };
  }
}

/**
 * Quién gana: el que más entregó. Desempata el seguimiento, y después el
 * que menos chocó. Devuelve el índice, o -1 si es empate perfecto.
 */
export function ganadorVuelo(resultados) {
  if (resultados.length < 2) return 0;
  let mejor = 0, empate = false;
  for (let i = 1; i < resultados.length; i++) {
    const a = resultados[i], b = resultados[mejor];
    const cmp = (a.entregas - b.entregas) || (a.seguimientos - b.seguimientos) ||
      (b.choques - a.choques);
    if (cmp > 0) { mejor = i; empate = false; }
    else if (cmp === 0) empate = true;
  }
  return empate ? -1 : mejor;
}

/**
 * carrera.js — La lógica de la Etapa 2, "El Camino". Sin dibujo ni mando:
 * es puro, se prueba en Node (tests/camino.test.js).
 *
 * Lo que la etapa hace sentir, sin nombrarlo:
 *
 *   DATOS CRUDOS     — la información tal como sale de la fuente. Se recogen
 *                      corriendo por encima.
 *   LA LENTE         — analizar. Gasta datos y hace visible lo escondido.
 *                      Sin datos no hay nada que analizar.
 *   HALLAZGOS OCULTOS— invisibles hasta que se analiza. Casi todos en los
 *                      carriles laterales: lo menos transitado.
 *   POWER BI         — el tablero de Power BI (en el código sigue llamándose
 *                      'control'). Al recogerlo analiza solo: enciende la
 *                      lente sin gastar datos. Es la herramienta, no el
 *                      hallazgo: revela, pero hay que ir a por lo revelado.
 *                      (Antes era un cartel ✓ «todo en orden»; cambiado a
 *                      pedido del usuario el 2026-09-26.)
 *   MUROS            — las excusas de siempre. Chocar hace perder datos.
 *   ESTACIONES       — el proceso de principio a fin, por la cadena real del
 *                      gas: de donde entra a donde se cobra.
 *
 * Los dos jugadores corren EL MISMO camino (misma semilla): la competencia es
 * justa y el tablero final se puede comparar.
 */

export const CAMINO = {
  // Velocidad subida tras la primera prueba en Chrome (2026-09-22): a 10-14 m/s
  // «por momentos es muy lento». Se sube la velocidad y se estira todo lo
  // espacial en proporción, para que la carrera siga durando ~70 s y los
  // hallazgos sigan siendo alcanzables. tests/camino.test.js lo vigila.
  largo: 1400,           // metros de recorrido
  velInicial: 16,        // m/s
  velFinal: 24,
  vista: 80,             // metros que se ven por delante
  alcanceLente: 75,      // metros que revela la lente
  duracionLente: 2.4,    // s
  costoLente: 6,         // datos que gasta cada análisis
  maxDatos: 40,
  castigoChoque: 4,      // datos que se pierden al chocar
  tropiezo: 0.7,         // s con la velocidad a la mitad tras un choque
  separacionFila: 9,     // metros entre filas de objetos
  /**
   * Justicia: nada escondido antes de que se pueda tener datos para
   * analizarlo, y espacio entre hallazgos para poder cruzar la pista. Sin esto
   * el generador ponía hallazgos imposibles (ver tests/camino.test.js).
   */
  inicioOcultos: 70,     // metros libres de hallazgos al empezar
  sepOcultos: 30,        // metros mínimos entre dos hallazgos
  /**
   * Metros sin muros ni nada escondido al entrar en un tramo nuevo: es lo que
   * dura el letrero «Entrando a…» (unos 2,6 s). Mientras se lee, no se choca.
   */
  pausaTramo: 70,
  /** Metros que un objeto sigue viéndose después de pasar al jugador: sale de la pantalla, no se esfuma. */
  atras: 12,
  puntos: { hallazgo: 100, control: 10, dato: 2 },
};

/**
 * La cadena del gas, de principio a fin. Son lugares del mapa de la Etapa 1:
 * el visitante ya los conoce. `ocultos` es cuánto hay escondido en cada tramo;
 * La Montaña Perdida —pérdida no operacional— es donde más hay: el gas que
 * entró y no llegó a cobrarse solo aparece cruzando las cifras.
 */
export const ESTACIONES = [
  { id: 'manantial', nombre: 'El Manantial', que: 'donde entra el gas', ocultos: 2 },
  { id: 'ramales', nombre: 'Los Ramales', que: 'por donde se reparte', ocultos: 3 },
  { id: 'montana', nombre: 'La Montaña Perdida', que: 'donde algo se pierde', ocultos: 4 },
  { id: 'caudal', nombre: 'El Gran Caudal', que: 'donde se mide y se cobra', ocultos: 3 },
  { id: 'represa', nombre: 'La Represa', que: 'donde llega la plata', ocultos: 2 },
];

/** Lo que dicen los muros. Reconocibles para cualquiera que trabaje en una empresa. */
export const EXCUSAS = [
  'Siempre se ha hecho así',
  'Pídelo por correo',
  'Ese dato no existe',
  'Eso no está en el manual',
  'Ya lo revisaron el año pasado',
  'No es mi área',
  'El sistema no deja',
  'Eso siempre cuadra',
];

/** Azar reproducible: el mismo número da el mismo camino. */
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

function elegirCarril(rnd, pesos, ocupados) {
  // Peso cero es «nunca aquí» (p. ej. Power BI en el centro), aunque sea el único libre.
  const libres = [0, 1, 2].filter((c) => !ocupados.includes(c) && pesos[c] > 0);
  if (!libres.length) return -1;
  const total = libres.reduce((s, c) => s + pesos[c], 0);
  let r = rnd() * total;
  for (const c of libres) { r -= pesos[c]; if (r <= 0) return c; }
  return libres[libres.length - 1];
}

/**
 * Qué dos estaciones se juegan en El Camino. Se eligen SOLAS, con la
 * prioridad que el visitante le dio en El Mapa: de los cinco lugares donde
 * mandó un equipo, las dos primeras (en el orden en que las envió) que
 * coincidan con un tramo de la cadena del gas.
 *
 * Si mandó menos de dos equipos a lugares de la cadena —o si no hay datos de
 * El Mapa, por ejemplo al entrar directo con la tecla 2 para ensayar—, se
 * completa con el orden de siempre (El Manantial, Los Ramales…) hasta tener
 * dos. Así la etapa nunca se queda sin poder empezar.
 *
 * @param {{id: string}[]} elegidasMapa `elegidas` de El Mapa, en prioridad.
 * @returns {object[]} exactamente dos entradas de ESTACIONES, en ese orden.
 */
export function elegirEstaciones(elegidasMapa) {
  const ids = ESTACIONES.map((e) => e.id);
  const porPrioridad = (elegidasMapa || []).map((r) => r.id).filter((id) => ids.includes(id));
  const elegidos = [];
  for (const id of [...porPrioridad, ...ids]) {
    if (elegidos.length >= 2) break;
    if (!elegidos.includes(id)) elegidos.push(id);
  }
  return elegidos.map((id) => ESTACIONES.find((e) => e.id === id));
}

/**
 * Genera el camino completo. Garantías que comprueban las pruebas:
 *  - nunca más de un muro por fila: siempre hay por dónde pasar;
 *  - un hallazgo nunca comparte carril y fila con un muro;
 *  - la mayoría de los hallazgos va por los laterales.
 *
 * @param {number} semilla
 * @param {object[]} estaciones tramos a recorrer, en orden. Por defecto, los
 *   cinco de siempre (lo que usan las pruebas). El Camino en juego pasa aquí
 *   las dos que elige `elegirEstaciones()`.
 */
export function generarCamino(semilla, estaciones = ESTACIONES) {
  const rnd = azar(semilla);
  const objetos = [];
  const tramo = CAMINO.largo / estaciones.length;
  // Posiciones de todos los hallazgos ya puestos, de TODAS las estaciones:
  // la separación mínima también vale al cruzar de una estación a la otra.
  const posiciones = [];

  estaciones.forEach((est, k) => {
    const ini = k * tramo, fin = ini + tramo;
    objetos.push({ tipo: 'estacion', s: ini + 3, carril: 1, estacion: k });

    const filas = [];
    for (let s = ini + 16; s < fin - 5; s += CAMINO.separacionFila) filas.push(s);

    // Filas con hallazgo: al azar, pero alcanzables (ver CAMINO.inicioOcultos
    // y sepOcultos). Si tras muchos intentos no caben todos, se ponen los que
    // quepan: mejor un hallazgo menos que uno imposible.
    const conOculto = new Set();
    for (let intento = 0; intento < 400 && conOculto.size < est.ocultos; intento++) {
      const i = Math.floor(rnd() * filas.length);
      const s = filas[i];
      if (s < CAMINO.inicioOcultos) continue;
      if (k > 0 && s < ini + CAMINO.pausaTramo) continue;   // se está leyendo el letrero
      if (posiciones.some((q) => Math.abs(q - s) < CAMINO.sepOcultos)) continue;
      conOculto.add(i);
      posiciones.push(s);
    }

    filas.forEach((s, i) => {
      const ocupados = [];
      if (conOculto.has(i)) {
        const carril = rnd() < 0.72 ? (rnd() < 0.5 ? 0 : 2) : 1;
        objetos.push({ tipo: 'oculto', s, carril, estacion: k });
        ocupados.push(carril);
      }
      // Muros: más frecuentes a medida que avanza, y más en los laterales.
      const enPausa = k > 0 && s < ini + CAMINO.pausaTramo;
      if (rnd() < 0.26 + 0.12 * (k / Math.max(1, estaciones.length - 1)) && !enPausa) {
        const c = elegirCarril(rnd, [1.3, 0.8, 1.3], ocupados);
        if (c >= 0) {
          objetos.push({ tipo: 'muro', s, carril: c, estacion: k, texto: EXCUSAS[Math.floor(rnd() * EXCUSAS.length)] });
          ocupados.push(c);
        }
      }
      // Datos crudos: abundan en el centro, el camino cómodo.
      const nDatos = rnd() < 0.55 ? 1 : 2;
      for (let d = 0; d < nDatos; d++) {
        const c = elegirCarril(rnd, [1, 2, 1], ocupados);
        if (c >= 0) { objetos.push({ tipo: 'dato', s: s + d * 2.5, carril: c, estacion: k }); ocupados.push(c); }
      }
      // Tableros de Power BI: en los carriles laterales. Hay que ir a buscarlos:
      // quien se queda en el centro, cómodo, no los toma y no ve nada.
      if (rnd() < 0.2) {
        const c = elegirCarril(rnd, [1, 0, 1], ocupados);
        if (c >= 0) objetos.push({ tipo: 'control', s: s + 3.5, carril: c, estacion: k });
      }
    });
  });

  return objetos.sort((a, b) => a.s - b.s);
}

/**
 * Carril al que apunta el jugador, con histéresis: cerca de una frontera no
 * cambia a cada temblor. `x` es la posición del puntero en SU mitad de pantalla.
 */
export function carrilDesdePuntero(x, ancho, actual = 1) {
  const t = x / ancho, m = 0.035;
  if (actual === 0) return t > 2 / 3 + m ? 2 : t > 1 / 3 + m ? 1 : 0;
  if (actual === 2) return t < 1 / 3 - m ? 0 : t < 2 / 3 - m ? 1 : 2;
  return t < 1 / 3 - m ? 0 : t > 2 / 3 + m ? 2 : 1;
}

/** La carrera de UN jugador. Dos jugadores = dos Carreras sobre el mismo camino. */
export class Carrera {
  /**
   * @param {object[]} objetos lo que genera `generarCamino()`.
   * @param {object[]} estaciones las estaciones que se están recorriendo, en
   *   el mismo orden con que se generó `objetos`. Por defecto las cinco de
   *   siempre.
   */
  constructor(objetos, estaciones = ESTACIONES) {
    this.estaciones = estaciones;
    this.objetos = objetos.map((o) => ({ ...o, hecho: false, revelado: false }));
    this._i = 0;                    // primer objeto aún no alcanzado
    this._iAtras = 0;               // primer objeto que todavía se ve por detrás
    this.distancia = 0;
    this.carril = 1;
    this.xCarril = 1;               // posición animada, para dibujar
    this.datos = 0;                 // medidor actual
    this.registros = 0;             // datos recogidos en total
    this.controles = 0;             // tableros de Power BI recogidos
    this.analisisPB = 0;            // veces que un tablero analizó solo
    this.choques = 0;
    this.hallazgos = [];
    this.noVistos = 0;              // hallazgos que pasaron sin analizarse
    this.vistosNoAlcanzados = 0;    // se revelaron pero no se llegó
    this.usosLente = 0;
    this.lente = 0;                 // segundos que le quedan a la lente
    this.tropiezo = 0;
    this.tiempoEnCarril = [0, 0, 0];
    this.eventos = [];
  }

  get progreso() { return Math.min(1, this.distancia / CAMINO.largo); }
  get terminada() { return this.distancia >= CAMINO.largo; }
  get velocidad() {
    const v = CAMINO.velInicial + (CAMINO.velFinal - CAMINO.velInicial) * this.progreso;
    return this.tropiezo > 0 ? v * 0.5 : v;
  }
  get estacion() {
    return Math.min(this.estaciones.length - 1, Math.floor(this.progreso * this.estaciones.length));
  }
  /** El id de la estación actual ('manantial', 'ramales'…), para quien dibuja. */
  get estacionId() { return this.estaciones[this.estacion].id; }
  get puntos() {
    const p = CAMINO.puntos;
    return this.hallazgos.length * p.hallazgo + this.controles * p.control + this.registros * p.dato;
  }

  _evento(tipo, datos = {}) { this.eventos.push({ tipo, ...datos }); }

  /**
   * Objetos a la vista, del más lejano al más cercano: los que vienen, a menos
   * de `hasta` metros, y los que ya pasaron al lado sin recogerse, hasta
   * `CAMINO.atras` metros por detrás. Así salen de la pantalla en vez de
   * esfumarse frente al jugador. Lo que se recoge (datos, carteles, lo
   * escondido atrapado) sí desaparece: ya lo lleva encima.
   */
  visibles(hasta = CAMINO.vista) {
    while (this._iAtras < this._i && this.objetos[this._iAtras].s < this.distancia - CAMINO.atras) this._iAtras++;
    const out = [];
    for (let k = this._iAtras; k < this.objetos.length; k++) {
      const o = this.objetos[k];
      const dz = o.s - this.distancia;
      if (dz > hasta) break;
      if (!o.recogido && dz > -CAMINO.atras) out.push({ o, dz });
    }
    return out.reverse();
  }

  /**
   * Un paso de simulación.
   * @param {number} dt segundos
   * @param {number} carrilObjetivo 0, 1 o 2
   * @param {boolean} analizar se pulsó la lente en este fotograma
   */
  actualizar(dt, carrilObjetivo, analizar) {
    this.eventos = [];
    if (this.terminada) return;

    this.carril = Math.max(0, Math.min(2, carrilObjetivo | 0));
    this.xCarril += (this.carril - this.xCarril) * (1 - Math.exp(-dt / 0.07));
    this.tiempoEnCarril[this.carril] += dt;

    // --- la lente
    if (analizar && this.lente <= 0) {
      if (this.datos >= CAMINO.costoLente) {
        this.datos -= CAMINO.costoLente;
        this.lente = CAMINO.duracionLente;
        this.usosLente++;
        this._evento('lente');
      } else {
        this._evento('sinDatos');
      }
    }
    if (this.lente > 0) {
      this.lente = Math.max(0, this.lente - dt);
      for (const { o, dz } of this.visibles(CAMINO.alcanceLente)) {
        if (o.tipo === 'oculto' && !o.revelado && dz > 0) {
          o.revelado = true;
          this._evento('revelado', { estacion: o.estacion });
        }
      }
    }

    // --- avanzar
    this.tropiezo = Math.max(0, this.tropiezo - dt);
    this.distancia += this.velocidad * dt;

    // --- lo que queda atrás se resuelve en el carril donde está el jugador
    while (this._i < this.objetos.length && this.objetos[this._i].s <= this.distancia) {
      const o = this.objetos[this._i++];
      o.hecho = true;
      const aqui = o.carril === this.carril;
      switch (o.tipo) {
        case 'estacion':
          this._evento('estacion', { estacion: o.estacion });
          break;
        case 'dato':
          if (aqui) {
            o.recogido = true;
            this.datos = Math.min(CAMINO.maxDatos, this.datos + 1);
            this.registros++;
            this._evento('dato');
          }
          break;
        case 'control':
          // El tablero de Power BI cruza los datos por ti: análisis sin costo.
          if (aqui) {
            o.recogido = true;
            this.controles++;
            if (this.lente <= 0) { this.lente = CAMINO.duracionLente; this.analisisPB++; }
            this._evento('control');
          }
          break;
        case 'muro':
          if (aqui) {
            o.derribado = true;           // quien dibuja lo tumba: no pasa a través del jugador
            this.choques++;
            this.datos = Math.max(0, this.datos - CAMINO.castigoChoque);
            this.tropiezo = CAMINO.tropiezo;
            this._evento('choque', { texto: o.texto });
          }
          break;
        case 'oculto':
          if (o.revelado && aqui) { o.recogido = true; this.hallazgos.push(o); this._evento('hallazgo', { estacion: o.estacion }); }
          else if (o.revelado) this.vistosNoAlcanzados++;
          else this.noVistos++;
          break;
      }
    }
  }

  /** Todo lo que el tablero y la revelación necesitan. */
  resultado() {
    const total = this.tiempoEnCarril.reduce((a, b) => a + b, 0) || 1;
    const carriles = this.tiempoEnCarril.map((t) => t / total);
    const porEstacion = this.estaciones.map((e, k) => ({
      nombre: e.nombre,
      que: e.que,
      existentes: this.objetos.filter((o) => o.tipo === 'oculto' && o.estacion === k).length,
      encontrados: this.hallazgos.filter((o) => o.estacion === k).length,
    }));
    return {
      puntos: this.puntos,
      hallazgos: this.hallazgos.length,
      existentes: porEstacion.reduce((a, e) => a + e.existentes, 0),
      porEstacion,
      datos: this.registros,
      controles: this.controles,
      analisisPB: this.analisisPB,
      choques: this.choques,
      noVistos: this.noVistos,
      vistosNoAlcanzados: this.vistosNoAlcanzados,
      usosLente: this.usosLente,
      carriles,
      carrilComodo: carriles[1] > 0.7,
    };
  }
}

/** Quién ganó. Desempata por hallazgos, luego por puntos. -1 si hay empate. */
export function ganador(resultados) {
  if (resultados.length < 2) return 0;
  const [a, b] = resultados;
  if (a.hallazgos !== b.hallazgos) return a.hallazgos > b.hallazgos ? 0 : 1;
  if (a.puntos !== b.puntos) return a.puntos > b.puntos ? 0 : 1;
  return -1;
}

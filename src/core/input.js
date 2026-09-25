/**
 * input.js — Traduce el movimiento físico del Joy-Con en intención de juego.
 *
 * Las escenas nunca leen el giroscopio directo. Piden un Puntero y obtienen
 * coordenadas de pantalla ya suavizadas, recentrables y con límites. Si mañana
 * cambiamos de Joy-Con a otro mando, solo cambia este archivo.
 */

import { BOTON } from './joycon.js';

/**
 * Ajustes del puntero por giroscopio. Todos en unidades físicas (grados,
 * segundos) para que no dependan de la pantalla ni de los fotogramas.
 * Ver docs/ESTABILIDAD.md antes de tocarlos: cada uno arregla un síntoma.
 */
export const PUNTERO = {
  /**
   * Grados de giro para cruzar la pantalla de lado a lado a velocidad normal.
   * Antes eran unos 113° (17 px/° en 1920 px): había que torcer la muñeca más
   * de lo que da, y la linterna se sentía pesada.
   */
  gradosAncho: 55,
  /** Aceleración: los barridos rápidos llegan más lejos, lo lento sigue preciso. */
  velLenta: 20,          // °/s — por debajo, ganancia 1
  velRapida: 140,        // °/s — a partir de aquí, ganancia máxima
  gananciaMax: 1.7,
  /** Por debajo de esta velocidad el movimiento se atenúa en proporción: temblor de mano. */
  temblor: 2.0,          // °/s
  /** Suavizado: fuerte cuando va lento (quita temblor), casi nulo cuando va rápido (sin retraso). */
  suaveLento: 0.10,      // s
  suaveRapido: 0.018,    // s
};

/**
 * Convierte el giro del Joy-Con en un punto de pantalla, **como un ratón**.
 *
 * Trabaja con diferencias de ángulo entre fotogramas, no con el ángulo
 * absoluto. Eso resuelve dos fallos de la primera versión:
 *
 *  - **Linterna pegada al borde.** Antes el punto se recortaba a la pantalla
 *    pero el ángulo seguía sumando; para volver había que deshacer todo el giro
 *    de más. Ahora se recorta el objetivo: al llegar al borde se detiene, y en
 *    cuanto giras de vuelta responde.
 *  - **Saltos al calibrar o recentrar.** El driver sube `estado.generacion`
 *    cada vez que reinicia los ángulos; aquí se detecta y se ignora ese salto.
 *
 * EJES — medidos con los mandos reales (ver docs/ESTABILIDAD.md):
 *   el eje largo del mando (X) es el que apunta a la pantalla;
 *   yaw  (giro sobre Z) -> horizontal;
 *   roll (giro sobre Y) -> vertical.
 *
 * SENTIDO — lo decide la gravedad, no el lado del mando. El Joy-Con izquierdo
 * lleva el sensor girado 180° sobre X respecto al derecho: sobre la mesa, el
 * derecho marca Z = −1 g y el izquierdo Z = +1 g. Con un signo fijo, el
 * izquierdo iba al revés en los dos ejes. Aquí se mira hacia dónde apunta
 * "arriba" en Z y el signo sale solo: vale para los dos mandos y también si
 * alguien lo sostiene boca abajo.
 */
export class Puntero {
  constructor(joycon, opciones = {}) {
    this.jc = joycon;
    this.ejeH = opciones.ejeH ?? 'yaw';
    this.ejeV = opciones.ejeV ?? 'roll';
    // Inversiones manuales, por encima de la automática. Normalmente no hacen falta.
    this.invertirH = opciones.invertirH ?? false;
    this.invertirV = opciones.invertirV ?? false;
    this.ajustes = { ...PUNTERO, ...(opciones.ajustes || {}) };

    this.x = 0;
    this.y = 0;
    this.velocidadAngular = 0;   // °/s del último fotograma, para diagnóstico
    this.ultimoGiro = { h: 0, v: 0 };  // grados ya traducidos a ejes de pantalla
    this.signo = null;           // +1 mando boca arriba "como el derecho", −1 al revés
    this._uz = null;
    this._objX = 0;
    this._objY = 0;
    this._ultH = 0;
    this._ultV = 0;
    this._gen = -1;
    this._ancho = 0;
    this._alto = 0;
    this._iniciado = false;
    this._pedirCentro = false;
  }

  _angulo(cual) {
    const s = this.jc.estado;
    if (cual === 'yaw') return s.yaw;
    if (cual === 'roll') return s.roll;
    return s.pitch;
  }

  /**
   * Decide el sentido de los ejes a partir de la gravedad.
   *
   * El acelerómetro en reposo apunta hacia arriba. Si "arriba" cae hacia −Z,
   * el mando está como el derecho boca arriba (signo +1); si cae hacia +Z,
   * como el izquierdo boca arriba o el derecho boca abajo (signo −1).
   *
   * Con histéresis: solo cambia cuando la gravedad es clara (|z| > 0,35). Si
   * alguien sostiene el mando de canto, se queda con el último signo, y si
   * nunca lo hubo, con el que corresponde a su lado.
   */
  _actualizarSigno() {
    const s = this.jc.estado;
    if (this.signo === null) this.signo = this.jc.esIzquierdo ? -1 : 1;
    const n = Math.hypot(s.accelX, s.accelY, s.accelZ);
    if (n < 0.6 || n > 1.4) return;          // en un movimiento brusco no hay gravedad que leer
    const uz = s.accelZ / n;
    this._uz = this._uz === null ? uz : this._uz + (uz - this._uz) * 0.08;
    if (this._uz < -0.35) this.signo = 1;
    else if (this._uz > 0.35) this.signo = -1;
  }

  /** Lleva el puntero al centro de la pantalla en el siguiente fotograma. */
  recentrar() { this._pedirCentro = true; }

  /**
   * Actualiza y devuelve la posición. Llamar **una sola vez por fotograma**.
   * @param {number} dt segundos desde el fotograma anterior.
   */
  actualizar(ancho, alto, margen = 0, dt = 1 / 60) {
    const a = this.ajustes;
    const s = this.jc.estado;
    this._actualizarSigno();
    // Ángulos crudos del sensor; el signo se aplica a las diferencias, así un
    // cambio de signo nunca hace saltar la linterna.
    const h = this._angulo(this.ejeH);
    const v = this._angulo(this.ejeV);

    // Primer uso, o los ángulos se reiniciaron por debajo: resincronizar sin mover.
    if (!this._iniciado || s.generacion !== this._gen) {
      this._ultH = h; this._ultV = v; this._gen = s.generacion;
      if (!this._iniciado) { this._pedirCentro = true; this._iniciado = true; }
    }

    // Si cambia el tamaño de pantalla, se conserva la posición relativa.
    if (this._ancho && (ancho !== this._ancho || alto !== this._alto)) {
      this._objX *= ancho / this._ancho; this.x *= ancho / this._ancho;
      this._objY *= alto / this._alto; this.y *= alto / this._alto;
    }
    this._ancho = ancho; this._alto = alto;

    if (this._pedirCentro) {
      this._objX = this.x = ancho / 2;
      this._objY = this.y = alto / 2;
      this._pedirCentro = false;
    }

    // Horizontal: +signo·yaw es "derecha". Vertical: +signo·roll es "arriba",
    // y en pantalla arriba es y menor, de ahí el menos.
    const dh = this.signo * (h - this._ultH) * (this.invertirH ? -1 : 1);
    const dv = -this.signo * (v - this._ultV) * (this.invertirV ? -1 : 1);
    this._ultH = h; this._ultV = v;
    this.ultimoGiro = { h: dh, v: dv };

    const paso = Math.min(0.1, Math.max(1 / 240, dt || 1 / 60));
    const vel = Math.hypot(dh, dv) / paso;
    this.velocidadAngular = vel;

    // Ganancia según velocidad: atenuar el temblor, acelerar los barridos.
    let ganancia;
    if (vel < a.temblor) ganancia = vel / a.temblor;
    else if (vel <= a.velLenta) ganancia = 1;
    else ganancia = 1 + (a.gananciaMax - 1) * Math.min(1, (vel - a.velLenta) / (a.velRapida - a.velLenta));

    const pxPorGrado = ancho / a.gradosAncho;
    this._objX = Math.max(margen, Math.min(ancho - margen, this._objX + dh * pxPorGrado * ganancia));
    this._objY = Math.max(margen, Math.min(alto - margen, this._objY + dv * pxPorGrado * ganancia));

    // Suavizado por tiempo, no por fotograma: igual a 30 que a 144 fps.
    const t = Math.min(1, vel / a.velLenta);
    const tau = a.suaveLento + (a.suaveRapido - a.suaveLento) * t;
    const k = 1 - Math.exp(-paso / tau);
    this.x += (this._objX - this.x) * k;
    this.y += (this._objY - this.y) * k;
    return this;
  }

  /** Velocidad angular total. Sirve para saber si el visitante está quieto. */
  get velocidad() {
    const s = this.jc.estado;
    return Math.hypot(s.giroX, s.giroY, s.giroZ);
  }
}

/**
 * Acciones con nombre, independientes de si el Joy-Con es izquierdo o derecho.
 * Las escenas preguntan por intención ("confirmar"), no por botón físico ("ZR").
 */
export class Acciones {
  constructor(joycon) { this.jc = joycon; }

  get confirmarBit() { return this.jc.bitGatillo; }
  get cancelarBit() { return this.jc.esIzquierdo ? BOTON.MENOS : BOTON.MAS; }
  get secundarioBit() { return this.jc.bitAccion; }
  get recentrarBit() { return this.jc.esIzquierdo ? BOTON.CAPTURA : BOTON.HOME; }

  confirmar() { return this.jc.reciénPulsado(this.confirmarBit); }
  confirmarSostenido() { return this.jc.pulsado(this.confirmarBit); }
  cancelar() { return this.jc.reciénPulsado(this.cancelarBit); }
  secundario() { return this.jc.reciénPulsado(this.secundarioBit); }
  pideRecentrar() { return this.jc.reciénPulsado(this.recentrarBit); }

  /** Etiqueta para mostrar en pantalla, según el mando conectado. */
  get nombreConfirmar() { return this.jc.esIzquierdo ? 'ZL' : 'ZR'; }
  get nombreSecundario() { return this.jc.esIzquierdo ? 'ABAJO' : 'A'; }
  get nombreRecentrar() { return this.jc.esIzquierdo ? 'CAPTURA' : 'HOME'; }
}

/**
 * Detector de sacudida. Varias etapas previstas lo usan (recoger muestras,
 * descartar ruido). Vive aquí para que todas se comporten igual.
 */
export class Sacudida {
  constructor(joycon, umbral = 2.2, enfriamiento = 400) {
    this.jc = joycon;
    this.umbral = umbral;
    this.enfriamiento = enfriamiento;
    this._ultima = 0;
  }
  ocurrio() {
    const s = this.jc.estado;
    const mag = Math.hypot(s.accelX, s.accelY, s.accelZ);
    const ahora = performance.now();
    if (mag > this.umbral && ahora - this._ultima > this.enfriamiento) {
      this._ultima = ahora;
      return true;
    }
    return false;
  }
}

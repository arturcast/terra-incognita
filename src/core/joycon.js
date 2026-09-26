/**
 * joycon.js — Driver de Joy-Con (Nintendo Switch) sobre WebHID.
 *
 * Por qué WebHID y no una librería nativa: el equipo corporativo corre Sophos
 * Intercept X, que bloquea la carga de SDL2.dll (falso positivo). Eso deja
 * fuera a pygame, Godot, Love2D y cualquier motor que cargue DLLs sin firma.
 * Chrome habla HID directamente y no carga nada que Sophos pueda morder.
 * Ver docs/PROTOCOLO-JOYCON.md para el detalle completo.
 *
 * Lo crítico: el IMU del Joy-Con viene APAGADO. Sin el subcomando 0x40 el
 * giroscopio y el acelerómetro reportan ceros indefinidamente.
 *
 * ESTABILIDAD — cuatro reglas que salen de fallos reales en la primera demo
 * (ver docs/ESTABILIDAD.md):
 *
 *  1. Los botones se detectan POR REPORTE, no por fotograma. Bluetooth entrega
 *     los reportes en ráfagas; si llegan dos entre dos fotogramas, comparar
 *     contra el reporte anterior pierde la pulsación. Aquí los flancos se
 *     acumulan hasta que el motor llama a `finDeFrame()`.
 *  2. Calibrar NO toca los ángulos. Solo cambia el sesgo. Resetear ángulos
 *     hacía saltar la linterna un segundo después de conectar.
 *  3. La calibración rechaza muestras en movimiento y, además, el sesgo se
 *     sigue corrigiendo solo cada vez que el mando está quieto. Un sesgo mal
 *     medido hace que la linterna se deslice sin que nadie la mueva.
 *  4. Las escrituras al mando van en cola, una detrás de otra. Enviar un
 *     reporte mientras otro sigue en curso puede fallar o atascar el enlace.
 */

export const VID_NINTENDO = 0x057e;
export const PID_JOYCON_L = 0x2006;
export const PID_JOYCON_R = 0x2007;

const ACC_ESCALA = 0.000244; // g por unidad
const GYR_ESCALA = 0.06103;  // grados/s por unidad
const DT_MUESTRA = 0.005;    // el IMU muestrea a 200 Hz: 3 muestras por reporte
const RUMBLE_NEUTRO = [0x00, 0x01, 0x40, 0x40, 0x00, 0x01, 0x40, 0x40];

/**
 * Umbrales del detector de quietud. Salen de medir el hardware real:
 * ver docs/ESTABILIDAD.md, sección "Medidas". Si se ajustan, hay que volver a
 * pasar las pruebas de tests/entrada.test.js.
 */
export const QUIETUD = {
  ventana: 48,          // muestras (~0,24 s) sobre las que se mide la quietud
  magnitudMax: 6.0,     // °/s — por encima, seguro que se está moviendo
  desviacionMax: 1.2,   // °/s — temblor de mano sujetando quieto
  accelDesvMax: 0.03,   // g   — el acelerómetro también debe estar quieto
  constanteAprendizaje: 2.0, // s — lo que tarda el sesgo en corregirse
  /**
   * Con un sesgo ya fiable, solo se aceptan correcciones pequeñas: lo que un
   * sensor deriva con la temperatura. Sin este tope, un barrido lento y
   * constante (apuntar con cuidado) se tomaba por sesgo y se "corregía": la
   * linterna dejaba de responder justo cuando más precisión hacía falta.
   * Un giro horizontal no cambia la gravedad, así que el acelerómetro no
   * puede distinguirlo de un sesgo; por eso el tope.
   */
  correccionMax: 1.5,   // °/s
  quietoMinimo: 100,    // muestras seguidas (~0,5 s) antes de aprender
  arranque: 600,        // muestras aprendidas (~3 s) para dar por fiable un sesgo sin calibrar
};

/** Calibración inicial: cuántas muestras quietas hacen falta y cuánto esperar. */
/**
 * Calibración explícita. Para aceptar una muestra basta con que el mando esté
 * APOYADO: acelerómetro quieto y giro sin sacudidas. No se exige que el giro
 * marque poco (como en QUIETUD): un mando con mucho desvío —justo el que hay
 * que calibrar— marca mucho estando quieto sobre la mesa, y antes se quedaba
 * para siempre en «esperando que esté quieto» (visto por el usuario con un
 * Joy-Con derecho con drift, 2026-09-26). El tope de magnitud solo descarta
 * un giro evidente.
 */
const CALIBRACION = {
  muestras: 120, tiempoMax: 8000,
  desviacionMax: 4.0,    // °/s — sacudidas del giro (el ruido de un sensor gastado cabe)
  accelDesvMax: 0.06,    // g   — el acelerómetro quieto: apoyado, no en la mano
  magnitudMax: 40,       // °/s — por encima es un giro de verdad, no desvío
};

// Bits del acumulado de botones: derecha | compartido<<8 | izquierda<<16
export const BOTON = {
  // byte de la derecha (Joy-Con R)
  Y: 0, X: 1, B: 2, A: 3, SR_R: 4, SL_R: 5, R: 6, ZR: 7,
  // byte compartido
  MENOS: 8, MAS: 9, STICK_R: 10, STICK_L: 11, HOME: 12, CAPTURA: 13,
  // byte de la izquierda (Joy-Con L)
  ABAJO: 16, ARRIBA: 17, DERECHA: 18, IZQUIERDA: 19, SR_L: 20, SL_L: 21, L: 22, ZL: 23,
};

/** Codificación de vibración HD del Joy-Con. freq en Hz (40-1252), amp 0-1. */
export function codificarVibracion(freq, amp) {
  if (amp <= 0) return [0x00, 0x01, 0x40, 0x40];
  amp = Math.min(amp, 1);
  freq = Math.min(Math.max(freq, 40), 1252);

  const enc = Math.round(Math.log2(freq * 0.1) * 32);
  const hf = (enc - 0x60) * 4;
  const lf = enc - 0x40;

  const la = Math.log2(amp * 1000) * 32;
  let encAmp;
  if (amp < 0.117) encAmp = Math.floor((la - 0x60) / (5 - amp * amp) - 1);
  else if (amp < 0.23) encAmp = Math.floor(la - 0x60 - 0x5c);
  else encAmp = Math.floor((la - 0x60) * 2 - 0xf6);
  encAmp = Math.max(0, Math.min(0xc8, encAmp));

  const hfAmp = encAmp * 2;
  let lfAmp = (encAmp >> 1) + 0x40;
  if (encAmp & 1) lfAmp += 0x80;

  return [hf & 0xff, ((hf >> 8) & 0xff) + hfAmp, ((lfAmp >> 8) & 0xff) + lf, lfAmp & 0xff];
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const ahoraMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * Ventana circular con media y desviación incrementales. Se usa para decidir
 * si el mando está quieto sin recorrer un array en cada muestra.
 */
class Ventana {
  constructor(n) { this.n = n; this.v = new Float64Array(n); this.i = 0; this.lleno = 0; this.s = 0; this.s2 = 0; }
  poner(x) {
    const viejo = this.v[this.i];
    if (this.lleno === this.n) { this.s -= viejo; this.s2 -= viejo * viejo; } else { this.lleno++; }
    this.v[this.i] = x; this.s += x; this.s2 += x * x;
    this.i = (this.i + 1) % this.n;
  }
  get completa() { return this.lleno === this.n; }
  get media() { return this.lleno ? this.s / this.lleno : 0; }
  get desviacion() {
    if (!this.lleno) return 0;
    const m = this.s / this.lleno;
    return Math.sqrt(Math.max(0, this.s2 / this.lleno - m * m));
  }
  vaciar() { this.i = 0; this.lleno = 0; this.s = 0; this.s2 = 0; }
}

export class JoyCon extends EventTarget {
  constructor() {
    super();
    this.device = null;
    this.esIzquierdo = true;
    this._contador = 0;
    this._cola = Promise.resolve();
    this._pendientes = 0;

    /** Estado público, mutado en sitio a 60 Hz. No lo guardes por referencia entre frames. */
    this.estado = {
      conectado: false,
      bateria: -1,
      cargando: false,
      mascara: 0,        // botones pulsados en el último reporte
      mascaraPrevia: 0,  // del reporte anterior (compatibilidad; usa reciénPulsado)
      stickX: 0, stickY: 0,     // normalizado -1..1
      stickCrudoX: 0, stickCrudoY: 0,
      accelX: 0, accelY: 0, accelZ: 0,   // g
      giroX: 0, giroY: 0, giroZ: 0,      // grados/s, sin sesgo
      pitch: 0, roll: 0, yaw: 0,         // grados integrados (acumulan sin límite)
      /**
       * Sube cada vez que los ángulos se reinician de golpe (recentrar o cambio
       * de mando). Quien trabaje con diferencias de ángulo —el Puntero— la
       * compara para no interpretar el reinicio como un giro enorme.
       */
      generacion: 0,
      quieto: false,
      sesgo: { x: 0, y: 0, z: 0 },       // solo lectura, para diagnóstico
      hz: 0,
      reportes: 0,
    };

    this._onReporte = this._onReporte.bind(this);
    this._reiniciarEstadoDeDispositivo();
  }

  get disponible() {
    return typeof navigator !== 'undefined' && 'hid' in navigator;
  }

  /** Reconecta sin diálogo si el usuario ya autorizó el dispositivo antes. */
  async reconectarSilencioso() {
    if (!this.disponible) return false;
    const previos = await navigator.hid.getDevices();
    const jc = previos.find((d) => d.vendorId === VID_NINTENDO);
    if (!jc) return false;
    return this._abrir(jc);
  }

  /** Abre el selector de Chrome. Requiere gesto del usuario (clic o tecla). */
  async conectar() {
    if (!this.disponible) throw new Error('Este navegador no expone WebHID. Usa Chrome o Edge.');
    const elegidos = await navigator.hid.requestDevice({ filters: [{ vendorId: VID_NINTENDO }] });
    if (!elegidos || !elegidos.length) return false;
    return this._abrir(elegidos[0]);
  }

  async _abrir(d) {
    return this.cambiarDispositivo(d);
  }

  /**
   * Secuencia de arranque. El orden y las pausas importan: sin las pausas el
   * mando ignora subcomandos, y sin el `0x40` el IMU entrega ceros para
   * siempre.
   */
  async secuenciaDeArranque() {
    await this._subcomando(0x03, [0x30]); await dormir(60); // reporte completo a 60 Hz
    await this._subcomando(0x40, [0x01]); await dormir(60); // ENCENDER el IMU
    await this._subcomando(0x48, [0x01]); await dormir(60); // habilitar vibración
    await this._subcomando(0x30, [this.esIzquierdo ? 0x01 : 0x02]); await dormir(30); // LED
  }

  /** Limpia todo lo que pertenece al mando anterior y no al siguiente. */
  _reiniciarEstadoDeDispositivo() {
    this._contador = 0;
    this._ventanaHz = [];
    this._sesgo = { x: 0, y: 0, z: 0 };
    this._sesgoFiable = false;
    this._quietoSeguido = 0;
    this._aprendidas = 0;

    this._calibrando = false;
    this._calInicio = 0;
    this._calN = 0;
    this._calSuma = { x: 0, y: 0, z: 0 };

    this._vGiro = new Ventana(QUIETUD.ventana);
    this._vGx = new Ventana(QUIETUD.ventana);
    this._vGy = new Ventana(QUIETUD.ventana);
    this._vGz = new Ventana(QUIETUD.ventana);
    this._vAcc = new Ventana(QUIETUD.ventana);

    this._flancosPulsados = 0;
    this._flancosSoltados = 0;

    this._centroX = null;
    this._centroY = null;
    this._centroN = 0;
    this._centroSx = 0;
    this._centroSy = 0;

    const s = this.estado;
    if (!s) return;
    s.hz = 0;
    s.reportes = 0;
    s.mascara = 0;
    s.mascaraPrevia = 0;
    s.pitch = s.roll = s.yaw = 0;
    s.giroX = s.giroY = s.giroZ = 0;
    s.stickX = s.stickY = 0;
    s.bateria = -1;
    s.quieto = false;
    s.sesgo = { x: 0, y: 0, z: 0 };
    s.generacion++;
  }

  async _soltarActual() {
    if (!this.device) return;
    try { this.device.removeEventListener('inputreport', this._onReporte); } catch (_) {}
    try { await this.device.close(); } catch (_) {}
    this.device = null;
  }

  /**
   * Cambia el mando **sin reemplazar este objeto**.
   *
   * Es la pieza central del cambio en caliente. `Puntero` y `Acciones` guardan
   * una referencia a esta instancia; si se creara una nueva, seguirían
   * apuntando a la vieja y el juego dejaría de responder sin dar ningún error.
   *
   * @returns {Promise<boolean>} true si el mando nuevo está entregando datos.
   */
  async cambiarDispositivo(d) {
    if (!d) return false;
    if (d !== this.device) await this._soltarActual();

    try {
      if (!d.opened) await d.open();
    } catch (e) {
      this.estado.conectado = false;
      this.dispatchEvent(new CustomEvent('fallo', { detail: { motivo: 'no se pudo abrir', error: e } }));
      return false;
    }

    this.device = d;
    this.esIzquierdo = d.productId === PID_JOYCON_L;
    this._reiniciarEstadoDeDispositivo();
    d.addEventListener('inputreport', this._onReporte);

    await this.secuenciaDeArranque();

    // No damos el cambio por bueno hasta ver datos reales llegando.
    if (!(await this.esperarVivo(1200))) {
      // Un mando dormido descarta los subcomandos en silencio. Un reintento
      // suele bastar; si tampoco, que lo despierten pulsando un botón.
      await this.secuenciaDeArranque();
      if (!(await this.esperarVivo(1200))) {
        this.estado.conectado = false;
        this.dispatchEvent(new CustomEvent('fallo', { detail: { motivo: 'sin datos' } }));
        return false;
      }
    }

    this.estado.conectado = true;
    this.calibrar();
    this.pulso(380, 0.6, 140);   // confirma al operador cuál quedó activo
    this.dispatchEvent(new CustomEvent('cambiado', { detail: { esIzquierdo: this.esIzquierdo } }));
    return true;
  }

  /**
   * Espera a que lleguen reportes **y** a que el IMU esté despierto.
   * En reposo la gravedad da ~1 g; un valor casi nulo significa IMU apagado.
   */
  async esperarVivo(msMax = 1000) {
    const base = this.estado.reportes;
    const t0 = ahoraMs();
    while (ahoraMs() - t0 < msMax) {
      const s = this.estado;
      const hayDatos = s.reportes > base + 3;
      const imu = Math.hypot(s.accelX, s.accelY, s.accelZ) > 0.2;
      if (hayDatos && imu) return true;
      await dormir(50);
    }
    return false;
  }

  /** Cierra la conexión pero deja el mando despierto y emparejado. */
  async desconectar() {
    if (!this.device) return;
    try { await this._subcomando(0x40, [0x00]); } catch (_) {}
    await this._soltarActual();
    this.estado.conectado = false;
  }

  /**
   * Manda el Joy-Con a dormir (subcomando 0x06 con 0x00). El mando no tiene
   * botón de encendido; esto es lo más parecido a apagarlo. Sigue emparejado y
   * autorizado: basta pulsar un botón para despertarlo.
   */
  async dormir() {
    if (!this.device) return false;
    try {
      await this._subcomando(0x06, [0x00]);
      await dormir(120);
    } catch (_) { /* si ya se fue, da igual */ }
    await this._soltarActual();
    this.estado.conectado = false;
    return true;
  }

  // ---------------------------------------------------------- escritura

  /**
   * Toda escritura pasa por aquí, en fila india.
   *
   * `descartable` marca los envíos que pueden perderse sin consecuencias (el
   * arranque de una vibración): si ya hay escrituras esperando, se descartan
   * en vez de acumular retraso. El apagado de una vibración NUNCA es
   * descartable, o el mando se quedaría vibrando.
   */
  _escribir(reportId, datos, descartable = false) {
    const dev = this.device;
    if (!dev) return Promise.resolve();
    if (descartable && this._pendientes >= 2) return Promise.resolve();
    this._pendientes++;
    const p = this._cola
      .then(() => dev.sendReport(reportId, datos))
      .catch(() => { /* mando dormido o cerrado: no es fatal */ })
      .finally(() => { this._pendientes--; });
    this._cola = p;
    return p;
  }

  _subcomando(id, args) {
    if (!this.device) return Promise.resolve();
    const b = new Uint8Array(48);
    b[0] = this._contador++ & 0x0f;
    b.set(RUMBLE_NEUTRO, 1);
    b[9] = id;
    if (args) b.set(args, 10);
    return this._escribir(0x01, b);
  }

  vibrar(freq = 320, amp = 0.6) {
    if (!this.device) return Promise.resolve();
    const r = codificarVibracion(freq, amp);
    const b = new Uint8Array(48);
    b[0] = this._contador++ & 0x0f;
    b.set(r, 1);
    b.set(r, 5);
    return this._escribir(0x10, b, amp > 0);
  }

  /**
   * Enciende las luces del riel con el número de jugador, como la Switch:
   * una luz el Jugador 1, dos el Jugador 2. Se usa al vincular.
   */
  luzJugador(n) {
    const mascara = [0x01, 0x03, 0x07, 0x0f][Math.max(0, Math.min(3, n - 1))];
    return this._subcomando(0x30, [mascara]);
  }

  /** Pulso de vibración. Es la forma normal de dar feedback háptico. */
  pulso(freq = 320, amp = 0.6, ms = 90) {
    this.vibrar(freq, amp);
    setTimeout(() => this.vibrar(freq, 0), ms);
    return Promise.resolve();
  }

  // ------------------------------------------------------------ calibrar

  /**
   * Mide el sesgo del giroscopio. Solo acepta muestras con el mando QUIETO:
   * si detecta movimiento, vuelve a empezar. Si en `tiempoMax` no lo consigue
   * (alguien lo tiene en la mano moviéndolo), se rinde sin romper nada: el
   * aprendizaje continuo corregirá el sesgo en cuanto el mando descanse.
   *
   * No toca los ángulos: cambiar el sesgo no mueve la linterna.
   */
  calibrar() {
    this._calibrando = true;
    this._calInicio = ahoraMs();
    this._calN = 0;
    this._calSuma = { x: 0, y: 0, z: 0 };
    // El centro del stick también se vuelve a medir, en reposo: un stick con
    // drift deja de mover solo los menús. (No hay que tocar el stick.)
    this._centroX = null;
    this._centroSx = 0; this._centroSy = 0; this._centroN = 0;
  }

  get calibrando() { return this._calibrando; }
  /** Avance de la calibración en curso, de 0 a 1 (1 si no está calibrando). */
  get progresoCalibracion() {
    return this._calibrando ? Math.min(1, (this._calN || 0) / CALIBRACION.muestras) : 1;
  }
  get sesgoFiable() { return this._sesgoFiable; }

  /**
   * Pone los ángulos en cero. Sube `generacion` para que el Puntero sepa que
   * no ha habido giro, sino un reinicio.
   */
  recentrar() {
    const s = this.estado;
    s.pitch = 0; s.roll = 0; s.yaw = 0;
    s.generacion++;
  }

  /** El motor lo llama al terminar cada fotograma: olvida los flancos ya vistos. */
  finDeFrame() {
    this._flancosPulsados = 0;
    this._flancosSoltados = 0;
  }

  // ------------------------------------------------------------- lectura

  _onReporte(e) {
    if (e.reportId !== 0x30) return;
    const d = e.data; // DataView SIN el byte de report id
    if (d.byteLength < 11) return;

    const s = this.estado;
    s.reportes++;

    const ahora = ahoraMs();
    this._ventanaHz.push(ahora);
    while (this._ventanaHz.length && ahora - this._ventanaHz[0] > 1000) this._ventanaHz.shift();
    s.hz = this._ventanaHz.length;

    const bat = d.getUint8(1);
    s.bateria = bat >> 4;
    s.cargando = (bat & 0x01) !== 0;

    // ---- botones: los flancos se acumulan hasta finDeFrame()
    const nueva = d.getUint8(2) | (d.getUint8(3) << 8) | (d.getUint8(4) << 16);
    this._flancosPulsados |= nueva & ~s.mascara;
    this._flancosSoltados |= s.mascara & ~nueva;
    s.mascaraPrevia = s.mascara;
    s.mascara = nueva;

    // ---- stick analógico (12 bits por eje, empaquetados en 3 bytes)
    const o = this.esIzquierdo ? 5 : 8;
    const rx = d.getUint8(o) | ((d.getUint8(o + 1) & 0x0f) << 8);
    const ry = (d.getUint8(o + 1) >> 4) | (d.getUint8(o + 2) << 4);
    s.stickCrudoX = rx;
    s.stickCrudoY = ry;
    if (this._centroX === null) {
      // Los primeros 30 reportes fijan el centro. No toques el stick al conectar.
      this._centroSx += rx; this._centroSy += ry; this._centroN++;
      if (this._centroN >= 30) {
        this._centroX = this._centroSx / this._centroN;
        this._centroY = this._centroSy / this._centroN;
      }
    } else {
      const nx = (rx - this._centroX) / 1300;
      const ny = (ry - this._centroY) / 1300;
      const zonaMuerta = 0.12;
      s.stickX = Math.abs(nx) < zonaMuerta ? 0 : Math.max(-1, Math.min(1, nx));
      s.stickY = Math.abs(ny) < zonaMuerta ? 0 : Math.max(-1, Math.min(1, ny));
    }

    // ---- IMU: 3 muestras de 12 bytes, separadas 5 ms
    if (d.byteLength >= 48) {
      let sax = 0, say = 0, saz = 0;
      for (let i = 0; i < 3; i++) {
        const p = 12 + i * 12;
        const ax = d.getInt16(p, true) * ACC_ESCALA;
        const ay = d.getInt16(p + 2, true) * ACC_ESCALA;
        const az = d.getInt16(p + 4, true) * ACC_ESCALA;
        const gx = d.getInt16(p + 6, true) * GYR_ESCALA;
        const gy = d.getInt16(p + 8, true) * GYR_ESCALA;
        const gz = d.getInt16(p + 10, true) * GYR_ESCALA;
        sax += ax; say += ay; saz += az;
        this._muestraImu(gx, gy, gz, Math.hypot(ax, ay, az));
      }
      s.accelX = sax / 3; s.accelY = say / 3; s.accelZ = saz / 3;
    }
  }

  /** Una muestra del IMU: quietud, calibración, sesgo e integración. */
  _muestraImu(gx, gy, gz, accMag) {
    const s = this.estado;

    this._vGiro.poner(Math.hypot(gx, gy, gz));
    this._vGx.poner(gx); this._vGy.poner(gy); this._vGz.poner(gz);
    this._vAcc.poner(accMag);

    // Quieto = giro crudo pequeño, estable, y acelerómetro estable. Se mide
    // sobre los valores CRUDOS a propósito: si el sesgo estuviera muy mal,
    // medir sobre valores corregidos impediría detectar la quietud justo
    // cuando más hace falta.
    const desv = Math.max(this._vGx.desviacion, this._vGy.desviacion, this._vGz.desviacion);
    // Con un sesgo ya fiable, la magnitud se mira ya corregida: si no, un mando
    // con mucho desvío nunca se daría por quieto y dejaría de corregirse solo.
    const b0 = this._sesgo;
    const magnitud = this._sesgoFiable
      ? Math.hypot(this._vGx.media - b0.x, this._vGy.media - b0.y, this._vGz.media - b0.z)
      : this._vGiro.media;
    s.quieto = this._vGiro.completa &&
      magnitud < QUIETUD.magnitudMax &&
      desv < QUIETUD.desviacionMax &&
      this._vAcc.desviacion < QUIETUD.accelDesvMax;

    // --- calibración explícita: con el mando apoyado (ver CALIBRACION)
    if (this._calibrando) {
      const apoyado = this._vGiro.completa &&
        this._vGiro.media < CALIBRACION.magnitudMax &&
        desv < CALIBRACION.desviacionMax &&
        this._vAcc.desviacion < CALIBRACION.accelDesvMax;
      if (apoyado) {
        this._calSuma.x += gx; this._calSuma.y += gy; this._calSuma.z += gz;
        if (++this._calN >= CALIBRACION.muestras) {
          this._sesgo = {
            x: this._calSuma.x / this._calN,
            y: this._calSuma.y / this._calN,
            z: this._calSuma.z / this._calN,
          };
          this._sesgoFiable = true;
          this._calibrando = false;
          this.dispatchEvent(new CustomEvent('calibrado', { detail: { sesgo: { ...this._sesgo } } }));
        }
      } else if (this._calN > 0) {
        // Se movió a mitad de medida: lo acumulado ya no sirve.
        this._calN = 0;
        this._calSuma = { x: 0, y: 0, z: 0 };
      }
      if (this._calibrando && ahoraMs() - this._calInicio > CALIBRACION.tiempoMax) {
        this._calibrando = false;
        this.dispatchEvent(new CustomEvent('calibracion-incompleta'));
      }
    } else if (s.quieto) {
      this._quietoSeguido++;
      // --- aprendizaje continuo: con el mando quieto, lo que marca es sesgo.
      const b = this._sesgo;
      const dx = this._vGx.media - b.x, dy = this._vGy.media - b.y, dz = this._vGz.media - b.z;
      // Sin sesgo fiable (no se pudo calibrar) se aprende todo: es arrancar.
      // Con sesgo fiable, solo retoques pequeños: ver QUIETUD.correccionMax.
      const admisible = !this._sesgoFiable || Math.hypot(dx, dy, dz) < QUIETUD.correccionMax;
      if (this._quietoSeguido >= QUIETUD.quietoMinimo && admisible) {
        const alfa = DT_MUESTRA / QUIETUD.constanteAprendizaje;
        b.x += dx * alfa; b.y += dy * alfa; b.z += dz * alfa;
        if (!this._sesgoFiable && ++this._aprendidas >= QUIETUD.arranque) this._sesgoFiable = true;
      }
    }
    if (!s.quieto) this._quietoSeguido = 0;
    s.sesgo = this._sesgo;

    s.giroX = gx - this._sesgo.x;
    s.giroY = gy - this._sesgo.y;
    s.giroZ = gz - this._sesgo.z;

    // Se integra siempre. Filtrar el temblor aquí congelaría también los
    // movimientos lentos y deliberados de apuntar; eso se hace en el Puntero,
    // de forma gradual.
    s.pitch += s.giroX * DT_MUESTRA;
    s.roll += s.giroY * DT_MUESTRA;
    s.yaw += s.giroZ * DT_MUESTRA;
  }

  // ------------------------------------------------------------ consultas
  pulsado(bit) { return (this.estado.mascara & (1 << bit)) !== 0; }

  /**
   * ¿Se pulsó desde el último fotograma? Aunque la pulsación haya durado un
   * solo reporte y ya se haya soltado. Esto es lo que antes fallaba.
   */
  reciénPulsado(bit) { return (this._flancosPulsados & (1 << bit)) !== 0; }
  reciénSoltado(bit) { return (this._flancosSoltados & (1 << bit)) !== 0; }

  /** Gatillo del mando conectado, sea L o R. Evita ramificar en cada escena. */
  get bitGatillo() { return this.esIzquierdo ? BOTON.ZL : BOTON.ZR; }
  get bitHombro() { return this.esIzquierdo ? BOTON.L : BOTON.R; }
  /** Botón de acción secundaria. */
  get bitAccion() { return this.esIzquierdo ? BOTON.ABAJO : BOTON.A; }
}

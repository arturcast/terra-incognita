/**
 * mandos.js — Gestor de Joy-Con para el stand.
 *
 * Conectar, soltar, cambiar en caliente, vigilar batería y diagnosticar.
 * El plan completo y el porqué de cada decisión están en
 * docs/MODULO-MANDOS.md.
 *
 * Idea central: el objeto `JoyCon` **nunca se reemplaza**. Este gestor le
 * cambia el dispositivo por debajo. Las escenas ni se enteran.
 *
 * UN JOY-CON POR JUGADOR (pedido del usuario, 2026-09-26): cada jugador tiene un
 * solo mando, de cualquier lado, y un mando es de un solo jugador. Quién es
 * quién se decide en la pantalla de vinculación (escenas/jugadores.js), estilo
 * Switch: cada uno mantiene pulsados el gatillo y el botón de hombro de SU
 * Joy-Con (ZL + L o ZR + R). Este gestor avisa con el evento 'registro'.
 *
 * Los mandos que no están en juego también se abren, pero con el IMU apagado:
 * así se les puede leer la batería sin gastarla de más, y el cambio en
 * caliente no tiene que pedir permisos ni abrir diálogos.
 */

import { VID_NINTENDO, PID_JOYCON_L } from './joycon.js';

/** Los cinco estados que reporta el hardware. No hay nada entre medias. */
export const NIVEL = { LLENA: 8, MEDIA: 6, BAJA: 4, CRITICA: 2, VACIA: 0 };

export const ETIQUETA_NIVEL = {
  8: 'llena', 6: 'media', 4: 'baja', 2: 'crítica', 0: 'vacía',
};

export const COLOR_NIVEL = {
  8: '#4ade80', 6: '#8b9099', 4: '#e8b04b', 2: '#e0614a', 0: '#e0614a',
};

const CLAVE_HISTORIAL = 'ti.bateria.historial';
const RUMBLE_NEUTRO = [0x00, 0x01, 0x40, 0x40, 0x00, 0x01, 0x40, 0x40];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Redondea al escalón real más cercano: el hardware solo usa 8/6/4/2/0. */
function escalon(n) {
  if (n >= 7) return 8;
  if (n >= 5) return 6;
  if (n >= 3) return 4;
  if (n >= 1) return 2;
  return 0;
}

export class GestorMandos extends EventTarget {
  /**
   * @param {JoyCon|JoyCon[]} joycons Un JoyCon por jugador. Cada uno es una
   *   RANURA: el gestor le cambia el dispositivo por debajo, pero el objeto
   *   nunca se reemplaza (Puntero y Acciones guardan referencias a él).
   *   Con un solo JoyCon todo funciona como antes del modo de dos jugadores.
   */
  constructor(joycons) {
    super();
    this.jugadores = Array.isArray(joycons) ? joycons : [joycons];
    /** id del mando que ocupa cada ranura, o null si está vacía. */
    this.ranuras = this.jugadores.map(() => null);
    /** @type {Map<string, object>} id -> entrada del inventario */
    this.entradas = new Map();

    this.avisosPendientes = [];
    this._nivelAvisado = {};      // id -> último nivel por el que ya se avisó
    this._ids = new WeakMap();
    this._siguienteId = 1;
    this._cambiando = false;
    this._historial = this._leerHistorial();

    if (typeof navigator !== 'undefined' && navigator.hid) {
      navigator.hid.addEventListener('disconnect', (ev) => this._alDesconectar(ev.device));
      navigator.hid.addEventListener('connect', () => this.refrescar());
    }
    this._vigilancia = setInterval(() => this._vigilar(), 1000);
  }

  get disponible() {
    return typeof navigator !== 'undefined' && 'hid' in navigator;
  }

  // Compatibilidad con el código de un solo jugador: la ranura 0 es "el" mando.
  get jc() { return this.jugadores[0]; }
  get idActivo() { return this.ranuras[0]; }
  set idActivo(v) { this.ranuras[0] = v; }

  /** Ranura que ocupa un mando, o -1 si no está en juego. */
  ranuraDe(id) { return id ? this.ranuras.indexOf(id) : -1; }
  enJuego(id) { return this.ranuraDe(id) >= 0; }
  /** Cuántos jugadores tienen mando ahora mismo. */
  get jugadoresConectados() {
    return this.ranuras.filter((id, r) => id && this.jugadores[r].estado.conectado).length;
  }

  _id(device) {
    if (!this._ids.has(device)) this._ids.set(device, 'jc' + this._siguienteId++);
    return this._ids.get(device);
  }

  /** Clave estable entre sesiones, para el historial de batería. */
  _clavePersistente(device) {
    return (device.productName || 'joycon') + '#' + device.productId;
  }

  // ------------------------------------------------------------ inventario

  /**
   * Relee los mandos que Chrome ya tiene autorizados. No abre ningún diálogo:
   * `getDevices()` solo devuelve lo autorizado antes en **este mismo origen**
   * (esquema + host + puerto). Por eso el puerto del stand no se cambia.
   */
  async refrescar() {
    if (!this.disponible) return [];
    const encontrados = await navigator.hid.getDevices();
    const joycons = encontrados.filter((d) => d.vendorId === VID_NINTENDO);

    // Altas
    for (const d of joycons) {
      const id = this._id(d);
      if (this.entradas.has(id)) continue;
      this.entradas.set(id, {
        id,
        device: d,
        nombre: d.productId === PID_JOYCON_L ? 'Joy-Con (L)' : 'Joy-Con (R)',
        esIzquierdo: d.productId === PID_JOYCON_L,
        estado: 'autorizado',
        bateria: -1,
        cargando: false,
        hz: 0,
        ultimoReporte: 0,
        _contador: 0,
        _oyente: null,
        _ventanaHz: [],
      });
    }

    // Bajas
    for (const [id, e] of [...this.entradas]) {
      if (!joycons.includes(e.device)) {
        const r = this.ranuraDe(id);
        if (r >= 0) this.ranuras[r] = null;
        this.entradas.delete(id);
      }
    }

    // Los que no están en juego pasan a vigilancia de batería.
    for (const e of this.entradas.values()) {
      if (!this.enJuego(e.id)) await this._vigilarBateria(e);
    }

    this._emitir('inventario');
    return this.inventario;
  }

  get inventario() {
    return [...this.entradas.values()].map((e) => ({
      id: e.id,
      nombre: e.nombre,
      esIzquierdo: e.esIzquierdo,
      estado: this.enJuego(e.id) ? 'activo' : e.estado,
      ranura: this.ranuraDe(e.id),
      bateria: e.bateria,
      nivel: e.bateria < 0 ? null : escalon(e.bateria),
      cargando: e.cargando,
      hz: e.hz,
      autonomia: this.estimarAutonomia(e),
      esActivo: this.enJuego(e.id),
    }));
  }

  get activo() {
    return this.idActivo ? this.entradas.get(this.idActivo) : null;
  }

  /**
   * El mejor candidato para un cambio: el que más batería tenga.
   *
   * Un mando cuya batería todavía no se ha leído (-1) también vale, detrás de
   * los que sí se conocen. Antes se descartaba, y eso obligaba a pasar por el
   * selector de Chrome aunque el mando ya estuviera autorizado.
   */
  get relevo() {
    const otros = [...this.entradas.values()].filter((e) =>
      !this.enJuego(e.id) && e.estado !== 'perdido' &&
      (e.bateria < 0 || e.bateria > NIVEL.VACIA));
    otros.sort((a, b) => b.bateria - a.bateria);
    return otros[0] || null;
  }

  /** Para la conexión inicial: el mejor mando autorizado, esté o no en juego. */
  mejorDisponible() {
    return this.activo || this.relevoPara(0);
  }

  /** ¿Puede este mando ser el jugador `ranura`? '' si sí; si no, el porqué. */
  razonNo(id, ranura) {
    if (!this.entradas.get(id)) return 'Ese mando no está autorizado.';
    if (ranura < 0 || ranura >= this.jugadores.length) return 'No hay ese jugador.';
    return '';
  }

  puedeIr(id, ranura) { return !this.razonNo(id, ranura); }

  /** El relevo de un jugador: el mando libre con más batería (de cualquier lado). */
  relevoPara(_ranura) { return this.relevo; }

  // --------------------------------------------------- vigilancia pasiva

  /**
   * Abre un mando en reserva y le vigila la batería **gastando lo mínimo**.
   *
   * Se pone en modo simple (0x3F), que solo transmite cuando cambia un botón,
   * y se le apaga el IMU. La batería se pregunta cada 20 s con el subcomando
   * 0x50, cuya respuesta (0x21) trae el mismo byte de batería que el 0x30.
   *
   * La primera versión lo dejaba en modo completo a 60 Hz. Con dos mandos
   * autorizados eran dos flujos compitiendo por el mismo Bluetooth, y el mando
   * en juego perdía reportes. El laboratorio de pruebas abre uno solo; por eso
   * allí todo iba bien.
   */
  async _vigilarBateria(e) {
    if (e._oyente) return;
    try {
      if (!e.device.opened) await e.device.open();
    } catch (_) {
      e.estado = 'perdido';
      return;
    }
    e._oyente = (ev) => {
      e.ultimoReporte = performance.now();
      if ((ev.reportId === 0x21 || ev.reportId === 0x30) && ev.data.byteLength >= 2) {
        const bat = ev.data.getUint8(1);
        this._anotarBateria(e, bat >> 4, (bat & 0x01) !== 0);
      }
      if (e._esperaRespuesta && ev.reportId === 0x21) {
        e._esperaRespuesta();
        e._esperaRespuesta = null;
      }
      // Alguien pulsó un botón en un mando de reserva: quiere jugar. En modo
      // simple (0x3F) los botones van en los bytes 0-1; en 0x30, en los 2-4.
      const d = ev.data;
      const pulso = ev.reportId === 0x3f
        ? d.byteLength >= 2 && (d.getUint8(0) | d.getUint8(1)) !== 0
        : ev.reportId === 0x30 && d.byteLength >= 5 && (d.getUint8(2) | d.getUint8(3) | d.getUint8(4)) !== 0;
      const ahora = performance.now();
      if (pulso && ahora - (e._ultimoBoton || 0) > 600) {
        e._ultimoBoton = ahora;
        this._emitir('botonReserva', { entrada: e });
      }
      // Gatillo + botón de hombro a la vez (ZL + L o ZR + R): «soy yo», en la
      // pantalla de vinculación. En modo simple (0x3F) los dos van en el
      // segundo byte (0x40 hombro, 0x80 gatillo), en los dos lados; en 0x30,
      // en el byte del lado del mando.
      const combo = ev.reportId === 0x3f
        ? d.byteLength >= 2 && (d.getUint8(1) & 0xc0) === 0xc0
        : ev.reportId === 0x30 && d.byteLength >= 5 &&
          ((d.getUint8(2) & 0xc0) === 0xc0 || (d.getUint8(4) & 0xc0) === 0xc0);
      if (combo && (e._ultimoCombo === undefined || ahora - e._ultimoCombo > 800)) {
        e._ultimoCombo = ahora;
        this._emitir('registro', { entrada: e });
      }
    };
    e.device.addEventListener('inputreport', e._oyente);
    await this._subcomandoSuelto(e, 0x40, [0x00]);  // IMU apagado
    await this._subcomandoSuelto(e, 0x03, [0x3f]);  // modo simple: casi sin tráfico
    await this._subcomandoSuelto(e, 0x50);          // primera lectura de batería
    e._sondeo = setInterval(() => this._subcomandoSuelto(e, 0x50), 20000);
    e.hz = 0;
    e.estado = 'listo';
  }

  _dejarDeVigilar(e) {
    if (e._sondeo) { clearInterval(e._sondeo); e._sondeo = null; }
    if (!e._oyente) return;
    try { e.device.removeEventListener('inputreport', e._oyente); } catch (_) {}
    e._oyente = null;
    e.hz = 0;
    e._ventanaHz = [];
  }

  /**
   * Subcomando a un mando que no es el activo (el activo lo maneja JoyCon).
   * En cola, igual que en el driver: nunca dos escrituras solapadas.
   */
  _subcomandoSuelto(e, id, args) {
    const b = new Uint8Array(48);
    b[0] = e._contador++ & 0x0f;
    b.set(RUMBLE_NEUTRO, 1);
    b[9] = id;
    if (args) b.set(args, 10);
    e._cola = (e._cola || Promise.resolve())
      .then(() => e.device.sendReport(0x01, b))
      .catch(() => { /* dormido */ });
    return e._cola;
  }

  /** ¿Responde un mando en reserva? Le pregunta la batería y espera la respuesta. */
  async _respondeEnReserva(e, ms = 800) {
    const respondio = new Promise((ok) => { e._esperaRespuesta = () => ok(true); });
    this._subcomandoSuelto(e, 0x50);
    const r = await Promise.race([respondio, dormir(ms).then(() => false)]);
    e._esperaRespuesta = null;
    return r;
  }

  // ----------------------------------------------------------- ciclo vida

  /** Abre el selector de Chrome. Requiere un gesto del usuario. */
  async autorizar() {
    if (!this.disponible) throw new Error('Este navegador no expone WebHID.');
    const elegidos = await navigator.hid.requestDevice({
      filters: [{ vendorId: VID_NINTENDO }],
    });
    await this.refrescar();
    return elegidos && elegidos.length ? this._id(elegidos[0]) : null;
  }

  /**
   * Pone un mando en juego en una ranura (0 = jugador 1, 1 = jugador 2).
   * Es el cambio en caliente.
   *
   * Si ese mando ya estaba en otra ranura, sale de ella: un mando no puede ser
   * dos jugadores. El que ocupaba la ranura pasa a reserva vigilada.
   */
  async activar(id, ranura = 0) {
    const e = this.entradas.get(id);
    if (!e || this._cambiando || ranura < 0 || ranura >= this.jugadores.length) return false;
    const jc = this.jugadores[ranura];
    if (this.ranuras[ranura] === id && jc.estado.conectado) return true;
    // Regla de los lados: izquierdo y derecho son de jugadores distintos.

    this._cambiando = true;
    this._emitir('cambiando', { entrada: e, ranura });
    try {
      const otra = this.ranuraDe(id);
      if (otra >= 0 && otra !== ranura) {
        await this.jugadores[otra].desconectar();
        this.ranuras[otra] = null;
      }

      const previoId = this.ranuras[ranura];
      const previo = previoId && previoId !== id ? this.entradas.get(previoId) : null;
      if (previo) previo.estado = 'listo';

      this._dejarDeVigilar(e);       // el JoyCon de la ranura toma el control
      const ok = await jc.cambiarDispositivo(e.device);
      if (!ok) {
        e.estado = 'perdido';
        if (this.ranuras[ranura] === id) this.ranuras[ranura] = null;
        this._emitir('inventario');
        return false;
      }

      this.ranuras[ranura] = id;
      e.estado = 'activo';
      this._nivelAvisado[id] = undefined;   // que vuelva a avisar con el nuevo

      if (previo && !this.enJuego(previo.id)) await this._vigilarBateria(previo);
      this._emitir('cambio', { entrada: e, ranura });
      this._emitir('inventario');
      return true;
    } finally {
      this._cambiando = false;
    }
  }

  /**
   * Deja libre la ranura de un jugador. El mando no se cierra: vuelve a la
   * reserva, vigilado y listo para entrar otra vez. Es lo que hace el panel al
   * pasar de dos jugadores a uno.
   */
  async liberarRanura(ranura) {
    const id = this.ranuras[ranura];
    if (!id || this._cambiando) return;
    await this.jugadores[ranura].desconectar();
    this.ranuras[ranura] = null;
    const e = this.entradas.get(id);
    if (e) {
      e.estado = 'listo';
      await this._vigilarBateria(e);
    }
    this._emitir('inventario');
  }

  /** Cierra un mando sin perder su autorización. Si estaba en juego, su ranura queda vacía. */
  async soltar(id) {
    const e = this.entradas.get(id);
    if (!e) return;
    this._dejarDeVigilar(e);
    const r = this.ranuraDe(id);
    if (r >= 0) {
      await this.jugadores[r].desconectar();
      this.ranuras[r] = null;
    }
    try { if (e.device.opened) await e.device.close(); } catch (_) {}
    e.estado = 'autorizado';
    e.bateria = -1;
    this._emitir('inventario');
  }

  /** Pasa al mando del mismo lado con más batería. Devuelve false si no hay a dónde ir. */
  async cambiarARelevo(ranura = 0) {
    const r = this.relevoPara(ranura);
    if (!r) {
      this._avisar('No hay otro mando disponible para el jugador ' + (ranura + 1) + '.', 'grave');
      return false;
    }
    return this.activar(r.id, ranura);
  }

  // ------------------------------------------------------------ batería

  _anotarBateria(e, nivelCrudo, cargando) {
    const previo = e.bateria;
    e.bateria = nivelCrudo;
    e.cargando = cargando;
    if (escalon(previo) === escalon(nivelCrudo)) return;

    this._registrarTransicion(e, escalon(nivelCrudo));
    this._emitir('bateria', { entrada: e, nivel: escalon(nivelCrudo) });
    this._evaluarAviso(e);
  }

  /**
   * Genera el aviso, pero **no lo muestra**: lo deja en cola.
   *
   * Interrumpir a un visitante a mitad de partida para ahorrarle treinta
   * segundos al operador es un mal negocio. Quien consume la cola decide
   * cuándo, y lo normal es esperar al cambio de escena.
   */
  _evaluarAviso(e) {
    if (e.cargando) return;
    const n = escalon(e.bateria);
    if (n > NIVEL.BAJA) return;
    if (this._nivelAvisado[e.id] === n) return;
    this._nivelAvisado[e.id] = n;

    const r = this.ranuraDe(e.id);
    const donde = r >= 0 ? 'jugador ' + (r + 1) : 'de reserva';
    if (n === NIVEL.BAJA) {
      this._avisar(e.nombre + ' (' + donde + '): batería baja. Cámbialo entre visitantes.', 'aviso');
    } else if (n === NIVEL.CRITICA) {
      this._avisar(e.nombre + ' (' + donde + '): batería crítica. Cambia ya.', 'grave');
    }
  }

  _avisar(texto, gravedad) {
    this.avisosPendientes.push({ texto, gravedad, t: Date.now() });
    this._emitir('aviso', { texto, gravedad });
  }

  /** Devuelve los avisos acumulados y vacía la cola. */
  consumirAvisos() {
    const a = this.avisosPendientes;
    this.avisosPendientes = [];
    return a;
  }

  // ------------------------------------------------- estimación de autonomía

  _leerHistorial() {
    try { return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL)) || {}; }
    catch (_) { return {}; }
  }

  _guardarHistorial() {
    try { localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(this._historial)); }
    catch (_) { /* modo incógnito o almacenamiento bloqueado */ }
  }

  _registrarTransicion(e, nivel) {
    if (e.cargando) return;
    const k = this._clavePersistente(e.device);
    const lista = this._historial[k] || (this._historial[k] = []);
    const ultimo = lista[lista.length - 1];
    // Solo interesan las bajadas; al cargar se reinicia el seguimiento.
    if (ultimo && nivel > ultimo.nivel) { this._historial[k] = [{ nivel, t: Date.now() }]; }
    else lista.push({ nivel, t: Date.now() });
    if (lista.length > 6) lista.shift();
    this._guardarHistorial();
  }

  /**
   * Estimación en horas a partir de cuánto tardó el último escalón.
   *
   * Cinco escalones son poca resolución y la descarga no es lineal, así que
   * esto se muestra siempre como aproximación y no se automatiza ninguna
   * decisión con ello. Las decisiones se toman con los umbrales, que sí son
   * un dato real del hardware.
   */
  estimarAutonomia(e) {
    if (e.bateria < 0 || e.cargando) return null;
    const lista = this._historial[this._clavePersistente(e.device)];
    if (!lista || lista.length < 2) return null;
    const a = lista[lista.length - 2], b = lista[lista.length - 1];
    const saltos = (a.nivel - b.nivel) / 2;
    if (saltos <= 0) return null;
    const msPorEscalon = (b.t - a.t) / saltos;
    if (msPorEscalon < 60000) return null;         // datos absurdos, no estimamos
    const horas = (escalon(e.bateria) / 2) * msPorEscalon / 3600000;
    return Math.round(horas * 10) / 10;
  }

  // ------------------------------------------------------------ diagnóstico

  /**
   * Escucha unos segundos y devuelve un informe accionable, no un booleano.
   * Solo tiene sentido sobre el mando activo: es el único con el IMU encendido.
   */
  async probar(id, ms = 3000) {
    const e = this.entradas.get(id);
    if (!e) return { ok: false, veredicto: 'Ese mando ya no está' };
    const ranura = this.ranuraDe(id);
    if (ranura < 0) {
      // En reserva no transmite de continuo (a propósito): se le pregunta.
      const responde = await this._respondeEnReserva(e);
      return {
        ok: responde,
        bateria: e.bateria < 0 ? null : escalon(e.bateria),
        veredicto: responde
          ? 'En reserva y respondiendo. Ponlo en juego para probarlo a fondo.'
          : 'En reserva y sin responder. Puede estar dormido: pulsa un botón.',
      };
    }

    const s = this.jugadores[ranura].estado;
    const base = s.reportes;
    const t0 = performance.now();
    let mascaraVista = 0;
    let giroMax = 0;
    const tic = setInterval(() => {
      mascaraVista |= s.mascara;
      giroMax = Math.max(giroMax, Math.hypot(s.giroX, s.giroY, s.giroZ));
    }, 16);

    await dormir(ms);
    clearInterval(tic);

    const transcurrido = (performance.now() - t0) / 1000;
    const hz = Math.round((s.reportes - base) / transcurrido);
    const imuVivo = Math.hypot(s.accelX, s.accelY, s.accelZ) > 0.2;
    const latencia = hz > 0 ? Math.round(1000 / hz) : null;

    let veredicto;
    if (hz === 0) veredicto = 'No llegan datos. El mando puede estar dormido o fuera de alcance.';
    else if (!imuVivo) veredicto = 'Llegan datos pero el giroscopio está apagado. Vuelve a ponerlo en juego.';
    else if (hz < 40) veredicto = 'Responde lento (' + hz + ' Hz). Acércate o revisa interferencias.';
    else veredicto = 'Funciona correctamente.';

    return {
      ok: hz >= 40 && imuVivo,
      hz, latencia, imuVivo,
      botonesResponden: mascaraVista !== 0,
      movimientoDetectado: giroMax > 8,
      bateria: escalon(s.bateria),
      veredicto,
    };
  }

  // -------------------------------------------------------------- vigilancia

  _alDesconectar(device) {
    const id = this._ids.get(device);
    if (!id || !this.entradas.has(id)) return;
    const e = this.entradas.get(id);
    this._dejarDeVigilar(e);
    e.estado = 'perdido';
    e.bateria = -1;
    e.hz = 0;
    const r = this.ranuraDe(id);
    if (r >= 0) {
      this.jugadores[r].estado.conectado = false;
      this.ranuras[r] = null;
      this._avisar(e.nombre + ' (jugador ' + (r + 1) + ') se desconectó.', 'grave');
      this._emitir('perdido', { entrada: e, ranura: r });
      // Si hay relevo, entra; si no, esa ranura queda vacía y el juego sigue
      // con los jugadores que queden. Nunca se bloquea por falta de un mando.
      if (this.relevoPara(r)) this.cambiarARelevo(r);
    }
    this._emitir('inventario');
  }

  /** Latido de vigilancia, ranura por ranura. Detecta lo que los eventos no cubren. */
  _vigilar() {
    if (this._cambiando) return;
    this.ranuras.forEach((id, r) => {
      const a = id ? this.entradas.get(id) : null;
      if (!a) return;
      const est = this.jugadores[r].estado;

      // Batería: la lee el JoyCon de la ranura; aquí solo se interpreta.
      if (est.conectado && est.bateria >= 0) {
        this._anotarBateria(a, est.bateria, est.cargando);
        a.hz = est.hz;
      }

      // Agotado: cambiar sin preguntar, si hay a dónde.
      if (!a.cargando && a.bateria >= 0 && escalon(a.bateria) === NIVEL.VACIA && this.relevoPara(r)) {
        this._avisar(a.nombre + ' (jugador ' + (r + 1) + ') se quedó sin batería. Cambiando al de reserva.', 'grave');
        this.cambiarARelevo(r);
        return;
      }

      // Mudo: dejó de llegar nada.
      if (est.conectado && est.hz === 0 && est.reportes > 0) {
        a.estado = 'dormido';
        this._emitir('inventario');
      }
    });
  }

  _emitir(tipo, detalle = {}) {
    this.dispatchEvent(new CustomEvent(tipo, { detail: detalle }));
  }

  // -------------------------------------------------- utilidades de prueba

  /**
   * Inyecta un nivel de batería sin tocar el hardware. Para poder verificar
   * los avisos y el cambio automático sin esperar cinco horas.
   * Ver docs/MODULO-MANDOS.md, sección 9.
   */
  _forzarNivel(nivel, id = this.ranuras[0]) {
    const e = this.entradas.get(id);
    if (!e) return 'no hay mando con ese id';
    this._nivelAvisado[id] = undefined;
    this._anotarBateria(e, nivel, false);
    return e.nombre + ' -> ' + (ETIQUETA_NIVEL[escalon(nivel)] || nivel);
  }

  destruir() {
    clearInterval(this._vigilancia);
    for (const e of this.entradas.values()) this._dejarDeVigilar(e);
  }
}

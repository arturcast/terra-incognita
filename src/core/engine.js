/**
 * engine.js — Bucle, lienzo y máquina de escenas.
 *
 * Deliberadamente pequeño: sin motor de terceros, sin paso de compilación,
 * sin npm. Módulos ES nativos servidos por un servidor local. Esto no es
 * minimalismo por gusto — es la única vía que no choca con Sophos en el
 * equipo corporativo. Ver docs/ARQUITECTURA.md.
 */

/** Contrato que cumple toda etapa de la expedición. */
export class Escena {
  constructor(motor) {
    this.motor = motor;
  }
  /** Se llama al entrar. Puede ser async; el fundido espera. */
  async entrar(_datos) {}
  /** Se llama al salir. Libera timers, listeners, etc. */
  salir() {}
  /** dt en segundos. */
  actualizar(_dt) {}
  /** Dibuja sobre el lienzo ya limpiado. */
  dibujar(_ctx) {}
}

export class Motor {
  /**
   * @param {JoyCon|JoyCon[]} joycons Uno por jugador. `motor.jc` sigue siendo
   *   el del jugador 1, así las escenas de un jugador no cambian.
   */
  constructor(canvas, joycons) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.jugadores = Array.isArray(joycons) ? joycons : [joycons];

    this.escenas = new Map();
    this.escena = null;
    this.nombreEscena = null;

    /**
     * Motor de audio. Lo asigna main.js tras el gesto del usuario, porque
     * Web Audio no arranca sin uno. Las escenas comprueban que exista antes
     * de usarlo: sin sonido el juego debe seguir funcionando igual.
     */
    this.audio = null;
    /** Reproductor de videos de etapa (cinematica.js). Opcional, lo pone main.js. */
    this.cinematicas = null;
    /** Menú de pausa (ui/pausa.js). Opcional, lo pone main.js. */
    this.pausa = null;

    this.ancho = 0;
    this.alto = 0;
    this.tiempo = 0;
    this.fps = 60;

    /** Estado que sobrevive entre etapas: el progreso de la expedición. */
    this.expedicion = {
      etapasCompletadas: [],
      puntajes: {},
      /** Cuántos juegan (1 o 2), elegido al empezar; 0 = sin elegir. */
      jugadores: 0,
      /** El nombre de cada jugador, puesto al empezar. */
      nombres: [],
    };

    this._ultimo = 0;
    this._fundido = 0;        // 1 = negro total
    this._fundidoObjetivo = 0;
    this._transicionando = false;

    this._ajustar = this._ajustar.bind(this);
    this._frame = this._frame.bind(this);
    window.addEventListener('resize', this._ajustar);
    this._ajustar();
  }

  /**
   * Tope a la resolución del lienzo (píxeles reales por píxel de pantalla).
   * Una escena pesada en 2D lo baja al entrar y lo quita al salir (null).
   */
  limitarResolucion(tope) {
    this._tope = tope || null;
    this._ajustar();
  }

  _ajustar() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, this._tope || Infinity);
    /** Resolución real del lienzo ahora mismo: la usan los lienzos aparte. */
    this.dpr = dpr;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ancho = r.width;
    this.alto = r.height;
    if (this.escena && this.escena.alRedimensionar) this.escena.alRedimensionar();
  }

  registrar(nombre, escena) {
    this.escenas.set(nombre, escena);
    return this;
  }

  /**
   * Cambia de escena con fundido. Ignora llamadas durante una transición.
   * @param {{cinematica?: string}} [opciones] un video a ver antes de esta
   *   escena en lugar del suyo (p. ej. «inicio» antes del recorrido).
   */
  async ir(nombre, datos = null, opciones = {}) {
    if (this._transicionando) return;
    if (this.pausa) this.pausa.cerrar();
    const siguiente = this.escenas.get(nombre);
    if (!siguiente) throw new Error('Escena desconocida: ' + nombre);

    this._transicionando = true;
    if (this.escena) {
      await this._fundirA(1, 260);
      this.escena.salir();
    }
    // Video de la etapa, si la escena tiene uno y el archivo existe. Se ve con
    // la pantalla en negro detrás; mientras dura, el reproductor hace de
    // escena para que el gatillo lo pueda saltar.
    const video = opciones.cinematica || siguiente.cinematica;
    if (video && this.cinematicas) {
      this.escena = this.cinematicas;
      this._fundido = 1;
      // El video trae su sonido: la música del juego se aparta mientras dura.
      if (this.audio && this.audio.atenuarMusica) this.audio.atenuarMusica(true);
      await this.cinematicas.reproducir(video);
      if (this.audio && this.audio.atenuarMusica) this.audio.atenuarMusica(false);
    }
    this.escena = siguiente;
    this.nombreEscena = nombre;
    await siguiente.entrar(datos);
    await this._fundirA(0, 320);
    this._transicionando = false;
  }

  _fundirA(objetivo, ms) {
    return new Promise((resolver) => {
      const desde = this._fundido;
      const t0 = performance.now();
      const paso = () => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        // suavizado coseno, más agradable que lineal
        const e = 0.5 - Math.cos(k * Math.PI) / 2;
        this._fundido = desde + (objetivo - desde) * e;
        if (k < 1) requestAnimationFrame(paso);
        else { this._fundido = objetivo; resolver(); }
      };
      paso();
    });
  }

  /** ¿Está el menú de pausa abierto? Las escenas lo miran para no animar nada. */
  get pausado() { return !!(this.pausa && this.pausa.abierta); }

  /** El mando del jugador 1. Las escenas de un jugador solo usan este. */
  get jc() { return this.jugadores[0]; }

  /** Jugadores con mando conectado ahora mismo (índices de ranura). */
  get jugadoresActivos() {
    return this.jugadores.map((j, i) => (j.estado.conectado ? i : -1)).filter((i) => i >= 0);
  }

  /**
   * Rectángulo de la pantalla que le toca a un jugador cuando se juega a
   * pantalla partida: columnas verticales iguales, con una franja entre ellas.
   */
  ranura(i, n) {
    if (n <= 1) return { x: 0, y: 0, ancho: this.ancho, alto: this.alto };
    const separacion = 6;
    const ancho = (this.ancho - separacion * (n - 1)) / n;
    return { x: i * (ancho + separacion), y: 0, ancho, alto: this.alto };
  }

  /**
   * Dibuja dentro de la mitad de un jugador. `fn` recibe el contexto ya
   * recortado y trasladado, y el rectángulo con su ancho y alto: el minijuego
   * se escribe una sola vez, para un jugador, como si tuviera la pantalla
   * entera, y el motor lo pinta en cada mitad.
   */
  enRanura(i, n, fn) {
    const r = this.ranura(i, n);
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.rect(r.x, r.y, r.ancho, r.alto);
    c.clip();
    c.translate(r.x, r.y);
    try { fn(c, r); } finally { c.restore(); }
  }

  iniciar() {
    this._ultimo = performance.now();
    requestAnimationFrame(this._frame);
  }

  _frame(ahora) {
    // Techo de 50 ms: si la pestaña estuvo en segundo plano no queremos un
    // salto gigante de simulación al volver.
    const dt = Math.min(0.05, (ahora - this._ultimo) / 1000);
    this._ultimo = ahora;
    this.tiempo += dt;

    // Fotogramas por segundo, suavizados. Si en el stand va mal el mando, lo
    // primero es saber si el equipo aguanta: esto sale en el chip y en el panel de mandos.
    if (dt > 0) this.fps += ((1 / dt) - this.fps) * 0.05;

    const c = this.ctx;
    c.clearRect(0, 0, this.ancho, this.alto);

    if (this.pausado) {
      // En pausa la escena no avanza: solo se dibuja, quieta, bajo el menú.
      this.pausa.actualizar(dt);
      if (this.escena) this.escena.dibujar(c);
      this.pausa.dibujar(c);
    } else if (this.escena) {
      if (this.pausa) this.pausa.vigilar();
      if (!this.pausado) this.escena.actualizar(dt);
      this.escena.dibujar(c);
      if (this.pausado) this.pausa.dibujar(c);
    }

    // Las pulsaciones se acumulan en el driver reporte a reporte; aquí, una vez
    // que la escena ya las consultó, se olvidan. Sin esto se perdían las que
    // caían entre dos fotogramas.
    for (const j of this.jugadores) if (j.finDeFrame) j.finDeFrame();

    if (this._fundido > 0.001) {
      c.save();
      c.globalAlpha = this._fundido;
      c.fillStyle = '#0b0202';     // el rojo casi negro de los menús (render.js, fondoMenu)
      c.fillRect(0, 0, this.ancho, this.alto);
      c.restore();
    }

    requestAnimationFrame(this._frame);
  }
}

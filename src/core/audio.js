/**
 * audio.js — Música y sonidos.
 *
 * MÚSICA (desde 2026-09-26, pedido del usuario): el tema principal de Tomb
 * Raider (1996), en `assets/musica/tema.mp3`, en bucle; desde 2026-09-27 cada
 * etapa tiene además su propia canción (ver TEMAS).
 * OJO: es música con derechos de autor; el usuario lo decidió así, igual que
 * con las texturas (docs/ACTIVOS-VISUALES.md §7.1). Si el archivo no está o no
 * se puede leer, suena la música generada de siempre, que se describe abajo.
 *
 * Los efectos no usan archivos: se sintetizan con Web Audio API. La razón es
 * la misma que rige el resto del proyecto: cero dependencias y cero descargas,
 * porque la red del evento puede no dejar salir a ningún servidor y Sophos
 * bloquea binarios ajenos. Un .mp3 además pesa; esto pesa cero.
 *
 * La música es generativa: no es un bucle que se repite igual, sino notas
 * elegidas dentro de una escala. En un stand donde suena horas seguidas, un
 * bucle corto se vuelve insoportable; esto no se repite nunca exactamente.
 *
 * Web Audio exige un gesto del usuario para arrancar. Se llama a iniciar()
 * desde el clic del botón de enlace.
 */

// Escalas como semitonos sobre la tónica.
const ESCALAS = {
  misterio: [0, 2, 3, 5, 7, 8, 10],   // menor natural — apertura
  travesia: [0, 2, 3, 5, 7, 9, 10],   // dórica — exploración, no tan triste
  tension: [0, 2, 3, 5, 7, 8, 10],
  logro: [0, 2, 4, 5, 7, 9, 11],      // mayor — revelación
};

/**
 * Volumen del tema principal. La grabación es fuerte (RMS ≈ −13 dB): a 0,32
 * queda en torno a −23 dB, por debajo de los efectos, que tienen que oírse.
 */
const VOLUMEN_TEMA = 0.32;
/**
 * Las canciones del juego (2026-09-27, pedido del usuario): el tema principal
 * en portada, recorrido, recuento y cierre, y una por etapa: dos de Peter
 * Connelly y, en El Tesoro, el tema final de Tomb Raider 2 (misma decisión
 * de derechos de autor que el tema). Cada escena dice cuál quiere en
 * `this.tema`; sin eso suena la principal.
 *
 * `volumen` iguala las cuatro a unos −23 dB (medido con
 * herramientas/medir-musica.html: tema −12,6 · mapa −16,8 · camino −18,6 ·
 * regreso −19,7 dB RMS). `inicio` salta el silencio del principio del archivo.
 * Si una falta, suena la principal; si falta la principal, la generada.
 */
const TEMAS = {
  principal: { archivo: 'tema.mp3', volumen: VOLUMEN_TEMA, inicio: 0.18 },
  mapa: { archivo: 'mapa.mp3', volumen: 0.52, inicio: 0.06 },        // Egyptian Mood 1
  camino: { archivo: 'camino.mp3', volumen: 0.64, inicio: 0.33 },    // Cabal Attack
  regreso: { archivo: 'regreso.mp3', volumen: 0.72, inicio: 0.09 },  // Tomb Raider 2, Ending Theme
};
const CARPETA_MUSICA = './assets/musica/';
/** Fundido cruzado al pasar de una canción a otra, en segundos. */
const CRUCE_TEMAS = 1.2;

const PISTAS = {
  intro: {
    tonica: 55.0,          // La1
    escala: 'misterio',
    tempo: 2.6,            // segundos por paso
    acordes: [[0, 3, 7], [0, 3, 8], [-2, 2, 5], [0, 3, 7]],
    densidadPulso: 0.35,   // probabilidad de nota suelta por paso
    volPad: 0.16, volPulso: 0.10, volBajo: 0.10,
  },
  exploracion: {
    tonica: 58.27,         // Si♭1
    escala: 'travesia',
    tempo: 1.9,
    acordes: [[0, 3, 7], [5, 8, 12], [-2, 3, 7], [3, 7, 10]],
    densidadPulso: 0.55,
    volPad: 0.14, volPulso: 0.13, volBajo: 0.11,
  },
  decision: {
    tonica: 49.0,          // Sol1 — más grave, pesa más
    escala: 'tension',
    tempo: 1.35,
    acordes: [[0, 3, 7], [0, 3, 6], [0, 2, 7], [0, 3, 7]],
    densidadPulso: 0.42,
    volPad: 0.15, volPulso: 0.09, volBajo: 0.14,
    latido: true,          // pulso grave regular, como un reloj
  },
  carrera: {
    tonica: 55.0,          // La1, con pulso rápido: se está corriendo
    escala: 'travesia',
    tempo: 0.75,
    acordes: [[0, 3, 7], [0, 3, 7], [-2, 2, 5], [3, 7, 10]],
    densidadPulso: 0.7,
    volPad: 0.11, volPulso: 0.12, volBajo: 0.15,
    latido: true,
  },
  revelacion: {
    tonica: 65.41,         // Do2
    escala: 'logro',
    tempo: 2.4,
    acordes: [[0, 4, 7], [5, 9, 12], [-3, 4, 7], [0, 4, 9]],
    densidadPulso: 0.5,
    volPad: 0.18, volPulso: 0.14, volBajo: 0.10,
  },
};

export class Audio {
  constructor() {
    this.ctx = null;
    this.activo = false;
    this.silenciado = false;
    this.pista = null;
    this._nombrePista = null;
    this._temporizador = null;
    this._proximoPaso = 0;
    this._paso = 0;
    /** Canciones decodificadas por clave de TEMAS (null si no se pudo). */
    this.temas = {};
    this._temaElegido = 'principal';
    /** Lo que suena ahora: {clave, fuente, ganancia, desde, arranque}. */
    this._sonando = null;
    this._posPrincipal = 0;
  }

  async iniciar() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;                      // sin audio, el juego sigue
    this.ctx = new AC();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    this.maestro = this.ctx.createGain();
    this.maestro.gain.value = 0.9;
    this.maestro.connect(this.ctx.destination);

    // Reverberación: respuesta al impulso generada con ruido decreciente.
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this._impulso(2.8, 2.4);
    this.envioReverb = this.ctx.createGain();
    this.envioReverb.gain.value = 0.34;
    this.envioReverb.connect(this.reverb);
    this.reverb.connect(this.maestro);

    this.busMusica = this.ctx.createGain();
    this.busMusica.gain.value = 0;
    this.busMusica.connect(this.maestro);
    this.busMusica.connect(this.envioReverb);

    this.busSfx = this.ctx.createGain();
    this.busSfx.gain.value = 0.85;
    this.busSfx.connect(this.maestro);
    this.busSfx.connect(this.envioReverb);

    // El tema va directo a la salida: ya trae su propia sala, sin reverberación.
    this.busTema = this.ctx.createGain();
    this.busTema.gain.value = 0;
    this.busTema.connect(this.maestro);

    this.activo = true;
    this._cargarTema();
  }

  /**
   * Carga el tema principal sin frenar el arranque (mientras llega, no suena
   * nada) y después, por detrás, las canciones de las etapas.
   */
  async _cargarTema() {
    this.tema = null;
    this._temaCargando = true;
    this.tema = await this._decodificar('principal');
    if (!this.tema) console.warn('Sin tema musical, suena la música generada.');
    this._temaCargando = false;
    // Si alguien pidió música mientras cargaba, ahora sí.
    const pedida = this._nombrePista;
    this._nombrePista = null;
    if (pedida) this.musica(pedida);
    if (!this.tema) return;
    for (const clave of Object.keys(TEMAS)) {
      if (clave === 'principal') continue;
      await this._decodificar(clave);
      // Si ya estaba en esa etapa mientras cargaba, entra ahora con su canción.
      if (clave === this._temaElegido && this._nombrePista) this._sonarTema();
    }
  }

  /** Descarga y decodifica una canción de TEMAS. Devuelve null si no está. */
  async _decodificar(clave) {
    try {
      const r = await fetch(CARPETA_MUSICA + TEMAS[clave].archivo);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      this.temas[clave] = await this.ctx.decodeAudioData(await r.arrayBuffer());
    } catch (e) {
      console.warn('Sin la canción «' + clave + '»:', e && e.message);
      this.temas[clave] = null;
    }
    return this.temas[clave];
  }

  /** Sube o baja la música (el tema o la generada) hasta `valor` (0-1) en `seg` segundos. */
  _rampaMusica(valor, seg) {
    const t = this.ctx.currentTime;
    for (const bus of [this.busMusica, this.busTema]) {
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(valor, t + seg);
    }
  }

  /**
   * La escena que entra dice qué canción quiere ('mapa', 'camino', 'regreso';
   * cualquier otra cosa es la principal). Si la música ya suena, cambia con
   * fundido cruzado.
   */
  elegirTema(clave) {
    const elegido = TEMAS[clave] ? clave : 'principal';
    if (elegido === this._temaElegido) return;
    this._temaElegido = elegido;
    if (this.activo && this.tema && this._nombrePista) this._sonarTema();
  }

  /**
   * Pone a sonar en bucle la canción elegida, si no sonaba ya. Si la de la
   * etapa aún no ha cargado (o falta), sigue la principal. La principal
   * retoma donde iba; las de las etapas empiezan desde el principio.
   */
  _sonarTema() {
    const clave = this.temas[this._temaElegido] ? this._temaElegido : 'principal';
    if (this._sonando && this._sonando.clave === clave) return;
    const t = this.ctx.currentTime;

    const viejo = this._sonando;
    if (viejo) {
      viejo.ganancia.gain.cancelScheduledValues(t);
      viejo.ganancia.gain.setValueAtTime(viejo.ganancia.gain.value, t);
      viejo.ganancia.gain.linearRampToValueAtTime(0, t + CRUCE_TEMAS);
      viejo.fuente.stop(t + CRUCE_TEMAS + 0.05);
      if (viejo.clave === 'principal') {
        const { inicio } = TEMAS.principal;
        const largo = this.tema.duration - inicio;
        this._posPrincipal = inicio + ((viejo.desde - inicio) + Math.max(0, t - viejo.arranque)) % largo;
      }
    }

    const def = TEMAS[clave];
    const buffer = this.temas[clave];
    const desde = clave === 'principal' ? (this._posPrincipal || def.inicio) : def.inicio;
    const f = this.ctx.createBufferSource();
    f.buffer = buffer;
    f.loop = true;
    f.loopStart = def.inicio;
    f.loopEnd = buffer.duration;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(def.volumen, t + (viejo ? CRUCE_TEMAS : 0.05));
    f.connect(g);
    g.connect(this.busTema);
    f.start(t + 0.05, desde);
    this._sonando = { clave, fuente: f, ganancia: g, desde, arranque: t + 0.05 };
  }

  _impulso(duracion, decaimiento) {
    const sr = this.ctx.sampleRate;
    const n = Math.floor(sr * duracion);
    const buf = this.ctx.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < n; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decaimiento);
      }
    }
    return buf;
  }

  // ------------------------------------------------------------- música
  /** Cambia de pista con fundido cruzado. Llamarla con la misma pista no hace nada. */
  musica(nombre) {
    if (!this.activo || this._nombrePista === nombre) return;
    const def = PISTAS[nombre];
    if (!def) return;

    // Con el tema cargado, todas las pantallas usan el mismo: no se reinicia
    // al cambiar de pantalla, solo vuelve a subir si estaba bajado.
    if (this._temaCargando) { this._nombrePista = nombre; return; }
    if (this.tema) {
      this._nombrePista = nombre;
      this._sonarTema();
      this._rampaMusica(this.silenciado ? 0 : 1, 1.2);
      return;
    }

    const t = this.ctx.currentTime;
    this.busMusica.gain.cancelScheduledValues(t);
    this.busMusica.gain.setValueAtTime(this.busMusica.gain.value, t);
    this.busMusica.gain.linearRampToValueAtTime(0, t + 0.6);

    this._nombrePista = nombre;
    this.pista = def;
    this._paso = 0;
    this._proximoPaso = t + 0.7;

    this.busMusica.gain.linearRampToValueAtTime(this.silenciado ? 0 : 1, t + 1.6);

    if (!this._temporizador) {
      this._temporizador = setInterval(() => this._planificar(), 120);
    }
  }

  /**
   * Baja la música del juego mientras suena una cinemática (el video trae su
   * propio sonido) y la devuelve después. No cambia de pista.
   */
  atenuarMusica(si) {
    if (!this.activo) return;
    this._rampaMusica(si || this.silenciado ? 0 : 1, si ? 0.4 : 1.2);
  }

  detenerMusica() {
    if (!this.activo) return;
    this._rampaMusica(0, 0.8);
    this._nombrePista = null;
    this.pista = null;
  }

  /** Planifica con antelación: el reloj de JS no es fiable para música. */
  _planificar() {
    if (!this.pista || !this.activo) return;
    const horizonte = this.ctx.currentTime + 0.6;
    let guardia = 0;
    while (this._proximoPaso < horizonte && guardia++ < 8) {
      this._emitirPaso(this._proximoPaso);
      this._proximoPaso += this.pista.tempo;
      this._paso++;
    }
  }

  _emitirPaso(t) {
    const p = this.pista;
    const escala = ESCALAS[p.escala];
    const acorde = p.acordes[this._paso % p.acordes.length];

    // --- colchón: el acorde sostenido
    acorde.forEach((semi, i) => {
      const f = p.tonica * Math.pow(2, (semi + 24) / 12);
      this._voz({
        freq: f, inicio: t, duracion: p.tempo * 1.5,
        ataque: p.tempo * 0.45, tipo: 'sawtooth',
        vol: p.volPad / (i + 1.4), corte: 620 + i * 180, destino: this.busMusica,
        detune: (i - 1) * 6,
      });
    });

    // --- bajo
    this._voz({
      freq: p.tonica * Math.pow(2, acorde[0] / 12),
      inicio: t, duracion: p.tempo * 0.9, ataque: 0.06,
      tipo: 'sine', vol: p.volBajo, corte: 320, destino: this.busMusica,
    });

    // --- nota suelta: lo que hace que no se repita nunca igual
    if (Math.random() < p.densidadPulso) {
      const grado = escala[Math.floor(Math.random() * escala.length)];
      const octava = 36 + (Math.random() < 0.35 ? 12 : 0);
      const retardo = Math.random() * p.tempo * 0.6;
      this._voz({
        freq: p.tonica * Math.pow(2, (grado + octava) / 12),
        inicio: t + retardo, duracion: 1.5, ataque: 0.012,
        tipo: 'triangle', vol: p.volPulso, corte: 2600, destino: this.busMusica,
      });
    }

    // --- latido del reloj en la fase de decisión
    if (p.latido) {
      this._voz({
        freq: p.tonica * 0.5, inicio: t, duracion: 0.28, ataque: 0.004,
        tipo: 'sine', vol: 0.18, corte: 200, destino: this.busMusica,
      });
    }
  }

  /** Una voz: oscilador + filtro + envolvente. La unidad de todo lo que suena. */
  _voz({ freq, inicio, duracion, ataque, tipo, vol, corte, destino, detune = 0 }) {
    const o = this.ctx.createOscillator();
    o.type = tipo;
    o.frequency.value = freq;
    o.detune.value = detune;

    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = corte;
    f.Q.value = 0.8;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, inicio);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), inicio + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);

    o.connect(f); f.connect(g); g.connect(destino);
    o.start(inicio);
    o.stop(inicio + duracion + 0.1);
  }

  // -------------------------------------------------------------- sonidos
  sfx(nombre) {
    if (!this.activo || this.silenciado) return;
    const t = this.ctx.currentTime;
    const b = this.busSfx;

    switch (nombre) {
      // Hallazgo normal: dos notas que suben. Se lee como "encontraste algo".
      case 'descubrir':
        this._voz({ freq: 523.25, inicio: t, duracion: 0.3, ataque: 0.005, tipo: 'triangle', vol: 0.26, corte: 4000, destino: b });
        this._voz({ freq: 783.99, inicio: t + 0.09, duracion: 0.42, ataque: 0.005, tipo: 'triangle', vol: 0.22, corte: 4000, destino: b });
        break;

      // Hallazgo del lugar escondido: arpegio de cuatro notas, claramente distinto.
      case 'especial':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this._voz({ freq: f, inicio: t + i * 0.1, duracion: 0.7, ataque: 0.006, tipo: 'triangle', vol: 0.27, corte: 5200, destino: b });
        });
        break;

      // Confirmar una elección: nota firme y grave.
      case 'elegir':
        this._voz({ freq: 392.0, inicio: t, duracion: 0.26, ataque: 0.004, tipo: 'square', vol: 0.14, corte: 1700, destino: b });
        this._voz({ freq: 587.33, inicio: t + 0.05, duracion: 0.3, ataque: 0.004, tipo: 'triangle', vol: 0.18, corte: 3200, destino: b });
        break;

      // Retirar: la misma idea, al revés.
      case 'quitar':
        this._voz({ freq: 466.16, inicio: t, duracion: 0.2, ataque: 0.004, tipo: 'triangle', vol: 0.15, corte: 2200, destino: b });
        this._voz({ freq: 311.13, inicio: t + 0.07, duracion: 0.26, ataque: 0.004, tipo: 'triangle', vol: 0.13, corte: 1800, destino: b });
        break;

      // Acción no permitida.
      case 'error':
        this._voz({ freq: 174.61, inicio: t, duracion: 0.22, ataque: 0.004, tipo: 'sawtooth', vol: 0.14, corte: 700, destino: b });
        break;

      // Cambio de fase.
      case 'fase':
        [329.63, 415.30, 493.88].forEach((f, i) => {
          this._voz({ freq: f, inicio: t + i * 0.07, duracion: 0.55, ataque: 0.008, tipo: 'triangle', vol: 0.2, corte: 3000, destino: b });
        });
        break;

      // Revelación final.
      case 'revelar':
        [261.63, 329.63, 392.0, 523.25, 659.25].forEach((f, i) => {
          this._voz({ freq: f, inicio: t + i * 0.13, duracion: 1.6, ataque: 0.02, tipo: 'triangle', vol: 0.2, corte: 4200, destino: b });
        });
        break;

      // Aviso de tiempo: los últimos segundos.
      case 'tic':
        this._voz({ freq: 1200, inicio: t, duracion: 0.07, ataque: 0.002, tipo: 'sine', vol: 0.12, corte: 6000, destino: b });
        break;

      // El Camino: un dato recogido. Corto y agudo, porque suena muchas veces.
      case 'dato':
        this._voz({ freq: 1318.5, inicio: t, duracion: 0.08, ataque: 0.002, tipo: 'sine', vol: 0.09, corte: 6000, destino: b });
        break;

      // Un cartel ✓: agradable, pero sin más. Suena bien a propósito.
      case 'control':
        this._voz({ freq: 880, inicio: t, duracion: 0.25, ataque: 0.003, tipo: 'sine', vol: 0.14, corte: 5000, destino: b });
        break;

      // Contra un muro: golpe sordo.
      case 'choque':
        this._voz({ freq: 70, inicio: t, duracion: 0.3, ataque: 0.003, tipo: 'square', vol: 0.22, corte: 400, destino: b });
        this._voz({ freq: 55, inicio: t + 0.03, duracion: 0.35, ataque: 0.003, tipo: 'sawtooth', vol: 0.12, corte: 300, destino: b });
        break;

      // La lente: barrido ascendente.
      case 'lente':
        [440, 587.33, 783.99].forEach((f, i) => {
          this._voz({ freq: f, inicio: t + i * 0.04, duracion: 0.3, ataque: 0.004, tipo: 'triangle', vol: 0.12, corte: 4500, destino: b });
        });
        break;

      case 'avanzar':
        this._voz({ freq: 659.25, inicio: t, duracion: 0.2, ataque: 0.004, tipo: 'triangle', vol: 0.18, corte: 3500, destino: b });
        break;
    }
  }

  alternarSilencio() {
    this.silenciado = !this.silenciado;
    if (this.activo) {
      const t = this.ctx.currentTime;
      this._rampaMusica(this.silenciado ? 0 : 1, 0.3);
      this.busSfx.gain.linearRampToValueAtTime(this.silenciado ? 0 : 0.85, t + 0.3);
    }
    return this.silenciado;
  }
}

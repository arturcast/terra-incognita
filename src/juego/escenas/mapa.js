/**
 * mapa.js — ETAPA 1: "El Mapa"
 * Equivale a: construcción del Plan Anual de Auditoría.
 *
 * Capacidades que el visitante ejercita sin que se las nombren:
 *   MIRAR TODO    — no se puede decidir sobre lo que nunca se miró.
 *   CRITERIO      — la señal más fuerte no siempre es lo más importante.
 *   PRIORIZAR     — el orden importa, porque los recursos no alcanzan.
 *
 * Fases: guia1 -> explorar -> guia2 -> decidir -> resultado
 *
 * Sobre la disposición del texto: nada tiene coordenadas fijas apiladas a
 * mano. Cada bloque se mide y se acumula. Es la única forma de que no se
 * monten unos sobre otros cuando cambia una frase o el tamaño de la pantalla.
 */

import { Escena } from '../../core/engine.js';
import { Puntero, Acciones } from '../../core/input.js';
import { Briefing, partirLineas } from '../../core/briefing.js';
import {
  PALETA, FUENTE, rectRedondeado, anillo, barraLectura,
  grano, vineta, suave, limitar,
} from '../../core/render.js';
import {
  REGIONES, LECTURAS, BANDERAS_DISPONIBLES,
  generarCosta, generarIsla, evaluar,
} from '../../datos/territorio.js';

const T_EXPLORAR = 60;
const T_DECIDIR = 60;
const RADIO_LUZ = 105;
const REJILLA_X = 72;
const REJILLA_Y = 42;
const PISTA_ISLA = 0.55;   // fracción explorada a partir de la cual se insinúa

/** Campamento base: de aquí salen los equipos en la animación de despacho. */
const BASE = { x: 0.46, y: 0.53 };

/**
 * Lo que el visitante acaba de hacer, traducido a lo que hace el área. Es el
 * aterrizaje de la etapa: aquí, y solo aquí, se nombra el oficio.
 *
 * Las otras dos etapas tienen el suyo («Así trabajamos» en El Camino, «Así
 * terminamos» en El Regreso). Esta pantalla es la pieza equivalente.
 */
const ASI_ELEGIMOS = [
  { que: 'La linterna', es: 'El alcance: lo que un equipo pequeño alcanza a mirar en un año. Nunca da para toda la compañía, y ese es el punto de partida.' },
  { que: 'Los catorce lugares', es: 'Los procesos de la compañía, todos: facturación, recaudo, compras, mantenimiento, Brilla… los que acabas de recorrer con otro nombre.' },
  { que: 'Las tres barras', es: 'Riesgo, importancia y señales. Con eso se decide, y los datos son solo una de las tres: un proceso puede estar en peligro sin que nada lo esté gritando.' },
  { que: 'Los cinco equipos', es: 'Las auditorías que caben en el año. Escoger a dónde van es decir que no a los otros nueve, y hay que poder sustentarlo.' },
  { que: 'El orden', es: 'La prioridad. No es lo mismo llegar en enero que en noviembre: a lo más crítico se va primero.' },
  { que: 'Lo que se te escapó', es: 'También nos pasa. Por eso el plan se revisa: si aparece algo nuevo a mitad de año, se cambia.' },
];
const ESCALONADO = 0.55;   // segundos entre la salida de un equipo y el siguiente
const VIAJE = 1.15;        // segundos que tarda cada equipo en llegar

export class EscenaMapa extends Escena {
  constructor(motor) {
    super(motor);
    this.costa = generarCosta();
    this.contornoIsla = generarIsla();
    // Los ajustes del puntero viven en input.js (PUNTERO), en unidades físicas.
    this.puntero = new Puntero(motor.jc);
    this.acciones = new Acciones(motor.jc);

    this.guia1 = new Briefing({
      etiqueta: 'Etapa 1 · Primera parte',
      titulo: 'Explora el mapa',
      entrada: 'Tienes delante el territorio de toda la compañía. Está a oscuras y nadie lo ha recorrido completo.',
      pasos: [
        'Mueve el Joy-Con como si tuvieras una linterna en la mano: donde apuntes, se ilumina el mapa.',
        'Cuando pases por encima de un lugar, detente un momento sobre él. Si te quedas quieto ahí, el lugar se revela y te muestra su información.',
        'Hay ' + REGIONES.length + ' lugares en total. Recórrelo todo: también las orillas y las esquinas. No todo está en el centro.',
      ],
      aviso: 'Tienes 60 segundos. No te va a alcanzar para mirarlo todo con calma: por eso importa cómo lo recorres.',
      continuar: 'Pulsa {B} para empezar a explorar',
    });

    this.guia2 = new Briefing({
      etiqueta: 'Etapa 1 · Segunda parte',
      titulo: 'Decide a dónde ir',
      entrada: 'Ya viste lo que alcanzaste a ver. Ahora hay que escoger, y no alcanza para todos.',
      pasos: [
        'Tienes ' + BANDERAS_DISPONIBLES + ' equipos para ' + REGIONES.length + ' lugares. Solo puedes enviarlos a lugares que hayas descubierto.',
        'Apunta a un lugar y te aparece una ficha con lo que hay ahí y sus tres barras. Léela antes de decidir.',
        'Confirma para enviar un equipo. Vuelve a confirmar sobre él si quieres retirarlo.',
        'El orden en que los envías es tu prioridad: el primero es el más urgente.',
        'Cuando estés conforme, apunta al botón «Enviar equipos» de abajo y confirma. No tienes que gastar todo el tiempo ni usar los cinco.',
      ],
      leyenda: LECTURAS.map((l, i) => ({
        color: l.color, nombre: l.nombre, texto: l.texto, valor: [0.8, 0.65, 0.5][i],
      })),
      aviso: 'Tienes ' + T_DECIDIR + ' segundos. Fíjate sobre todo en el riesgo y en la importancia: las señales ayudan, pero un lugar puede estar en peligro sin que los datos lo estén gritando.',
      continuar: 'Pulsa {B} para decidir',
    });

    // Respaldo de ratón: si el mando falla en pleno stand, la demo sigue viva.
    this.raton = { x: 0, y: 0, activo: false, clic: false };
    this._onMover = (e) => {
      const r = this.motor.canvas.getBoundingClientRect();
      this.raton.x = e.clientX - r.left;
      this.raton.y = e.clientY - r.top;
      this.raton.activo = !this.motor.jc.estado.conectado;
    };
    this._onClic = () => { if (!this.motor.jc.estado.conectado) this.raton.clic = true; };
  }

  get audio() { return this.motor.audio; }

  /** Tecla R del operador: lleva la linterna al centro. */
  recentrarPuntero() { this.puntero.recentrar(); }

  async entrar() {
    this.fase = 'guia1';
    this.t = 0;
    this.tFase = 0;
    this.guia1.reiniciar();
    this.guia2.reiniciar();

    REGIONES.forEach((r) => {
      r.descubierto = false;
      r._permanencia = 0;
      r._brillo = 0;
    });

    this.elegidas = [];
    this.resultado = null;
    this.paginaRes = 0;
    this.contadores = { vision: 0, criterio: 0, priorizacion: 0 };
    this.avisos = [];        // animaciones de descubrimiento
    this.pos = { x: this.motor.ancho / 2, y: this.motor.alto / 2 };
    this._ultimoTic = 99;
    this._celebrando = 0;    // cuenta atrás tras encontrarlo todo
    this.fichas = [];        // equipos en movimiento durante el despacho
    this.sobreEnviar = false;

    this.rejilla = new Uint8Array(REJILLA_X * REJILLA_Y);
    this.exploradas = 0;
    this._prepararNiebla();
    this._fondo = null;      // capa estática del mapa; se rehace al redimensionar

    this.motor.jc.recentrar();
    this.puntero.recentrar();

    window.addEventListener('mousemove', this._onMover);
    window.addEventListener('mousedown', this._onClic);
  }

  salir() {
    window.removeEventListener('mousemove', this._onMover);
    window.removeEventListener('mousedown', this._onClic);
  }

  alRedimensionar() { this._prepararNiebla(); this._fondo = null; }

  /**
   * La tierra, las curvas de nivel y la isla no cambian nunca durante la
   * partida. Se dibujan una vez en una capa aparte y cada fotograma solo se
   * copia. Antes eran unos 1.400 segmentos de trazo por fotograma.
   */
  _capaFondo(W, H) {
    if (this._fondo && this._fondo._w === W && this._fondo._h === H) return this._fondo;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(W * dpr));
    cv.height = Math.max(1, Math.round(H * dpr));
    const cx = cv.getContext('2d');
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.fillStyle = PALETA.fondo;
    cx.fillRect(0, 0, W, H);
    this._dibujarTierra(cx, W, H);
    cv._w = W; cv._h = H;
    this._fondo = cv;
    return cv;
  }

  _prepararNiebla() {
    const w = Math.max(2, Math.round(this.motor.ancho / 2));
    const h = Math.max(2, Math.round(this.motor.alto / 2));
    this.niebla = document.createElement('canvas');
    this.niebla.width = w;
    this.niebla.height = h;
    this.nc = this.niebla.getContext('2d');
    this.nc.fillStyle = PALETA.niebla;
    this.nc.fillRect(0, 0, w, h);
    if (this.rejilla) {
      for (let gy = 0; gy < REJILLA_Y; gy++) {
        for (let gx = 0; gx < REJILLA_X; gx++) {
          if (!this.rejilla[gy * REJILLA_X + gx]) continue;
          this._perforar(
            ((gx + 0.5) / REJILLA_X) * this.motor.ancho,
            ((gy + 0.5) / REJILLA_Y) * this.motor.alto,
            RADIO_LUZ * 0.5
          );
        }
      }
    }
  }

  _perforar(x, y, radio) {
    const c = this.nc;
    const hx = x / 2, hy = y / 2, hr = radio / 2;
    const g = c.createRadialGradient(hx, hy, hr * 0.25, hx, hy, hr);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.65, 'rgba(0,0,0,0.85)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = g;
    c.beginPath();
    c.arc(hx, hy, hr, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // ------------------------------------------------------------- entrada
  /**
   * Calcula la posición del puntero. **Una sola vez por frame**, en
   * `actualizar`, y el resultado queda en `this.pos`.
   *
   * Antes se llamaba también desde `dibujar`, y como `puntero.actualizar()`
   * aplica el suavizado en cada llamada, el filtro corría dos veces por frame:
   * el puntero iba notablemente menos suave de lo que decía su configuración.
   */
  _calcularPos(dt) {
    if (this.motor.jc.estado.conectado) {
      this.puntero.actualizar(this.motor.ancho, this.motor.alto, 30, dt);
      return { x: this.puntero.x, y: this.puntero.y };
    }
    return { x: this.raton.x || this.motor.ancho / 2, y: this.raton.y || this.motor.alto / 2 };
  }

  _confirmo() {
    if (this.raton.clic) { this.raton.clic = false; return true; }
    return this.motor.jc.estado.conectado && this.acciones.confirmar();
  }

  get nombreBoton() {
    return this.motor.jc.estado.conectado ? this.acciones.nombreConfirmar : 'CLIC';
  }

  _regionEn(x, y, radio = 54) {
    let mejor = null, mejorD = radio;
    for (const r of REGIONES) {
      const d = Math.hypot(r.x * this.motor.ancho - x, r.y * this.motor.alto - y);
      if (d < mejorD) { mejorD = d; mejor = r; }
    }
    return mejor;
  }

  // ---------------------------------------------------------- actualizar
  actualizar(dt) {
    this.t += dt;
    this.tFase += dt;
    this.pos = this._calcularPos(dt);
    this.avisos = this.avisos.filter((a) => (a.vida -= dt) > 0);

    if (this.motor.jc.estado.conectado && this.acciones.pideRecentrar()) {
      this.puntero.recentrar();
      this.motor.jc.pulso(240, 0.4, 60);
    }

    switch (this.fase) {
      case 'guia1':
        this.guia1.actualizar(dt);
        if (this.guia1.puedeContinuar && this._confirmo()) this._irA('explorar');
        break;

      case 'explorar': {
        this._actualizarExplorar(dt, this.pos);
        // Si ya encontró todo, no tiene sentido hacerle esperar al reloj.
        const todos = REGIONES.every((r) => r.descubierto);
        if (todos && !this._celebrando) {
          this._celebrando = 0.001;
          this.avisos.push({
            x: this.motor.ancho / 2, y: this.motor.alto * 0.42,
            texto: '¡Encontraste los ' + REGIONES.length + '!', vida: 1.8, max: 1.8, especial: true,
          });
          this.audio && this.audio.sfx('especial');
          this.motor.jc.pulso(480, 0.75, 220);
        }
        if (this._celebrando) {
          this._celebrando += dt;
          if (this._celebrando > 1.9) this._irA('guia2');
        } else {
          this._avisarTiempo(T_EXPLORAR - this.tFase);
          if (this.tFase >= T_EXPLORAR) this._irA('guia2');
        }
        break;
      }

      case 'guia2':
        this.guia2.actualizar(dt);
        if (this.guia2.puedeContinuar && this._confirmo()) this._irA('decidir');
        break;

      case 'decidir':
        this._actualizarDecidir(this.pos);
        this._avisarTiempo(T_DECIDIR - this.tFase);
        // Se acabó el tiempo: sale lo que haya, aunque no haya llenado los cinco.
        if (this.tFase >= T_DECIDIR) this._despachar();
        break;

      case 'despacho':
        this._actualizarDespacho();
        break;

      case 'relato':
        if (this.tFase > 1.4 && this._confirmo()) {
          this.audio && this.audio.sfx('avanzar');
          this._cerrar();
        }
        break;

      case 'resultado': {
        const k = Math.min(1, this.tFase / 1.6);
        const e = suave(k);
        this.contadores.vision = Math.round(this.resultado.vision * e);
        this.contadores.criterio = Math.round(this.resultado.criterio * e);
        this.contadores.priorizacion = Math.round(this.resultado.priorizacion * e);
        if (this.tFase > 1.8 && this._confirmo()) {
          if (this.paginaRes < this._ultimaPagina) {
            this.paginaRes++;
            this.tFase = 1.9;
            this.audio && this.audio.sfx('avanzar');
          } else {
            // El remate de la etapa: qué era todo esto en la vida real.
            this.fase = 'revelacion';
            this.tFase = 0;
            this.audio && this.audio.musica('revelacion');
            this.audio && this.audio.sfx('revelar');
          }
        }
        break;
      }

      case 'revelacion':
        if (this.tFase > 4 && this._confirmo()) {
          this.audio && this.audio.sfx('avanzar');
          this.motor.ir('ruta', { completada: 'mapa' });
        }
        break;
    }
  }

  get _ultimaPagina() {
    // Página extra solo si no encontró la isla: ahí está el mensaje que más
    // importa y merece pantalla propia.
    return this.resultado && !this.resultado.islaDescubierta ? 2 : 1;
  }

  _irA(fase) {
    this.fase = fase;
    this.tFase = 0;
    this._ultimoTic = 99;
    this.audio && this.audio.sfx('fase');
    if (fase === 'explorar') this.audio && this.audio.musica('exploracion');
    if (fase === 'decidir') {
      this.audio && this.audio.musica('decision');
      this.motor.jc.pulso(200, 0.5, 140);
    }
  }

  /** Tic sonoro en los últimos cinco segundos. */
  _avisarTiempo(restante) {
    const s = Math.ceil(restante);
    if (s <= 5 && s > 0 && s !== this._ultimoTic) {
      this._ultimoTic = s;
      this.audio && this.audio.sfx('tic');
    }
  }

  _actualizarExplorar(dt, p) {
    this._perforar(p.x, p.y, RADIO_LUZ);

    const gx0 = Math.floor(((p.x - RADIO_LUZ) / this.motor.ancho) * REJILLA_X);
    const gx1 = Math.ceil(((p.x + RADIO_LUZ) / this.motor.ancho) * REJILLA_X);
    const gy0 = Math.floor(((p.y - RADIO_LUZ) / this.motor.alto) * REJILLA_Y);
    const gy1 = Math.ceil(((p.y + RADIO_LUZ) / this.motor.alto) * REJILLA_Y);
    for (let gy = Math.max(0, gy0); gy < Math.min(REJILLA_Y, gy1); gy++) {
      for (let gx = Math.max(0, gx0); gx < Math.min(REJILLA_X, gx1); gx++) {
        const cx = ((gx + 0.5) / REJILLA_X) * this.motor.ancho;
        const cy = ((gy + 0.5) / REJILLA_Y) * this.motor.alto;
        if (Math.hypot(cx - p.x, cy - p.y) > RADIO_LUZ) continue;
        const i = gy * REJILLA_X + gx;
        if (!this.rejilla[i]) { this.rejilla[i] = 1; this.exploradas++; }
      }
    }

    for (const r of REGIONES) {
      const rx = r.x * this.motor.ancho, ry = r.y * this.motor.alto;
      if (r.descubierto) { r._brillo = Math.max(0, r._brillo - dt * 1.2); continue; }
      if (Math.hypot(rx - p.x, ry - p.y) < RADIO_LUZ * 0.8) {
        r._permanencia += dt / r.dificultad;
        if (r._permanencia >= 0.85) this._descubrir(r, rx, ry);
      } else {
        r._permanencia = Math.max(0, r._permanencia - dt * 0.6);
      }
    }
  }

  _descubrir(r, x, y) {
    r.descubierto = true;
    r._brillo = 1;
    this.avisos.push({ x, y, texto: r.nombre, vida: 2.2, max: 2.2, especial: !!r.oculta });
    if (r.oculta) {
      this.audio && this.audio.sfx('especial');
      this.motor.jc.pulso(500, 0.8, 200);
    } else {
      this.audio && this.audio.sfx('descubrir');
      this.motor.jc.pulso(380, 0.55, 80);
    }
  }

  /** Botón de despachar. Devuelve su rectángulo para dibujarlo y para apuntarlo. */
  _rectEnviar() {
    const w = 260, h = 50;
    return { x: this.motor.ancho / 2 - w / 2, y: this.motor.alto - 104, w, h };
  }

  _actualizarDecidir(p) {
    const b = this._rectEnviar();
    this.sobreEnviar = this.elegidas.length > 0 &&
      p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

    // Sobre el botón no se selecciona: si no, apuntar abajo marcaría lugares.
    this.candidata = this.sobreEnviar ? null : this._regionEn(p.x, p.y);
    if (!this._confirmo()) return;

    if (this.sobreEnviar) { this._despachar(); return; }

    const r = this.candidata;
    if (!r) return;
    if (!r.descubierto) {
      this.audio && this.audio.sfx('error');
      this.motor.jc.pulso(140, 0.3, 70);
      this.avisoError = { t: 1.4 };
      return;
    }
    const ya = this.elegidas.findIndex((e) => e.id === r.id);
    if (ya >= 0) {
      this.elegidas.splice(ya, 1);
      this.audio && this.audio.sfx('quitar');
      this.motor.jc.pulso(180, 0.35, 60);
    } else if (this.elegidas.length < BANDERAS_DISPONIBLES) {
      this.elegidas.push(r);
      this.avisos.push({
        x: r.x * this.motor.ancho, y: r.y * this.motor.alto,
        texto: 'Equipo ' + this.elegidas.length + ' enviado', vida: 1.5, max: 1.5,
      });
      this.audio && this.audio.sfx('elegir');
      this.motor.jc.pulso(420, 0.6, 90);
    }
  }

  /**
   * Arranca la salida de los equipos. Cada ficha sale del campamento con un
   * retardo, para que se vea salir una detrás de otra en vez de todas a la vez.
   */
  _despachar() {
    if (this.fase === 'despacho') return;
    this.fase = 'despacho';
    this.tFase = 0;
    this.fichas = this.elegidas.map((r, i) => ({
      region: r,
      salida: i * ESCALONADO,
      llegada: i * ESCALONADO + VIAJE,
      aterrizo: false,
    }));
    this.audio && this.audio.musica('revelacion');
    this.audio && this.audio.sfx('fase');
    this.motor.jc.pulso(220, 0.5, 130);
  }

  _actualizarDespacho() {
    for (const f of this.fichas) {
      if (!f.aterrizo && this.tFase >= f.llegada) {
        f.aterrizo = true;
        this.audio && this.audio.sfx('elegir');
        this.motor.jc.pulso(300, 0.5, 70);
      }
    }
    const fin = this.fichas.length
      ? this.fichas[this.fichas.length - 1].llegada + 1.0
      : 0.8;
    // Se puede saltar: en el stand, quien ya lo vio no quiere verlo otra vez.
    if (this.tFase >= fin || (this.tFase > 0.6 && this._confirmo())) {
      this.fase = 'relato';
      this.tFase = 0;
      this.audio && this.audio.sfx('revelar');
    }
  }

  _cerrar() {
    this.resultado = evaluar(this.elegidas, this.exploradas / (REJILLA_X * REJILLA_Y));
    this.motor.expedicion.puntajes.mapa = this.resultado;
    this.fase = 'resultado';
    this.tFase = 0;
    this.paginaRes = 0;
    this.audio && this.audio.musica('revelacion');
    this.audio && this.audio.sfx('revelar');
    this.motor.jc.pulso(260, 0.7, 220);
  }

  // ------------------------------------------------------------- dibujar
  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;
    c.fillStyle = PALETA.fondo;
    c.fillRect(0, 0, W, H);

    c.drawImage(this._capaFondo(W, H), 0, 0, W, H);
    this._dibujarRegiones(c, W, H);

    if (this.fase === 'guia1' || this.fase === 'explorar') c.drawImage(this.niebla, 0, 0, W, H);
    if (this.fase === 'explorar' || this.fase === 'decidir') this._dibujarLuz(c, this.pos);
    if (this.fase === 'despacho') this._dibujarDespacho(c, W, H);

    vineta(c, W, H, 0.5);
    this._dibujarAvisos(c);
    grano(c, W, H);

    if (this.fase === 'explorar') this._hudExplorar(c, W, H);
    if (this.fase === 'decidir') {
      this._hudDecidir(c, W, H);
      // La ficha va encima del HUD: es lo que el visitante está leyendo.
      if (this.candidata && this.candidata.descubierto) {
        this._leyendaFlotante(c, this.candidata, this.pos, W, H);
      }
    }
    if (this.fase === 'guia1') this.guia1.dibujar(c, W, H, this.nombreBoton);
    if (this.fase === 'guia2') this.guia2.dibujar(c, W, H, this.nombreBoton);
    if (this.fase === 'relato') this._dibujarRelato(c, W, H);
    if (this.fase === 'resultado') this._dibujarResultado(c, W, H);
    if (this.fase === 'revelacion') this._dibujarRevelacion(c, W, H);
  }

  /**
   * «Así elegimos»: el aterrizaje de la etapa.
   *
   * Tres tiempos, y ese orden importa: primero se le devuelve al visitante lo
   * que acaba de hacer contado con sus palabras, después la traducción pieza
   * por pieza, y solo al final el nombre. Nombrar antes de que reconozca lo
   * que hizo convierte la revelación en una definición, que es justo lo que
   * este proyecto evita.
   */
  _dibujarRevelacion(c, W, H) {
    c.fillStyle = PALETA.fondoHondo;
    c.fillRect(0, 0, W, H);
    const cx = W / 2;
    const ancho = Math.min(940, W - 80);
    const colQue = Math.min(230, ancho * 0.27);

    c.font = 'italic 20px ' + FUENTE.narrativa;
    const entrada = partirLineas(c,
      'Miraste toda la compañía: catorce lugares, y cada uno le importa a alguien. ' +
      'No alcanzaba para todos. Leíste lo que había en cada uno, escogiste los que más pesaban ' +
      'y decidiste a cuáles ir primero.', ancho - 40);

    c.font = '15px ' + FUENTE.interfaz;
    const filas = ASI_ELEGIMOS.map((f) => partirLineas(c, f.es, ancho - colQue - 30));
    const cierre = partirLineas(c,
      'Es la decisión más importante del año del área: define qué se revisa, en qué orden y qué ' +
      'queda por fuera. Se sustenta ante la Dirección, y de ahí sale el trabajo de los doce meses.',
      ancho - 60);

    const altoFilas = filas.reduce((a, l) => a + Math.max(1, l.length) * 21 + 15, 0);
    const alto = 28 + 46 + entrada.length * 29 + 30 + altoFilas + 40 + 40 + 34 + cierre.length * 22;
    let y = Math.max(24, (H - alto) / 2 - 10);

    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = '11px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.oro;
    c.fillText('LO QUE ACABAS DE HACER, EN LA VIDA REAL', cx, y);
    y += 28;

    // El mismo título que en las otras dos etapas: el visitante reconoce el
    // momento antes de leer una palabra.
    c.font = '32px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tinta;
    c.fillText('Así elegimos', cx, y);
    y += 46;

    // --- primer tiempo: lo que hizo, contado como lo vivió
    c.globalAlpha = suave(Math.min(1, this.tFase / 1.1));
    c.font = 'italic 20px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tinta;
    entrada.forEach((l) => { c.fillText(l, cx, y); y += 29; });
    c.globalAlpha = 1;
    y += 30;

    // --- segundo tiempo: la traducción, pieza por pieza
    const x0 = cx - ancho / 2;
    ASI_ELEGIMOS.forEach((f, n) => {
      c.globalAlpha = suave(Math.min(1, (this.tFase - 1.2 - n * 0.18) / 0.5));
      c.textAlign = 'left';
      c.font = 'bold 16px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.oroClaro;
      c.fillText(f.que, x0, y);
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tinta;
      filas[n].forEach((l, m) => c.fillText(l, x0 + colQue + 30, y + m * 21));
      y += Math.max(1, filas[n].length) * 21 + 15;
      c.globalAlpha = 1;
    });
    y += 40;

    // --- tercer tiempo: el nombre, y lo que pesa
    if (this.tFase > 2.6) {
      c.globalAlpha = suave(Math.min(1, (this.tFase - 2.6) / 0.9));
      c.textAlign = 'center';
      c.font = '30px ' + FUENTE.narrativa;
      c.fillStyle = PALETA.oro;
      c.fillText('Eso es el Plan Anual de Auditoría.', cx, y);
      c.globalAlpha = 1;
    }
    y += 40;

    if (this.tFase > 3.3) {
      c.globalAlpha = suave(Math.min(1, (this.tFase - 3.3) / 0.9));
      c.textAlign = 'center';
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tintaTenue;
      cierre.forEach((l) => { c.fillText(l, cx, y); y += 22; });
      c.globalAlpha = 1;
    }

    if (this.tFase > 4) {
      c.textBaseline = 'bottom';
      c.textAlign = 'center';
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = Math.sin(this.t * 4) > -0.45 ? PALETA.oro : PALETA.tintaDebil;
      c.fillText('Pulsa ' + this.nombreBoton + ' para seguir el recorrido', cx, H - 24);
    }
  }

  /**
   * Salida de los equipos, como fichas sobre un tablero.
   *
   * Cada una se levanta del campamento, viaja describiendo un arco y aterriza
   * en su destino. El arco es lo que la hace leerse como una ficha que alguien
   * mueve, y no como un punto que se desliza.
   */
  _dibujarDespacho(c, W, H) {
    const bx = BASE.x * W, by = BASE.y * H;

    // campamento
    c.strokeStyle = PALETA.oro;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(bx - 13, by + 9); c.lineTo(bx, by - 11); c.lineTo(bx + 13, by + 9); c.closePath();
    c.stroke();
    c.fillStyle = 'rgba(217,164,65,0.18)';
    c.fill();

    for (const f of this.fichas) {
      const dx = f.region.x * W, dy = f.region.y * H;
      const t = this.tFase - f.salida;
      if (t < 0) continue;

      const k = limitar(t / VIAJE, 0, 1);
      const e = suave(k);
      const x = bx + (dx - bx) * e;
      const y = by + (dy - by) * e - Math.sin(k * Math.PI) * 26;   // el arco

      // estela
      c.strokeStyle = 'rgba(217,164,65,0.22)';
      c.lineWidth = 1.5;
      c.setLineDash([4, 5]);
      c.beginPath();
      c.moveTo(bx, by); c.lineTo(x, y);
      c.stroke();
      c.setLineDash([]);

      // sombra en el suelo: vende la altura del arco
      const sy = by + (dy - by) * e;
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.beginPath();
      c.ellipse(x, sy + 4, 7 * (1 - Math.sin(k * Math.PI) * 0.3), 3, 0, 0, Math.PI * 2);
      c.fill();

      // aterrizaje: anillo que se expande
      if (k >= 1) {
        const ta = t - VIAJE;
        if (ta < 0.5) {
          c.strokeStyle = PALETA.oro;
          c.lineWidth = 2.5 * (1 - ta / 0.5);
          c.beginPath();
          c.arc(dx, dy, 10 + ta * 90, 0, Math.PI * 2);
          c.stroke();
        }
      }

      // la ficha
      const escala = k >= 1 ? 1 + Math.max(0, 0.35 - (t - VIAJE)) * 0.8 : 1.1;
      c.fillStyle = PALETA.oro;
      c.beginPath();
      c.arc(x, y, 10 * escala, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = PALETA.fondoHondo;
      c.font = 'bold 12px ' + FUENTE.interfaz;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(String(this.fichas.indexOf(f) + 1), x, y + 1);
    }

    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.font = 'italic 20px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tinta;
    c.fillText('Los equipos salen del campamento.', W / 2, H - 46);
  }

  /**
   * El relato: qué acaba de decidir, ya traducido.
   *
   * Es el único momento de la etapa donde la metáfora y el trabajo real se
   * tocan. El visitante todavía no sabe que esto se llama Plan Anual —eso se
   * nombra en el cierre—, pero sí ve que sus lugares eran cosas concretas de
   * la compañía y qué van a revisar en cada una.
   */
  _dibujarRelato(c, W, H) {
    c.fillStyle = 'rgba(5,7,12,0.94)';
    c.fillRect(0, 0, W, H);

    const cx = W / 2;
    const ancho = Math.min(820, W - 90);
    const izq = cx - ancho / 2;

    // ---------- medir para centrar el bloque entero
    c.font = '14px ' + FUENTE.interfaz;
    const items = this.elegidas.map((r) => partirLineas(c, r.queRevisamos, ancho - 58));
    const altoLista = items.reduce((s, l) => s + 26 + l.length * 19 + 14, 0);
    const alto = 34 + 44 + 30 + altoLista + 40;
    let y = Math.max(28, (H - alto) / 2 - 10);

    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = '11px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.oro;
    c.fillText('TU PLAN', cx, y);
    y += 30;

    if (!this.elegidas.length) {
      c.font = '26px ' + FUENTE.narrativa;
      c.fillStyle = PALETA.riesgo;
      c.fillText('No enviaste a nadie a ninguna parte.', cx, y);
      y += 44;
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tintaTenue;
      c.fillText('El territorio se queda como estaba, y nadie sabrá qué había en él.', cx, y);
    } else {
      c.font = 'italic 19px ' + FUENTE.narrativa;
      c.fillStyle = PALETA.tintaTenue;
      c.fillText('Esto es lo que acabas de mandar a revisar, y en este orden.', cx, y);
      y += 42;

      this.elegidas.forEach((r, i) => {
        // número
        c.textAlign = 'left';
        c.textBaseline = 'top';
        c.fillStyle = PALETA.oro;
        c.beginPath();
        c.arc(izq + 13, y + 10, 13, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = PALETA.fondoHondo;
        c.font = 'bold 13px ' + FUENTE.interfaz;
        c.textAlign = 'center';
        c.fillText(String(i + 1), izq + 13, y + 4);

        // lugar -> proceso, la analogía en una línea
        c.textAlign = 'left';
        c.font = '18px ' + FUENTE.narrativa;
        c.fillStyle = PALETA.tinta;
        const nombre = r.nombre + '  ';
        c.fillText(nombre, izq + 38, y);
        const wN = c.measureText(nombre).width;
        c.font = '14px ' + FUENTE.interfaz;
        c.fillStyle = PALETA.tintaDebil;
        c.fillText('es ', izq + 38 + wN, y + 4);
        const wEs = c.measureText('es ').width;
        c.font = '16px ' + FUENTE.interfaz;
        c.fillStyle = PALETA.oroClaro;
        c.fillText(r.equivale, izq + 38 + wN + wEs, y + 2);

        // qué se va a revisar
        let ly = y + 26;
        c.font = '14px ' + FUENTE.interfaz;
        c.fillStyle = PALETA.tintaTenue;
        items[i].forEach((l) => { c.fillText(l, izq + 38, ly); ly += 19; });

        y = ly + 14;
      });
    }

    if (this.tFase > 1.4) {
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = Math.sin(this.t * 4) > -0.45 ? PALETA.oro : PALETA.tintaDebil;
      c.fillText('Pulsa ' + this.nombreBoton + ' para ver qué tal elegiste', cx, H - 28);
    }
  }

  _dibujarTierra(c, W, H) {
    const trazar = (pts, ox = 0, oy = 0) => {
      c.beginPath();
      pts.forEach((p, i) => {
        const x = (p.x + ox) * W, y = (p.y + oy) * H;
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      });
      c.closePath();
    };

    // --- tierra firme
    c.save();
    trazar(this.costa);
    const g = c.createLinearGradient(0, H * 0.15, 0, H * 0.9);
    g.addColorStop(0, PALETA.territorioAlto);
    g.addColorStop(1, PALETA.territorio);
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = PALETA.costa;
    c.lineWidth = 2;
    c.stroke();
    c.clip();
    c.strokeStyle = 'rgba(90,140,170,0.10)';
    c.lineWidth = 1;
    for (let k = 1; k <= 5; k++) {
      c.beginPath();
      this.costa.forEach((p, i) => {
        const f = 1 - k * 0.13;
        const x = (0.5 + (p.x - 0.5) * f) * W;
        const y = (0.5 + (p.y - 0.5) * f) * H;
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      });
      c.closePath();
      c.stroke();
    }
    c.restore();

    // --- la isla de afuera
    const isla = REGIONES.find((r) => r.id === 'isla');
    c.save();
    trazar(this.contornoIsla, isla.x, isla.y);
    c.fillStyle = PALETA.territorio;
    c.fill();
    c.strokeStyle = PALETA.costa;
    c.lineWidth = 2;
    c.stroke();
    c.restore();
  }

  _dibujarRegiones(c, W, H) {
    const frac = this.exploradas / (REJILLA_X * REJILLA_Y);

    for (const r of REGIONES) {
      const x = r.x * W, y = r.y * H;
      const idx = this.elegidas.findIndex((e) => e.id === r.id);
      const esCandidata = this.fase === 'decidir' && this.candidata === r;

      if (!r.descubierto) {
        // Insinuación tardía de la isla: si ya recorrió bastante y no la ha
        // visto, late muy débil. Ayuda sin regalarla.
        const pista = r.oculta && this.fase === 'explorar' && frac > PISTA_ISLA;
        const alfa = pista ? 0.16 + Math.sin(this.t * 2.4) * 0.11 : 0.16;
        c.fillStyle = 'rgba(200,215,230,' + alfa.toFixed(3) + ')';
        c.beginPath();
        c.arc(x, y, pista ? 5 : 4, 0, Math.PI * 2);
        c.fill();
        continue;
      }

      if (r._brillo > 0) {
        c.globalAlpha = r._brillo * 0.5;
        c.fillStyle = r.oculta ? PALETA.exito : PALETA.oro;
        c.beginPath();
        c.arc(x, y, 14 + (1 - r._brillo) * 46, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
      }

      const col = idx >= 0 ? PALETA.oro : esCandidata ? PALETA.oroClaro : PALETA.tinta;
      c.strokeStyle = col;
      c.lineWidth = idx >= 0 ? 3 : 2;
      c.beginPath();
      c.arc(x, y, idx >= 0 ? 12 : 8, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = PALETA.fondo;
      c.fill();
      c.fillStyle = col;
      c.beginPath();
      c.arc(x, y, 3.5, 0, Math.PI * 2);
      c.fill();

      if (idx >= 0) {
        c.fillStyle = PALETA.oro;
        c.beginPath();
        c.arc(x + 16, y - 16, 12, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = PALETA.fondoHondo;
        c.font = 'bold 14px ' + FUENTE.interfaz;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(String(idx + 1), x + 16, y - 15);
      }

      // Etiqueta: se limita a los bordes para que nunca salga de pantalla.
      const bw = 56;
      const lx = limitar(x, bw / 2 + 12, W - bw / 2 - 12);
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.font = '13px ' + FUENTE.narrativa;
      c.fillStyle = esCandidata || idx >= 0 ? PALETA.oroClaro : PALETA.tinta;
      c.fillText(r.nombre, lx, y + 16);

      let by = y + 36;
      for (const l of LECTURAS) {
        barraLectura(c, lx - bw / 2, by, bw, 4, r[l.clave], l.color, null);
        by += 7;
      }
    }
  }

  _dibujarLuz(c, p) {
    c.save();
    const g = c.createRadialGradient(p.x, p.y, RADIO_LUZ * 0.5, p.x, p.y, RADIO_LUZ);
    g.addColorStop(0, 'rgba(217,164,65,0.00)');
    g.addColorStop(1, 'rgba(217,164,65,0.09)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(p.x, p.y, RADIO_LUZ, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = PALETA.oro;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(p.x, p.y, RADIO_LUZ, 0, Math.PI * 2);
    c.stroke();

    c.strokeStyle = PALETA.oroClaro;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(p.x - 14, p.y); c.lineTo(p.x - 4, p.y);
    c.moveTo(p.x + 4, p.y); c.lineTo(p.x + 14, p.y);
    c.moveTo(p.x, p.y - 14); c.lineTo(p.x, p.y - 4);
    c.moveTo(p.x, p.y + 4); c.lineTo(p.x, p.y + 14);
    c.stroke();

    // Anillo de "quédate quieto aquí" sobre el lugar que se está enfocando.
    for (const r of REGIONES) {
      if (r.descubierto || r._permanencia <= 0.02) continue;
      anillo(c, r.x * this.motor.ancho, r.y * this.motor.alto, 19,
        r._permanencia / 0.85, PALETA.oro, 3, 'rgba(255,255,255,0.10)');
    }
    c.restore();
  }

  /** Una palabra para cada valor de barra. Un 0.68 suelto no le dice nada a nadie. */
  _nivel(v) {
    if (v >= 0.80) return 'muy alto';
    if (v >= 0.62) return 'alto';
    if (v >= 0.45) return 'medio';
    if (v >= 0.30) return 'bajo';
    return 'muy bajo';
  }

  /**
   * Ficha flotante del lugar al que se apunta, durante la fase de decidir.
   *
   * Sin esto el visitante ve tres barras de colores y un nombre bonito, y no
   * tiene forma de saber qué hay ahí. La ficha da las tres lecturas en
   * palabras y una frase que insinúa el lugar sin nombrar el proceso.
   *
   * Se coloca al lado del puntero y salta al otro lado si no cabe, para no
   * tapar nunca el lugar que se está mirando.
   */
  _leyendaFlotante(c, r, p, W, H) {
    const ancho = 320;
    const pad = 14;

    c.font = '13px ' + FUENTE.interfaz;
    const lineas = partirLineas(c, r.pista, ancho - pad * 2);
    const idx = this.elegidas.findIndex((e) => e.id === r.id);
    const alto = pad * 2 + 26 + LECTURAS.length * 22 + 8
      + lineas.length * 18 + (idx >= 0 ? 20 : 0);

    let x = p.x + 38;
    if (x + ancho > W - 12) x = p.x - 38 - ancho;
    x = limitar(x, 12, W - ancho - 12);
    const y = limitar(p.y - alto / 2, 12, H - alto - 64);

    c.fillStyle = 'rgba(6,10,16,0.96)';
    rectRedondeado(c, x, y, ancho, alto, 10);
    c.fill();
    c.strokeStyle = idx >= 0 ? PALETA.oro : 'rgba(217,164,65,0.40)';
    c.lineWidth = idx >= 0 ? 2 : 1;
    c.stroke();

    let cy = y + pad;
    const ix = x + pad;
    c.textAlign = 'left';
    c.textBaseline = 'top';

    c.font = '17px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.oroClaro;
    c.fillText(r.nombre, ix, cy);
    cy += 26;

    for (const l of LECTURAS) {
      const v = r[l.clave];
      c.font = '11px ' + FUENTE.interfaz;
      c.textAlign = 'left';
      c.fillStyle = PALETA.tintaTenue;
      c.fillText(l.nombre, ix, cy + 2);
      barraLectura(c, ix + 84, cy + 4, 116, 7, v, l.color, null);
      c.textAlign = 'right';
      c.fillStyle = l.color;
      c.fillText(this._nivel(v), x + ancho - pad, cy + 2);
      cy += 22;
    }
    cy += 8;

    c.textAlign = 'left';
    c.font = '13px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tinta;
    lineas.forEach((l) => { c.fillText(l, ix, cy); cy += 18; });

    if (idx >= 0) {
      c.font = '11px ' + FUENTE.instrumento;
      c.fillStyle = PALETA.oro;
      c.fillText('EQUIPO ' + (idx + 1) + ' ENVIADO AQUÍ', ix, cy + 3);
    }
  }

  /** Animaciones flotantes de descubrimiento y de envío de equipos. */
  _dibujarAvisos(c) {
    for (const a of this.avisos) {
      const k = 1 - a.vida / a.max;
      const subida = suave(Math.min(1, k * 2.2)) * 42;
      const alfa = a.vida < 0.5 ? a.vida / 0.5 : 1;
      const col = a.especial ? PALETA.exito : PALETA.oroClaro;

      c.save();
      c.globalAlpha = alfa;

      // onda expansiva
      if (k < 0.55) {
        c.strokeStyle = col;
        c.lineWidth = 2.5 * (1 - k / 0.55);
        c.globalAlpha = alfa * (1 - k / 0.55) * 0.8;
        c.beginPath();
        c.arc(a.x, a.y, 14 + k * 110, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = alfa;
      }

      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.font = (a.especial ? 'bold 19px ' : '16px ') + FUENTE.interfaz;
      c.lineWidth = 4;
      c.strokeStyle = 'rgba(5,7,12,0.85)';
      c.strokeText(a.texto, a.x, a.y - 22 - subida);
      c.fillStyle = col;
      c.fillText(a.texto, a.x, a.y - 22 - subida);

      if (a.especial) {
        c.font = '12px ' + FUENTE.interfaz;
        c.strokeText('¡fuera del mapa!', a.x, a.y - 4 - subida);
        c.fillText('¡fuera del mapa!', a.x, a.y - 4 - subida);
      }
      c.restore();
    }
  }

  // ------------------------------------------------------------------ HUD
  _panel(c, x, y, w, h) {
    c.fillStyle = 'rgba(5,9,14,0.85)';
    rectRedondeado(c, x, y, w, h, 10);
    c.fill();
    c.strokeStyle = 'rgba(217,164,65,0.22)';
    c.lineWidth = 1;
    c.stroke();
  }

  /** Marcador grande: lo que el visitante mira de reojo sin dejar de jugar. */
  _marcador(c, x, y, valor, total, rotulo, color) {
    this._panel(c, x, y, 186, 92);
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.font = '10px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.tintaDebil;
    c.fillText(rotulo.toUpperCase(), x + 16, y + 13);

    c.font = 'bold 44px ' + FUENTE.interfaz;
    c.fillStyle = color;
    c.fillText(String(valor), x + 16, y + 31);
    const w = c.measureText(String(valor)).width;

    c.font = '20px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tintaDebil;
    c.fillText('/ ' + total, x + 24 + w, y + 55);
  }

  _reloj(c, W, restante, total) {
    const x = W - 62, y = 62;
    anillo(c, x, y, 28, restante / total, restante < 10 ? PALETA.riesgo : PALETA.oro, 5);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = 'bold 20px ' + FUENTE.interfaz;
    c.fillStyle = restante < 10 ? PALETA.riesgo : PALETA.tinta;
    c.fillText(String(Math.ceil(restante)), x, y);
    c.font = '9px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.tintaDebil;
    c.fillText('SEG', x, y + 40);
  }

  _pie(c, W, H, texto, color = PALETA.tintaTenue) {
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.font = '15px ' + FUENTE.interfaz;
    c.fillStyle = color;
    c.fillText(texto, W / 2, H - 22);
  }

  _hudExplorar(c, W, H) {
    const restante = Math.max(0, T_EXPLORAR - this.tFase);
    const hallados = REGIONES.filter((r) => r.descubierto).length;
    const frac = this.exploradas / (REJILLA_X * REJILLA_Y);

    this._marcador(c, 20, 20, hallados, REGIONES.length, 'Lugares encontrados', PALETA.oroClaro);

    // barra de territorio iluminado, debajo del marcador
    this._panel(c, 20, 122, 186, 50);
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.font = '10px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.tintaDebil;
    c.fillText('MAPA ILUMINADO', 36, 133);
    barraLectura(c, 36, 150, 122, 8, frac, PALETA.senal, null);
    c.textAlign = 'right';
    c.font = 'bold 13px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tinta;
    c.fillText(Math.round(frac * 100) + '%', 190, 148);

    this._reloj(c, W, restante, T_EXPLORAR);
    this._pie(c, W, H, 'Mueve el Joy-Con para iluminar. Detente sobre un lugar para descubrirlo.');
  }

  _hudDecidir(c, W, H) {
    const restante = Math.max(0, T_DECIDIR - this.tFase);
    this._marcador(c, 20, 20, this.elegidas.length, BANDERAS_DISPONIBLES, 'Equipos enviados', PALETA.oro);

    // fichas de equipos restantes
    for (let i = 0; i < BANDERAS_DISPONIBLES; i++) {
      const x = 36 + i * 24;
      c.fillStyle = i < this.elegidas.length ? PALETA.oro : 'rgba(217,164,65,0.20)';
      c.beginPath();
      c.arc(x, 128, 8, 0, Math.PI * 2);
      c.fill();
    }

    // leyenda permanente de las tres barras
    const ly = 156;
    this._panel(c, 20, ly, 186, 26 + LECTURAS.length * 22);
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.font = '10px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.tintaDebil;
    c.fillText('CÓMO SE LEE', 36, ly + 11);
    LECTURAS.forEach((l, i) => {
      const y = ly + 30 + i * 22;
      barraLectura(c, 36, y + 4, 34, 6, [0.85, 0.6, 0.45][i], l.color, null);
      c.font = '12px ' + FUENTE.interfaz;
      c.fillStyle = l.color;
      c.fillText(l.nombre, 78, y);
    });

    this._reloj(c, W, restante, T_DECIDIR);

    // --- botón de despachar: no hay que agotar el reloj ni llenar los cinco
    if (this.elegidas.length > 0) {
      const b = this._rectEnviar();
      const activo = this.sobreEnviar;
      c.fillStyle = activo ? PALETA.oro : 'rgba(217,164,65,0.12)';
      rectRedondeado(c, b.x, b.y, b.w, b.h, 10);
      c.fill();
      c.strokeStyle = PALETA.oro;
      c.lineWidth = activo ? 2.5 : 1.5;
      c.stroke();

      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = 'bold 16px ' + FUENTE.interfaz;
      c.fillStyle = activo ? PALETA.fondoHondo : PALETA.oroClaro;
      c.fillText('Enviar ' + this.elegidas.length +
        (this.elegidas.length === 1 ? ' equipo' : ' equipos'), b.x + b.w / 2, b.y + b.h / 2);
    }

    if (this.sobreEnviar) {
      this._pie(c, W, H, 'Pulsa ' + this.nombreBoton + ' para que salgan ya', PALETA.oroClaro);
    } else if (this.candidata && !this.candidata.descubierto) {
      this._pie(c, W, H, 'No puedes enviar un equipo a un lugar que nunca miraste', PALETA.riesgo);
    } else {
      this._pie(c, W, H, 'Apunta a un lugar y pulsa ' + this.nombreBoton +
        '. El orden en que los envías es tu prioridad.');
    }
  }

  // ------------------------------------------------------------ resultado
  _dibujarResultado(c, W, H) {
    c.fillStyle = 'rgba(5,7,12,0.94)';
    c.fillRect(0, 0, W, H);
    if (this.paginaRes === 0) this._resNotas(c, W, H);
    else if (this.paginaRes === 1) this._resDetalle(c, W, H);
    else this._resIsla(c, W, H);
    this._piePagina(c, W, H);
  }

  _piePagina(c, W, H) {
    if (this.tFase <= 1.8) return;
    const ultimo = this.paginaRes >= this._ultimaPagina;
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.font = '15px ' + FUENTE.interfaz;
    c.fillStyle = Math.sin(this.t * 4) > -0.45 ? PALETA.oro : PALETA.tintaDebil;
    c.fillText('Pulsa ' + this.nombreBoton + (ultimo ? ' para ver qué acabas de hacer' : ' para ver por qué'),
      W / 2, H - 26);

    // puntos de paginación
    const n = this._ultimaPagina + 1;
    for (let i = 0; i < n; i++) {
      c.beginPath();
      c.arc(W / 2 - (n - 1) * 7 + i * 14, H - 54, 3.5, 0, Math.PI * 2);
      c.fillStyle = i === this.paginaRes ? PALETA.oro : 'rgba(255,255,255,0.20)';
      c.fill();
    }
  }

  _resNotas(c, W, H) {
    const R = this.resultado;
    const cx = W / 2;
    c.textAlign = 'center';
    c.textBaseline = 'top';

    let y = Math.max(40, H * 0.10);
    c.font = '11px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.oro;
    c.fillText('RESULTADO DE TU EXPEDICIÓN', cx, y);
    y += 26;

    c.font = '40px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tinta;
    c.fillText(R.veredicto, cx, y);
    y += 62;

    const notas = [
      ['MIRASTE', this.contadores.vision, 'cuánto del mapa alcanzaste a ver'],
      ['ELEGISTE BIEN', this.contadores.criterio, 'acertaste en los lugares que más pesaban'],
      ['PRIORIZASTE', this.contadores.priorizacion, 'y los pusiste en el orden correcto'],
    ];
    const anchoN = Math.min(230, (W - 120) / 3);
    const sep = 22;
    const total = notas.length * anchoN + (notas.length - 1) * sep;
    let nx = cx - total / 2;

    notas.forEach(([tit, val, sub]) => {
      this._panel(c, nx, y, anchoN, 150);
      const mx = nx + anchoN / 2;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.font = '10px ' + FUENTE.instrumento;
      c.fillStyle = PALETA.tintaDebil;
      c.fillText(tit, mx, y + 20);
      c.font = 'bold 50px ' + FUENTE.interfaz;
      c.fillStyle = val >= 70 ? PALETA.exito : val >= 45 ? PALETA.alerta : PALETA.riesgo;
      c.fillText(String(val), mx, y + 40);
      c.font = '12px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tintaTenue;
      partirLineas(c, sub, anchoN - 26).forEach((l, i) => c.fillText(l, mx, y + 104 + i * 17));
      nx += anchoN + sep;
    });
  }

  _resDetalle(c, W, H) {
    const R = this.resultado;
    const cx = W / 2;
    const anchoCol = Math.min(760, W - 90);
    let y = Math.max(34, H * 0.07);

    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = '11px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.oro;
    c.fillText('POR QUÉ', cx, y);
    y += 30;

    // --- lo que eligió
    c.textAlign = 'left';
    c.font = '13px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tintaDebil;
    c.fillText('A dónde enviaste tus equipos', cx - anchoCol / 2, y);
    y += 22;

    if (!R.elegidas.length) {
      c.fillStyle = PALETA.riesgo;
      c.font = '15px ' + FUENTE.interfaz;
      c.fillText('No enviaste ningún equipo.', cx - anchoCol / 2, y);
      y += 28;
    }

    R.elegidas.forEach((r, i) => {
      const bien = R.idsIdeales.includes(r.id);
      c.font = 'bold 14px ' + FUENTE.interfaz;
      c.fillStyle = bien ? PALETA.exito : PALETA.alerta;
      c.fillText(bien ? '✓' : '·', cx - anchoCol / 2, y);
      c.font = '15px ' + FUENTE.narrativa;
      c.fillStyle = PALETA.tinta;
      c.fillText((i + 1) + '. ' + r.nombre, cx - anchoCol / 2 + 20, y);
      c.font = '13px ' + FUENTE.interfaz;
      c.fillStyle = bien ? PALETA.tintaTenue : PALETA.alerta;
      c.textAlign = 'right';
      c.fillText(bien ? 'buena elección' : 'no era de las más urgentes', cx + anchoCol / 2, y);
      c.textAlign = 'left';
      y += 24;
    });

    y += 16;

    // --- lo que se le escapó: la parte que más enseña
    if (R.perdidas.length) {
      const r = R.perdidas.find((p) => p.id !== 'isla') || R.perdidas[0];
      c.fillStyle = 'rgba(224,97,74,0.09)';
      const alturaCaja = this._medirCaja(c, r, anchoCol);
      rectRedondeado(c, cx - anchoCol / 2, y, anchoCol, alturaCaja, 10);
      c.fill();
      c.strokeStyle = 'rgba(224,97,74,0.30)';
      c.lineWidth = 1;
      c.stroke();

      let iy = y + 16;
      const ix = cx - anchoCol / 2 + 20;
      const anchoTxt = anchoCol - 40;

      c.textAlign = 'left';
      c.font = '10px ' + FUENTE.instrumento;
      c.fillStyle = PALETA.riesgo;
      c.fillText('SE TE ESCAPÓ', ix, iy);
      iy += 20;

      c.font = '19px ' + FUENTE.narrativa;
      c.fillStyle = PALETA.tinta;
      c.fillText(r.nombre, ix, iy);
      iy += 28;

      c.font = '14px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tintaTenue;
      partirLineas(c, r.porQueImporta, anchoTxt).forEach((l) => {
        c.fillText(l, ix, iy);
        iy += 20;
      });
    } else {
      c.textAlign = 'center';
      c.font = '17px ' + FUENTE.narrativa;
      c.fillStyle = PALETA.exito;
      c.fillText('No se te escapó ninguno de los importantes.', cx, y);
      y += 26;
      c.font = '14px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tintaTenue;
      c.fillText('Miraste lo suficiente y elegiste bien. Eso es exactamente lo difícil.', cx, y);
    }
  }

  _medirCaja(c, r, anchoCol) {
    c.font = '14px ' + FUENTE.interfaz;
    const n = partirLineas(c, r.porQueImporta, anchoCol - 40).length;
    return 16 + 20 + 28 + n * 20 + 12;
  }

  /** Página dedicada al lugar que casi nadie encuentra. */
  _resIsla(c, W, H) {
    const isla = REGIONES.find((r) => r.id === 'isla');
    const cx = W / 2;
    const ancho = Math.min(720, W - 100);
    let y = Math.max(50, H * 0.14);

    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = '11px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.riesgo;
    c.fillText('HABÍA UN LUGAR MÁS', cx, y);
    y += 34;

    c.font = '38px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tinta;
    c.fillText(isla.nombre, cx, y);
    y += 54;

    c.font = 'italic 17px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tintaTenue;
    partirLineas(c, isla.verdad, ancho).forEach((l) => { c.fillText(l, cx, y); y += 26; });
    y += 20;

    c.font = '15px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tinta;
    partirLineas(c, isla.porQueImporta, ancho).forEach((l) => { c.fillText(l, cx, y); y += 22; });
  }
}

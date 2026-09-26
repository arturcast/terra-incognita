/**
 * regreso.js — ETAPA 3, "El Regreso". Un Flappy Bird, con paloma mensajera.
 *
 * Las reglas y la física están en `src/juego/vuelo.js`, que es puro y se
 * prueba en Node. Aquí solo se dibuja y se escucha el mando.
 *
 * Con dos jugadores, cada uno vuela en su mitad de la pantalla (decisión del
 * usuario, 2026-09-25), sobre las mismas columnas. El paso entre columnas de
 * cada uno lo abre lo que encontró en El Camino: por eso cada mitad puede verse
 * distinta. El Jugador 2 se une pulsando cualquier botón de su mando durante
 * las instrucciones, igual que en El Camino.
 *
 * REGLA DE ORO: mientras se vuela no se nombra el oficio. «Aros» y «puestos de
 * control». Informe, recomendaciones y seguimiento se nombran en la revelación
 * del final, y solo ahí.
 */

import { Escena } from '../../core/engine.js';
import { Acciones } from '../../core/input.js';
import { Briefing, partirLineas } from '../../core/briefing.js';
import {
  PALETA, FUENTE, MENU, rectRedondeado, grano, suave, limitar, cuentaMenu,
  cajaMenu, tituloMenu, textoMenu, fondoMenu, patronMenu,
} from '../../core/render.js';

/** ¿Hay navegador para pintar en lienzos aparte? (En las pruebas de Node, no.) */
const CON_LIENZOS = () => typeof document !== 'undefined' && typeof window !== 'undefined' && !!document.createElement;
/** Periodo del suelo, en px lógicos: la roca (256 × 0,6) y la arena (256 × 0,5) se repiten juntas cada 768. */
const PERIODO_SUELO = 768;
import { dibujarRevelacion } from '../../ui/revelacion.js';
import { participantesDe, dibujarUnion, eleccion, nombreDe, textoGana, unirJugador2 } from '../../ui/jugadores.js';
import { VUELO, generarCielo, Vuelo, ganadorVuelo } from '../vuelo.js';

const COLOR_J = [PALETA.oro, PALETA.senal];
const AZUL = '#5aa9e6';
const ORO_ARO = '#f0c977';
const ROJO_HALLAZGO = '#ff5a4a';   // el rojo de lo escondido en El Camino
/** Segundos que el tablero se queda sí o sí: quien llega aleteando no se lo salta. */
const BLOQUEO_TABLERO = 3;
/** Dónde vuela la paloma en su mitad, en px lógicos: más a la izquierda, se ve más por delante. */
const X_PALOMA_PARTIDA = 150;
/** Plumas que suelta al chocar. Se crean una vez y se reciclan. */
const PLUMAS = 16;

/** Lo que acaba de hacer, traducido a lo que hace el área. Pantalla final. */
const ASI_TERMINAMOS = [
  { que: 'Lo que encontraste', es: 'Los HALLAZGOS. No son para buscar culpables: son lo que hay que arreglar.' },
  { que: 'El paso más ancho', es: 'Cada hallazgo corregido deja el proceso más fácil y más seguro para todos.' },
  { que: 'Los aros', es: 'Las recomendaciones que el proceso ya puso en marcha.' },
  { que: 'Los puestos de control', es: 'El seguimiento: volvemos a mirar que el cambio se quedó.' },
  { que: 'Las tuberías', es: 'Los riesgos que siguen ahí mientras nadie los corrija.' },
];

export class EscenaRegreso extends Escena {
  static jugadores = 'uno-o-dos';

  constructor(motor) {
    super(motor);
    /** Video previo a las instrucciones: assets/cinematicas/regreso.mp4 (opcional). */
    this.cinematica = 'regreso';
    this.acciones = motor.jugadores.map((j) => new Acciones(j));

    this.guia = new Briefing({
      etiqueta: 'Etapa 3 · El Regreso',
      titulo: 'El camino despejado',
      entrada: 'Lo que encontraste no se quedó guardado: sirvió para arreglar lo que estaba mal. Ahora el regreso es más fácil, y mientras más encontraste, más despejado está.',
      pasos: [
        'Pulsa el gatillo para batir las alas. Nada más. Con teclado: Jugador 1 con W o Espacio; Jugador 2 con la flecha ↑.',
        'Atraviesa los aros dorados: cada uno es una mejora que ya funciona y suma puntos, hasta el último segundo.',
        'Pasa por los puestos de control: son la vuelta a verificar que sí cambió.',
        'Las tuberías son lo que nadie ha arreglado todavía. Chocar no te saca del juego, pero te frena.',
        'Cada cosa escondida que atrapaste en El Camino abrió más el paso entre las tuberías y hace valer más cada aro.',
      ],
      aviso: 'Pueden jugar dos, cada uno en su mitad de la pantalla. Gana quien haga más puntos.',
      continuar: 'Jugador 1: pulsa {B} para despegar',
      minimo: 1.2,
    });

    this.teclado = false;
    this.raton = false;
    // Teclado, para uno o dos jugadores (ver ui/jugadores.js):
    //   Jugador 1: W, Espacio o Enter baten sus alas.
    //   Jugador 2: ↑. Se une pulsando ↑ en las instrucciones. Mientras nadie
    //   se una, ↑ también sirve al Jugador 1.
    this.teclado2 = { pulso: false, unido: false };
    this._onTecla = (e) => {
      if (e.repeat) return;              // mantener pulsado no es aletear sin parar
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'ArrowUp') {
        const j2 = this.motor.jugadores[1];
        // ↑ une al Jugador 2 solo si no se eligió al empezar cuántos juegan.
        if (this.fase === 'guia' && !this.teclado2.unido && !(j2 && j2.estado.conectado) && !eleccion(this.motor)) this._unirTeclado();
        else if (this.teclado2.unido) this.teclado2.pulso = true;
        else this.teclado = true;
      } else if (k === ' ' || k === 'Enter' || k === 'w') this.teclado = true;
    };
    this._onClic = () => { this.raton = true; };
    this._onBotonReserva = (ev) => this._unirse(ev.detail.entrada);
  }

  get audio() { return this.motor.audio; }
  recentrarPuntero() {}

  async entrar() {
    this.fase = 'guia';
    this.t = 0;
    this.tFase = 0;
    this.guia.reiniciar();
    this.vuelos = [];
    this.participantes = [];
    this.teclado2 = { pulso: false, unido: false };
    // Si juegan dos (elegido al empezar, o porque jugaron dos El Camino), el 2
    // ya está dentro: con su Joy-Con si tiene uno, y si no, con la flecha ↑.
    const j2 = this.motor.jugadores[1];
    if (eleccion(this.motor) === 2 && !(j2 && j2.estado.conectado)) this.teclado2.unido = true;
    this.resultados = [];
    this.ganador = 0;
    this.avisos = [[], []];
    this.aviso2 = null;
    // Animación de choque, por jugador: plumas, sacudida y destello.
    this.plumas = [0, 1].map(() => Array.from({ length: PLUMAS }, () => ({ vida: 0 })));
    this.sacudida = [0, 0];
    this.destello = [0, 0];
    this.semilla = (Math.random() * 1e9) | 0;
    this.cielo = generarCielo(this.semilla);
    this.nubes = Array.from({ length: 9 }, (_, i) => ({
      x: i * 420 + (i * 137) % 300, y: 60 + ((i * 91) % 240), r: 30 + (i % 4) * 14,
    }));

    window.addEventListener('keydown', this._onTecla);
    window.addEventListener('mousedown', this._onClic);
    if (this.motor.gestor) this.motor.gestor.addEventListener('botonReserva', this._onBotonReserva);
    this.audio && this.audio.musica('exploracion');
    // Esta etapa se dibuja entera en 2D y a pantalla completa (o dos veces, a
    // pantalla partida): en pantallas con escala de Windows al 125-150 %
    // pintar a resolución nativa costaba el doble de píxeles. A 1:1 casi no se
    // nota y va mucho más suelta.
    if (this.motor.limitarResolucion) this.motor.limitarResolucion(1);
  }

  salir() {
    window.removeEventListener('keydown', this._onTecla);
    window.removeEventListener('mousedown', this._onClic);
    if (this.motor.gestor) this.motor.gestor.removeEventListener('botonReserva', this._onBotonReserva);
    if (this.motor.limitarResolucion) this.motor.limitarResolucion(null);
  }

  async _unirse(entrada) {
    if (this.fase !== 'guia' || eleccion(this.motor) === 1) return;
    const razon = await unirJugador2(this.motor, entrada);
    if (razon === null) return;
    if (razon) { this.avisoLado = { t: 4, texto: razon }; this.audio && this.audio.sfx('error'); return; }
    this.teclado2.unido = false;         // el mando manda sobre el teclado
    this.aviso2 = { t: 2.5 };
    this.audio && this.audio.sfx('elegir');
  }


  /** El Jugador 2 se une con la flecha ↑ del teclado. */
  _unirTeclado() {
    this.teclado2.unido = true;
    this.aviso2 = { t: 2.5 };
    this.audio && this.audio.sfx('elegir');
  }

  // ------------------------------------------------------------- entrada
  /** Pulsaciones sueltas: teclado y ratón valen como jugador 1. */
  _tomarSueltas() {
    const si = this.teclado || this.raton;
    this.teclado = false;
    this.raton = false;
    return si;
  }

  _confirmo() {
    let si = this._tomarSueltas();
    for (const i of this.motor.jugadoresActivos) if (this.acciones[i].confirmar()) si = true;
    return si;
  }

  _nombreBoton(i) {
    const jc = this.motor.jugadores[i];
    if (jc.estado.conectado) return this.acciones[i].nombreConfirmar;
    return i === 1 && this.teclado2.unido ? '↑' : 'ESPACIO';
  }

  /** Cuántos hallazgos trae cada jugador de El Camino: le abren el paso y hacen valer más cada aro. */
  _hallazgosDe(k) {
    const p = this.motor.expedicion.puntajes || {};
    const rs = (p.camino && p.camino.resultados) || [];
    return rs[k] ? rs[k].hallazgos : (rs[0] ? rs[0].hallazgos : 0);
  }

  _despegar() {
    this.participantes = participantesDe(this.motor, this.teclado2.unido, false);
    this.motor.expedicion.jugadores = this.participantes.length;
    this.teclado2.pulso = false;
    this.vuelos = this.participantes.map((_, k) => new Vuelo(this.cielo, this._hallazgosDe(k)));
    this._tomarSueltas();                       // lo pulsado para empezar no es un aleteo
    for (const i of this.participantes) this.acciones[i].confirmar();
    this.fase = 'cuenta';
    this.tFase = 0;
    this.audio && this.audio.sfx('fase');
  }

  _aviso(k, texto, color, vida = 1.3) {
    this.avisos[k] = [...this.avisos[k].filter((a) => a.texto !== texto), { texto, color, vida, max: vida }];
  }

  // ---------------------------------------------------------- actualizar
  actualizar(dt) {
    this.t += dt;
    this.tFase += dt;
    if (this.aviso2) { this.aviso2.t -= dt; if (this.aviso2.t <= 0) this.aviso2 = null; }
    if (this.avisoLado) { this.avisoLado.t -= dt; if (this.avisoLado.t <= 0) this.avisoLado = null; }
    for (const lista of this.avisos) for (const a of lista) a.vida -= dt;
    this.avisos = this.avisos.map((l) => l.filter((a) => a.vida > 0));
    this._animarChoques(dt);

    if (this.fase === 'guia') {
      this.guia.actualizar(dt);
      const pulso = this._confirmo();
      if (this.guia.puedeContinuar && pulso) this._despegar();
      return;
    }

    if (this.fase === 'cuenta') {
      this._confirmo();                          // se consume: no cuenta como aleteo
      this.teclado2.pulso = false;
      if (this.tFase >= 3) {
        this.fase = 'vuelo';
        this.tFase = 0;
        this.audio && this.audio.musica('carrera');
      }
      return;
    }

    if (this.fase === 'vuelo') {
      const sueltas = this._tomarSueltas();
      const pulso2 = this.teclado2.pulso;
      this.teclado2.pulso = false;
      this.vuelos.forEach((v, k) => {
        const i = this.participantes[k];
        const jc = this.motor.jugadores[i];
        const delTeclado = i === 1 && this.teclado2.unido ? pulso2 : (k === 0 && sueltas);
        const aletear = (jc.estado.conectado && this.acciones[i].confirmar()) || delTeclado;
        v.actualizar(dt, aletear);
        this._eventos(v, k, i);
      });
      if (this.vuelos.every((v) => v.terminado)) this._terminar();
      return;
    }

    if (this.fase === 'tablero') {
      const pulso = this._confirmo();
      if (this.tFase > BLOQUEO_TABLERO && pulso) {
        this.fase = 'revelacion';
        this.tFase = 0;
        this.audio && this.audio.sfx('avanzar');
      }
      return;
    }

    if (this.fase === 'revelacion') {
      const pulso = this._confirmo();
      if (this.tFase > 2 && pulso) {
        this.audio && this.audio.sfx('avanzar');
        this.motor.ir('ruta', { completada: 'regreso' });
      }
    }
  }

  _eventos(v, k, i) {
    const au = this.audio;
    const jc = this.motor.jugadores[i];
    for (const e of v.eventos) {
      switch (e.tipo) {
        case 'aleteo':
          au && au.sfx('tic');
          break;
        case 'entrega':
          au && au.sfx('descubrir');
          jc.pulso(90, 0.6, 70);
          this._aviso(k, '¡Mejora! +' + e.valor, ORO_ARO, 1.2);
          break;
        case 'seguimiento':
          au && au.sfx('control');
          this._aviso(k, 'Volviste a verificar', PALETA.exito, 1.2);
          break;
        case 'choque':
          au && au.sfx('choque');
          jc.pulso(240, 0.9, 200);
          this._aviso(k, e.motivo === 'suelo' ? 'Te fuiste al suelo' : '«' + e.motivo + '»', '#f0917e', 1.6);
          this._soltarPlumas(k, v);
          break;
        default:
          break;
      }
    }
  }

  /** En px lógicos: dónde se dibuja la paloma dentro de su vista. */
  get _xVista() { return this.vuelos.length > 1 ? X_PALOMA_PARTIDA : VUELO.xPaloma; }

  /**
   * El choque, que se sienta: la paloma suelta plumas en todas direcciones,
   * su mitad de pantalla se sacude y destella en rojo. Las plumas se reciclan:
   * nada se crea en mitad del vuelo.
   */
  _soltarPlumas(k, v) {
    this.sacudida[k] = 1;
    this.destello[k] = 1;
    for (const p of this.plumas[k]) {
      const a = Math.random() * Math.PI * 2;
      const vel = 140 + Math.random() * 260;
      p.x = this._xVista;
      p.y = v.y;
      p.vx = Math.cos(a) * vel - 60;       // hacia atrás: el mundo sigue avanzando
      p.vy = Math.sin(a) * vel - 120;
      p.giro = Math.random() * Math.PI * 2;
      p.vg = (Math.random() - 0.5) * 12;
      p.tam = 7 + Math.random() * 7;
      p.vida = p.max = 0.8 + Math.random() * 0.6;
    }
  }

  _animarChoques(dt) {
    for (let k = 0; k < 2; k++) {
      this.sacudida[k] = Math.max(0, this.sacudida[k] - dt / 0.45);
      this.destello[k] = Math.max(0, this.destello[k] - dt / 0.35);
      for (const p of this.plumas[k]) {
        if (p.vida <= 0) continue;
        p.vida -= dt;
        p.vy += 520 * dt;
        p.vx *= 1 - 1.6 * dt;              // el aire las frena
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.giro += p.vg * dt;
      }
    }
  }

  _terminar() {
    this.resultados = this.vuelos.map((v) => v.resultado());
    this.ganador = ganadorVuelo(this.resultados);
    this.motor.expedicion.puntajes.regreso = { resultados: this.resultados, ganador: this.ganador };
    this.fase = 'tablero';
    this.tFase = 0;
    this.audio && this.audio.musica('revelacion');
    this.audio && this.audio.sfx('revelar');
  }

  // ------------------------------------------------------------- dibujar
  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;

    if (this.fase === 'guia') {
      c.fillStyle = PALETA.fondoHondo;
      c.fillRect(0, 0, W, H);
      this._cielo(c, W, H, 0.35);
      this.guia.dibujar(c, W, H, this._nombreBoton(0));
      this._dibujarUnion(c, W, H);
      return;
    }

    if (this.fase === 'tablero') { this._dibujarTablero(c, W, H); grano(c, W, H); return; }
    if (this.fase === 'revelacion') { this._dibujarRevelacion(c, W, H); grano(c, W, H); return; }

    // Cuenta y vuelo: cada jugador en su mitad, con su propio paso.
    const n = this.vuelos.length;
    this.vuelos.forEach((v, k) => {
      this.motor.enRanura(k, n, (cx, r) => this._vista(cx, r, v, k));
    });
    this._reloj(c, W, H);
    if (this.fase === 'cuenta') this._dibujarCuenta(c, W, H);
    // El grano ya va pintado dentro del cielo (_cieloQuieto): una pasada
    // menos a pantalla completa por fotograma.
    if (!CON_LIENZOS()) grano(c, W, H, 0.025);
  }

  /** La mitad de un jugador, en coordenadas locales: cielo, mundo, paloma, marcador. */
  _vista(c, r, v, k) {
    const W = r.ancho, H = r.alto;
    const esc = H / VUELO.alto;
    const xVista = this._xVista;
    // Resolución a la que se pintan las piezas guardadas (px reales por px lógico).
    this._res = esc * this._dpr;

    c.save();
    if (this.sacudida[k] > 0) {
      const s = this.sacudida[k] * 9;
      c.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }
    this._cielo(c, W, H, 1, v.distancia);
    c.save();
    c.scale(esc, esc);
    this._mundo(c, W / esc, v, xVista);
    this._paloma(c, v, k, xVista);
    this._dibujarPlumas(c, k);
    c.restore();
    c.restore();

    if (this.destello[k] > 0) {
      c.fillStyle = 'rgba(224,97,74,' + (this.destello[k] * 0.32).toFixed(3) + ')';
      c.fillRect(0, 0, W, H);
    }
    this._hud(c, W, H, v, k);
  }

  /**
   * Cielo de atardecer con la paleta del juego (fuego sobre rojo oscuro), y
   * dos capas lejanas que se mueven más lento que el mundo: al fondo el
   * desierto de El Camino (pirámides y un volcán), más cerca el pueblo. Es el
   * mismo territorio, visto de regreso.
   */
  /**
   * El degradado del cielo y el sol no se mueven: se pintan una vez por
   * tamaño en un lienzo aparte y cada fotograma solo se copia (antes, dos
   * degradados a pantalla completa por fotograma y por mitad).
   */
  _cieloQuieto(c, W, H) {
    const pintar = (cx) => {
      const g = cx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2a0b08');
      g.addColorStop(0.5, '#7a2a14');
      g.addColorStop(0.85, '#d9793e');
      g.addColorStop(1, '#f0b060');
      cx.fillStyle = g;
      cx.fillRect(0, 0, W, H);
      const esc = H / VUELO.alto;
      const base = H - VUELO.suelo * esc;
      // sol bajo, grande y pálido
      const sol = cx.createRadialGradient(W * 0.72, base - 90 * esc, 10 * esc, W * 0.72, base - 90 * esc, 150 * esc);
      sol.addColorStop(0, 'rgba(255,236,170,0.95)');
      sol.addColorStop(0.35, 'rgba(255,190,100,0.5)');
      sol.addColorStop(1, 'rgba(255,150,60,0)');
      cx.fillStyle = sol;
      cx.fillRect(0, 0, W, H);
    };
    if (!CON_LIENZOS()) { pintar(c); return; }
    const dpr = this._dpr;
    const clave = W + 'x' + H + '@' + dpr;
    this._cachesCielo = this._cachesCielo || new Map();
    let lienzo = this._cachesCielo.get(clave);
    if (!lienzo) {
      if (this._cachesCielo.size > 4) this._cachesCielo.clear();
      lienzo = document.createElement('canvas');
      lienzo.width = Math.max(1, Math.round(W * dpr));
      lienzo.height = Math.max(1, Math.round(H * dpr));
      const cx = lienzo.getContext('2d');
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pintar(cx);
      grano(cx, W, H, 0.025);
      this._cachesCielo.set(clave, lienzo);
    }
    c.drawImage(lienzo, 0, 0, W, H);
  }

  _cielo(c, W, H, alfa = 1, distancia = 0) {
    c.save();
    c.globalAlpha = alfa;
    this._cieloQuieto(c, W, H);

    const esc = H / VUELO.alto;
    const base = H - VUELO.suelo * esc;

    // Tres capas que se repiten, cada una a su velocidad. Cada una se pinta
    // UNA vez, solo en la franja que ocupa, y cada fotograma se copia
    // desplazada: antes eran decenas de trazos por fotograma y por mitad, y
    // copias a pantalla completa de capas que solo ocupan la parte de abajo.
    // Nubes oscuras, a un tercio de velocidad:
    const pNubes = (W / esc + 500) * esc;
    const offNubes = ((-distancia * 0.3 * esc) % pNubes + pNubes) % pNubes;
    this._capa(c, 'nubes', pNubes, 20 * esc, 320 * esc, offNubes, W, (cx, x0) => this._pintarNubes(cx, x0, pNubes / esc, esc));
    // Al fondo, pirámides y un volcán (desierto), muy lento:
    const periodo = 1100 * esc;
    const offLejos = ((-distancia * 0.15 * esc) % periodo + periodo) % periodo;
    this._capa(c, 'lejos', periodo, base - 240 * esc, 241 * esc, offLejos, W, (cx, x0) => this._pintarLejos(cx, x0, base, esc));
    // Más cerca, templos y palmeras (la primera zona de El Camino):
    const pasoC = 96 * esc * 6;
    const offCerca = ((-distancia * 0.45 * esc) % pasoC + pasoC) % pasoC;
    this._capa(c, 'cerca', pasoC, base - 132 * esc, 133 * esc, offCerca, W, (cx, x0) => this._pintarCerca(cx, x0, base, esc));
    c.restore();
  }

  /** Un periodo de nubes (en px lógicos, `periodoL`), empezando en x0 (px de pantalla). */
  _pintarNubes(c, x0, periodoL, esc) {
    c.fillStyle = 'rgba(70,22,12,0.4)';
    for (const n of this.nubes) {
      const x = x0 / esc + (n.x % periodoL) - 250;
      c.beginPath();
      c.ellipse(x * esc, n.y * esc, n.r * 1.6 * esc, n.r * 0.45 * esc, 0, 0, Math.PI * 2);
      c.ellipse((x + n.r) * esc, (n.y + 8) * esc, n.r * esc, n.r * 0.3 * esc, 0, 0, Math.PI * 2);
      c.fill();
    }
  }

  /** Píxeles reales por píxel lógico de pantalla (lo que usa el motor). */
  get _dpr() {
    return this.motor.dpr || (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  }

  /**
   * Una capa que se repite cada `periodo` px y ocupa la franja [y0, y0+alto].
   * Con lienzo aparte (en el navegador) se pinta una vez por tamaño y se
   * copia; sin él (pruebas de Node) se pinta directo.
   * @param {(cx, x0: number) => void} pintar dibuja un periodo empezando en x0
   */
  _capa(c, clave, periodo, y0, alto, off, W, pintar) {
    if (!CON_LIENZOS()) {
      for (let x0 = off - periodo; x0 < W + periodo; x0 += periodo) pintar(c, x0);
      return;
    }
    const dpr = this._dpr;
    const k = clave + ':' + Math.round(periodo) + 'x' + Math.round(alto) + '@' + Math.round(y0) + '/' + dpr;
    this._capas = this._capas || new Map();
    let lienzo = this._capas.get(k);
    if (!lienzo) {
      if (this._capas.size > 12) this._capas.clear();
      lienzo = document.createElement('canvas');
      lienzo.width = Math.max(1, Math.ceil(periodo * dpr));
      lienzo.height = Math.max(1, Math.ceil(alto * dpr));
      const cx = lienzo.getContext('2d');
      // Se pinta en coordenadas de pantalla; el lienzo solo guarda la franja.
      cx.setTransform(dpr, 0, 0, dpr, 0, -y0 * dpr);
      // Lo que asoma por los bordes del periodo, también: así empalma sin corte.
      for (const x0 of [-periodo, 0, periodo]) pintar(cx, x0);
      this._capas.set(k, lienzo);
    }
    for (let x0 = off - periodo; x0 < W; x0 += periodo) c.drawImage(lienzo, x0, y0, periodo, alto);
  }

  /** Un periodo de la capa del desierto: dos pirámides y un volcán. */
  _pintarLejos(c, x0, base, esc) {
    c.fillStyle = 'rgba(70,20,10,0.6)';
    const piramide = (x, ancho, alto) => {
      c.beginPath();
      c.moveTo(x - ancho / 2, base); c.lineTo(x, base - alto); c.lineTo(x + ancho / 2, base);
      c.closePath(); c.fill();
    };
    piramide(x0 + 120 * esc, 260 * esc, 150 * esc);
    piramide(x0 + 280 * esc, 180 * esc, 100 * esc);
    // volcán: cono truncado con un resplandor en el cráter
    const xv = x0 + 700 * esc, av = 230 * esc;
    c.beginPath();
    c.moveTo(xv - 230 * esc, base); c.lineTo(xv - 40 * esc, base - av);
    c.lineTo(xv + 40 * esc, base - av); c.lineTo(xv + 230 * esc, base);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,120,40,0.55)';
    c.fillRect(xv - 38 * esc, base - av - 4 * esc, 76 * esc, 7 * esc);
  }

  /** Un periodo de la capa cercana: templos de columnas, ruinas y una palmera. */
  _pintarCerca(c, x0, base, esc) {
    const paso = 96 * esc;
    c.fillStyle = 'rgba(38,10,6,0.72)';
    for (let k = 0; k < 6; k++) {
      const x = x0 + k * paso;
      if (k === 4) {
        // palmera: tronco y cuatro hojas
        c.fillRect(x + 40 * esc, base - 90 * esc, 6 * esc, 90 * esc);
        for (const a of [-2.6, -2.0, -1.1, -0.5]) {
          c.beginPath();
          c.ellipse(x + 43 * esc + Math.cos(a) * 22 * esc, base - 92 * esc + Math.sin(a) * 8 * esc,
            26 * esc, 6 * esc, a, 0, Math.PI * 2);
          c.fill();
        }
        continue;
      }
      const ancho = paso * 0.86;
      if (k % 2 === 0) {
        // ruina: una columna entera con su capitel y otra rota
        c.fillRect(x, base - 8 * esc, ancho, 8 * esc);
        c.fillRect(x + ancho * 0.2, base - 62 * esc, 10 * esc, 62 * esc);
        c.fillRect(x + ancho * 0.2 - 5 * esc, base - 68 * esc, 20 * esc, 7 * esc);
        c.fillRect(x + ancho * 0.65, base - 30 * esc, 10 * esc, 30 * esc);
      } else {
        c.fillRect(x - 4 * esc, base - 10 * esc, ancho + 8 * esc, 10 * esc);     // plataforma
        for (let n = 0; n < 4; n++) c.fillRect(x + n * (ancho / 3.3), base - 58 * esc, 9 * esc, 48 * esc);
        c.beginPath();
        c.moveTo(x - 6 * esc, base - 58 * esc); c.lineTo(x + ancho / 2, base - 80 * esc);
        c.lineTo(x + ancho + 6 * esc, base - 58 * esc);
        c.closePath(); c.fill();
      }
    }
  }

  /**
   * Columnas, aros, puestos y suelo, vistos por UN jugador. En coordenadas
   * lógicas (alto 720). `xVista` es dónde va su paloma en la pantalla.
   */
  _mundo(c, anchoL, v, xVista) {
    const sueloY = VUELO.alto - VUELO.suelo;
    // Coordenada del mundo que cae en el borde izquierdo de esta vista.
    const origen = v.x - xVista;

    {
      const m = VUELO.anchoColumna;
      const columnas = v.columnas.filter((col) => col.x > origen - m && col.x < origen + anchoL + m);
      const puestos = v.puestos.filter((p) => p.x > origen - 60 && p.x < origen + anchoL + 60);

      // puestos de control: un poste de piedra con bandera y farol
      for (const p of puestos) {
        const x = p.x - origen;
        c.fillStyle = '#2a140a';
        c.fillRect(x - 4, sueloY - 104, 8, 104);
        c.fillStyle = '#cdbb8a';
        c.fillRect(x - 3, sueloY - 104, 3, 104);
        c.fillStyle = p.pasado ? '#4ec9a5' : 'rgba(78,201,165,0.6)';
        c.beginPath();
        c.moveTo(x + 4, sueloY - 102);
        c.lineTo(x + 54, sueloY - 88);
        c.lineTo(x + 4, sueloY - 72);
        c.closePath();
        c.fill();
        c.strokeStyle = '#1e0402';
        c.lineWidth = 2;
        c.stroke();
        c.fillStyle = p.pasado ? '#fff3cf' : '#f0c977';
        c.beginPath();
        c.arc(x, sueloY - 110, 8, 0, Math.PI * 2);
        c.fill();
      }

      // La tubería madre, arriba: de ella bajan las columnas de arriba. Así
      // las columnas no cuelgan del cielo, son bajantes de una red de gas.
      this._tuberiaMadre(c, anchoL, origen);

      // Solo las columnas cercanas llevan su cartel: con todos a la vez, el
      // cielo se vuelve ilegible y las excusas dejan de leerse.
      const conTexto = columnas.filter((col) => col.x > v.x).slice(0, 2);
      for (const col of columnas) this._columna(c, col, origen, sueloY, conTexto.includes(col), v);
    }

    // suelo: una franja de arenisca y, debajo, roca; se desplaza con el mundo.
    // Se pinta un periodo entero una vez y cada fotograma se copia corrido.
    const off = ((-origen) % PERIODO_SUELO + PERIODO_SUELO) % PERIODO_SUELO;
    for (let x = off - PERIODO_SUELO; x < anchoL; x += PERIODO_SUELO) {
      this._hoja(c, 'suelo', x, sueloY, PERIODO_SUELO, VUELO.suelo, (cx) => this._pintarSuelo(cx, sueloY));
    }
  }

  /** Un periodo del suelo, con su esquina en (0, 0). `sueloY` alinea la textura como antes. */
  _pintarSuelo(c, sueloY) {
    const arena = patronMenu(c, 'arenisca', 0.5);
    const roca = patronMenu(c, 'rocaOscura', 0.6);
    c.save();
    c.translate(0, -sueloY);          // la textura queda alineada con el mundo, como antes
    c.fillStyle = roca || '#3a2418';
    c.fillRect(0, sueloY, PERIODO_SUELO, VUELO.suelo);
    c.fillStyle = arena || '#c9a46a';
    c.fillRect(0, sueloY, PERIODO_SUELO, 18);
    c.restore();
    c.fillStyle = 'rgba(20,6,3,0.35)';
    c.fillRect(0, 18, PERIODO_SUELO, VUELO.suelo - 18);
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(0, 18, PERIODO_SUELO, 3);
  }

  /**
   * Una pieza que no cambia (brida, aro, válvula, cartel), pintada una vez en
   * un lienzo aparte y después solo copiada. En coordenadas lógicas: se pinta
   * a la resolución real (`_res`) para que se vea nítida.
   * @param {(cx) => void} pintar dibuja la pieza con su esquina en (0, 0)
   */
  _hoja(c, clave, x, y, ancho, alto, pintar) {
    const h = this._hojaLienzo(clave, ancho, alto, pintar);
    if (h) { c.drawImage(h, x, y, ancho, alto); return; }
    c.save(); c.translate(x, y); pintar(c); c.restore();
  }

  /** El lienzo guardado de una pieza (se pinta la primera vez). null sin navegador. */
  _hojaLienzo(clave, ancho, alto, pintar) {
    if (!CON_LIENZOS() || !this._res) return null;
    const f = this._res;
    const k = clave + '@' + f.toFixed(3);
    this._hojas = this._hojas || new Map();
    let h = this._hojas.get(k);
    if (!h) {
      if (this._hojas.size > 160) this._hojas.clear();
      h = document.createElement('canvas');
      h.width = Math.max(1, Math.ceil(ancho * f));
      h.height = Math.max(1, Math.ceil(alto * f));
      const cx = h.getContext('2d');
      cx.setTransform(f, 0, 0, f, 0, 0);
      pintar(cx);
      this._hojas.set(k, h);
    }
    return h;
  }

  /** Pinta un tubo amarillo con volumen: bordes oscuros y un brillo. Vertical u horizontal. */
  _tubo(c, x, y, w, h, horizontal = false) {
    if (w <= 0 || h <= 0) return;
    // El degradado es siempre el mismo: se pinta una vez en una tira de 64 px
    // y se estira al tamaño del tubo. Crear un degradado por tubo y por
    // fotograma (unos treinta) era lo que más pesaba de El Regreso.
    const tira = this._tira(horizontal);
    if (tira) { c.drawImage(tira, x, y, w, h); return; }
    c.fillStyle = this._degradadoTubo(c, horizontal ? 0 : x, horizontal ? y : 0, horizontal ? 0 : x + w, horizontal ? y + h : 0);
    c.fillRect(x, y, w, h);
  }

  _degradadoTubo(c, x0, y0, x1, y1) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#6a4a0a');
    g.addColorStop(0.18, '#d8ac2f');
    g.addColorStop(0.42, '#fff0a0');
    g.addColorStop(0.7, '#d8ac2f');
    g.addColorStop(1, '#5a3c08');
    return g;
  }

  /** La tira del degradado del tubo (vertical u horizontal). null sin navegador. */
  _tira(horizontal) {
    if (typeof document === 'undefined' || !document.createElement) return null;
    this._tiras = this._tiras || {};
    const k = horizontal ? 'h' : 'v';
    if (!this._tiras[k]) {
      const t = document.createElement('canvas');
      t.width = horizontal ? 1 : 64;
      t.height = horizontal ? 64 : 1;
      const cx = t.getContext('2d');
      if (!cx || !cx.createLinearGradient) return null;
      cx.fillStyle = this._degradadoTubo(cx, 0, 0, horizontal ? 0 : 64, horizontal ? 64 : 0);
      cx.fillRect(0, 0, t.width, t.height);
      this._tiras[k] = t;
    }
    return this._tiras[k];
  }

  /** Brida: el anillo donde se unen dos tramos, con sus pernos. Pieza guardada. */
  _brida(c, x, y, w, h, horizontal = false) {
    this._hoja(c, 'brida' + w + 'x' + h + (horizontal ? 'h' : 'v'), x, y, w, h,
      (cx) => this._bridaDirecta(cx, 0, 0, w, h, horizontal));
  }

  _bridaDirecta(c, x, y, w, h, horizontal) {
    this._tubo(c, x, y, w, h, horizontal);
    c.strokeStyle = 'rgba(60,40,6,0.9)';
    c.lineWidth = 2;
    c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    c.fillStyle = '#4a3206';
    const n = 4;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      if (horizontal) c.fillRect(x + w / 2 - 2, y + h * t - 2, 4, 4);
      else c.fillRect(x + w * t - 2, y + h / 2 - 2, 4, 4);
    }
  }

  /** La tubería madre que corre por arriba, con sus bridas y sus soportes. */
  _tuberiaMadre(c, anchoL, origen) {
    const y = VUELO.techo - 4, alto = 26;
    // soportes que la sujetan al techo del cuadro
    c.fillStyle = '#2a140a';
    const pasoSoporte = 180;
    const offS = ((-origen) % pasoSoporte + pasoSoporte) % pasoSoporte;
    for (let x = offS - pasoSoporte; x < anchoL + pasoSoporte; x += pasoSoporte) c.fillRect(x - 3, 0, 6, y);
    this._tubo(c, 0, y, anchoL, alto, true);
    const pasoBrida = 360;
    const offB = ((-origen - 90) % pasoBrida + pasoBrida) % pasoBrida;
    for (let x = offB - pasoBrida; x < anchoL + pasoBrida; x += pasoBrida) this._brida(c, x - 8, y - 4, 16, alto + 8, true);
  }

  /**
   * Una columna, como una red de gas de verdad:
   *  - arriba, un BAJANTE que sale de la tubería madre (unión en T) y termina
   *    en una brida con tapa;
   *  - abajo, un tubo que SALE DEL SUELO sobre una base de concreto, con su
   *    brida y una válvula de volante.
   * El paso entre las dos es el de ESTE jugador: se abre con lo que trajo de
   * El Camino. La excusa va en un cartel colgado del bajante.
   */
  _columna(c, col, origen, sueloY, conTexto, v) {
    const x = col.x - origen;
    const w = VUELO.anchoColumna;
    const arriba = col.y - v.hueco / 2;
    const abajo = col.y + v.hueco / 2;
    const yMadre = VUELO.techo + 22;              // donde acaba la tubería madre

    // --- el bajante (si el paso es tan ancho que no llega, no se dibuja)
    if (arriba > yMadre + 10) {
      this._brida(c, x - w / 2 - 10, yMadre - 20, w + 20, 26);         // la T sobre la madre
      this._tubo(c, x - w / 2, yMadre, w, arriba - yMadre - 22);
      this._brida(c, x - w / 2 - 8, arriba - 22, w + 16, 22);          // brida con tapa
    }

    // --- el tubo que sale del suelo
    if (abajo < sueloY - 10) {
      this._brida(c, x - w / 2 - 8, abajo, w + 16, 22);
      this._tubo(c, x - w / 2, abajo + 22, w, sueloY - abajo - 22);
      // base de concreto
      c.fillStyle = '#8a7a66';
      c.fillRect(x - w / 2 - 16, sueloY - 16, w + 32, 18);
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.fillRect(x - w / 2 - 16, sueloY - 3, w + 32, 5);
      // válvula de volante, a un costado, cerca de la brida
      const vy = abajo + 58;
      if (vy < sueloY - 30) {
        this._hoja(c, 'valvula', x + w / 2, vy - 17, 40, 34, (cx) => {
          const y0 = 17;
          cx.fillStyle = '#5a3c08';
          cx.fillRect(0, y0 - 4, 14, 8);
          cx.strokeStyle = '#b8261a';
          cx.lineWidth = 5;
          cx.beginPath();
          cx.arc(22, y0, 13, 0, Math.PI * 2);
          cx.stroke();
          cx.lineWidth = 3;
          cx.beginPath();
          cx.moveTo(9, y0); cx.lineTo(35, y0);
          cx.moveTo(22, y0 - 13); cx.lineTo(22, y0 + 13);
          cx.stroke();
        });
      }
    }

    // el aro dorado, en el centro del paso
    if (col.aro && !col.aroTomado) {
      const r = v.radioAro;
      const p = 1 + Math.sin(this.t * 3 + col.x) * 0.04;
      // El aro se pinta una vez (por radio) y late escalando la copia.
      const mx = r * 0.45 + 12, my = r + 12;
      const pintarAro = (cx) => {
        cx.translate(mx, my);
        cx.strokeStyle = ORO_ARO;
        cx.lineWidth = 9;
        cx.beginPath();
        cx.ellipse(0, 0, r * 0.45, r, 0, 0, Math.PI * 2);
        cx.stroke();
        cx.strokeStyle = 'rgba(240,201,119,0.35)';
        cx.lineWidth = 3;
        cx.beginPath();
        cx.ellipse(0, 0, r * 0.45 + 9, r + 9, 0, 0, Math.PI * 2);
        cx.stroke();
      };
      const lienzo = this._hojaLienzo('aro' + Math.round(r), mx * 2, my * 2, pintarAro);
      if (lienzo) c.drawImage(lienzo, x - mx * p, col.y - my * p, mx * 2 * p, my * 2 * p);
      else {
        c.save(); c.translate(x - mx * p, col.y - my * p); c.scale(p, p); pintarAro(c); c.restore();
      }
    }

    // el cartel con la excusa, colgado de la columna de arriba
    if (!conTexto) return;
    const texto = '«' + col.texto + '»';
    this._anchos = this._anchos || new Map();
    let ancho = this._anchos.get(texto);
    if (ancho === undefined) {
      c.save();
      c.font = '19px ' + MENU.letra;
      ancho = c.measureText(texto).width + 30;
      c.restore();
      this._anchos.set(texto, ancho);
    }
    const y = Math.max(70, arriba - 52);
    // El cartel (caja de roca y texto) se pinta una vez por excusa.
    this._hoja(c, 'cartel:' + texto, x - ancho / 2, y - 19, ancho, 38, (cx) => {
      cajaMenu(cx, 0, 0, ancho, 38, { relleno: 'rgba(8,5,3,0.86)' });
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      textoMenu(cx, texto, ancho / 2, 20, 19, MENU.beige);
    });
  }

  /**
   * La paloma, sola: cuerpo, cabeza y un ala que aletea. Al chocar da vueltas
   * mientras cae, con estrellitas alrededor de la cabeza.
   */
  _paloma(c, v, k, x) {
    const parpadeo = v.invulnerable > 0 && Math.sin(this.t * 22) < 0;
    if (parpadeo) return;
    const j = this.participantes[k] % 2;

    c.save();
    c.translate(x, v.y);
    const cayendo = !v.volando;
    const tCaida = VUELO.reaparicion - v.caido;
    c.rotate(cayendo ? tCaida * 9 : v.giro * 0.6);

    const r = VUELO.radio;
    // cuerpo
    c.fillStyle = j === 0 ? '#9fb4c6' : '#c9b08c';
    c.beginPath();
    c.ellipse(0, 0, r * 1.25, r, 0, 0, Math.PI * 2);
    c.fill();
    // cabeza
    c.beginPath();
    c.arc(r * 0.95, -r * 0.45, r * 0.62, 0, Math.PI * 2);
    c.fill();
    // pico
    c.fillStyle = '#e8a33c';
    c.beginPath();
    c.moveTo(r * 1.5, -r * 0.5);
    c.lineTo(r * 2.15, -r * 0.3);
    c.lineTo(r * 1.5, -r * 0.1);
    c.closePath();
    c.fill();
    // ojo: una equis mientras cae aturdida
    c.strokeStyle = c.fillStyle = '#10171f';
    if (cayendo) {
      const ox = r * 1.15, oy = -r * 0.6, d = r * 0.16;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(ox - d, oy - d); c.lineTo(ox + d, oy + d);
      c.moveTo(ox + d, oy - d); c.lineTo(ox - d, oy + d);
      c.stroke();
    } else {
      c.beginPath();
      c.arc(r * 1.15, -r * 0.6, r * 0.13, 0, Math.PI * 2);
      c.fill();
    }
    // ala: sube y baja con la velocidad vertical; al caer, aletea sin control
    const ala = v.volando ? limitar(-v.vy / 700, -0.9, 0.9) : Math.sin(tCaida * 30) * 0.9;
    c.save();
    c.rotate(ala);
    c.fillStyle = j === 0 ? '#7e93a8' : '#a98f6c';
    c.beginPath();
    c.ellipse(-r * 0.25, r * 0.1, r * 0.95, r * 0.5, -0.25, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.restore();

    // estrellitas girando sobre la cabeza mientras está aturdida
    if (cayendo) {
      c.save();
      c.fillStyle = ORO_ARO;
      for (let i = 0; i < 3; i++) {
        const a = tCaida * 7 + (i * Math.PI * 2) / 3;
        this._estrella(c, x + Math.cos(a) * r * 1.4, v.y - r * 1.5 + Math.sin(a) * r * 0.45, 6);
      }
      c.restore();
    }
  }

  _estrella(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
  }

  /** Las plumas del choque, en coordenadas lógicas de la vista. */
  _dibujarPlumas(c, k) {
    const j = this.participantes[k] % 2;
    for (const p of this.plumas[k]) {
      if (p.vida <= 0) continue;
      c.save();
      c.globalAlpha = limitar(p.vida / p.max * 1.5, 0, 1);
      c.translate(p.x, p.y);
      c.rotate(p.giro);
      c.fillStyle = j === 0 ? '#c9d6e2' : '#e3cfae';
      c.beginPath();
      c.ellipse(0, 0, p.tam, p.tam * 0.38, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(60,70,80,0.5)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-p.tam, 0); c.lineTo(p.tam, 0);
      c.stroke();
      c.restore();
    }
  }

  _dibujarCuenta(c, W, H) {
    cuentaMenu(c, W, H, this.tFase);
  }

  // ----------------------------------------------------------------- HUD
  /** El marcador de UN jugador, dentro de su mitad (coordenadas locales). */
  _hud(c, W, H, v, k) {
    const uno = this.vuelos.length < 2;
    const i = this.participantes[k];
    const col = COLOR_J[i % 2];
    // La mitad derecha lleva su marcador a la derecha: en el centro va el reloj.
    const derecha = !uno && k === 1;
    const s = limitar(Math.min(W / 700, H / 820), 0.75, 1.3);
    const m = Math.round(16 * s);
    const wC = Math.round(230 * s), hC = Math.round((v.extraHueco > 0 ? 176 : 150) * s);
    const xC = derecha ? W - m - wC : m, yC = Math.round(62 * s);   // debajo de la tubería madre
    cajaMenu(c, xC, yC, wC, hC, { relleno: 'rgba(8,5,3,0.8)' });
    const x = xC + 16 * s;
    c.textAlign = 'left';
    c.textBaseline = 'top';

    c.font = Math.round(14 * s) + 'px ' + FUENTE.instrumento;
    c.fillStyle = col;
    const conNombre = !!(this.motor.expedicion.nombres && this.motor.expedicion.nombres[i]);
    c.fillText(uno && !conNombre ? 'TU VUELO' : nombreDe(this.motor, i), x, yC + 12 * s);

    tituloMenu(c, String(v.entregas), x, yC + 58 * s, Math.round(56 * s));
    c.textBaseline = 'top';
    c.font = Math.round(18 * s) + 'px ' + MENU.letra;
    const wNum = c.measureText(String(v.entregas)).width * 1.6;
    textoMenu(c, 'aros', x + Math.max(40 * s, wNum) + 8 * s, yC + 50 * s, Math.round(18 * s), MENU.beige);

    textoMenu(c, v.puntos + ' puntos', x, yC + 92 * s, Math.round(19 * s), '#f0c977');
    textoMenu(c, '✓ ' + v.seguimientos + ' verificados', x, yC + 118 * s, Math.round(19 * s), '#7fe0c0');

    // Lo que trajo de El Camino se nota: se le dice, sin nombrar el oficio.
    if (v.extraHueco > 0) {
      c.font = 'bold ' + Math.round(15 * s) + 'px ' + FUENTE.interfaz;
      c.fillStyle = '#9fd0ff';
      c.fillText('Lo que encontraste vale x' + v.multiplicador.toLocaleString('es-CO'), x, yC + 148 * s);
    }

    // avisos del jugador, grandes y con contorno
    let y = yC + hC + 16 * s;
    const tam = Math.round(22 * s);
    c.font = 'bold ' + tam + 'px ' + MENU.letra;
    c.textAlign = derecha ? 'right' : 'left';
    const xa = derecha ? W - m : m;
    for (const a of this.avisos[k]) {
      c.globalAlpha = limitar(a.vida / 0.5, 0, 1);
      c.lineJoin = 'round';
      c.lineWidth = 5;
      c.strokeStyle = 'rgba(12,4,2,0.9)';
      c.strokeText(a.texto, xa, y);
      c.fillStyle = a.color;
      c.fillText(a.texto, xa, y);
      c.globalAlpha = 1;
      y += tam * 1.35;
    }

    if (this.fase === 'vuelo' && this.t < 6) {
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      textoMenu(c, 'Pulsa ' + this._nombreBoton(i) + ' para aletear', W / 2, H - 26, Math.round(22 * s), MENU.beige);
    }
  }

  /** Tiempo que queda: uno solo para los dos, arriba en el centro de la pantalla. */
  _reloj(c, W) {
    const v = this.vuelos[0];
    if (!v) return;
    const quedan = Math.max(0, Math.ceil(VUELO.duracion - v.t));
    const ancho = Math.min(300, W * 0.24);
    const y = 50;                                       // debajo de la tubería madre
    cajaMenu(c, W / 2 - ancho / 2 - 18, y, ancho + 36, 72, { relleno: 'rgba(8,5,3,0.85)' });
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = 'bold 30px ' + MENU.letra;
    c.fillStyle = 'rgba(0,0,0,0.85)';
    c.fillText(quedan + ' s', W / 2 + 2, y + 10);
    c.fillStyle = quedan <= 10 ? '#ff9a6a' : MENU.beige;
    c.fillText(quedan + ' s', W / 2, y + 8);
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.fillRect(W / 2 - ancho / 2, y + 50, ancho, 8);
    c.fillStyle = quedan <= 10 ? '#ff6a3a' : '#f6a92c';
    c.fillRect(W / 2 - ancho / 2, y + 50, ancho * (1 - v.t / VUELO.duracion), 8);
  }

  _dibujarUnion(c, W, H) {
    dibujarUnion(c, W, H, this.motor, this.teclado2.unido, this.aviso2, this.avisoLado);
  }

  // ------------------------------------------------------------- tablero
  /** Lo que llegó de vuelta, un bloque por jugador, con el estilo de los menús. */
  _dibujarTablero(c, W, H) {
    fondoMenu(c, W, H);
    const cx = W / 2;
    const cols = this.resultados.length;
    const s = limitar(Math.min(H / 700, W / (cols > 1 ? 1150 : 700)), 0.8, 1.6);
    const ancho = Math.min(cols > 1 ? 1100 * s : 620 * s, W - 40);
    const sep = 24 * s;
    const anchoCol = (ancho - sep * (cols - 1)) / cols;

    let y = Math.max(20, H * 0.07);
    c.textAlign = 'center';
    tituloMenu(c, 'Tu regreso', cx, y + 28 * s, Math.round(52 * s));
    y += 76 * s;

    const alto = 360 * s;
    this.resultados.forEach((R, k) => {
      const col = COLOR_J[this.participantes[k] % 2];
      const x0 = cx - ancho / 2 + k * (anchoCol + sep);
      const x = x0 + anchoCol / 2;
      cajaMenu(c, x0, y, anchoCol, alto, { relleno: 'rgba(8,5,3,0.84)' });
      let yy = y + 20 * s;

      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.font = Math.round(15 * s) + 'px ' + FUENTE.instrumento;
      c.fillStyle = col;
      const nom = this.motor.expedicion.nombres && this.motor.expedicion.nombres[this.participantes[k]];
      c.fillText((cols > 1 || nom ? nombreDe(this.motor, this.participantes[k]) : 'TU VUELO').split('').join(' '), x, yy);
      yy += 26 * s;

      const crece = suave(Math.min(1, this.tFase / 0.8));
      c.save();
      c.translate(x, yy + 44 * s);
      c.scale(0.4 + crece * 0.6, 0.4 + crece * 0.6);
      tituloMenu(c, String(R.entregas), 0, 0, Math.round(84 * s));
      c.restore();
      yy += 92 * s;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      textoMenu(c, 'aros · ' + R.puntos + ' puntos', x, yy, Math.round(21 * s), '#f0c977');
      yy += 40 * s;

      const escapados = Math.max(0, R.aros - R.entregas);
      const lineas = [
        ['✓ ' + R.seguimientos + (R.seguimientos === 1 ? ' vez volviste a verificar' : ' veces volviste a verificar'), '#7fe0c0'],
        [R.choques ? 'Te frenaron ' + R.choques + (R.choques === 1 ? ' vez' : ' veces') : 'No te frenó ninguna tubería', R.choques ? '#ffab94' : '#d6c8a2'],
        [escapados ? escapados + (escapados === 1 ? ' aro se te escapó' : ' aros se te escaparon') : 'No se te escapó ningún aro', '#d6c8a2'],
        [R.multiplicador > 1
          ? 'Lo que descubriste en El Camino te abrió el paso e hizo valer cada aro x' + R.multiplicador.toLocaleString('es-CO')
          : 'Sin descubrimientos de El Camino, el paso fue estrecho y cada aro valió lo normal', R.multiplicador > 1 ? '#9fd0ff' : '#d6c8a2'],
      ];
      c.font = Math.round(18 * s) + 'px ' + FUENTE.interfaz;
      for (const [texto, color] of lineas) {
        c.fillStyle = color;
        partirLineas(c, texto, anchoCol - 36 * s).forEach((l) => { c.fillText(l, x, yy); yy += 24 * s; });
        yy += 6 * s;
      }
    });

    if (this.resultados.length > 1 && this.tFase > 1.2) {
      const texto = this.ganador < 0 ? 'Empate' : textoGana(this.motor, this.participantes[this.ganador]);
      c.textAlign = 'center';
      tituloMenu(c, texto, cx, y + alto + 44 * s, Math.round(44 * s));
    }

    if (this.tFase > BLOQUEO_TABLERO) {
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      textoMenu(c, 'Pulsa ' + this._nombreBoton(this.participantes[0]) + ' para ver qué acabas de hacer',
        cx, H - 22, Math.round(20 * s), Math.sin(this.t * 4) > -0.45 ? '#f0c977' : 'rgba(205,187,138,0.5)');
    }
  }

  // ---------------------------------------------------------- revelación
  _dibujarRevelacion(c, W, H) {
    const colores = [ROJO_HALLAZGO, '#9fd0ff', ORO_ARO, '#7fe0c0', '#ffab94'];
    dibujarRevelacion(c, W, H, {
      titulo: 'Así terminamos',
      filas: ASI_TERMINAMOS.map((f, n) => ({ ...f, color: colores[n] })),
      cierre: 'Auditar no es poner trabas: es dejar el camino más fácil.',
      pie: this.tFase > 2 ? 'Pulsa ' + this._nombreBoton(this.participantes[0] || 0) + ' para continuar' : null,
      t: this.tFase,
      reloj: this.t,
    });
  }
}

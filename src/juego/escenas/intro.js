/**
 * intro.js — Portada: el menú principal.
 *
 * Estilo de menú de consola de los noventa (render.js: tituloMenu, cajaMenu,
 * aroMenu): título de fuego, fondo rojo oscuro, opciones en una caja con doble
 * borde. A la derecha queda sitio libre para el personaje cuando exista.
 *
 * Nunca se menciona auditoría. Se plantea un problema que cualquiera entiende:
 * el territorio es más grande que lo que tienes para recorrerlo.
 *
 * Con el Joy-Con basta el gatillo: la opción que ya viene elegida es
 * «Empezar el recorrido», así que el visitante hace lo mismo que antes.
 */

import { Escena } from '../../core/engine.js';
import { partirLineas } from '../../core/briefing.js';
import {
  PALETA, FUENTE, MENU, etiqueta, grano, vineta, suave,
  fondoMenu, tituloMenu, textoMenu, aroMenu,
} from '../../core/render.js';
import { generarCosta, generarIsla, REGIONES } from '../../datos/territorio.js';
import { Menu } from '../../ui/menu.js';
import { TablaPuntajes } from '../../datos/puntajes.js';

const CONTROLES = [
  'Joy-Con: muévelo para apuntar · gatillo (ZR o ZL) para la acción · + o − para pausar',
  'Teclado, Jugador 1: WASD para moverte · W o Espacio para la acción',
  'Teclado, Jugador 2: flechas para moverte · ↑ para la acción (se une con ↑)',
  'Enter para continuar · Esc para pausar · Ratón: apunta y haz clic',
];

/** La protagonista (imagen del usuario, 2026-09-25; original en assets/originales/). */
const IMAGEN_EXPLORADORA = '/assets/menu-exploradora.png';
/**
 * Subtítulo pedido por el usuario el 2026-09-25. OJO: nombra el oficio antes
 * de jugar, a contracorriente de la regla de oro (docs/NARRATIVA.md); se le
 * advirtió y lo decidió así. Si se revierte, basta cambiar esta línea.
 * Va en dos líneas y la palabra «Auditoría» grande, en arenisca dorada tallada
 * (distinta del fuego del título): el usuario pidió que se vea, que se
 * entienda de qué es y que tenga otra textura (2026-09-25 y 26).
 */
const SUBTITULO = ['Una expedición por las tierras de', 'AUDITORÍA'];

export class EscenaIntro extends Escena {
  constructor(motor) {
    super(motor);
    this.costa = generarCosta();
    this.isla = generarIsla();
    this.menu = new Menu(motor, { alVolver: () => this._principal() });
    // La exploradora, a la derecha del menú, como la protagonista en los
    // menús de consola. Si no carga, la portada queda igual sin ella.
    this.exploradora = null;
    this.cargaImagen = Promise.resolve();
    if (typeof Image !== 'undefined') {
      this.cargaImagen = new Promise((ok) => {
        const im = new Image();
        im.onload = () => { this.exploradora = im; ok(); };
        im.onerror = () => ok();
        im.src = IMAGEN_EXPLORADORA;
      });
    }
  }

  async entrar() {
    this.t = 0;
    // Cada visitante empieza de cero: la ruta se dibuja según esto.
    this.motor.expedicion.etapasCompletadas = [];
    this.motor.expedicion.puntajes = {};
    this.motor.expedicion.jugadores = 0;
    this.motor.expedicion.nombres = [];
    this._principal();
    this.menu.activar();
    this.motor.audio && this.motor.audio.musica('intro');
  }

  salir() { this.menu.desactivar(); }

  _ir(nombre, datos = null) {
    this.motor.audio && this.motor.audio.sfx('avanzar');
    this.motor.ir(nombre, datos);
  }

  /** Antes de cualquier etapa: cuántos juegan y sus nombres (escenas/jugadores.js). */
  _elegirJugadores(destino) {
    if (this.motor.escenas.has('jugadores')) this._ir('jugadores', { destino });
    else this._ir(destino);
  }

  _principal() {
    this.menu.mostrar([
      { texto: 'Empezar el recorrido', accion: () => this._elegirJugadores('ruta') },
      { texto: 'Ir a una etapa', accion: () => this._etapas() },
      { texto: 'Mejores puntajes', accion: () => this._mejores() },
      { texto: 'Controles', accion: () => this._controles() },
    ], [], 'Menú principal');
  }

  /** Los diez mejores del stand (datos/puntajes.js), como líneas del recuadro. */
  _mejores() {
    const filas = new TablaPuntajes().mejores(10);
    const lineas = filas.length
      ? filas.map((f, i) => (i + 1) + '.  ' + f.nombre + '  ·  ' + f.puntos.toLocaleString('es-CO') + ' puntos')
      : ['Todavía nadie ha terminado la expedición. ¡Sé el primero!'];
    this.menu.mostrar([{ texto: '‹ Volver', accion: () => this._principal() }], lineas, 'Mejores puntajes');
  }

  _etapas() {
    this.menu.mostrar([
      { texto: '1 · El Mapa', accion: () => this._elegirJugadores('mapa') },
      { texto: '2 · El Camino', accion: () => this._elegirJugadores('camino') },
      { texto: '3 · El Regreso', accion: () => this._elegirJugadores('regreso') },
      { texto: '‹ Volver', accion: () => this._principal() },
    ], [], 'Elige una etapa');
  }

  _controles() {
    this.menu.mostrar([
      { texto: 'Calibrar mandos', accion: () => this._ir('calibrar') },
      { texto: '‹ Volver', accion: () => this._principal() },
    ], CONTROLES, 'Cómo se juega');
  }

  actualizar(dt) {
    this.t += dt;
    // Se deja ver la portada un momento antes de aceptar la primera pulsación.
    if (this.t > 1.2) this.menu.actualizar(dt);
  }

  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;
    fondoMenu(c, W, H);

    // El territorio respira al fondo, apenas visible: es el mismo mundo.
    c.save();
    c.globalAlpha = 0.10 + Math.sin(this.t * 0.5) * 0.03;
    const trazar = (pts, ox = 0, oy = 0) => {
      c.beginPath();
      pts.forEach((p, i) => {
        const x = (p.x + ox) * W, y = (p.y + oy) * H;
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      });
      c.closePath();
      c.fillStyle = '#000';
      c.fill();
      c.strokeStyle = '#e8c872';
      c.lineWidth = 1.5;
      c.stroke();
    };
    trazar(this.costa);
    const isla = REGIONES.find((r) => r.id === 'isla');
    trazar(this.isla, isla.x, isla.y);
    c.restore();

    // El aro, a la izquierda, como en los menús de consola.
    const r = Math.min(W, H) * 0.2;
    aroMenu(c, r * 0.75, H * 0.62, r, this.t);

    vineta(c, W, H, 0.6);

    // La protagonista a la derecha, si hay sitio; el título y el menú, en la
    // columna que queda a su izquierda.
    const conPersonaje = !!this.exploradora && W >= 900;
    if (conPersonaje) this._dibujarExploradora(c, W, H);
    const cx = conPersonaje ? W * 0.42 : W / 2;
    const anchoCol = conPersonaje ? W * 0.62 : W * 0.9;

    const aT = suave(Math.min(1, this.t / 1.0));
    c.globalAlpha = aT;
    c.textAlign = 'center';

    // ---------- título, medido para que quepa en cualquier pantalla
    const tam = Math.min(124, W * 0.08, H * 0.13);
    const yTitulo = Math.max(tam * 0.75, H * 0.12);
    tituloMenu(c, 'TERRA', cx, yTitulo, tam);
    tituloMenu(c, 'INCÓGNITA', cx, yTitulo + tam * 0.95, tam * 0.8);

    let y = yTitulo + tam * 1.5;
    // Subtítulo: una línea de presentación y, debajo, AUDITORÍA con la misma
    // letra de fuego del título, para que se lea desde lejos.
    const tamSub = Math.round(Math.min(40, Math.max(22, tam * 0.32)));
    c.textBaseline = 'top';
    c.font = 'bold ' + tamSub + 'px ' + MENU.letra;
    c.lineJoin = 'round';
    c.lineWidth = Math.max(3, tamSub * 0.16);
    c.strokeStyle = 'rgba(20,4,2,0.95)';
    c.strokeText(SUBTITULO[0], cx, y);
    c.fillStyle = '#fff3cf';
    c.fillText(SUBTITULO[0], cx, y);
    y += tamSub * 1.2;
    const tamAud = Math.round(tam * 0.62);
    // Otra textura que la del título: arenisca dorada tallada, no fuego.
    tituloMenu(c, SUBTITULO[1], cx, y + tamAud * 0.55, tamAud, 'piedra');
    y += tamAud * 1.25;

    const tamMenu = Math.round(Math.min(32, Math.max(22, H * 0.034)));
    const tamPremisa = Math.round(Math.min(21, Math.max(16, H * 0.022)));
    c.font = 'italic ' + tamPremisa + 'px ' + FUENTE.narrativa;
    const premisa = partirLineas(c, 'Así marcaban los mapas antiguos las zonas que nadie había recorrido. ' +
      'No quería decir que no hubiera nada. Quería decir que nadie había ido a ver.', Math.min(760, anchoCol));
    // Si en pantallas bajas no cabe todo, la premisa cede su sitio al menú.
    const altoPremisa = premisa.length * tamPremisa * 1.45 + 20;
    if (y + altoPremisa + this.menu.medirAlto(tamMenu) < H - 50) {
      premisa.forEach((l) => {
        c.fillStyle = 'rgba(0,0,0,0.85)';
        c.fillText(l, cx + 1.5, y + 1.5);
        c.fillStyle = '#d6c8a2';
        c.fillText(l, cx, y);
        y += tamPremisa * 1.45;
      });
      y += 20;
    }
    c.globalAlpha = 1;

    // ---------- el menú
    if (this.t > 0.6) {
      c.globalAlpha = suave(Math.min(1, (this.t - 0.6) / 0.6));
      const ancho = this.menu.info.length ? Math.min(1000, anchoCol) : Math.min(520, anchoCol);
      this.menu.dibujar(c, cx, y, ancho, tamMenu);
      c.globalAlpha = 1;
    }

    // ---------- estado del mando, abajo y centrado
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    const jc = this.motor.jc;
    etiqueta(c, jc.estado.conectado
      ? (jc.esIzquierdo ? 'Joy-Con L' : 'Joy-Con R') + ' conectado · gatillo para elegir'
      : 'Sin mando · teclado o ratón', cx, H - 22, MENU.beigeBorde, 14);

    grano(c, W, H);
  }

  /**
   * La exploradora de pie a la derecha, sobre un pedestal de piedra, con un
   * resplandor de fuego detrás y una respiración muy leve: está viva, no es
   * una lámina pegada.
   */
  _dibujarExploradora(c, W, H) {
    const im = this.exploradora;
    const entra = suave(Math.min(1, this.t / 1.4));
    const alto = H * 0.84;
    const ancho = alto * im.width / im.height;
    const cxP = Math.min(W * 0.8, W - ancho / 2 - 20);
    const base = H * 0.95;

    c.save();
    c.globalAlpha = entra;
    // resplandor de fuego detrás
    const g = c.createRadialGradient(cxP, base - alto * 0.5, alto * 0.05, cxP, base - alto * 0.5, alto * 0.62);
    g.addColorStop(0, 'rgba(246,169,44,0.35)');
    g.addColorStop(0.55, 'rgba(194,65,26,0.18)');
    g.addColorStop(1, 'rgba(194,65,26,0)');
    c.fillStyle = g;
    c.fillRect(cxP - alto, base - alto * 1.2, alto * 2, alto * 1.3);
    // pedestal
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.beginPath();
    c.ellipse(cxP, base, ancho * 0.55, alto * 0.035, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(240,201,119,0.45)';
    c.lineWidth = 2;
    c.stroke();
    // ella: entra subiendo un poco y respira
    const resp = 1 + Math.sin(this.t * 1.8) * 0.006;
    const sube = (1 - entra) * 40;
    c.translate(cxP, base + sube);
    c.scale(1, resp);
    c.drawImage(im, -ancho / 2, -alto, ancho, alto);
    c.restore();
  }
}

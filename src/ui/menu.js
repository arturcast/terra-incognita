/**
 * menu.js — Un menú de opciones, dibujado en el lienzo con el estilo de
 * consola (render.js: cajaMenu, textoMenu). Lo usan la pantalla de inicio y
 * la pausa.
 *
 * Se maneja igual con todo:
 *   teclado — W/S o ↑/↓ para moverse, Enter o Espacio para elegir, Esc para volver;
 *   ratón   — pasar por encima elige, clic confirma;
 *   Joy-Con — stick, flechas (izquierdo) o X/B (derecho) para moverse, gatillo
 *             o A para elegir, + / − para volver.
 *
 * Mientras está activo, las teclas que usa no llegan a la escena de abajo:
 * así, al volver de la pausa, la carrera no arranca analizando porque se pulsó
 * Espacio para elegir «Continuar».
 */

import { Acciones } from '../core/input.js';
import { BOTON } from '../core/joycon.js';
import { MENU, cajaMenu, textoMenu } from '../core/render.js';

const ARRIBA = new Set(['ArrowUp', 'w', 'W']);
const ABAJO = new Set(['ArrowDown', 's', 'S']);
const ELEGIR = new Set(['Enter', ' ']);
/** Nadie elige con la pulsación que abrió el menú. */
const GRACIA = 0.25;
/** Segundos entre dos pasos seguidos manteniendo el stick. */
const REPETICION = 0.22;

export class Menu {
  /**
   * @param {Motor} motor
   * @param {object} [opciones]
   * @param {() => void} [opciones.alVolver] qué hace Esc / + / −. Si falta, nada.
   */
  constructor(motor, { alVolver = null } = {}) {
    this.motor = motor;
    this.acciones = motor.jugadores.map((j) => new Acciones(j));
    this.alVolver = alVolver;
    this.items = [];
    this.info = [];
    this.indice = 0;
    this.t = 0;
    this.activo = false;
    this._rects = [];
    this._pendiente = [];      // lo que llegó por teclado o ratón, para el próximo fotograma
    this._espera = 0;

    this._onTecla = (e) => {
      if (!this.activo) return;
      const k = e.key;
      if (ARRIBA.has(k)) this._pendiente.push('arriba');
      else if (ABAJO.has(k)) this._pendiente.push('abajo');
      else if (ELEGIR.has(k)) { if (!e.repeat) this._pendiente.push('elegir'); }
      else if (k === 'Escape') this._pendiente.push('volver');
      else return;
      e.preventDefault();
      e.stopPropagation();       // la escena de abajo no se entera
    };
    this._onMover = (e) => {
      if (!this.activo) return;
      const i = this._itemEn(e);
      if (i >= 0 && this.items[i].accion) this.indice = i;
    };
    this._onClic = (e) => {
      if (!this.activo) return;
      e.stopPropagation();
      const i = this._itemEn(e);
      if (i >= 0 && this.items[i].accion) { this.indice = i; this._pendiente.push('elegir'); }
    };
  }

  /**
   * @param {{texto: string|(() => string), accion?: () => void}[]} items
   *   Un item sin acción se dibuja pero no se puede elegir.
   * @param {string[]} [info] líneas de texto que van encima de las opciones.
   */
  mostrar(items, info = [], encabezado = '') {
    this.items = items;
    this.info = info;
    this.encabezado = encabezado;
    this.indice = Math.max(0, items.findIndex((it) => it.accion));
    this.t = 0;
    this._pendiente = [];
  }

  activar() {
    if (this.activo) return;
    this.activo = true;
    this.t = 0;
    this._pendiente = [];
    // En captura: llega antes que los oyentes de la escena y los puede frenar.
    window.addEventListener('keydown', this._onTecla, true);
    window.addEventListener('mousemove', this._onMover, true);
    window.addEventListener('mousedown', this._onClic, true);
  }

  desactivar() {
    if (!this.activo) return;
    this.activo = false;
    window.removeEventListener('keydown', this._onTecla, true);
    window.removeEventListener('mousemove', this._onMover, true);
    window.removeEventListener('mousedown', this._onClic, true);
  }

  _itemEn(e) {
    const r = this.motor.canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    return this._rects.findIndex((q) => q && x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
  }

  _mover(paso) {
    const n = this.items.length;
    for (let k = 1; k <= n; k++) {
      const i = (this.indice + paso * k + n * k) % n;
      if (this.items[i].accion) { this.indice = i; break; }
    }
    this.motor.audio && this.motor.audio.sfx('avanzar');
  }

  /** Lee el mando y lo que llegó por teclado o ratón. Una vez por fotograma. */
  actualizar(dt) {
    this.t += dt;
    this._espera = Math.max(0, this._espera - dt);
    const ordenes = this._pendiente;
    this._pendiente = [];

    for (const [i, a] of this.acciones.entries()) {
      const jc = this.motor.jugadores[i];
      if (!jc.estado.conectado) continue;
      if (a.confirmar() || (!jc.esIzquierdo && jc.reciénPulsado(BOTON.A))) ordenes.push('elegir');
      if (a.cancelar()) ordenes.push('volver');
      // Izquierdo: flechas. Derecho: X arriba, B abajo (sostenido en vertical).
      if (jc.esIzquierdo ? jc.reciénPulsado(BOTON.ARRIBA) : jc.reciénPulsado(BOTON.X)) ordenes.push('arriba');
      if (jc.esIzquierdo ? jc.reciénPulsado(BOTON.ABAJO) : jc.reciénPulsado(BOTON.B)) ordenes.push('abajo');
      const sy = jc.estado.stickY;
      if (Math.abs(sy) > 0.55 && this._espera <= 0) {
        ordenes.push(sy > 0 ? 'arriba' : 'abajo');
        this._espera = REPETICION;
      }
    }

    for (const o of ordenes) {
      if (o === 'arriba') this._mover(-1);
      else if (o === 'abajo') this._mover(1);
      else if (o === 'volver') { if (this.t > GRACIA && this.alVolver) this.alVolver(); return; }
      else if (o === 'elegir' && this.t > GRACIA) {
        const it = this.items[this.indice];
        if (it && it.accion) {
          this.motor.audio && this.motor.audio.sfx('elegir');
          it.accion();
          return;
        }
      }
    }
  }

  /**
   * Dibuja el menú centrado en (cx, y). Devuelve el alto usado.
   * @param {number} ancho de la caja
   */
  /** Alto que ocupará el menú con este tamaño de letra (para centrarlo antes de dibujar). */
  medirAlto(tamano = 26) {
    const L = this._medidas(tamano);
    return L.alto;
  }

  _medidas(tamano) {
    const pad = Math.round(tamano * 0.8);
    const altoEnc = this.encabezado ? Math.round(tamano * 1.5) : 0;
    const altoInfo = Math.round(tamano * 1.05);
    const altoBoton = Math.round(tamano * 1.85);
    const sep = Math.round(tamano * 0.4);
    const altoInfos = this.info.length ? this.info.length * altoInfo + pad * 0.6 : 0;
    const alto = pad * 2 + altoEnc + altoInfos + this.items.length * (altoBoton + sep) - sep;
    return { pad, altoEnc, altoInfo, altoBoton, sep, alto };
  }

  /**
   * Dibuja el menú centrado en (cx, y). Devuelve el alto usado.
   *
   * Un recuadro con su encabezado (qué menú es) y, dentro, cada opción como un
   * botón de piedra. El elegido se enciende en rojo fuego, con borde dorado y
   * flechas que laten: se ve desde lejos cuál está marcado.
   * @param {number} ancho de la caja
   */
  dibujar(c, cx, y, ancho, tamano = 26) {
    const L = this._medidas(tamano);
    const x = cx - ancho / 2;
    cajaMenu(c, x, y, ancho, L.alto, { relleno: 'rgba(8,5,3,0.8)' });

    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    let yy = y + L.pad;

    // Encabezado: qué es este menú, entre dos filetes dorados.
    if (this.encabezado) {
      const ym = yy + L.altoEnc * 0.4;
      c.font = 'bold ' + Math.round(tamano * 0.62) + 'px ' + MENU.letra;
      const texto = this.encabezado.toUpperCase().split('').join(' ');
      const w = c.measureText(texto).width;
      c.fillStyle = '#f0c977';
      c.fillText(texto, cx, ym);
      c.strokeStyle = 'rgba(240,201,119,0.55)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x + L.pad, ym); c.lineTo(cx - w / 2 - 14, ym);
      c.moveTo(cx + w / 2 + 14, ym); c.lineTo(x + ancho - L.pad, ym);
      c.stroke();
      yy += L.altoEnc;
    }

    for (const l of this.info) {
      textoMenu(c, l, cx, yy + L.altoInfo / 2, Math.round(tamano * 0.7), '#d6c8a2');
      yy += L.altoInfo;
    }
    if (this.info.length) yy += L.pad * 0.6;

    this._rects = [];
    const wBoton = ancho - L.pad * 2;
    this.items.forEach((it, i) => {
      const texto = typeof it.texto === 'function' ? it.texto() : it.texto;
      const elegido = i === this.indice && it.accion;
      const bx = x + L.pad, by = yy;
      if (elegido) {
        const pulso = 0.5 + 0.5 * Math.sin(this.t * 5);
        // halo de fuego detrás del botón elegido
        c.save();
        c.shadowColor = 'rgba(246,169,44,' + (0.45 + pulso * 0.35).toFixed(2) + ')';
        c.shadowBlur = 18;
        cajaMenu(c, bx, by, wBoton, L.altoBoton, { relleno: 'rgba(130,38,12,0.92)', textura: false });
        c.restore();
        c.strokeStyle = '#ffd98a';
        c.lineWidth = 2.5;
        c.strokeRect(bx + 3, by + 3, wBoton - 6, L.altoBoton - 6);
        // flechas a los lados, que se acercan y se alejan
        const d = 10 + pulso * 6;
        c.fillStyle = '#ffd98a';
        const ym = by + L.altoBoton / 2, t = tamano * 0.32;
        c.beginPath();
        c.moveTo(bx + d, ym - t); c.lineTo(bx + d + t * 1.3, ym); c.lineTo(bx + d, ym + t); c.closePath();
        c.moveTo(bx + wBoton - d, ym - t); c.lineTo(bx + wBoton - d - t * 1.3, ym); c.lineTo(bx + wBoton - d, ym + t); c.closePath();
        c.fill();
      } else {
        cajaMenu(c, bx, by, wBoton, L.altoBoton, { relleno: 'rgba(14,8,5,0.82)', brillo: it.accion ? 0.6 : 0.3 });
      }
      c.font = 'bold ' + tamano + 'px ' + MENU.letra;
      c.fillStyle = 'rgba(0,0,0,0.85)';
      c.fillText(texto, cx + 2, by + L.altoBoton / 2 + 2);
      c.fillStyle = it.accion ? (elegido ? '#fff3cf' : MENU.beige) : '#8c7f63';
      c.fillText(texto, cx, by + L.altoBoton / 2);
      this._rects[i] = { x: bx, y: by, w: wBoton, h: L.altoBoton };
      yy += L.altoBoton + L.sep;
    });
    c.restore();
    return L.alto;
  }
}

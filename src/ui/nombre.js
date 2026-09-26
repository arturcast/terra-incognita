/**
 * nombre.js — Escribir un nombre con letras de arcade. Lo usan la pantalla de
 * jugadores (al empezar) y el recuento (si se llegó sin nombre, p. ej.
 * saltando a una etapa con las teclas del operador).
 *
 * Controles:
 *   Joy-Con: stick o ↑/↓ (X/B en el derecho) cambian la letra; gatillo o →
 *            (A en el derecho) la ponen; ← (Y) borra.
 *   Teclado: se escribe directo; o ↑/↓ cambian la letra y → o Espacio la
 *            ponen; ← o Retroceso borran; Enter termina.
 * Elegir la letra ✓ también termina.
 */

import { BOTON } from '../core/joycon.js';
import { FUENTE, MENU, cajaMenu, tituloMenu, textoMenu } from '../core/render.js';
import { MAX_NOMBRE, limpiarNombre } from '../datos/puntajes.js';

export const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ ✓'.split('');
const REPETICION = 0.2;            // s entre dos pasos manteniendo el stick
const ORO = '#f0c977';

/** Teclas pulsadas -> órdenes simples. */
export function ordenesDeTeclas(teclas) {
  const o = [];
  for (const k of teclas) {
    // Las letras se escriben directo (también W, A, S y D); las flechas
    // manejan las letras de arcade.
    const l = k.length === 1 ? k.toUpperCase() : k;
    if (k === 'ArrowUp') o.push('arriba');
    else if (k === 'ArrowDown') o.push('abajo');
    else if (k === 'ArrowRight' || k === ' ') o.push('siguiente');
    else if (k === 'ArrowLeft' || k === 'Backspace') o.push('borrar');
    else if (k === 'Enter') o.push('listo');
    else if (/^[A-ZÑ]$/.test(l)) o.push('letra:' + l);
  }
  return o;
}

/**
 * Lo que piden los mandos de `quienes`, en órdenes simples.
 * @param {{espera: number}} estado para repetir con el stick sin disparar
 */
export function ordenesDeMandos(motor, acciones, quienes, estado, dt) {
  const o = [];
  estado.espera = Math.max(0, (estado.espera || 0) - dt);
  for (const i of quienes) {
    const jc = motor.jugadores[i];
    if (!jc || !jc.estado.conectado) continue;
    const a = acciones[i];
    if (a.confirmar() || jc.reciénPulsado(BOTON.DERECHA) || jc.reciénPulsado(BOTON.A)) o.push('siguiente');
    if (jc.reciénPulsado(BOTON.IZQUIERDA) || jc.reciénPulsado(BOTON.Y)) o.push('borrar');
    if (jc.reciénPulsado(BOTON.ARRIBA) || jc.reciénPulsado(BOTON.X)) o.push('arriba');
    if (jc.reciénPulsado(BOTON.ABAJO) || jc.reciénPulsado(BOTON.B)) o.push('abajo');
    const sy = jc.estado.stickY;
    if (Math.abs(sy) > 0.55 && estado.espera <= 0) { o.push(sy > 0 ? 'arriba' : 'abajo'); estado.espera = REPETICION; }
  }
  return o;
}

/** Un nombre a medio escribir. */
export class EditorNombre {
  constructor() {
    this.letras = [];
    this.letra = 0;              // índice en LETRAS de la que se está eligiendo
  }

  get texto() { return this.letras.join(''); }

  /**
   * Aplica una orden. Devuelve true cuando el nombre queda terminado; entonces
   * `letras` ya está limpio (mayúsculas, sin espacios de sobra).
   */
  aplicar(o, audio) {
    if (o === 'arriba') { this.letra = (this.letra - 1 + LETRAS.length) % LETRAS.length; audio && audio.sfx('tic'); }
    else if (o === 'abajo') { this.letra = (this.letra + 1) % LETRAS.length; audio && audio.sfx('tic'); }
    else if (o === 'borrar') { this.letras.pop(); audio && audio.sfx('quitar'); }
    else if (o === 'listo') return this._terminar();
    else if (o.startsWith('letra:')) return this._poner(o.slice(6), audio);
    else if (o === 'siguiente') {
      const l = LETRAS[this.letra];
      return l === '✓' ? this._terminar() : this._poner(l, audio);
    }
    return false;
  }

  _poner(letra, audio) {
    if (this.letras.length >= MAX_NOMBRE) return this._terminar();
    this.letras.push(letra);
    audio && audio.sfx('elegir');
    return this.letras.length >= MAX_NOMBRE ? this._terminar() : false;
  }

  _terminar() {
    this.letras = limpiarNombre(this.texto).split('');
    return true;
  }
}

/**
 * Las casillas del nombre, la tira de letras y la ayuda, centradas en `cx`
 * a partir de `y`. `s` es la escala de la pantalla.
 */
export function dibujarEditor(c, W, H, editor, { cx = W / 2, y = H * 0.42, s = 1, t = 0 } = {}) {
  const n = MAX_NOMBRE;
  const lado = Math.min(74 * s, (W - 120) / n - 8);
  const sep = 8 * s;
  const ancho = n * lado + (n - 1) * sep;
  const nombre = editor.letras;
  for (let i = 0; i < n; i++) {
    const x = cx - ancho / 2 + i * (lado + sep);
    const actual = i === nombre.length;
    cajaMenu(c, x, y, lado, lado * 1.25, {
      relleno: actual ? 'rgba(130,38,12,0.9)' : 'rgba(8,5,3,0.85)', brillo: actual ? 1 : 0.5,
    });
    const letra = i < nombre.length ? nombre[i] : actual ? LETRAS[editor.letra] : '';
    if (!letra) continue;
    c.textAlign = 'center';
    if (actual && Math.sin(t * 6) < -0.3) continue;       // la letra que se elige parpadea
    if (actual) tituloMenu(c, letra === ' ' ? '␣' : letra, x + lado / 2, y + lado * 0.64, Math.round(lado * 0.8));
    else {
      c.textBaseline = 'top';
      textoMenu(c, letra, x + lado / 2, y + lado * 0.2, Math.round(lado * 0.72), '#fff3cf');
    }
    if (actual) {
      // flechas arriba y abajo: se puede cambiar
      c.fillStyle = ORO;
      const mx = x + lado / 2;
      c.beginPath();
      c.moveTo(mx - 12 * s, y - 10 * s); c.lineTo(mx + 12 * s, y - 10 * s); c.lineTo(mx, y - 26 * s); c.closePath();
      c.moveTo(mx - 12 * s, y + lado * 1.25 + 10 * s); c.lineTo(mx + 12 * s, y + lado * 1.25 + 10 * s); c.lineTo(mx, y + lado * 1.25 + 26 * s); c.closePath();
      c.fill();
    }
  }

  // la tira de letras, para ver cuál viene
  c.textBaseline = 'middle';
  const yT = y + lado * 1.25 + 80 * s;
  for (let d = -6; d <= 6; d++) {
    const l = LETRAS[(editor.letra + d + LETRAS.length) % LETRAS.length];
    c.globalAlpha = d === 0 ? 1 : Math.max(0.15, 0.7 - Math.abs(d) * 0.1);
    c.textAlign = 'center';
    c.font = (d === 0 ? 'bold ' : '') + Math.round((d === 0 ? 38 : 26) * s) + 'px ' + MENU.letra;
    c.fillStyle = d === 0 ? ORO : MENU.beige;
    c.fillText(l === ' ' ? '␣' : l, cx + d * 44 * s, yT);
  }
  c.globalAlpha = 1;

  c.textBaseline = 'top';
  c.textAlign = 'center';
  c.font = Math.round(19 * s) + 'px ' + FUENTE.interfaz;
  c.fillStyle = '#d6c8a2';
  const ayuda = [
    'Joy-Con: stick, ↑/↓ o X/B cambian la letra · gatillo, → o A la ponen · ← o Y borra',
    'Teclado: escribe tu nombre directo · Retroceso borra · Enter termina',
    'Elige ✓ para terminar',
  ];
  ayuda.forEach((l, i) => c.fillText(l, cx, yT + 50 * s + i * 28 * s));
  return yT + 50 * s + ayuda.length * 28 * s;
}

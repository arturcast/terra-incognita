/**
 * revelacion.js — La pantalla «Así trabajamos» / «Así terminamos»: lo que el
 * visitante acaba de hacer, traducido pieza por pieza a lo que hace el área.
 *
 * Aquí SÍ se nombra el oficio (es la revelación de la etapa; ver
 * docs/NARRATIVA.md). Mismo estilo que los menús y letra grande, que se
 * achica sola si el texto no cabe en la pantalla.
 */

import { partirLineas } from '../core/briefing.js';
import { FUENTE, MENU, fondoMenu, tituloMenu, textoMenu, suave } from '../core/render.js';

/**
 * @param {object} o
 *   titulo  'Así trabajamos'
 *   filas   [{ que, es, color }]
 *   cierre  la frase final, en cursiva dorada
 *   pie     'Pulsa ZR para continuar' (o null mientras no se puede)
 *   t       segundos desde que se entró: las filas aparecen una tras otra
 *   reloj   tiempo total, para el parpadeo del pie
 */
export function dibujarRevelacion(c, W, H, o) {
  fondoMenu(c, W, H);
  const cx = W / 2;

  // Letra grande: se lee de pie, a un par de metros. Si no cabe, se achica sola.
  let s = Math.max(0.85, Math.min(1.7, Math.min(H / 660, W / 1100)));
  let ancho, colQue, filas, alto;
  for (let intento = 0; intento < 8; intento++) {
    ancho = Math.min(1100 * s, W - 60);
    colQue = Math.min(280 * s, ancho * 0.3);
    c.font = Math.round(21 * s) + 'px ' + FUENTE.interfaz;
    filas = o.filas.map((f) => partirLineas(c, f.es, ancho - colQue - 30 * s));
    const altoFilas = filas.reduce((a, l) => a + Math.max(1, l.length) * 28 * s + 18 * s, 0);
    alto = 34 * s + 76 * s + altoFilas + 80 * s;
    if (alto <= H - 70) break;
    s *= 0.92;
  }
  let y = Math.max(20, (H - alto) / 2 - 10);

  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.font = Math.round(14 * s) + 'px ' + FUENTE.instrumento;
  c.fillStyle = '#f0c977';
  c.fillText('L O   Q U E   A C A B A S   D E   H A C E R ,   E N   L A   V I D A   R E A L', cx, y);
  y += 34 * s;
  tituloMenu(c, o.titulo, cx, y + 30 * s, Math.round(56 * s));
  y += 76 * s;

  const x0 = cx - ancho / 2;
  o.filas.forEach((f, n) => {
    c.globalAlpha = suave(Math.min(1, (o.t - n * 0.25) / 0.6));
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.font = 'bold ' + Math.round(23 * s) + 'px ' + MENU.letra;
    c.fillStyle = 'rgba(0,0,0,0.85)';
    c.fillText(f.que, x0 + 2, y + 2);
    c.fillStyle = f.color || '#f0c977';
    c.fillText(f.que, x0, y);
    c.font = Math.round(21 * s) + 'px ' + FUENTE.interfaz;
    c.fillStyle = MENU.beige;
    filas[n].forEach((l, m) => c.fillText(l, x0 + colQue + 30 * s, y + m * 28 * s));
    y += Math.max(1, filas[n].length) * 28 * s + 18 * s;
    c.globalAlpha = 1;
  });

  if (o.cierre && o.t > 1.6) {
    c.globalAlpha = suave(Math.min(1, (o.t - 1.6) / 0.8));
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = 'italic ' + Math.round(28 * s) + 'px ' + FUENTE.narrativa;
    c.fillStyle = 'rgba(0,0,0,0.85)';
    c.fillText(o.cierre, cx + 2, y + 16 * s + 2);
    c.fillStyle = '#f0c977';
    c.fillText(o.cierre, cx, y + 16 * s);
    c.globalAlpha = 1;
  }
  if (o.pie) {
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    textoMenu(c, o.pie, cx, H - 24, Math.round(20 * s),
      Math.sin((o.reloj || 0) * 4) > -0.45 ? '#f0c977' : 'rgba(205,187,138,0.5)');
  }
}

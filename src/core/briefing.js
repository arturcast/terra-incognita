/**
 * briefing.js — Pantallas de instrucciones entre fases.
 *
 * El visitante llega al stand sin contexto y tiene que entender qué hacer en
 * cinco segundos. Cada fase se abre con una de estas pantallas.
 *
 * Por qué mide antes de dibujar: apilar texto con coordenadas fijas funciona
 * hasta que una frase crece, cambia la pantalla o se traduce; entonces los
 * bloques se montan unos sobre otros. Aquí se calcula la altura real de cada
 * bloque, se suma, y solo entonces se decide dónde empieza el panel. Nada se
 * puede solapar porque nada tiene posición fija.
 *
 * Tamaño de letra: grande, para leerse a tres metros. Todo se escala con la
 * pantalla, y si con esa escala el contenido no cabe, se achica hasta caber.
 */

import {
  PALETA, FUENTE, MENU, barraLectura, cajaMenu, tituloMenu, fondoMenu,
} from './render.js';

/** Parte un texto en líneas que caben en `ancho`. Requiere la fuente ya puesta. */
export function partirLineas(c, texto, ancho) {
  const palabras = String(texto).split(' ');
  const lineas = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? actual + ' ' + p : p;
    if (c.measureText(prueba).width > ancho && actual) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** Texto narrativo en cursiva, beige con sombra dura (como textoMenu, pero en cursiva). */
function cursivaMenu(c, texto, x, y, tamano) {
  c.textBaseline = 'top';
  c.font = 'italic ' + tamano + 'px ' + FUENTE.narrativa;
  c.fillStyle = 'rgba(0,0,0,0.85)';
  c.fillText(texto, x + 2, y + 2);
  c.fillStyle = '#d6c8a2';
  c.fillText(texto, x, y);
}

/** Tamaños de letra con escala 1 (pantalla de 820 px de alto). */
const BASE = { etiqueta: 14, titulo: 50, entrada: 21, paso: 19, leyenda: 16, aviso: 17, continuar: 20 };

export class Briefing {
  /**
   * @param {object} d
   *   etiqueta   texto pequeño superior, tipo "ETAPA 1 · PARTE 1"
   *   titulo     título grande
   *   entrada    frase narrativa en cursiva
   *   pasos      array de strings: cómo se juega
   *   leyenda    array de {color, nombre, texto}: explicación de las barras
   *   aviso      llamada de atención (el límite de tiempo)
   *   continuar  texto del pie; se sustituye {B} por el nombre del botón
   */
  constructor(d) {
    Object.assign(this, d);
    this.t = 0;
    this.minimo = d.minimo ?? 0.8;   // segundos antes de permitir continuar
  }

  reiniciar() { this.t = 0; }
  actualizar(dt) { this.t += dt; }
  get puedeContinuar() { return this.t >= this.minimo; }

  /** Mide los bloques con la escala `s`. Devuelve bloques, tamaños y alto total. */
  _medir(c, s, anchoTexto) {
    const T = {};
    for (const k in BASE) T[k] = Math.round(BASE[k] * s);
    const bloques = [];
    const add = (tipo, alto, datos) => bloques.push({ tipo, alto, ...datos });

    if (this.etiqueta) add('etiqueta', T.etiqueta * 1.9);
    if (this.titulo) {
      c.font = 'bold ' + T.titulo + 'px ' + MENU.letra;     // la misma letra con que se dibuja
      const lineas = partirLineas(c, this.titulo, anchoTexto);
      add('titulo', T.titulo * 1.2 * lineas.length + 6 * s, { lineas });
    }
    if (this.entrada) {
      c.font = 'italic ' + T.entrada + 'px ' + FUENTE.narrativa;
      const lineas = partirLineas(c, this.entrada, anchoTexto);
      add('entrada', lineas.length * T.entrada * 1.45 + 14 * s, { lineas });
    }
    if (this.pasos && this.pasos.length) {
      c.font = T.paso + 'px ' + FUENTE.interfaz;
      let alto = 10 * s;
      const items = this.pasos.map((p) => {
        const l = partirLineas(c, p, anchoTexto - 30 * s);
        alto += l.length * T.paso * 1.4 + 9 * s;
        return l;
      });
      add('pasos', alto, { items });
    }
    if (this.leyenda && this.leyenda.length) {
      c.font = T.leyenda + 'px ' + FUENTE.interfaz;
      let alto = 14 * s;
      const items = this.leyenda.map((g) => {
        const l = partirLineas(c, g.texto, anchoTexto - 110 * s);
        const altoItem = Math.max(32 * s, T.leyenda * 1.4 * (l.length + 1) + 8 * s);
        alto += altoItem;
        return { ...g, lineas: l, altoItem };
      });
      add('leyenda', alto, { items });
    }
    if (this.aviso) {
      c.font = T.aviso + 'px ' + FUENTE.interfaz;
      const lineas = partirLineas(c, this.aviso, anchoTexto - 40 * s);
      add('aviso', lineas.length * T.aviso * 1.4 + 30 * s, { lineas });
    }
    add('continuar', T.continuar * 2.8);
    return { bloques, T, alto: bloques.reduce((a, b) => a + b.alto, 0) };
  }

  dibujar(c, W, H, nombreBoton) {
    let s = Math.max(0.8, Math.min(1.35, H / 820));
    let anchoPanel, pad, anchoTexto, m;
    for (let intento = 0; intento < 8; intento++) {
      anchoPanel = Math.min(980 * s, W - 60);
      pad = Math.round(40 * s);
      anchoTexto = anchoPanel - pad * 2;
      m = this._medir(c, s, anchoTexto);
      if (m.alto + pad * 2 <= H - 30) break;
      s *= 0.92;                         // no cabe: todo un poco más chico
    }
    const { bloques, T } = m;
    const altoPanel = m.alto + pad * 2;
    const x = (W - anchoPanel) / 2;
    const y = Math.max(15, (H - altoPanel) / 2);

    // ---------- fondo: el mismo estilo de los menús (render.js)
    c.save();
    c.globalAlpha = 0.93;
    fondoMenu(c, W, H);
    c.globalAlpha = 1;
    cajaMenu(c, x, y, anchoPanel, altoPanel, { relleno: 'rgba(10,5,3,0.9)' });

    // ---------- dibujar, con lo medido
    let cy = y + pad;
    const cx = W / 2;
    const izq = x + pad;

    for (const b of bloques) {
      switch (b.tipo) {
        case 'etiqueta': {
          c.textAlign = 'center';
          c.textBaseline = 'top';
          c.font = T.etiqueta + 'px ' + FUENTE.instrumento;
          c.fillStyle = PALETA.oro;
          c.fillText(this.etiqueta.toUpperCase().split('').join(' '), cx, cy);
          break;
        }
        case 'titulo': {
          c.textAlign = 'center';
          b.lineas.forEach((l, i) => tituloMenu(c, l, cx, cy + i * T.titulo * 1.2 + T.titulo * 0.6, T.titulo));
          c.textBaseline = 'top';
          break;
        }
        case 'entrada': {
          c.textAlign = 'center';
          b.lineas.forEach((l, i) => cursivaMenu(c, l, cx, cy + i * T.entrada * 1.45, T.entrada));
          break;
        }
        case 'pasos': {
          let py = cy + 10 * s;
          c.textBaseline = 'top';
          c.textAlign = 'left';
          b.items.forEach((lineas) => {
            c.font = 'bold ' + T.paso + 'px ' + FUENTE.interfaz;
            c.fillStyle = PALETA.oro;
            c.fillText('›', izq, py);
            c.font = T.paso + 'px ' + FUENTE.interfaz;
            c.fillStyle = MENU.beige;
            lineas.forEach((l, i) => c.fillText(l, izq + 24 * s, py + i * T.paso * 1.4));
            py += lineas.length * T.paso * 1.4 + 9 * s;
          });
          break;
        }
        case 'leyenda': {
          let py = cy + 14 * s;
          c.textBaseline = 'top';
          c.textAlign = 'left';
          b.items.forEach((g) => {
            barraLectura(c, izq, py + 6 * s, 80 * s, 10 * s, g.valor ?? 0.75, g.color, null);
            c.font = 'bold ' + T.leyenda + 'px ' + FUENTE.interfaz;
            c.fillStyle = g.color;
            c.fillText(g.nombre, izq + 96 * s, py);
            c.font = T.leyenda + 'px ' + FUENTE.interfaz;
            c.fillStyle = '#d6c8a2';
            g.lineas.forEach((l, i) => c.fillText(l, izq + 96 * s, py + T.leyenda * 1.4 * (i + 1)));
            py += g.altoItem;
          });
          break;
        }
        case 'aviso': {
          const alto = b.lineas.length * T.aviso * 1.4 + 18 * s;
          c.fillStyle = 'rgba(160,40,20,0.22)';
          c.fillRect(izq, cy, anchoTexto, alto);
          c.strokeStyle = 'rgba(240,145,126,0.5)';
          c.lineWidth = 1.5;
          c.strokeRect(izq + 0.5, cy + 0.5, anchoTexto - 1, alto - 1);
          c.textAlign = 'center';
          c.textBaseline = 'top';
          c.font = T.aviso + 'px ' + FUENTE.interfaz;
          c.fillStyle = '#ffb4a3';
          b.lineas.forEach((l, i) => c.fillText(l, cx, cy + 9 * s + i * T.aviso * 1.4));
          break;
        }
        case 'continuar': {
          c.textAlign = 'center';
          c.textBaseline = 'top';
          c.font = 'bold ' + T.continuar + 'px ' + MENU.letra;
          const visible = this.puedeContinuar && Math.sin(this.t * 4) > -0.45;
          c.fillStyle = visible ? '#f0c977' : 'rgba(205,187,138,0.45)';
          const txt = (this.continuar || 'Pulsa {B} para continuar').replace('{B}', nombreBoton);
          c.fillText(txt, cx, cy + T.continuar * 0.9);
          break;
        }
      }
      cy += b.alto;
    }
    c.restore();
  }
}

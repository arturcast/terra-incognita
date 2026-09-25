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
 */

import { PALETA, FUENTE, rectRedondeado, barraLectura } from './render.js';

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

  dibujar(c, W, H, nombreBoton) {
    const anchoPanel = Math.min(760, W - 80);
    const pad = 38;
    const anchoTexto = anchoPanel - pad * 2;

    // ---------- PASADA 1: medir
    const bloques = [];
    const add = (tipo, alto, datos) => bloques.push({ tipo, alto, ...datos });

    if (this.etiqueta) add('etiqueta', 20);
    if (this.titulo) {
      c.font = '34px ' + FUENTE.narrativa;
      add('titulo', 42, { lineas: partirLineas(c, this.titulo, anchoTexto) });
      bloques[bloques.length - 1].alto = 42 * bloques[bloques.length - 1].lineas.length;
    }
    if (this.entrada) {
      c.font = 'italic 17px ' + FUENTE.narrativa;
      const l = partirLineas(c, this.entrada, anchoTexto);
      add('entrada', l.length * 26 + 14, { lineas: l });
    }
    if (this.pasos && this.pasos.length) {
      c.font = '15px ' + FUENTE.interfaz;
      let alto = 10;
      const items = this.pasos.map((p) => {
        const l = partirLineas(c, p, anchoTexto - 30);
        alto += l.length * 22 + 8;
        return l;
      });
      add('pasos', alto, { items });
    }
    if (this.leyenda && this.leyenda.length) {
      c.font = '13px ' + FUENTE.interfaz;
      let alto = 14;
      const items = this.leyenda.map((g) => {
        const l = partirLineas(c, g.texto, anchoTexto - 128);
        alto += Math.max(30, l.length * 19 + 12);
        return { ...g, lineas: l };
      });
      add('leyenda', alto, { items });
    }
    if (this.aviso) {
      c.font = '14px ' + FUENTE.interfaz;
      const l = partirLineas(c, this.aviso, anchoTexto - 40);
      add('aviso', l.length * 20 + 26, { lineas: l });
    }
    add('continuar', 44);

    const altoContenido = bloques.reduce((s, b) => s + b.alto, 0);
    const altoPanel = altoContenido + pad * 2;
    const x = (W - anchoPanel) / 2;
    const y = Math.max(20, (H - altoPanel) / 2);

    // ---------- fondo
    c.save();
    c.fillStyle = 'rgba(4,6,11,0.90)';
    c.fillRect(0, 0, W, H);

    c.fillStyle = 'rgba(14,22,32,0.97)';
    rectRedondeado(c, x, y, anchoPanel, altoPanel, 14);
    c.fill();
    c.strokeStyle = 'rgba(217,164,65,0.35)';
    c.lineWidth = 1.5;
    c.stroke();

    // ---------- PASADA 2: dibujar
    let cy = y + pad;
    const cx = W / 2;
    const izq = x + pad;

    for (const b of bloques) {
      switch (b.tipo) {
        case 'etiqueta': {
          c.textAlign = 'center';
          c.textBaseline = 'top';
          c.font = '11px ' + FUENTE.instrumento;
          c.fillStyle = PALETA.oro;
          c.fillText(this.etiqueta.toUpperCase(), cx, cy);
          break;
        }
        case 'titulo': {
          c.textAlign = 'center';
          c.textBaseline = 'top';
          c.font = '34px ' + FUENTE.narrativa;
          c.fillStyle = PALETA.tinta;
          b.lineas.forEach((l, i) => c.fillText(l, cx, cy + i * 42));
          break;
        }
        case 'entrada': {
          c.textAlign = 'center';
          c.textBaseline = 'top';
          c.font = 'italic 17px ' + FUENTE.narrativa;
          c.fillStyle = PALETA.tintaTenue;
          b.lineas.forEach((l, i) => c.fillText(l, cx, cy + i * 26));
          break;
        }
        case 'pasos': {
          let py = cy + 10;
          c.textBaseline = 'top';
          b.items.forEach((lineas) => {
            c.fillStyle = PALETA.oro;
            c.textAlign = 'left';
            c.font = '15px ' + FUENTE.interfaz;
            c.fillText('›', izq, py);
            c.fillStyle = PALETA.tinta;
            lineas.forEach((l, i) => c.fillText(l, izq + 22, py + i * 22));
            py += lineas.length * 22 + 8;
          });
          break;
        }
        case 'leyenda': {
          let py = cy + 14;
          c.textBaseline = 'top';
          b.items.forEach((g) => {
            const altoItem = Math.max(30, g.lineas.length * 19 + 12);
            barraLectura(c, izq, py + 5, 68, 8, g.valor ?? 0.75, g.color, null);
            c.textAlign = 'left';
            c.font = 'bold 13px ' + FUENTE.interfaz;
            c.fillStyle = g.color;
            c.fillText(g.nombre, izq + 82, py);
            c.font = '13px ' + FUENTE.interfaz;
            c.fillStyle = PALETA.tintaTenue;
            g.lineas.forEach((l, i) => c.fillText(l, izq + 82, py + 18 + i * 19));
            py += altoItem;
          });
          break;
        }
        case 'aviso': {
          const alto = b.lineas.length * 20 + 16;
          c.fillStyle = 'rgba(224,97,74,0.11)';
          rectRedondeado(c, izq, cy, anchoTexto, alto, 8);
          c.fill();
          c.strokeStyle = 'rgba(224,97,74,0.35)';
          c.lineWidth = 1;
          c.stroke();
          c.textAlign = 'center';
          c.textBaseline = 'top';
          c.font = '14px ' + FUENTE.interfaz;
          c.fillStyle = '#f0917e';
          b.lineas.forEach((l, i) => c.fillText(l, cx, cy + 9 + i * 20));
          break;
        }
        case 'continuar': {
          c.textAlign = 'center';
          c.textBaseline = 'top';
          c.font = '15px ' + FUENTE.interfaz;
          const visible = this.puedeContinuar && Math.sin(this.t * 4) > -0.45;
          c.fillStyle = visible ? PALETA.oro : PALETA.tintaDebil;
          const txt = (this.continuar || 'Pulsa {B} para continuar').replace('{B}', nombreBoton);
          c.fillText(txt, cx, cy + 16);
          break;
        }
      }
      cy += b.alto;
    }
    c.restore();
  }
}

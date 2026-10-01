/**
 * cierre.js — La revelación.
 *
 * Aquí, y solo aquí, se nombra el oficio. El visitante ya ejerció la
 * capacidad; ahora descubre cómo se llama y quién la ejerce todos los días.
 * Ese orden —primero vivirlo, después nombrarlo— es toda la apuesta del stand.
 *
 * Se pagina a propósito. Antes todo el contenido caía en una sola pantalla y
 * en monitores bajos los bloques se montaban. Ahora cada página se mide y se
 * centra sola.
 *
 * Estilo de los menús (render.js) y letra grande: se escala con la pantalla y
 * se achica sola si una página no cabe.
 */

import { Escena } from '../../core/engine.js';
import { Acciones } from '../../core/input.js';
import { partirLineas } from '../../core/briefing.js';
import {
  FUENTE, MENU, grano, vineta, suave, limitar, fondoMenu, tituloMenu, textoMenu, cajaMenu,
} from '../../core/render.js';

export const ETAPAS = [
  { n: '1', titulo: 'El Mapa', capacidad: 'Mirar todo y elegir a dónde ir', equivale: 'Plan Anual de Auditoría', estado: 'listo' },
  { n: '2', titulo: 'El Camino', capacidad: 'Ir a la fuente y encontrar lo escondido', equivale: 'Ejecución de auditoría basada en análisis de datos', estado: 'listo' },
  { n: '3', titulo: 'El Tesoro', capacidad: 'El valor aparece cuando lo encontrado se convierte en mejora', equivale: 'Recomendaciones, acciones y seguimiento para mejorar el proceso', estado: 'listo' },
];

const ORO = '#f0c977';
/**
 * Páginas: 0 «Eso es Auditoría Interna» y 1 el recorrido completo. La de La
 * Isla Brillante se pasó al final de El Mapa (pedido del usuario, 2026-09-30).
 */
const ULTIMA_PAGINA = 1;
const BEIGE_TENUE = '#d6c8a2';

/** Texto en cursiva con sombra dura. */
function cursiva(c, texto, x, y, tamano, color = BEIGE_TENUE) {
  c.font = 'italic ' + tamano + 'px ' + FUENTE.narrativa;
  c.fillStyle = 'rgba(0,0,0,0.85)';
  c.fillText(texto, x + 2, y + 2);
  c.fillStyle = color;
  c.fillText(texto, x, y);
}

export class EscenaCierre extends Escena {
  constructor(motor) {
    super(motor);
    this.acciones = new Acciones(motor.jc);
    this._clic = false;
    this._onClic = () => { if (!this.motor.jc.estado.conectado) this._clic = true; };
    this._onTecla = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) this._clic = true; };
  }

  async entrar(resultado) {
    this.r = resultado;
    this.t = 0;
    this.pagina = 0;
    window.addEventListener('mousedown', this._onClic);
    window.addEventListener('keydown', this._onTecla);
    this.motor.audio && this.motor.audio.musica('revelacion');
  }

  salir() {
    window.removeEventListener('mousedown', this._onClic);
    window.removeEventListener('keydown', this._onTecla);
  }

  get nombreBoton() {
    return this.motor.jc.estado.conectado ? this.acciones.nombreConfirmar : 'ESPACIO';
  }

  actualizar(dt) {
    this.t += dt;
    const confirmo = this._clic || (this.motor.jc.estado.conectado && this.acciones.confirmar());
    this._clic = false;
    const listo = this.pagina === 0 ? this.t > 4.2 : this.t > 1.2;
    if (listo && confirmo) {
      if (this.pagina < ULTIMA_PAGINA) {
        this.pagina++;
        this.t = 0;
        this.motor.audio && this.motor.audio.sfx('avanzar');
      } else {
        this.motor.ir('intro');
      }
    }
  }

  /** Escala de letra de la página: crece con la pantalla. */
  get _s() { return limitar(this.motor.alto / 820, 0.8, 1.35); }

  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;
    fondoMenu(c, W, H);
    vineta(c, W, H, 0.45);

    if (this.pagina === 0) this._pagNombrarlo(c, W, H);
    else this._pagRecorrido(c, W, H);

    this._pie(c, W, H);
    grano(c, W, H);
  }

  _pie(c, W, H) {
    const listo = this.pagina === 0 ? this.t > 4.2 : this.t > 1.2;
    if (!listo) return;
    const s = this._s;
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    textoMenu(c, 'Pulsa ' + this.nombreBoton + (this.pagina < ULTIMA_PAGINA ? ' para seguir' : ' para volver al inicio'),
      W / 2, H - 24, Math.round(21 * s), Math.sin(this.t * 4) > -0.45 ? ORO : 'rgba(205,187,138,0.5)');

    for (let i = 0; i <= ULTIMA_PAGINA; i++) {
      c.beginPath();
      c.arc(W / 2 - ULTIMA_PAGINA * 9 + i * 18, H - 58 * s, 5, 0, Math.PI * 2);
      c.fillStyle = i === this.pagina ? ORO : 'rgba(205,187,138,0.3)';
      c.fill();
    }
  }

  // ---------------------------------------------- página 1: se nombra
  _pagNombrarlo(c, W, H) {
    const cx = W / 2;
    let s = this._s, ancho, l1, l3, alto;
    for (let intento = 0; intento < 8; intento++) {
      ancho = Math.min(1000 * s, W * 0.88);
      c.font = 'italic ' + Math.round(25 * s) + 'px ' + FUENTE.narrativa;
      l1 = partirLineas(c, 'Primero miraste todo el territorio y decidiste a dónde ir. Después fuiste a ' +
        'la fuente, recorriste el proceso de principio a fin y encontraste lo que nadie estaba viendo. ' +
        'Al final, implementaste acciones que hicieron que mejorara el proceso y sus resultados.', ancho);
      c.font = Math.round(21 * s) + 'px ' + FUENTE.interfaz;
      l3 = partirLineas(c, 'No nos limitamos a probar los controles ni a seguir el manual: entendemos el ' +
        'proceso completo para encontrar lo invisible. Así es como generamos valor.', ancho);
      alto = l1.length * 36 * s + 40 * s + 90 * s + ETAPAS.length * 44 * s + 30 * s + l3.length * 30 * s;
      if (alto <= H - 150) break;
      s *= 0.92;
    }
    let y = Math.max(30, (H - alto) / 2 - 30);
    c.textAlign = 'center';
    c.textBaseline = 'top';

    c.globalAlpha = suave(Math.min(1, this.t / 1.2));
    l1.forEach((l) => { cursiva(c, l, cx, y, Math.round(25 * s)); y += 36 * s; });
    c.globalAlpha = 1;
    y += 40 * s;

    if (this.t > 1.6) {
      c.globalAlpha = suave(Math.min(1, (this.t - 1.6) / 1.2));
      tituloMenu(c, 'Eso es Auditoría Interna.', cx, y + 34 * s, Math.round(64 * s));
      c.textBaseline = 'top';
      c.globalAlpha = 1;
    }
    y += 90 * s;

    // Cada etapa, con su nombre de verdad.
    ETAPAS.forEach((e, n) => {
      if (this.t <= 2.4 + n * 0.35) return;
      c.globalAlpha = suave(Math.min(1, (this.t - 2.4 - n * 0.35) / 0.6));
      const yy = y + n * 44 * s;
      c.textAlign = 'right';
      c.font = 'bold ' + Math.round(26 * s) + 'px ' + MENU.letra;
      c.fillStyle = 'rgba(0,0,0,0.85)';
      c.fillText(e.titulo, cx - 22 * s + 2, yy + 2);
      c.fillStyle = MENU.beige;
      c.fillText(e.titulo, cx - 22 * s, yy);
      c.textAlign = 'center';
      c.fillStyle = 'rgba(205,187,138,0.6)';
      c.fillText('→', cx, yy);
      c.textAlign = 'left';
      textoMenu(c, e.equivale, cx + 22 * s, yy + 2 * s, Math.round(24 * s), ORO);
      c.globalAlpha = 1;
    });
    y += ETAPAS.length * 44 * s + 30 * s;

    if (this.t > 3.6) {
      c.globalAlpha = suave(Math.min(1, (this.t - 3.6) / 1.2));
      c.textAlign = 'center';
      c.font = Math.round(21 * s) + 'px ' + FUENTE.interfaz;
      c.fillStyle = MENU.beige;
      l3.forEach((l) => { c.fillText(l, cx, y); y += 30 * s; });
      c.globalAlpha = 1;
    }
  }

  // ------------------------------ página 2: el recorrido completo
  _pagRecorrido(c, W, H) {
    const cx = W / 2;
    const s = this._s;
    c.textAlign = 'center';
    c.textBaseline = 'top';

    let y = Math.max(30, H * 0.08);
    tituloMenu(c, 'El recorrido completo', cx, y + 36 * s, Math.round(66 * s));
    c.textBaseline = 'top';
    y += 82 * s;

    const jugadas = ETAPAS.filter((e) => e.estado === 'listo').length;
    textoMenu(c, 'Jugaste ' + jugadas + ' de las ' + ETAPAS.length + ' etapas. Así se ve el camino completo.',
      cx, y, Math.round(23 * s), MENU.beige);
    y += 56 * s;

    // Tres tarjetas en fila; en pantallas angostas, una debajo de otra.
    const enFila = W >= 900;
    const anchoTotal = Math.min(1200 * s, W - 60);
    const porFila = enFila ? ETAPAS.length : 1;
    const sep = 20 * s;
    const wTar = enFila ? (anchoTotal - sep * (porFila - 1)) / porFila : Math.min(560 * s, W - 60);
    // La altura sale del texto más largo: los lemas cambian con la revisión
    // de textos y una tarjeta fija los dejaba montados.
    const lineasDe = (fuente, texto) => {
      c.font = fuente;
      return partirLineas(c, texto, wTar - 36 * s).length;
    };
    const maxLineas = Math.max(...ETAPAS.map((e) =>
      lineasDe(Math.round(19 * s) + 'px ' + FUENTE.interfaz, e.capacidad) +
      lineasDe('bold ' + Math.round(19 * s) + 'px ' + MENU.letra, e.equivale)));
    const hTar = Math.max(200 * s, (20 + 30 + 56 + 6 + 22) * s + maxLineas * 25 * s);
    const x0 = cx - (enFila ? anchoTotal : wTar) / 2;

    ETAPAS.forEach((e, i) => {
      const fila = enFila ? 0 : i;
      const col = enFila ? i : 0;
      const x = x0 + col * (wTar + sep);
      const ty = y + fila * (hTar + sep);
      const listo = e.estado === 'listo';
      cajaMenu(c, x, ty, wTar, hTar, { relleno: 'rgba(8,5,3,0.84)', brillo: listo ? 1 : 0.4 });

      const mx = x + wTar / 2;
      let yy = ty + 20 * s;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.font = Math.round(15 * s) + 'px ' + FUENTE.instrumento;
      c.fillStyle = listo ? ORO : 'rgba(205,187,138,0.5)';
      c.fillText('E T A P A   ' + e.n, mx, yy);
      yy += 30 * s;

      tituloMenu(c, e.titulo, mx, yy + 22 * s, Math.round(40 * s));
      c.textBaseline = 'top';
      yy += 56 * s;

      c.font = Math.round(19 * s) + 'px ' + FUENTE.interfaz;
      c.fillStyle = MENU.beige;
      partirLineas(c, e.capacidad, wTar - 36 * s).forEach((l) => { c.fillText(l, mx, yy); yy += 25 * s; });
      yy += 6 * s;
      c.font = 'bold ' + Math.round(19 * s) + 'px ' + MENU.letra;
      c.fillStyle = ORO;
      partirLineas(c, e.equivale, wTar - 36 * s).forEach((l) => { c.fillText(l, mx, yy); yy += 25 * s; });
    });

    y += (enFila ? 1 : ETAPAS.length) * (hTar + sep) + 26 * s;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    const tamFinal = Math.round(26 * s);
    c.font = 'italic ' + tamFinal + 'px ' + FUENTE.narrativa;
    partirLineas(c, 'Esto es lo que hacemos. Identificar lo relevante, revisar, asegurar el cumplimiento ' +
      'e identificar mejoras que le permitan a la compañía alcanzar sus objetivos y hacer las cosas ' +
      'cada vez mejor.', anchoTotal).forEach((l) => {
      cursiva(c, l, cx, y, tamFinal, ORO);
      y += 36 * s;
    });
  }
}

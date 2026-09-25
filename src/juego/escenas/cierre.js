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
 */

import { Escena } from '../../core/engine.js';
import { Acciones } from '../../core/input.js';
import { partirLineas } from '../../core/briefing.js';
import { PALETA, FUENTE, rectRedondeado, etiqueta, grano, vineta, suave } from '../../core/render.js';
import { REGIONES } from '../../datos/territorio.js';

export const ETAPAS = [
  { n: '1', titulo: 'El Mapa', capacidad: 'Mirar todo y elegir a dónde ir', equivale: 'Plan Anual de Auditoría', estado: 'listo' },
  { n: '2', titulo: 'El Camino', capacidad: 'Ir a la fuente y encontrar lo escondido', equivale: 'Ejecución con analítica de datos', estado: 'listo' },
  { n: '3', titulo: 'El Regreso', capacidad: 'Contarlo, y volver a ver que cambió', equivale: 'Informe, recomendaciones y seguimiento', estado: 'listo' },
];

export class EscenaCierre extends Escena {
  constructor(motor) {
    super(motor);
    this.acciones = new Acciones(motor.jc);
    this._clic = false;
    this._onClic = () => { if (!this.motor.jc.estado.conectado) this._clic = true; };
  }

  async entrar(resultado) {
    this.r = resultado;
    this.t = 0;
    this.pagina = 0;
    window.addEventListener('mousedown', this._onClic);
    this.motor.audio && this.motor.audio.musica('revelacion');
  }

  salir() { window.removeEventListener('mousedown', this._onClic); }

  get nombreBoton() {
    return this.motor.jc.estado.conectado ? this.acciones.nombreConfirmar : 'CLIC';
  }

  actualizar(dt) {
    this.t += dt;
    const confirmo = this._clic || (this.motor.jc.estado.conectado && this.acciones.confirmar());
    this._clic = false;
    const listo = this.pagina === 0 ? this.t > 4.2 : this.t > 1.2;
    if (listo && confirmo) {
      if (this.pagina < 2) {
        this.pagina++;
        this.t = 0;
        this.motor.audio && this.motor.audio.sfx('avanzar');
      } else {
        this.motor.ir('intro');
      }
    }
  }

  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;
    c.fillStyle = PALETA.fondoHondo;
    c.fillRect(0, 0, W, H);
    vineta(c, W, H, 0.6);

    if (this.pagina === 0) this._pagNombrarlo(c, W, H);
    else if (this.pagina === 1) this._pagEquivalencias(c, W, H);
    else this._pagRecorrido(c, W, H);

    this._pie(c, W, H);
    grano(c, W, H);
  }

  _pie(c, W, H) {
    const listo = this.pagina === 0 ? this.t > 4.2 : this.t > 1.2;
    if (!listo) return;
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.font = '15px ' + FUENTE.interfaz;
    c.fillStyle = Math.sin(this.t * 4) > -0.45 ? PALETA.oro : PALETA.tintaDebil;
    c.fillText('Pulsa ' + this.nombreBoton + (this.pagina < 2 ? ' para seguir' : ' para volver al inicio'),
      W / 2, H - 24);

    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(W / 2 - 14 + i * 14, H - 52, 3.5, 0, Math.PI * 2);
      c.fillStyle = i === this.pagina ? PALETA.oro : 'rgba(255,255,255,0.20)';
      c.fill();
    }
  }

  // ---------------------------------------------- página 1: se nombra
  _pagNombrarlo(c, W, H) {
    const cx = W / 2;
    const ancho = Math.min(780, W * 0.78);
    c.textAlign = 'center';
    c.textBaseline = 'top';

    c.font = 'italic 19px ' + FUENTE.narrativa;
    const l1 = partirLineas(c, 'Primero miraste todo el territorio y decidiste a dónde ir. Después fuiste a ' +
      'la fuente, recorriste el proceso de principio a fin y encontraste lo que nadie estaba viendo.', ancho);
    c.font = '16px ' + FUENTE.interfaz;
    const l3 = partirLineas(c, 'No nos limitamos a probar los controles ni a seguir el manual: entendemos el ' +
      'proceso completo para encontrar lo invisible. Así es como generamos valor.', ancho);

    const alto = l1.length * 28 + 34 + 56 + ETAPAS.length * 30 + 24 + l3.length * 23;
    let y = Math.max(40, (H - alto) / 2 - 30);

    c.globalAlpha = suave(Math.min(1, this.t / 1.2));
    c.font = 'italic 19px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tintaTenue;
    l1.forEach((l) => { c.fillText(l, cx, y); y += 28; });
    c.globalAlpha = 1;
    y += 34;

    if (this.t > 1.6) {
      c.globalAlpha = suave(Math.min(1, (this.t - 1.6) / 1.2));
      c.font = '34px ' + FUENTE.narrativa;
      c.fillStyle = PALETA.oro;
      c.fillText('Eso es Auditoría Interna.', cx, y);
      c.globalAlpha = 1;
    }
    y += 56;

    // Cada etapa, con su nombre de verdad.
    ETAPAS.forEach((e, n) => {
      if (this.t <= 2.4 + n * 0.35) return;
      c.globalAlpha = suave(Math.min(1, (this.t - 2.4 - n * 0.35) / 0.6));
      c.textAlign = 'right';
      c.font = '17px ' + FUENTE.narrativa;
      c.fillStyle = e.estado === 'listo' ? PALETA.tinta : PALETA.tintaDebil;
      c.fillText(e.titulo, cx - 16, y + n * 30);
      c.textAlign = 'center';
      c.fillStyle = PALETA.tintaDebil;
      c.fillText('→', cx, y + n * 30);
      c.textAlign = 'left';
      c.font = '16px ' + FUENTE.interfaz;
      c.fillStyle = e.estado === 'listo' ? PALETA.oroClaro : PALETA.tintaDebil;
      c.fillText(e.equivale + (e.estado === 'listo' ? '' : ' (próximamente)'), cx + 16, y + n * 30 + 1);
      c.globalAlpha = 1;
    });
    y += ETAPAS.length * 30 + 24;

    if (this.t > 3.6) {
      c.globalAlpha = suave(Math.min(1, (this.t - 3.6) / 1.2));
      c.textAlign = 'center';
      c.font = '16px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tintaTenue;
      l3.forEach((l) => { c.fillText(l, cx, y); y += 23; });
      c.globalAlpha = 1;
    }
  }

  /**
   * Página 2: el lugar de afuera.
   *
   * La lista de equivalencias ya la vio en el relato, justo después de
   * decidir. Repetirla aquí le robaría el espacio al mensaje que de verdad
   * queremos que se lleve, que es este.
   */
  _pagEquivalencias(c, W, H) {
    const cx = W / 2;
    const ancho = Math.min(760, W - 90);
    const encontro = this.r && this.r.islaDescubierta;
    const isla = REGIONES.find((r) => r.id === 'isla');

    c.textAlign = 'center';
    c.textBaseline = 'top';

    // ---------- medir antes de colocar
    c.font = 'italic 18px ' + FUENTE.narrativa;
    const cuerpo = encontro
      ? 'La encontraste, y eso es raro: casi nadie se sale del mapa a mirar. Es el negocio que no se parece al resto, y justamente por eso suele revisarse menos que los demás.'
      : 'Casi nadie la encuentra, porque para verla hay que mirar por fuera del mapa. Es el negocio que no se parece al resto del territorio.';
    const l1 = partirLineas(c, cuerpo, ancho);
    c.font = '17px ' + FUENTE.interfaz;
    const moraleja = 'Lo que una compañía no revisa porque "no es lo nuestro" suele ser justo lo que menos control tiene.';
    const l2 = partirLineas(c, moraleja, ancho - 60);

    const alto = 28 + 46 + 30 + l1.length * 27 + 34 + l2.length * 25 + 30;
    let y = Math.max(40, (H - alto) / 2 - 20);

    etiqueta(c, encontro ? 'Y llegaste hasta allá' : 'Y había un lugar más',
      cx, y, encontro ? PALETA.exito : PALETA.riesgo, 11);
    y += 34;

    c.font = '34px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tinta;
    c.fillText(isla.nombre, cx, y);
    y += 46;

    c.font = '19px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.oro;
    c.fillText('era ' + isla.equivale, cx, y);
    y += 36;

    c.font = 'italic 18px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tintaTenue;
    l1.forEach((l) => { c.fillText(l, cx, y); y += 27; });
    y += 20;

    // la moraleja, enmarcada: es la frase que queremos que se repita después
    const altoCaja = l2.length * 25 + 30;
    c.fillStyle = encontro ? 'rgba(78,201,165,0.08)' : 'rgba(224,97,74,0.08)';
    rectRedondeado(c, cx - ancho / 2, y, ancho, altoCaja, 10);
    c.fill();
    c.strokeStyle = encontro ? 'rgba(78,201,165,0.30)' : 'rgba(224,97,74,0.28)';
    c.lineWidth = 1;
    c.stroke();

    let iy = y + 15;
    c.font = '17px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tinta;
    l2.forEach((l) => { c.fillText(l, cx, iy); iy += 25; });
  }

  // ------------------------------ página 3: el recorrido completo
  _pagRecorrido(c, W, H) {
    const cx = W / 2;
    c.textAlign = 'center';
    c.textBaseline = 'top';

    let y = Math.max(40, H * 0.10);
    etiqueta(c, 'El recorrido completo', cx, y, PALETA.oro, 11);
    y += 30;

    c.font = '17px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tintaTenue;
    const jugadas = ETAPAS.filter((e) => e.estado === 'listo').length;
    c.fillText('Jugaste ' + jugadas + ' de las ' + ETAPAS.length + ' etapas. Así se ve el camino completo.', cx, y);
    y += 46;

    // Tarjetas: dos filas de tres si la pantalla es estrecha, una fila si cabe.
    const porFila = ETAPAS.length;
    const filas = Math.ceil(ETAPAS.length / porFila);
    const anchoTotal = Math.min(960, W - 70);
    const wTar = (anchoTotal - (porFila - 1) * 12) / porFila;
    const hTar = 132;
    const x0 = cx - anchoTotal / 2;

    ETAPAS.forEach((e, i) => {
      const fila = Math.floor(i / porFila);
      const col = i % porFila;
      const x = x0 + col * (wTar + 12);
      const ty = y + fila * (hTar + 14);
      const listo = e.estado === 'listo';

      c.fillStyle = listo ? 'rgba(217,164,65,0.10)' : 'rgba(255,255,255,0.025)';
      rectRedondeado(c, x, ty, wTar, hTar, 9);
      c.fill();
      c.strokeStyle = listo ? PALETA.oro : 'rgba(255,255,255,0.09)';
      c.lineWidth = 1;
      c.stroke();

      const mx = x + wTar / 2;
      c.textAlign = 'center';
      c.textBaseline = 'top';

      c.font = '11px ' + FUENTE.instrumento;
      c.fillStyle = listo ? PALETA.oro : PALETA.tintaDebil;
      c.fillText('ETAPA ' + e.n, mx, ty + 12);

      c.font = '16px ' + FUENTE.narrativa;
      c.fillStyle = listo ? PALETA.tinta : PALETA.tintaTenue;
      c.fillText(e.titulo, mx, ty + 30);

      c.font = '11px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tintaDebil;
      partirLineas(c, e.capacidad, wTar - 18).forEach((l, k) => c.fillText(l, mx, ty + 56 + k * 15));

      c.font = '10px ' + FUENTE.instrumento;
      c.fillStyle = listo ? PALETA.exito : 'rgba(255,255,255,0.22)';
      c.fillText(listo ? 'YA SE JUEGA' : 'EN DISEÑO', mx, ty + hTar - 22);
    });

    y += filas * (hTar + 14) + 18;

    c.textAlign = 'center';
    c.font = 'italic 17px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.oro;
    c.fillText('Esto es lo que hacemos. Todos los años, en toda la compañía.', cx, y);
  }
}

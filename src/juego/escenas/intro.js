/**
 * intro.js — Apertura.
 *
 * Nunca se menciona auditoría. Se plantea un problema que cualquiera entiende:
 * el territorio es más grande que lo que tienes para recorrerlo.
 *
 * El texto se apila midiendo cada bloque, no con coordenadas fijas: así ni se
 * montan las líneas ni se salen por abajo en pantallas de distinta altura.
 */

import { Escena } from '../../core/engine.js';
import { Acciones } from '../../core/input.js';
import { partirLineas } from '../../core/briefing.js';
import { PALETA, FUENTE, etiqueta, grano, vineta, suave } from '../../core/render.js';
import { generarCosta, generarIsla, REGIONES } from '../../datos/territorio.js';

export class EscenaIntro extends Escena {
  constructor(motor) {
    super(motor);
    this.acciones = new Acciones(motor.jc);
    this.costa = generarCosta();
    this.isla = generarIsla();
    this._clic = false;
    this._onClic = () => { if (!this.motor.jc.estado.conectado) this._clic = true; };
  }

  async entrar() {
    this.t = 0;
    // Cada visitante empieza de cero: la ruta se dibuja según esto.
    this.motor.expedicion.etapasCompletadas = [];
    this.motor.expedicion.puntajes = {};
    window.addEventListener('mousedown', this._onClic);
    this.motor.audio && this.motor.audio.musica('intro');
  }

  salir() { window.removeEventListener('mousedown', this._onClic); }

  actualizar(dt) {
    this.t += dt;
    const confirmo = this._clic || (this.motor.jc.estado.conectado && this.acciones.confirmar());
    this._clic = false;
    if (this.t > 2.4 && confirmo) {
      this.motor.audio && this.motor.audio.sfx('avanzar');
      this.motor.ir('ruta');
    }
  }

  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;
    c.fillStyle = PALETA.fondoHondo;
    c.fillRect(0, 0, W, H);

    // El territorio respira al fondo, apenas visible.
    c.save();
    c.globalAlpha = 0.18 + Math.sin(this.t * 0.5) * 0.04;
    const trazar = (pts, ox = 0, oy = 0) => {
      c.beginPath();
      pts.forEach((p, i) => {
        const x = (p.x + ox) * W, y = (p.y + oy) * H;
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      });
      c.closePath();
      c.fillStyle = PALETA.territorio;
      c.fill();
      c.strokeStyle = PALETA.costa;
      c.lineWidth = 1.5;
      c.stroke();
    };
    trazar(this.costa);
    const isla = REGIONES.find((r) => r.id === 'isla');
    trazar(this.isla, isla.x, isla.y);
    c.restore();

    vineta(c, W, H, 0.7);

    const cx = W / 2;
    const ancho = Math.min(700, W * 0.72);
    c.textAlign = 'center';
    c.textBaseline = 'top';

    // ---------- medir para centrar el bloque completo
    c.font = '58px ' + FUENTE.narrativa;
    const altoTitulo = 66;
    const altoSub = 30;
    c.font = 'italic 18px ' + FUENTE.narrativa;
    const lineasPremisa = partirLineas(c, 'Así marcaban los mapas antiguos las zonas que nadie había recorrido. ' +
      'No quería decir que no hubiera nada. Quería decir que nadie había ido a ver.', ancho);
    const altoPremisa = lineasPremisa.length * 27 + 30;
    const altoPie = 60;
    const totalBloque = altoTitulo + altoSub + altoPremisa + altoPie;
    let y = Math.max(50, (H - totalBloque) / 2 - 20);

    // ---------- título
    const aT = suave(Math.min(1, this.t / 1.2));
    c.globalAlpha = aT;
    c.font = '58px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tinta;
    c.fillText('TERRA INCÓGNITA', cx, y);
    y += altoTitulo;

    c.font = 'italic 18px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.oro;
    c.fillText('Un recorrido por dentro de la compañía', cx, y);
    y += altoSub;
    c.globalAlpha = 1;

    // ---------- premisa
    if (this.t > 1.0) {
      c.globalAlpha = suave(Math.min(1, (this.t - 1.0) / 1.4));
      c.font = 'italic 18px ' + FUENTE.narrativa;
      c.fillStyle = PALETA.tintaTenue;
      lineasPremisa.forEach((l, i) => c.fillText(l, cx, y + 20 + i * 27));
      c.globalAlpha = 1;
    }
    y += altoPremisa;

    // ---------- llamada a la acción
    if (this.t > 2.4) {
      const nombre = this.motor.jc.estado.conectado ? this.acciones.nombreConfirmar : 'CLIC';
      c.font = '16px ' + FUENTE.interfaz;
      c.fillStyle = Math.sin(this.t * 4) > -0.4 ? PALETA.oro : PALETA.tintaDebil;
      c.fillText('Pulsa ' + nombre + ' para empezar', cx, y + 16);
    }

    // ---------- estado del mando, abajo y centrado de verdad
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    if (this.motor.jc.estado.conectado) {
      etiqueta(c, (this.motor.jc.esIzquierdo ? 'Joy-Con L' : 'Joy-Con R') + ' conectado',
        cx, H - 28, PALETA.tintaDebil, 10);
    } else {
      etiqueta(c, 'Sin mando · modo ratón', cx, H - 28, PALETA.tintaDebil, 10);
    }

    grano(c, W, H);
  }
}

/**
 * calibrar.js — Calibrar los Joy-Con en juego, desde el menú principal
 * (Controles → «Calibrar mandos»).
 *
 * Dos momentos:
 *   quieto — se piden los mandos quietos sobre una mesa y se mide el sesgo
 *            del giroscopio de cada uno (JoyCon.calibrar): una barra por mando.
 *            Si alguien lo mueve, la medida vuelve a empezar; si en 8 s no se
 *            logra, se avisa y se puede reintentar;
 *   prueba — cada jugador ve su punto de linterna moverse con su mando: si el
 *            mando está quieto, el punto también. HOME / CAPTURA recentra.
 *
 * Controles: gatillo (o Enter) termina; A / ↓ del Joy-Con (o C) calibra otra
 * vez; + / − (o Esc) vuelve al menú.
 *
 * Solo se calibran los mandos EN JUEGO (los de reserva no transmiten el
 * giroscopio; se calibran solos al entrar en juego).
 */

import { Escena } from '../../core/engine.js';
import { Puntero, Acciones } from '../../core/input.js';
import {
  FUENTE, MENU, grano, vineta, limitar, fondoMenu, tituloMenu, textoMenu, cajaMenu,
} from '../../core/render.js';

const COLOR_J = ['#f0c977', '#7fc4f0'];
const GRACIA = 0.4;

export class EscenaCalibrar extends Escena {
  constructor(motor) {
    super(motor);
    this.acciones = motor.jugadores.map((j) => new Acciones(j));
    this.punteros = motor.jugadores.map((j) => new Puntero(j));
    this._teclas = [];
    this._onTecla = (e) => {
      if (e.repeat) return;
      if (['Enter', 'Escape', 'c', 'C', ' '].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        this._teclas.push(e.key);
      }
    };
    // Resultado de cada mando: 'midiendo' | 'listo' | 'fallo'
    this._alCalibrar = motor.jugadores.map((_, i) => () => { this.estado[i] = 'listo'; this._revisar(); });
    this._alFallar = motor.jugadores.map((_, i) => () => { this.estado[i] = 'fallo'; this._revisar(); });
  }

  get audio() { return this.motor.audio; }

  /** Los que están en juego ahora mismo (índices de ranura). */
  get _enJuego() { return this.motor.jugadores.map((j, i) => (j.estado.conectado ? i : -1)).filter((i) => i >= 0); }

  async entrar() {
    this.t = 0;
    this._teclas = [];
    this.motor.jugadores.forEach((j, i) => {
      j.addEventListener('calibrado', this._alCalibrar[i]);
      j.addEventListener('calibracion-incompleta', this._alFallar[i]);
    });
    window.addEventListener('keydown', this._onTecla, true);
    this._empezar();
  }

  salir() {
    this.motor.jugadores.forEach((j, i) => {
      j.removeEventListener('calibrado', this._alCalibrar[i]);
      j.removeEventListener('calibracion-incompleta', this._alFallar[i]);
    });
    window.removeEventListener('keydown', this._onTecla, true);
  }

  /** Empieza (o repite) la medida en todos los mandos en juego. */
  _empezar() {
    this.fase = 'quieto';
    this.tFase = 0;
    this.estado = this.motor.jugadores.map(() => null);
    for (const i of this._enJuego) {
      this.estado[i] = 'midiendo';
      this.motor.jugadores[i].calibrar();
    }
    this.audio && this.audio.sfx('fase');
  }

  _revisar() {
    const ids = this._enJuego;
    if (ids.length && ids.every((i) => this.estado[i] === 'listo' || this.estado[i] === 'fallo')) {
      if (ids.every((i) => this.estado[i] === 'listo')) {
        this.fase = 'prueba';
        this.tFase = 0;
        this.punteros.forEach((p) => p.recentrar());
        for (const i of ids) this.motor.jugadores[i].pulso(380, 0.6, 140);
        this.audio && this.audio.sfx('especial');
      } else {
        this.audio && this.audio.sfx('error');
      }
    }
  }

  _volver() {
    this.audio && this.audio.sfx('avanzar');
    this.motor.ir('intro');
  }

  actualizar(dt) {
    this.t += dt;
    this.tFase += dt;
    const teclas = this._teclas;
    this._teclas = [];

    let listo = false, otraVez = false, volver = false;
    for (const k of teclas) {
      if (k === 'Enter' || k === ' ') listo = true;
      else if (k === 'c' || k === 'C') otraVez = true;
      else if (k === 'Escape') volver = true;
    }
    for (const i of this._enJuego) {
      const a = this.acciones[i];
      if (a.confirmar()) listo = true;
      if (a.secundario()) otraVez = true;
      if (a.cancelar()) volver = true;
      if (a.pideRecentrar()) this.punteros[i].recentrar();
    }
    if (this.tFase < GRACIA) return;

    if (volver) { this._volver(); return; }
    if (otraVez) { this._empezar(); return; }
    // Sin mandos, o ya probado: el gatillo / Enter termina. Midiendo, no.
    if (listo && (this.fase === 'prueba' || !this._enJuego.length || this._hayFallo)) this._volver();

    if (this.fase === 'prueba') {
      const W = this.motor.ancho, H = this.motor.alto;
      for (const i of this._enJuego) this.punteros[i].actualizar(W, H, 20, dt);
    }
  }

  get _hayFallo() { return this.estado && this.estado.some((e) => e === 'fallo'); }

  // ------------------------------------------------------------- dibujar
  get _s() { return limitar(this.motor.alto / 820, 0.8, 1.35); }

  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;
    const s = this._s, cx = W / 2;
    fondoMenu(c, W, H);
    vineta(c, W, H, 0.45);
    c.textAlign = 'center';
    tituloMenu(c, 'Calibrar mandos', cx, Math.max(56, H * 0.1), Math.round(64 * s));

    const ids = this._enJuego;
    c.textBaseline = 'top';
    c.font = 'bold ' + Math.round(24 * s) + 'px ' + MENU.letra;
    const sub = !ids.length
      ? 'No hay ningún Joy-Con en juego'
      : this.fase === 'quieto'
        ? 'Deja los Joy-Con quietos sobre una mesa'
        : 'Listo. Prueba la linterna: mueve tu Joy-Con';
    c.fillStyle = 'rgba(0,0,0,0.85)';
    c.fillText(sub, cx + 2, H * 0.1 + 46 * s + 2);
    c.fillStyle = '#fff3cf';
    c.fillText(sub, cx, H * 0.1 + 46 * s);
    c.font = Math.round(19 * s) + 'px ' + FUENTE.interfaz;
    c.fillStyle = '#d6c8a2';
    const ayuda = !ids.length
      ? 'Conéctalo en la pantalla de inicio o con la tecla J. Los de reserva se calibran solos al entrar en juego.'
      : this.fase === 'quieto'
        ? 'No toques el stick. Se mide el desvío del giroscopio y el centro del stick (corrige el drift).'
        : 'Con el mando quieto, su punto también debe quedarse quieto. HOME o CAPTURA recentra el punto.';
    c.fillText(ayuda, cx, H * 0.1 + 84 * s);

    if (this.fase === 'prueba') this._dibujarPrueba(c, W, H, s);
    else if (ids.length) this._dibujarMedida(c, W, H, s, ids);

    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    const pie = !ids.length
      ? 'Gatillo, Enter o Esc: volver'
      : this.fase === 'prueba'
        ? 'Gatillo o Enter: terminar   ·   A / ↓ del Joy-Con o C: calibrar otra vez   ·   + / − o Esc: volver'
        : this._hayFallo
          ? 'A / ↓ del Joy-Con o C: intentar otra vez   ·   Gatillo o Enter: dejarlo así'
          : '+ / − o Esc: volver';
    textoMenu(c, pie, cx, H - 24 * s, Math.round(19 * s),
      Math.sin(this.t * 4) > -0.45 ? '#f0c977' : 'rgba(205,187,138,0.6)');
    grano(c, W, H);
  }

  /** Una tarjeta por mando con su barra de avance. */
  _dibujarMedida(c, W, H, s, ids) {
    const cx = W / 2;
    const wT = Math.min(380 * s, (W - 80) / ids.length - 30), hT = 190 * s, sep = 40 * s;
    const total = ids.length * wT + (ids.length - 1) * sep;
    const y = H * 0.1 + 150 * s;
    ids.forEach((i, n) => {
      const jc = this.motor.jugadores[i];
      const x = cx - total / 2 + n * (wT + sep);
      const est = this.estado[i];
      cajaMenu(c, x, y, wT, hT, { relleno: est === 'listo' ? 'rgba(10,40,30,0.85)' : est === 'fallo' ? 'rgba(60,14,8,0.85)' : 'rgba(8,5,3,0.84)' });
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.font = 'bold ' + Math.round(26 * s) + 'px ' + MENU.letra;
      c.fillStyle = COLOR_J[i];
      c.fillText('JUGADOR ' + (i + 1), x + wT / 2, y + 18 * s);
      textoMenu(c, 'Joy-Con ' + (jc.esIzquierdo ? 'izquierdo' : 'derecho'), x + wT / 2, y + 56 * s, Math.round(20 * s), MENU.beige);
      // barra
      const bx = x + 28 * s, bw = wT - 56 * s, by = y + 100 * s, bh = 18 * s;
      const p = est === 'listo' ? 1 : est === 'fallo' ? 0 : jc.progresoCalibracion;
      c.fillStyle = 'rgba(255,255,255,0.1)';
      c.fillRect(bx, by, bw, bh);
      c.fillStyle = est === 'fallo' ? '#e0614a' : est === 'listo' ? '#4ec9a5' : '#f6a92c';
      c.fillRect(bx, by, bw * p, bh);
      c.strokeStyle = MENU.beigeBorde;
      c.lineWidth = 1;
      c.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      const texto = est === 'listo' ? '✓ Calibrado'
        : est === 'fallo' ? 'No quedó quieto. Intenta otra vez'
          : p > 0 ? 'Midiendo… no lo muevas' : 'Esperando que esté quieto…';
      textoMenu(c, texto, x + wT / 2, y + 136 * s, Math.round(20 * s),
        est === 'listo' ? '#7fe0c0' : est === 'fallo' ? '#ffab94' : '#f0c977');
    });
  }

  /** La prueba: el punto de linterna de cada jugador, con su color. */
  _dibujarPrueba(c, W, H, s) {
    for (const i of this._enJuego) {
      const p = this.punteros[i];
      const g = c.createRadialGradient(p.x, p.y, 4, p.x, p.y, 90 * s);
      g.addColorStop(0, 'rgba(255,240,200,0.55)');
      g.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(p.x, p.y, 90 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = COLOR_J[i];
      c.beginPath(); c.arc(p.x, p.y, 12 * s, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#1e0402';
      c.lineWidth = 3;
      c.stroke();
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      textoMenu(c, 'J' + (i + 1), p.x, p.y - 18 * s, Math.round(20 * s), COLOR_J[i]);
    }
  }
}

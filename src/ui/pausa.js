/**
 * pausa.js — El menú de pausa. Se abre con Esc (o + / − en el Joy-Con)
 * desde cualquier etapa, y congela la escena de abajo hasta que se sale.
 *
 * Antes, Esc mandaba directo al inicio: una tecla que se pulsa sin querer
 * tiraba a la basura la partida de un visitante. Ahora volver al inicio es una
 * opción del menú, y Esc solo pausa.
 */

import { Acciones } from '../core/input.js';
import { fondoMenu, tituloMenu } from '../core/render.js';
import { Menu } from './menu.js';

/** Escenas que no se pausan: la portada ya es un menú. */
// En la portada y al elegir jugadores / escribir nombres, + y − sirven para
// volver atrás (lo maneja la propia pantalla), no para pausar.
const SIN_PAUSA = new Set(['intro', 'jugadores', 'calibrar']);

export class Pausa {
  /**
   * @param {Motor} motor
   * @param {object} acciones funciones que dependen del navegador (main.js):
   *   pantallaCompleta(), estaEnPantallaCompleta(), salirDePantallaCompleta()
   */
  constructor(motor, acciones = {}) {
    this.motor = motor;
    this.nav = acciones;
    this.abierta = false;
    this.t = 0;
    this.acciones = motor.jugadores.map((j) => new Acciones(j));
    this.menu = new Menu(motor, { alVolver: () => this.cerrar() });
  }

  /** ¿Se puede pausar ahora? Ni en la portada, ni en mitad de un cambio de escena. */
  get posible() {
    const m = this.motor;
    return !!m.escena && !m._transicionando && !SIN_PAUSA.has(m.nombreEscena) && m.escena !== m.cinematicas;
  }

  abrir() {
    if (this.abierta || !this.posible) return;
    this.abierta = true;
    this.t = 0;
    this._cal = null;
    const au = this.motor.audio;
    this.menu.mostrar([
      { texto: 'Continuar', accion: () => this.cerrar() },
      { texto: 'Reiniciar esta etapa', accion: () => this._ir(this.motor.nombreEscena) },
      // Si la linterna se desvía en plena partida: se calibra aquí mismo, con
      // el juego en pausa y los mandos quietos sobre la mesa.
      { texto: () => this._textoCalibrar(), accion: () => this._calibrar() },
      {
        texto: () => 'Pantalla completa: ' + (this.nav.estaEnPantallaCompleta && this.nav.estaEnPantallaCompleta() ? 'Sí' : 'No'),
        accion: () => {
          if (this.nav.estaEnPantallaCompleta && this.nav.estaEnPantallaCompleta()) this.nav.salirDePantallaCompleta();
          else if (this.nav.pantallaCompleta) this.nav.pantallaCompleta();
        },
      },
      {
        texto: () => 'Música: ' + (au && au.silenciado ? 'No' : 'Sí'),
        accion: () => au && au.alternarSilencio(),
      },
      { texto: 'Volver al inicio', accion: () => this._ir('intro') },
    ]);
    this.menu.activar();
  }

  cerrar() {
    if (!this.abierta) return;
    this.abierta = false;
    this.menu.desactivar();
  }

  alternar() { this.abierta ? this.cerrar() : this.abrir(); }

  /** Calibra todos los Joy-Con en juego (JoyCon.calibrar), sin salir de la etapa. */
  _calibrar() {
    const js = this.motor.jugadores.filter((j) => j.estado.conectado);
    this._cal = { total: js.length, listos: 0, fallos: 0 };
    for (const j of js) {
      const bien = () => { quitar(); this._cal && this._cal.listos++; };
      const mal = () => { quitar(); this._cal && this._cal.fallos++; };
      const quitar = () => { j.removeEventListener('calibrado', bien); j.removeEventListener('calibracion-incompleta', mal); };
      j.addEventListener('calibrado', bien);
      j.addEventListener('calibracion-incompleta', mal);
      j.calibrar();
    }
  }

  _textoCalibrar() {
    const c = this._cal;
    if (!c) return 'Calibrar mandos';
    if (!c.total) return 'Calibrar: no hay Joy-Con en juego';
    if (c.listos + c.fallos < c.total) {
      const p = Math.min(...this.motor.jugadores.filter((j) => j.estado.conectado).map((j) => j.progresoCalibracion));
      return 'Calibrando… ' + Math.round(p * 100) + '% · no los muevas';
    }
    return c.fallos ? '✗ Se movieron: calibrar otra vez' : '✓ Mandos calibrados';
  }

  _ir(nombre) {
    this.cerrar();
    this.motor.ir(nombre);
  }

  /**
   * Con el juego corriendo: ¿alguien pidió pausa desde el mando? (+ o −).
   * Va antes de que la escena consuma las pulsaciones del fotograma.
   */
  vigilar() {
    if (!this.posible) return;
    for (const [i, a] of this.acciones.entries()) {
      if (this.motor.jugadores[i].estado.conectado && a.cancelar()) { this.abrir(); return; }
    }
  }

  actualizar(dt) {
    this.t += dt;
    this.menu.actualizar(dt);
  }

  /** Encima de la escena congelada: la oscurece y pone el menú. */
  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;
    c.save();
    c.globalAlpha = 0.78;
    fondoMenu(c, W, H);
    c.globalAlpha = 1;
    c.textAlign = 'center';
    tituloMenu(c, 'PAUSA', W / 2, Math.max(70, H * 0.2), Math.min(96, W * 0.09));
    this.menu.dibujar(c, W / 2, Math.max(140, H * 0.2) + Math.min(80, W * 0.07), Math.min(460, W * 0.8), Math.min(28, Math.max(20, H * 0.03)));
    c.restore();
  }
}

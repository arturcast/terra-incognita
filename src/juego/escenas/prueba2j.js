/**
 * prueba2j.js — Sala de prueba de dos jugadores. Para el operador, no para el
 * visitante: se abre con la tecla P o desde el panel de mandos (tecla J).
 *
 * Existe para comprobar en el navegador, con los mandos reales, todo lo que
 * necesitan las etapas de dos jugadores antes de construir ninguna:
 *
 *  - dos linternas a la vez, cada una con su mando;
 *  - pantalla partida con `motor.enRanura`, escrita una sola vez para un
 *    jugador y pintada en cada mitad;
 *  - gatillos independientes, y cada uno vibra solo en su mando;
 *  - que si un mando se desconecta, el otro sigue jugando a pantalla completa.
 *
 * Es también la plantilla mínima de una escena de dos jugadores.
 */

import { Escena } from '../../core/engine.js';
import { Puntero, Acciones } from '../../core/input.js';
import { PALETA, FUENTE, rectRedondeado, grano } from '../../core/render.js';

const COLOR = [PALETA.oro, PALETA.senal];
const RADIO_LUZ = 70;

export class EscenaPrueba2J extends Escena {
  /** Declara cuántos jugadores admite. Ver docs/MULTIJUGADOR.md. */
  static jugadores = 'uno-o-dos';

  constructor(motor) {
    super(motor);
    // Uno por ranura, creados una sola vez: guardan referencia al JoyCon de su
    // ranura, que nunca se reemplaza aunque cambie el mando físico.
    this.punteros = motor.jugadores.map((j) => new Puntero(j));
    this.acciones = motor.jugadores.map((j) => new Acciones(j));
  }

  async entrar() {
    this.t = 0;
    this.marcador = this.motor.jugadores.map(() => ({ aciertos: 0, fallos: 0, blanco: null, destello: 0 }));
    this.punteros.forEach((p) => p.recentrar());
    this._n = 0;
    this.motor.audio && this.motor.audio.musica('exploracion');
  }

  /** Ranura en pantalla de cada jugador conectado. Si solo hay uno, ocupa todo. */
  _reparto() {
    const activos = this.motor.jugadoresActivos;
    return activos.map((i, k) => ({ i, rect: this.motor.ranura(k, activos.length) }));
  }

  _nuevoBlanco(rect) {
    const m = 90;
    return {
      x: m + Math.random() * Math.max(1, rect.ancho - 2 * m),
      y: 120 + Math.random() * Math.max(1, rect.alto - 240),
      r: 42,
      ancho: rect.ancho,
    };
  }

  actualizar(dt) {
    this.t += dt;
    const reparto = this._reparto();

    // Si entra o sale un jugador, las mitades cambian de tamaño: se recentra
    // todo para que nadie empiece con la linterna fuera de su zona.
    if (reparto.length !== this._n) {
      this._n = reparto.length;
      this.punteros.forEach((p) => p.recentrar());
      this.marcador.forEach((m) => { m.blanco = null; });
    }

    for (const { i, rect } of reparto) {
      const p = this.punteros[i], a = this.acciones[i], m = this.marcador[i];
      const jc = this.motor.jugadores[i];
      p.actualizar(rect.ancho, rect.alto, 24, dt);
      if (a.pideRecentrar()) p.recentrar();
      if (!m.blanco || m.blanco.ancho !== rect.ancho) m.blanco = this._nuevoBlanco(rect);
      m.destello = Math.max(0, m.destello - dt * 3);

      if (a.confirmar()) {
        if (Math.hypot(p.x - m.blanco.x, p.y - m.blanco.y) < m.blanco.r) {
          m.aciertos++;
          m.destello = 1;
          m.blanco = this._nuevoBlanco(rect);
          jc.pulso(380, 0.6, 80);           // vibra SOLO el mando de este jugador
          this.motor.audio && this.motor.audio.sfx('descubrir');
        } else {
          m.fallos++;
          jc.pulso(150, 0.3, 50);
          this.motor.audio && this.motor.audio.sfx('error');
        }
      }
    }
  }

  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;
    c.fillStyle = PALETA.fondoHondo;
    c.fillRect(0, 0, W, H);

    const reparto = this._reparto();
    if (!reparto.length) {
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = '20px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tintaTenue;
      c.fillText('No hay ningún mando en juego. Pulsa J y asigna Jugador 1 y Jugador 2.', W / 2, H / 2);
      return;
    }

    for (const { i } of reparto) {
      const k = reparto.findIndex((x) => x.i === i);
      this.motor.enRanura(k, reparto.length, (cx, r) => this._dibujarJugador(cx, r, i));
    }

    // Pie común a las dos mitades.
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.font = '13px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tintaDebil;
    c.fillText('SALA DE PRUEBA · apunta y pulsa el gatillo · HOME/CAPTURA recentra · Esc sale',
      W / 2, H - 14);
    grano(c, W, H);
  }

  /** Todo en coordenadas locales de la mitad: el motor ya recortó y trasladó. */
  _dibujarJugador(c, r, i) {
    const jc = this.motor.jugadores[i];
    const p = this.punteros[i], m = this.marcador[i];
    const col = COLOR[i % COLOR.length];

    c.fillStyle = PALETA.fondo;
    c.fillRect(0, 0, r.ancho, r.alto);
    if (m.destello > 0) {
      c.fillStyle = 'rgba(78,201,165,' + (m.destello * 0.12).toFixed(3) + ')';
      c.fillRect(0, 0, r.ancho, r.alto);
    }

    // cabecera
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.font = 'bold 22px ' + FUENTE.interfaz;
    c.fillStyle = col;
    c.fillText('JUGADOR ' + (i + 1), 22, 20);
    c.font = '13px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tintaTenue;
    c.fillText((jc.esIzquierdo ? 'Joy-Con L' : 'Joy-Con R') + ' · ' + jc.estado.hz + ' Hz', 22, 50);

    c.textAlign = 'right';
    c.font = 'bold 40px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tinta;
    c.fillText(String(m.aciertos), r.ancho - 22, 16);
    c.font = '12px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tintaDebil;
    c.fillText('aciertos · ' + m.fallos + ' fallos', r.ancho - 22, 62);

    // blanco
    if (m.blanco) {
      c.strokeStyle = PALETA.exito;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(m.blanco.x, m.blanco.y, m.blanco.r, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = PALETA.exito;
      c.beginPath();
      c.arc(m.blanco.x, m.blanco.y, 8, 0, Math.PI * 2);
      c.fill();
    }

    // linterna
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, RADIO_LUZ);
    g.addColorStop(0, 'rgba(255,255,255,0.10)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(p.x, p.y, RADIO_LUZ, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(p.x, p.y, RADIO_LUZ, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(p.x - 12, p.y); c.lineTo(p.x + 12, p.y);
    c.moveTo(p.x, p.y - 12); c.lineTo(p.x, p.y + 12);
    c.stroke();

    // marco de la mitad
    c.strokeStyle = 'rgba(255,255,255,0.06)';
    c.lineWidth = 1;
    rectRedondeado(c, 0.5, 0.5, r.ancho - 1, r.alto - 1, 0);
    c.stroke();
  }
}

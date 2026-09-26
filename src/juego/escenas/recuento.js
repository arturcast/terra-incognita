/**
 * recuento.js — Al terminar las tres etapas: cuántos puntos hizo cada
 * jugador, cómo le fue, su nombre y su puesto en la tabla de los mejores.
 *
 * Tres momentos:
 *   conteo — los puntos suben etapa por etapa, con sonido; al final el total
 *            y una frase de cómo le fue a cada uno; con dos, quién ganó.
 *   nombre — solo si no lo pusieron al empezar (escenas/jugadores.js), p.
 *            ej. al saltar a una etapa con las teclas del operador: cada
 *            jugador pone su nombre con letras de arcade (ui/nombre.js).
 *   tabla  — los diez mejores del stand, con los recién llegados resaltados.
 * Después sigue el cierre de siempre (la revelación final).
 *
 * Controles para el nombre:
 *   Joy-Con: stick o ↑/↓ (X/B en el derecho) cambian la letra; gatillo o →
 *            (A en el derecho) pasa a la siguiente; ← (Y) borra.
 *   Teclado: se escribe directo; o ↑/↓ cambian la letra y → o Espacio la
 *            ponen; ← o Retroceso borran; Enter termina.
 * Elegir la letra ✓ también termina.
 */

import { Escena } from '../../core/engine.js';
import { Acciones } from '../../core/input.js';
import {
  FUENTE, MENU, grano, vineta, suave, limitar, fondoMenu, tituloMenu, textoMenu, cajaMenu,
} from '../../core/render.js';
import { recuento, TablaPuntajes, ETAPAS_RECUENTO } from '../../datos/puntajes.js';
import { EditorNombre, ordenesDeTeclas, ordenesDeMandos, dibujarEditor } from '../../ui/nombre.js';
import { nombreDe, textoGana } from '../../ui/jugadores.js';

const ORO = '#f0c977';
const COLOR_J = ['#f0c977', '#7fc4f0'];
const TIEMPO_ETAPA = 0.9;          // s que tarda en subir cada etapa

export class EscenaRecuento extends Escena {
  constructor(motor) {
    super(motor);
    /** Video de cierre de la historia: assets/cinematicas/final.mp4 (opcional). */
    this.cinematica = 'final';
    this.acciones = motor.jugadores.map((j) => new Acciones(j));
    this._teclas = [];
    // En captura, y frenando la tecla: mientras se escribe un nombre, la P no
    // abre la sala de prueba ni la M silencia la música.
    this._onTecla = (e) => {
      if (e.key === 'Escape' || e.key === 'F9' || (e.repeat && e.key.length !== 1)) return;
      this._teclas.push(e.key);
      if (this.fase === 'nombre') { e.preventDefault(); e.stopPropagation(); }
    };
    this._clic = false;
    this._onClic = () => { this._clic = true; };
  }

  get audio() { return this.motor.audio; }

  /** Los nombres, como listas de letras (uno por jugador). */
  get nombres() { return this.editores.map((e) => e.letras); }

  async entrar() {
    const puntajes = this.motor.expedicion.puntajes || {};
    this.r = recuento(puntajes);
    this.tabla = new TablaPuntajes();
    this.fase = 'conteo';
    this.t = 0;
    this.tFase = 0;
    this._ultimaEtapa = -1;
    this.editores = this.r.jugadores.map(() => new EditorNombre());
    // ¿Ya los pusieron al empezar? Entonces no se vuelven a pedir.
    const previos = this.motor.expedicion.nombres || [];
    this.conNombres = this.r.jugadores.every((_, k) => !!previos[k]);
    if (this.conNombres) this.editores.forEach((e, k) => { e.letras = previos[k].split(''); });
    this.puestos = [];
    this.turno = 0;              // quién escribe su nombre
    this._estadoMandos = { espera: 0 };
    this._teclas = [];
    window.addEventListener('keydown', this._onTecla, true);
    window.addEventListener('mousedown', this._onClic);
    this.audio && this.audio.musica('revelacion');
  }

  salir() {
    window.removeEventListener('keydown', this._onTecla, true);
    window.removeEventListener('mousedown', this._onClic);
  }

  // ------------------------------------------------------------ entrada
  /** Lo que pidió el jugador que tiene el turno, en órdenes simples. */
  _ordenes(dt) {
    const o = ordenesDeTeclas(this._teclas);
    this._teclas = [];
    if (this._clic) { o.push('siguiente'); this._clic = false; }
    // En el conteo y la tabla sirve el mando de cualquiera; al poner el
    // nombre, solo el del jugador que tiene el turno.
    // Al escribir el nombre, SOLO el Joy-Con de quien tiene el turno (o el
    // teclado): izquierdo y derecho son de jugadores distintos.
    const quienes = this.fase === 'nombre' ? [this.turno] : [0, 1];
    o.push(...ordenesDeMandos(this.motor, this.acciones, quienes, this._estadoMandos, dt));
    return o;
  }

  actualizar(dt) {
    this.t += dt;
    this.tFase += dt;
    const ordenes = this._ordenes(dt);
    const avanza = ordenes.some((x) => x === 'siguiente' || x === 'listo');

    if (this.fase === 'conteo') {
      const etapa = Math.floor(this.tFase / TIEMPO_ETAPA);
      if (etapa !== this._ultimaEtapa && etapa <= ETAPAS_RECUENTO.length) {
        this._ultimaEtapa = etapa;
        this.audio && this.audio.sfx(etapa < ETAPAS_RECUENTO.length ? 'avanzar' : 'especial');
      }
      const fin = (ETAPAS_RECUENTO.length + 1) * TIEMPO_ETAPA;
      if (avanza && this.tFase < fin) this.tFase = fin;            // adelantar el conteo
      else if (avanza && this.tFase > fin + 0.6) {
        if (this.conNombres) {
          this.r.jugadores.forEach((_, k) => this._anotar(k));
          this._aFase('tabla');
        } else this._aFase('nombre');
      }
      return;
    }

    if (this.fase === 'nombre') {
      for (const o of ordenes) this._escribir(o);
      return;
    }

    if (this.fase === 'tabla' && avanza && this.tFase > 1.2) {
      this.audio && this.audio.sfx('avanzar');
      this.motor.ir('cierre', this.motor.expedicion.puntajes.mapa || null);
    }
  }

  _aFase(fase) {
    this.fase = fase;
    this.tFase = 0;
    this.audio && this.audio.sfx('fase');
  }

  _escribir(o) {
    if (this.editores[this.turno].aplicar(o, this.audio)) this._terminarNombre();
  }

  /** Anota en la tabla al jugador `k` con su nombre. */
  _anotar(k) {
    const j = this.r.jugadores[k];
    this.puestos[k] = this.tabla.anotar(this.editores[k].texto, j.total, j.porEtapa);
  }

  _terminarNombre() {
    this._anotar(this.turno);
    this.audio && this.audio.sfx('especial');
    if (this.turno + 1 < this.r.jugadores.length) {
      this.turno++;
      this.tFase = 0;
    } else {
      this._aFase('tabla');
    }
  }

  // ------------------------------------------------------------- dibujar
  get _s() { return limitar(this.motor.alto / 820, 0.8, 1.35); }

  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;
    fondoMenu(c, W, H);
    vineta(c, W, H, 0.45);
    if (this.fase === 'conteo') this._dibujarConteo(c, W, H);
    else if (this.fase === 'nombre') this._dibujarNombre(c, W, H);
    else this._dibujarTabla(c, W, H);
    grano(c, W, H);
  }

  _pie(c, W, H, texto) {
    const s = this._s;
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    textoMenu(c, texto, W / 2, H - 24, Math.round(21 * s), Math.sin(this.t * 4) > -0.45 ? ORO : 'rgba(205,187,138,0.5)');
  }

  _dibujarConteo(c, W, H) {
    const s = this._s, cx = W / 2;
    const J = this.r.jugadores;
    c.textAlign = 'center';
    tituloMenu(c, J.length > 1 ? 'Cómo le fue a cada uno' : 'Cómo te fue', cx, Math.max(50, H * 0.1), Math.round(60 * s));

    const sep = 30 * s;
    const anchoCol = Math.min(560 * s, (W - 80 - sep * (J.length - 1)) / J.length);
    const total = anchoCol * J.length + sep * (J.length - 1);
    const y0 = Math.max(110, H * 0.1 + 60 * s);
    const alto = 430 * s;
    J.forEach((j, k) => {
      const x = cx - total / 2 + k * (anchoCol + sep);
      const gana = this.r.ganador === k;
      cajaMenu(c, x, y0, anchoCol, alto, { relleno: gana ? 'rgba(70,24,8,0.88)' : 'rgba(8,5,3,0.85)' });
      const mx = x + anchoCol / 2;
      let y = y0 + 22 * s;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.font = 'bold ' + Math.round(24 * s) + 'px ' + MENU.letra;
      c.fillStyle = COLOR_J[k];
      c.fillText(nombreDe(this.motor, k), mx, y);
      y += 50 * s;

      // una fila por etapa, que se llena a su turno
      let acumulado = 0;
      ETAPAS_RECUENTO.forEach((e, n) => {
        const valor = j.porEtapa[e.id];
        const k01 = limitar((this.tFase - n * TIEMPO_ETAPA) / (TIEMPO_ETAPA * 0.8), 0, 1);
        const mostrado = valor === null ? null : Math.round(valor * suave(k01));
        acumulado += mostrado || 0;
        c.textAlign = 'left';
        textoMenu(c, e.nombre, x + 26 * s, y, Math.round(24 * s), k01 > 0 ? MENU.beige : 'rgba(205,187,138,0.35)');
        c.textAlign = 'right';
        textoMenu(c, mostrado === null ? '—' : mostrado.toLocaleString('es-CO'), x + anchoCol - 26 * s, y,
          Math.round(24 * s), k01 > 0 ? ORO : 'rgba(205,187,138,0.35)');
        y += 48 * s;
      });

      c.strokeStyle = 'rgba(240,201,119,0.5)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x + 26 * s, y); c.lineTo(x + anchoCol - 26 * s, y);
      c.stroke();
      y += 18 * s;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      textoMenu(c, 'TOTAL', mx, y, Math.round(18 * s), MENU.beigeBorde);
      y += 30 * s;
      // el total late un poco cuando termina de subir
      const listo = this.tFase > ETAPAS_RECUENTO.length * TIEMPO_ETAPA;
      const late = listo ? 1 + Math.sin(this.t * 5) * 0.03 : 1;
      c.save();
      c.translate(mx, y + 38 * s);
      c.scale(late, late);
      tituloMenu(c, acumulado.toLocaleString('es-CO'), 0, 0, Math.round(76 * s));
      c.restore();
      y += 92 * s;
      if (listo) {
        c.globalAlpha = suave(Math.min(1, (this.tFase - ETAPAS_RECUENTO.length * TIEMPO_ETAPA) / 0.6));
        c.textAlign = 'center';
        c.textBaseline = 'top';
        c.font = 'italic bold ' + Math.round(24 * s) + 'px ' + FUENTE.narrativa;
        c.fillStyle = 'rgba(0,0,0,0.85)';
        c.fillText(j.titulo, mx + 2, y + 2);
        c.fillStyle = gana ? '#fff3cf' : ORO;
        c.fillText(j.titulo, mx, y);
        c.globalAlpha = 1;
      }
    });

    const fin = (ETAPAS_RECUENTO.length + 1) * TIEMPO_ETAPA;
    if (this.tFase > fin - 0.3 && J.length > 1) {
      const texto = this.r.ganador < 0 ? '¡Empate!' : textoGana(this.motor, this.r.ganador);
      const k = suave(Math.min(1, (this.tFase - fin + 0.3) / 0.5));
      c.save();
      c.globalAlpha = k;
      c.translate(cx, y0 + alto + 50 * s);
      c.scale(0.6 + k * 0.4, 0.6 + k * 0.4);
      c.textAlign = 'center';
      tituloMenu(c, texto, 0, 0, Math.round(56 * s));
      c.restore();
    }
    if (this.tFase > fin + 0.6) {
      this._pie(c, W, H, 'Pulsa el gatillo, Espacio o Enter para ' +
        (this.conNombres ? 'ver la tabla de los mejores' : 'poner tu nombre'));
    }
  }

  _dibujarNombre(c, W, H) {
    const s = this._s, cx = W / 2;
    const j = this.r.jugadores[this.turno];
    c.textAlign = 'center';
    tituloMenu(c, 'Escribe tu nombre', cx, Math.max(50, H * 0.11), Math.round(60 * s));
    c.textBaseline = 'top';
    c.font = 'bold ' + Math.round(28 * s) + 'px ' + MENU.letra;
    c.fillStyle = COLOR_J[this.turno];
    c.fillText('JUGADOR ' + j.jugador + ' · ' + j.total.toLocaleString('es-CO') + ' puntos', cx, H * 0.11 + 50 * s);
    dibujarEditor(c, W, H, this.editores[this.turno], { cx, y: H * 0.42, s, t: this.t });
  }

  _dibujarTabla(c, W, H) {
    const s = this._s, cx = W / 2;
    c.textAlign = 'center';
    tituloMenu(c, 'Mejores expediciones', cx, Math.max(50, H * 0.1), Math.round(60 * s));

    // el puesto de cada uno, arriba
    c.textBaseline = 'top';
    let yP = Math.max(90, H * 0.1 + 44 * s);
    this.r.jugadores.forEach((j, k) => {
      const nombre = this.nombres[k].join('');
      c.font = 'bold ' + Math.round(24 * s) + 'px ' + MENU.letra;
      c.fillStyle = COLOR_J[k];
      const p = this.puestos[k];
      c.fillText(nombre + ': ' + (p === 1 ? '¡el mejor puntaje del stand!' : 'puesto ' + p), cx, yP);
      yP += 34 * s;
    });

    const filas = this.tabla.mejores(10);
    const ancho = Math.min(760 * s, W - 60);
    const altoFila = 44 * s;
    const y0 = yP + 14 * s;
    cajaMenu(c, cx - ancho / 2, y0, ancho, filas.length * altoFila + 30 * s, { relleno: 'rgba(8,5,3,0.85)' });
    filas.forEach((f, i) => {
      const y = y0 + 15 * s + i * altoFila;
      const nuevo = this.puestos.includes(i + 1);
      // los recién llegados entran deslizándose y quedan resaltados
      const k = nuevo ? suave(Math.min(1, this.tFase / 0.7)) : 1;
      if (nuevo) {
        c.fillStyle = 'rgba(130,38,12,0.75)';
        c.fillRect(cx - ancho / 2 + 10, y, ancho - 20, altoFila - 6);
      }
      c.save();
      c.translate((1 - k) * 60, 0);
      c.globalAlpha = k;
      c.textBaseline = 'top';
      const col = nuevo ? '#fff3cf' : MENU.beige;
      c.textAlign = 'left';
      textoMenu(c, (i + 1) + '.', cx - ancho / 2 + 28 * s, y + 6 * s, Math.round(24 * s), ORO);
      textoMenu(c, f.nombre, cx - ancho / 2 + 90 * s, y + 6 * s, Math.round(24 * s), col);
      c.textAlign = 'right';
      textoMenu(c, f.puntos.toLocaleString('es-CO'), cx + ancho / 2 - 28 * s, y + 6 * s, Math.round(24 * s), nuevo ? ORO : col);
      c.restore();
    });
    if (this.tFase > 1.2) this._pie(c, W, H, 'Pulsa el gatillo, Espacio o Enter para seguir');
  }
}

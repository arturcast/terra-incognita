/**
 * jugadores.js — Antes de salir: el modo, quién es quién y cómo se llaman.
 *
 * Pedido del usuario (2026-09-25/26): elegir de una si se juega solo o de a
 * dos; vincular los mandos con una pantalla estilo Nintendo Switch; y poner el
 * nombre aquí, no al final. Lo elegido queda en `motor.expedicion.jugadores`
 * y `motor.expedicion.nombres`, y lo respetan El Camino, El Regreso y el
 * recuento (ui/jugadores.js). El Mapa lo juega siempre el Jugador 1.
 *
 * Fases:
 *   cuantos  — menú «Un jugador / Dos jugadores»;
 *   vincular — cada jugador mantiene pulsados el gatillo y el botón de hombro
 *              de SU Joy-Con (ZL + L o ZR + R): el primero que lo hace es el
 *              Jugador 1, el siguiente el Jugador 2. El mando vibra y se le
 *              encienden las luces con su número, como en la Switch. Sin
 *              Joy-Con, con el teclado: Espacio el Jugador 1, ↑ el Jugador 2;
 *   nombre   — cada uno escribe su nombre con SU mando (o con el teclado).
 *
 * UN JOY-CON POR JUGADOR: de cualquier lado, y un mando es de un solo jugador.
 * Nada del juego necesita dos mandos juntos.
 */

import { Escena } from '../../core/engine.js';
import { Acciones } from '../../core/input.js';
import {
  FUENTE, MENU, grano, vineta, limitar, fondoMenu, tituloMenu, textoMenu, cajaMenu, rectRedondeado,
} from '../../core/render.js';
import { Menu } from '../../ui/menu.js';
import { ladoDe } from '../../ui/jugadores.js';
import {
  EditorNombre, ordenesDeTeclas, ordenesDeMandos, dibujarEditor,
} from '../../ui/nombre.js';

const COLOR_J = ['#f0c977', '#7fc4f0'];
/** Nadie escribe ni se vincula con la pulsación que eligió en el menú. */
const GRACIA = 0.3;
/** Segundos que se ve «¡Listos!» antes de pasar a los nombres. */
const PAUSA_LISTOS = 1.3;

export class EscenaJugadores extends Escena {
  constructor(motor) {
    super(motor);
    this.acciones = motor.jugadores.map((j) => new Acciones(j));
    this.menu = new Menu(motor, { alVolver: () => this._volverAlInicio() });
    this._teclas = [];
    this._clic = false;
    // En captura y frenando la tecla mientras se vincula o se escribe: así la
    // P no abre la sala de prueba, la M no silencia y la J no abre el panel.
    this._onTecla = (e) => {
      if (this.fase !== 'nombre' && this.fase !== 'vincular') return;
      if (e.key === 'F9' || (e.repeat && e.key.length !== 1)) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') { this._volver = true; return; }
      this._teclas.push(e.key);
    };
    this._onClic = (e) => {
      // «＋ Conectar otro Joy-Con»: la ventana de Chrome se pide aquí mismo,
      // dentro del clic (si no, no aparece).
      if (this.fase === 'vincular' && this._rectConectar && e) {
        const r = this.motor.canvas.getBoundingClientRect ? this.motor.canvas.getBoundingClientRect() : { left: 0, top: 0 };
        const x = e.clientX - r.left, y = e.clientY - r.top, b = this._rectConectar;
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { this._conectarOtro(); return; }
      }
      if (this.fase === 'nombre' || this.fase === 'vincular') this._clic = true;
    };
    this._onRegistro = (ev) => this._registrarReserva(ev.detail.entrada);
  }

  get audio() { return this.motor.audio; }

  /** @param {{destino?: string}} datos a qué escena se va después (por omisión, el recorrido). */
  async entrar(datos) {
    this.destino = (datos && datos.destino) || 'ruta';
    this.t = 0;
    this.tFase = 0;
    this.cuantos = 1;
    this.vinculos = [];
    this.editores = [];
    this.turno = 0;
    this._estadoMandos = { espera: 0 };
    this._volver = false;
    this.aviso = null;
    this._cuantos();
    window.addEventListener('keydown', this._onTecla, true);
    window.addEventListener('mousedown', this._onClic);
    if (this.motor.gestor) this.motor.gestor.addEventListener('registro', this._onRegistro);
  }

  salir() {
    this.menu.desactivar();
    window.removeEventListener('keydown', this._onTecla, true);
    window.removeEventListener('mousedown', this._onClic);
    if (this.motor.gestor) this.motor.gestor.removeEventListener('registro', this._onRegistro);
  }

  _volverAlInicio() {
    this.audio && this.audio.sfx('avanzar');
    this.motor.ir('intro');
  }

  // ------------------------------------------------------------ el modo
  _cuantos() {
    this.fase = 'cuantos';
    this.tFase = 0;
    this.menu.mostrar([
      { texto: 'Un jugador', accion: () => this._empezarVinculo(1) },
      { texto: 'Dos jugadores', accion: () => this._empezarVinculo(2) },
      { texto: '‹ Volver', accion: () => this._volverAlInicio() },
    ], [
      'El Mapa lo juega el Jugador 1. El Camino y El Regreso, los que elijan aquí.',
      'Cada jugador usa un Joy-Con (o el teclado).',
    ], '¿Cuántos juegan?');
    this.menu.activar();
  }

  // -------------------------------------------------------- la vinculación
  _empezarVinculo(n) {
    this.cuantos = n;
    this.vinculos = Array.from({ length: n }, () => null);
    this.menu.desactivar();
    this.fase = 'vincular';
    this.tFase = 0;
    this._teclas = [];
    this._clic = false;
    this.aviso = null;
    this.audio && this.audio.sfx('fase');
  }

  /**
   * Abre la ventana de Chrome para autorizar otro Joy-Con. Sale antes de
   * pantalla completa (ahí la ventana puede no verse) sin abrir la pausa.
   */
  _conectarOtro() {
    const g = this.motor.gestor;
    if (!g || !g.disponible) return;
    if (typeof document !== 'undefined' && document.fullscreenElement && this.motor.salirDePantallaCompleta) {
      this.motor.salirDePantallaCompleta();
    }
    g.autorizar().then((id) => {
      if (id) this.aviso = { t: 4, texto: '✓ Joy-Con conectado. Ahora mantén pulsados su gatillo y su botón de hombro.', bien: true };
    }).catch((err) => {
      this.aviso = { t: 4, texto: 'No se pudo abrir la ventana de mandos: ' + err.message };
    });
  }

  /** Primer jugador sin mando todavía, o -1. */
  get _libre() { return this.vinculos.findIndex((v) => !v); }

  /** ¿Este Joy-Con ya es de alguien? (un mando, un solo jugador) */
  _yaVinculado(id) { return this.vinculos.some((v) => v && v.id === id); }

  /** Un Joy-Con de reserva (no en juego) hizo gatillo + hombro. */
  _registrarReserva(entrada) {
    if (this.fase !== 'vincular' || this.tFase < GRACIA) return;
    this._vincularJoyCon(entrada.id, entrada.esIzquierdo);
  }

  /**
   * Vincula un Joy-Con al primer jugador libre y lo pone en juego en su ranura.
   * Vibra y enciende sus luces con el número de jugador.
   */
  _vincularJoyCon(id, esIzquierdo) {
    const k = this._libre;
    if (k < 0 || this._yaVinculado(id)) return;
    const v = { tipo: 'joycon', id, esIzquierdo, estado: 'vinculando' };
    this.vinculos[k] = v;
    this.audio && this.audio.sfx('elegir');
    const g = this.motor.gestor;
    const listo = () => {
      v.estado = 'listo';
      const jc = this.motor.jugadores[k];
      if (jc && jc.estado.conectado) {
        jc.pulso(380, 0.7, 180);
        if (jc.luzJugador) jc.luzJugador(k + 1);
      }
      this._revisarListos();
    };
    // Sin gestor (pruebas) o si ese mando ya está en esa ranura: nada que mover.
    if (!g || g.ranuras[k] === id) { listo(); return; }
    g.activar(id, k).then((ok) => {
      if (this.vinculos[k] !== v) return;           // se volvió atrás mientras tanto
      if (ok) listo();
      else {
        this.vinculos[k] = null;
        this.aviso = { t: 3, texto: 'Ese Joy-Con no respondió. Vuelve a mantener pulsados los dos botones.' };
        this.audio && this.audio.sfx('error');
      }
    });
  }

  /** Sin Joy-Con: Espacio o W el Jugador 1 (juega con WASD); ↑ el Jugador 2 (flechas). */
  _vincularTeclado(k) {
    if (k >= this.cuantos || this.vinculos[k]) return;
    this.vinculos[k] = { tipo: 'teclado', estado: 'listo', esquema: k === 0 ? 'W A S D' : 'flechas ← → ↑' };
    this.audio && this.audio.sfx('elegir');
    this._revisarListos();
  }

  _revisarListos() {
    if (this.vinculos.every((v) => v && v.estado === 'listo')) {
      this.fase = 'listos';
      this.tFase = 0;
      this.audio && this.audio.sfx('especial');
    }
  }

  /**
   * Deja las ranuras como quedó la vinculación: quien juega con teclado no
   * tiene mando en su ranura, y en modo de un jugador no queda Jugador 2.
   */
  _asentarRanuras() {
    const g = this.motor.gestor;
    if (!g) return;
    for (let r = 0; r < g.ranuras.length; r++) {
      const v = this.vinculos[r];
      if ((!v || v.tipo === 'teclado') && g.ranuras[r]) g.liberarRanura(r);
    }
  }

  _actualizarVinculo(dt) {
    // Volver: Esc, o + / − de cualquier Joy-Con conectado.
    for (const [i, a] of this.acciones.entries()) {
      const jc = this.motor.jugadores[i];
      if (jc && jc.estado.conectado && a.cancelar() && this.tFase > GRACIA) this._volver = true;
    }
    if (this._volver) { this._volver = false; this._cuantos(); return; }
    if (this.aviso) { this.aviso.t -= dt; if (this.aviso.t <= 0) this.aviso = null; }

    const teclas = this._teclas;
    this._teclas = [];
    const clic = this._clic;
    this._clic = false;
    if (this.tFase < GRACIA) return;

    // Joy-Con ya en juego (en una ranura): gatillo + hombro mantenidos.
    const g = this.motor.gestor;
    this.motor.jugadores.forEach((jc, i) => {
      if (!jc.estado.conectado) return;
      if (!(jc.pulsado(jc.bitGatillo) && jc.pulsado(jc.bitHombro))) return;
      const id = g ? g.ranuras[i] : 'ranura' + i;
      if (id && !this._yaVinculado(id)) this._vincularJoyCon(id, jc.esIzquierdo);
    });

    // Teclado de respaldo.
    for (const k of teclas) {
      if (k === ' ' || k === 'w' || k === 'W' || k === 'Enter') this._vincularTeclado(0);
      else if (k === 'ArrowUp') this._vincularTeclado(this.cuantos > 1 ? 1 : 0);
    }
    if (clic) this._vincularTeclado(0);
  }

  // ------------------------------------------------------------ los nombres
  _empezarNombres() {
    this._asentarRanuras();
    this.editores = Array.from({ length: this.cuantos }, () => new EditorNombre());
    this.turno = 0;
    this.fase = 'nombre';
    this.tFase = 0;
    this._teclas = [];
    this._clic = false;
    this.audio && this.audio.sfx('fase');
  }

  actualizar(dt) {
    this.t += dt;
    this.tFase += dt;

    if (this.fase === 'cuantos') {
      if (this.t > 0.4) this.menu.actualizar(dt);
      return;
    }
    if (this.fase === 'vincular') { this._actualizarVinculo(dt); return; }
    if (this.fase === 'listos') {
      if (this.tFase >= PAUSA_LISTOS) this._empezarNombres();
      return;
    }
    if (this.fase !== 'nombre') return;

    // Volver a vincular: Esc, o + / − del Joy-Con.
    for (const [i, a] of this.acciones.entries()) {
      const jc = this.motor.jugadores[i];
      if (jc && jc.estado.conectado && a.cancelar() && this.tFase > GRACIA) this._volver = true;
    }
    if (this._volver) { this._volver = false; this._empezarVinculo(this.cuantos); return; }
    const ordenes = ordenesDeTeclas(this._teclas);
    this._teclas = [];
    if (this._clic) { ordenes.push('siguiente'); this._clic = false; }
    // Cada jugador escribe SOLO con su propio Joy-Con (o con el teclado).
    ordenes.push(...ordenesDeMandos(this.motor, this.acciones, [this.turno], this._estadoMandos, dt));
    if (this.tFase < GRACIA) return;

    for (const o of ordenes) {
      if (!this.editores[this.turno].aplicar(o, this.audio)) continue;
      this.audio && this.audio.sfx('especial');
      if (this.turno + 1 < this.cuantos) {
        this.turno++;
        this.tFase = 0;
        return;
      }
      this._listo();
      return;
    }
  }

  _listo() {
    const ex = this.motor.expedicion;
    ex.jugadores = this.cuantos;
    ex.nombres = this.editores.map((e) => e.texto);
    this.fase = 'saliendo';
    this.audio && this.audio.sfx('avanzar');
    // La cinemática de inicio (assets/cinematicas/inicio.mp4) abre la
    // expedición completa; si se salta a una etapa, no.
    this.motor.ir(this.destino, null, this.destino === 'ruta' ? { cinematica: 'inicio' } : {});
  }

  // ------------------------------------------------------------- dibujar
  get _s() { return limitar(this.motor.alto / 820, 0.8, 1.35); }

  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;
    fondoMenu(c, W, H);
    vineta(c, W, H, 0.45);
    if (this.fase === 'cuantos') this._dibujarCuantos(c, W, H);
    else if (this.fase === 'vincular' || this.fase === 'listos') this._dibujarVinculo(c, W, H);
    else this._dibujarNombre(c, W, H);
    grano(c, W, H);
  }

  _dibujarCuantos(c, W, H) {
    const s = this._s, cx = W / 2;
    c.textAlign = 'center';
    tituloMenu(c, 'La expedición', cx, Math.max(60, H * 0.14), Math.round(72 * s));
    const tam = Math.round(Math.min(32, Math.max(22, H * 0.034)));
    const ancho = Math.min(820, W * 0.9);
    const y = Math.max(H * 0.14 + 70 * s, (H - this.menu.medirAlto(tam)) / 2);
    this.menu.dibujar(c, cx, y, ancho, tam);
  }

  /**
   * La vinculación, estilo Switch: una tarjeta por jugador con un Joy-Con
   * dibujado. Mientras espera, los botones de arriba (gatillo y hombro) laten
   * para decir dónde pulsar; al vincularse, el mando se pinta del color del
   * jugador, con sus luces encendidas y un ✓.
   */
  _dibujarVinculo(c, W, H) {
    const s = this._s, cx = W / 2;
    c.textAlign = 'center';
    tituloMenu(c, this.fase === 'listos' ? '¡Listos!' : 'Vincula los mandos', cx, Math.max(56, H * 0.1), Math.round(64 * s));
    c.textBaseline = 'top';
    c.font = 'bold ' + Math.round(24 * s) + 'px ' + MENU.letra;
    c.fillStyle = 'rgba(0,0,0,0.85)';
    const sub = 'Mantén pulsados a la vez el gatillo y el botón de hombro de tu Joy-Con';
    c.fillText(sub, cx + 2, H * 0.1 + 46 * s + 2);
    c.fillStyle = '#fff3cf';
    c.fillText(sub, cx, H * 0.1 + 46 * s);
    c.font = Math.round(19 * s) + 'px ' + FUENTE.interfaz;
    c.fillStyle = '#d6c8a2';
    c.fillText('ZL + L en el izquierdo · ZR + R en el derecho · el primero es el Jugador 1', cx, H * 0.1 + 84 * s);

    // tarjetas
    const n = this.cuantos;
    const wT = Math.min(320 * s, (W - 80) / n - 30), hT = Math.min(400 * s, H * 0.52);
    const sep = 40 * s;
    const total = n * wT + (n - 1) * sep;
    const yT = H * 0.1 + 124 * s;
    for (let k = 0; k < n; k++) {
      const x = cx - total / 2 + k * (wT + sep);
      this._tarjeta(c, x, yT, wT, hT, k, s);
    }

    // pie: teclado de respaldo, falta de mandos, volver
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    const g = this.motor.gestor;
    this._rectConectar = null;
    if (this.aviso) {
      textoMenu(c, this.aviso.texto, cx, H - 64 * s, Math.round(20 * s), this.aviso.bien ? '#7fe0c0' : '#ffab94');
    } else if (g && g.disponible && this.fase === 'vincular') {
      // Botón para autorizar otro Joy-Con desde aquí (con el ratón).
      c.font = 'bold ' + Math.round(20 * s) + 'px ' + MENU.letra;
      const texto = '＋ Conectar otro Joy-Con (clic aquí)';
      const bw = c.measureText(texto).width + 44 * s, bh = 40 * s;
      const bx = cx - bw / 2, by = H - 64 * s - bh * 0.75;
      cajaMenu(c, bx, by, bw, bh, { relleno: 'rgba(60,18,8,0.88)' });
      c.textBaseline = 'middle';
      textoMenu(c, texto, cx, by + bh / 2, Math.round(20 * s), '#ffd98a');
      c.textBaseline = 'bottom';
      this._rectConectar = { x: bx, y: by, w: bw, h: bh };
    }
    textoMenu(c, 'Sin Joy-Con: Jugador 1 pulsa Espacio' + (n > 1 ? ' · Jugador 2 pulsa ↑' : '') +
      '   ·   Esc o + / −: volver', cx, H - 26 * s, Math.round(18 * s), MENU.beigeBorde);
  }

  _tarjeta(c, x, y, w, h, k, s) {
    const v = this.vinculos[k];
    const listo = v && v.estado === 'listo';
    const col = COLOR_J[k];
    cajaMenu(c, x, y, w, h, { relleno: listo ? 'rgba(40,24,8,0.9)' : 'rgba(8,5,3,0.82)', brillo: listo ? 1 : 0.55 });
    // borde del color del jugador cuando ya tiene mando
    if (listo) {
      c.save();
      c.strokeStyle = col;
      c.lineWidth = 3;
      c.strokeRect(x + 6, y + 6, w - 12, h - 12);
      c.restore();
    }
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = 'bold ' + Math.round(28 * s) + 'px ' + MENU.letra;
    c.fillStyle = 'rgba(0,0,0,0.85)';
    c.fillText('JUGADOR ' + (k + 1), x + w / 2 + 2, y + 18 * s + 2);
    c.fillStyle = col;
    c.fillText('JUGADOR ' + (k + 1), x + w / 2, y + 18 * s);

    const mx = x + w / 2, my = y + h * 0.5;
    if (v && v.tipo === 'teclado') {
      this._teclado(c, mx, my, s, col);
    } else {
      this._joycon(c, mx, my, s, v, col, k);
    }

    // estado, abajo de la tarjeta
    c.textBaseline = 'bottom';
    let texto, color;
    if (!v) {
      texto = this._libre === k ? 'Esperando…' : 'Después del Jugador ' + k;
      color = this._libre === k && Math.sin(this.t * 4) > -0.3 ? '#f0c977' : 'rgba(205,187,138,0.55)';
    } else if (v.estado === 'vinculando') {
      texto = 'Vinculando…';
      color = '#9fd0ff';
    } else if (v.tipo === 'teclado') {
      texto = '✓ Teclado · ' + v.esquema;
      color = '#7fe0c0';
    } else {
      texto = '✓ Joy-Con ' + (v.esIzquierdo ? 'izquierdo' : 'derecho');
      color = '#7fe0c0';
    }
    textoMenu(c, texto, x + w / 2, y + h - 18 * s, Math.round(22 * s), color);
  }

  /**
   * Un Joy-Con de pie, visto de frente: cuerpo redondeado, stick, cuatro
   * botones, las luces del riel y, arriba, el hombro y el gatillo (lo que hay
   * que pulsar), que laten mientras espera.
   */
  _joycon(c, mx, my, s, v, col, k) {
    const w = 78 * s, h = 210 * s;
    const listo = v && v.estado === 'listo';
    const izq = v ? v.esIzquierdo : (k === 0);
    const x = mx - w / 2, y = my - h / 2 + 8 * s;
    const entra = listo ? 1 + 0.06 * Math.max(0, 1 - this.tFase * 3) : 1;
    c.save();
    c.translate(mx, my);
    c.scale(entra, entra);
    c.translate(-mx, -my);

    // hombro y gatillo, arriba: laten si hay que pulsarlos
    const late = !v && this._libre === k ? 0.5 + 0.5 * Math.sin(this.t * 6) : 0;
    const colBoton = listo ? col : 'rgba(' + (180 + 75 * late | 0) + ',' + (140 + 80 * late | 0) + ',60,' + (0.55 + 0.45 * late) + ')';
    c.fillStyle = colBoton;
    rectRedondeado(c, x + 6 * s, y - 26 * s, w - 12 * s, 14 * s, 6 * s);   // gatillo (ZL/ZR)
    c.fill();
    rectRedondeado(c, x + 2 * s, y - 10 * s, w - 4 * s, 12 * s, 6 * s);    // hombro (L/R)
    c.fill();
    if (!v && this._libre === k) {
      c.font = 'bold ' + Math.round(15 * s) + 'px ' + FUENTE.interfaz;
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.fillStyle = '#ffd98a';
      c.fillText('ZL + L  ·  ZR + R', mx, y - 32 * s);
    }

    // cuerpo
    c.fillStyle = listo ? col : 'rgba(70,58,44,0.95)';
    rectRedondeado(c, x, y, w, h, 34 * s);
    c.fill();
    c.strokeStyle = listo ? '#fff3cf' : 'rgba(205,187,138,0.5)';
    c.lineWidth = 2;
    c.stroke();

    // stick y botones (arriba o abajo según el lado, como en el mando real)
    const yStick = izq ? y + h * 0.3 : y + h * 0.58;
    const yBotones = izq ? y + h * 0.58 : y + h * 0.3;
    c.fillStyle = 'rgba(20,14,8,0.85)';
    c.beginPath(); c.arc(mx, yStick, 16 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(60,48,36,0.9)';
    c.beginPath(); c.arc(mx, yStick, 10 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(20,14,8,0.85)';
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      c.beginPath(); c.arc(mx + dx * 15 * s, yBotones + dy * 15 * s, 6.5 * s, 0, Math.PI * 2); c.fill();
    }

    // luces del riel: tantas encendidas como el número del jugador
    const xl = izq ? x + w - 7 * s : x + 7 * s;
    for (let i = 0; i < 4; i++) {
      const encendida = listo && i < k + 1;
      c.fillStyle = encendida ? '#7fe0ff' : 'rgba(20,14,8,0.6)';
      c.beginPath(); c.arc(xl, y + h * 0.38 + i * 12 * s, 3.2 * s, 0, Math.PI * 2); c.fill();
    }
    c.restore();

    // el ✓ al vincularse
    if (listo) {
      const r = 22 * s;
      c.fillStyle = '#4ec9a5';
      c.beginPath(); c.arc(mx + w / 2 + 8 * s, y + 10 * s, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#0b2a20';
      c.lineWidth = 5 * s;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(mx + w / 2 + 8 * s - r * 0.45, y + 10 * s);
      c.lineTo(mx + w / 2 + 8 * s - r * 0.1, y + 10 * s + r * 0.38);
      c.lineTo(mx + w / 2 + 8 * s + r * 0.5, y + 10 * s - r * 0.4);
      c.stroke();
      c.lineCap = 'butt';
    }
  }

  /** Un teclado pequeño, para quien juega sin Joy-Con. */
  _teclado(c, mx, my, s, col) {
    const w = 210 * s, h = 96 * s;
    c.fillStyle = 'rgba(40,32,24,0.95)';
    rectRedondeado(c, mx - w / 2, my - h / 2, w, h, 12 * s);
    c.fill();
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = 'rgba(233,220,180,0.75)';
    for (let f = 0; f < 3; f++) {
      for (let i = 0; i < 9 - f; i++) {
        c.fillRect(mx - w / 2 + 14 * s + f * 9 * s + i * 20 * s, my - h / 2 + 14 * s + f * 22 * s, 15 * s, 15 * s);
      }
    }
  }

  _dibujarNombre(c, W, H) {
    const s = this._s, cx = W / 2;
    const k = this.turno;
    c.textAlign = 'center';
    tituloMenu(c, 'Escribe tu nombre', cx, Math.max(50, H * 0.11), Math.round(60 * s));
    c.textBaseline = 'top';
    c.font = 'bold ' + Math.round(30 * s) + 'px ' + MENU.letra;
    c.fillStyle = 'rgba(0,0,0,0.85)';
    c.fillText('JUGADOR ' + (k + 1), cx + 2, H * 0.11 + 52 * s + 2);
    c.fillStyle = COLOR_J[k];
    c.fillText('JUGADOR ' + (k + 1), cx, H * 0.11 + 52 * s);

    // con qué juega, para que lo sepa antes de salir
    const lado = ladoDe(this.motor, k);
    const v = this.vinculos[k];
    const como = lado
      ? 'Escribe con tu Joy-Con (' + lado + ')'
      : 'Escribe con el teclado · juegas con ' + (v && v.esquema ? v.esquema : k === 0 ? 'W A S D' : 'las flechas');
    c.font = Math.round(20 * s) + 'px ' + FUENTE.interfaz;
    c.fillStyle = '#d6c8a2';
    c.fillText(como, cx, H * 0.11 + 96 * s);

    const yFin = dibujarEditor(c, W, H, this.editores[k], { cx, y: H * 0.36, s, t: this.t });

    if (this.cuantos > 1) {
      // quién va: los dos nombres, el que ya está y el que falta
      c.textBaseline = 'middle';
      const yP = Math.min(H - 70 * s, yFin + 30 * s);
      for (let n = 0; n < this.cuantos; n++) {
        const texto = 'J' + (n + 1) + ': ' + (this.editores[n].texto || (n === k ? '…' : '—'));
        const x = cx + (n === 0 ? -1 : 1) * 170 * s;
        cajaMenu(c, x - 150 * s, yP - 22 * s, 300 * s, 44 * s, {
          relleno: n === k ? 'rgba(70,24,8,0.88)' : 'rgba(8,5,3,0.8)', brillo: n === k ? 1 : 0.5,
        });
        c.textAlign = 'center';
        textoMenu(c, texto, x, yP, Math.round(22 * s), COLOR_J[n]);
      }
    }
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    textoMenu(c, 'Esc o + / − del Joy-Con: volver a vincular los mandos', cx, H - 18, Math.round(16 * s), MENU.beigeBorde);
  }
}

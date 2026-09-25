/**
 * camino.js — ETAPA 2: "El Camino". Uno o dos jugadores.
 * Equivale a: ejecución con analítica de datos, de principio a fin.
 *
 * La lógica vive en src/juego/carrera.js (pura, probada en tests/camino.test.js).
 * Aquí solo hay mando, pantalla y sonido.
 *
 * Fases: guia -> cuenta -> carrera -> tablero -> revelacion
 *
 * Durante el juego no se dice "hallazgo" (regla de oro): lo rojo es "algo
 * escondido" o "descubrimientos". La palabra se revela al final, en la
 * pantalla "Así trabajamos", cuando ya se vivió.
 */

import { Escena } from '../../core/engine.js';
import { Puntero, Acciones } from '../../core/input.js';
import { Briefing, partirLineas } from '../../core/briefing.js';
import { PALETA, FUENTE, rectRedondeado, grano, suave, limitar } from '../../core/render.js';
import {
  CAMINO, ESTACIONES, generarCamino, Carrera, carrilDesdePuntero, ganador,
} from '../carrera.js';

const COLOR_J = [PALETA.oro, PALETA.senal];
/**
 * Segundos que el tablero se queda sí o sí. Quien llega a la meta suele venir
 * pulsando el gatillo para analizar, y esa pulsación se saltaba el tablero
 * antes de verlo (lo encontró tests/humo.test.js). Lo que se pulse durante
 * este tiempo se descarta.
 */
const BLOQUEO_TABLERO = 3;
/**
 * Si la pintura 3D no llega a estos fotogramas por segundo durante este rato,
 * se vuelve a la vista 2D en mitad de la carrera. Más vale una etapa fea que
 * una etapa a tirones delante de la gente.
 */
const FPS_MINIMO = 40;
const SEGUNDOS_LENTOS = 3;
const AZUL_DATO = '#5aa9e6';
const ROJO = '#ff5a4a';

/** Lo que el visitante hizo, traducido a lo que hace el área. Pantalla final. */
const ASI_TRABAJAMOS = [
  { que: '◆ Los datos crudos', es: 'Sacamos la información directo de la base de datos, no de lo que el proceso reporta de sí mismo.' },
  { que: 'La lente', es: 'La analizamos con herramientas como Power BI y cruzamos las cifras del proceso con las nuestras.' },
  { que: '✓ Los carteles', es: 'Revisamos los controles y el manual… pero lo que importa casi nunca está ahí.' },
  { que: 'El camino completo', es: 'Recorremos el proceso de principio a fin: desde donde entra el gas hasta donde llega la plata.' },
  { que: 'Lo que brilló en rojo', es: 'Se llama HALLAZGO: lo escondido, lo que nadie estaba viendo. Con él se construyen las conclusiones.' },
  { que: 'Los muros', es: 'Y sí: siempre aparece una excusa en el camino.' },
];

export class EscenaCamino extends Escena {
  static jugadores = 'uno-o-dos';

  constructor(motor) {
    super(motor);
    this.punteros = motor.jugadores.map((j) => new Puntero(j));
    this.acciones = motor.jugadores.map((j) => new Acciones(j));

    this.guia = new Briefing({
      etiqueta: 'Etapa 2 · El Camino',
      titulo: 'Recorre el proceso de principio a fin',
      entrada: 'Tus equipos llegaron. Ahora hay que caminar todo el proceso: desde donde entra el gas hasta donde llega la plata, y ver con tus propios ojos qué pasa en cada tramo.',
      pasos: [
        'Apunta el Joy-Con hacia un carril para moverte: izquierda, centro o derecha.',
        'Recoge los ◆ azules: son los datos tal como salen de la fuente.',
        'Pulsa el gatillo para ANALIZAR: gasta datos y hace visible lo que está escondido en el camino. Lo que brille en rojo, atrápalo.',
        'Los carteles «✓ Todo en orden» suman poco. Esquiva los muros: son las excusas de siempre, y te hacen perder datos.',
      ],
      aviso: 'Pueden jugar dos, en el mismo camino. Gana quien encuentre más de lo que estaba escondido.',
      continuar: 'Jugador 1: pulsa {B} para empezar',
      minimo: 1.2,
    });

    // Teclado y ratón: respaldo si no hay mando, y para ensayar sin él.
    /**
     * Vista 3D (Three.js). Se intenta al entrar; si no se puede, queda en null
     * y la etapa se dibuja en 2D exactamente como antes. Ver
     * `src/juego/camino3d/vista3d.js` y docs/PLAN-GRAFICO-CAMINO.md.
     */
    this.vista3d = null;
    this._dt = 1 / 60;
    this._lentos = 0;

    this.teclado = { carril: 1, analizar: false, confirmar: false };
    this.raton = { x: null, clic: false };
    this._onTecla = (e) => {
      if (e.key === 'ArrowLeft') this.teclado.carril = Math.max(0, this.teclado.carril - 1);
      else if (e.key === 'ArrowRight') this.teclado.carril = Math.min(2, this.teclado.carril + 1);
      else if (e.key === ' ') { this.teclado.analizar = true; this.teclado.confirmar = true; }
      else if (e.key === 'Enter') this.teclado.confirmar = true;
    };
    this._onMover = (e) => {
      const r = this.motor.canvas.getBoundingClientRect();
      this.raton.x = e.clientX - r.left;
    };
    this._onClic = () => { this.raton.clic = true; };
    this._onBotonReserva = (ev) => this._unirse(ev.detail.entrada);
  }

  get audio() { return this.motor.audio; }
  recentrarPuntero() { this.punteros.forEach((p) => p.recentrar()); }

  async entrar() {
    this.fase = 'guia';
    this.t = 0;
    this.tFase = 0;
    this.guia.reiniciar();
    this.carreras = [];
    this.participantes = [];
    this.avisos = [[], []];
    this.aviso2 = null;
    this.semilla = (Math.random() * 1e9) | 0;
    // Pista quieta de fondo para las instrucciones: se genera una sola vez.
    this._fondoGuia = new Carrera(generarCamino(this.semilla));
    this.recentrarPuntero();
    window.addEventListener('keydown', this._onTecla);
    window.addEventListener('mousemove', this._onMover);
    window.addEventListener('mousedown', this._onClic);
    if (this.motor.gestor) this.motor.gestor.addEventListener('botonReserva', this._onBotonReserva);
    this.audio && this.audio.musica('exploracion');

    this._lentos = 0;
    if (!this.vista3d) this.vista3d = await this._arrancar3D();
    if (this.vista3d) this.vista3d.mostrar(false);
  }

  /**
   * Intenta encender la vista 3D. Devuelve null si no se puede —en las pruebas
   * de Node no hay navegador, y en un equipo sin WebGL tampoco—, y eso no es
   * un error: la etapa se juega igual en 2D.
   */
  async _arrancar3D() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return null;
    const lienzo = document.getElementById('lienzo3d');
    if (!lienzo) return null;
    try {
      const { crearVista3D } = await import('../camino3d/vista3d.js');
      return await crearVista3D(lienzo);
    } catch (e) {
      console.warn('El Camino se juega en 2D:', e && e.message);
      return null;
    }
  }

  /** Vuelve al 2D sin cortar la partida. */
  _apagar3D(motivo) {
    if (!this.vista3d) return;
    console.warn('Vista 3D apagada:', motivo);
    this.vista3d.destruir();
    this.vista3d = null;
  }

  salir() {
    window.removeEventListener('keydown', this._onTecla);
    window.removeEventListener('mousemove', this._onMover);
    window.removeEventListener('mousedown', this._onClic);
    if (this.motor.gestor) this.motor.gestor.removeEventListener('botonReserva', this._onBotonReserva);
    if (this.vista3d) this.vista3d.mostrar(false);
  }

  /**
   * Alguien pulsó un botón en el mando de reserva: se une como jugador 2.
   * Así nadie tiene que tocar el teclado ni el panel F9.
   */
  async _unirse(entrada) {
    const g = this.motor.gestor;
    if (this.fase !== 'guia' || !g || g.ranuras[1]) return;
    const ok = await g.activar(entrada.id, 1);
    if (ok) {
      this.aviso2 = { t: 2.5 };
      this.audio && this.audio.sfx('elegir');
    }
  }

  // ----------------------------------------------------------- entrada
  /** ¿Alguien confirmó? Cualquier jugador conectado, teclado o ratón. */
  _confirmo() {
    let si = this.teclado.confirmar || this.raton.clic;
    for (const i of this.motor.jugadoresActivos) if (this.acciones[i].confirmar()) si = true;
    this.teclado.confirmar = false;
    this.raton.clic = false;
    return si;
  }

  _reparto() {
    const n = Math.max(1, this.participantes.length);
    return this.participantes.map((i, k) => ({ i, k, rect: this.motor.ranura(k, n) }));
  }

  // -------------------------------------------------------- actualizar
  actualizar(dt) {
    this.t += dt;
    this.tFase += dt;
    this._dt = dt;

    // Vigilancia de rendimiento: si el 3D no rinde, se cambia a 2D solo.
    if (this.vista3d && this.fase === 'carrera') {
      this._lentos = this.motor.fps < FPS_MINIMO ? this._lentos + dt : 0;
      if (this._lentos > SEGUNDOS_LENTOS) this._apagar3D('menos de ' + FPS_MINIMO + ' fps');
    }
    if (this.aviso2) { this.aviso2.t -= dt; if (this.aviso2.t <= 0) this.aviso2 = null; }
    for (const lista of this.avisos) for (const a of lista) a.vida -= dt;
    this.avisos = this.avisos.map((l) => l.filter((a) => a.vida > 0));

    // En las pantallas que se leen, las pulsaciones se consumen SIEMPRE, y solo
    // cuentan pasado el tiempo mínimo: una pulsación vieja nunca salta pantalla.
    if (this.fase === 'guia') {
      this.guia.actualizar(dt);
      const pulso = this._confirmo();
      if (this.guia.puedeContinuar && pulso) this._empezarCuenta();
      return;
    }

    if (this.fase === 'cuenta') {
      if (this.tFase >= 3) { this.fase = 'carrera'; this.tFase = 0; this.audio && this.audio.sfx('fase'); }
      this._moverPunteros(dt);
      return;
    }

    if (this.fase === 'carrera') {
      this._moverPunteros(dt);
      for (const { i, k, rect } of this._reparto()) {
        const c = this.carreras[k];
        c.actualizar(dt, this._carrilDe(i, k, rect, c), this._analiza(i));
        this._reaccionar(i, k, c.eventos);
      }
      // Lo pulsado durante la carrera no debe saltarse el tablero al llegar.
      this.teclado.analizar = false;
      this.teclado.confirmar = false;
      this.raton.clic = false;
      if (this.carreras.every((c) => c.terminada)) {
        this.resultados = this.carreras.map((c) => c.resultado());
        this.ganador = ganador(this.resultados);
        this.motor.expedicion.puntajes.camino = { resultados: this.resultados, ganador: this.ganador };
        this.fase = 'tablero';
        this.tFase = 0;
        this.audio && this.audio.musica('revelacion');
        this.audio && this.audio.sfx('revelar');
      }
      return;
    }

    if (this.fase === 'tablero') {
      const pulso = this._confirmo();
      if (this.tFase > BLOQUEO_TABLERO && pulso) {
        this.fase = 'revelacion';
        this.tFase = 0;
        this.audio && this.audio.sfx('avanzar');
      }
      return;
    }

    if (this.fase === 'revelacion') {
      const pulso = this._confirmo();
      if (this.tFase > 2 && pulso) {
        this.audio && this.audio.sfx('avanzar');
        this.motor.ir('ruta', { completada: 'camino' });
      }
    }
  }

  _empezarCuenta() {
    const activos = this.motor.jugadoresActivos;
    // Sin ningún mando se juega igual, con teclado o ratón, como jugador 1.
    this.participantes = activos.length ? activos : [0];
    const camino = generarCamino(this.semilla);   // el mismo para todos
    this.carreras = this.participantes.map(() => new Carrera(camino));
    this.recentrarPuntero();
    // Lo pulsado para empezar no cuenta como "analizar" en la carrera.
    this.teclado.analizar = false;
    this.raton.clic = false;
    this.fase = 'cuenta';
    this.tFase = 0;
    this.audio && this.audio.musica('carrera');
    this.audio && this.audio.sfx('fase');
  }

  _moverPunteros(dt) {
    for (const { i, rect } of this._reparto()) {
      if (this.motor.jugadores[i].estado.conectado) {
        this.punteros[i].actualizar(rect.ancho, rect.alto, 10, dt);
        if (this.acciones[i].pideRecentrar()) this.punteros[i].recentrar();
      }
    }
  }

  _carrilDe(i, k, rect, c) {
    if (this.motor.jugadores[i].estado.conectado) {
      return carrilDesdePuntero(this.punteros[i].x, rect.ancho, c.carril);
    }
    // Sin mando: ratón si se ha movido, si no las flechas.
    if (i === 0 && this.raton.x !== null && this.participantes.length === 1) {
      return carrilDesdePuntero(this.raton.x, rect.ancho, c.carril);
    }
    return this.teclado.carril;
  }

  _analiza(i) {
    if (this.motor.jugadores[i].estado.conectado && this.acciones[i].confirmar()) return true;
    return i === this.participantes[0] && (this.teclado.analizar || this.raton.clic);
  }

  /** Sonido, vibración y avisos en pantalla para lo que acaba de pasar. */
  _reaccionar(i, k, eventos) {
    const jc = this.motor.jugadores[i];
    const au = this.audio;
    const aviso = (texto, color, vida = 1.4) => this.avisos[k].push({ texto, color, vida, max: vida });
    for (const e of eventos) {
      switch (e.tipo) {
        case 'dato': au && au.sfx('dato'); break;
        case 'control':
          au && au.sfx('control');
          aviso('✓ Según el manual, todo en orden', PALETA.oroClaro, 1.1);
          break;
        case 'choque':
          au && au.sfx('choque');
          jc.pulso(90, 0.9, 180);
          aviso('«' + e.texto + '»', '#f0917e', 1.6);
          break;
        case 'lente':
          au && au.sfx('lente');
          jc.pulso(260, 0.4, 60);
          break;
        case 'sinDatos':
          au && au.sfx('error');
          aviso('Sin datos no hay nada que analizar', '#f0917e', 1.2);
          break;
        case 'hallazgo':
          au && au.sfx('especial');
          jc.pulso(480, 0.85, 160);
          aviso('¡Encontraste algo escondido!', ROJO, 1.6);
          break;
        case 'estacion':
          au && au.sfx('fase');
          aviso(ESTACIONES[e.estacion].nombre + ' · ' + ESTACIONES[e.estacion].que, PALETA.tinta, 2.2);
          break;
      }
    }
  }

  // ------------------------------------------------------------ dibujar
  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;

    // Con la vista 3D encendida, el mundo lo pinta WebGL en el lienzo de
    // atrás y aquí solo van los marcadores y los avisos, sobre transparente.
    const en3D = !!this.vista3d && (this.fase === 'cuenta' || this.fase === 'carrera') && this.carreras.length > 0;
    if (this.vista3d) this.vista3d.mostrar(en3D);
    if (en3D) {
      c.clearRect(0, 0, W, H);
      try {
        this.vista3d.redimensionar(W, H);
        this.vista3d.dibujar(this.carreras, this.participantes, this._dt);
      } catch (e) {
        this._apagar3D(e && e.message);
      }
    } else {
      c.fillStyle = PALETA.fondoHondo;
      c.fillRect(0, 0, W, H);
    }

    if (this.fase === 'guia') {
      this._dibujarFondoGuia(c, W, H);
      this.guia.dibujar(c, W, H, this._nombreBoton(0));
      this._dibujarUnion(c, W, H);
      return;
    }
    if (this.fase === 'revelacion') { this._dibujarRevelacion(c, W, H); grano(c, W, H); return; }

    const reparto = this._reparto();
    for (const { i, k } of reparto) {
      this.motor.enRanura(k, reparto.length, (cx, r) => {
        if (this.fase === 'tablero') this._dibujarTablero(cx, r, i, k);
        else if (en3D) {
          this._velo3D(cx, r);
          this._dibujarHud(cx, r, i, k, this.carreras[k], this._unidad(r), COLOR_J[i % 2]);
        }
        else this._dibujarPista(cx, r, i, k);
      });
    }
    if (this.fase === 'cuenta') this._dibujarCuenta(c, W, H);
    if (this.fase === 'tablero') this._dibujarGanador(c, W, H);
    if (!en3D) grano(c, W, H);
  }

  _nombreBoton(i) {
    const jc = this.motor.jugadores[i];
    return jc.estado.conectado ? this.acciones[i].nombreConfirmar : 'ENTER';
  }

  _dibujarFondoGuia(c, W, H) {
    // Una pista quieta al fondo, para que se intuya lo que viene.
    c.save();
    c.globalAlpha = 0.35;
    this._dibujarPista(c, { x: 0, y: 0, ancho: W, alto: H }, 0, 0, this._fondoGuia, true);
    c.restore();
  }

  /** Estado de los jugadores bajo las instrucciones: quién está listo. */
  _dibujarUnion(c, W, H) {
    const g = this.motor.gestor;
    const j2 = this.motor.jugadores[1];
    const texto = j2 && j2.estado.conectado
      ? 'Jugador 2 listo · ' + (j2.esIzquierdo ? 'Joy-Con L' : 'Joy-Con R')
      : (g && g.relevo
        ? '¿Juegan dos? Que el Jugador 2 pulse cualquier botón del otro Joy-Con'
        : 'Juega uno. Para jugar dos, enciende el otro Joy-Con');
    const listo = j2 && j2.estado.conectado;
    c.font = '15px ' + FUENTE.interfaz;
    const w = c.measureText(texto).width + 40;
    const x = (W - w) / 2, y = H - 64;
    c.fillStyle = listo ? 'rgba(90,169,230,0.16)' : 'rgba(255,255,255,0.05)';
    rectRedondeado(c, x, y, w, 38, 19);
    c.fill();
    c.strokeStyle = listo ? AZUL_DATO : 'rgba(255,255,255,0.12)';
    c.lineWidth = 1;
    c.stroke();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = listo ? AZUL_DATO : PALETA.tintaTenue;
    c.fillText(texto, W / 2, y + 19);
    if (this.aviso2) {
      c.font = 'bold 22px ' + FUENTE.interfaz;
      c.fillStyle = AZUL_DATO;
      c.fillText('¡El Jugador 2 se unió!', W / 2, y - 30);
    }
  }

  // ---------------------------------------------------------- la pista
  _unidad(r) { return Math.min(r.ancho / 900, r.alto / 1000) * 1.1; }

  /** Proyección en perspectiva: distancia por delante -> altura y escala. */
  _proy(dz, r) {
    const C = 7;
    const esc = C / (C + Math.max(-1.6, dz));
    const hz = r.alto * 0.3, base = r.alto * 0.84;
    return { y: hz + (base - hz) * esc, esc, hw: r.ancho * 0.4 * esc };
  }

  _xCarril(carril, p, r) { return r.ancho / 2 + (carril - 1) * (2 / 3) * p.hw; }

  _dibujarPista(c, r, i, k, carreraFija = null, soloFondo = false) {
    const car = carreraFija || this.carreras[k];
    const W = r.ancho, H = r.alto, u = this._unidad(r);
    const col = COLOR_J[i % 2];
    const lente = car.lente > 0;

    // cielo y suelo
    const cielo = c.createLinearGradient(0, 0, 0, H * 0.3);
    cielo.addColorStop(0, '#05070c');
    cielo.addColorStop(1, '#0f1b26');
    c.fillStyle = cielo;
    c.fillRect(0, 0, W, H * 0.3);
    c.fillStyle = '#0a121a';
    c.fillRect(0, H * 0.3, W, H * 0.7);

    // pista
    const cerca = this._proy(-1.6, r), lejos = this._proy(CAMINO.vista, r);
    c.beginPath();
    c.moveTo(W / 2 - cerca.hw, cerca.y);
    c.lineTo(W / 2 + cerca.hw, cerca.y);
    c.lineTo(W / 2 + lejos.hw, lejos.y);
    c.lineTo(W / 2 - lejos.hw, lejos.y);
    c.closePath();
    c.fillStyle = lente ? '#12263a' : '#16222e';
    c.fill();

    // carril al que apunta el jugador
    if (!soloFondo) {
      const p0 = this._proy(-1.6, r), p1 = this._proy(18, r);
      const x0 = this._xCarril(car.carril, p0, r), x1 = this._xCarril(car.carril, p1, r);
      c.beginPath();
      c.moveTo(x0 - p0.hw / 3, p0.y); c.lineTo(x0 + p0.hw / 3, p0.y);
      c.lineTo(x1 + p1.hw / 3, p1.y); c.lineTo(x1 - p1.hw / 3, p1.y);
      c.closePath();
      c.fillStyle = 'rgba(255,255,255,0.035)';
      c.fill();
    }

    // separadores de carril, en movimiento
    c.strokeStyle = 'rgba(232,217,181,0.22)';
    for (const lado of [-1, 1]) {
      const inicio = Math.floor(car.distancia / 6) * 6;
      for (let s = inicio; s < car.distancia + CAMINO.vista; s += 6) {
        const a = this._proy(s - car.distancia, r), b = this._proy(s + 3 - car.distancia, r);
        c.lineWidth = Math.max(1, 3 * a.esc);
        c.beginPath();
        c.moveTo(W / 2 + lado * a.hw / 3, a.y);
        c.lineTo(W / 2 + lado * b.hw / 3, b.y);
        c.stroke();
      }
    }
    // bordes
    c.strokeStyle = 'rgba(217,164,65,0.35)';
    c.lineWidth = 2;
    for (const lado of [-1, 1]) {
      c.beginPath();
      c.moveTo(W / 2 + lado * cerca.hw, cerca.y);
      c.lineTo(W / 2 + lado * lejos.hw, lejos.y);
      c.stroke();
    }

    // la lente: tinte y barrido
    if (lente) {
      const f = 1 - (car.lente / CAMINO.duracionLente);
      const y = cerca.y - (cerca.y - lejos.y) * ((f * 2.5) % 1);
      c.strokeStyle = 'rgba(90,169,230,0.7)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, y); c.lineTo(W, y);
      c.stroke();
    }

    // objetos, de lejos a cerca
    for (const { o, dz } of car.visibles()) this._dibujarObjeto(c, o, dz, r, u, lente);

    if (soloFondo) return;

    // el explorador
    const p = this._proy(0, r);
    const x = this._xCarril(car.xCarril, p, r);
    const temblor = car.tropiezo > 0 ? Math.sin(this.t * 60) * 5 * u : 0;
    const y = p.y - 10 * u;
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.beginPath();
    c.ellipse(x, p.y + 4 * u, 26 * u, 8 * u, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = car.tropiezo > 0 && Math.sin(this.t * 30) > 0 ? '#f0917e' : col;
    c.beginPath();
    c.moveTo(x - 18 * u + temblor, y + 8 * u);
    c.lineTo(x + temblor, y - 40 * u);
    c.lineTo(x + 18 * u + temblor, y + 8 * u);
    c.closePath();
    c.fill();
    c.beginPath();
    c.arc(x + temblor, y - 50 * u, 11 * u, 0, Math.PI * 2);
    c.fill();

    this._dibujarHud(c, r, i, k, car, u, col);
  }

  _dibujarObjeto(c, o, dz, r, u, lente) {
    const p = this._proy(dz, r);
    const x = this._xCarril(o.carril, p, r);
    const t = p.esc * u;
    switch (o.tipo) {
      case 'dato': {
        const s = 16 * t;
        c.fillStyle = AZUL_DATO;
        c.beginPath();
        c.moveTo(x, p.y - 2.4 * s); c.lineTo(x + s, p.y - 1.4 * s);
        c.lineTo(x, p.y - 0.4 * s); c.lineTo(x - s, p.y - 1.4 * s);
        c.closePath();
        c.fill();
        break;
      }
      case 'control': {
        const w = 56 * t, h = 34 * t;
        c.fillStyle = 'rgba(217,164,65,0.9)';
        c.fillRect(x - 2 * t, p.y - h - 30 * t, 4 * t, 30 * t);
        rectRedondeado(c, x - w / 2, p.y - h - 30 * t - h, w, h, 5 * t);
        c.fill();
        if (t > 0.35) {
          c.fillStyle = PALETA.fondoHondo;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.font = 'bold ' + Math.round(22 * t) + 'px ' + FUENTE.interfaz;
          c.fillText('✓', x, p.y - h / 2 - 30 * t - h);
        }
        break;
      }
      case 'muro': {
        const w = (2 / 3) * p.hw * 0.92, h = 70 * t;
        c.fillStyle = '#3a1d1f';
        rectRedondeado(c, x - w / 2, p.y - h, w, h, 4 * t);
        c.fill();
        c.strokeStyle = '#8c3b35';
        c.lineWidth = Math.max(1, 2 * t);
        c.stroke();
        const tam = Math.round(13 * t * 1.3);
        if (tam >= 8) {
          c.font = tam + 'px ' + FUENTE.interfaz;
          c.fillStyle = '#f0c9c2';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          const lineas = partirLineas(c, o.texto, w - 10 * t).slice(0, 2);
          lineas.forEach((l, n) => c.fillText(l, x, p.y - h / 2 + (n - (lineas.length - 1) / 2) * tam * 1.15));
        }
        break;
      }
      case 'oculto': {
        if (o.revelado) {
          const s = 20 * t * (1 + Math.sin(this.t * 8) * 0.12);
          c.fillStyle = 'rgba(255,90,74,0.25)';
          c.beginPath();
          c.arc(x, p.y - 1.4 * s, 2.2 * s, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = ROJO;
          c.beginPath();
          c.moveTo(x, p.y - 2.6 * s); c.lineTo(x + s, p.y - 1.4 * s);
          c.lineTo(x, p.y - 0.2 * s); c.lineTo(x - s, p.y - 1.4 * s);
          c.closePath();
          c.fill();
          if (t > 0.3) {
            c.fillStyle = '#fff';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.font = 'bold ' + Math.round(16 * t) + 'px ' + FUENTE.interfaz;
            c.fillText('!', x, p.y - 1.4 * s);
          }
        } else if (!lente) {
          // Casi invisible. Casi.
          c.fillStyle = 'rgba(255,255,255,' + (0.04 + Math.sin(this.t * 3 + o.s) * 0.025).toFixed(3) + ')';
          c.beginPath();
          c.arc(x, p.y - 20 * t, 12 * t, 0, Math.PI * 2);
          c.fill();
        }
        break;
      }
      case 'estacion': {
        const est = ESTACIONES[o.estacion];
        const w = p.hw * 2.1, h = 150 * t;
        c.strokeStyle = 'rgba(217,164,65,0.7)';
        c.lineWidth = Math.max(1.5, 6 * t);
        c.beginPath();
        c.moveTo(r.ancho / 2 - w / 2, p.y);
        c.lineTo(r.ancho / 2 - w / 2, p.y - h);
        c.lineTo(r.ancho / 2 + w / 2, p.y - h);
        c.lineTo(r.ancho / 2 + w / 2, p.y);
        c.stroke();
        const tam = Math.round(22 * t);
        if (tam >= 9) {
          c.fillStyle = PALETA.oroClaro;
          c.textAlign = 'center';
          c.textBaseline = 'bottom';
          c.font = tam + 'px ' + FUENTE.narrativa;
          c.fillText(est.nombre, r.ancho / 2, p.y - h - 6 * t);
        }
        break;
      }
    }
  }

  /**
   * Un velo oscuro arriba y abajo sobre el 3D: el cielo es claro y los
   * marcadores dorados encima se perdían. No tapa la pista: solo los bordes,
   * donde no pasa nada del juego.
   */
  _velo3D(c, r) {
    const W = r.ancho, H = r.alto;
    const arriba = c.createLinearGradient(0, 0, 0, H * 0.22);
    arriba.addColorStop(0, 'rgba(5,7,12,0.62)');
    arriba.addColorStop(1, 'rgba(5,7,12,0)');
    c.fillStyle = arriba;
    c.fillRect(0, 0, W, H * 0.22);
    const abajo = c.createLinearGradient(0, H, 0, H * 0.86);
    abajo.addColorStop(0, 'rgba(5,7,12,0.6)');
    abajo.addColorStop(1, 'rgba(5,7,12,0)');
    c.fillStyle = abajo;
    c.fillRect(0, H * 0.86, W, H * 0.14);
  }

  _dibujarHud(c, r, i, k, car, u, col) {
    const W = r.ancho, H = r.alto;

    // cabecera: jugador y descubrimientos
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.font = 'bold 20px ' + FUENTE.interfaz;
    c.fillStyle = col;
    c.fillText('JUGADOR ' + (i + 1), 22, 18);
    c.font = '12px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tintaDebil;
    c.fillText(car.puntos + ' puntos', 22, 44);

    c.textAlign = 'right';
    c.font = 'bold 44px ' + FUENTE.interfaz;
    c.fillStyle = car.hallazgos.length ? ROJO : PALETA.tintaDebil;
    c.fillText(String(car.hallazgos.length), W - 22, 10);
    c.font = '11px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.tintaDebil;
    c.fillText('DESCUBRIMIENTOS', W - 22, 58);

    // recorrido por estaciones
    const x0 = 22, x1 = W - 22, yb = 84;
    const tramo = (x1 - x0) / ESTACIONES.length;
    ESTACIONES.forEach((e, n) => {
      const xa = x0 + n * tramo;
      const lleno = limitar(car.progreso * ESTACIONES.length - n, 0, 1);
      c.fillStyle = 'rgba(255,255,255,0.08)';
      c.fillRect(xa + 2, yb, tramo - 4, 6);
      c.fillStyle = n === car.estacion ? PALETA.oro : 'rgba(217,164,65,0.55)';
      c.fillRect(xa + 2, yb, (tramo - 4) * lleno, 6);
      c.textAlign = 'center';
      c.font = (n === car.estacion ? 'bold ' : '') + '11px ' + FUENTE.interfaz;
      c.fillStyle = n === car.estacion ? PALETA.tinta : PALETA.tintaDebil;
      const nombre = partirLineas(c, e.nombre, tramo - 6)[0];
      c.fillText(nombre, xa + tramo / 2, yb + 12);
    });

    // datos y análisis, abajo
    const yd = H - 58;
    const anchoBarra = Math.min(260, W * 0.35);
    c.textAlign = 'left';
    c.textBaseline = 'bottom';
    c.font = '11px ' + FUENTE.instrumento;
    c.fillStyle = AZUL_DATO;
    c.fillText('◆ DATOS  ' + car.datos, 22, yd - 4);
    c.fillStyle = 'rgba(255,255,255,0.08)';
    c.fillRect(22, yd, anchoBarra, 10);
    c.fillStyle = AZUL_DATO;
    c.fillRect(22, yd, anchoBarra * (car.datos / CAMINO.maxDatos), 10);
    const xm = 22 + anchoBarra * (CAMINO.costoLente / CAMINO.maxDatos);
    c.fillStyle = PALETA.tinta;
    c.fillRect(xm - 1, yd - 3, 2, 16);

    const listo = car.datos >= CAMINO.costoLente || car.lente > 0;
    c.textAlign = 'right';
    c.font = 'bold 15px ' + FUENTE.interfaz;
    c.fillStyle = car.lente > 0 ? AZUL_DATO : listo ? PALETA.oroClaro : PALETA.tintaDebil;
    const boton = this.motor.jugadores[i].estado.conectado ? this.acciones[i].nombreConfirmar : 'ESPACIO';
    c.fillText(car.lente > 0 ? 'ANALIZANDO…' : listo ? boton + ' · ANALIZAR' : 'Faltan datos para analizar', W - 22, yd + 10);

    // avisos flotantes
    let ya = H * 0.2;
    for (const a of this.avisos[k] || []) {
      const alfa = Math.min(1, a.vida / 0.4);
      c.globalAlpha = alfa;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = 'bold 20px ' + FUENTE.interfaz;
      c.lineWidth = 4;
      c.strokeStyle = 'rgba(5,7,12,0.9)';
      c.strokeText(a.texto, W / 2, ya);
      c.fillStyle = a.color;
      c.fillText(a.texto, W / 2, ya);
      c.globalAlpha = 1;
      ya += 30;
    }

    if (car.terminada && this.carreras.some((x) => !x.terminada)) {
      c.fillStyle = 'rgba(5,7,12,0.75)';
      c.fillRect(0, 0, W, H);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = '22px ' + FUENTE.narrativa;
      c.fillStyle = PALETA.tinta;
      c.fillText('Llegaste. Esperando al otro jugador…', W / 2, H / 2);
    }
  }

  _dibujarCuenta(c, W, H) {
    const n = Math.ceil(3 - this.tFase);
    const f = (3 - this.tFase) % 1;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.globalAlpha = 0.4 + f * 0.6;
    c.font = 'bold ' + Math.round(120 + (1 - f) * 40) + 'px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tinta;
    c.fillText(String(n), W / 2, H / 2);
    c.globalAlpha = 1;
  }

  // ------------------------------------------------------------ tablero
  /**
   * El tablero: lo encontrado frente a lo que había, estación por estación.
   * Es el momento en que se ve todo lo que estuvo escondido.
   */
  _dibujarTablero(c, r, i, k) {
    const R = this.resultados[k];
    const W = r.ancho, H = r.alto;
    const col = COLOR_J[i % 2];
    c.fillStyle = PALETA.fondo;
    c.fillRect(0, 0, W, H);

    const ancho = Math.min(560, W - 60);
    const x0 = (W - ancho) / 2;
    const lineas = [
      '◆ ' + R.datos + ' datos recogidos · analizaste ' + R.usosLente + (R.usosLente === 1 ? ' vez' : ' veces'),
      '✓ ' + R.controles + ' carteles «todo en orden»: ninguno escondía nada',
      R.choques ? 'Chocaste ' + R.choques + (R.choques === 1 ? ' vez' : ' veces') + ' con una excusa' : 'No chocaste con ninguna excusa',
      (R.noVistos + R.vistosNoAlcanzados) + ' cosas escondidas pasaron a tu lado sin que las atraparas',
    ];
    if (R.carrilComodo) lineas.push('Pasaste el ' + Math.round(R.carriles[1] * 100) + ' % del camino por el carril del centro');

    const alto = 28 + 34 + 70 + 30 + ESTACIONES.length * 40 + 24 + lineas.length * 26 + 30;
    let y = Math.max(96, (H - alto) / 2 + 20);

    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = '11px ' + FUENTE.instrumento;
    c.fillStyle = col;
    c.fillText('TABLERO · JUGADOR ' + (i + 1), W / 2, y);
    y += 28;
    c.font = 'bold 56px ' + FUENTE.interfaz;
    c.fillStyle = R.hallazgos ? ROJO : PALETA.tintaTenue;
    c.fillText(R.hallazgos + ' de ' + R.existentes, W / 2, y);
    y += 66;
    c.font = '15px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.tintaTenue;
    c.fillText('cosas escondidas encontradas', W / 2, y);
    y += 38;

    // una fila por estación: lo que había frente a lo encontrado
    for (const e of R.porEstacion) {
      c.textAlign = 'left';
      c.font = '13px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tinta;
      c.fillText(e.nombre, x0, y);
      c.textAlign = 'right';
      c.fillStyle = e.encontrados ? ROJO : PALETA.tintaDebil;
      c.fillText(e.encontrados + ' / ' + e.existentes, x0 + ancho, y);
      const yb = y + 19;
      const paso = ancho / Math.max(1, e.existentes);
      for (let n = 0; n < e.existentes; n++) {
        c.fillStyle = n < e.encontrados ? ROJO : 'rgba(255,255,255,0.10)';
        c.fillRect(x0 + n * paso + 1, yb, paso - 3, 10);
      }
      y += 40;
    }
    y += 12;

    c.textAlign = 'left';
    c.font = '14px ' + FUENTE.interfaz;
    for (const l of lineas) {
      c.fillStyle = PALETA.tintaTenue;
      partirLineas(c, l, ancho).forEach((t) => { c.fillText(t, x0, y); y += 20; });
      y += 6;
    }
    y += 8;
    c.textAlign = 'center';
    c.font = 'bold 16px ' + FUENTE.interfaz;
    c.fillStyle = PALETA.oroClaro;
    c.fillText(R.puntos + ' puntos', W / 2, y);
  }

  _dibujarGanador(c, W, H) {
    const n = this.participantes.length;
    let texto;
    if (n < 2) texto = null;
    else if (this.ganador < 0) texto = 'EMPATE';
    else texto = 'GANA EL JUGADOR ' + (this.participantes[this.ganador] + 1);
    if (texto) {
      c.font = 'bold 26px ' + FUENTE.interfaz;
      const w = c.measureText(texto).width + 60;
      c.fillStyle = 'rgba(5,7,12,0.92)';
      rectRedondeado(c, (W - w) / 2, 22, w, 50, 25);
      c.fill();
      c.strokeStyle = PALETA.oro;
      c.lineWidth = 2;
      c.stroke();
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = PALETA.oroClaro;
      c.fillText(texto, W / 2, 47);
    }
    if (this.tFase > BLOQUEO_TABLERO) {
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = Math.sin(this.t * 4) > -0.45 ? PALETA.oro : PALETA.tintaDebil;
      c.fillText('Pulsa ' + this._nombreBoton(this.participantes[0]) + ' para ver qué acabas de hacer', W / 2, H - 20);
    }
  }

  // --------------------------------------------------------- revelación
  _dibujarRevelacion(c, W, H) {
    const cx = W / 2;
    const ancho = Math.min(980, W - 80);
    const colQue = Math.min(250, ancho * 0.3);

    c.font = '15px ' + FUENTE.interfaz;
    const filas = ASI_TRABAJAMOS.map((f) => partirLineas(c, f.es, ancho - colQue - 30));
    const altoFilas = filas.reduce((s, l) => s + Math.max(1, l.length) * 21 + 18, 0);
    const alto = 30 + 50 + altoFilas + 70;
    let y = Math.max(30, (H - alto) / 2);

    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = '11px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.oro;
    c.fillText('LO QUE ACABAS DE HACER, EN LA VIDA REAL', cx, y);
    y += 30;
    c.font = '34px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tinta;
    c.fillText('Así trabajamos', cx, y);
    y += 60;

    const x0 = cx - ancho / 2;
    ASI_TRABAJAMOS.forEach((f, n) => {
      const a = suave(Math.min(1, (this.tFase - n * 0.25) / 0.6));
      c.globalAlpha = a;
      c.textAlign = 'left';
      c.font = 'bold 16px ' + FUENTE.interfaz;
      c.fillStyle = f.que.includes('rojo') ? ROJO : f.que.includes('◆') ? AZUL_DATO : PALETA.oroClaro;
      c.fillText(f.que, x0, y);
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tinta;
      filas[n].forEach((l, m) => c.fillText(l, x0 + colQue + 30, y + m * 21));
      y += Math.max(1, filas[n].length) * 21 + 18;
      c.globalAlpha = 1;
    });

    if (this.tFase > 1.6) {
      c.globalAlpha = suave(Math.min(1, (this.tFase - 1.6) / 0.8));
      c.textAlign = 'center';
      c.font = 'italic 20px ' + FUENTE.narrativa;
      c.fillStyle = PALETA.oro;
      c.fillText('No nos quedamos con lo que el proceso dice de sí mismo. Vamos a ver.', cx, y + 10);
      c.globalAlpha = 1;
    }
    if (this.tFase > 2) {
      c.textBaseline = 'bottom';
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = Math.sin(this.t * 4) > -0.45 ? PALETA.oro : PALETA.tintaDebil;
      c.fillText('Pulsa ' + this._nombreBoton(this.participantes[0] || 0) + ' para continuar', cx, H - 24);
    }
  }
}

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
import {
  PALETA, FUENTE, MENU, rectRedondeado, grano, suave, limitar,
  cajaMenu, tituloMenu, textoMenu, cuentaMenu, fondoMenu,
} from '../../core/render.js';
import {
  CAMINO, generarCamino, Carrera, carrilDesdePuntero, ganador, elegirEstaciones,
} from '../carrera.js';
import { dibujarRevelacion } from '../../ui/revelacion.js';
import { participantesDe, dibujarUnion, eleccion, nombreDe, textoGana, unirJugador2 } from '../../ui/jugadores.js';

const COLOR_J = [PALETA.oro, PALETA.senal];
/**
 * Segundos que el tablero se queda sí o sí. Quien llega a la meta suele venir
 * pulsando el gatillo para analizar, y esa pulsación se saltaba el tablero
 * antes de verlo (lo encontró tests/humo.test.js). Lo que se pulse durante
 * este tiempo se descarta.
 */
const BLOQUEO_TABLERO = 3;
/**
 * La vista 2D es solo para cuando el 3D no existe (sin WebGL, pruebas de
 * Node). Antes se pasaba a ella si bajaban los fotogramas, y en el stand eso
 * se veía como «el juego se rompió»: puntos sobre negro, sin personaje. Ahora
 * el 3D se queda siempre; si va lento baja su resolución (vista3d.js), y solo
 * si falla de verdad muchos fotogramas seguidos, o pierde la tarjeta gráfica
 * y no vuelve, se vuelve a crear.
 */
const FALLOS_SEGUIDOS = 30;
const SEGUNDOS_SIN_CONTEXTO = 2;
/**
 * Segundos que dura el letrero «Entrando a…» al cambiar de tramo: lo justo
 * para leerlo. En ese trecho el camino no trae muros (CAMINO.pausaTramo).
 */
const DURACION_TRANSICION = 2.6;
const AZUL_DATO = '#5aa9e6';
const ROJO = '#ff5a4a';

/** Lo que el visitante hizo, traducido a lo que hace el área. Pantalla final. */
const ASI_TRABAJAMOS = [
  { que: '◆ Los datos crudos', es: 'Sacamos la información directo de la base de datos, no de lo que el proceso reporta de sí mismo.' },
  { que: 'La lente', es: 'Analizar: mirar los datos con intención. Sin datos no hay análisis, y sin análisis no se ve nada.' },
  { que: 'El tablero de Power BI', es: 'Con él cruzamos las cifras del proceso con las nuestras: por eso, al tomarlo, apareció lo que estaba escondido.' },
  { que: 'Los dos tramos', es: 'Vamos a donde el plan dijo que más pesaba, en ese orden, y recorremos el proceso de principio a fin.' },
  { que: 'Lo que brilló en rojo', es: 'Se llama HALLAZGO: lo escondido, lo que nadie estaba viendo. Con él se construyen las conclusiones.' },
  { que: 'Los muros', es: 'Y sí: siempre aparece una excusa en el camino.' },
];

export class EscenaCamino extends Escena {
  static jugadores = 'uno-o-dos';

  constructor(motor) {
    super(motor);
    /** Video previo a las instrucciones: assets/cinematicas/camino.mp4 (opcional). */
    this.cinematica = 'camino';
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
        'Atrapa los tableros de Power BI: cruzan los datos por ti y analizan el camino sin gastar tus ◆. Esquiva los muros: son las excusas de siempre, y te hacen perder datos.',
        'Con teclado: Jugador 1 con A/D y W (o Espacio); Jugador 2 con las flechas ← → y ↑. Si juegas solo, también valen las flechas.',
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
    this._fallos = 0;
    this._sinContexto = 0;
    this._rearmando = false;

    // Teclado, para uno o dos jugadores:
    //   Jugador 1: A/D cambian de carril; W o Espacio analizan.
    //   Jugador 2: ←/→ cambian de carril; ↑ analiza. Se une pulsando ↑ en las
    //   instrucciones (igual que con el Joy-Con, pulsando un botón).
    // Mientras nadie se una como Jugador 2, las flechas también mueven al 1:
    // quien juega solo puede usar las que prefiera. Y cualquiera de los dos
    // puede ser un Joy-Con en lugar del teclado.
    this.teclado = { carril: 1, analizar: false, confirmar: false, activo: false };
    this.teclado2 = { carril: 1, analizar: false, unido: false };
    this.raton = { x: null, clic: false };
    this._onTecla = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const t2 = this.teclado2;
      const flechasDelDos = t2.unido;
      if (k === 'a' || (k === 'ArrowLeft' && !flechasDelDos)) {
        this.teclado.carril = Math.max(0, this.teclado.carril - 1);
        this.teclado.activo = true;
      } else if (k === 'd' || (k === 'ArrowRight' && !flechasDelDos)) {
        this.teclado.carril = Math.min(2, this.teclado.carril + 1);
        this.teclado.activo = true;
      } else if (k === 'ArrowLeft') {
        t2.carril = Math.max(0, t2.carril - 1);
      } else if (k === 'ArrowRight') {
        t2.carril = Math.min(2, t2.carril + 1);
      } else if (k === 'ArrowUp') {
        // ↑ une al Jugador 2 solo si no se eligió al empezar cuántos juegan.
        if (this.fase === 'guia' && !t2.unido && !this._j2PorMando() && !eleccion(this.motor)) this._unirTeclado();
        else if (t2.unido) t2.analizar = true;
        else { this.teclado.analizar = true; this.teclado.confirmar = true; }
      } else if (k === ' ' || k === 'w') {
        this.teclado.analizar = true;
        this.teclado.confirmar = true;
      } else if (k === 'Enter') this.teclado.confirmar = true;
    };
    this._onMover = (e) => {
      const r = this.motor.canvas.getBoundingClientRect();
      this.raton.x = e.clientX - r.left;
      this.teclado.activo = false;       // quien mueve el ratón, juega con ratón
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
    this.carreras = [];
    this.participantes = [];
    this.teclado2 = { carril: 1, analizar: false, unido: false };
    // Si al empezar eligieron jugar dos, el 2 ya está dentro: con su Joy-Con
    // si tiene uno, y si no, con las flechas.
    if (eleccion(this.motor) === 2 && !this._j2PorMando()) this.teclado2.unido = true;
    this.avisos = [[], []];
    this.saltos = [[], []];       // «+1 ◆» que suben desde el explorador al recoger algo
    this.transiciones = [0, 0];   // 1 = recién cruzó a un tramo nuevo, decae a 0
    this.aviso2 = null;
    this.semilla = (Math.random() * 1e9) | 0;

    // Las dos estaciones a jugar: las que el visitante priorizó en El Mapa.
    // Sin datos de El Mapa (p. ej. al entrar directo con la tecla 2), se
    // completa con el orden de siempre.
    const puntajesMapa = this.motor.expedicion.puntajes.mapa;
    this.estacionesJugadas = elegirEstaciones(puntajesMapa && puntajesMapa.elegidas);
    this.guia.entrada = 'Tus equipos llegaron. Ahora hay que caminar los dos tramos a los que diste ' +
      'más prioridad: ' + this.estacionesJugadas.map((e) => e.nombre).join(' y ') +
      '. Ve con tus propios ojos qué pasa ahí.';
    this.guia.reiniciar();

    // Pista quieta de fondo para las instrucciones: se genera una sola vez.
    this._fondoGuia = new Carrera(generarCamino(this.semilla, this.estacionesJugadas), this.estacionesJugadas);
    this.recentrarPuntero();
    window.addEventListener('keydown', this._onTecla);
    window.addEventListener('mousemove', this._onMover);
    window.addEventListener('mousedown', this._onClic);
    if (this.motor.gestor) this.motor.gestor.addEventListener('botonReserva', this._onBotonReserva);
    this.audio && this.audio.musica('exploracion');

    this._fallos = 0;
    this._sinContexto = 0;
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

  /**
   * El 3D falló de verdad: se tira y se crea otro, sin cortar la partida. Lo
   * que tarde en cargar (un par de segundos) se ve la pista en 2D.
   */
  _rearmar3D(motivo) {
    if (!this.vista3d || this._rearmando) return;
    console.warn('Vista 3D reiniciada:', motivo);
    this.vista3d.destruir();
    this.vista3d = null;
    this._fallos = 0;
    this._sinContexto = 0;
    this._rearmando = true;
    this._arrancar3D().then((v) => {
      this._rearmando = false;
      if (v) this.vista3d = v;
    });
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
   * Así nadie tiene que tocar el teclado ni el panel de mandos (tecla J).
   */
  async _unirse(entrada) {
    if (this.fase !== 'guia' || eleccion(this.motor) === 1) return;
    const razon = await unirJugador2(this.motor, entrada);
    if (razon === null) return;
    if (razon) { this.avisoLado = { t: 4, texto: razon }; this.audio && this.audio.sfx('error'); return; }
    this.teclado2.unido = false;         // el mando manda sobre el teclado
    this.aviso2 = { t: 2.5 };
    this.audio && this.audio.sfx('elegir');
  }


  /** ¿El Jugador 2 tiene un Joy-Con conectado? */
  _j2PorMando() {
    const j2 = this.motor.jugadores[1];
    return !!(j2 && j2.estado.conectado);
  }

  /** El Jugador 2 se une con las flechas del teclado. */
  _unirTeclado() {
    this.teclado2.unido = true;
    this.teclado2.carril = 1;
    this.aviso2 = { t: 2.5 };
    this.audio && this.audio.sfx('elegir');
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

    // Si la tarjeta gráfica perdió el contexto y no lo recupera sola, se
    // vuelve a crear la vista.
    if (this.vista3d) {
      this._sinContexto = this.vista3d.perdido ? this._sinContexto + dt : 0;
      if (this._sinContexto > SEGUNDOS_SIN_CONTEXTO) this._rearmar3D('contexto WebGL perdido');
    }
    if (this.aviso2) { this.aviso2.t -= dt; if (this.aviso2.t <= 0) this.aviso2 = null; }
    if (this.avisoLado) { this.avisoLado.t -= dt; if (this.avisoLado.t <= 0) this.avisoLado = null; }
    for (const lista of this.avisos) for (const a of lista) a.vida -= dt;
    this.avisos = this.avisos.map((l) => l.filter((a) => a.vida > 0));
    for (const lista of this.saltos) for (const a of lista) a.vida -= dt;
    this.saltos = this.saltos.map((l) => l.filter((a) => a.vida > 0));
    this.transiciones = this.transiciones.map((v) => Math.max(0, v - dt / DURACION_TRANSICION));

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
        this._reaccionar(i, k, c.eventos, this.estacionesJugadas);
      }
      // Lo pulsado durante la carrera no debe saltarse el tablero al llegar.
      this.teclado.analizar = false;
      this.teclado2.analizar = false;
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
    this.participantes = participantesDe(this.motor, this.teclado2.unido, this.teclado.activo);
    // Lo que se decida aquí vale también para El Regreso.
    this.motor.expedicion.jugadores = this.participantes.length;
    const camino = generarCamino(this.semilla, this.estacionesJugadas);   // el mismo para todos
    this.carreras = this.participantes.map(() => new Carrera(camino, this.estacionesJugadas));
    this.teclado.carril = 1;
    this.teclado2.carril = 1;
    this.teclado2.analizar = false;
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
    if (i === 1 && this.teclado2.unido) return this.teclado2.carril;
    if (this.teclado.activo && i === this.participantes[0]) return this.teclado.carril;
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
    if (i === 1 && this.teclado2.unido) return this.teclado2.analizar;
    return i === this.participantes[0] && (this.teclado.analizar || this.raton.clic);
  }

  /** Sonido, vibración y avisos en pantalla para lo que acaba de pasar. */
  _reaccionar(i, k, eventos, estaciones) {
    const jc = this.motor.jugadores[i];
    const au = this.audio;
    const aviso = (texto, color, vida = 1.4) => this.avisos[k].push({ texto, color, vida, max: vida });
    // Lo recogido salta desde el explorador: se entiende al instante que lo atrapó.
    const salto = (texto, color, tam = 1) => {
      const l = this.saltos[k];
      if (l.length > 5) l.shift();
      l.push({ texto, color, tam, vida: 0.8, max: 0.8, dx: (Math.random() - 0.5) * 0.5 });
    };
    for (const e of eventos) {
      switch (e.tipo) {
        case 'dato': au && au.sfx('dato'); salto('+1 ◆', AZUL_DATO); break;
        case 'control':
          au && au.sfx('lente');
          jc.pulso(260, 0.5, 80);
          aviso('Power BI cruzó los datos por ti', '#ffd24a', 1.4);
          salto('+' + CAMINO.puntos.control + ' · Power BI', '#ffd24a', 1.15);
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
          salto('+' + CAMINO.puntos.hallazgo, ROJO, 1.5);
          break;
        case 'estacion':
          au && au.sfx('fase');
          // Cambio de tramo, a media carrera: el letrero grande «Entrando a…».
          // Al arrancar (primer tramo) basta el aviso de siempre.
          if (e.estacion > 0) { this.transiciones[k] = 1; jc.pulso(200, 0.4, 90); }
          else aviso(estaciones[e.estacion].nombre + ' · ' + estaciones[e.estacion].que, PALETA.tinta, 2.2);
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
        this.vista3d.dibujar(this.carreras, this.participantes, this.motor.pausado ? 0 : this._dt);
        this._fallos = 0;
      } catch (e) {
        // Un fotograma que falla no apaga nada: se avisa y se sigue. Solo si
        // falla muchos seguidos se rearma la vista.
        if (this._fallos === 0) console.warn('Fotograma 3D con error:', e);
        if (++this._fallos >= FALLOS_SEGUIDOS) this._rearmar3D(e && e.message);
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
    if (jc.estado.conectado) return this.acciones[i].nombreConfirmar;
    return i === 1 && this.teclado2.unido ? '↑' : 'ENTER';
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
    dibujarUnion(c, W, H, this.motor, this.teclado2.unido, this.aviso2, this.avisoLado);
  }

  // ---------------------------------------------------------- la pista
  _unidad(r) { return Math.min(r.ancho / 900, r.alto / 1000) * 1.1; }

  /** Proyección en perspectiva: distancia por delante -> altura y escala. */
  _proy(dz, r) {
    const C = 7;
    // Lo que ya pasó (dz negativo) sigue bajando hasta salir por abajo.
    const esc = C / (C + Math.max(-5.5, dz));
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
    for (const { o, dz } of car.visibles()) this._dibujarObjeto(c, o, dz, r, u, lente, car.estaciones);

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

  _dibujarObjeto(c, o, dz, r, u, lente, estaciones) {
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
        // el tablero de Power BI: pantalla con barras amarillas sobre una base
        const w = 60 * t, h = 40 * t, y0 = p.y - 20 * t - h;
        c.fillStyle = '#6b5a45';
        rectRedondeado(c, x - w / 2, y0, w, h, 4 * t);
        c.fill();
        c.fillStyle = '#1a1712';
        c.fillRect(x - w / 2 + 4 * t, y0 + 4 * t, w - 8 * t, h - 8 * t);
        c.fillStyle = '#f6c343';
        for (let b = 0; b < 4; b++) {
          const hb = (h - 14 * t) * [0.4, 0.7, 0.55, 0.9][b];
          c.fillRect(x - w / 2 + 9 * t + b * 11 * t, y0 + h - 6 * t - hb, 7 * t, hb);
        }
        c.fillStyle = '#8a7658';
        c.fillRect(x - w / 2 - 6 * t, p.y - 20 * t, w + 12 * t, 8 * t);
        break;
      }
      case 'muro': {
        if (o.derribado) break;          // se lo llevó por delante: ya no está de pie
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
        const est = estaciones[o.estacion];
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

  /**
   * Los marcadores de la carrera, con el estilo de los menús: cajas de roca
   * con doble borde y letra grande, para leerse de reojo sin dejar de correr.
   * Todo escala con el tamaño de la mitad de pantalla del jugador.
   */
  _dibujarHud(c, r, i, k, car, u, col) {
    const W = r.ancho, H = r.alto;
    const s = limitar(Math.min(W / 800, H / 820), 0.75, 1.3);
    const m = Math.round(16 * s);                       // margen
    c.save();

    // --- arriba a la izquierda: jugador y puntos
    const wJ = Math.round(210 * s), hJ = Math.round(76 * s);
    cajaMenu(c, m, m, wJ, hJ, { relleno: 'rgba(8,5,3,0.78)' });
    c.textAlign = 'left';
    c.textBaseline = 'top';
    const nombre = nombreDe(this.motor, i);
    let tamN = Math.round(24 * s);
    c.font = 'bold ' + tamN + 'px ' + MENU.letra;
    const cabe = wJ - 32 * s;
    const wN = c.measureText(nombre).width;
    if (wN > cabe) { tamN = Math.floor(tamN * cabe / wN); c.font = 'bold ' + tamN + 'px ' + MENU.letra; }
    c.fillStyle = 'rgba(0,0,0,0.85)';
    c.fillText(nombre, m + 16 * s + 2, m + 12 * s + 2);
    c.fillStyle = col;
    c.fillText(nombre, m + 16 * s, m + 12 * s);
    textoMenu(c, car.puntos + ' puntos', m + 16 * s, m + 44 * s, Math.round(18 * s), MENU.beige);

    // --- arriba a la derecha: lo encontrado, lo que más importa
    const wD = Math.round(190 * s);
    cajaMenu(c, W - m - wD, m, wD, hJ + 10 * s, { relleno: 'rgba(8,5,3,0.78)' });
    c.textAlign = 'center';
    const cxD = W - m - wD / 2;
    c.font = 'bold ' + Math.round(50 * s) + 'px ' + MENU.letra;
    c.textBaseline = 'top';
    c.fillStyle = 'rgba(0,0,0,0.85)';
    c.fillText(String(car.hallazgos.length), cxD + 2, m + 6 * s + 2);
    c.fillStyle = car.hallazgos.length ? ROJO : 'rgba(205,187,138,0.55)';
    c.fillText(String(car.hallazgos.length), cxD, m + 6 * s);
    c.font = Math.round(13 * s) + 'px ' + FUENTE.instrumento;
    c.fillStyle = MENU.beigeBorde;
    c.fillText('DESCUBRIMIENTOS', cxD, m + 62 * s);

    // --- recorrido por tramos, entre las dos cajas
    const x0 = m * 2 + wJ, x1 = W - m * 2 - wD, yb = m + 20 * s;
    if (x1 - x0 > 80) {
      const tramo = (x1 - x0) / car.estaciones.length;
      car.estaciones.forEach((e, n) => {
        const xa = x0 + n * tramo;
        const lleno = limitar(car.progreso * car.estaciones.length - n, 0, 1);
        c.fillStyle = 'rgba(8,5,3,0.7)';
        c.fillRect(xa + 3, yb, tramo - 6, 10 * s);
        c.fillStyle = n === car.estacion ? '#f6a92c' : 'rgba(240,201,119,0.6)';
        c.fillRect(xa + 3, yb, (tramo - 6) * lleno, 10 * s);
        c.strokeStyle = MENU.beigeBorde;
        c.lineWidth = 1;
        c.strokeRect(xa + 3.5, yb + 0.5, tramo - 7, 10 * s - 1);
        c.textAlign = 'center';
        c.textBaseline = 'top';
        c.font = (n === car.estacion ? 'bold ' : '') + Math.round(16 * s) + 'px ' + MENU.letra;
        const nombre = partirLineas(c, e.nombre, tramo - 8)[0];
        textoMenu(c, nombre, xa + tramo / 2, yb + 16 * s, Math.round(16 * s),
          n === car.estacion ? '#fff3cf' : 'rgba(233,220,180,0.7)');
      });
    }

    // --- abajo: datos y análisis, en su caja
    const anchoBarra = Math.min(300 * s, W * 0.42);
    const hC = Math.round(64 * s), yC = H - m - hC;
    cajaMenu(c, m, yC, anchoBarra + 32 * s, hC, { relleno: 'rgba(8,5,3,0.78)' });
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.font = 'bold ' + Math.round(16 * s) + 'px ' + FUENTE.interfaz;
    c.fillStyle = AZUL_DATO;
    c.fillText('◆ DATOS  ' + car.datos, m + 16 * s, yC + 10 * s);
    const yBarra = yC + 36 * s, hBarra = 14 * s;
    c.fillStyle = 'rgba(255,255,255,0.1)';
    c.fillRect(m + 16 * s, yBarra, anchoBarra, hBarra);
    c.fillStyle = AZUL_DATO;
    c.fillRect(m + 16 * s, yBarra, anchoBarra * (car.datos / CAMINO.maxDatos), hBarra);
    const xm = m + 16 * s + anchoBarra * (CAMINO.costoLente / CAMINO.maxDatos);
    c.fillStyle = MENU.beige;
    c.fillRect(xm - 1.5, yBarra - 4, 3, hBarra + 8);

    const listo = car.datos >= CAMINO.costoLente || car.lente > 0;
    const conTeclado = this.teclado.activo && i === this.participantes[0];
    const boton = i === 1 && this.teclado2.unido ? '↑'
      : this.motor.jugadores[i].estado.conectado && !conTeclado ? this.acciones[i].nombreConfirmar : 'W';
    const texto = car.lente > 0 ? 'ANALIZANDO…' : listo ? boton + ' · ANALIZAR' : 'Faltan datos para analizar';
    c.font = 'bold ' + Math.round(20 * s) + 'px ' + MENU.letra;
    const wA = c.measureText(texto).width + 36 * s;
    cajaMenu(c, W - m - wA, yC, wA, hC, {
      relleno: car.lente > 0 ? 'rgba(20,50,80,0.85)' : listo ? 'rgba(90,30,10,0.8)' : 'rgba(8,5,3,0.78)',
      brillo: listo ? 1 : 0.5,
    });
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    textoMenu(c, texto, W - m - wA / 2, yC + hC / 2, Math.round(20 * s),
      car.lente > 0 ? '#9fd0ff' : listo ? '#fff3cf' : 'rgba(205,187,138,0.6)');
    c.restore();

    // avisos flotantes, grandes y con contorno: se leen sobre el cielo claro
    const tamAviso = Math.round(26 * s);
    let ya = H * 0.24;
    for (const a of this.avisos[k] || []) {
      c.globalAlpha = Math.min(1, a.vida / 0.4);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = 'bold ' + tamAviso + 'px ' + MENU.letra;
      c.lineJoin = 'round';
      c.lineWidth = 6;
      c.strokeStyle = 'rgba(12,4,2,0.92)';
      c.strokeText(a.texto, W / 2, ya);
      c.fillStyle = a.color;
      c.fillText(a.texto, W / 2, ya);
      c.globalAlpha = 1;
      ya += tamAviso * 1.4;
    }

    this._dibujarSaltos(c, W, H, k, s);
    this._dibujarTransicion(c, W, H, this.transiciones[k] || 0, car);

    if (car.terminada && this.carreras.some((x) => !x.terminada)) {
      c.save();
      c.globalAlpha = 0.85;
      fondoMenu(c, W, H);
      c.restore();
      c.textAlign = 'center';
      tituloMenu(c, 'Llegaste', W / 2, H / 2 - 30 * s, Math.round(56 * s));
      c.textBaseline = 'middle';
      textoMenu(c, 'Esperando al otro jugador…', W / 2, H / 2 + 30 * s, Math.round(22 * s), MENU.beige);
    }
  }

  /** Los «+1 ◆» que suben desde el explorador, crecen un poco y se apagan. */
  _dibujarSaltos(c, W, H, k, s) {
    const lista = this.saltos[k];
    if (!lista || !lista.length) return;
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    for (const a of lista) {
      const p = 1 - a.vida / a.max;                         // 0 → 1
      const tam = Math.round(30 * s * a.tam * (0.8 + 0.35 * Math.min(1, p * 4)));
      c.globalAlpha = Math.min(1, (a.vida / a.max) * 2.2);
      c.font = 'bold ' + tam + 'px ' + MENU.letra;
      const x = W * (0.5 + a.dx * 0.25), y = H * (0.62 - p * 0.2);
      c.lineWidth = 6;
      c.strokeStyle = 'rgba(12,4,2,0.9)';
      c.strokeText(a.texto, x, y);
      c.fillStyle = a.color;
      c.fillText(a.texto, x, y);
    }
    c.restore();
  }

  /**
   * El paso de un tramo al otro: un barrido de luz cruza la pantalla y el
   * nombre del tramo nuevo entra creciendo y se queda lo justo para leerlo
   * (DURACION_TRANSICION). Mientras tanto el camino no trae muros.
   * @param {number} v 1 al cruzar, decae a 0.
   */
  _dibujarTransicion(c, W, H, v, car) {
    if (v <= 0) return;
    const k = 1 - v;                         // 0 → 1 a lo largo de la animación
    // Entra rápido, se sostiene y se va en el último cuarto.
    const presencia = Math.min(1, k * 6, v * 4);
    c.save();

    // Velo suave, que deja ver el camino.
    c.globalAlpha = presencia * 0.22;
    c.fillStyle = PALETA.oro;
    c.fillRect(0, 0, W, H);

    // Barrido: una franja de luz que cruza de izquierda a derecha, al principio.
    const kb = Math.min(1, k / 0.35);
    if (kb < 1) {
      const xb = -W * 0.3 + kb * W * 1.6;
      const g = c.createLinearGradient(xb - W * 0.25, 0, xb + W * 0.25, 0);
      g.addColorStop(0, 'rgba(240,201,119,0)');
      g.addColorStop(0.5, 'rgba(255,240,200,0.55)');
      g.addColorStop(1, 'rgba(240,201,119,0)');
      c.globalAlpha = 1;
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }

    // El nombre del tramo nuevo, y qué es.
    const e = car.estaciones[car.estacion];
    const escala = 0.7 + suave(Math.min(1, k * 5)) * 0.3;
    c.globalAlpha = presencia;
    const anchoCaja = Math.min(W * 0.9, 660);
    c.translate(W / 2, H * 0.42);
    c.scale(escala, escala);
    cajaMenu(c, -anchoCaja / 2, -66, anchoCaja, 128, { relleno: 'rgba(8,5,3,0.78)' });
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '14px ' + FUENTE.instrumento;
    c.fillStyle = MENU.beigeBorde;
    c.fillText('E N T R A N D O   A', 0, -40);
    tituloMenu(c, e.nombre, 0, 2, 48);
    c.textBaseline = 'middle';
    textoMenu(c, e.que, 0, 40, 19, MENU.beige);
    c.restore();
  }

  _dibujarCuenta(c, W, H) {
    cuentaMenu(c, W, H, this.tFase);
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
    fondoMenu(c, W, H);

    const lineas = [
      '◆ ' + R.datos + ' datos recogidos · analizaste ' + R.usosLente + (R.usosLente === 1 ? ' vez' : ' veces'),
      R.controles
        ? 'Tomaste ' + R.controles + (R.controles === 1 ? ' tablero' : ' tableros') + ' de Power BI: analizaron el camino por ti'
        : 'No tomaste ningún tablero de Power BI',
      R.choques ? 'Chocaste ' + R.choques + (R.choques === 1 ? ' vez' : ' veces') + ' con una excusa' : 'No chocaste con ninguna excusa',
      (R.noVistos + R.vistosNoAlcanzados) + ' cosas escondidas pasaron a tu lado sin que las atraparas',
    ];
    if (R.carrilComodo) lineas.push('Pasaste el ' + Math.round(R.carriles[1] * 100) + ' % del camino por el carril del centro');

    // Letra grande; si no cabe (pantalla partida, pantallas bajas), se achica.
    let s = limitar(Math.min(W / 620, H / 700), 0.7, 1.6);
    let ancho, textos, alto, pad;
    for (let intento = 0; intento < 8; intento++) {
      ancho = Math.min(640 * s, W - 40);
      pad = 26 * s;
      c.font = Math.round(18 * s) + 'px ' + FUENTE.interfaz;
      textos = lineas.map((l) => partirLineas(c, l, ancho - pad * 2));
      const altoTextos = textos.reduce((a, t) => a + t.length * 24 * s + 6 * s, 0);
      alto = pad * 2 + 22 * s + 78 * s + 34 * s + R.porEstacion.length * 50 * s + 14 * s + altoTextos + 40 * s;
      if (alto <= H - 110) break;
      s *= 0.92;
    }
    const x = (W - ancho) / 2;
    let y = Math.max(76, (H - alto) / 2 + 20);
    cajaMenu(c, x, y, ancho, alto, { relleno: 'rgba(8,5,3,0.84)' });
    const x0 = x + pad, x1 = x + ancho - pad;
    y += pad;

    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = Math.round(14 * s) + 'px ' + FUENTE.instrumento;
    c.fillStyle = col;
    c.fillText(('TABLERO · ' + nombreDe(this.motor, i)).split('').join(' '), W / 2, y);
    y += 22 * s;
    tituloMenu(c, R.hallazgos + ' de ' + R.existentes, W / 2, y + 36 * s, Math.round(68 * s));
    y += 78 * s;
    c.textBaseline = 'top';
    textoMenu(c, 'cosas escondidas encontradas', W / 2, y, Math.round(20 * s), MENU.beige);
    y += 34 * s;

    // una fila por tramo: lo que había frente a lo encontrado
    for (const e of R.porEstacion) {
      c.textAlign = 'left';
      textoMenu(c, e.nombre, x0, y, Math.round(19 * s), MENU.beige);
      c.textAlign = 'right';
      textoMenu(c, e.encontrados + ' / ' + e.existentes, x1, y, Math.round(19 * s), e.encontrados ? ROJO : 'rgba(205,187,138,0.6)');
      const yb = y + 26 * s;
      const paso = (x1 - x0) / Math.max(1, e.existentes);
      for (let n = 0; n < e.existentes; n++) {
        c.fillStyle = n < e.encontrados ? ROJO : 'rgba(255,255,255,0.12)';
        c.fillRect(x0 + n * paso + 1, yb, paso - 4, 13 * s);
      }
      y += 50 * s;
    }
    y += 14 * s;

    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.font = Math.round(18 * s) + 'px ' + FUENTE.interfaz;
    c.fillStyle = '#d6c8a2';
    for (const t of textos) {
      t.forEach((l) => { c.fillText(l, x0, y); y += 24 * s; });
      y += 6 * s;
    }
    c.textAlign = 'center';
    c.font = 'bold ' + Math.round(22 * s) + 'px ' + MENU.letra;
    c.fillStyle = '#f0c977';
    c.fillText(R.puntos + ' puntos', W / 2, y + 8 * s);
  }

  _dibujarGanador(c, W, H) {
    const n = this.participantes.length;
    let texto;
    if (n < 2) texto = null;
    else if (this.ganador < 0) texto = 'Empate';
    else texto = textoGana(this.motor, this.participantes[this.ganador]);
    if (texto) {
      c.font = 'bold 40px ' + MENU.letra;
      const w = c.measureText(texto).width + 70;
      cajaMenu(c, (W - w) / 2, 10, w, 60, { relleno: 'rgba(8,5,3,0.92)' });
      c.textAlign = 'center';
      tituloMenu(c, texto, W / 2, 41, 40);
    }
    if (this.tFase > BLOQUEO_TABLERO) {
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      textoMenu(c, 'Pulsa ' + this._nombreBoton(this.participantes[0]) + ' para ver qué acabas de hacer',
        W / 2, H - 20, 20, Math.sin(this.t * 4) > -0.45 ? '#f0c977' : 'rgba(205,187,138,0.5)');
    }
  }

  // --------------------------------------------------------- revelación
  _dibujarRevelacion(c, W, H) {
    dibujarRevelacion(c, W, H, {
      titulo: 'Así trabajamos',
      filas: ASI_TRABAJAMOS.map((f) => ({
        ...f, color: f.que.includes('rojo') ? ROJO : f.que.includes('◆') ? AZUL_DATO : '#f0c977',
      })),
      cierre: 'No nos quedamos con lo que el proceso dice de sí mismo. Vamos a ver.',
      pie: this.tFase > 2 ? 'Pulsa ' + this._nombreBoton(this.participantes[0] || 0) + ' para continuar' : null,
      t: this.tFase,
      reloj: this.t,
    });
  }
}

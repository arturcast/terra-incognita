/**
 * regreso.js — ETAPA 3, "El Regreso". Un Flappy Bird, con paloma mensajera.
 *
 * Las reglas y la física están en `src/juego/vuelo.js`, que es puro y se
 * prueba en Node. Aquí solo se dibuja y se escucha el mando.
 *
 * Los dos jugadores vuelan EL MISMO cielo (decisión del usuario): se ven, se
 * estorban la vista y se comparan sin discusión. El Jugador 2 se une pulsando
 * cualquier botón de su mando durante las instrucciones, igual que en El Camino.
 *
 * REGLA DE ORO: mientras se vuela no se nombra el oficio. «Sobres», «aros» y
 * «puestos de control». Informe, recomendaciones y seguimiento se nombran en la
 * revelación del final, y solo ahí.
 */

import { Escena } from '../../core/engine.js';
import { Acciones } from '../../core/input.js';
import { Briefing, partirLineas } from '../../core/briefing.js';
import { PALETA, FUENTE, rectRedondeado, grano, suave, limitar } from '../../core/render.js';
import { VUELO, generarCielo, Vuelo, ganadorVuelo } from '../vuelo.js';

const COLOR_J = [PALETA.oro, PALETA.senal];
const AZUL = '#5aa9e6';
const ORO_ARO = '#f0c977';
/** Segundos que el tablero se queda sí o sí: quien llega aleteando no se lo salta. */
const BLOQUEO_TABLERO = 3;

/** Lo que acaba de hacer, traducido a lo que hace el área. Pantalla final. */
const ASI_TERMINAMOS = [
  { que: 'Los sobres', es: 'El informe con los hallazgos. Sin él, lo que encontramos no existe para la compañía.' },
  { que: 'Los aros', es: 'Las recomendaciones: lo que proponemos hacer, acordado con el proceso.' },
  { que: 'Los puestos de control', es: 'El seguimiento a los planes de acción: volvemos a mirar, con fecha y responsable.' },
  { que: 'Las columnas', es: 'Y sí: meses después siempre hay una razón para no haberlo hecho todavía.' },
];

export class EscenaRegreso extends Escena {
  static jugadores = 'uno-o-dos';

  constructor(motor) {
    super(motor);
    this.acciones = motor.jugadores.map((j) => new Acciones(j));

    this.guia = new Briefing({
      etiqueta: 'Etapa 3 · El Regreso',
      titulo: 'Llévalo de vuelta',
      entrada: 'Encontraste lo que nadie estaba viendo. Ahora hay que contarlo, y eso es otro viaje: todo el mundo tiene una razón para dejarlo para después.',
      pasos: [
        'Pulsa el gatillo para batir las alas. Nada más.',
        'Atraviesa los aros dorados: cada uno entrega algo de lo que traes.',
        'Pasa por los puestos de control: son la vuelta a verificar que sí cambió.',
        'Las columnas son las excusas. Chocar no te saca del juego, pero te hace perder algo de lo que llevabas.',
      ],
      aviso: 'Pueden jugar dos, en el mismo cielo. Gana quien entregue más.',
      continuar: 'Jugador 1: pulsa {B} para despegar',
      minimo: 1.2,
    });

    this.teclado = false;
    this.raton = false;
    this._onTecla = (e) => { if (e.key === ' ' || e.key === 'Enter') this.teclado = true; };
    this._onClic = () => { this.raton = true; };
    this._onBotonReserva = (ev) => this._unirse(ev.detail.entrada);
  }

  get audio() { return this.motor.audio; }
  recentrarPuntero() {}

  async entrar() {
    this.fase = 'guia';
    this.t = 0;
    this.tFase = 0;
    this.guia.reiniciar();
    this.vuelos = [];
    this.participantes = [];
    this.resultados = [];
    this.ganador = 0;
    this.avisos = [[], []];
    this.aviso2 = null;
    this.semilla = (Math.random() * 1e9) | 0;
    this.cielo = generarCielo(this.semilla);
    this.nubes = Array.from({ length: 9 }, (_, i) => ({
      x: i * 420 + (i * 137) % 300, y: 60 + ((i * 91) % 240), r: 30 + (i % 4) * 14,
    }));

    window.addEventListener('keydown', this._onTecla);
    window.addEventListener('mousedown', this._onClic);
    if (this.motor.gestor) this.motor.gestor.addEventListener('botonReserva', this._onBotonReserva);
    this.audio && this.audio.musica('exploracion');
  }

  salir() {
    window.removeEventListener('keydown', this._onTecla);
    window.removeEventListener('mousedown', this._onClic);
    if (this.motor.gestor) this.motor.gestor.removeEventListener('botonReserva', this._onBotonReserva);
  }

  async _unirse(entrada) {
    const g = this.motor.gestor;
    if (this.fase !== 'guia' || !g || g.ranuras[1]) return;
    const ok = await g.activar(entrada.id, 1);
    if (ok) {
      this.aviso2 = { t: 2.5 };
      this.audio && this.audio.sfx('elegir');
    }
  }

  // ------------------------------------------------------------- entrada
  /** Pulsaciones sueltas: teclado y ratón valen como jugador 1. */
  _tomarSueltas() {
    const si = this.teclado || this.raton;
    this.teclado = false;
    this.raton = false;
    return si;
  }

  _confirmo() {
    let si = this._tomarSueltas();
    for (const i of this.motor.jugadoresActivos) if (this.acciones[i].confirmar()) si = true;
    return si;
  }

  _nombreBoton(i) {
    const jc = this.motor.jugadores[i];
    return jc.estado.conectado ? this.acciones[i].nombreConfirmar : 'ESPACIO';
  }

  /** Cuántos hallazgos trae cada jugador de El Camino: son sus sobres. */
  _hallazgosDe(k) {
    const p = this.motor.expedicion.puntajes || {};
    const rs = (p.camino && p.camino.resultados) || [];
    return rs[k] ? rs[k].hallazgos : (rs[0] ? rs[0].hallazgos : 0);
  }

  _despegar() {
    const activos = this.motor.jugadoresActivos;
    this.participantes = activos.length ? activos : [0];
    this.vuelos = this.participantes.map((_, k) => new Vuelo(this.cielo, this._hallazgosDe(k)));
    this._tomarSueltas();                       // lo pulsado para empezar no es un aleteo
    for (const i of this.participantes) this.acciones[i].confirmar();
    this.fase = 'cuenta';
    this.tFase = 0;
    this.audio && this.audio.sfx('fase');
  }

  _aviso(k, texto, color, vida = 1.3) {
    this.avisos[k] = [...this.avisos[k].filter((a) => a.texto !== texto), { texto, color, vida, max: vida }];
  }

  // ---------------------------------------------------------- actualizar
  actualizar(dt) {
    this.t += dt;
    this.tFase += dt;
    if (this.aviso2) { this.aviso2.t -= dt; if (this.aviso2.t <= 0) this.aviso2 = null; }
    for (const lista of this.avisos) for (const a of lista) a.vida -= dt;
    this.avisos = this.avisos.map((l) => l.filter((a) => a.vida > 0));

    if (this.fase === 'guia') {
      this.guia.actualizar(dt);
      const pulso = this._confirmo();
      if (this.guia.puedeContinuar && pulso) this._despegar();
      return;
    }

    if (this.fase === 'cuenta') {
      this._confirmo();                          // se consume: no cuenta como aleteo
      if (this.tFase >= 3) {
        this.fase = 'vuelo';
        this.tFase = 0;
        this.audio && this.audio.musica('carrera');
      }
      return;
    }

    if (this.fase === 'vuelo') {
      const sueltas = this._tomarSueltas();
      this.vuelos.forEach((v, k) => {
        const i = this.participantes[k];
        const jc = this.motor.jugadores[i];
        const aletear = (jc.estado.conectado && this.acciones[i].confirmar()) || (k === 0 && sueltas);
        v.actualizar(dt, aletear);
        this._eventos(v, k, i);
      });
      if (this.vuelos.every((v) => v.terminado)) this._terminar();
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
        this.motor.ir('ruta', { completada: 'regreso' });
      }
    }
  }

  _eventos(v, k, i) {
    const au = this.audio;
    const jc = this.motor.jugadores[i];
    for (const e of v.eventos) {
      switch (e.tipo) {
        case 'aleteo':
          au && au.sfx('tic');
          break;
        case 'entrega':
          au && au.sfx('descubrir');
          jc.pulso(90, 0.6, 70);
          this._aviso(k, '¡Entregado!', ORO_ARO, 1.2);
          break;
        case 'sinSobres':
          this._aviso(k, 'Ya no te queda nada que entregar', PALETA.tintaTenue, 1.4);
          break;
        case 'seguimiento':
          au && au.sfx('control');
          this._aviso(k, 'Volviste a verificar', PALETA.exito, 1.2);
          break;
        case 'choque':
          au && au.sfx('choque');
          jc.pulso(240, 0.9, 200);
          this._aviso(k, e.motivo === 'suelo' ? 'Te fuiste al suelo' : '«' + e.motivo + '»', '#f0917e', 1.6);
          break;
        default:
          break;
      }
    }
  }

  _terminar() {
    this.resultados = this.vuelos.map((v) => v.resultado());
    this.ganador = ganadorVuelo(this.resultados);
    this.motor.expedicion.puntajes.regreso = { resultados: this.resultados, ganador: this.ganador };
    this.fase = 'tablero';
    this.tFase = 0;
    this.audio && this.audio.musica('revelacion');
    this.audio && this.audio.sfx('revelar');
  }

  // ------------------------------------------------------------- dibujar
  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;

    if (this.fase === 'guia') {
      c.fillStyle = PALETA.fondoHondo;
      c.fillRect(0, 0, W, H);
      this._cielo(c, W, H, 0.35);
      this.guia.dibujar(c, W, H, this._nombreBoton(0));
      this._dibujarUnion(c, W, H);
      return;
    }

    if (this.fase === 'tablero') { this._dibujarTablero(c, W, H); grano(c, W, H); return; }
    if (this.fase === 'revelacion') { this._dibujarRevelacion(c, W, H); grano(c, W, H); return; }

    // cuenta y vuelo comparten el cielo
    const esc = H / VUELO.alto;
    const ref = this.vuelos[0] || { distancia: 0 };
    this._cielo(c, W, H, 1, ref.distancia);
    c.save();
    c.scale(esc, esc);
    this._mundo(c, W / esc, ref.distancia);
    this.vuelos.forEach((v, k) => this._paloma(c, v, k, ref.distancia));
    c.restore();
    this._hud(c, W, H);
    if (this.fase === 'cuenta') this._dibujarCuenta(c, W, H);
    grano(c, W, H, 0.025);
  }

  /** Cielo de tarde, nubes y ciudad lejana. Se mueve más lento: da profundidad. */
  _cielo(c, W, H, alfa = 1, distancia = 0) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#12314a');
    g.addColorStop(0.55, '#2b567a');
    g.addColorStop(1, '#6a7f8c');
    c.globalAlpha = alfa;
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    const esc = H / VUELO.alto;
    // sol
    c.fillStyle = 'rgba(240,201,119,0.35)';
    c.beginPath();
    c.arc(W * 0.78, H * 0.22, 60 * esc, 0, Math.PI * 2);
    c.fill();

    // nubes, a un tercio de velocidad
    c.fillStyle = 'rgba(255,255,255,0.10)';
    for (const n of this.nubes) {
      const x = ((n.x - distancia * 0.3) % (W / esc + 500) + (W / esc + 500)) % (W / esc + 500) - 250;
      c.beginPath();
      c.arc(x * esc, n.y * esc, n.r * esc, 0, Math.PI * 2);
      c.arc((x + n.r) * esc, (n.y + 6) * esc, n.r * 0.8 * esc, 0, Math.PI * 2);
      c.arc((x - n.r) * esc, (n.y + 8) * esc, n.r * 0.7 * esc, 0, Math.PI * 2);
      c.fill();
    }

    // ciudad lejana, a media velocidad
    const base = H - VUELO.suelo * esc;
    c.fillStyle = 'rgba(12,28,40,0.35)';
    const paso = 90 * esc;
    const off = (-distancia * 0.5 * esc) % (paso * 2);
    for (let x = off - paso * 2; x < W + paso; x += paso) {
      const k = Math.abs(Math.round((x - off) / paso)) % 5;
      const alto = (48 + k * 26) * esc;
      c.fillRect(x, base - alto, paso * 0.82, alto);
    }
    c.globalAlpha = 1;
  }

  /** Columnas, aros, puestos y suelo. En coordenadas lógicas (alto 720). */
  _mundo(c, anchoL, distancia) {
    const sueloY = VUELO.alto - VUELO.suelo;
    const v0 = this.vuelos[0];

    if (v0) {
      const { columnas, puestos } = v0.visibles(anchoL);

      // puestos de control: un poste con bandera sobre el suelo
      for (const p of puestos) {
        const x = p.x - distancia;
        c.strokeStyle = 'rgba(232,217,181,0.55)';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(x, sueloY);
        c.lineTo(x, sueloY - 96);
        c.stroke();
        c.fillStyle = p.pasado ? PALETA.exito : 'rgba(78,201,165,0.55)';
        c.beginPath();
        c.moveTo(x, sueloY - 96);
        c.lineTo(x + 46, sueloY - 84);
        c.lineTo(x, sueloY - 70);
        c.closePath();
        c.fill();
      }

      // Solo las columnas cercanas llevan su cartel: con todos a la vez, el
      // cielo se vuelve ilegible y las excusas dejan de leerse.
      const conTexto = columnas.filter((col) => col.x > v0.x).slice(0, 2);
      for (const col of columnas) this._columna(c, col, distancia, sueloY, conTexto.includes(col));
    }

    // suelo
    c.fillStyle = '#3f4f45';
    c.fillRect(0, sueloY, anchoL, VUELO.suelo);
    c.fillStyle = '#4e6b4f';
    c.fillRect(0, sueloY, anchoL, 10);
    c.fillStyle = 'rgba(0,0,0,0.18)';
    const paso = 46;
    const off = (-distancia) % paso;
    for (let x = off; x < anchoL; x += paso) c.fillRect(x, sueloY + 16, 20, 5);
  }

  /** Una columna: tubería amarilla de gas, con la excusa escrita en su cartel. */
  _columna(c, col, distancia, sueloY, conTexto = true) {
    const x = col.x - distancia;
    const w = VUELO.anchoColumna;
    const arriba = col.y - VUELO.hueco / 2;
    const abajo = col.y + VUELO.hueco / 2;

    const pintar = (y, alto) => {
      c.fillStyle = '#d8ac2f';
      c.fillRect(x - w / 2, y, w, alto);
      c.fillStyle = 'rgba(255,255,255,0.18)';
      c.fillRect(x - w / 2 + 6, y, 10, alto);
      c.fillStyle = 'rgba(0,0,0,0.20)';
      c.fillRect(x + w / 2 - 12, y, 12, alto);
    };
    const boca = (y, haciaArriba) => {
      c.fillStyle = '#c1962a';
      c.fillRect(x - w / 2 - 7, haciaArriba ? y - 22 : y, w + 14, 22);
    };

    pintar(0, arriba);
    boca(arriba, true);
    pintar(abajo, sueloY - abajo);
    boca(abajo, false);

    // el aro dorado, en el centro del paso
    if (col.aro && !col.aroTomado) {
      const r = VUELO.radioAro;
      const p = 1 + Math.sin(this.t * 3 + col.x) * 0.04;
      c.save();
      c.translate(x, col.y);
      c.scale(p, p);
      c.strokeStyle = ORO_ARO;
      c.lineWidth = 9;
      c.beginPath();
      c.ellipse(0, 0, r * 0.45, r, 0, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = 'rgba(240,201,119,0.35)';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(0, 0, r * 0.45 + 9, r + 9, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    // el cartel con la excusa, colgado de la columna de arriba
    if (!conTexto) return;
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '15px ' + FUENTE.interfaz;
    const ancho = c.measureText(col.texto).width + 26;
    const y = Math.max(34, arriba - 34);
    c.fillStyle = 'rgba(8,12,18,0.82)';
    rectRedondeado(c, x - ancho / 2, y - 15, ancho, 30, 6);
    c.fill();
    c.strokeStyle = 'rgba(232,217,181,0.35)';
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = PALETA.tinta;
    c.fillText('«' + col.texto + '»', x, y + 1);
    c.restore();
  }

  /** La paloma: cuerpo, ala que aletea, morral con los sobres. */
  _paloma(c, v, k, distancia) {
    const col = COLOR_J[this.participantes[k] % 2];
    const x = VUELO.xPaloma + (v.x - distancia - VUELO.xPaloma);
    const parpadeo = v.invulnerable > 0 && Math.sin(this.t * 22) < 0;
    if (parpadeo) return;

    c.save();
    c.translate(x, v.y);
    c.rotate(v.giro * 0.6);

    // sombra en el suelo, para saber a qué altura va
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.restore();

    const r = VUELO.radio;
    // cuerpo
    c.fillStyle = k === 0 ? '#9fb4c6' : '#c9b08c';
    c.beginPath();
    c.ellipse(0, 0, r * 1.25, r, 0, 0, Math.PI * 2);
    c.fill();
    // cabeza
    c.beginPath();
    c.arc(r * 0.95, -r * 0.45, r * 0.62, 0, Math.PI * 2);
    c.fill();
    // pico
    c.fillStyle = '#e8a33c';
    c.beginPath();
    c.moveTo(r * 1.5, -r * 0.5);
    c.lineTo(r * 2.15, -r * 0.3);
    c.lineTo(r * 1.5, -r * 0.1);
    c.closePath();
    c.fill();
    // ojo
    c.fillStyle = '#10171f';
    c.beginPath();
    c.arc(r * 1.15, -r * 0.6, r * 0.13, 0, Math.PI * 2);
    c.fill();
    // morral: su color es el del jugador
    c.fillStyle = col;
    c.fillRect(-r * 0.9, -r * 0.15, r * 1.1, r * 0.95);
    // sobres que todavía lleva
    if (v.sobres > 0) {
      c.fillStyle = '#f3ead6';
      c.fillRect(-r * 0.75, -r * 0.55, r * 0.8, r * 0.5);
      c.strokeStyle = '#b53a2c';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-r * 0.75, -r * 0.55);
      c.lineTo(-r * 0.35, -r * 0.22);
      c.lineTo(r * 0.05, -r * 0.55);
      c.stroke();
    }
    // ala: sube y baja con la velocidad vertical
    const ala = v.volando ? limitar(-v.vy / 700, -0.9, 0.9) : -0.6;
    c.save();
    c.rotate(ala);
    c.fillStyle = k === 0 ? '#7e93a8' : '#a98f6c';
    c.beginPath();
    c.ellipse(-r * 0.25, r * 0.1, r * 0.95, r * 0.5, -0.25, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.restore();
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

  // ----------------------------------------------------------------- HUD
  _hud(c, W, H) {
    const uno = this.vuelos.length < 2;
    this.vuelos.forEach((v, k) => {
      const col = COLOR_J[this.participantes[k] % 2];
      const x = k === 0 ? 22 : W - 22;
      const alinear = k === 0 ? 'left' : 'right';
      c.textAlign = alinear;
      c.textBaseline = 'top';

      c.font = '11px ' + FUENTE.instrumento;
      c.fillStyle = col;
      c.fillText(uno ? 'TU VUELO' : 'JUGADOR ' + (this.participantes[k] + 1), x, 20);

      c.font = 'bold 52px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tinta;
      c.fillText(String(v.entregas), x, 36);

      c.font = '13px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tintaTenue;
      c.fillText('entregados', x, 94);

      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = v.sobres ? PALETA.oroClaro : PALETA.tintaDebil;
      c.fillText('✉ ' + v.sobres + ' por entregar', x, 118);

      c.fillStyle = PALETA.exito;
      c.fillText('✓ ' + v.seguimientos + ' verificados', x, 140);

      // avisos del jugador
      let y = 176;
      c.font = '16px ' + FUENTE.interfaz;
      for (const a of this.avisos[k]) {
        c.globalAlpha = limitar(a.vida / 0.5, 0, 1);
        c.fillStyle = a.color;
        c.fillText(a.texto, x, y);
        c.globalAlpha = 1;
        y += 24;
      }
    });

    // tiempo que queda, arriba en el centro
    const v = this.vuelos[0];
    if (v) {
      const quedan = Math.max(0, Math.ceil(VUELO.duracion - v.t));
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.font = '13px ' + FUENTE.instrumento;
      c.fillStyle = quedan <= 10 ? PALETA.alerta : PALETA.tintaTenue;
      c.fillText(quedan + ' s', W / 2, 22);
      const ancho = Math.min(320, W * 0.3);
      c.fillStyle = 'rgba(255,255,255,0.12)';
      c.fillRect(W / 2 - ancho / 2, 44, ancho, 5);
      c.fillStyle = quedan <= 10 ? PALETA.alerta : PALETA.oro;
      c.fillRect(W / 2 - ancho / 2, 44, ancho * (1 - v.t / VUELO.duracion), 5);
    }

    if (this.fase === 'vuelo' && this.t < 6) {
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tintaTenue;
      c.fillText('Pulsa ' + this._nombreBoton(this.participantes[0]) + ' para aletear', W / 2, H - 22);
    }
  }

  _dibujarUnion(c, W, H) {
    const g = this.motor.gestor;
    const j2 = this.motor.jugadores[1];
    const listo = j2 && j2.estado.conectado;
    const texto = listo
      ? 'Jugador 2 listo · ' + (j2.esIzquierdo ? 'Joy-Con L' : 'Joy-Con R')
      : (g && g.relevo
        ? '¿Juegan dos? Que el Jugador 2 pulse cualquier botón del otro Joy-Con'
        : 'Juega uno. Para jugar dos, enciende el otro Joy-Con');
    c.font = '15px ' + FUENTE.interfaz;
    const w = c.measureText(texto).width + 40;
    const x = (W - w) / 2, y = H - 64;
    c.fillStyle = listo ? 'rgba(90,169,230,0.16)' : 'rgba(255,255,255,0.05)';
    rectRedondeado(c, x, y, w, 38, 19);
    c.fill();
    c.strokeStyle = listo ? AZUL : 'rgba(255,255,255,0.12)';
    c.lineWidth = 1;
    c.stroke();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = listo ? AZUL : PALETA.tintaTenue;
    c.fillText(texto, W / 2, y + 19);
    if (this.aviso2) {
      c.font = 'bold 22px ' + FUENTE.interfaz;
      c.fillStyle = AZUL;
      c.fillText('¡El Jugador 2 se unió!', W / 2, y - 30);
    }
  }

  // ------------------------------------------------------------- tablero
  _dibujarTablero(c, W, H) {
    c.fillStyle = PALETA.fondo;
    c.fillRect(0, 0, W, H);
    const cx = W / 2;
    const ancho = Math.min(760, W - 60);

    let y = Math.max(40, H * 0.12);
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = '11px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.oro;
    c.fillText('LO QUE LLEGÓ DE VUELTA', cx, y);
    y += 30;

    const cols = this.resultados.length;
    const anchoCol = ancho / cols;
    this.resultados.forEach((R, k) => {
      const col = COLOR_J[this.participantes[k] % 2];
      const x = cx - ancho / 2 + anchoCol * k + anchoCol / 2;
      let yy = y;

      c.font = '12px ' + FUENTE.instrumento;
      c.fillStyle = col;
      c.fillText(cols > 1 ? 'JUGADOR ' + (this.participantes[k] + 1) : 'TU VUELO', x, yy);
      yy += 26;

      c.font = 'bold ' + Math.round(76 * suave(Math.min(1, this.tFase / 0.8))) + 'px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tinta;
      c.fillText(String(R.entregas), x, yy);
      yy += 84;

      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tintaTenue;
      c.fillText('entregados de ' + R.sobresIniciales + ' que traías', x, yy);
      yy += 32;

      const lineas = [
        ['✓ ' + R.seguimientos + (R.seguimientos === 1 ? ' vez volviste a verificar' : ' veces volviste a verificar'), PALETA.exito],
        [R.choques ? 'Te frenaron ' + R.choques + (R.choques === 1 ? ' vez' : ' veces') : 'No te frenó ninguna excusa', R.choques ? '#f0917e' : PALETA.tintaTenue],
        [R.perdidos ? 'Se te cayeron ' + R.perdidos + (R.perdidos === 1 ? ' sobre' : ' sobres') : 'No se te cayó ningún sobre', PALETA.tintaTenue],
        [R.sinEntregar ? 'Te quedaste con ' + R.sinEntregar + ' sin entregar' : 'Entregaste todo lo que traías', R.sinEntregar ? PALETA.alerta : PALETA.exito],
      ];
      c.font = '14px ' + FUENTE.interfaz;
      for (const [texto, color] of lineas) {
        c.fillStyle = color;
        partirLineas(c, texto, anchoCol - 24).forEach((l) => { c.fillText(l, x, yy); yy += 20; });
        yy += 4;
      }
    });

    if (this.resultados.length > 1 && this.tFase > 1.2) {
      const texto = this.ganador < 0 ? 'EMPATE' : 'GANA EL JUGADOR ' + (this.participantes[this.ganador] + 1);
      c.font = 'bold 26px ' + FUENTE.interfaz;
      c.fillStyle = this.ganador < 0 ? PALETA.tinta : COLOR_J[this.participantes[this.ganador] % 2];
      c.fillText(texto, cx, H - 96);
    }

    if (this.tFase > BLOQUEO_TABLERO) {
      c.textBaseline = 'bottom';
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = Math.sin(this.t * 4) > -0.45 ? PALETA.oro : PALETA.tintaDebil;
      c.fillText('Pulsa ' + this._nombreBoton(this.participantes[0]) + ' para ver qué acabas de hacer', cx, H - 22);
    }
  }

  // ---------------------------------------------------------- revelación
  _dibujarRevelacion(c, W, H) {
    c.fillStyle = PALETA.fondoHondo;
    c.fillRect(0, 0, W, H);
    const cx = W / 2;
    const ancho = Math.min(980, W - 80);
    const colQue = Math.min(250, ancho * 0.3);

    c.font = '15px ' + FUENTE.interfaz;
    const filas = ASI_TERMINAMOS.map((f) => partirLineas(c, f.es, ancho - colQue - 30));
    const altoFilas = filas.reduce((s, l) => s + Math.max(1, l.length) * 21 + 18, 0);
    const alto = 30 + 60 + altoFilas + 80;
    let y = Math.max(30, (H - alto) / 2);

    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.font = '11px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.oro;
    c.fillText('LO QUE ACABAS DE HACER, EN LA VIDA REAL', cx, y);
    y += 30;
    c.font = '34px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tinta;
    c.fillText('Así terminamos', cx, y);
    y += 60;

    const x0 = cx - ancho / 2;
    ASI_TERMINAMOS.forEach((f, n) => {
      c.globalAlpha = suave(Math.min(1, (this.tFase - n * 0.25) / 0.6));
      c.textAlign = 'left';
      c.font = 'bold 16px ' + FUENTE.interfaz;
      c.fillStyle = n === 0 ? PALETA.tinta : n === 1 ? ORO_ARO : n === 2 ? PALETA.exito : '#f0917e';
      c.fillText(f.que, x0, y);
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.tinta;
      filas[n].forEach((l, m) => c.fillText(l, x0 + colQue + 30, y + m * 21));
      y += Math.max(1, filas[n].length) * 21 + 18;
      c.globalAlpha = 1;
    });

    if (this.tFase > 1.4) {
      c.globalAlpha = suave(Math.min(1, (this.tFase - 1.4) / 0.8));
      c.textAlign = 'center';
      c.font = 'italic 22px ' + FUENTE.narrativa;
      c.fillStyle = PALETA.oro;
      c.fillText('Un hallazgo que nadie verifica es una anécdota.', cx, y + 14);
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

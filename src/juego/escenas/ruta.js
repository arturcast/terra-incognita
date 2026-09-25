/**
 * ruta.js — La pantalla que se ve ENTRE una etapa y otra.
 *
 * Lo pidió el usuario tras probar El Camino: «cuando vayamos a pasar de etapa
 * a etapa, volver a la pantalla donde se muestran todas las etapas, que
 * muestre que una se terminó con un check y pasamos a la siguiente iluminando
 * y entrando».
 *
 * Sirve para dos cosas: que el visitante sepa cuánto lleva y cuánto le falta,
 * y que las tres etapas se sientan un solo recorrido y no tres juegos sueltos.
 *
 * REGLA DE ORO: esta pantalla se ve MIENTRAS se juega, así que aquí no se
 * nombra el oficio. Nada de «auditoría», «hallazgo» ni «plan anual»: eso es de
 * las revelaciones y del cierre. Ver docs/NARRATIVA.md.
 *
 * La escena se conduce sola: sella, ilumina y entra. El gatillo solo sirve
 * para ir más rápido, nunca para saltarse el sello.
 */

import { Escena } from '../../core/engine.js';
import { Acciones } from '../../core/input.js';
import { partirLineas } from '../../core/briefing.js';
import { PALETA, FUENTE, grano, vineta, suave, limitar } from '../../core/render.js';
import { generarCosta, generarIsla, REGIONES } from '../../datos/territorio.js';

/** Las tres paradas del recorrido, en orden. */
export const PARADAS = [
  { id: 'mapa', n: '1', titulo: 'El Mapa', que: 'Elige a dónde ir', quienes: '1 jugador' },
  { id: 'camino', n: '2', titulo: 'El Camino', que: 'Encuentra lo que está escondido', quienes: '1 o 2 jugadores' },
  { id: 'regreso', n: '3', titulo: 'El Regreso', que: 'Llévalo de vuelta y verifica', quienes: '1 o 2 jugadores' },
];

/**
 * Tiempos de la secuencia, en segundos. El sello tiene su momento propio: es
 * lo que el visitante viene a ver después de esforzarse una etapa entera.
 */
const T = {
  sello: 1.1,      // cae el ✓ de la etapa recién terminada
  senda: 2.1,      // el sendero empieza a iluminarse hacia la siguiente
  entrada: 3.5,    // la siguiente crece y se entra
  total: 4.4,
};

/** Segundos mínimos entre dos adelantos pulsando. Ver actualizar(). */
const ESPERA_ADELANTO = 0.5;

export class EscenaRuta extends Escena {
  constructor(motor) {
    super(motor);
    this.acciones = motor.jugadores.map((jc) => new Acciones(jc));
    this.costa = generarCosta();
    this.isla = generarIsla();
    this.teclado = false;
    this.raton = false;
    this._onTecla = (e) => { if (e.key === 'Enter' || e.key === ' ') this.teclado = true; };
    this._onClic = () => { this.raton = true; };
  }

  get audio() { return this.motor.audio; }

  /**
   * @param {{completada?: string}} datos qué etapa se acaba de terminar.
   */
  async entrar(datos) {
    const exp = this.motor.expedicion;
    this.recien = (datos && datos.completada) || null;
    if (this.recien && !exp.etapasCompletadas.includes(this.recien)) {
      exp.etapasCompletadas.push(this.recien);
    }
    this.completadas = exp.etapasCompletadas.slice();

    this.indiceRecien = this.recien ? PARADAS.findIndex((p) => p.id === this.recien) : -1;
    this.siguiente = PARADAS.find((p) => !this.completadas.includes(p.id)) || null;
    this.indiceSiguiente = this.siguiente ? PARADAS.indexOf(this.siguiente) : -1;
    // La Etapa 3 todavía puede no estar construida: entonces esta pantalla la
    // muestra como próximamente y el recorrido se va al cierre.
    this.existeSiguiente = !!(this.siguiente && this.motor.escenas.has(this.siguiente.id));

    // Sin etapa recién terminada (la primera visita) no hay sello que esperar.
    this.t = this.recien ? 0 : T.sello;
    this._ultimoAdelanto = -ESPERA_ADELANTO;
    this._yendo = false;
    this.teclado = false;
    this.raton = false;

    window.addEventListener('keydown', this._onTecla);
    window.addEventListener('mousedown', this._onClic);
    this.audio && this.audio.musica('decision');
    if (this.recien) this.motor.jc.pulso(180, 0.6, 120);
  }

  salir() {
    window.removeEventListener('keydown', this._onTecla);
    window.removeEventListener('mousedown', this._onClic);
  }

  /** ¿Alguien pulsó? Cualquier jugador conectado, teclado o ratón. */
  _pulso() {
    let si = this.teclado || this.raton;
    for (const i of this.motor.jugadoresActivos) if (this.acciones[i].confirmar()) si = true;
    this.teclado = false;
    this.raton = false;
    return si;
  }

  actualizar(dt) {
    const antes = this.t;
    this.t += dt;

    // Sonidos en su momento exacto, una sola vez.
    if (this.recien && antes < T.sello && this.t >= T.sello) {
      this.audio && this.audio.sfx('especial');
      this.motor.jc.pulso(320, 0.9, 260);
    }
    if (antes < T.senda && this.t >= T.senda) this.audio && this.audio.sfx('avanzar');

    // Pulsar adelanta a la siguiente parte de la secuencia, pero nunca se la
    // salta: entre dos adelantos hay que dejar que lo anterior se vea. Quien
    // llega machacando el gatillo desde la etapa anterior vería, si no, el
    // sello y la senda pasar en un fotograma.
    const pulso = this._pulso();
    if (pulso && this.t - this._ultimoAdelanto >= ESPERA_ADELANTO && this.t < T.entrada) {
      this.t = this.t < T.sello ? T.sello : this.t < T.senda ? T.senda : T.entrada;
      this._ultimoAdelanto = this.t;
    }

    if (this.t >= T.total && !this._yendo) {
      this._yendo = true;
      this.audio && this.audio.sfx('fase');
      if (this.existeSiguiente) this.motor.ir(this.siguiente.id);
      else this.motor.ir('cierre', this.motor.expedicion.puntajes.mapa || null);
    }
  }

  // ------------------------------------------------------------- resultado
  /** Una línea con lo que hizo en esa etapa. En idioma del juego, no del oficio. */
  _resumen(id) {
    const p = this.motor.expedicion.puntajes || {};
    if (id === 'mapa' && p.mapa) {
      const n = (p.mapa.elegidas || []).length;
      return n + (n === 1 ? ' equipo enviado' : ' equipos enviados') +
        ' · viste el ' + p.mapa.vision + ' % del mapa';
    }
    if (id === 'camino' && p.camino) {
      const rs = p.camino.resultados || [];
      if (rs.length > 1) {
        return rs.map((r, k) => 'J' + (k + 1) + ': ' + r.hallazgos).join(' · ') +
          ' de ' + rs[0].existentes + ' descubrimientos';
      }
      if (rs.length) return rs[0].hallazgos + ' de ' + rs[0].existentes + ' descubrimientos';
    }
    if (id === 'regreso' && p.regreso) {
      const rs = p.regreso.resultados || [];
      if (rs.length) return rs.map((r) => r.entregas).join(' · ') + ' entregados';
    }
    return null;
  }

  // -------------------------------------------------------------- dibujar
  /** Dónde va cada parada. En pantallas angostas, una debajo de otra. */
  _disposicion(W, H) {
    const enFila = W >= 820;
    return PARADAS.map((p, i) => {
      const f = (i + 1) / (PARADAS.length + 1);
      return enFila
        ? { x: W * (0.13 + f * 0.74), y: H * 0.47, enFila }
        : { x: W / 2, y: H * (0.22 + i * 0.26), enFila };
    });
  }

  dibujar(c) {
    const W = this.motor.ancho, H = this.motor.alto;

    c.fillStyle = PALETA.fondoHondo;
    c.fillRect(0, 0, W, H);
    this._fondo(c, W, H);

    // Al entrar, todo se acerca a la parada siguiente: la pantalla "entra" en ella.
    const pos = this._disposicion(W, H);
    const k = this.t > T.entrada ? suave(limitar((this.t - T.entrada) / (T.total - T.entrada), 0, 1)) : 0;
    c.save();
    if (k > 0 && this.indiceSiguiente >= 0) {
      const d = pos[this.indiceSiguiente];
      const escala = 1 + k * 1.6;
      c.translate(d.x, d.y);
      c.scale(escala, escala);
      c.translate(-d.x, -d.y);
      c.globalAlpha = 1 - k * 0.85;
    }

    this._sendero(c, pos, W, H);
    PARADAS.forEach((p, i) => this._parada(c, p, i, pos[i], pos, W, H));
    c.restore();

    this._titulo(c, W, H);
    this._pie(c, W, H);
    grano(c, W, H, 0.03);
    vineta(c, W, H, 0.55);
  }

  /** El territorio de la Etapa 1, apenas insinuado: es el mismo mundo. */
  _fondo(c, W, H) {
    c.save();
    c.globalAlpha = 0.13;
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
    if (isla) trazar(this.isla, isla.x, isla.y);
    c.restore();
  }

  _titulo(c, W, H) {
    const cx = W / 2;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    const y = Math.max(28, H * 0.10);

    c.font = '13px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.oro;
    c.fillText('T U   R E C O R R I D O', cx, y);

    c.font = 'italic 19px ' + FUENTE.narrativa;
    c.fillStyle = PALETA.tintaTenue;
    const frase = !this.recien
      ? 'Tres tramos. Empecemos por el primero.'
      : this.siguiente
        ? 'Un tramo menos. Queda camino.'
        : 'Recorriste los tres tramos.';
    c.fillText(frase, cx, y + 24);
  }

  _pie(c, W, H) {
    if (this.t > T.entrada) return;
    const nombre = this.acciones[this.motor.jugadoresActivos[0] || 0].nombreConfirmar;
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.font = '15px ' + FUENTE.interfaz;
    c.fillStyle = Math.sin(this.t * 4) > -0.4 ? PALETA.tintaTenue : PALETA.tintaDebil;
    const texto = this.existeSiguiente
      ? 'Pulsa ' + nombre + ' para entrar ya'
      : 'Pulsa ' + nombre + ' para continuar';
    c.fillText(texto, W / 2, H - 26);
  }

  /** El sendero punteado, que se ilumina de una parada a la siguiente. */
  _sendero(c, pos, W, H) {
    const avance = limitar((this.t - T.senda) / (T.entrada - T.senda), 0, 1);
    const radio = this._radio(W, H);

    for (let i = 0; i < pos.length - 1; i++) {
      const a = pos[i], b = pos[i + 1];
      // Fracción de ESTE tramo que ya está iluminada.
      let f = 0;
      if (this.completadas.includes(PARADAS[i + 1].id)) f = 1;
      else if (this.indiceSiguiente === i + 1) f = suave(avance);

      const dx = b.x - a.x, dy = b.y - a.y;
      const largo = Math.hypot(dx, dy);
      const ux = dx / largo, uy = dy / largo;
      const x0 = a.x + ux * (radio + 10), y0 = a.y + uy * (radio + 10);
      const util = largo - (radio + 10) * 2;

      c.save();
      c.lineCap = 'round';
      c.setLineDash([2, 11]);
      c.lineWidth = 3;
      c.strokeStyle = 'rgba(232,217,181,0.20)';
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x0 + ux * util, y0 + uy * util);
      c.stroke();

      if (f > 0) {
        c.setLineDash([]);
        c.lineWidth = 2.5;
        c.strokeStyle = PALETA.oro;
        c.globalAlpha = 0.85;
        c.beginPath();
        c.moveTo(x0, y0);
        c.lineTo(x0 + ux * util * f, y0 + uy * util * f);
        c.stroke();
      }
      c.restore();
    }
  }

  _radio(W, H) { return Math.max(34, Math.min(58, Math.min(W, H) * 0.066)); }

  _parada(c, p, i, d, pos, W, H) {
    const completada = this.completadas.includes(p.id);
    const esRecien = i === this.indiceRecien;
    const esSiguiente = i === this.indiceSiguiente;
    const r = this._radio(W, H);

    // La recién terminada solo se ve sellada cuando cae el sello.
    const sellada = completada && (!esRecien || this.t >= T.sello);
    const despierta = sellada || (esSiguiente && this.t >= T.senda);
    const latido = esSiguiente && this.t >= T.senda
      ? 1 + Math.sin(this.t * 3.4) * 0.035 : 1;

    c.save();
    c.translate(d.x, d.y);
    c.scale(latido, latido);

    // disco
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fillStyle = 'rgba(6,10,16,0.88)';
    c.fill();
    c.lineWidth = despierta ? 3 : 2;
    c.strokeStyle = sellada ? PALETA.exito
      : esSiguiente && this.t >= T.senda ? PALETA.oro
        : 'rgba(217,164,65,0.22)';
    c.stroke();

    if (esSiguiente && this.t >= T.senda) {
      c.beginPath();
      c.arc(0, 0, r + 8 + Math.sin(this.t * 3.4) * 3, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(217,164,65,0.28)';
      c.lineWidth = 2;
      c.stroke();
    }

    // número
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = Math.round(r * 0.95) + 'px ' + FUENTE.narrativa;
    c.fillStyle = sellada ? 'rgba(232,217,181,0.45)' : despierta ? PALETA.tinta : PALETA.tintaDebil;
    c.fillText(p.n, 0, 1);

    // el sello: cae con rebote sobre el número
    if (sellada) {
      const k = esRecien ? limitar((this.t - T.sello) / 0.45, 0, 1) : 1;
      const escala = esRecien ? 1 + (1 - suave(k)) * 1.9 : 1;
      c.save();
      c.scale(escala, escala);
      c.globalAlpha = esRecien ? suave(limitar(k * 1.6, 0, 1)) : 1;
      c.strokeStyle = PALETA.exito;
      c.lineWidth = Math.max(4, r * 0.13);
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(-r * 0.42, 0);
      c.lineTo(-r * 0.12, r * 0.30);
      c.lineTo(r * 0.45, -r * 0.34);
      c.stroke();
      c.restore();
    }
    c.restore();

    // ---- textos debajo, medidos: nunca se montan
    const ancho = d.enFila ? Math.min(270, (W * 0.74) / PARADAS.length - 14) : Math.min(320, W * 0.8);
    let y = d.y + r + 22;
    c.textAlign = 'center';
    c.textBaseline = 'top';

    c.font = '25px ' + FUENTE.narrativa;
    c.fillStyle = despierta ? PALETA.tinta : PALETA.tintaDebil;
    c.fillText(p.titulo, d.x, y);
    y += 32;

    c.font = '16px ' + FUENTE.interfaz;
    c.fillStyle = despierta ? PALETA.tintaTenue : 'rgba(90,96,104,0.75)';
    partirLineas(c, p.que, ancho).forEach((l) => { c.fillText(l, d.x, y); y += 22; });
    y += 4;

    c.font = '12px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.tintaDebil;
    c.fillText(p.quienes, d.x, y);
    y += 21;

    const resumen = sellada ? this._resumen(p.id) : null;
    if (resumen) {
      c.font = '15px ' + FUENTE.interfaz;
      c.fillStyle = PALETA.exito;
      partirLineas(c, resumen, ancho).forEach((l) => { c.fillText(l, d.x, y); y += 20; });
    } else if (esSiguiente && this.t >= T.senda && !this.existeSiguiente) {
      c.font = '13px ' + FUENTE.instrumento;
      c.fillStyle = PALETA.oro;
      c.fillText('PRÓXIMAMENTE', d.x, y);
    } else if (esSiguiente && this.t >= T.senda) {
      c.font = '13px ' + FUENTE.instrumento;
      c.fillStyle = PALETA.oro;
      c.fillText('AHORA', d.x, y);
    }
  }
}

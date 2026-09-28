/**
 * cinematica.js — Videos cortos antes de las instrucciones de cada etapa.
 *
 * Son un AGREGADO: las pantallas de instrucciones (briefing.js) se quedan como
 * están. El video se ve primero y después el visitante lee lo de siempre.
 *
 * Los videos van en `assets/cinematicas/<etapa>.mp4` (mapa, camino, regreso).
 * Una escena puede pedir varios seguidos (el final: `final` y `final2`).
 * Si el archivo no está, no pasa nada: se sigue directo a las instrucciones.
 * Así el hueco existe desde ya y cada video se agrega el día que esté listo,
 * sin tocar código.
 *
 * Se usa la etiqueta <video> del navegador: nada de librerías ni de CDN.
 * El motor la pone como escena mientras dura, para que el gatillo del mando
 * la pueda saltar igual que cualquier otra pantalla.
 */

import { Acciones } from './input.js';

const CARPETA = './assets/cinematicas/';
/** Si en este tiempo el video no empezó a cargar, se da por ausente. */
const ESPERA_CARGA = 1500;
/** Nadie salta un video con la pulsación que lo trajo: medio segundo de gracia. */
const GRACIA = 0.6;

export class Cinematicas {
  /**
   * @param {HTMLElement} capa contenedor con un <video> dentro (index.html)
   * @param {JoyCon[]} jugadores para poder saltar con cualquier mando
   */
  constructor(capa, jugadores) {
    this.capa = capa;
    // Dos <video> que se turnan: cuando un video sigue a otro, el último
    // cuadro del primero se queda en pantalla hasta que el segundo tiene el
    // suyo. Con uno solo, cambiar la fuente dejaba un pantallazo negro.
    this.videos = capa.querySelectorAll ? [...capa.querySelectorAll('video')] : [capa.querySelector('video')];
    /** El video que quedó congelado en su último cuadro esperando al siguiente. */
    this._visible = null;
    this.acciones = jugadores.map((j) => new Acciones(j));
    this._fin = null;
    this._t = 0;
    this._saltar = false;
    this._onTecla = (e) => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') this._saltar = true; };
    this._onClic = () => { this._saltar = true; };
  }

  /**
   * Reproduce `assets/cinematicas/<nombre>.mp4` y espera a que termine o a
   * que lo salten. Si no existe, vuelve enseguida.
   * @param {{hayOtro?: boolean}} [opciones] hayOtro: viene otro video justo
   *   después; la capa no se cierra y este se queda en su último cuadro.
   */
  reproducir(nombre, { hayOtro = false } = {}) {
    return new Promise((resolver) => {
      const anterior = this._visible;
      const v = this.videos.length > 1 && anterior === this.videos[0] ? this.videos[1] : this.videos[0];
      let listo = false;
      const vaciar = (video) => {
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
      // El cuadro congelado del video anterior se quita solo cuando ya hay
      // otra imagen que mostrar (o cuando se cierra la capa).
      const soltarAnterior = () => {
        if (anterior && anterior !== v) {
          anterior.style.display = 'none';
          vaciar(anterior);
        }
        this._visible = null;
      };
      const terminar = () => {
        if (!this._fin) return;
        this._fin = null;
        clearTimeout(espera);
        window.removeEventListener('keydown', this._onTecla);
        this.capa.removeEventListener('mousedown', this._onClic);
        if (hayOtro && listo) {
          v.pause();
          this._visible = v;
        } else {
          vaciar(v);
          if (!hayOtro) {
            soltarAnterior();
            this.capa.classList.add('oculto');
          }
        }
        resolver();
      };
      this._fin = terminar;
      this._t = 0;
      this._saltar = false;

      const espera = setTimeout(() => { if (!listo) terminar(); }, ESPERA_CARGA);
      v.onerror = terminar;                  // no existe: a las instrucciones
      v.onended = terminar;
      v.onloadeddata = () => {
        listo = true;
        clearTimeout(espera);
        v.style.display = '';
        soltarAnterior();
        this.capa.classList.remove('oculto');
        window.addEventListener('keydown', this._onTecla);
        this.capa.addEventListener('mousedown', this._onClic);
        v.play().catch(terminar);
      };
      v.src = CARPETA + nombre + '.mp4';
      v.load();
    });
  }

  // El motor la trata como una escena mientras dura el video.
  actualizar(dt) {
    if (!this._fin) return;
    this._t += dt;
    let pulso = this._saltar;
    this._saltar = false;
    for (const a of this.acciones) if (a.jc.estado.conectado && a.confirmar()) pulso = true;
    if (pulso && this._t > GRACIA) this._fin();
  }

  dibujar() {}
  salir() {}
}

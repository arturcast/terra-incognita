/**
 * vista3d.js — Dibuja El Camino en 3D con Three.js.
 *
 * Es SOLO una forma de dibujar: la etapa sigue decidiéndose en `carrera.js`,
 * que es pura y se prueba en Node. Si este módulo no carga, si la tarjeta no
 * da o si el equipo va lento, `camino.js` vuelve a la vista 2D sin que el
 * jugador se entere. Ver docs/PLAN-GRAFICO-CAMINO.md.
 *
 * Three.js está copiado en `vendor/` (única librería del proyecto, autorizada
 * por el usuario el 2026-09-22): no hay npm, ni CDN, ni compilación.
 *
 * Con dos jugadores se pinta la MISMA escena dos veces, una por mitad de
 * pantalla, ajustando antes qué ha recogido y qué ha revelado cada uno. Por
 * eso lo escondido puede verse en una mitad y no en la otra: es correcto, y es
 * justamente lo que enseña la etapa.
 */

import { CAMINO } from '../carrera.js';
import { Escenario, ANCHO_CARRIL } from './escenario.js';
import { Objetos } from './objetos.js';
import { Explorador } from './explorador.js';

/**
 * Las imágenes van con ruta absoluta desde la raíz del servidor: el juego se
 * sirve siempre desde `localhost:8740/`, y así también las encuentra la
 * herramienta `herramientas/vista-escena.html`, que vive en otra carpeta.
 */
const IMAGENES = {
  tierra: '/assets/tex-camino-tierra.jpg',
  fachada1: '/assets/tex-fachada-caribe-1.jpg',
  fachada2: '/assets/tex-fachada-caribe-2.jpg',
  fachada3: '/assets/tex-fachada-caribe-3.jpg',
  palmera: '/assets/fig-palmera.png',
  control: '/assets/obj-control.png',
  muro: '/assets/obj-muro.png',
  horizonte: '/assets/fondo-horizonte.jpg',
  est_manantial: '/assets/est-manantial.jpg',
  est_ramales: '/assets/est-ramales.jpg',
  est_montana: '/assets/est-montana.jpg',
  est_caudal: '/assets/est-caudal.jpg',
  est_represa: '/assets/est-represa.jpg',
};

/** Casco amarillo el jugador 1, blanco el 2: se distinguen de lejos. */
const CASCOS = [0xf0c02a, 0xf2f2ee];

/**
 * Intenta crear la vista 3D. Devuelve null si algo falla — y eso no es un
 * error: es el camino previsto cuando el equipo no puede con WebGL.
 * @param {HTMLCanvasElement} lienzo
 */
export async function crearVista3D(lienzo) {
  try {
    const THREE = await import('../../../vendor/three.module.min.js');
    const vista = new Vista3D(THREE, lienzo);
    await vista.cargarImagenes();
    return vista;
  } catch (e) {
    console.warn('Sin vista 3D, se juega en 2D:', e && e.message);
    return null;
  }
}

export class Vista3D {
  constructor(THREE, lienzo) {
    this.THREE = THREE;
    this.lienzo = lienzo;
    this.t = 0;

    this.render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
    this.render.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    this.render.outputColorSpace = THREE.SRGBColorSpace;
    this.render.setClearColor(0xa8d0e8, 1);

    this.escena = new THREE.Scene();
    this.escena.background = new THREE.Color(0xa8d0e8);
    this.escena.fog = new THREE.Fog(0xa8d0e8, 38, 108);

    this.escena.add(new THREE.HemisphereLight(0xdfefff, 0x6b7a52, 1.05));
    const sol = new THREE.DirectionalLight(0xfff2d6, 1.15);
    sol.position.set(12, 22, 8);
    this.escena.add(sol);

    this.texturas = {};
    this.camaras = [0, 1].map(() => new THREE.PerspectiveCamera(64, 16 / 9, 0.1, 220));
    this.exploradores = [];
    this._lentePrevia = [0, 0];
    this._ondas = [];
    this._construido = false;
  }

  /** Carga las imágenes. Ninguna es obligatoria: si falta, queda el color plano. */
  async cargarImagenes() {
    const THREE = this.THREE;
    const cargador = new THREE.TextureLoader();
    const uno = (url) => new Promise((ok) => {
      cargador.load(url, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        ok(t);
      }, undefined, () => ok(null));
    });
    const nombres = Object.keys(IMAGENES);
    const cargadas = await Promise.all(nombres.map((n) => uno(IMAGENES[n])));
    nombres.forEach((n, i) => { if (cargadas[i]) this.texturas[n] = cargadas[i]; });
    this._construir();
  }

  _construir() {
    if (this._construido) return;
    const THREE = this.THREE;
    this.escenario = new Escenario(THREE, this.texturas);
    this.objetos = new Objetos(THREE, this.texturas);
    this.escena.add(this.escenario.raiz, this.objetos.raiz);

    this.exploradores = CASCOS.map((c) => {
      const e = new Explorador(THREE, c);
      e.raiz.visible = false;
      this.escena.add(e.raiz);
      return e;
    });

    // La onda de «analizar»: un anillo que sale del explorador por el suelo.
    this.onda = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.25, 48),
      new THREE.MeshBasicMaterial({ color: 0x5aa9e6, transparent: true, opacity: 0.5, depthWrite: false })
    );
    this.onda.rotation.x = -Math.PI / 2;
    this.onda.visible = false;
    this.escena.add(this.onda);

    this._construido = true;
  }

  mostrar(si) {
    const valor = si ? 'block' : 'none';
    if (this.lienzo.style.display !== valor) this.lienzo.style.display = valor;
  }

  /**
   * Solo cuando cambia de verdad: asignar el tamaño del lienzo vuelve a
   * reservar el buffer de dibujo, y hacerlo cada fotograma cuesta fps.
   */
  redimensionar(ancho, alto) {
    if (this._ancho === ancho && this._alto === alto) return;
    this._ancho = ancho;
    this._alto = alto;
    this.render.setSize(ancho, alto, false);
  }

  /**
   * Pinta un fotograma.
   * @param {Carrera[]} carreras una por jugador
   * @param {number[]} participantes qué ranura ocupa cada uno (para el color)
   * @param {number} dt segundos
   */
  dibujar(carreras, participantes, dt) {
    if (!this._construido || !carreras.length) return;
    this.t += dt;
    const n = carreras.length;
    const ancho = this.lienzo.width / this.render.getPixelRatio();
    const alto = this.lienzo.height / this.render.getPixelRatio();

    this.render.setScissorTest(n > 1);
    for (let k = 0; k < n; k++) {
      const car = carreras[k];
      const camara = this.camaras[k];

      // Cada jugador ve SU estado: lo que recogió y lo que reveló.
      this.objetos.sincronizar(car, dt, this.t);
      this.escenario.actualizar(car.distancia, car.estacion, this.escena.fog, this.escena.background);

      this.exploradores.forEach((e, i) => { e.raiz.visible = (i === (participantes[k] % 2)); });
      const yo = this.exploradores[participantes[k] % 2];
      yo.actualizar(car, dt);

      this._camara(camara, car, ancho, alto, n);
      this._onda(car, k);

      const w = n > 1 ? Math.floor(ancho / 2) - 3 : ancho;
      const x = n > 1 && k === 1 ? Math.ceil(ancho / 2) + 3 : 0;
      this.render.setViewport(x, 0, w, alto);
      this.render.setScissor(x, 0, w, alto);
      this.render.render(this.escena, camara);
    }
    this.render.setScissorTest(false);
  }

  _camara(camara, car, ancho, alto, n) {
    const x = (car.xCarril - 1) * ANCHO_CARRIL;
    const z = -car.distancia;
    // Al chocar, la cámara se sacude un momento: el golpe se siente.
    const golpe = car.tropiezo > 0 ? Math.sin(this.t * 55) * 0.16 : 0;
    camara.position.set(x * 0.6 + golpe, 3.35 + golpe * 0.4, z + 7.4);
    camara.lookAt(x * 0.35, 1.45, z - 16);

    // El campo de visión se abre con la velocidad: se siente que va más rápido.
    const fov = 62 + (car.velocidad - CAMINO.velInicial) * 0.75;
    const aspecto = (n > 1 ? ancho / 2 : ancho) / alto;
    if (Math.abs(camara.fov - fov) > 0.15 || camara.aspect !== aspecto) {
      camara.fov = fov;
      camara.aspect = aspecto;
      camara.updateProjectionMatrix();
    }
  }

  /** La onda de análisis: sale del jugador y recorre lo que la lente alcanza. */
  _onda(car, k) {
    if (car.lente > this._lentePrevia[k]) this._ondas[k] = 0;
    this._lentePrevia[k] = car.lente;

    const t = this._ondas[k];
    if (t === undefined || t > 1) { this.onda.visible = false; return; }
    this._ondas[k] = t + 0.035;
    const x = (car.xCarril - 1) * ANCHO_CARRIL;
    this.onda.visible = true;
    this.onda.position.set(x, 0.05, -car.distancia);
    const r = 1 + t * CAMINO.alcanceLente * 0.45;
    this.onda.scale.setScalar(r);
    this.onda.material.opacity = 0.5 * (1 - t);
  }

  destruir() {
    this.mostrar(false);
    if (this.escenario) this.escenario.destruir();
    if (this.objetos) this.objetos.destruir();
    for (const t of Object.values(this.texturas)) t.dispose();
    this.render.dispose();
  }
}

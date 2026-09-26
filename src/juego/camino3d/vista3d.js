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
import { Explorador, CAMISETAS } from './explorador.js';

/**
 * Las imágenes van con ruta absoluta desde la raíz del servidor: el juego se
 * sirve siempre desde `localhost:8740/`, y así también las encuentra la
 * herramienta `herramientas/vista-escena.html`, que vive en otra carpeta.
 */
const IMAGENES = {
  tierra: '/assets/tex-camino-tierra.jpg',
  palmera: '/assets/fig-palmera.png',
  powerbi: '/assets/obj-powerbi.png',     // el tablero de Power BI (imagen del usuario, 2026-09-26)
  muro: '/assets/obj-muro.png',
  horizonte: '/assets/fondo-horizonte.jpg',
  est_manantial: '/assets/est-manantial.jpg',
  est_ramales: '/assets/est-ramales.jpg',
  est_montana: '/assets/est-montana.jpg',
  est_caudal: '/assets/est-caudal.jpg',
  est_represa: '/assets/est-represa.jpg',
  piramide: '/assets/tex-piramide.png',
  // Las del desierto (ver docs/ACTIVOS-VISUALES.md §7.1)
  roca: '/assets/ui-roca-oscura.png',
  lava: '/assets/ui-lava.png',
  arena: '/assets/ui-arenisca.png',
  tallado: '/assets/ui-tallado.png',     // la arenisca tallada de los templos
  // Horizontes por zona (opcionales; ver docs/ACTIVOS-VISUALES.md §7.2). Si
  // no están, se usa la ilustración de cada tramo.
  fondo_pueblo: '/assets/fondo-templos.jpg',
  fondo_desierto: '/assets/fondo-desierto.jpg',
};

/**
 * Intenta crear la vista 3D. Devuelve null si algo falla — y eso no es un
 * error: es el camino previsto cuando el equipo no puede con WebGL.
 * @param {HTMLCanvasElement} lienzo
 */
/**
 * Lo mínimo a lo que baja la resolución adaptable (fracción de la pantalla).
 * Se prefiere un 3D algo más borroso a cualquier alternativa: la vista 2D de
 * emergencia parecía «el juego roto» (puntos sobre negro, sin personaje).
 */
const RATIO_MIN = 0.5;

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

/**
 * Destellos al recoger algo: una explosión de chispas y un anillo, del color de
 * lo recogido. Van pegados al jugador (se mueven con él), así se leen como
 * «lo atrapé» y no como algo que se queda atrás en el camino.
 */
const DESTELLOS = {
  dato: { color: 0x7fc8ff, n: 22, fuerza: 3.6, vida: 0.55, anillo: 2.0 },
  control: { color: 0xffc83a, n: 28, fuerza: 4.2, vida: 0.7, anillo: 2.6 },
  hallazgo: { color: 0xff5a3a, n: 36, fuerza: 5.2, vida: 0.9, anillo: 3.4 },
};
const CHISPAS = 36;

class Destellos {
  constructor(THREE, escena) {
    this.lista = [];
    for (let i = 0; i < 10; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CHISPAS * 3), 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.45, color: 0xffffff, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, sizeAttenuation: true,
      }));
      pts.frustumCulled = false;
      pts.visible = false;
      const anillo = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.75, 32),
        new THREE.MeshBasicMaterial({
          color: 0xffffff, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        })
      );
      anillo.visible = false;
      escena.add(pts, anillo);
      this.lista.push({ pts, anillo, vel: new Float32Array(CHISPAS * 3), vida: 0, max: 1, n: 0, k: 0, x: 0, anilloMax: 1 });
    }
  }

  /** Lanza un destello para el jugador `k`, en su carril `x`. */
  lanzar(k, tipo, x) {
    const d = DESTELLOS[tipo];
    if (!d) return;
    const e = this.lista.find((q) => q.vida <= 0) || this.lista.reduce((a, b) => (a.vida < b.vida ? a : b));
    e.k = k; e.x = x; e.n = d.n; e.vida = e.max = d.vida; e.anilloMax = d.anillo;
    const pos = e.pts.geometry.attributes.position.array;
    for (let i = 0; i < CHISPAS; i++) {
      const j = i * 3;
      if (i >= d.n) { pos[j] = pos[j + 1] = pos[j + 2] = 9999; e.vel[j] = e.vel[j + 1] = e.vel[j + 2] = 0; continue; }
      pos[j] = 0; pos[j + 1] = 1.7; pos[j + 2] = -1.0;   // a la altura de la cabeza: no la tapa el cuerpo
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
      const v = d.fuerza * (0.55 + Math.random() * 0.45);
      e.vel[j] = Math.cos(a) * Math.cos(b) * v;
      e.vel[j + 1] = Math.abs(Math.sin(b)) * v + 2.4;
      e.vel[j + 2] = Math.sin(a) * Math.cos(b) * v * 0.6;
    }
    e.pts.geometry.attributes.position.needsUpdate = true;
    e.pts.material.color.setHex(d.color);
    e.anillo.material.color.setHex(d.color);
  }

  actualizar(dt) {
    for (const e of this.lista) {
      if (e.vida <= 0) continue;
      e.vida = Math.max(0, e.vida - dt);
      const pos = e.pts.geometry.attributes.position.array;
      const frena = Math.max(0, 1 - 2.2 * dt);
      for (let i = 0; i < e.n; i++) {
        const j = i * 3;
        e.vel[j + 1] -= 7 * dt;
        e.vel[j] *= frena; e.vel[j + 1] *= frena; e.vel[j + 2] *= frena;
        pos[j] += e.vel[j] * dt; pos[j + 1] += e.vel[j + 1] * dt; pos[j + 2] += e.vel[j + 2] * dt;
      }
      e.pts.geometry.attributes.position.needsUpdate = true;
      const k = 1 - e.vida / e.max;                       // 0 -> 1
      e.pts.material.opacity = Math.min(1, (e.vida / e.max) * 1.6);
      e.anillo.scale.setScalar(0.4 + k * e.anilloMax);
      e.anillo.material.opacity = 0.85 * (1 - k);
    }
  }

  /** Antes de pintar la vista del jugador `k`: solo sus destellos, pegados a él. */
  mostrarPara(k, distancia) {
    for (const e of this.lista) {
      const si = e.vida > 0 && e.k === k;
      e.pts.visible = e.anillo.visible = si;
      if (!si) continue;
      e.pts.position.set(e.x, 0, -distancia);
      e.anillo.position.set(e.x, 1.5, -distancia - 1.0);
    }
  }
}

export class Vista3D {
  constructor(THREE, lienzo) {
    this.THREE = THREE;
    this.lienzo = lienzo;
    this.t = 0;

    this.render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
    // Si la tarjeta gráfica pierde el contexto (driver, poca memoria, otra
    // pestaña pesada), Three.js lo recupera solo; camino.js mira `perdido` y,
    // si tarda, vuelve a crear la vista entera.
    this.perdido = false;
    this._alPerder = () => { this.perdido = true; };
    this._alRecuperar = () => { this.perdido = false; };
    lienzo.addEventListener('webglcontextlost', this._alPerder);
    lienzo.addEventListener('webglcontextrestored', this._alRecuperar);
    // Resolución adaptable (ver _adaptarResolucion): arranca en la de la
    // pantalla (máx. 1,5) y baja o sube según los fotogramas por segundo.
    this._ratioMax = Math.min(1.5, window.devicePixelRatio || 1);
    this._ratio = this._ratioMax;
    this._fpsMedia = 60;
    this._lento = 0;
    this._holgado = 0;
    this.render.setPixelRatio(this._ratio);
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

    // Camiseta turquesa el jugador 1, coral el 2: se distinguen de lejos.
    this.exploradores = CAMISETAS.map((c) => {
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
    this.destellos = new Destellos(THREE, this.escena);

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
  /**
   * Resolución adaptable. Lo que más le pesa a una tarjeta integrada es
   * rellenar píxeles: si los fotogramas bajan de 50 un rato, se dibuja la
   * escena a algo menos de resolución (se nota muy poco, y todo lo demás sigue
   * igual); si sobran, se vuelve a subir. Solo si ni en el mínimo alcanza,
   * camino.js pasa a la vista 2D.
   */
  _adaptarResolucion(dt) {
    if (!(dt > 0)) return;                       // en pausa no se mide
    this._fpsMedia += (1 / dt - this._fpsMedia) * 0.05;
    this._lento = this._fpsMedia < 50 ? this._lento + dt : 0;
    this._holgado = this._fpsMedia > 58 ? this._holgado + dt : 0;
    let nuevo = this._ratio;
    if (this._lento > 1.5 && this._ratio > RATIO_MIN) nuevo = Math.max(RATIO_MIN, this._ratio - 0.25);
    else if (this._holgado > 6 && this._ratio < this._ratioMax) nuevo = Math.min(this._ratioMax, this._ratio + 0.25);
    if (nuevo === this._ratio) return;
    this._ratio = nuevo;
    this._lento = this._holgado = 0;
    this.render.setPixelRatio(nuevo);
    if (this._ancho) this.render.setSize(this._ancho, this._alto, false);
  }

  /** ¿Ya está en la resolución más baja? Solo entonces tiene sentido pasar a 2D. */
  get enResolucionMinima() { return this._ratio <= RATIO_MIN; }

  dibujar(carreras, participantes, dt) {
    if (!this._construido || !carreras.length || this.perdido) return;
    this.t += dt;
    this._adaptarResolucion(dt);
    const n = carreras.length;
    const ancho = this.lienzo.width / this.render.getPixelRatio();
    const alto = this.lienzo.height / this.render.getPixelRatio();

    // Lo recogido en este fotograma: un destello en el carril del jugador.
    // (Solo con dt > 0: en pausa los eventos del último paso siguen ahí.)
    if (dt > 0) {
      carreras.forEach((car, k) => {
        for (const e of car.eventos) {
          if (DESTELLOS[e.tipo]) this.destellos.lanzar(k, e.tipo, (car.xCarril - 1) * ANCHO_CARRIL);
        }
      });
    }
    this.destellos.actualizar(dt);

    this.render.setScissorTest(n > 1);
    for (let k = 0; k < n; k++) {
      const car = carreras[k];
      const camara = this.camaras[k];

      // Cada jugador ve SU estado: lo que recogió y lo que reveló.
      this.objetos.sincronizar(car, dt, this.t);
      this.escenario.configurar(car.estaciones.length, CAMINO.largo);
      this.escenario.actualizar(car.distancia, car.estacionId, this.escena.fog, this.escena.background, dt, k);

      this.exploradores.forEach((e, i) => { e.raiz.visible = (i === (participantes[k] % 2)); });
      const yo = this.exploradores[participantes[k] % 2];
      yo.actualizar(car, dt);

      this._camara(camara, car, ancho, alto, n);
      this._onda(car, k, dt);
      this.destellos.mostrarPara(k, car.distancia);

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
  _onda(car, k, dt) {
    if (car.lente > this._lentePrevia[k]) this._ondas[k] = 0;
    this._lentePrevia[k] = car.lente;

    const t = this._ondas[k];
    if (t === undefined || t > 1) { this.onda.visible = false; return; }
    this._ondas[k] = t + dt * 2.1;       // por tiempo: en pausa (dt = 0) se queda quieta
    const x = (car.xCarril - 1) * ANCHO_CARRIL;
    this.onda.visible = true;
    this.onda.position.set(x, 0.05, -car.distancia);
    const r = 1 + t * CAMINO.alcanceLente * 0.45;
    this.onda.scale.setScalar(r);
    this.onda.material.opacity = 0.5 * (1 - t);
  }

  destruir() {
    this.mostrar(false);
    this.lienzo.removeEventListener('webglcontextlost', this._alPerder);
    this.lienzo.removeEventListener('webglcontextrestored', this._alRecuperar);
    if (this.escenario) this.escenario.destruir();
    if (this.objetos) this.objetos.destruir();
    for (const t of Object.values(this.texturas)) t.dispose();
    this.render.dispose();
  }
}

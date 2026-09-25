/**
 * explorador.js — El personaje que recorre el camino, hecho con cajas.
 *
 * Es la referencia del video que trajo el usuario: cuatro cajas bien animadas
 * dan más vida que un modelo detallado quieto. Casco, chaleco y mochila, que
 * es como se ve alguien que va a mirar en campo.
 *
 * El diseño sale de `assets/originales/camino-explorador-guia.png`, generada
 * con IA como guía (ver docs/ACTIVOS-VISUALES.md, C-01). El Jugador 2 lleva
 * casco blanco: es lo que los distingue de un vistazo.
 */

import { ANCHO_CARRIL } from './escenario.js';

const PIEL = 0xe0b089;
const PANTALON = 0x2f3b4c;

export class Explorador {
  /**
   * @param {object} THREE
   * @param {number} casco color del casco: amarillo el jugador 1, blanco el 2
   */
  constructor(THREE, casco = 0xf0c02a) {
    this.THREE = THREE;
    this.raiz = new THREE.Group();
    this.cuerpo = new THREE.Group();
    this.raiz.add(this.cuerpo);

    const caja = (w, h, d, color) => new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color })
    );

    // De abajo arriba: piernas, torso, brazos, cabeza, casco, mochila.
    this.piernas = [-1, 1].map((k) => {
      const p = caja(0.24, 0.72, 0.26, PANTALON);
      p.position.set(k * 0.16, 0.36, 0);
      this.cuerpo.add(p);
      return p;
    });

    const torso = caja(0.62, 0.72, 0.36, 0xe2762c);   // el chaleco
    torso.position.y = 1.08;
    this.cuerpo.add(torso);
    const camisa = caja(0.66, 0.2, 0.38, 0x2f6ea8);
    camisa.position.y = 1.42;
    this.cuerpo.add(camisa);

    this.brazos = [-1, 1].map((k) => {
      const b = caja(0.18, 0.62, 0.2, 0x2f6ea8);
      b.position.set(k * 0.42, 1.12, 0);
      this.cuerpo.add(b);
      return b;
    });

    const cabeza = caja(0.46, 0.44, 0.42, PIEL);
    cabeza.position.y = 1.72;
    this.cuerpo.add(cabeza);

    const cascoM = caja(0.52, 0.22, 0.48, casco);
    cascoM.position.y = 2.0;
    this.cuerpo.add(cascoM);
    const ala = caja(0.6, 0.06, 0.16, casco);
    ala.position.set(0, 1.92, 0.26);
    this.cuerpo.add(ala);

    const mochila = caja(0.5, 0.6, 0.26, 0x6b5a3e);
    mochila.position.set(0, 1.12, -0.3);
    this.cuerpo.add(mochila);

    // Sombra: un disco oscuro. Cuesta nada y ancla al personaje al suelo.
    const sombra = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 14),
      new THREE.MeshBasicMaterial({ color: 0x1b2a18, transparent: true, opacity: 0.3, depthWrite: false })
    );
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = 0.02;
    this.raiz.add(sombra);

    this._paso = 0;
  }

  /**
   * @param {Carrera} carrera la del jugador
   * @param {number} dt segundos
   */
  actualizar(carrera, dt) {
    const x = (carrera.xCarril - 1) * ANCHO_CARRIL;
    this.raiz.position.set(x, 0, -carrera.distancia);

    // Correr: brazos y piernas en oposición, al ritmo de la velocidad real.
    this._paso += dt * (carrera.velocidad * 0.55);
    const s = Math.sin(this._paso), c = Math.cos(this._paso);
    this.piernas[0].rotation.x = s * 0.8;
    this.piernas[1].rotation.x = -s * 0.8;
    this.brazos[0].rotation.x = -s * 0.7;
    this.brazos[1].rotation.x = s * 0.7;
    this.cuerpo.position.y = Math.abs(c) * 0.06;

    // Se inclina hacia el carril al que va: se ve la intención antes de llegar.
    const inclina = (carrera.carril - carrera.xCarril) * 0.5;
    this.cuerpo.rotation.z = -inclina;
    this.cuerpo.rotation.y = -inclina * 0.5;

    // Tropiezo: se dobla hacia adelante un momento.
    this.cuerpo.rotation.x = carrera.tropiezo > 0 ? 0.45 : 0;
  }
}

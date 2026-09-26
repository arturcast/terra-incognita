/**
 * explorador.js — La exploradora que recorre el camino, estilo muñeco de
 * vinilo: cabeza grande, cuerpo pequeño.
 *
 * Diseño pedido por el usuario el 2026-09-25, a partir de dos fotos de una
 * figura coleccionable (de frente y de espaldas): cola alta con trenza larga y
 * aros dorados, camiseta turquesa, short verde oliva con cinturón y fundas en
 * las piernas, guantes sin dedos, botas con calcetín. Inspirada en ese estilo,
 * no una copia del personaje. En la mano no lleva armas: lleva una LINTERNA
 * encendida, que es el objeto de la Etapa 1 (es un stand de la compañía).
 *
 * Todo con piezas simples (esferas, cilindros, cajas) para que cada parte se
 * pueda animar: corre, balancea la trenza, se inclina hacia el carril al que
 * va y se dobla al chocar. Mira hacia donde corre (−z): la cámara, detrás, ve
 * sobre todo la espalda y la trenza, como en la foto de espaldas.
 *
 * El Jugador 2 se distingue por el color de la camiseta.
 */

import { ANCHO_CARRIL } from './escenario.js';

const PIEL = 0xf0c49c;
const PELO = 0x6b4226;
const ORO = 0xd9a441;
const OLIVA = 0x6f6b3c;
const CUERO = 0x4a2e1c;
const OSCURO = 0x2a2420;

/** Color de la camiseta: turquesa el Jugador 1, coral el 2. */
export const CAMISETAS = [0x2fa5a0, 0xd9573f];

export class Explorador {
  /**
   * @param {object} THREE
   * @param {number} camiseta color de la camiseta (ver CAMISETAS)
   */
  constructor(THREE, camiseta = CAMISETAS[0]) {
    this.THREE = THREE;
    this.raiz = new THREE.Group();
    this.cuerpo = new THREE.Group();
    this.raiz.add(this.cuerpo);

    // Vinilo: un poco de brillo, como la figura.
    const mat = (color, brillo = 30) => new THREE.MeshPhongMaterial({ color, shininess: brillo });
    const piel = mat(PIEL, 25), pelo = mat(PELO, 45), oro = mat(ORO, 80);
    const oliva = mat(OLIVA, 15), cuero = mat(CUERO, 20), oscuro = mat(OSCURO, 20);
    const pieza = (geo, material, x, y, z, padre = this.cuerpo) => {
      const m = new THREE.Mesh(geo, material);
      m.position.set(x, y, z);
      padre.add(m);
      return m;
    };
    const cil = (r1, r2, h, n = 12) => new THREE.CylinderGeometry(r1, r2, h, n);
    const caja = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const esfera = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);

    // ---------------------------------------------------------- piernas
    // Cada pierna cuelga de un pivote en la cadera: así se balancea al correr.
    this.piernas = [-1, 1].map((k) => {
      const p = new THREE.Group();
      p.position.set(k * 0.14, 0.8, 0);
      this.cuerpo.add(p);
      pieza(cil(0.13, 0.12, 0.24), oliva, 0, -0.1, 0, p);          // pernera del short
      pieza(cil(0.1, 0.09, 0.26), piel, 0, -0.33, 0, p);           // pierna
      pieza(cil(0.105, 0.105, 0.08), mat(0x9a9a92), 0, -0.47, 0, p); // calcetín gris
      const bota = pieza(caja(0.2, 0.26, 0.3), cuero, 0, -0.6, -0.03, p);
      bota.userData.bota = true;
      pieza(caja(0.21, 0.05, 0.31), oscuro, 0, -0.72, -0.03, p);   // suela
      // funda en el muslo, con sus correas
      pieza(cil(0.115, 0.115, 0.04), oscuro, 0, -0.26, 0, p);
      pieza(caja(0.07, 0.18, 0.12), cuero, k * 0.12, -0.2, 0, p);
      return p;
    });

    // ------------------------------------------------ cadera y cinturón
    pieza(caja(0.46, 0.18, 0.3), oliva, 0, 0.86, 0);
    pieza(caja(0.48, 0.05, 0.32), cuero, 0, 0.95, 0);
    pieza(caja(0.08, 0.06, 0.02), oro, 0, 0.95, -0.165);           // hebilla, al frente

    // ----------------------------------------------------------- torso
    pieza(cil(0.2, 0.23, 0.42, 14), mat(camiseta, 35), 0, 1.18, 0);
    pieza(cil(0.09, 0.1, 0.1), piel, 0, 1.43, 0);                  // cuello
    pieza(caja(0.05, 0.36, 0.05), cuero, -0.1, 1.22, 0.2);         // tiras de la mochila
    pieza(caja(0.05, 0.36, 0.05), cuero, 0.1, 1.22, 0.2);
    const mochila = pieza(esfera(0.13, 12, 10), cuero, 0, 1.12, 0.21);   // mochila pequeña, a la espalda
    mochila.scale.set(1.15, 1.2, 0.6);

    // ----------------------------------------------------------- brazos
    // Pivote en el hombro. El derecho lleva la linterna hacia adelante.
    this.brazos = [-1, 1].map((k) => {
      const b = new THREE.Group();
      b.position.set(k * 0.27, 1.34, 0);
      this.cuerpo.add(b);
      pieza(esfera(0.075), piel, 0, 0, 0, b);                      // hombro
      pieza(cil(0.065, 0.06, 0.34), piel, 0, -0.18, 0, b);         // brazo
      pieza(caja(0.12, 0.12, 0.12), oscuro, 0, -0.38, 0, b);       // guante sin dedos
      pieza(esfera(0.05), piel, 0, -0.44, 0, b);                   // dedos
      return b;
    });
    // La linterna, en la mano derecha, siguiendo el brazo (hacia su −y): con
    // el brazo al frente, alumbra el camino.
    const linterna = new THREE.Group();
    linterna.position.set(0, -0.42, 0);
    this.brazos[1].add(linterna);
    pieza(cil(0.045, 0.035, 0.22), mat(0x3a3a3a, 60), 0, -0.08, 0, linterna);
    pieza(cil(0.055, 0.055, 0.03), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }), 0, -0.2, 0, linterna);
    // El haz se abre al alejarse de la lente y llega justo al suelo de enfrente
    // (el brazo apunta unos 35° hacia abajo; ver actualizar()).
    this.haz = pieza(cil(0.05, 0.45, 2.1, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.1, depthWrite: false }),
      0, -1.25, 0, linterna);

    // La mancha de luz en el suelo, delante: es lo que dice «estoy alumbrando
    // el camino». Va en la raíz, no en el brazo, para que no baile al correr.
    this.charco = new THREE.Mesh(
      new THREE.CircleGeometry(1, 24),
      new THREE.MeshBasicMaterial({
        color: 0xfff0a0, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending,
      })
    );
    this.charco.rotation.x = -Math.PI / 2;
    this.charco.scale.set(0.9, 1.5, 1);
    this.charco.position.set(0.3, 0.03, -2.2);
    this.raiz.add(this.charco);

    // ------------------------------------------------------------ cabeza
    const cabeza = new THREE.Group();
    cabeza.position.set(0, 1.86, 0);
    this.cuerpo.add(cabeza);
    this.cabeza = cabeza;
    pieza(esfera(0.42, 24, 18), piel, 0, 0, 0, cabeza);
    // ojos grandes y negros, con un brillo (al frente: −z)
    for (const k of [-1, 1]) {
      const ojo = pieza(esfera(0.085), mat(0x0c0a0a, 90), k * 0.16, -0.02, -0.37, cabeza);
      ojo.scale.set(1, 1.15, 0.5);
      pieza(esfera(0.022), new THREE.MeshBasicMaterial({ color: 0xffffff }), k * 0.16 + 0.03, 0.03, -0.41, cabeza);
      const ceja = pieza(caja(0.12, 0.02, 0.02), pelo, k * 0.16, 0.13, -0.39, cabeza);
      ceja.rotation.z = k * -0.15;
    }
    pieza(esfera(0.02), mat(0xd9a07a), 0, -0.1, -0.415, cabeza);   // nariz
    // pelo: casquete que cubre arriba y atrás, y el flequillo partido al frente
    const casquete = pieza(new THREE.SphereGeometry(0.445, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), pelo, 0, 0.02, 0.02, cabeza);
    casquete.rotation.x = 0.4;                                      // se va hacia atrás: deja libre la cara
    // Raya al medio: dos mechones que bajan pegados a la frente, hacia los lados.
    for (const k of [-1, 1]) {
      const mecha = pieza(new THREE.SphereGeometry(0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), pelo, k * 0.14, 0.2, -0.15, cabeza);
      mecha.scale.set(0.95, 0.75, 0.85);
      mecha.rotation.set(-0.95, 0, k * 0.6);
      const lado = pieza(esfera(0.15), pelo, k * 0.37, -0.06, 0.05, cabeza);   // pelo sobre las orejas
      lado.scale.set(0.42, 1.2, 1.0);
    }
    // cola alta: aro dorado atrás y la trenza, que cuelga de un pivote y se balancea
    const aro = pieza(new THREE.TorusGeometry(0.085, 0.035, 8, 16), oro, 0, 0.08, 0.44, cabeza);
    aro.rotation.x = Math.PI / 2 - 0.4;
    this.trenza = new THREE.Group();
    this.trenza.position.set(0, 0.04, 0.47);
    cabeza.add(this.trenza);
    let y = -0.02;
    for (let i = 0; i < 7; i++) {
      const r = 0.085 - i * 0.006;
      const nudo = pieza(esfera(r, 12, 10), pelo, (i % 2 ? 0.015 : -0.015), y, 0.02 + i * 0.012, this.trenza);
      nudo.scale.set(1, 1.25, 0.9);
      y -= r * 2.1;
    }
    pieza(new THREE.TorusGeometry(0.05, 0.022, 8, 14), oro, 0, y + 0.06, 0.1, this.trenza).rotation.x = Math.PI / 2;
    const punta = pieza(new THREE.ConeGeometry(0.05, 0.14, 10), pelo, 0, y - 0.01, 0.1, this.trenza);
    punta.rotation.x = Math.PI;

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

    // Correr: piernas en oposición, al ritmo de la velocidad real. El brazo
    // izquierdo se balancea; el derecho sostiene la linterna al frente.
    this._paso += dt * (carrera.velocidad * 0.55);
    const s = Math.sin(this._paso), c = Math.cos(this._paso);
    this.piernas[0].rotation.x = s * 0.75;
    this.piernas[1].rotation.x = -s * 0.75;
    this.brazos[0].rotation.x = -s * 0.8;
    this.brazos[0].rotation.z = -0.15;
    // Brazo al frente y hacia abajo (~35° bajo la horizontal): alumbra el
    // suelo de enfrente. Más arriba parecía que alumbraba el cielo.
    this.brazos[1].rotation.x = 0.95 + c * 0.05;
    this.brazos[1].rotation.z = 0.12;
    this.cuerpo.position.y = Math.abs(c) * 0.07;
    this.cabeza.rotation.z = s * 0.04;

    // La trenza va detrás, con retraso: se mece de lado a lado y rebota.
    this.trenza.rotation.z = Math.sin(this._paso - 0.8) * 0.35;
    this.trenza.rotation.x = 0.25 + Math.abs(Math.sin(this._paso)) * 0.2;

    // El haz de la linterna se enciende más cuando se analiza.
    this.haz.material.opacity = carrera.lente > 0 ? 0.25 : 0.1;
    this.charco.material.opacity = carrera.lente > 0 ? 0.55 : 0.3;

    // Se inclina hacia el carril al que va: se ve la intención antes de llegar.
    const inclina = (carrera.carril - carrera.xCarril) * 0.5;
    this.cuerpo.rotation.z = -inclina;
    this.cuerpo.rotation.y = -inclina * 0.5;

    // Tropiezo: se dobla hacia adelante un momento.
    this.cuerpo.rotation.x = carrera.tropiezo > 0 ? -0.45 : 0;
  }
}

/**
 * escenario.js — El mundo de El Camino en 3D: suelo, tuberías, entorno y cielo.
 *
 * Nada de esto decide nada del juego: solo dibuja el estado que ya calculó
 * `carrera.js`. Si este archivo desaparece, la etapa sigue jugándose en 2D.
 *
 * Dos reglas que este archivo respeta a rajatabla (ver docs/PLAN-GRAFICO-CAMINO.md §5):
 *  - No se crea nada dentro del bucle: todo se construye una vez y se recicla.
 *  - Ninguna imagen es obligatoria. Si una textura no carga, queda el color
 *    plano y el juego se ve peor, pero se juega igual.
 */

import { ESTACIONES } from '../carrera.js';

/** Separación entre carriles, en metros. El camino mide unos 8 m de ancho. */
export const ANCHO_CARRIL = 2.4;
const LARGO_SUELO = 400;
const PROPS_POR_LADO = 16;
const SEP_PROPS = 14;        // metros entre casas/palmeras de un mismo lado

/** El color del aire de cada estación: se nota que se avanza por el proceso. */
const AIRE = {
  manantial: 0x9fd0e8,
  ramales: 0xe0b489,
  montana: 0xb3a8c4,
  caudal: 0xa9d2b0,
  represa: 0xe8cf9a,
};

export class Escenario {
  /**
   * @param {object} THREE el módulo, que se importa una sola vez en vista3d.js
   * @param {object} texturas las ya cargadas (pueden faltar)
   */
  constructor(THREE, texturas) {
    this.THREE = THREE;
    this.tex = texturas;
    this.raiz = new THREE.Group();
    this.estacion = -1;

    this._suelo(THREE);
    this._tuberias(THREE);
    this._props(THREE);
    this._horizonte(THREE);
  }

  // ---------------------------------------------------------------- suelo
  _suelo(THREE) {
    const tierra = this.tex.tierra;
    if (tierra) {
      tierra.wrapS = tierra.wrapT = THREE.RepeatWrapping;
      tierra.repeat.set(6, 90);
    }
    const mat = new THREE.MeshLambertMaterial({ color: tierra ? 0xffffff : 0xc9b48f, map: tierra || null });
    const geo = new THREE.PlaneGeometry(26, LARGO_SUELO);
    this.suelo = new THREE.Mesh(geo, mat);
    this.suelo.rotation.x = -Math.PI / 2;
    this.raiz.add(this.suelo);

    // A los lados, hierba seca: el camino se ve como un camino, no como una
    // cinta. Va bien larga y ancha, y avanza con el jugador: si se queda
    // atrás, al fondo aparece el borde del mundo.
    this.orilla = new THREE.Mesh(
      new THREE.PlaneGeometry(700, LARGO_SUELO * 2),
      new THREE.MeshLambertMaterial({ color: 0x8f9b6a })
    );
    this.orilla.rotation.x = -Math.PI / 2;
    this.orilla.position.y = -0.06;
    this.raiz.add(this.orilla);
  }

  /**
   * Las tuberías amarillas que separan los carriles. En la compañía el gas va
   * por tubo amarillo: es el guiño que cualquiera reconoce sin explicación.
   */
  _tuberias(THREE) {
    const geo = new THREE.CylinderGeometry(0.16, 0.16, LARGO_SUELO, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0xd8ac2f });
    this.tuberias = [-0.5, 0.5].map((k) => {
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = Math.PI / 2;
      m.position.set(k * ANCHO_CARRIL, 0.16, 0);
      this.raiz.add(m);
      return m;
    });

    // Bordillos: marcan hasta dónde llega el camino.
    const bordeGeo = new THREE.BoxGeometry(0.5, 0.42, LARGO_SUELO);
    const bordeMat = new THREE.MeshLambertMaterial({ color: 0xe6ddc4 });
    this.bordes = [-1, 1].map((k) => {
      const m = new THREE.Mesh(bordeGeo, bordeMat);
      m.position.set(k * (ANCHO_CARRIL * 1.9), 0.21, 0);
      this.raiz.add(m);
      return m;
    });
  }

  /**
   * Casas y palmeras a los lados. Son siempre las mismas piezas: cuando una
   * queda atrás, se adelanta un tramo entero. Así el entorno es infinito sin
   * crear nada por fotograma.
   */
  _props(THREE) {
    const THREEs = THREE;
    const fachadas = [this.tex.fachada1, this.tex.fachada2, this.tex.fachada3].filter(Boolean);
    const colores = [0x3fa9a0, 0xe0b23c, 0xe0705f, 0x7fa3d0];
    const cajaGeo = new THREEs.BoxGeometry(1, 1, 1);
    const techoGeo = new THREEs.ConeGeometry(0.8, 0.5, 4);

    this.props = [];
    for (let lado = -1; lado <= 1; lado += 2) {
      for (let i = 0; i < PROPS_POR_LADO; i++) {
        const g = new THREEs.Group();
        const n = (i * 7 + (lado + 1) * 3) % 4;
        const esPalmera = this.tex.palmera && n === 3;

        if (esPalmera) {
          const mat = new THREEs.MeshBasicMaterial({ map: this.tex.palmera, transparent: true, alphaTest: 0.4 });
          const hoja = new THREEs.Mesh(new THREEs.PlaneGeometry(4.2, 6.3), mat);
          hoja.position.y = 3.15;
          g.add(hoja);
          g.userData.mirar = true;         // siempre de frente a la cámara
        } else {
          const tex = fachadas[n % Math.max(1, fachadas.length)] || null;
          const mat = new THREEs.MeshLambertMaterial({
            color: tex ? 0xffffff : colores[n % colores.length], map: tex,
          });
          const alto = 3 + (i % 3) * 1.2;
          const casa = new THREEs.Mesh(cajaGeo, mat);
          casa.scale.set(5 + (i % 2) * 2, alto, 5);
          casa.position.y = alto / 2;
          g.add(casa);
          const techo = new THREEs.Mesh(techoGeo, new THREEs.MeshLambertMaterial({ color: 0x7a4b3a }));
          techo.scale.set(4.6, 1, 4.6);
          techo.rotation.y = Math.PI / 4;
          techo.position.y = alto + 0.25;
          g.add(techo);
        }

        g.position.x = lado * (8 + (i % 3) * 2.5);
        g.userData.base = i * SEP_PROPS + (lado > 0 ? SEP_PROPS / 2 : 0);
        g.userData.ciclo = PROPS_POR_LADO * SEP_PROPS;
        this.props.push(g);
        this.raiz.add(g);
      }
    }

    // Pórticos de tubería cada 60 m: marcan el ritmo y dan sensación de velocidad.
    const arcoMat = new THREEs.MeshLambertMaterial({ color: 0xb9912b });
    this.porticos = [];
    for (let i = 0; i < 4; i++) {
      const g = new THREEs.Group();
      const viga = new THREEs.Mesh(new THREEs.CylinderGeometry(0.22, 0.22, 16, 8), arcoMat);
      viga.rotation.z = Math.PI / 2;
      viga.position.y = 5.2;
      g.add(viga);
      for (const k of [-1, 1]) {
        const pata = new THREEs.Mesh(new THREEs.CylinderGeometry(0.26, 0.26, 5.2, 8), arcoMat);
        pata.position.set(k * 7.6, 2.6, 0);
        g.add(pata);
      }
      g.userData.base = i * 60;
      g.userData.ciclo = 240;
      this.porticos.push(g);
      this.raiz.add(g);
    }
  }

  /**
   * El horizonte: una imagen lejana que cambia con la estación. Se coloca con
   * el borde de abajo por debajo del suelo, para que no se vea dónde acaba, y
   * se ajusta al alto de cada imagen: las de estación son 16:9 y la genérica,
   * mucho más apaisada.
   */
  _horizonte(THREE) {
    this.horizonte = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: this.tex.horizonte || null,
        color: this.tex.horizonte ? 0xffffff : 0x9fc4dd,
        depthWrite: false,
        fog: false,
      })
    );
    this.raiz.add(this.horizonte);
    this._ajustarHorizonte(this.tex.horizonte);
  }

  _ajustarHorizonte(tex) {
    const ancho = 480;
    const img = tex && tex.image;
    const proporcion = img && img.width ? img.height / img.width : 0.25;
    const alto = Math.max(110, Math.min(210, ancho * proporcion));
    this.horizonte.scale.set(ancho, alto, 1);
    this.horizonte.position.y = alto / 2 - 14;   // el borde de abajo, enterrado
  }

  // ----------------------------------------------------------- cada fotograma
  /**
   * @param {number} distancia metros recorridos
   * @param {number} estacion índice de la estación actual
   * @param {object} niebla el Fog de la escena, para teñir el aire
   */
  actualizar(distancia, estacion, niebla, fondo) {
    const z = -distancia;

    this.suelo.position.z = z - LARGO_SUELO / 2 + 40;
    this.orilla.position.z = z - LARGO_SUELO + 60;
    for (const t of this.tuberias) t.position.z = this.suelo.position.z;
    for (const b of this.bordes) b.position.z = this.suelo.position.z;
    if (this.tex.tierra) this.tex.tierra.offset.y = -distancia / 8;

    // Lo que queda atrás salta un ciclo entero hacia adelante.
    for (const g of [...this.props, ...this.porticos]) {
      const { base, ciclo } = g.userData;
      const s = base + Math.ceil((distancia - base - 10) / ciclo) * ciclo;
      g.position.z = -s;
      if (g.userData.mirar) g.rotation.y = 0;
    }

    this.horizonte.position.z = z - 165;

    if (estacion !== this.estacion && estacion >= 0) {
      this.estacion = estacion;
      const id = ESTACIONES[estacion] ? ESTACIONES[estacion].id : 'manantial';
      const color = AIRE[id] || 0xa8d0e8;
      niebla.color.setHex(color);
      fondo.setHex(color);
      const img = this.tex['est_' + id];
      if (img) {
        this.horizonte.material.map = img;
        this.horizonte.material.color.setHex(0xffffff);
        this.horizonte.material.needsUpdate = true;
        this._ajustarHorizonte(img);
      }
    }
  }

  destruir() {
    this.raiz.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
  }
}

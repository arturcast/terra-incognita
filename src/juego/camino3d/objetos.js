/**
 * objetos.js — Lo que hay EN el camino, en 3D: datos, carteles, muros,
 * estaciones y lo que está escondido.
 *
 * Todo sale de reservas (pools): cada tipo tiene unas pocas piezas que se
 * reutilizan según lo que el jugador tenga delante. En un corredor infinito,
 * crear y tirar mallas por fotograma es la forma más rápida de que el stand
 * vaya a tirones.
 *
 * Este módulo LEE la `Carrera`; nunca la cambia. Lo que está escondido solo se
 * ve si el jugador lo reveló analizando: esa es la lección de la etapa y aquí
 * se respeta al pie de la letra.
 */

import { CAMINO } from '../carrera.js';
import { ANCHO_CARRIL } from './escenario.js';

const AZUL = 0x5aa9e6;
const ROJO = 0xff4a3a;
const ORO = 0xf6c343;

/** Un cartel de texto pintado con Canvas: la IA de imágenes escribe mal. */
function texturaTexto(THREE, texto, { ancho = 512, alto = 128, fondo = 'rgba(8,12,18,0.88)',
  color = '#e8d9b5', tamano = 46, borde = 'rgba(232,217,181,0.45)' } = {}) {
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const c = lienzo.getContext('2d');
  c.fillStyle = fondo;
  c.fillRect(0, 0, ancho, alto);
  if (borde) {
    c.strokeStyle = borde;
    c.lineWidth = 4;
    c.strokeRect(2, 2, ancho - 4, alto - 4);
  }
  c.fillStyle = color;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  let t = tamano;
  do {
    c.font = t + 'px "Segoe UI", system-ui, sans-serif';
    t -= 2;
  } while (c.measureText(texto).width > ancho - 40 && t > 16);
  c.fillText(texto, ancho / 2, alto / 2 + 2);
  const tex = new THREE.CanvasTexture(lienzo);
  tex.anisotropy = 4;
  return tex;
}

export class Objetos {
  constructor(THREE, texturas) {
    this.THREE = THREE;
    this.tex = texturas;
    this.raiz = new THREE.Group();
    this._textos = new Map();      // excusa -> textura, para no repintarlas

    this.reservas = {
      // Alcanzan para lo que viene y lo que acaba de pasar al lado.
      dato: this._reserva(20, () => this._dato()),
      control: this._reserva(7, () => this._control()),
      muro: this._reserva(9, () => this._muro()),
      oculto: this._reserva(6, () => this._oculto()),
      estacion: this._reserva(2, () => this._arco()),
    };
  }

  _reserva(n, crear) {
    const lista = [];
    for (let i = 0; i < n; i++) {
      const m = crear();
      m.visible = false;
      this.raiz.add(m);
      lista.push(m);
    }
    return lista;
  }

  // ------------------------------------------------------------- las piezas
  /** ◆ Dato crudo: un octaedro azul que gira y flota. */
  _dato() {
    const THREE = this.THREE;
    const g = new THREE.Group();
    const cristal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42),
      new THREE.MeshPhongMaterial({ color: AZUL, emissive: 0x11405e, shininess: 80, flatShading: true })
    );
    cristal.position.y = 1.1;
    g.add(cristal);
    g.userData.cristal = cristal;
    g.add(this._sombra(0.5));
    return g;
  }

  /**
   * El tablero de Power BI: un portátil de piedra y oro (imagen del usuario,
   * assets/obj-powerbi.png) que flota con un halo dorado. Al recogerlo, analiza.
   */
  _control() {
    const THREE = this.THREE;
    const g = new THREE.Group();
    const imagen = this.tex.powerbi;
    const mat = imagen
      ? new THREE.MeshBasicMaterial({ map: imagen, transparent: true, alphaTest: 0.25 })
      : new THREE.MeshBasicMaterial({ color: ORO });
    const portatil = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), mat);
    portatil.position.y = 1.45;
    g.add(portatil);
    // halo en el suelo: se ve de lejos que es algo que se recoge
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(1.05, 24),
      new THREE.MeshBasicMaterial({ color: ORO, transparent: true, opacity: 0.35, depthWrite: false })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.03;
    g.add(halo);
    g.userData.portatil = portatil;
    g.userData.halo = halo;
    return g;
  }

  /** Muro de excusa: la barrera rayada, y encima la frase de siempre. */
  _muro() {
    const THREE = this.THREE;
    const g = new THREE.Group();
    const mat = this.tex.muro
      ? new THREE.MeshBasicMaterial({ map: this.tex.muro, transparent: true, alphaTest: 0.35 })
      : new THREE.MeshBasicMaterial({ color: 0xd94f3d });
    const barrera = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.4), mat);
    barrera.position.y = 1.1;
    g.add(barrera);

    const cartel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.8),
      new THREE.MeshBasicMaterial({ transparent: true })
    );
    cartel.position.y = 2.75;
    g.add(cartel);
    g.userData.cartel = cartel;
    return g;
  }

  /** Lo escondido: sale del suelo cuando se analiza, con su columna de luz. */
  _oculto() {
    const THREE = this.THREE;
    const g = new THREE.Group();
    const cristal = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.62, 0),
      new THREE.MeshPhongMaterial({ color: ROJO, emissive: 0x7a1508, flatShading: true, shininess: 60 })
    );
    cristal.position.y = 0.9;
    g.add(cristal);
    const haz = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 26, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: ROJO, transparent: true, opacity: 0.16, depthWrite: false })
    );
    haz.position.y = 13;
    g.add(haz);
    g.add(this._sombra(0.8, 0x4a0f08));
    g.userData.cristal = cristal;
    return g;
  }

  /** El arco de entrada a una estación, con su nombre. */
  _arco() {
    const THREE = this.THREE;
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0xb9912b });
    const viga = new THREE.Mesh(new THREE.BoxGeometry(13, 0.9, 0.7), mat);
    viga.position.y = 5.4;
    g.add(viga);
    for (const k of [-1, 1]) {
      const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 5.4, 8), mat);
      pata.position.set(k * 6, 2.7, 0);
      g.add(pata);
    }
    const letrero = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 1.5),
      new THREE.MeshBasicMaterial({ transparent: true })
    );
    letrero.position.y = 5.45;
    letrero.position.z = 0.4;
    g.add(letrero);
    g.userData.letrero = letrero;
    return g;
  }

  /** Una mancha oscura bajo el objeto: lo ancla al suelo sin costar sombras. */
  _sombra(radio, color = 0x1b2a18) {
    const THREE = this.THREE;
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(radio, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.02;
    return m;
  }

  _textoDe(texto, opciones) {
    if (!this._textos.has(texto)) this._textos.set(texto, texturaTexto(this.THREE, texto, opciones));
    return this._textos.get(texto);
  }

  // ------------------------------------------------------- cada fotograma
  /**
   * Coloca las piezas según lo que ESTE jugador tiene delante.
   * @param {Carrera} carrera
   * @param {number} dt segundos
   * @param {number} t tiempo total, para las animaciones
   */
  sincronizar(carrera, dt, t) {
    const usadas = { dato: 0, control: 0, muro: 0, oculto: 0, estacion: 0 };
    // De cerca a lejos: si alguna vez faltaran piezas, que falten en la
    // niebla del fondo y nunca frente al jugador.
    const vis = carrera.visibles(CAMINO.vista).reverse();

    for (const { o, dz } of vis) {
      // Lo escondido no existe hasta que se analiza: es la lección de la etapa.
      if (o.tipo === 'oculto' && !o.revelado) continue;
      const reserva = this.reservas[o.tipo];
      if (!reserva) continue;
      const m = reserva[usadas[o.tipo]];
      if (!m) continue;
      usadas[o.tipo]++;

      m.visible = true;
      m.position.x = (o.carril - 1) * ANCHO_CARRIL;
      m.position.z = -(o.s);
      const nuevo = m.userData.obj !== o;
      m.userData.obj = o;

      if (o.tipo === 'dato') {
        m.userData.cristal.rotation.y = t * 1.8;
        m.userData.cristal.position.y = 1.1 + Math.sin(t * 3 + o.s) * 0.12;
      } else if (o.tipo === 'oculto') {
        // Se guarda en el objeto, no en la pieza: si la pieza cambia de dueño,
        // el cristal no vuelve a salir del suelo.
        o._emergido = Math.min(1, (o._emergido || 0) + dt * 3.5);
        const e = o._emergido;
        m.position.y = -1.4 + 1.4 * e;
        m.userData.cristal.rotation.y = t * 1.2;
        const p = 1 + Math.sin(t * 6) * 0.06;
        m.userData.cristal.scale.setScalar(p * (0.6 + 0.4 * e));
      } else if (o.tipo === 'control') {
        // flota y late: llama a recogerlo
        m.userData.portatil.position.y = 1.45 + Math.sin(t * 2.6 + o.s) * 0.12;
        m.userData.halo.material.opacity = 0.25 + 0.15 * (0.5 + 0.5 * Math.sin(t * 4 + o.s));
      } else if (o.tipo === 'muro') {
        if (nuevo) {
          m.userData.cartel.material.map = this._textoDe('«' + o.texto + '»');
          m.userData.cartel.material.needsUpdate = true;
        }
        // El muro con el que se chocó cae de espaldas: si siguiera de pie,
        // pasaría a través del jugador y taparía la cámara.
        o._caida = o.derribado ? Math.min(1, (o._caida || 0) + dt * 5) : 0;
        m.rotation.x = -o._caida * Math.PI / 2;
        m.userData.cartel.visible = !o.derribado;
      } else if (o.tipo === 'estacion') {
        if (nuevo) {
          const e = carrera.estaciones[o.estacion];
          m.userData.letrero.material.map = this._textoDe(e ? e.nombre : '', {
            ancho: 1024, alto: 170, tamano: 92, color: '#f0c977', fondo: 'rgba(8,12,18,0.9)',
          });
          m.userData.letrero.material.needsUpdate = true;
        }
      }
    }

    for (const [tipo, reserva] of Object.entries(this.reservas)) {
      for (let i = usadas[tipo]; i < reserva.length; i++) reserva[i].visible = false;
    }
  }

  destruir() {
    this.raiz.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    for (const t of this._textos.values()) t.dispose();
  }
}

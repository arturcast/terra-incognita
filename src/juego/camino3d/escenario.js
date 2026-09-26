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

/** Separación entre carriles, en metros. El camino mide unos 8 m de ancho. */
export const ANCHO_CARRIL = 2.4;
const LARGO_SUELO = 400;
const PROPS_POR_LADO = 10;
const SEP_PROPS = 20;        // metros entre casas/palmeras de un mismo lado (antes 14: se veía recargado)

/** Metros por delante a partir de los cuales el entorno ya no se dibuja (tapado por la neblina). */
const LEJOS = 115;

/** Las dos zonas del entorno. Ver _props(). */
export const ZONA = { pueblo: 'pueblo', desierto: 'desierto' };

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
    // El aire cambia de color al entrar en un tramo, pero poco a poco: el
    // cambio de golpe se veía como un parpadeo, no como un paso. Un estado por
    // jugador: a pantalla partida cada uno puede ir en un tramo distinto.
    this._aire = [0, 1].map(() => ({
      id: null, desde: new THREE.Color(0xa8d0e8), hacia: new THREE.Color(0xa8d0e8),
      actual: new THREE.Color(0xa8d0e8), k: 1,
    }));

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

    // Arena para los lados en el desierto: piezas fijas que configurar() pone
    // sobre las zonas que tocan (se estiran en z con scale). Van por encima de
    // la hierba, que sigue al jugador por todas partes.
    const arena = this.tex.arena ? this.tex.arena.clone() : null;
    if (arena) {
      arena.wrapS = arena.wrapT = THREE.RepeatWrapping;
      arena.repeat.set(60, 80);
      arena.needsUpdate = true;
    }
    const matArena = new THREE.MeshLambertMaterial({ color: arena ? 0xffffff : 0xd9b77a, map: arena });
    this.arenas = [0, 1, 2].map(() => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(700, 1), matArena);
      m.rotation.x = -Math.PI / 2;
      m.position.y = -0.05;
      m.visible = false;
      this.raiz.add(m);
      return m;
    });
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
   * El entorno, en dos zonas que NUNCA se mezclan (pedido del usuario,
   * 2026-09-25): la primera zona son templos entre palmeras (antes casas, que
   * se salían de la ambientación; la zona se sigue llamando `pueblo`) y la segunda
   * un desierto (pirámides, volcanes, rocas y dunas). Va por orden, no por
   * tramo: sean cuales sean los dos tramos que se jueguen, el primero es pueblo
   * y el segundo desierto. Con más de dos tramos (las pruebas usan cinco), se
   * alternan.
   *
   * Son siempre las mismas piezas: cuando una queda atrás, se adelanta un ciclo
   * entero, y se enciende solo si el punto donde cae es de su zona. Así el
   * entorno es infinito sin crear nada por fotograma.
   */
  _props(THREE) {
    this.props = this._pueblo(THREE);
    this.desierto = this._desierto(THREE);
    this.porticos = this._porticos(THREE);
    for (const g of [...this.props, ...this.desierto, ...this.porticos]) this.raiz.add(g);
  }

  /**
   * Primera zona: templos antiguos entre palmeras (pedido del usuario,
   * 2026-09-25: las casas se salían de la ambientación). Tres tipos, para que
   * no se repita: escalonado, de columnas y en ruinas. Todos con las texturas
   * que ya había (bloques de arenisca, arenisca tallada, roca), y con la
   * entrada mirando al camino.
   */
  _pueblo(THREE) {
    const repetida = (tex, x, y) => {
      if (!tex) return null;
      const t = tex.clone();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(x, y);
      t.needsUpdate = true;
      return t;
    };
    // Las texturas de arenisca son de un café oscuro: con un poco de luz propia
    // cálida se leen como piedra al sol y no como madera.
    const lambert = (tex, color) => new THREE.MeshLambertMaterial({
      color: tex ? 0xffffff : color, map: tex, emissive: tex ? 0x5a4222 : 0x000000,
    });
    const M = {
      bloques: lambert(repetida(this.tex.piramide, 2, 1), 0xd9b77a),
      arenisca: lambert(repetida(this.tex.arena, 1, 1), 0xd9b77a),
      tallado: lambert(this.tex.tallado || null, 0xc79a5e),
      roca: lambert(repetida(this.tex.roca, 1, 1), 0x8a7a66),
      puerta: new THREE.MeshBasicMaterial({ color: 0x140c06 }),
    };
    if (this.tex.roca) M.roca.color.setHex(0xe8c898);    // la roca de la textura es casi negra: se aclara
    const G = {
      caja: new THREE.BoxGeometry(1, 1, 1),
      columna: new THREE.CylinderGeometry(0.34, 0.4, 1, 10),
      prisma: new THREE.CylinderGeometry(1, 1, 1, 3),      // el frontón triangular
    };
    const pieza = (g, geo, mat, x, y, z, sx, sy, sz) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      g.add(m);
      return m;
    };

    // Todos se construyen con la entrada hacia +x; los del lado derecho se giran.
    // (Hubo un templo escalonado; el usuario lo quitó el 2026-09-25: su
    // escalinata salía como un bloque hacia afuera.)
    const columnas = (g, alto) => {
      pieza(g, G.caja, M.arenisca, 0, 0.4, 0, 5, 0.8, 6.4);                        // plataforma
      const hC = alto - 2;
      for (const z of [-2.4, -0.8, 0.8, 2.4]) {
        pieza(g, G.columna, M.arenisca, 1.9, 0.8 + hC / 2, z, 1, hC, 1);
        pieza(g, G.columna, M.arenisca, -1.6, 0.8 + hC / 2, z, 1, hC, 1);
      }
      pieza(g, G.caja, M.tallado, 0, 0.8 + hC + 0.3, 0, 5, 0.6, 6.6);             // dintel tallado
      const fronton = pieza(g, G.prisma, M.bloques, 0, 0.8 + hC + 1.0, 0, 2.6, 6.6, 0.8);
      fronton.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    };
    const ruina = (g) => {
      pieza(g, G.caja, M.bloques, 0, 0.25, 0, 4, 0.5, 5);
      pieza(g, G.columna, M.arenisca, 1.2, 0.5 + 2.2, -1.5, 1, 4.4, 1);
      pieza(g, G.columna, M.arenisca, 1.2, 0.5 + 1.1, 1.5, 1, 2.2, 1);             // rota
      pieza(g, G.caja, M.tallado, 1.2, 5.1, -1.5, 1.3, 0.5, 1.3);                  // capitel
      const caida = pieza(g, G.columna, M.arenisca, 3, 0.4, 0.2, 1, 2.6, 1);       // en el suelo
      caida.rotation.set(Math.PI / 2, 0, 0.6);
      pieza(g, G.caja, M.bloques, -0.6, 0.9, 0.6, 1.2, 0.8, 1.4).rotation.y = 0.4;
    };

    const piezas = [];
    for (let lado = -1; lado <= 1; lado += 2) {
      for (let i = 0; i < PROPS_POR_LADO; i++) {
        const g = new THREE.Group();
        const n = (i * 7 + (lado + 1) * 3) % 4;
        if (this.tex.palmera && n === 3) {
          const mat = new THREE.MeshBasicMaterial({ map: this.tex.palmera, transparent: true, alphaTest: 0.4 });
          const hoja = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 6.3), mat);
          hoja.position.y = 3.15;
          g.add(hoja);
        } else {
          const alto = 5 + (i % 3) * 1.1;
          if (n === 2) ruina(g);
          else columnas(g, alto);
          if (lado > 0) g.rotation.y = Math.PI;           // la entrada, siempre hacia el camino
        }
        g.position.x = lado * (9.5 + (i % 3) * 2.5);
        this._ciclo(g, ZONA.pueblo, i * SEP_PROPS + (lado > 0 ? SEP_PROPS / 2 : 0), PROPS_POR_LADO * SEP_PROPS);
        piezas.push(g);
      }
    }
    return piezas;
  }

  _desierto(THREE) {
    const piezas = [];
    const repetida = (tex, x, y) => {
      if (!tex) return null;
      const t = tex.clone();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(x, y);
      t.needsUpdate = true;
      return t;
    };

    // Pirámides, al fondo. La textura (`piramide`) es opcional: sin ella,
    // piedra lisa. El cono reparte la textura entre sus 4 caras: 6 de ancho
    // son 1,5 por cara, y 3 de alto dan 24 hiladas de bloques.
    const texPiramide = repetida(this.tex.piramide, 6, 3);
    const matPiramide = new THREE.MeshLambertMaterial({
      color: texPiramide ? 0xffffff : 0xd9b77a, map: texPiramide, flatShading: true,
    });
    const geoPiramide = new THREE.ConeGeometry(1, 1, 4);   // cono de 4 caras = pirámide
    this.piramides = [];
    for (let lado = -1; lado <= 1; lado += 2) {
      for (let i = 0; i < 2; i++) {
        const alto = 16 + ((i * 5 + (lado + 1)) % 3) * 4;
        const p = new THREE.Mesh(geoPiramide, matPiramide);
        p.scale.set(alto * 0.85, alto, alto * 0.85);
        p.rotation.y = Math.PI / 4;                     // una cara de frente al camino
        p.position.set(lado * (28 + i * 8), alto / 2 - 0.5, 0);
        this._ciclo(p, ZONA.desierto, i * 120 + (lado > 0 ? 60 : 0), 240);
        this.piramides.push(p);
        piezas.push(p);
      }
    }

    // Volcanes, lejos: roca oscura, cráter de lava y una columna de humo.
    const matVolcan = new THREE.MeshLambertMaterial({
      color: this.tex.roca ? 0x8a6a58 : 0x4a3a34, map: repetida(this.tex.roca, 4, 2), flatShading: true,
    });
    const matLava = new THREE.MeshBasicMaterial({ color: this.tex.lava ? 0xffffff : 0xff6a1a, map: this.tex.lava || null });
    const matHumo = new THREE.MeshBasicMaterial({ color: 0x6d6560, transparent: true, opacity: 0.35, depthWrite: false });
    const geoVolcan = new THREE.CylinderGeometry(0.16, 1, 1, 10);
    const geoCrater = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 10);
    const geoHumo = new THREE.SphereGeometry(1, 8, 6);
    for (let lado = -1; lado <= 1; lado += 2) {
      const g = new THREE.Group();
      const alto = lado < 0 ? 34 : 28, ancho = alto * 1.05;
      const cono = new THREE.Mesh(geoVolcan, matVolcan);
      cono.scale.set(ancho, alto, ancho);
      cono.position.y = alto / 2 - 1;
      g.add(cono);
      const crater = new THREE.Mesh(geoCrater, matLava);
      crater.scale.set(ancho, 1, ancho);
      crater.position.y = alto - 0.95;
      g.add(crater);
      for (let k = 0; k < 3; k++) {
        const humo = new THREE.Mesh(geoHumo, matHumo);
        humo.scale.setScalar(3 + k * 1.6);
        humo.position.set(k * 1.5, alto + 3 + k * 4, 0);
        g.add(humo);
      }
      g.position.x = lado * 62;
      this._ciclo(g, ZONA.desierto, lado < 0 ? 30 : 150, 240);
      piezas.push(g);
    }

    // Rocas sueltas cerca del camino y dunas bajas entre ellas.
    const matRoca = new THREE.MeshLambertMaterial({
      // La roca de la textura es casi negra: se tiñe de arena para que sea del desierto.
      color: this.tex.roca ? 0xf0c890 : 0x8a6a4c, map: repetida(this.tex.roca, 1, 1), flatShading: true,
      emissive: this.tex.roca ? 0x3a2410 : 0x000000,
    });
    const geoRoca = new THREE.DodecahedronGeometry(1, 0);
    const matDuna = new THREE.MeshLambertMaterial({ color: this.tex.arena ? 0xffffff : 0xd9b77a, map: repetida(this.tex.arena, 3, 2) });
    const geoDuna = new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    for (let lado = -1; lado <= 1; lado += 2) {
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Mesh(geoRoca, matRoca);
        const t = 1.2 + ((i + lado + 2) % 3) * 0.7;
        r.scale.set(t * 1.3, t, t);
        r.rotation.set(i, i * 2 + lado, 0);
        r.position.set(lado * (10 + i * 2.5), t * 0.55, 0);
        this._ciclo(r, ZONA.desierto, i * 80 + (lado > 0 ? 40 : 0) + 15, 240);
        piezas.push(r);
      }
      for (let i = 0; i < 2; i++) {
        const d = new THREE.Mesh(geoDuna, matDuna);
        d.scale.set(16, 2.6 + i, 9);
        d.position.set(lado * (19 + i * 4), -0.05, 0);
        this._ciclo(d, ZONA.desierto, i * 120 + (lado > 0 ? 90 : 30), 240);
        piezas.push(d);
      }
    }
    return piezas;
  }

  /** Pórticos de tubería cada 60 m, en las dos zonas: marcan el ritmo y la velocidad. */
  _porticos(THREE) {
    const arcoMat = new THREE.MeshLambertMaterial({ color: 0xb9912b });
    const piezas = [];
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const viga = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 16, 8), arcoMat);
      viga.rotation.z = Math.PI / 2;
      viga.position.y = 5.2;
      g.add(viga);
      for (const k of [-1, 1]) {
        const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 5.2, 8), arcoMat);
        pata.position.set(k * 7.6, 2.6, 0);
        g.add(pata);
      }
      this._ciclo(g, null, i * 60, 240);
      piezas.push(g);
    }
    return piezas;
  }

  /** Datos de reciclaje de una pieza: dónde empieza, cada cuánto vuelve y de qué zona es. */
  _ciclo(g, zona, base, ciclo) {
    g.userData.base = base;
    g.userData.ciclo = ciclo;
    g.userData.zona = zona;          // null: va en todas
  }

  /**
   * Cuántos tramos tiene la carrera y cuánto mide: con eso se sabe dónde
   * empieza cada zona. Sin llamarlo, todo es pueblo.
   */
  configurar(tramos, largo) {
    if (tramos === this.tramos && largo === this.largo) return;
    this.tramos = tramos;
    this.largo = largo;
    const tramo = largo / tramos;
    this.arenas.forEach((a) => { a.visible = false; });
    let n = 0;
    for (let k = 1; k < tramos && n < this.arenas.length; k += 2) {
      const a = this.arenas[n++];
      const desde = k * tramo, hasta = k === tramos - 1 ? largo + 400 : (k + 1) * tramo;
      a.scale.set(1, hasta - desde, 1);
      a.position.z = -(desde + hasta) / 2;
      a.visible = true;
    }
  }

  /** De qué zona es un punto del camino (metros desde la salida). */
  zonaEn(s) {
    if (!this.tramos || this.tramos < 2) return ZONA.pueblo;
    const k = Math.min(this.tramos - 1, Math.max(0, Math.floor(s / (this.largo / this.tramos))));
    return k % 2 === 0 ? ZONA.pueblo : ZONA.desierto;
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
   * @param {string} estacionId 'manantial', 'ramales'… (Carrera.estacionId)
   * @param {object} niebla el Fog de la escena, para teñir el aire
   * @param {object} fondo el Color de fondo de la escena
   * @param {number} dt segundos, para la transición de color
   * @param {number} canal 0 o 1: de qué jugador es este dibujo
   */
  actualizar(distancia, estacionId, niebla, fondo, dt = 1 / 60, canal = 0) {
    const z = -distancia;

    this.suelo.position.z = z - LARGO_SUELO / 2 + 40;
    this.orilla.position.z = z - LARGO_SUELO + 60;
    for (const t of this.tuberias) t.position.z = this.suelo.position.z;
    for (const b of this.bordes) b.position.z = this.suelo.position.z;
    if (this.tex.tierra) this.tex.tierra.offset.y = -distancia / 8;

    // Lo que queda atrás salta un ciclo entero hacia adelante.
    for (const g of [...this.props, ...this.desierto, ...this.porticos]) {
      const { base, ciclo, zona } = g.userData;
      const s = base + Math.ceil((distancia - base - 10) / ciclo) * ciclo;
      g.position.z = -s;
      // Cada pieza solo se ve en su zona: el pueblo y el desierto no se mezclan.
      // Y más allá de la neblina (acaba a 108 m) no se dibuja: no se vería y
      // le ahorra a la tarjeta gráfica casi la mitad de las piezas.
      g.visible = (!zona || zona === this.zonaEn(s)) && s - distancia < LEJOS;
    }

    this.horizonte.position.z = z - 165;

    const a = this._aire[canal] || this._aire[0];
    if (estacionId && estacionId !== a.id) {
      const primera = a.id === null;
      a.id = estacionId;
      a.desde.copy(a.actual);
      a.hacia.setHex(AIRE[estacionId] || 0xa8d0e8);
      // La primera vez no hay transición: se arranca ya con el color del tramo.
      a.k = primera ? 1 : 0;
    }
    if (a.k < 1) a.k = Math.min(1, a.k + dt / 1.2);
    a.actual.copy(a.desde).lerp(a.hacia, a.k);
    niebla.color.copy(a.actual);
    fondo.copy(a.actual);

    // El horizonte es de quien se está dibujando ahora. Si hay fondo propio de
    // la zona (templos / desierto), manda ese; si no, el del tramo.
    const img = this.tex['fondo_' + this.zonaEn(distancia)] || this.tex['est_' + a.id];
    if (img && this.horizonte.material.map !== img) {
      const habiaMapa = !!this.horizonte.material.map;
      this.horizonte.material.map = img;
      this.horizonte.material.color.setHex(0xffffff);
      if (!habiaMapa) this.horizonte.material.needsUpdate = true;
      this._ajustarHorizonte(img);
    }
  }

  destruir() {
    this.raiz.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
  }
}

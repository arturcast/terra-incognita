/**
 * camino3d.test.js — La vista 3D de El Camino, sin navegador.
 *
 * Three.js funciona en Node mientras no se pida un lienzo WebGL, así que aquí
 * se construye la escena entera (suelo, entorno, objetos, explorador) y se la
 * hace correr una carrera completa. No comprueba cómo SE VE —eso solo en
 * Chrome—, pero sí que no haya un nombre mal escrito ni una pieza que se cree
 * dentro del bucle, que es lo que rompería la etapa en mitad de una partida.
 *
 * Y comprueba la regla que sostiene la lección: **lo escondido no se dibuja
 * hasta que el jugador lo revela analizando.**
 *
 * Ejecutar:  node --test tests/camino3d.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// --- navegador de mentira, solo lo que usan las texturas de texto
function contextoFalso() {
  const base = { measureText: (t) => ({ width: String(t).length * 8 }), setLineDash() {} };
  return new Proxy(base, {
    get: (o, k) => (k in o ? o[k] : () => {}),
    set: (o, k, v) => { o[k] = v; return true; },
  });
}
globalThis.document ??= {
  createElement: () => ({ width: 0, height: 0, getContext: () => contextoFalso() }),
};
globalThis.window ??= { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };

const THREE = await import('../vendor/three.module.min.js');
const { Escenario, ANCHO_CARRIL } = await import('../src/juego/camino3d/escenario.js');
const { Objetos } = await import('../src/juego/camino3d/objetos.js');
const { Explorador } = await import('../src/juego/camino3d/explorador.js');
const { CAMINO, generarCamino, Carrera } = await import('../src/juego/carrera.js');

const DT = 1 / 60;

/** Corre una carrera de verdad mientras se dibuja, y devuelve las piezas. */
function correr(estrategia, { semilla = 12, segundos = 80 } = {}) {
  const escenario = new Escenario(THREE, {});
  const objetos = new Objetos(THREE, {});
  const explorador = new Explorador(THREE);
  const niebla = new THREE.Fog(0xffffff, 30, 100);
  const fondo = new THREE.Color(0xffffff);

  const car = new Carrera(generarCamino(semilla));
  let t = 0;
  let maxVisibles = 0;
  while (!car.terminada && t < segundos) {
    const { carril, analizar } = estrategia(car);
    car.actualizar(DT, carril, analizar);
    objetos.sincronizar(car, DT, t);
    escenario.actualizar(car.distancia, car.estacionId, niebla, fondo, DT);
    explorador.actualizar(car, DT);
    let visibles = 0;
    objetos.raiz.traverse((o) => { if (o.parent === objetos.raiz && o.visible) visibles++; });
    maxVisibles = Math.max(maxVisibles, visibles);
    t += DT;
  }
  return { car, objetos, escenario, explorador, maxVisibles, t };
}

const comodo = () => ({ carril: 1, analizar: false });
const explorador = (c) => {
  const analizar = c.lente <= 0 && c.datos >= CAMINO.costoLente;
  const vis = c.visibles(40).reverse();
  const rev = vis.find(({ o, dz }) => o.tipo === 'oculto' && o.revelado && dz > 0);
  const dato = vis.find(({ o, dz }) => o.tipo === 'dato' && dz > 0);
  return { carril: rev ? rev.o.carril : dato ? dato.o.carril : 1, analizar };
};

// ======================================================================

test('la escena 3D se construye y corre una carrera entera sin romperse', () => {
  const { t, maxVisibles } = correr(explorador);
  assert.ok(t > 60 && t < 80, 'la carrera tiene que durar lo de siempre');
  assert.ok(maxVisibles > 0, 'algo tendría que verse');
});

test('lo escondido no se dibuja hasta que se analiza', () => {
  // Quien nunca analiza no puede ver un solo cristal rojo en toda la etapa.
  const ciego = correr(comodo);
  const vistos = ciego.objetos.reservas.oculto.filter((m) => m.visible).length;
  assert.equal(vistos, 0, 'se dibujó algo escondido sin haberlo revelado');

  // Quien analiza, sí.
  const { objetos, car } = correr(explorador);
  assert.ok(car.hallazgos.length > 0, 'el explorador debía encontrar algo');
  assert.ok(objetos.reservas.oculto.some((m) => m.userData.obj), 'ninguna pieza se usó nunca');
});

test('nada se crea dentro del bucle: las reservas son fijas', () => {
  const { objetos } = correr(explorador);
  const tamanos = Object.fromEntries(
    Object.entries(objetos.reservas).map(([k, v]) => [k, v.length])
  );
  assert.deepEqual(tamanos, { dato: 20, control: 7, muro: 9, oculto: 6, estacion: 2 });
  // Todas las piezas siguen colgando de la raíz: ninguna se quedó suelta.
  const hijos = objetos.raiz.children.length;
  assert.equal(hijos, 20 + 7 + 9 + 6 + 2);
});

test('cada objeto se coloca en su carril y a su distancia', () => {
  const objetos = new Objetos(THREE, {});
  const car = new Carrera([
    { tipo: 'dato', s: 20, carril: 0, estacion: 0 },
    { tipo: 'control', s: 25, carril: 2, estacion: 0 },
  ]);
  objetos.sincronizar(car, DT, 0);
  const dato = objetos.reservas.dato[0];
  const control = objetos.reservas.control[0];
  assert.ok(dato.visible && control.visible);
  assert.equal(dato.position.x, -ANCHO_CARRIL);
  assert.equal(dato.position.z, -20);
  assert.equal(control.position.x, ANCHO_CARRIL);
  assert.equal(control.position.z, -25);
});

test('el entorno se recicla: nunca se queda atrás ni se aleja de más', () => {
  const escenario = new Escenario(THREE, {});
  const niebla = new THREE.Fog(0xffffff, 30, 100);
  const fondo = new THREE.Color(0xffffff);
  for (const distancia of [0, 120, 400, 900, 1399]) {
    escenario.actualizar(distancia, 'montana', niebla, fondo);
    for (const g of escenario.props) {
      const dz = -g.position.z - distancia;     // metros por delante del jugador
      assert.ok(dz > -14 && dz < 240, `prop fuera de sitio a ${distancia} m: ${dz.toFixed(1)}`);
    }
  }
});

test('el pueblo y el desierto no se mezclan: cada pieza solo se ve en su zona', () => {
  const escenario = new Escenario(THREE, {});
  const niebla = new THREE.Fog(0xffffff, 30, 100);
  const fondo = new THREE.Color(0xffffff);
  escenario.configurar(2, CAMINO.largo);            // dos tramos: pueblo y desierto
  const mitad = CAMINO.largo / 2;
  for (const distancia of [0, 200, 500, mitad - 60, mitad + 30, 1000, 1350]) {
    escenario.actualizar(distancia, 'manantial', niebla, fondo);
    for (const g of [...escenario.props, ...escenario.desierto]) {
      if (!g.visible) continue;
      const s = -g.position.z;
      const debia = s < mitad ? 'pueblo' : 'desierto';
      assert.equal(g.userData.zona, debia, `a ${distancia} m: pieza de ${g.userData.zona} en zona de ${debia}`);
    }
  }
  // En pleno pueblo no hay nada del desierto a la vista, y al revés.
  escenario.actualizar(100, 'manantial', niebla, fondo);
  assert.ok(escenario.desierto.every((g) => !g.visible) && escenario.props.some((g) => g.visible));
  escenario.actualizar(1000, 'ramales', niebla, fondo);
  assert.ok(escenario.props.every((g) => !g.visible) && escenario.desierto.some((g) => g.visible));
});

test('el explorador sigue su carril y se inclina hacia donde va', () => {
  const e = new Explorador(THREE);
  const car = new Carrera(generarCamino(3));
  car.xCarril = 2; car.carril = 2; car.distancia = 50;
  e.actualizar(car, DT);
  assert.equal(e.raiz.position.x, ANCHO_CARRIL);
  assert.equal(e.raiz.position.z, -50);

  car.carril = 0; car.xCarril = 1.6;           // va cruzando a la izquierda
  e.actualizar(car, DT);
  assert.ok(e.cuerpo.rotation.z > 0, 'tendría que inclinarse hacia el carril nuevo');
});

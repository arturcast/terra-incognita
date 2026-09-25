/**
 * camino.test.js — La Etapa 2, "El Camino", sin pantalla.
 *
 * Lo más importante que se prueba aquí es el EQUILIBRIO: que la lección se
 * sostenga jugando. Se simulan tres formas de jugar sobre el mismo camino:
 *
 *   cómodo        — carril del centro, nunca analiza.
 *   solo controles— persigue los carteles ✓.
 *   explorador    — recoge datos, analiza, va a por lo que se revela.
 *
 * Si el diseño está bien, los dos primeros no encuentran nada y el explorador
 * gana con claridad. Si algún cambio de números rompe eso, estas pruebas lo
 * dicen antes de que llegue al stand.
 *
 * Ejecutar:  node --test tests/camino.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMINO, ESTACIONES, generarCamino, Carrera, carrilDesdePuntero, ganador,
} from '../src/juego/carrera.js';

const DT = 1 / 60;

function jugar(estrategia, semilla = 42) {
  const c = new Carrera(generarCamino(semilla));
  let t = 0;
  const eventos = [];
  while (!c.terminada && t < 200) {
    const { carril, analizar } = estrategia(c);
    c.actualizar(DT, carril, analizar);
    eventos.push(...c.eventos);
    t += DT;
  }
  return { c, t, r: c.resultado(), eventos };
}

const comodo = () => ({ carril: 1, analizar: false });

const soloControles = (c) => {
  const cerca = c.visibles(30).reverse().find(({ o, dz }) => o.tipo === 'control' && dz > 0);
  return { carril: cerca ? cerca.o.carril : 1, analizar: false };
};

const explorador = (c) => {
  const analizar = c.lente <= 0 && c.datos >= CAMINO.costoLente;
  const vis = c.visibles(40).reverse();   // de cerca a lejos
  const rev = vis.find(({ o, dz }) => o.tipo === 'oculto' && o.revelado && dz > 0);
  const dato = vis.find(({ o, dz }) => o.tipo === 'dato' && dz > 0);
  let objetivo = rev ? rev.o.carril : dato ? dato.o.carril : 1;
  const muroEn = (k) => vis.some(({ o, dz }) => o.tipo === 'muro' && dz > 0 && dz < 9 && o.carril === k);
  if (muroEn(objetivo)) objetivo = [0, 1, 2].find((k) => !muroEn(k)) ?? objetivo;
  return { carril: objetivo, analizar };
};

// ======================================================================
// EL CAMINO
// ======================================================================

test('el camino recorre las cinco estaciones del gas, en orden', () => {
  const objs = generarCamino(7);
  const est = objs.filter((o) => o.tipo === 'estacion').map((o) => o.estacion);
  assert.deepEqual(est, [0, 1, 2, 3, 4]);
  assert.deepEqual(ESTACIONES.map((e) => e.id), ['manantial', 'ramales', 'montana', 'caudal', 'represa']);
});

test('siempre hay por dónde pasar, y ningún hallazgo queda detrás de un muro en su carril', () => {
  for (let semilla = 1; semilla <= 50; semilla++) {
    const objs = generarCamino(semilla);
    const porFila = new Map();
    for (const o of objs) {
      if (o.tipo !== 'muro' && o.tipo !== 'oculto') continue;
      const k = o.s.toFixed(2);
      (porFila.get(k) || porFila.set(k, []).get(k)).push(o);
    }
    for (const fila of porFila.values()) {
      assert.ok(fila.filter((o) => o.tipo === 'muro').length <= 1, `semilla ${semilla}: fila bloqueada`);
      const muro = fila.find((o) => o.tipo === 'muro');
      const oculto = fila.find((o) => o.tipo === 'oculto');
      if (muro && oculto) assert.notEqual(muro.carril, oculto.carril, `semilla ${semilla}: hallazgo tras un muro`);
    }
  }
});

test('lo escondido está sobre todo fuera del camino cómodo', () => {
  let lat = 0, tot = 0;
  for (let semilla = 1; semilla <= 60; semilla++) {
    for (const o of generarCamino(semilla)) if (o.tipo === 'oculto') { tot++; if (o.carril !== 1) lat++; }
  }
  console.log(`    ${Math.round(lat / tot * 100)} % de los hallazgos van por los carriles laterales`);
  assert.ok(lat / tot > 0.6);
});

test('la misma semilla da el mismo camino a los dos jugadores', () => {
  assert.deepEqual(generarCamino(99), generarCamino(99));
  assert.notDeepEqual(generarCamino(99), generarCamino(100));
});

// ======================================================================
// LA LENTE
// ======================================================================

test('sin datos no hay análisis: la lente no se enciende', () => {
  const c = new Carrera(generarCamino(3));
  c.actualizar(DT, 1, true);
  assert.equal(c.lente, 0);
  assert.ok(c.eventos.some((e) => e.tipo === 'sinDatos'));
});

test('analizar gasta datos y solo revela lo que está al alcance', () => {
  const c = new Carrera([
    { tipo: 'oculto', s: 30, carril: 0, estacion: 0 },
    { tipo: 'oculto', s: 200, carril: 2, estacion: 1 },
  ]);
  c.datos = 12;
  c.actualizar(DT, 1, true);
  assert.equal(c.datos, 12 - CAMINO.costoLente);
  assert.equal(c.objetos[0].revelado, true, 'el cercano debía revelarse');
  assert.equal(c.objetos[1].revelado, false, 'el lejano no');
});

test('lo revelado se atrapa en su carril; lo no revelado pasa sin verse', () => {
  const c = new Carrera([
    { tipo: 'oculto', s: 5, carril: 0, estacion: 0 },
    // Muy por delante: fuera del alcance de la lente durante toda su duración.
    { tipo: 'oculto', s: 150, carril: 2, estacion: 0 },
  ]);
  c.datos = 10;
  c.actualizar(DT, 0, true);               // una sola vez: revela el cercano
  for (let k = 0; k < 60 * 20; k++) c.actualizar(DT, 0, false);
  assert.equal(c.hallazgos.length, 1);
  assert.equal(c.noVistos, 1);
});

test('chocar con un muro cuesta datos y frena', () => {
  const c = new Carrera([{ tipo: 'muro', s: 3, carril: 1, estacion: 0, texto: 'Pídelo por correo' }]);
  c.datos = 10;
  for (let k = 0; k < 30; k++) c.actualizar(DT, 1, false);
  assert.equal(c.choques, 1);
  assert.equal(c.datos, 10 - CAMINO.castigoChoque);
  assert.ok(c.tropiezo > 0);
});

// ======================================================================
// EL EQUILIBRIO: QUE LA LECCIÓN SE SOSTENGA JUGANDO
// ======================================================================

test('quien se queda en lo cómodo y no analiza no encuentra nada', () => {
  const { r } = jugar(comodo);
  console.log(`    cómodo: ${r.hallazgos}/${r.existentes} hallazgos, ${r.controles} controles, ${r.noVistos} pasaron sin verse`);
  assert.equal(r.hallazgos, 0);
  assert.equal(r.noVistos, r.existentes);
  assert.equal(r.carrilComodo, true);
});

test('perseguir los carteles ✓ tampoco encuentra nada', () => {
  const { r } = jugar(soloControles);
  console.log(`    solo controles: ${r.controles} controles revisados, ${r.hallazgos} hallazgos`);
  assert.ok(r.controles > 0);
  assert.equal(r.hallazgos, 0);
});

test('ningún hallazgo es imposible: ni antes de poder tener datos, ni pegado a otro', () => {
  for (let semilla = 1; semilla <= 200; semilla++) {
    const ocultos = generarCamino(semilla).filter((o) => o.tipo === 'oculto').map((o) => o.s);
    assert.ok(ocultos.every((s) => s >= CAMINO.inicioOcultos), `semilla ${semilla}: hallazgo antes de tener datos`);
    for (let k = 1; k < ocultos.length; k++) {
      assert.ok(ocultos[k] - ocultos[k - 1] >= CAMINO.sepOcultos - 1e-9, `semilla ${semilla}: hallazgos pegados`);
    }
  }
});

test('de media, quien juega bien encuentra tres de cada cuatro', () => {
  let h = 0, e = 0;
  for (let semilla = 1; semilla <= 60; semilla++) { const r = jugar(explorador, semilla).r; h += r.hallazgos; e += r.existentes; }
  console.log(`    explorador, media de 60 caminos: ${Math.round(h / e * 100)} %`);
  assert.ok(h / e >= 0.75);
});

test('quien recoge datos, analiza y explora encuentra la mayoría y gana', () => {
  const resultados = [];
  for (const semilla of [1, 7, 42, 99, 123]) {
    const a = jugar(explorador, semilla).r;
    const b = jugar(comodo, semilla).r;
    resultados.push(a);
    assert.equal(ganador([a, b]), 0, `semilla ${semilla}: el explorador no ganó`);
    assert.ok(a.hallazgos / a.existentes >= 0.6, `semilla ${semilla}: solo ${a.hallazgos}/${a.existentes}`);
  }
  const media = resultados.reduce((s, r) => s + r.hallazgos / r.existentes, 0) / resultados.length;
  console.log(`    explorador: encuentra de media el ${Math.round(media * 100)} %; ` +
    `usa la lente ${resultados[0].usosLente} veces y recoge ${resultados[0].datos} datos`);
});

test('una partida dura algo más de un minuto', () => {
  const { t } = jugar(explorador);
  console.log(`    duración: ${t.toFixed(0)} s`);
  assert.ok(t > 55 && t < 85);
});

// ======================================================================
// CONTROL Y RESULTADO
// ======================================================================

test('el carril sigue al puntero sin temblar en las fronteras', () => {
  const W = 900;
  assert.equal(carrilDesdePuntero(100, W, 1), 0);
  assert.equal(carrilDesdePuntero(450, W, 1), 1);
  assert.equal(carrilDesdePuntero(800, W, 1), 2);
  // justo en la frontera no cambia: histéresis
  assert.equal(carrilDesdePuntero(W / 3 + 5, W, 0), 0);
  assert.equal(carrilDesdePuntero(W / 3 - 5, W, 1), 1);
});

test('el tablero cuenta, estación por estación, lo encontrado frente a lo que había', () => {
  const { r } = jugar(explorador, 7);
  assert.equal(r.porEstacion.length, 5);
  const suma = r.porEstacion.reduce((s, e) => s + e.existentes, 0);
  assert.equal(suma, ESTACIONES.reduce((s, e) => s + e.ocultos, 0));
  assert.ok(r.porEstacion.every((e) => e.encontrados <= e.existentes));
  const montana = r.porEstacion[2];
  assert.equal(montana.existentes, 4, 'La Montaña Perdida es donde más hay escondido');
});

test('empate solo si coinciden hallazgos y puntos', () => {
  assert.equal(ganador([{ hallazgos: 3, puntos: 500 }, { hallazgos: 3, puntos: 500 }]), -1);
  assert.equal(ganador([{ hallazgos: 3, puntos: 100 }, { hallazgos: 3, puntos: 500 }]), 1);
  assert.equal(ganador([{ hallazgos: 4, puntos: 100 }, { hallazgos: 3, puntos: 900 }]), 0);
});

/**
 * regreso.test.js — La Etapa 3, "El Regreso", sin pantalla.
 *
 * Lo que se prueba aquí es que el vuelo sea JUSTO y que la lección se sostenga:
 * que ningún paso entre columnas sea imposible, que quien vuela bien entregue
 * casi todo lo que trae, y que chocar cueste algo pero nunca saque del juego
 * (decisión del usuario: con dos jugadores, morir deja a alguien mirando).
 *
 * Ejecutar:  node --test tests/regreso.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VUELO, generarCielo, Vuelo, ganadorVuelo, FIN_AL_CHOCAR } from '../src/juego/vuelo.js';

const DT = 1 / 60;

/** Vuela una partida entera con una estrategia. */
function volar(estrategia, { semilla = 7, hallazgos = 6 } = {}) {
  const v = new Vuelo(generarCielo(semilla), hallazgos);
  const eventos = [];
  while (!v.terminado) {
    v.actualizar(DT, estrategia(v));
    eventos.push(...v.eventos);
  }
  return { v, r: v.resultado(), eventos };
}

const nuncaPulsa = () => false;

/** Apunta al centro del paso que viene: es como juega alguien que ya entendió. */
const piloto = (v) => {
  const siguiente = v.columnas.find((c) => c.x > v.x);
  const objetivo = siguiente ? siguiente.y : (VUELO.alto - VUELO.suelo) / 2;
  return v.volando && v.y > objetivo + 12;
};

// ======================================================================
// EL CIELO
// ======================================================================

test('la misma semilla da el mismo cielo a los dos jugadores', () => {
  assert.deepEqual(generarCielo(42), generarCielo(42));
  assert.notDeepEqual(generarCielo(42), generarCielo(43));
});

test('ningún paso es imposible: ni pegado al borde, ni más lejos de lo que se alcanza', () => {
  for (let semilla = 1; semilla <= 60; semilla++) {
    const { columnas } = generarCielo(semilla);
    const alto = VUELO.alto - VUELO.suelo;
    for (let i = 0; i < columnas.length; i++) {
      const c = columnas[i];
      assert.ok(c.y >= VUELO.margen - 1e-9 && c.y <= alto - VUELO.margen + 1e-9,
        `semilla ${semilla}: paso pegado al borde (${Math.round(c.y)})`);
      if (i) {
        assert.ok(Math.abs(c.y - columnas[i - 1].y) <= VUELO.saltoMax + 1e-9,
          `semilla ${semilla}: dos pasos demasiado separados`);
      }
    }
  }
});

test('la primera columna llega con tiempo de sobra para reaccionar', () => {
  const { columnas } = generarCielo(3);
  const segundos = (columnas[0].x - VUELO.xPaloma) / VUELO.velocidad;
  assert.ok(segundos >= 2, `solo ${segundos.toFixed(1)} s antes de la primera columna`);
  assert.ok(!columnas[0].aro && !columnas[1].aro, 'las dos primeras columnas van limpias');
});

test('los puestos de control quedan entre columnas, no encima de una', () => {
  const { columnas, puestos } = generarCielo(11);
  assert.ok(puestos.length >= 3, 'tiene que haber varios puestos en un minuto');
  for (const p of puestos) {
    const cerca = columnas.some((c) => Math.abs(c.x - p.x) < VUELO.anchoColumna);
    assert.ok(!cerca, 'un puesto cae encima de una columna');
  }
});

// ======================================================================
// VOLAR
// ======================================================================

test('quien no pulsa nunca se cae, y no entrega nada', () => {
  const { r } = volar(nuncaPulsa);
  assert.equal(r.entregas, 0);
  assert.ok(r.choques > 0, 'sin aletear hay que caer');
});

test('chocar cuesta un sobre y tiempo, pero no saca del juego', () => {
  assert.equal(FIN_AL_CHOCAR, false);
  const v = new Vuelo(generarCielo(5), 4);
  const antes = v.sobres;
  v.y = VUELO.alto - VUELO.suelo;          // pegado al suelo
  v.actualizar(DT, false);
  assert.equal(v.choques, 1);
  assert.equal(v.sobres, antes - 1);
  assert.ok(v.caido > 0 && !v.volando);
  // y vuelve solo
  for (let t = 0; t < VUELO.reaparicion + 0.1; t += DT) v.actualizar(DT, false);
  assert.ok(v.volando, 'la paloma tiene que volver al aire');
  assert.ok(v.invulnerable > 0, 'y volver con un momento de gracia');
  assert.ok(!v.terminado, 'la partida sigue');
});

test('quien vuela al centro del paso entrega casi todo lo que trae', () => {
  let entregadas = 0, traidas = 0, choques = 0;
  for (let semilla = 1; semilla <= 12; semilla++) {
    const { r } = volar(piloto, { semilla, hallazgos: 6 });
    entregadas += r.entregas;
    traidas += r.sobresIniciales;
    choques += r.choques;
  }
  const pct = Math.round(entregadas / traidas * 100);
  console.log(`    piloto: entrega el ${pct} % de lo que trae, ${(choques / 12).toFixed(1)} choques por partida`);
  assert.ok(pct >= 75, `solo entregó el ${pct} %`);
  assert.ok(choques / 12 <= 2, 'volando bien no debería chocar tanto');
});

test('no se puede entregar más de lo que se trajo de El Camino', () => {
  for (const hallazgos of [0, 3, 9, 14]) {
    const { r } = volar(piloto, { semilla: 21, hallazgos });
    assert.equal(r.sobresIniciales, VUELO.sobresBase + hallazgos);
    assert.ok(r.entregas <= r.sobresIniciales, 'entregó más sobres de los que llevaba');
  }
});

test('traer más hallazgos permite entregar más: la etapa anterior cuenta', () => {
  const pocos = volar(piloto, { semilla: 4, hallazgos: 0 }).r;
  const muchos = volar(piloto, { semilla: 4, hallazgos: 10 }).r;
  assert.ok(muchos.entregas > pocos.entregas,
    `con 10 hallazgos entregó ${muchos.entregas} y con 0, ${pocos.entregas}`);
});

test('el seguimiento se cuenta una sola vez por puesto', () => {
  const { v, r, eventos } = volar(piloto, { semilla: 8 });
  assert.equal(r.seguimientos, eventos.filter((e) => e.tipo === 'seguimiento').length);
  assert.ok(r.seguimientos >= 3, 'en un minuto se pasan varios puestos');
  assert.ok(r.seguimientos <= v.puestos.length);
});

test('el vuelo dura lo que dice, y el mundo avanza igual para los dos', () => {
  const a = volar(piloto, { semilla: 9 }).v;
  const b = volar(nuncaPulsa, { semilla: 9 }).v;
  assert.ok(Math.abs(a.t - VUELO.duracion) < 0.1);
  assert.ok(Math.abs(a.distancia - b.distancia) < 1,
    'chocar no puede dejar a nadie atrás: el cielo corre igual para todos');
});

test('gana quien más entrega; desempatan el seguimiento y los choques', () => {
  const base = { entregas: 5, seguimientos: 3, choques: 1 };
  assert.equal(ganadorVuelo([base, { ...base, entregas: 7 }]), 1);
  assert.equal(ganadorVuelo([{ ...base, seguimientos: 4 }, base]), 0);
  assert.equal(ganadorVuelo([base, { ...base, choques: 0 }]), 1);
  assert.equal(ganadorVuelo([base, { ...base }]), -1, 'empate perfecto');
  assert.equal(ganadorVuelo([base]), 0);
});

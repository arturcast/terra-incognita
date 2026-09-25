/**
 * humo.test.js — Recorre las escenas de principio a fin, dibujando cada
 * fotograma sobre un lienzo falso.
 *
 * `node --check` solo dice que el código está bien escrito. No detecta una
 * variable mal nombrada dentro del dibujo, que en el navegador rompería la
 * etapa en mitad de una partida delante de la gente. Esta prueba ejecuta de
 * verdad cada fase —instrucciones, cuenta atrás, carrera, tablero, revelación,
 * cierre— con uno y con dos jugadores, y falla si algo lanza un error.
 *
 * No comprueba cómo SE VE: eso solo se ve en Chrome.
 *
 * Ejecutar:  node --test tests/humo.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// ------------------------------------------------ navegador de mentira
function contextoFalso() {
  const gradiente = { addColorStop() {} };
  const base = {
    measureText: (t) => ({ width: String(t).length * 7 }),
    createLinearGradient: () => gradiente,
    createRadialGradient: () => gradiente,
    createPattern: () => ({}),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    setLineDash() {},
  };
  // Cualquier otro método existe y no hace nada; cualquier propiedad se guarda.
  return new Proxy(base, {
    get: (o, k) => (k in o ? o[k] : () => {}),
    set: (o, k, v) => { o[k] = v; return true; },
  });
}
function lienzoFalso(w = 1920, h = 1080) {
  return {
    width: w, height: h,
    getContext: () => contextoFalso(),
    getBoundingClientRect: () => ({ width: w, height: h, left: 0, top: 0 }),
  };
}
globalThis.window ??= { addEventListener() {}, removeEventListener() {}, devicePixelRatio: 1 };
globalThis.document ??= { createElement: () => lienzoFalso(160, 160) };

const { JoyCon } = await import('../src/core/joycon.js');
const { Motor } = await import('../src/core/engine.js');
const { EscenaCamino } = await import('../src/juego/escenas/camino.js');
const { EscenaCierre } = await import('../src/juego/escenas/cierre.js');
const { EscenaPrueba2J } = await import('../src/juego/escenas/prueba2j.js');
const { EscenaMapa } = await import('../src/juego/escenas/mapa.js');
const { EscenaIntro } = await import('../src/juego/escenas/intro.js');
const { EscenaRuta, PARADAS } = await import('../src/juego/escenas/ruta.js');
const { EscenaRegreso } = await import('../src/juego/escenas/regreso.js');

function montarMotor(ancho = 1920, alto = 1080) {
  const jugadores = [new JoyCon(), new JoyCon()];
  const lienzo = lienzoFalso(ancho, alto);
  const motor = new Motor(lienzo, jugadores);
  motor.saltos = [];
  motor.ir = async (nombre, datos) => { motor.saltos.push(nombre); motor.datos = datos; };   // sin fundidos
  motor.escenas.set('mapa', {}).set('camino', {}).set('cierre', {});
  return { motor, jugadores, ctx: motor.ctx };
}

function correr(escena, ctx, segundos, alPaso = () => {}) {
  for (let k = 0; k < segundos * 60; k++) {
    alPaso(k / 60);
    escena.actualizar(1 / 60);
    escena.dibujar(ctx);
    for (const j of escena.motor.jugadores) j.finDeFrame();
  }
}

const tecla = (escena, key) => escena._onTecla({ key });

// ======================================================================

for (const [nombre, ancho, alto] of [['1920×1080', 1920, 1080], ['1280×720', 1280, 720]]) {
  test(`El Camino, un jugador con teclado, de principio a fin (${nombre})`, async () => {
    const { motor, ctx } = montarMotor(ancho, alto);
    const e = new EscenaCamino(motor);
    await e.entrar();
    correr(e, ctx, 1.5);
    assert.equal(e.fase, 'guia');
    tecla(e, 'Enter');
    correr(e, ctx, 0.1);
    assert.equal(e.fase, 'cuenta');
    correr(e, ctx, 3.2);
    assert.equal(e.fase, 'carrera');
    // Jugar: cambiar de carril y analizar de vez en cuando, hasta la meta.
    const jugar = (t) => {
      const k = Math.floor(t * 60);
      if (k % 90 === 0) tecla(e, k % 180 === 0 ? 'ArrowLeft' : 'ArrowRight');
      if (k % 20 === 0) tecla(e, ' ');
    };
    // Fotograma a fotograma, para saber exactamente cuándo se cruza la meta.
    let f = 0;
    while (e.fase === 'carrera' && f < 120 * 60) { correr(e, ctx, 1 / 60, () => jugar(f / 60)); f++; }
    assert.equal(e.fase, 'tablero', 'la carrera no terminó');
    // Quien llega pulsando sin parar NO debe saltarse su tablero.
    correr(e, ctx, 2.9, jugar);
    assert.equal(e.fase, 'tablero', 'una pulsación de la carrera se saltó el tablero');
    correr(e, ctx, 0.3);
    tecla(e, 'Enter');
    correr(e, ctx, 0.1);
    assert.equal(e.fase, 'revelacion');
    correr(e, ctx, 2.2);
    tecla(e, 'Enter');
    correr(e, ctx, 0.1);
    assert.deepEqual(motor.saltos, ['ruta'], 'al terminar El Camino se vuelve al recorrido');
    assert.deepEqual(motor.datos, { completada: 'camino' });
    const r = motor.expedicion.puntajes.camino.resultados[0];
    console.log(`    ${nombre}: ${r.hallazgos}/${r.existentes} con teclado torpe, ${r.datos} datos, ${r.choques} choques`);
    e.salir();
  });
}

test('El Camino, dos jugadores a pantalla partida', async () => {
  const { motor, jugadores, ctx } = montarMotor();
  jugadores.forEach((j) => { j.estado.conectado = true; });
  const e = new EscenaCamino(motor);
  await e.entrar();
  correr(e, ctx, 1.5);
  tecla(e, 'Enter');
  correr(e, ctx, 3.3);
  assert.equal(e.fase, 'carrera');
  assert.equal(e.participantes.length, 2);
  assert.equal(e.carreras.length, 2);
  assert.deepEqual(e.carreras[0].objetos.map((o) => o.s), e.carreras[1].objetos.map((o) => o.s),
    'los dos jugadores deben correr el mismo camino');
  correr(e, ctx, 90);
  assert.equal(e.fase, 'tablero');
  correr(e, ctx, 3.3);   // dibuja los dos tableros y el cartel del ganador
  e.salir();
});

test('si el jugador 2 se va a mitad de carrera, la etapa no se rompe', async () => {
  const { motor, jugadores, ctx } = montarMotor();
  jugadores.forEach((j) => { j.estado.conectado = true; });
  const e = new EscenaCamino(motor);
  await e.entrar();
  correr(e, ctx, 1.5);
  tecla(e, 'Enter');
  correr(e, ctx, 3.3);
  correr(e, ctx, 10);
  jugadores[1].estado.conectado = false;     // se le acabó la batería
  correr(e, ctx, 85);
  assert.equal(e.fase, 'tablero', 'la carrera debía terminar igual');
  e.salir();
});

for (const [nombre, ancho, alto] of [['1920×1080', 1920, 1080], ['1280×720', 1280, 720]]) {
  test(`la ruta sella la etapa terminada y entra en la siguiente (${nombre})`, async () => {
    const { motor, ctx } = montarMotor(ancho, alto);
    const e = new EscenaRuta(motor);

    // Primera visita: sin sellos, entra en la Etapa 1.
    await e.entrar(null);
    correr(e, ctx, 5);
    assert.deepEqual(motor.saltos, ['mapa']);

    // Terminó El Mapa: la sella y entra en El Camino.
    motor.saltos = [];
    motor.expedicion.puntajes.mapa = { elegidas: [{}, {}, {}], vision: 46 };
    await e.entrar({ completada: 'mapa' });
    correr(e, ctx, 1.4);
    assert.deepEqual(motor.expedicion.etapasCompletadas, ['mapa']);
    assert.deepEqual(motor.saltos, [], 'todavía no debe entrar: el sello tiene su momento');
    correr(e, ctx, 4);
    assert.deepEqual(motor.saltos, ['camino']);

    // Terminó El Camino y la Etapa 3 no existe todavía: va al cierre.
    motor.saltos = [];
    motor.expedicion.puntajes.camino = { resultados: [{ hallazgos: 9, existentes: 14 }] };
    await e.entrar({ completada: 'camino' });
    correr(e, ctx, 5);
    assert.deepEqual(motor.saltos, ['cierre']);
    e.salir();
  });
}

test('pulsar sin parar en la ruta no se salta el sello', async () => {
  const { motor, ctx } = montarMotor();
  const e = new EscenaRuta(motor);
  await e.entrar({ completada: 'mapa' });
  correr(e, ctx, 1.0, () => { e.teclado = true; });
  assert.deepEqual(motor.saltos, [], 'el ✓ tiene que verse antes de entrar');
  correr(e, ctx, 3, () => { e.teclado = true; });
  assert.deepEqual(motor.saltos, ['camino']);
  e.salir();
});

test('la ruta conoce las tres etapas y ninguna nombra el oficio', () => {
  assert.deepEqual(PARADAS.map((p) => p.id), ['mapa', 'camino', 'regreso']);
  const vetadas = /auditor|hallazgo|riesgo residual|control interno|plan anual|informe/i;
  for (const p of PARADAS) {
    assert.ok(!vetadas.test(p.titulo + ' ' + p.que + ' ' + p.quienes), p.id + ' nombra el oficio');
  }
});

for (const [nombre, ancho, alto, jugadores] of [['un jugador', 1920, 1080, 1], ['dos jugadores', 1280, 720, 2]]) {
  test(`El Regreso vuela de principio a fin (${nombre})`, async () => {
    const { motor, jugadores: mandos, ctx } = montarMotor(ancho, alto);
    for (let i = 0; i < jugadores; i++) mandos[i].estado.conectado = true;
    motor.expedicion.puntajes.camino = { resultados: [{ hallazgos: 7, existentes: 14 }, { hallazgos: 5, existentes: 14 }] };

    const e = new EscenaRegreso(motor);
    await e.entrar();
    correr(e, ctx, 1.5);
    assert.equal(e.fase, 'guia');
    tecla(e, 'Enter');
    correr(e, ctx, 0.1);
    assert.equal(e.fase, 'cuenta');
    correr(e, ctx, 3.2);
    assert.equal(e.fase, 'vuelo');
    assert.equal(e.vuelos.length, jugadores);

    // Aletea como una persona: a ratos, no cada fotograma.
    const aletear = (t) => { if (Math.floor(t * 60) % 22 === 0) tecla(e, ' '); };
    // Fotograma a fotograma, para saber exactamente cuándo aterriza.
    let f = 0;
    while (e.fase === 'vuelo' && f < 80 * 60) { correr(e, ctx, 1 / 60, () => aletear(f / 60)); f++; }
    assert.equal(e.fase, 'tablero', 'el vuelo debía terminar solo');
    // Quien llega aleteando no puede saltarse su tablero.
    correr(e, ctx, 2.5, aletear);
    assert.equal(e.fase, 'tablero', 'un aleteo del vuelo se saltó el tablero');
    correr(e, ctx, 0.8);
    tecla(e, 'Enter');
    correr(e, ctx, 0.1);
    assert.equal(e.fase, 'revelacion');
    correr(e, ctx, 2.2);
    tecla(e, 'Enter');
    correr(e, ctx, 0.1);
    assert.deepEqual(motor.saltos, ['ruta']);
    assert.deepEqual(motor.datos, { completada: 'regreso' });
    const R = motor.expedicion.puntajes.regreso.resultados[0];
    console.log(`    ${nombre}: entregó ${R.entregas} de ${R.sobresIniciales}, ${R.choques} choques`);
    e.salir();
  });
}

test('El Mapa termina nombrando el Plan Anual, y de ahí va a la ruta', async () => {
  const { motor, ctx } = montarMotor();
  const { evaluar, REGIONES } = await import('../src/datos/territorio.js');
  const mapa = new EscenaMapa(motor);
  await mapa.entrar();

  // Se salta la partida: lo que se prueba es el aterrizaje de la etapa.
  mapa.elegidas = REGIONES.slice(0, 3);
  mapa.resultado = evaluar(mapa.elegidas, 0.42);
  mapa.fase = 'resultado';
  mapa.tFase = 0;
  mapa.paginaRes = mapa._ultimaPagina;

  correr(mapa, ctx, 2.2);
  mapa.raton.clic = true;
  correr(mapa, ctx, 0.1);
  assert.equal(mapa.fase, 'revelacion', 'tras el resultado va la revelación de la etapa');

  correr(mapa, ctx, 4.3);                       // la dibuja entera: son tres tiempos
  assert.deepEqual(motor.saltos, [], 'la revelación no se salta sola');
  mapa.raton.clic = true;
  correr(mapa, ctx, 0.1);
  assert.deepEqual(motor.saltos, ['ruta']);
  assert.deepEqual(motor.datos, { completada: 'mapa' });
  mapa.salir();
});

test('el cierre recorre sus tres páginas', async () => {
  const { motor, ctx } = montarMotor();
  const e = new EscenaCierre(motor);
  await e.entrar({ elegidas: [], islaDescubierta: false });
  for (let pagina = 0; pagina < 3; pagina++) {
    correr(e, ctx, 4.5);
    e._clic = true;
    correr(e, ctx, 0.1);
  }
  assert.deepEqual(motor.saltos, ['intro']);
});

test('la sala de prueba de dos jugadores dibuja con uno, dos y ningún mando', async () => {
  const { motor, jugadores, ctx } = montarMotor();
  const e = new EscenaPrueba2J(motor);
  await e.entrar();
  correr(e, ctx, 0.5);                                   // ninguno
  jugadores[0].estado.conectado = true;  correr(e, ctx, 0.5);   // uno
  jugadores[1].estado.conectado = true;  correr(e, ctx, 0.5);   // dos
  jugadores[0].estado.conectado = false; correr(e, ctx, 0.5);   // solo el 2
});

test('la apertura y el mapa arrancan y dibujan sin errores', async () => {
  const { motor, ctx } = montarMotor();
  const intro = new EscenaIntro(motor);
  await intro.entrar();
  correr(intro, ctx, 1);
  const mapa = new EscenaMapa(motor);
  await mapa.entrar();
  correr(mapa, ctx, 1.5);
  mapa.raton.clic = true;
  correr(mapa, ctx, 2);
  assert.equal(mapa.fase, 'explorar');
  mapa.salir();
  intro.salir();
});

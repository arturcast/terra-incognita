/**
 * joycon-flujo.test.js — Todo lo nuevo del recorrido, jugado SOLO con Joy-Con.
 *
 * Las pulsaciones se simulan igual que llegan del mando real: activando el bit
 * del botón en los flancos del reporte (`_flancosPulsados`), que el motor
 * olvida en cada `finDeFrame()`. Así se prueba el mismo camino de código que
 * con el Joy-Con por Bluetooth, sin teclado ni ratón.
 *
 * Se juega con los dos tipos de mando: el izquierdo (flechas, ZL, −) y el
 * derecho (X/A/B/Y, ZR, +).
 *
 * Ejecutar:  node --test tests/joycon-flujo.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// --- lienzo y navegador de mentira (lo mismo que humo.test.js) ---
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
  return new Proxy(base, {
    get: (o, k) => (k in o ? o[k] : () => {}),
    set: (o, k, v) => { o[k] = v; return true; },
  });
}
const lienzoFalso = (w, h) => ({
  width: w, height: h, style: {},
  getContext: () => contextoFalso(),
  getBoundingClientRect: () => ({ width: w, height: h, left: 0, top: 0 }),
});
globalThis.window ??= { addEventListener() {}, removeEventListener() {}, devicePixelRatio: 1 };
globalThis.document ??= { createElement: () => lienzoFalso(160, 160) };

const { JoyCon, BOTON } = await import('../src/core/joycon.js');
const { Motor } = await import('../src/core/engine.js');
const { Pausa } = await import('../src/ui/pausa.js');
const { EscenaJugadores } = await import('../src/juego/escenas/jugadores.js');
const { EscenaIntro } = await import('../src/juego/escenas/intro.js');
const { EscenaCamino } = await import('../src/juego/escenas/camino.js');
const { EscenaRegreso } = await import('../src/juego/escenas/regreso.js');
const { EscenaRecuento } = await import('../src/juego/escenas/recuento.js');

/** Motor con dos Joy-Con: `lados` dice cuál es izquierdo. */
function montar(lados = ['R', 'R'], conectados = [true, false]) {
  const mandos = [new JoyCon(), new JoyCon()];
  mandos.forEach((j, i) => { j.esIzquierdo = lados[i] === 'L'; j.estado.conectado = conectados[i]; });
  const motor = new Motor(lienzoFalso(1280, 720), mandos);
  motor.saltos = [];
  motor.ir = async (nombre, datos, opciones) => { motor.saltos.push({ nombre, datos, opciones }); };
  return { motor, mandos, ctx: motor.ctx };
}

/** Pulsa un botón del mando, como llegaría en un reporte. */
const pulsar = (jc, bit) => { jc._flancosPulsados |= (1 << bit); };
/** Mantiene pulsados el gatillo y el hombro del mando (lo que se hace para vincularlo). */
const vincular = (motor, escena, jc) => {
  jc.estado.mascara |= (1 << jc.bitGatillo) | (1 << jc.bitHombro);
  correr(motor, escena, 0.1);
  jc.estado.mascara = 0;
};

/** Un fotograma, como lo hace el motor: pausa, escena, dibujo y olvido de flancos. */
function fotograma(motor, escena, dt = 1 / 60) {
  if (motor.pausa && motor.pausa.abierta) motor.pausa.actualizar(dt);
  else {
    if (motor.pausa) motor.pausa.vigilar();
    if (!(motor.pausa && motor.pausa.abierta)) escena.actualizar(dt);
  }
  escena.dibujar(motor.ctx);
  for (const j of motor.jugadores) j.finDeFrame();
}
const correr = (motor, escena, s) => { for (let k = 0; k < s * 60; k++) fotograma(motor, escena); };

// ======================================================================

for (const lado of ['L', 'R']) {
  const gatillo = lado === 'L' ? BOTON.ZL : BOTON.ZR;
  const bajar = lado === 'L' ? BOTON.ABAJO : BOTON.B;
  const subir = lado === 'L' ? BOTON.ARRIBA : BOTON.X;
  const volver = lado === 'L' ? BOTON.MENOS : BOTON.MAS;

  test(`Joy-Con ${lado}: portada → «Empezar el recorrido» con el gatillo`, async () => {
    const { motor, mandos } = montar([lado, lado]);
    motor.escenas.set('jugadores', {});
    const e = new EscenaIntro(motor);
    await e.entrar();
    correr(motor, e, 1.6);
    pulsar(mandos[0], gatillo);
    correr(motor, e, 0.1);
    assert.equal(motor.saltos[0].nombre, 'jugadores');
    e.salir();
  });

  test(`Joy-Con ${lado}: 2 jugadores con dos Joy-Con del MISMO lado; se vinculan y cada uno escribe con el suyo`, async () => {
    const { motor, mandos } = montar([lado, lado], [true, true]);
    const e = new EscenaJugadores(motor);
    await e.entrar({ destino: 'ruta' });
    correr(motor, e, 0.8);
    pulsar(mandos[0], bajar);                 // «Dos jugadores»
    correr(motor, e, 0.1);
    pulsar(mandos[0], gatillo);
    correr(motor, e, 0.1);
    assert.equal(e.fase, 'vincular');
    correr(motor, e, 0.5);

    // Solo el gatillo no vincula: hacen falta gatillo + hombro.
    mandos[0].estado.mascara = 1 << mandos[0].bitGatillo;
    correr(motor, e, 0.1);
    mandos[0].estado.mascara = 0;
    assert.equal(e.vinculos[0], null);

    vincular(motor, e, mandos[0]);            // el primero en hacerlo es el Jugador 1
    assert.equal(e.vinculos[0] && e.vinculos[0].tipo, 'joycon');
    vincular(motor, e, mandos[0]);            // el mismo mando otra vez: no es el Jugador 2
    assert.equal(e.vinculos[1], null, 'un mando no puede ser de dos jugadores');
    vincular(motor, e, mandos[1]);            // el otro mando: Jugador 2
    assert.equal(e.fase, 'listos');
    correr(motor, e, 1.5);
    assert.equal(e.fase, 'nombre');
    correr(motor, e, 0.5);

    // El mando del Jugador 2 NO escribe en el turno del Jugador 1.
    pulsar(mandos[1], gatillo); correr(motor, e, 0.05);
    assert.equal(e.editores[0].texto, '', 'el mando del otro jugador no debe escribir');

    // Jugador 1: «AB» con su mando y ✓ (B → A → ✓).
    pulsar(mandos[0], gatillo); correr(motor, e, 0.05);
    pulsar(mandos[0], bajar); correr(motor, e, 0.05);
    pulsar(mandos[0], gatillo); correr(motor, e, 0.05);
    pulsar(mandos[0], subir); correr(motor, e, 0.05);
    pulsar(mandos[0], subir); correr(motor, e, 0.05);
    pulsar(mandos[0], gatillo); correr(motor, e, 0.05);
    assert.equal(e.turno, 1, 'ahora escribe el Jugador 2');
    correr(motor, e, 0.5);

    // El mando del Jugador 1 NO escribe en el turno del Jugador 2.
    pulsar(mandos[0], gatillo); correr(motor, e, 0.05);
    assert.equal(e.editores[1].texto, '', 'el mando del Jugador 1 no debe escribir por el 2');

    pulsar(mandos[1], gatillo); correr(motor, e, 0.05);
    pulsar(mandos[1], subir); correr(motor, e, 0.05);
    pulsar(mandos[1], gatillo); correr(motor, e, 0.1);
    assert.equal(motor.expedicion.jugadores, 2);
    assert.deepEqual(motor.expedicion.nombres, ['AB', 'A']);
    assert.equal(motor.saltos.at(-1).nombre, 'ruta');
    assert.deepEqual(motor.saltos.at(-1).opciones, { cinematica: 'inicio' }, 'tras los nombres, el video de inicio');
    e.salir();
  });

  test(`Joy-Con ${lado}: un jugador con Joy-Con y el otro con teclado`, async () => {
    const { motor, mandos } = montar([lado, lado], [true, false]);
    const e = new EscenaJugadores(motor);
    await e.entrar({});
    correr(motor, e, 0.8);
    pulsar(mandos[0], bajar);
    correr(motor, e, 0.1);
    pulsar(mandos[0], gatillo);
    correr(motor, e, 0.6);
    vincular(motor, e, mandos[0]);
    e._onTecla({ key: 'ArrowUp', preventDefault() {}, stopPropagation() {} });
    correr(motor, e, 0.1);
    assert.equal(e.vinculos[1].tipo, 'teclado');
    assert.equal(e.fase, 'listos');
    e.salir();
  });

  test(`Joy-Con ${lado}: + / − en la vinculación vuelve atrás y no abre la pausa`, async () => {
    const { motor, mandos } = montar([lado, lado]);
    motor.nombreEscena = 'jugadores';
    const e = new EscenaJugadores(motor);
    motor.escena = e;
    motor.pausa = new Pausa(motor);
    await e.entrar({});
    correr(motor, e, 0.8);
    pulsar(mandos[0], gatillo);               // «Un jugador»
    correr(motor, e, 0.6);
    assert.equal(e.fase, 'vincular');
    pulsar(mandos[0], volver);
    correr(motor, e, 0.1);
    assert.equal(motor.pausa.abierta, false, 'en esta pantalla + / − no pausa');
    assert.equal(e.fase, 'cuantos', 'vuelve a elegir cuántos juegan');
    e.salir();
  });
}

test('dos Joy-Con: el Jugador 2 que eligió al empezar corre y vuela con su mando', async () => {
  const { motor, mandos } = montar(['R', 'L'], [true, true]);
  motor.expedicion.jugadores = 2;
  motor.expedicion.nombres = ['ANA', 'BETO'];
  motor.expedicion.puntajes.camino = { resultados: [{ hallazgos: 6, existentes: 10 }, { hallazgos: 2, existentes: 10 }] };

  const camino = new EscenaCamino(motor);
  await camino.entrar();
  assert.equal(camino.teclado2.unido, false, 'tiene mando: no se le asignan las flechas');
  correr(motor, camino, 1.5);
  pulsar(mandos[0], BOTON.ZR);
  correr(motor, camino, 3.3);
  assert.deepEqual(camino.participantes, [0, 1]);
  const lentes = camino.carreras[1].usosLente;
  camino.carreras[1].datos = 20;
  pulsar(mandos[1], BOTON.ZL);                // el 2 analiza con su gatillo
  correr(motor, camino, 0.05);
  assert.equal(camino.carreras[1].usosLente, lentes + 1, 'el gatillo del Jugador 2 analiza en su carrera');
  camino.salir();

  const regreso = new EscenaRegreso(motor);
  await regreso.entrar();
  correr(motor, regreso, 1.5);
  pulsar(mandos[0], BOTON.ZR);
  correr(motor, regreso, 3.3);
  assert.equal(regreso.vuelos.length, 2);
  const antes = regreso.vuelos[1].aleteos;
  pulsar(mandos[1], BOTON.ZL);
  correr(motor, regreso, 1 / 60);
  assert.equal(regreso.vuelos[1].aleteos, antes + 1, 'el gatillo del Jugador 2 bate sus alas');
  regreso.salir();
});

test('Joy-Con: + pausa en plena carrera, y el gatillo sobre «Continuar» la cierra', async () => {
  const { motor, mandos } = montar(['R', 'R']);
  motor.nombreEscena = 'camino';
  const e = new EscenaCamino(motor);
  motor.escena = e;
  motor.pausa = new Pausa(motor, {});
  await e.entrar();
  correr(motor, e, 1.5);
  pulsar(mandos[0], BOTON.ZR);
  correr(motor, e, 3.3);
  pulsar(mandos[0], BOTON.MAS);
  correr(motor, e, 0.1);
  assert.equal(motor.pausa.abierta, true);
  correr(motor, e, 0.4);
  pulsar(mandos[0], BOTON.ZR);
  correr(motor, e, 0.1);
  assert.equal(motor.pausa.abierta, false);
  e.salir();
});

test('Joy-Con: el recuento avanza con el gatillo y cada uno escribe con su mando (izquierdo y derecho)', async () => {
  const { motor, mandos } = montar(['L', 'R'], [true, true]);
  motor.expedicion.puntajes = {
    mapa: { total: 50 },
    camino: { resultados: [{ puntos: 500 }, { puntos: 400 }] },
    regreso: { resultados: [{ puntos: 900 }, { puntos: 800 }] },
  };
  const e = new EscenaRecuento(motor);
  await e.entrar();
  const guardado = {};
  e.tabla.almacen = { getItem: (k) => guardado[k] ?? null, setItem: (k, v) => { guardado[k] = v; }, removeItem() {} };
  e.tabla.filas = [];
  correr(motor, e, 4.5);
  pulsar(mandos[1], BOTON.ZR);                   // en el conteo, cualquiera avanza
  correr(motor, e, 0.1);
  assert.equal(e.fase, 'nombre');
  // Turno del Jugador 1 (izquierdo): el derecho no escribe.
  pulsar(mandos[1], BOTON.ZR); correr(motor, e, 0.05);
  assert.equal(e.editores[0].texto, '');
  pulsar(mandos[0], BOTON.ZL); correr(motor, e, 0.05);        // A
  pulsar(mandos[0], BOTON.ARRIBA); correr(motor, e, 0.05);    // ✓
  pulsar(mandos[0], BOTON.ZL); correr(motor, e, 0.1);
  assert.equal(e.turno, 1);
  // Turno del Jugador 2 (derecho): el izquierdo no escribe.
  pulsar(mandos[0], BOTON.ZL); correr(motor, e, 0.05);
  assert.equal(e.editores[1].texto, '');
  pulsar(mandos[1], BOTON.ZR); correr(motor, e, 0.05);
  pulsar(mandos[1], BOTON.X); correr(motor, e, 0.05);
  pulsar(mandos[1], BOTON.ZR); correr(motor, e, 0.1);
  assert.equal(e.fase, 'tabla');
  assert.deepEqual(e.nombres.map((n) => n.join('')), ['A', 'A']);
  correr(motor, e, 1.5);
  pulsar(mandos[0], BOTON.ZL);
  correr(motor, e, 0.1);
  assert.equal(motor.saltos.at(-1).nombre, 'cierre');
  e.salir();
});

test('Joy-Con: el gatillo salta un video (de cualquiera de los dos mandos)', async () => {
  const { Cinematicas } = await import('../src/core/cinematica.js');
  for (const i of [0, 1]) {
    const mandos = [new JoyCon(), new JoyCon()];
    mandos.forEach((j) => { j.estado.conectado = true; j.esIzquierdo = false; });
    const video = { pause() {}, removeAttribute() {}, load() {} };
    const capa = { querySelector: () => video, classList: { add() {}, remove() {} }, removeEventListener() {} };
    const cin = new Cinematicas(capa, mandos);
    let saltado = false;
    cin._fin = () => { saltado = true; };
    cin._t = 1;                               // pasada la gracia
    pulsar(mandos[i], BOTON.ZR);
    cin.actualizar(1 / 60);
    assert.equal(saltado, true, 'mando ' + (i + 1));
  }
});

test('un Joy-Con de reserva (no en juego) se vincula con gatillo + hombro y entra en su ranura', async () => {
  const { motor, mandos } = montar(['R', 'R'], [true, false]);
  const activados = [];
  const gestor = new EventTarget();
  gestor.ranuras = ['jcA', null];
  gestor.inventario = [{ id: 'jcA' }, { id: 'jcB' }];
  gestor.activar = async (id, r) => {
    activados.push([id, r]);
    gestor.ranuras[r] = id;
    mandos[r].estado.conectado = true;
    return true;
  };
  gestor.liberarRanura = async () => {};
  gestor.disponible = true;
  let autorizaciones = 0;
  gestor.autorizar = async () => { autorizaciones++; return 'jcC'; };
  motor.gestor = gestor;
  const e = new EscenaJugadores(motor);
  await e.entrar({});
  correr(motor, e, 0.8);
  pulsar(mandos[0], BOTON.B);               // «Dos jugadores»
  correr(motor, e, 0.1);
  pulsar(mandos[0], BOTON.ZR);
  correr(motor, e, 0.6);
  vincular(motor, e, mandos[0]);            // el que ya estaba en juego: Jugador 1
  gestor.dispatchEvent(Object.assign(new Event('registro'), { detail: { entrada: { id: 'jcB', esIzquierdo: true } } }));
  await new Promise((r) => setTimeout(r, 5));
  assert.deepEqual(activados, [['jcB', 1]], 'el de reserva entra como Jugador 2');
  assert.equal(e.vinculos[1].esIzquierdo, true);
  assert.equal(e.fase, 'listos');
  e.salir();
});

test('en la vinculación, clic en «＋ Conectar otro Joy-Con» abre la ventana de Chrome (y no vincula el teclado)', async () => {
  const { motor, mandos } = montar(['R', 'R'], [true, false]);
  const gestor = new EventTarget();
  gestor.ranuras = ['jcA', null];
  gestor.inventario = [{ id: 'jcA' }];
  gestor.disponible = true;
  let autorizaciones = 0;
  gestor.autorizar = async () => { autorizaciones++; return 'jcB'; };
  motor.gestor = gestor;
  const e = new EscenaJugadores(motor);
  await e.entrar({});
  correr(motor, e, 0.8);
  pulsar(mandos[0], BOTON.B);
  correr(motor, e, 0.1);
  pulsar(mandos[0], BOTON.ZR);
  correr(motor, e, 0.6);
  assert.ok(e._rectConectar, 'se dibuja el botón');
  const b = e._rectConectar;
  e._onClic({ clientX: b.x + b.w / 2, clientY: b.y + b.h / 2 });
  correr(motor, e, 0.1);
  assert.equal(autorizaciones, 1, 'abre la ventana de permisos');
  assert.equal(e.vinculos[0], null, 'el clic en el botón no vincula a nadie con el teclado');
  e.salir();
});

// ------------------------------------------------------------ calibrar
const { EscenaCalibrar } = await import('../src/juego/escenas/calibrar.js');

test('Controles → Calibrar mandos: mide los Joy-Con en juego, deja probar la linterna y vuelve con el gatillo', async () => {
  const { motor, mandos } = montar(['L', 'R'], [true, true]);
  const pedidos = [];
  mandos.forEach((j, i) => { j.calibrar = () => { pedidos.push(i); j._calibrando = true; }; });
  const e = new EscenaCalibrar(motor);
  await e.entrar();
  assert.deepEqual(pedidos, [0, 1], 'se calibran los dos mandos en juego');
  assert.equal(e.fase, 'quieto');
  correr(motor, e, 0.5);
  pulsar(mandos[0], BOTON.ZL);                     // midiendo: el gatillo no corta
  correr(motor, e, 0.05);
  assert.deepEqual(motor.saltos, []);
  mandos.forEach((j) => { j._calibrando = false; j.dispatchEvent(new Event('calibrado')); });
  correr(motor, e, 0.1);
  assert.equal(e.fase, 'prueba', 'con los dos calibrados, a probar la linterna');
  correr(motor, e, 0.5);
  pulsar(mandos[1], BOTON.A);                      // A del derecho: calibrar otra vez
  correr(motor, e, 0.05);
  assert.equal(e.fase, 'quieto');
  assert.deepEqual(pedidos, [0, 1, 0, 1]);
  mandos.forEach((j) => { j._calibrando = false; j.dispatchEvent(new Event('calibrado')); });
  correr(motor, e, 0.5);
  pulsar(mandos[0], BOTON.ZL);
  correr(motor, e, 0.05);
  assert.equal(motor.saltos.at(-1).nombre, 'intro');
  e.salir();
});

test('Calibrar: si un mando se mueve, lo dice y se puede reintentar; sin mandos, avisa', async () => {
  const { motor, mandos } = montar(['R', 'R'], [true, false]);
  mandos[0].calibrar = () => { mandos[0]._calibrando = true; };
  const e = new EscenaCalibrar(motor);
  await e.entrar();
  correr(motor, e, 0.5);
  mandos[0]._calibrando = false;
  mandos[0].dispatchEvent(new Event('calibracion-incompleta'));
  correr(motor, e, 0.05);
  assert.equal(e.estado[0], 'fallo');
  pulsar(mandos[0], BOTON.A);                      // otra vez
  correr(motor, e, 0.05);
  assert.equal(e.estado[0], 'midiendo');
  e.salir();

  const sin = montar(['R', 'R'], [false, false]);
  const e2 = new EscenaCalibrar(sin.motor);
  await e2.entrar();
  correr(sin.motor, e2, 0.5);
  e2._onTecla({ key: 'Enter', preventDefault() {}, stopPropagation() {} });
  correr(sin.motor, e2, 0.05);
  assert.equal(sin.motor.saltos.at(-1).nombre, 'intro');
  e2.salir();
});

test('Pausa → Calibrar mandos: calibra sin salir de la etapa', async () => {
  const { motor, mandos } = montar(['R', 'R'], [true, false]);
  let pedidos = 0;
  mandos[0].calibrar = () => { pedidos++; mandos[0]._calibrando = true; };
  motor.nombreEscena = 'camino';
  motor.escena = { actualizar() {}, dibujar() {} };
  const pausa = new Pausa(motor, {});
  pausa.abrir();
  const item = pausa.menu.items.find((it) => typeof it.texto === 'function' && it.texto().startsWith('Calibrar'));
  assert.ok(item, 'la pausa tiene «Calibrar mandos»');
  item.accion();
  assert.equal(pedidos, 1);
  assert.match(item.texto(), /Calibrando/);
  mandos[0]._calibrando = false;
  mandos[0].dispatchEvent(new Event('calibrado'));
  assert.equal(item.texto(), '✓ Mandos calibrados');
  assert.deepEqual(motor.saltos, [], 'no sale de la etapa');
  pausa.cerrar();
});

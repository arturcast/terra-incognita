/**
 * multijugador.test.js — Dos jugadores, dos Joy-Con.
 *
 * Comprueba lo que el modo de dos jugadores tiene que garantizar antes de
 * construir encima ninguna etapa (ver docs/MULTIJUGADOR.md):
 *
 *  - cada ranura tiene su mando, y un mando nunca está en dos ranuras;
 *  - si se desconecta uno, entra el relevo o esa ranura queda vacía, pero el
 *    otro jugador sigue: el stand nunca se bloquea por falta de un mando;
 *  - la linterna de un jugador no se mueve con el mando del otro, y los
 *    gatillos no se cruzan;
 *  - la pantalla partida reparte bien el espacio.
 *
 * Ejecutar:  node --test tests/multijugador.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { JoyCon, BOTON } = await import('../src/core/joycon.js');
const { Puntero, Acciones } = await import('../src/core/input.js');
const { GestorMandos } = await import('../src/core/mandos.js');

// ------------------------------------------------------------- dobles
class DispositivoFalso extends EventTarget {
  constructor(productId) {
    super();
    this.productId = productId;
    this.productName = productId === 0x2006 ? 'Joy-Con (L)' : 'Joy-Con (R)';
    this.opened = false;
    this.escrituras = [];
  }
  async open() { this.opened = true; }
  async close() { this.opened = false; }
  async sendReport(id, datos) { this.escrituras.push({ id, datos: Array.from(datos) }); }
}

/** Un JoyCon real salvo la conexión física, que aquí siempre funciona. */
class JoyConFalso extends JoyCon {
  async cambiarDispositivo(d) {
    this.device = d;
    this.esIzquierdo = d.productId === 0x2006;
    this.estado.conectado = true;
    this.estado.bateria = 8;
    return true;
  }
  async desconectar() { this.device = null; this.estado.conectado = false; }
}

function montar(nMandos = 2) {
  const jugadores = [new JoyConFalso(), new JoyConFalso()];
  const gestor = new GestorMandos(jugadores);
  const dispositivos = [];
  for (let k = 0; k < nMandos; k++) {
    const d = new DispositivoFalso(k % 2 === 0 ? 0x2007 : 0x2006);
    const id = 'jc' + (k + 1);
    gestor._ids.set(d, id);
    gestor.entradas.set(id, {
      id, device: d, nombre: d.productName, esIzquierdo: d.productId === 0x2006,
      estado: 'autorizado', bateria: -1, cargando: false, hz: 0, ultimoReporte: 0,
      _contador: 0, _oyente: null, _ventanaHz: [],
    });
    dispositivos.push(d);
  }
  return { gestor, jugadores, dispositivos };
}

// ======================================================================
// RANURAS
// ======================================================================

test('cada jugador recibe su mando y el del jugador 1 sigue siendo "el" mando', async () => {
  const { gestor, jugadores } = montar(2);
  assert.ok(await gestor.activar('jc1', 0));
  assert.ok(await gestor.activar('jc2', 1));
  assert.deepEqual(gestor.ranuras, ['jc1', 'jc2']);
  assert.equal(gestor.idActivo, 'jc1', 'compatibilidad: idActivo es la ranura 0');
  assert.equal(gestor.jc, jugadores[0]);
  assert.equal(gestor.jugadoresConectados, 2);
  assert.equal(gestor.relevo, null, 'con los dos en juego no queda relevo');
  const inv = Object.fromEntries(gestor.inventario.map((m) => [m.id, m.ranura]));
  assert.deepEqual(inv, { jc1: 0, jc2: 1 });
  gestor.destruir();
});

test('un mando no puede ser dos jugadores: al moverlo, deja libre su ranura', async () => {
  const { gestor } = montar(2);
  await gestor.activar('jc1', 0);
  await gestor.activar('jc2', 1);
  await gestor.activar('jc1', 1);          // el mando del jugador 1 pasa a ser el 2
  assert.deepEqual(gestor.ranuras, [null, 'jc1']);
  assert.equal(gestor.entradas.get('jc2').estado, 'listo', 'el que ocupaba la ranura pasa a reserva');
  assert.equal(gestor.relevo && gestor.relevo.id, 'jc2');
  gestor.destruir();
});

test('si se desconecta el jugador 2 y hay relevo, el relevo entra en su lugar (de cualquier lado)', async () => {
  const { gestor, dispositivos } = montar(3);    // jc1 derecho, jc2 izquierdo, jc3 derecho
  await gestor.activar('jc1', 0);
  await gestor.activar('jc2', 1);
  gestor._alDesconectar(dispositivos[1]);
  await new Promise((r) => setTimeout(r, 20));
  assert.deepEqual(gestor.ranuras, ['jc1', 'jc3'], 'el relevo debía entrar como jugador 2');
  assert.ok(gestor.consumirAvisos().some((a) => a.texto.includes('jugador 2')));
  gestor.destruir();
});

// ======================================================================
// UN JOY-CON POR JUGADOR, DE CUALQUIER LADO
// ======================================================================

test('los dos jugadores pueden tener Joy-Con del mismo lado; un mando nunca es de dos', async () => {
  const { gestor } = montar(3);          // jc1 derecho, jc2 izquierdo, jc3 derecho
  assert.ok(await gestor.activar('jc1', 0));
  assert.ok(await gestor.activar('jc3', 1), 'dos derechos: sí');
  assert.deepEqual(gestor.ranuras, ['jc1', 'jc3']);
  await gestor.activar('jc3', 0);        // el mismo mando no puede quedar en dos ranuras
  assert.deepEqual(gestor.ranuras, ['jc3', null]);
  gestor.destruir();
});

test('gatillo + hombro en un Joy-Con de reserva avisa «registro» (para vincularlo)', async () => {
  const { gestor } = montar(2);
  const e = gestor.entradas.get('jc2');
  await gestor._vigilarBateria(e);
  const registros = [];
  gestor.addEventListener('registro', (ev) => registros.push(ev.detail.entrada.id));
  const reporte = (id, bytes) => {
    const ev = new Event('inputreport');
    ev.reportId = id;
    ev.data = new DataView(Uint8Array.from(bytes).buffer);
    e.device.dispatchEvent(ev);
  };
  reporte(0x3f, [0x00, 0x80]);            // solo el gatillo: no
  assert.deepEqual(registros, []);
  reporte(0x3f, [0x00, 0xc0]);            // gatillo + hombro: sí
  assert.deepEqual(registros, ['jc2']);
  gestor.destruir();
});

test('si se desconecta uno y no hay relevo, el otro sigue jugando', async () => {
  const { gestor, jugadores, dispositivos } = montar(2);
  await gestor.activar('jc1', 0);
  await gestor.activar('jc2', 1);
  gestor._alDesconectar(dispositivos[0]);
  assert.deepEqual(gestor.ranuras, [null, 'jc2']);
  assert.equal(jugadores[0].estado.conectado, false);
  assert.equal(jugadores[1].estado.conectado, true, 'el jugador 2 no debía verse afectado');
  assert.equal(gestor.jugadoresConectados, 1);
  gestor.destruir();
});

test('quitar al jugador 2 deja su mando en reserva, listo para volver', async () => {
  const { gestor, jugadores } = montar(2);
  await gestor.activar('jc1', 0);
  await gestor.activar('jc2', 1);
  await gestor.liberarRanura(1);
  assert.deepEqual(gestor.ranuras, ['jc1', null]);
  assert.equal(jugadores[1].estado.conectado, false);
  assert.equal(gestor.entradas.get('jc2').estado, 'listo');
  assert.equal(gestor.relevo && gestor.relevo.id, 'jc2', 'el mando quitado debe quedar como relevo');
  assert.ok(await gestor.activar('jc2', 1), 'y poder volver a entrar');
  gestor.destruir();
});

test('los avisos de batería dicen de qué jugador es el mando', async () => {
  const { gestor } = montar(2);
  await gestor.activar('jc1', 0);
  await gestor.activar('jc2', 1);
  gestor._forzarNivel(2, 'jc2');
  const avisos = gestor.consumirAvisos().map((a) => a.texto);
  assert.ok(avisos.some((t) => t.includes('jugador 2') && t.includes('crítica')), avisos.join(' | '));
  gestor.destruir();
});

// ======================================================================
// INDEPENDENCIA ENTRE JUGADORES
// ======================================================================

const ACC = 0.000244, GYR = 0.06103;
function reporte({ gz = 0, botones = 0, az = -1 }) {
  const b = new Uint8Array(48);
  b[1] = 8 << 4;
  b[2] = botones & 0xff; b[3] = (botones >> 8) & 0xff; b[4] = (botones >> 16) & 0xff;
  for (const o of [5, 8]) { b[o + 1] = 0x08; b[o + 2] = 0x80; }
  const dv = new DataView(b.buffer);
  for (let i = 0; i < 3; i++) {
    const p = 12 + i * 12;
    dv.setInt16(p + 4, Math.round(az / ACC), true);
    dv.setInt16(p + 10, Math.round(gz / GYR), true);
  }
  return { reportId: 0x30, data: dv };
}

test('la linterna de un jugador no se mueve con el mando del otro', () => {
  const [a, b] = [new JoyCon(), new JoyCon()];
  a.esIzquierdo = false; b.esIzquierdo = true;
  const [pa, pb] = [new Puntero(a), new Puntero(b)];
  const W = 950, H = 1080;
  // Solo el jugador 1 gira a la derecha. El 2 está quieto (y es un L: az=+1).
  for (let k = 0; k < 60; k++) {
    a._onReporte(reporte({ gz: 60 }));
    b._onReporte(reporte({ gz: 0, az: 1 }));
    pa.actualizar(W, H, 24, 1 / 60);
    pb.actualizar(W, H, 24, 1 / 60);
  }
  assert.ok(pa.x > W / 2 + 200, 'la linterna del jugador 1 no se movió');
  assert.ok(Math.abs(pb.x - W / 2) < 2 && Math.abs(pb.y - H / 2) < 2, 'la del jugador 2 se movió sola');
});

test('los gatillos no se cruzan: el ZR del jugador 1 no dispara al jugador 2', () => {
  const [a, b] = [new JoyCon(), new JoyCon()];
  a.esIzquierdo = false; b.esIzquierdo = true;
  const [aa, ab] = [new Acciones(a), new Acciones(b)];
  a._onReporte(reporte({}));
  b._onReporte(reporte({ az: 1 }));
  a._onReporte(reporte({ botones: 1 << BOTON.ZR }));
  assert.equal(aa.confirmar(), true);
  assert.equal(ab.confirmar(), false);
  b._onReporte(reporte({ botones: 1 << BOTON.ZL, az: 1 }));
  assert.equal(ab.confirmar(), true, 'el izquierdo confirma con ZL');
});

// ======================================================================
// PANTALLA PARTIDA
// ======================================================================

test('la pantalla partida reparte el ancho sin solapes ni huecos', async () => {
  // Lo justo de navegador para construir el motor en Node.
  globalThis.window ??= { addEventListener() {}, devicePixelRatio: 1 };
  const lienzo = {
    width: 0, height: 0,
    getContext: () => ({ setTransform() {} }),
    getBoundingClientRect: () => ({ width: 1920, height: 1080 }),
  };
  const { Motor } = await import('../src/core/engine.js');
  const [a, b] = [new JoyCon(), new JoyCon()];
  const motor = new Motor(lienzo, [a, b]);

  assert.equal(motor.jc, a, 'motor.jc sigue siendo el jugador 1');
  assert.deepEqual(motor.ranura(0, 1), { x: 0, y: 0, ancho: 1920, alto: 1080 });

  const r0 = motor.ranura(0, 2), r1 = motor.ranura(1, 2);
  assert.equal(r0.x, 0);
  assert.ok(Math.abs(r1.x + r1.ancho - 1920) < 1e-9, 'la segunda mitad llega al borde');
  assert.ok(r1.x > r0.x + r0.ancho, 'las mitades se solapan');
  assert.ok(Math.abs(r0.ancho - r1.ancho) < 1e-9, 'las mitades no son iguales');

  a.estado.conectado = false; b.estado.conectado = true;
  assert.deepEqual(motor.jugadoresActivos, [1], 'si falta el jugador 1, juega el 2 solo');
});

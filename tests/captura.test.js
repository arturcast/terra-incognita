/**
 * captura.test.js — Reproduce grabaciones del Joy-Con REAL dentro del juego.
 *
 * Las pruebas de entrada.test.js usan un mando simulado. Estas usan lo que de
 * verdad transmitió un mando, grabado con `python tests/captura.py`, y lo
 * pasan por el mismo driver y el mismo Puntero que usa el juego, con el
 * tiempo real de llegada de cada reporte.
 *
 * Responden a lo que ninguna simulación puede: si con ESE mando, en ESA mano
 * y en ESTE equipo, la linterna se queda quieta cuando debe, sigue a la mano
 * en el eje y el sentido correctos, y ningún gatillo se pierde.
 *
 * Ejecutar:  node --test tests/captura.test.js
 * Sin capturas en tests/capturas/, las pruebas se saltan (no fallan).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let reloj = 0;
Object.defineProperty(globalThis, 'performance', {
  value: { now: () => reloj }, configurable: true, writable: true,
});

const { JoyCon } = await import('../src/core/joycon.js');
const { Puntero, Acciones } = await import('../src/core/input.js');

const W = 1920, H = 1080, MARGEN = 30;
const aqui = path.dirname(fileURLToPath(import.meta.url));
const carpeta = path.join(aqui, 'capturas');
const archivos = fs.existsSync(carpeta)
  ? fs.readdirSync(carpeta).filter((f) => f.endsWith('.json')).sort()
  : [];

function hexADataView(hex) {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(hex.substr(i * 2, 2), 16);
  return new DataView(b.buffer);
}

const rango = (pts, k) => Math.max(...pts.map((q) => q[k])) - Math.min(...pts.map((q) => q[k]));

/** Fotogramas cuyo medio segundo previo no pasa de 6 °/s: el mando ya no se mueve. */
const tramoQuieto = (pts) => pts.filter((q, i) => pts.slice(Math.max(0, i - 30), i + 1).every((r) => r.vel < 6));

/** Reproduce una captura con fotogramas a 60 fps intercalados por tiempo real. */
function reproducir(captura) {
  const jc = new JoyCon();
  jc.esIzquierdo = captura.mando === 'L';
  jc.estado.conectado = true;
  const p = new Puntero(jc);
  const acc = new Acciones(jc);
  jc.calibrar();   // como al conectar: la primera fase es "sobre la mesa"

  const reps = captura.reportes.map((r) => ({ t: r.t * 1000, f: r.f, dv: hexADataView(r.r) }));
  const t0 = reps[0].t, tFin = reps[reps.length - 1].t;
  const fases = {};
  const bitGatillo = jc.bitGatillo;
  let faseActual = null, flancosCrudos = 0, previoCrudo = false;

  let i = 0, ultimoF = t0;
  for (let tf = t0 + 8; tf <= tFin; tf += 1000 / 60) {
    while (i < reps.length && reps[i].t <= tf) {
      const r = reps[i++];
      reloj = r.t;
      faseActual = r.f;
      jc._onReporte({ reportId: 0x30, data: r.dv });
      const crudo = (jc.estado.mascara & (1 << bitGatillo)) !== 0;
      if (r.f === 'botones' && crudo && !previoCrudo) flancosCrudos++;
      previoCrudo = crudo;
      const F = (fases[r.f] ||= {
        puntos: [], pulsaciones: 0, inicio: r.t,
        caminoH: 0, caminoV: 0, netoH: 0, netoV: 0,
      });
    }
    reloj = tf;
    p.actualizar(W, H, MARGEN, (tf - ultimoF) / 1000);
    ultimoF = tf;
    if (faseActual) {
      const F = fases[faseActual];
      // Giro ya traducido a los ejes y al sentido del juego, SIN recortar a la
      // pantalla: los rangos en píxeles se saturan en los bordes y engañan.
      const { h: dh, v: dv } = p.ultimoGiro;
      F.caminoH += Math.abs(dh); F.caminoV += Math.abs(dv);
      F.netoH += dh; F.netoV += dv;
      F.puntos.push({ t: (tf - F.inicio) / 1000, x: p.x, y: p.y, vel: p.velocidadAngular,
        netoH: F.netoH, netoV: F.netoV, signo: p.signo });
      if (acc.confirmar()) F.pulsaciones++;
      if (faseActual === 'mesa' && jc.sesgoFiable && F.tCalibrado === undefined) {
        F.tCalibrado = (tf - F.inicio) / 1000;
      }
    }
    jc.finDeFrame();
  }
  return { jc, fases, flancosCrudos };
}

if (!archivos.length) {
  test('capturas del mando real', { skip: 'no hay capturas: ejecuta tests/grabar-mando.cmd' }, () => {});
}

for (const archivo of archivos) {
  const captura = JSON.parse(fs.readFileSync(path.join(carpeta, archivo), 'utf8'));
  const { jc, fases, flancosCrudos } = reproducir(captura);
  const nombre = `${archivo} (Joy-Con ${captura.mando})`;
  // Versión 1: la fase "derecha" decía "gira", y se entendía como torcer la
  // muñeca. Esas fases no sirven para medir el sentido de los ejes.
  const direccionFiable = (captura.version || 1) >= 2;

  test(`${nombre}: se calibra sobre la mesa y la linterna no se mueve sola`, () => {
    const F = fases.mesa;
    assert.ok(F, 'la captura no tiene fase "mesa"');
    assert.ok(F.tCalibrado !== undefined, 'no logró calibrar con el mando sobre la mesa');
    // Solo cuenta lo que pasa con el mando ya soltado: al principio de la fase
    // la persona todavía lo está dejando en la mesa.
    const despues = tramoQuieto(F.puntos).filter((q) => q.t > F.tCalibrado + 0.2);
    const deriva = despues.length ? Math.hypot(rango(despues, 'x'), rango(despues, 'y')) : 0;
    console.log(`    calibró en ${F.tCalibrado.toFixed(2)} s; después se movió ${deriva.toFixed(1)} px; ` +
      `sesgo=(${['x', 'y', 'z'].map((k) => jc.estado.sesgo[k].toFixed(2)).join(', ')}) °/s`);
    assert.ok(deriva < 12);
  });

  test(`${nombre}: sostenido quieto en la mano, la linterna no baila`, () => {
    const F = fases.mano;
    assert.ok(F, 'la captura no tiene fase "mano"');
    // Levantar el mando y acomodarlo lleva unos segundos, y eso no es "quieto".
    // Se mide solo donde la mano ya no gira: fotogramas cuyo medio segundo
    // previo no pasa de 6 °/s.
    const quietos = tramoQuieto(F.puntos);
    const tramo = quietos.length / 60;
    assert.ok(tramo >= 1,
      `solo hubo ${tramo.toFixed(1)} s de mano quieta: repite la grabación sosteniéndolo más quieto`);
    // Una mano real se desplaza despacio, y la linterna DEBE seguirla. Lo que no
    // debe hacer es temblar: se mide lo que se aparta de su propia media móvil.
    // Se evalúa la MEDIA (lo que el ojo percibe), no el máximo, que lo dispara
    // un solo instante. Referencia: la luz mide 105 px de radio; un temblor
    // medio por debajo del 5 % de eso no se percibe.
    let suma2 = 0, maximo = 0;
    quietos.forEach((q, i) => {
      const v = quietos.slice(Math.max(0, i - 15), i + 16);
      const mx = v.reduce((a, b) => a + b.x, 0) / v.length, my = v.reduce((a, b) => a + b.y, 0) / v.length;
      const d = Math.hypot(q.x - mx, q.y - my);
      suma2 += d * d; maximo = Math.max(maximo, d);
    });
    const medio = Math.sqrt(suma2 / quietos.length);
    console.log(`    ${tramo.toFixed(1)} s de mano quieta; temblor de la linterna: medio ${medio.toFixed(1)} px, máximo ${maximo.toFixed(1)} px`);
    assert.ok(medio < 5, 'la linterna tiembla de forma visible');
    assert.ok(maximo < 25, 'hay sacudidas visibles con la mano quieta');
  });

  test(`${nombre}: un barrido horizontal va sobre todo al eje horizontal del juego`, () => {
    const { caminoH: h, caminoV: v } = fases.horizontal;
    console.log(`    giro horizontal ${h.toFixed(0)}°, vertical ${v.toFixed(0)}° (relación ${(h / v).toFixed(1)})`);
    assert.ok(h > 40, 'casi no hubo giro horizontal: ¿ejes equivocados para este mando?');
    assert.ok(h > v * 2, 'el barrido horizontal se fue al eje vertical: ejes equivocados');
  });

  test(`${nombre}: un barrido vertical va sobre todo al eje vertical del juego`, () => {
    const { caminoH: h, caminoV: v } = fases.vertical;
    console.log(`    giro vertical ${v.toFixed(0)}°, horizontal ${h.toFixed(0)}° (relación ${(v / h).toFixed(1)})`);
    assert.ok(v > 40, 'casi no hubo giro vertical: ¿ejes equivocados para este mando?');
    assert.ok(v > h * 2, 'el barrido vertical se fue al eje horizontal: ejes equivocados');
  });

  // Solo las capturas nuevas tienen fases con dirección inequívoca.
  test(`${nombre}: girar a la derecha lleva la linterna a la derecha`,
    { skip: !fases.derecha ? 'captura antigua, sin fase "derecha"'
      : !direccionFiable ? 'versión 1: la instrucción "gira" era ambigua' : false }, () => {
      const F = fases.derecha;
      console.log(`    giro neto horizontal: ${F.netoH.toFixed(0)}° (positivo = derecha)`);
      assert.ok(F.netoH > 8, 'la linterna fue a la izquierda: eje horizontal invertido');
    });

  test(`${nombre}: subir el mando sube la linterna`,
    { skip: fases.arriba ? false : 'captura antigua, sin fase "arriba"' }, () => {
      // "arriba" sí era inequívoca en la versión 1: se evalúa siempre.
      const F = fases.arriba;
      console.log(`    giro neto vertical: ${F.netoV.toFixed(0)}° (negativo = arriba en pantalla)`);
      assert.ok(F.netoV < -6, 'la linterna bajó: eje vertical invertido');
    });

  // Capturas antiguas: el primer barrido de la fase "rapido" era a la derecha.
  test(`${nombre}: el primer barrido rápido, a la derecha, va a la derecha`,
    { skip: fases.rapido ? false : 'sin fase "rapido"' }, () => {
      const pts = fases.rapido.puntos;
      const primero = pts.find((q) => Math.abs(q.netoH) > 10);
      console.log(`    primer desplazamiento claro: ${primero ? primero.netoH.toFixed(0) : '?'}° (positivo = derecha)`);
      assert.ok(primero && primero.netoH > 0, 'el barrido a la derecha fue a la izquierda');
    });

  test(`${nombre}: ningún gatillo se pierde`, () => {
    const F = fases.botones;
    console.log(`    el mando registró ${flancosCrudos} pulsaciones; el juego detectó ${F.pulsaciones}`);
    assert.ok(flancosCrudos >= 3, 'en la grabación casi no se pulsó el gatillo');
    assert.equal(F.pulsaciones, flancosCrudos);
  });

  test(`${nombre}: el mando entrega datos con regularidad`, () => {
    // Se mide DENTRO de cada fase: entre fases la grabación espera a que la
    // persona pulse Enter, y esos ratos de lectura no son cortes del mando.
    let n = 0, dur = 0;
    const huecos = [];
    for (const f of captura.fases) {
      const ts = captura.reportes.filter((r) => r.f === f).map((r) => r.t * 1000);
      if (ts.length < 2) continue;
      n += ts.length - 1;
      dur += (ts[ts.length - 1] - ts[0]) / 1000;
      for (let k = 1; k < ts.length; k++) huecos.push(ts[k] - ts[k - 1]);
    }
    huecos.sort((a, b) => a - b);
    const hz = n / dur;
    const p99 = huecos[Math.floor(huecos.length * 0.99)];
    const rafagas = huecos.filter((h) => h < 4).length / huecos.length * 100;
    console.log(`    ${hz.toFixed(0)} Hz; el 99 % de los huecos < ${p99.toFixed(0)} ms; ${rafagas.toFixed(0)} % llegan en ráfaga`);
    assert.ok(hz > 45, 'el mando entrega muy pocos datos');
    assert.ok(p99 < 120, 'hay cortes largos en la transmisión');
  });
}

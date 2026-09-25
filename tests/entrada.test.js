/**
 * entrada.test.js — Pruebas de estabilidad del mando.
 *
 * Simulan el Joy-Con reporte a reporte: ráfagas de Bluetooth, ruido del
 * sensor, sesgo mal medido, temblor de mano y distintas velocidades de
 * fotograma. Cada prueba nace de un fallo real visto en la primera demo
 * (ver docs/ESTABILIDAD.md) y, cuando tiene sentido, mide también cómo se
 * comportaba la versión anterior para dejar constancia de que el fallo existía.
 *
 * Ejecutar:  node --test tests/entrada.test.js tests/captura.test.js
 * Sin dependencias: node:test y node:assert vienen con Node.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// ------------------------------------------------------------ reloj falso
// El driver usa performance.now(); con un reloj controlado las pruebas son
// deterministas y no dependen de lo rápido que vaya la máquina.
let reloj = 0;
Object.defineProperty(globalThis, 'performance', {
  value: { now: () => reloj }, configurable: true, writable: true,
});

const { JoyCon, BOTON, QUIETUD } = await import('../src/core/joycon.js');
const { Puntero, Acciones, PUNTERO } = await import('../src/core/input.js');
const { GestorMandos } = await import('../src/core/mandos.js');

// ------------------------------------------------------ azar reproducible
function azar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rnd) {
  const u = Math.max(1e-12, rnd()), v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ------------------------------------------------- reportes del Joy-Con
const ACC = 0.000244, GYR = 0.06103;
const i16 = (x) => Math.max(-32768, Math.min(32767, Math.round(x)));

/**
 * Construye un reporte 0x30 tal como lo entrega WebHID (sin el byte de id).
 * `muestras`: 3 lecturas del IMU, cada una { gx, gy, gz } en °/s y
 * { ax, ay, az } en g.
 */
function reporte({ botones = 0, muestras, bateria = 8 }) {
  // Por defecto, gravedad de un Joy-Con DERECHO boca arriba, medida en el
  // mando real: Z = -1 g. El izquierdo marca +1 g (sensor girado 180° sobre X).
  const b = new Uint8Array(48);
  b[1] = (bateria << 4);
  b[2] = botones & 0xff;
  b[3] = (botones >> 8) & 0xff;
  b[4] = (botones >> 16) & 0xff;
  for (const o of [5, 8]) { b[o] = 0x00; b[o + 1] = 0x08; b[o + 2] = 0x80; } // sticks centrados
  const dv = new DataView(b.buffer);
  muestras.forEach((m, i) => {
    const p = 12 + i * 12;
    dv.setInt16(p, i16((m.ax ?? 0) / ACC), true);
    dv.setInt16(p + 2, i16((m.ay ?? 0) / ACC), true);
    dv.setInt16(p + 4, i16((m.az ?? -1) / ACC), true);
    dv.setInt16(p + 6, i16((m.gx ?? 0) / GYR), true);
    dv.setInt16(p + 8, i16((m.gy ?? 0) / GYR), true);
    dv.setInt16(p + 10, i16((m.gz ?? 0) / GYR), true);
  });
  return { reportId: 0x30, data: dv };
}

/**
 * Genera un mando que "está" en un estado físico dado.
 *  sesgo   — sesgo del giroscopio en °/s, lo que marca estando quieto
 *  ruido   — desviación del ruido del sensor en °/s
 *  temblor — desviación del temblor de mano en °/s (0 = sobre la mesa)
 */
function fisica({ sesgo = { x: 0, y: 0, z: 0 }, ruido = 0.25, temblor = 0, semilla = 1, gz = -1 } = {}) {
  const rnd = azar(semilla);
  return (giro = { x: 0, y: 0, z: 0 }, botones = 0) => {
    const muestras = [0, 1, 2].map(() => ({
      gx: giro.x + sesgo.x + gauss(rnd) * ruido + gauss(rnd) * temblor,
      gy: giro.y + sesgo.y + gauss(rnd) * ruido + gauss(rnd) * temblor,
      gz: giro.z + sesgo.z + gauss(rnd) * ruido + gauss(rnd) * temblor,
      ax: gauss(rnd) * 0.004 + gauss(rnd) * temblor * 0.004,
      ay: gauss(rnd) * 0.004,
      az: gz + gauss(rnd) * 0.004,
    }));
    return reporte({ botones, muestras });
  };
}

/**
 * Mezcla, en orden temporal, los reportes del mando y los fotogramas del juego.
 *
 * `rafaga`: cuántos reportes entrega Bluetooth de golpe. En Windows es normal
 * que lleguen de dos en dos cada ~30 ms en vez de uno cada 15 ms.
 */
function simular({ jc, segundos, fps, rafaga = 1, alReporte, alFotograma }) {
  const periodo = 15 * rafaga;
  const eventos = [];
  for (let t = 0; t < segundos * 1000; t += periodo) {
    for (let k = 0; k < rafaga; k++) eventos.push({ t, tipo: 'r', n: eventos.length });
  }
  const dtF = 1000 / fps;
  for (let t = dtF / 2; t < segundos * 1000; t += dtF) eventos.push({ t, tipo: 'f', n: eventos.length });
  eventos.sort((a, b) => a.t - b.t || a.n - b.n);

  const inicio = reloj;
  let ultimoF = inicio;
  let nReporte = 0;
  for (const ev of eventos) {
    reloj = inicio + ev.t;
    if (ev.tipo === 'r') {
      jc._onReporte(alReporte(ev.t / 1000, nReporte++));
    } else {
      const dt = (reloj - ultimoF) / 1000 || dtF / 1000;
      ultimoF = reloj;
      alFotograma(ev.t / 1000, dt);
      jc.finDeFrame();
    }
  }
}

function nuevoMando() {
  const jc = new JoyCon();
  jc.esIzquierdo = false;
  jc.estado.conectado = true;
  return jc;
}

const W = 1920, H = 1080;

// ======================================================================
// 1. PULSACIONES
// ======================================================================

test('ninguna pulsación se pierde, lleguen como lleguen los reportes', () => {
  const casos = [];
  for (const fps of [30, 60, 144]) {
    for (const rafaga of [1, 2, 3]) {
      for (const duracion of [1, 2]) {           // reportes que dura la pulsación
        const jc = nuevoMando();
        const acc = new Acciones(jc);
        const mover = fisica({ semilla: 7 });
        const PULSOS = 60, cada = 18;              // una pulsación cada 18 reportes
        let nuevas = 0, viejas = 0;
        simular({
          jc, segundos: (PULSOS * cada * 15) / 1000 + 0.5, fps, rafaga,
          alReporte: (t, n) => mover(undefined, (n % cada) < duracion && n < PULSOS * cada ? (1 << BOTON.ZR) : 0),
          alFotograma: () => {
            if (acc.confirmar()) nuevas++;
            // lógica anterior: comparar el último reporte con el penúltimo
            const s = jc.estado, m = 1 << BOTON.ZR;
            if ((s.mascara & m) && !(s.mascaraPrevia & m)) viejas++;
          },
        });
        casos.push({ fps, rafaga, duracion, nuevas, viejas, total: PULSOS });
        assert.equal(nuevas, PULSOS,
          `se perdieron pulsaciones a ${fps} fps, ráfaga ${rafaga}, duración ${duracion}`);
      }
    }
  }
  const peor = casos.reduce((p, c) => (c.viejas / c.total < p.viejas / p.total ? c : p));
  console.log(`    antes: en el peor caso se detectaba el ${Math.round(peor.viejas / peor.total * 100)} % ` +
    `(${peor.fps} fps, ráfagas de ${peor.rafaga}, pulsación de ${peor.duracion} reporte${peor.duracion > 1 ? 's' : ''})`);
  console.log('    ahora: 100 % en los 18 escenarios');
});

test('una pulsación sostenida cuenta una sola vez', () => {
  const jc = nuevoMando();
  const acc = new Acciones(jc);
  const mover = fisica();
  let n = 0;
  simular({
    jc, segundos: 2, fps: 60, rafaga: 2,
    alReporte: (t) => mover(undefined, t > 0.3 && t < 1.5 ? (1 << BOTON.ZR) : 0),
    alFotograma: () => { if (acc.confirmar()) n++; },
  });
  assert.equal(n, 1);
});

// ======================================================================
// 2. LINTERNA PEGADA AL BORDE
// ======================================================================

test('al pasarse del borde, la linterna vuelve en cuanto se gira de vuelta', () => {
  const jc = nuevoMando();
  const p = new Puntero(jc);
  const mover = fisica({ ruido: 0 });
  // 3 s girando a la derecha a 60 °/s: 180°, muy por encima de lo que cabe.
  // Luego 0,5 s de vuelta a 20 °/s: 10°.
  simular({
    jc, segundos: 3.5, fps: 60,
    alReporte: (t) => mover({ x: 0, y: 0, z: t < 3 ? 60 : -20 }),
    alFotograma: (t, dt) => {
      p.actualizar(W, H, 30, dt);
      if (Math.abs(t - 3) < 0.009) p._enBorde = p.x;
    },
  });
  const retroceso = p._enBorde - p.x;
  const esperado = 10 * (W / PUNTERO.gradosAncho);
  console.log(`    tras 10° de vuelta se movió ${Math.round(retroceso)} px (esperado ~${Math.round(esperado)} px)`);

  // Cómo se comportaba antes: ángulo absoluto × 17 px/°, recortado a pantalla.
  const anguloFinal = jc.estado.yaw;
  const xVieja = Math.max(30, Math.min(W - 30, W / 2 + anguloFinal * 17));
  console.log(`    antes: la linterna seguía clavada en x=${Math.round(xVieja)}; ` +
    `había que deshacer ~${Math.round(anguloFinal - (W / 2 - 30) / 17)}° de giro antes de que se moviera`);

  assert.ok(retroceso > esperado * 0.7, 'la linterna no volvió desde el borde');
  assert.equal(xVieja, W - 30, 'la lógica anterior también debería quedar clavada (control)');
});

// ======================================================================
// 3. DERIVA: LA LINTERNA SE MUEVE SOLA
// ======================================================================

for (const [nombre, temblor] of [['sobre la mesa', 0], ['en la mano', 0.8]]) {
  test(`un sesgo mal medido se corrige solo (${nombre})`, () => {
    const jc = nuevoMando();
    const p = new Puntero(jc);
    // Sesgo real de 2,5 °/s en Z que nadie calibró (o se calibró mal).
    const mover = fisica({ sesgo: { x: 0.4, y: -0.6, z: 2.5 }, temblor, semilla: 11 });
    let x10 = 0, y10 = 0;
    simular({
      jc, segundos: 20, fps: 60,
      alReporte: () => mover(),
      alFotograma: (t, dt) => {
        p.actualizar(W, H, 30, dt);
        if (Math.abs(t - 15) < 0.009) { x10 = p.x; y10 = p.y; }
      },
    });
    const derivaFinal = Math.hypot(p.x - x10, p.y - y10);   // px en los últimos 5 s
    const sinCorregir = 2.5 * 5 * (W / 55);                   // lo que habría andado
    console.log(`    últimos 5 s: se movió ${derivaFinal.toFixed(1)} px ` +
      `(sin corrección habrían sido ~${Math.round(sinCorregir)} px). Sesgo aprendido z=${jc.estado.sesgo.z.toFixed(2)} °/s`);
    assert.ok(Math.abs(jc.estado.sesgo.z - 2.5) < 0.25, 'no aprendió el sesgo');
    assert.ok(derivaFinal < 25, 'la linterna sigue deslizándose sola');
  });
}

test('el aprendizaje del sesgo no se come un barrido lento y deliberado', () => {
  const jc = nuevoMando();
  const p = new Puntero(jc);
  const mover = fisica({ sesgo: { x: 0, y: 0, z: 0.5 }, semilla: 5 });
  // Flujo real: al conectar, el mando se calibra quieto sobre la mesa.
  jc.calibrar();
  simular({ jc, segundos: 1.5, fps: 60, alReporte: () => mover(), alFotograma: () => {} });
  assert.equal(jc.sesgoFiable, true);
  // Apuntar con cuidado: 8 s girando a 3 °/s (cabe en pantalla sin tocar el borde).
  simular({
    jc, segundos: 8, fps: 60,
    alReporte: () => mover({ x: 0, y: 0, z: 3 }),
    alFotograma: (t, dt) => p.actualizar(W, H, 30, dt),
  });
  const recorrido = p.x - W / 2;
  const esperado = 3 * 8 * (W / PUNTERO.gradosAncho);
  console.log(`    recorrió ${Math.round(recorrido)} px de ~${Math.round(esperado)} esperados; sesgo z=${jc.estado.sesgo.z.toFixed(2)} (real 0,50)`);
  assert.ok(recorrido > esperado * 0.9, 'el movimiento lento quedó absorbido como sesgo');
  assert.ok(Math.abs(jc.estado.sesgo.z - 0.5) < 0.2, 'el sesgo se desvió durante el barrido');
});

test('tras calibrar, la deriva por temperatura se sigue corrigiendo', () => {
  const jc = nuevoMando();
  const p = new Puntero(jc);
  let sesgoZ = 1.0;
  const rnd = azar(13);
  const mover = () => reporte({
    muestras: [0, 1, 2].map(() => ({
      gx: gauss(rnd) * 0.25, gy: gauss(rnd) * 0.25, gz: sesgoZ + gauss(rnd) * 0.25,
      ax: 0, ay: 0, az: -1 + gauss(rnd) * 0.004,
    })),
  });
  jc.calibrar();
  simular({ jc, segundos: 1.5, fps: 60, alReporte: mover, alFotograma: () => {} });
  // El sensor se calienta y el sesgo sube 0,8 °/s.
  sesgoZ = 1.8;
  let x15 = 0;
  simular({
    jc, segundos: 20, fps: 60, alReporte: mover,
    alFotograma: (t, dt) => { p.actualizar(W, H, 30, dt); if (Math.abs(t - 15) < 0.009) x15 = p.x; },
  });
  console.log(`    sesgo aprendido z=${jc.estado.sesgo.z.toFixed(2)} (real 1,80); movimiento en los últimos 5 s: ${Math.abs(p.x - x15).toFixed(1)} px`);
  assert.ok(Math.abs(jc.estado.sesgo.z - 1.8) < 0.15);
  assert.ok(Math.abs(p.x - x15) < 20);
});

// ======================================================================
// 4. CALIBRACIÓN
// ======================================================================

test('la calibración rechaza muestras en movimiento y acepta las quietas', () => {
  const jc = nuevoMando();
  let calibrado = false;
  jc.addEventListener('calibrado', () => { calibrado = true; });
  const mover = fisica({ sesgo: { x: 1.1, y: -0.7, z: 1.5 }, semilla: 3 });
  jc.calibrar();
  // 3 s agitándolo: no debe dar por buena ninguna medida.
  simular({
    jc, segundos: 3, fps: 60,
    alReporte: (t) => mover({ x: 40 * Math.sin(t * 6), y: 0, z: 30 * Math.cos(t * 5) }),
    alFotograma: () => {},
  });
  assert.equal(calibrado, false, 'calibró con el mando en movimiento');
  assert.equal(jc.calibrando, true);
  // Luego quieto: ahora sí.
  simular({ jc, segundos: 2, fps: 60, alReporte: () => mover(), alFotograma: () => {} });
  assert.equal(calibrado, true);
  assert.ok(Math.abs(jc.estado.sesgo.z - 1.5) < 0.1);
  assert.ok(Math.abs(jc.estado.sesgo.x - 1.1) < 0.1);
});

test('si nunca queda quieto, la calibración se rinde sin romper nada', () => {
  const jc = nuevoMando();
  let incompleta = false;
  jc.addEventListener('calibracion-incompleta', () => { incompleta = true; });
  const mover = fisica({ semilla: 9 });
  jc.calibrar();
  simular({
    jc, segundos: 10, fps: 60,
    alReporte: (t) => mover({ x: 25 * Math.sin(t * 4), y: 20 * Math.sin(t * 3), z: 0 }),
    alFotograma: () => {},
  });
  assert.equal(incompleta, true);
  assert.equal(jc.calibrando, false);
});

test('calibrar o recentrar el mando no hace saltar la linterna', () => {
  const jc = nuevoMando();
  const p = new Puntero(jc);
  const mover = fisica({ sesgo: { x: 0, y: 0, z: 1.8 }, semilla: 4 });
  // Llevar la linterna a un lado.
  simular({
    jc, segundos: 1, fps: 60,
    alReporte: () => mover({ x: 0, y: 0, z: 25 }),
    alFotograma: (t, dt) => p.actualizar(W, H, 30, dt),
  });
  const antes = p.x;
  jc.calibrar();
  jc.recentrar();   // antes, esto ponía los ángulos a cero y la linterna saltaba
  simular({
    jc, segundos: 2, fps: 60,
    alReporte: () => mover(),
    alFotograma: (t, dt) => p.actualizar(W, H, 30, dt),
  });
  console.log(`    antes x=${Math.round(antes)}, después x=${Math.round(p.x)}`);
  assert.ok(Math.abs(p.x - antes) < 20, 'la linterna saltó al calibrar o recentrar');
});

// ======================================================================
// 5. SENSACIÓN: SENSIBILIDAD, TEMBLOR Y FOTOGRAMAS
// ======================================================================

test('cruzar media pantalla cuesta unos 27° de muñeca, no 56°', () => {
  const jc = nuevoMando();
  const p = new Puntero(jc);
  const mover = fisica({ ruido: 0 });
  // 27,5° a 15 °/s: velocidad normal, ganancia 1.
  simular({
    jc, segundos: 27.5 / 15, fps: 60,
    alReporte: () => mover({ x: 0, y: 0, z: 15 }),
    alFotograma: (t, dt) => p.actualizar(W, H, 0, dt),
  });
  simular({ jc, segundos: 0.5, fps: 60, alReporte: () => mover(), alFotograma: (t, dt) => p.actualizar(W, H, 0, dt) });
  const recorrido = p.x - W / 2;
  console.log(`    27,5° movieron la linterna ${Math.round(recorrido)} px de ${W / 2} (antes: ${Math.round(27.5 * 17)} px)`);
  assert.ok(Math.abs(recorrido - W / 2) < W * 0.06);
});

test('el temblor de la mano no hace bailar la linterna', () => {
  const jc = nuevoMando();
  const p = new Puntero(jc);
  const mover = fisica({ temblor: 1.0, semilla: 21 });
  let maxDesvio = 0;
  simular({
    jc, segundos: 6, fps: 60,
    alReporte: () => mover(),
    alFotograma: (t, dt) => {
      p.actualizar(W, H, 30, dt);
      if (t > 1) maxDesvio = Math.max(maxDesvio, Math.hypot(p.x - W / 2, p.y - H / 2));
    },
  });
  console.log(`    sosteniéndolo quieto, la linterna se apartó como mucho ${maxDesvio.toFixed(1)} px`);
  assert.ok(maxDesvio < 30);
});

test('el mismo gesto lleva al mismo sitio a 30, 60 o 144 fps', () => {
  const finales = [];
  for (const fps of [30, 60, 144]) {
    const jc = nuevoMando();
    const p = new Puntero(jc);
    const mover = fisica({ ruido: 0 });
    simular({
      jc, segundos: 1.2, fps,
      alReporte: (t) => mover({ x: 0, y: t < 0.4 ? -50 : 0, z: t < 0.4 ? 80 : 0 }),
      alFotograma: (t, dt) => p.actualizar(W, H, 30, dt),
    });
    finales.push({ fps, x: p.x, y: p.y });
  }
  const dx = Math.max(...finales.map((f) => f.x)) - Math.min(...finales.map((f) => f.x));
  const dy = Math.max(...finales.map((f) => f.y)) - Math.min(...finales.map((f) => f.y));
  console.log('    ' + finales.map((f) => `${f.fps} fps → (${Math.round(f.x)}, ${Math.round(f.y)})`).join('   '));
  assert.ok(dx < 12 && dy < 12, 'la posición final depende de los fotogramas');
});

// ======================================================================
// 6. ESCRITURAS AL MANDO
// ======================================================================

class DispositivoFalso extends EventTarget {
  constructor(retardo = 4) {
    super();
    this.opened = true; this.productId = 0x2007; this.retardo = retardo;
    this.escrituras = []; this.enCurso = 0; this.maxEnCurso = 0;
  }
  async open() { this.opened = true; }
  async close() { this.opened = false; }
  async sendReport(id, datos) {
    this.enCurso++;
    this.maxEnCurso = Math.max(this.maxEnCurso, this.enCurso);
    await new Promise((r) => setTimeout(r, this.retardo));
    this.escrituras.push({ id, datos: Array.from(datos) });
    this.enCurso--;
  }
}

test('las escrituras nunca se solapan y la vibración siempre termina apagada', async () => {
  const jc = nuevoMando();
  const dev = new DispositivoFalso(4);
  jc.device = dev;
  for (let i = 0; i < 12; i++) jc.pulso(300 + i * 10, 0.6, 30);
  jc._subcomando(0x30, [0x02]);
  jc._subcomando(0x48, [0x01]);
  await new Promise((r) => setTimeout(r, 400));
  const vib = dev.escrituras.filter((e) => e.id === 0x10);
  const ultima = vib[vib.length - 1].datos.slice(1, 5);
  console.log(`    ${dev.escrituras.length} escrituras, máximo simultáneas: ${dev.maxEnCurso}; ` +
    `${12 - vib.filter((e) => e.datos[2] !== 0x01).length} arranques de vibración descartados por atasco`);
  assert.equal(dev.maxEnCurso, 1, 'hubo escrituras solapadas');
  assert.deepEqual(ultima, [0x00, 0x01, 0x40, 0x40], 'el mando quedó vibrando');
});

// ======================================================================
// 7. MANDO DE RESERVA
// ======================================================================

test('el mando de reserva queda en modo simple y sin IMU, no transmitiendo a 60 Hz', async () => {
  const jc = nuevoMando();
  const gestor = new GestorMandos(jc);
  const dev = new DispositivoFalso(1);
  const e = {
    id: 'jc1', device: dev, nombre: 'Joy-Con (L)', esIzquierdo: true, estado: 'autorizado',
    bateria: -1, cargando: false, hz: 0, ultimoReporte: 0, _contador: 0, _oyente: null, _ventanaHz: [],
  };
  gestor.entradas.set('jc1', e);
  await gestor._vigilarBateria(e);
  const subs = dev.escrituras.map((w) => [w.datos[9], w.datos[10]]);
  console.log('    subcomandos enviados: ' + subs.map(([s, a]) => '0x' + s.toString(16) + (a !== undefined ? '/0x' + a.toString(16) : '')).join(', '));
  assert.ok(subs.some(([s, a]) => s === 0x03 && a === 0x3f), 'no se puso en modo simple');
  assert.ok(subs.some(([s, a]) => s === 0x40 && a === 0x00), 'no se apagó el IMU');
  assert.ok(!subs.some(([s, a]) => s === 0x03 && a === 0x30), 'se puso a transmitir a 60 Hz');

  // La batería llega en la respuesta 0x21 al subcomando 0x50.
  const b = new Uint8Array(48); b[1] = 6 << 4;
  const ev = new Event('inputreport'); ev.reportId = 0x21; ev.data = new DataView(b.buffer);
  dev.dispatchEvent(ev);
  assert.equal(e.bateria, 6);

  // Un mando con batería aún desconocida sirve de relevo.
  const e2 = { ...e, id: 'jc2', bateria: -1, estado: 'listo', device: new DispositivoFalso(1) };
  gestor.entradas.set('jc2', e2);
  gestor.idActivo = 'jc1';
  assert.equal(gestor.relevo && gestor.relevo.id, 'jc2');
  gestor.destruir();
});

// ======================================================================
// 8. SENTIDO DE LOS EJES SEGÚN LA GRAVEDAD
// ======================================================================
// El Joy-Con izquierdo lleva el sensor girado 180° sobre X: un mismo gesto
// físico da Y y Z con el signo cambiado, y la gravedad sale en +Z en vez de
// -Z. Medido con los dos mandos reales (ver docs/ESTABILIDAD.md).

/** Un gesto físico, tal como lo ve el sensor de cada mando. */
function gesto({ lado = 'R', bocaAbajo = false, derecha = 0, arriba = 0 }) {
  const giro = lado === 'R' ? 1 : -1;                // Y y Z invertidos en el L
  const vuelta = bocaAbajo ? -1 : 1;                  // boca abajo también invierte Y y Z
  return {
    giro: { x: 0, y: arriba * giro * vuelta, z: derecha * giro * vuelta },
    gz: -1 * giro * vuelta,
  };
}

for (const caso of [
  { lado: 'R', bocaAbajo: false, nombre: 'derecho' },
  { lado: 'L', bocaAbajo: false, nombre: 'izquierdo' },
  { lado: 'R', bocaAbajo: true, nombre: 'derecho boca abajo' },
  { lado: 'L', bocaAbajo: true, nombre: 'izquierdo boca abajo' },
]) {
  test(`con el Joy-Con ${caso.nombre}, derecha es derecha y arriba es arriba`, () => {
    for (const dir of ['derecha', 'arriba']) {
      const jc = nuevoMando();
      jc.esIzquierdo = caso.lado === 'L';
      const p = new Puntero(jc);
      const g = gesto({ ...caso, [dir]: 20 });
      const mover = fisica({ ruido: 0, gz: g.gz });
      simular({ jc, segundos: 0.3, fps: 60, alReporte: () => mover(), alFotograma: (t, dt) => p.actualizar(W, H, 30, dt) });
      const x0 = p.x, y0 = p.y;
      simular({ jc, segundos: 1, fps: 60, alReporte: () => mover(g.giro), alFotograma: (t, dt) => p.actualizar(W, H, 30, dt) });
      if (dir === 'derecha') assert.ok(p.x - x0 > 200, `${caso.nombre}: la linterna no fue a la derecha (dx=${Math.round(p.x - x0)})`);
      else assert.ok(y0 - p.y > 200, `${caso.nombre}: la linterna no subió (dy=${Math.round(y0 - p.y)})`);
    }
  });
}

test('sostener el mando de canto no cambia el sentido ni hace saltar la linterna', () => {
  const jc = nuevoMando();
  const p = new Puntero(jc);
  const plano = fisica({ ruido: 0, gz: -1 });
  simular({ jc, segundos: 0.5, fps: 60, alReporte: () => plano(), alFotograma: (t, dt) => p.actualizar(W, H, 30, dt) });
  const signo = p.signo, x0 = p.x;
  // De canto: la gravedad cae casi toda en X. No hay información para decidir.
  const deCanto = () => reporte({ muestras: [0, 1, 2].map(() => ({ ax: 0.97, ay: 0, az: -0.2 })) });
  simular({ jc, segundos: 1, fps: 60, alReporte: deCanto, alFotograma: (t, dt) => p.actualizar(W, H, 30, dt) });
  assert.equal(p.signo, signo, 'cambió de sentido sin información clara');
  assert.ok(Math.abs(p.x - x0) < 5, 'la linterna saltó');
});

test('los umbrales de quietud son coherentes entre sí', () => {
  assert.ok(QUIETUD.desviacionMax < QUIETUD.magnitudMax);
  assert.ok(PUNTERO.temblor < PUNTERO.velLenta && PUNTERO.velLenta < PUNTERO.velRapida);
});

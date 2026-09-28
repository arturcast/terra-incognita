/**
 * musica.test.js — Cada etapa suena con su canción y el resto con la principal.
 *
 * Web Audio no existe en Node: se simula lo justo (ganancias, fuentes y
 * decodificación) para ver qué canción queda sonando tras cada cambio.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

function contextoFalso() {
  const param = () => ({
    value: 0,
    setValueAtTime(v) { this.value = v; },
    linearRampToValueAtTime(v) { this.value = v; },
    cancelScheduledValues() {},
  });
  const nodo = () => ({ gain: param(), connect() {} });
  return class {
    constructor() {
      this.currentTime = 0;
      this.state = 'running';
      this.sampleRate = 8000;
      this.destination = {};
      this.fuentes = [];
    }
    resume() { return Promise.resolve(); }
    createGain() { return nodo(); }
    createConvolver() { return { connect() {} }; }
    createBuffer(canales, n) { return { getChannelData: () => new Float32Array(n) }; }
    createBufferSource() {
      const f = { buffer: null, detenida: false, start() {}, stop() { this.detenida = true; }, connect() {} };
      this.fuentes.push(f);
      return f;
    }
    // El «audio» decodificado lleva el nombre del archivo para reconocerlo.
    decodeAudioData(datos) { return Promise.resolve({ duration: 60, archivo: datos.archivo }); }
  };
}

async function montar(faltan = []) {
  globalThis.window = { AudioContext: contextoFalso() };
  globalThis.fetch = async (url) => {
    const archivo = url.split('/').pop();
    if (faltan.includes(archivo)) return { ok: false, status: 404 };
    return { ok: true, arrayBuffer: async () => ({ archivo }) };
  };
  const { Audio } = await import('../src/core/audio.js');
  const audio = new Audio();
  await audio.iniciar();
  // La carga va por detrás: se deja correr hasta que termine.
  for (let i = 0; i < 50; i++) await new Promise((r) => setImmediate(r));
  audio.musica('intro');
  return audio;
}

const suena = (audio) => audio._sonando && audio._sonando.fuente.buffer.archivo;

test('cada etapa tiene su canción y las demás pantallas la principal', async () => {
  const audio = await montar();
  assert.equal(suena(audio), 'tema.mp3', 'portada: el tema principal');

  audio.elegirTema('mapa');
  assert.equal(suena(audio), 'mapa.mp3', 'El Mapa: Egyptian Mood');
  audio.elegirTema('camino');
  assert.equal(suena(audio), 'camino.mp3', 'El Camino: Cabal Attack');
  audio.elegirTema('regreso');
  assert.equal(suena(audio), 'regreso.mp3', 'El Tesoro: tema final de Tomb Raider 2');
  audio.elegirTema(undefined);
  assert.equal(suena(audio), 'tema.mp3', 'recuento, ruta y cierre: el principal');

  const detenidas = audio.ctx.fuentes.filter((f) => f.detenida).length;
  assert.equal(detenidas, audio.ctx.fuentes.length - 1, 'solo queda sonando una canción');
});

test('pedir la misma canción no la reinicia', async () => {
  const audio = await montar();
  audio.elegirTema('mapa');
  const fuente = audio._sonando.fuente;
  audio.elegirTema('mapa');
  audio.musica('decision');
  assert.equal(audio._sonando.fuente, fuente);
});

test('si falta la canción de una etapa, sigue la principal', async () => {
  const audio = await montar(['regreso.mp3']);
  audio.elegirTema('regreso');
  assert.equal(suena(audio), 'tema.mp3');
});

test('elegir la canción antes de que arranque la música no hace sonar nada', async () => {
  globalThis.window = { AudioContext: contextoFalso() };
  const { Audio } = await import('../src/core/audio.js');
  const audio = new Audio();
  audio.elegirTema('camino');           // sin iniciar(): no hay audio todavía
  assert.equal(audio._sonando, null);
});

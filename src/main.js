/**
 * main.js — Punto de entrada. Enlaza el mando, arma el motor y arranca.
 *
 * El enlace del Joy-Con exige un gesto del usuario (así funciona WebHID), y
 * Web Audio también. Por eso la capa de enlace es HTML y no una escena del
 * lienzo: el clic de ese botón es lo que desbloquea las dos cosas.
 *
 * Todo lo relativo a mandos pasa por `GestorMandos`, incluida la conexión
 * inicial: así el inventario, la batería y el cambio en caliente comparten un
 * solo camino. Ver docs/MODULO-MANDOS.md.
 */

import { JoyCon } from './core/joycon.js';
import { Motor } from './core/engine.js';
import { Audio } from './core/audio.js';
import { GestorMandos, ETIQUETA_NIVEL, COLOR_NIVEL } from './core/mandos.js';
import { PanelMandos } from './ui/panel-mandos.js';
import { EscenaIntro } from './juego/escenas/intro.js';
import { EscenaMapa } from './juego/escenas/mapa.js';
import { EscenaCierre } from './juego/escenas/cierre.js';
import { EscenaPrueba2J } from './juego/escenas/prueba2j.js';
import { EscenaCamino } from './juego/escenas/camino.js';
import { EscenaRuta } from './juego/escenas/ruta.js';
import { EscenaRegreso } from './juego/escenas/regreso.js';

const lienzo = document.getElementById('lienzo');
const capaEnlace = document.getElementById('enlace');
const aviso = document.getElementById('aviso');
const chipEstado = document.getElementById('estado');

// Un JoyCon por jugador. Son las RANURAS: el gestor les cambia el mando por
// debajo y nunca se reemplazan. El del jugador 1 es "el" mando de siempre.
const jc = new JoyCon();
const jc2 = new JoyCon();
const audio = new Audio();
const motor = new Motor(lienzo, [jc, jc2]);
const gestor = new GestorMandos([jc, jc2]);
motor.audio = audio;
// Las escenas de dos jugadores escuchan al gestor para que el Jugador 2 se una
// pulsando un botón de su mando, sin pasar por el panel.
motor.gestor = gestor;

motor
  .registrar('intro', new EscenaIntro(motor))
  .registrar('mapa', new EscenaMapa(motor))
  .registrar('cierre', new EscenaCierre(motor))
  .registrar('camino', new EscenaCamino(motor))
  .registrar('ruta', new EscenaRuta(motor))
  .registrar('regreso', new EscenaRegreso(motor))
  .registrar('prueba2j', new EscenaPrueba2J(motor));

const panel = new PanelMandos(gestor, jc, motor);

// --------------------------------------------------------------- arranque
let arrancado = false;

async function arrancar() {
  if (arrancado) return;
  arrancado = true;
  await audio.iniciar();          // el clic que nos trajo aquí es el gesto válido
  capaEnlace.classList.add('oculto');
  document.body.classList.add('jugando');
  motor.iniciar();
  motor.ir('intro');
}

document.getElementById('btnEnlazar').addEventListener('click', async () => {
  aviso.textContent = '';
  if (!gestor.disponible) {
    aviso.textContent = 'Este navegador no expone WebHID. Abre la página en Chrome o Edge.';
    return;
  }
  try {
    // Si ya hay alguno autorizado de una sesión anterior, no molestamos con el
    // selector: se entra directo con el que tenga más batería.
    await gestor.refrescar();
    const previo = gestor.mejorDisponible();
    let id = previo ? previo.id : null;
    if (!id) id = await gestor.autorizar();
    if (!id) { aviso.textContent = 'No elegiste ningún mando.'; return; }

    const ok = await gestor.activar(id);
    if (!ok) {
      aviso.textContent = 'El mando no respondió. Pulsa un botón para despertarlo y reintenta, ' +
        'o cierra Steam o BetterJoy si los tienes abiertos.';
      return;
    }
    // No se vuelve a calibrar aquí: activar() ya lo hizo, y repetirlo justo
    // cuando la persona coge el mando medía el movimiento de la mano como sesgo.
    await arrancar();
    avisarSiFaltaRelevo();
  } catch (e) {
    aviso.textContent = 'No se pudo abrir el Joy-Con: ' + e.message;
  }
});

document.getElementById('btnRaton').addEventListener('click', arrancar);

/**
 * El cambio en caliente solo puede saltar a un mando **ya autorizado**. Si solo
 * hay uno, más vale enterarse ahora que cuando se descargue con gente
 * esperando.
 */
function avisarSiFaltaRelevo() {
  if (gestor.inventario.length >= 2) return;
  const banda = document.getElementById('bandaAviso');
  banda.textContent = 'Solo hay un mando autorizado. Pulsa F9 y autoriza el de relevo antes de empezar.';
  banda.className = 'banda aviso';
  setTimeout(() => { banda.className = 'banda oculto'; }, 11000);
}

// Deja el inventario listo antes de que nadie toque nada.
gestor.refrescar().then(() => {
  if (gestor.inventario.length) {
    document.getElementById('btnEnlazar').textContent = 'Entrar con el Joy-Con conectado';
  }
});

// --------------------------------------------------------------- teclado
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();

  if (e.key === 'F9') { e.preventDefault(); panel.alternar(); return; }
  if (e.key === 'Escape' && panel.abierto) { panel.alternar(false); return; }

  if (k === 'f') {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  }
  if (k === 'c' && jc.estado.conectado) jc.calibrar();
  // R recentra la linterna de la escena actual, no solo los ángulos del mando.
  if (k === 'r' && motor.escena && motor.escena.recentrarPuntero) motor.escena.recentrarPuntero();
  if (k === 'm') audio.alternarSilencio();
  // P: sala de prueba de dos jugadores, para el operador.
  if (k === 'p' && arrancado) motor.ir('prueba2j');
  // 1 y 2: saltar a una etapa (para el operador, p. ej. si llega un grupo de dos).
  if (k === '1' && arrancado) motor.ir('mapa');
  if (k === '2' && arrancado) motor.ir('camino');
  if (k === '3' && arrancado) motor.ir('regreso');
  // 0: la pantalla del recorrido, para mostrarla sin jugar una etapa entera.
  if (k === '0' && arrancado) motor.ir('ruta');
  if (e.key === 'Escape' && motor.escena) motor.ir('intro');
});

// ----------------------------------------- chip de estado para el operador
/**
 * Nivel de batería en palabras, no en porcentaje.
 *
 * El Joy-Con solo reporta cinco estados discretos (8/6/4/2/0). Interpolar un
 * porcentaje a partir de eso es inventarse precisión: un "50 %" sugiere que
 * queda la mitad del tiempo, cuando solo se sabe que está en el escalón
 * intermedio. Ver docs/PROTOCOLO-JOYCON.md.
 */
function nivelBateria(n) {
  if (n < 0) return { texto: 'sin lectura', color: '#5a6068' };
  const e = n >= 7 ? 8 : n >= 5 ? 6 : n >= 3 ? 4 : n >= 1 ? 2 : 0;
  return { texto: ETIQUETA_NIVEL[e], color: COLOR_NIVEL[e] };
}

let escenaPrevia = null;

setInterval(() => {
  // Al salir de una partida se sueltan los avisos que estaban esperando.
  if (motor.nombreEscena !== escenaPrevia) {
    escenaPrevia = motor.nombreEscena;
    panel.alCambiarEscena();
  }

  const partes = motor.jugadores.map((j, i) => {
    if (!j.estado.conectado) return null;
    const b = nivelBateria(j.estado.bateria);
    return 'J' + (i + 1) + ' ' + (j.esIzquierdo ? 'L' : 'R') +
      ' <span style="color:' + b.color + '">' + b.texto + (j.estado.cargando ? ' ⚡' : '') + '</span>' +
      ' <b>' + j.estado.hz + '</b> Hz' + (j.calibrando ? ' <b>calibrando…</b>' : '');
  }).filter(Boolean);
  if (!partes.length) { chipEstado.classList.add('oculto'); return; }
  chipEstado.classList.remove('oculto');
  const r = gestor.relevo;
  chipEstado.innerHTML = partes.join(' · ') +
    ' · <b>' + Math.round(motor.fps) + '</b> fps' +
    (r ? ' · relevo listo' : (gestor.jugadoresConectados < 2 ? ' · <span style="color:#e8b04b">sin relevo</span>' : '')) +
    ' · <span>' + (audio.silenciado ? '🔇' : '🔊') + '</span>' +
    ' · <span class="pm-tenue">F9</span>';
}, 400);

// Para depurar y para las pruebas descritas en docs/MODULO-MANDOS.md.
window.TI = { jc, jc2, motor, audio, mandos: gestor, panel };

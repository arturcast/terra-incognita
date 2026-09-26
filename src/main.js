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
import { Cinematicas } from './core/cinematica.js';
import { Pausa } from './ui/pausa.js';
import { cargarTexturasMenu } from './core/render.js';

// Texturas de los menús: se cargan ya, sin esperar. Mientras llegan (o si
// fallan), los menús se dibujan por código.
cargarTexturasMenu();
import { EscenaIntro } from './juego/escenas/intro.js';
import { EscenaMapa } from './juego/escenas/mapa.js';
import { EscenaCierre } from './juego/escenas/cierre.js';
import { EscenaPrueba2J } from './juego/escenas/prueba2j.js';
import { EscenaCamino } from './juego/escenas/camino.js';
import { EscenaRuta } from './juego/escenas/ruta.js';
import { EscenaRegreso } from './juego/escenas/regreso.js';
import { EscenaRecuento } from './juego/escenas/recuento.js';
import { EscenaJugadores } from './juego/escenas/jugadores.js';
import { EscenaCalibrar } from './juego/escenas/calibrar.js';

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
// Videos de etapa (assets/cinematicas/). Si no hay archivo, se salta solo.
motor.cinematicas = new Cinematicas(document.getElementById('cinematica'), [jc, jc2]);

motor
  .registrar('intro', new EscenaIntro(motor))
  .registrar('jugadores', new EscenaJugadores(motor))
  .registrar('calibrar', new EscenaCalibrar(motor))
  .registrar('mapa', new EscenaMapa(motor))
  .registrar('cierre', new EscenaCierre(motor))
  .registrar('camino', new EscenaCamino(motor))
  .registrar('ruta', new EscenaRuta(motor))
  .registrar('regreso', new EscenaRegreso(motor))
  .registrar('recuento', new EscenaRecuento(motor))
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

/**
 * Pantalla completa al entrar. El navegador solo la concede dentro de un clic,
 * así que se pide lo primero, antes de cualquier espera (conectar el mando
 * tarda y el permiso del clic caduca). La tecla F la sigue alternando.
 */
function pantallaCompleta() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
  document.documentElement.requestFullscreen()
    .then(bloquearEsc)
    .catch(() => {});
}

/**
 * En pantalla completa, Chrome usa Esc para salir de ella y el juego no se
 * entera. Con el bloqueo de teclado (API de Chrome para juegos), Esc llega al
 * juego y abre la pausa; para salir de pantalla completa hay que MANTENER Esc
 * (Chrome lo avisa arriba) o usar la opción del menú de pausa.
 */
function bloquearEsc() {
  if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(['Escape']).catch(() => {});
}

let salidaAdrede = false;
function salirDePantallaCompleta() {
  if (!document.fullscreenElement) return;
  salidaAdrede = true;
  document.exitFullscreen().catch(() => {});
}

// Si se sale de pantalla completa en plena partida sin pedirlo (manteniendo
// Esc), se pausa: quien lo hizo seguramente quería parar.
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && arrancado && !salidaAdrede) pausa.abrir();
  if (!document.fullscreenElement) salidaAdrede = false;
});

const pausa = new Pausa(motor, {
  pantallaCompleta,
  salirDePantallaCompleta,
  estaEnPantallaCompleta: () => !!document.fullscreenElement,
});
motor.pausa = pausa;
// El panel de mandos sale de pantalla completa antes de abrir la ventana de permisos.
motor.salirDePantallaCompleta = salirDePantallaCompleta;

/**
 * Conectar los Joy-Con, uno por uno.
 *
 * La ventana de permisos de Chrome deja elegir UN mando cada vez (así es
 * WebHID, no se puede cambiar) y solo sale si se pide en el mismo instante
 * del clic: cualquier espera antes (revisar mandos, pasar a pantalla
 * completa) la cancela en silencio. Por eso:
 *   - «＋ Conectar un Joy-Con» abre la ventana, ya, y al volver NO entra al
 *     juego: se queda aquí mostrando la lista, para conectar otro;
 *   - «Empezar» entra cuando ya están todos.
 * Chrome recuerda cada permiso en este equipo: las veces siguientes los
 * mandos aparecen solos en la lista y basta con «Empezar».
 */
const listaMandos = document.getElementById('listaMandos');
const btnEnlazar = document.getElementById('btnEnlazar');
const btnEmpezar = document.getElementById('btnEmpezar');

function pintarMandos() {
  if (arrancado) return;
  const inv = gestor.inventario;
  if (!inv.length) {
    listaMandos.innerHTML = '<div class="nota">Ningún Joy-Con conectado todavía. Pulsa «Conectar un Joy-Con» ' +
      'una vez por cada mando.</div>';
  } else {
    listaMandos.innerHTML = inv.map((m) => {
      const mal = m.estado === 'perdido';
      return '<span class="ficha' + (mal ? ' mal' : '') + '">' + (mal ? '✗ ' : '✓ ') + m.nombre +
        (mal ? ' · no responde' : '') + '</span>';
    }).join('') + '<div class="nota">¿Juegan más? Conecta otro. Chrome los recuerda: la próxima vez ya aparecen aquí.</div>';
  }
  btnEnlazar.textContent = inv.length ? '＋ Conectar otro Joy-Con' : '＋ Conectar un Joy-Con';
  btnEnlazar.classList.toggle('principal', !inv.length);
  btnEmpezar.classList.toggle('oculto', !inv.length);
}
gestor.addEventListener('inventario', pintarMandos);

btnEnlazar.addEventListener('click', async () => {
  aviso.textContent = '';
  if (!gestor.disponible) {
    aviso.textContent = 'Este navegador no expone WebHID. Abre la página en Chrome o Edge.';
    return;
  }
  try {
    const id = await gestor.autorizar();        // la ventana de Chrome, ya, dentro del clic
    if (!id) { aviso.textContent = 'No elegiste ningún mando.'; return; }
    await gestor.refrescar();
    pintarMandos();
    const m = gestor.inventario.find((x) => x.id === id);
    if (m && m.estado === 'perdido') {
      aviso.textContent = m.nombre + ' no respondió. Pulsa un botón del mando para despertarlo y conéctalo otra vez. ' +
        'Si sigue igual, cierra Steam o BetterJoy.';
    }
  } catch (e) {
    aviso.textContent = 'No se pudo abrir el Joy-Con: ' + e.message;
  }
});

btnEmpezar.addEventListener('click', async () => {
  pantallaCompleta();                           // dentro del clic: aquí sí se puede
  aviso.textContent = '';
  try {
    // El mejor mando entra como Jugador 1, para manejar los menús; quién es
    // quién de verdad se decide después, en «Vincula los mandos».
    const mejor = gestor.mejorDisponible();
    if (mejor && !(await gestor.activar(mejor.id, 0))) {
      aviso.textContent = mejor.nombre + ' no respondió. Pulsa un botón del mando y vuelve a pulsar «Empezar».';
      return;
    }
    await arrancar();
    avisarSiFaltaRelevo();
  } catch (e) {
    aviso.textContent = 'No se pudo abrir el Joy-Con: ' + e.message;
  }
});

document.getElementById('btnRaton').addEventListener('click', () => { pantallaCompleta(); arrancar(); });

/**
 * El cambio en caliente solo puede saltar a un mando **ya autorizado**. Si solo
 * hay uno, más vale enterarse ahora que cuando se descargue con gente
 * esperando.
 */
function avisarSiFaltaRelevo() {
  if (gestor.inventario.length >= 2) return;
  const banda = document.getElementById('bandaAviso');
  banda.textContent = 'Solo hay un mando autorizado. Pulsa J y autoriza el de relevo antes de empezar.';
  banda.className = 'banda aviso';
  setTimeout(() => { banda.className = 'banda oculto'; }, 11000);
}

// Deja el inventario listo antes de que nadie toque nada: los mandos ya
// autorizados en sesiones anteriores aparecen solos en la lista.
pintarMandos();
gestor.refrescar().then(pintarMandos);

// --------------------------------------------------------------- teclado
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();

  // Panel de mandos: tecla J (de Joy-Con). F9 también sirve, pero en los
  // portátiles las teclas F suelen ser volumen o brillo y no llegan al juego.
  if (e.key === 'F9' || (k === 'j' && !e.ctrlKey && !e.altKey && !e.metaKey)) {
    e.preventDefault(); panel.alternar(); return;
  }
  if (e.key === 'Escape' && panel.abierto) { panel.alternar(false); return; }

  if (k === 'f') {
    if (document.fullscreenElement) salirDePantallaCompleta();
    else pantallaCompleta();
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
  // Esc pausa (no saca del juego). Con la pausa abierta, el propio menú lo
  // atrapa antes y la cierra. Volver al inicio es una opción de la pausa.
  if (e.key === 'Escape' && arrancado) pausa.abrir();
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
    ' · <span class="pm-tenue">J: mandos</span>';
}, 400);

// Para depurar y para las pruebas descritas en docs/MODULO-MANDOS.md.
window.TI = { jc, jc2, motor, audio, mandos: gestor, panel };

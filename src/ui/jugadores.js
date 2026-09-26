/**
 * jugadores.js — Quién juega en las etapas de uno o dos jugadores (El Camino y
 * El Regreso), y el aviso de abajo en sus instrucciones.
 *
 * Cada jugador puede ser un Joy-Con o el teclado:
 *   Jugador 1: su Joy-Con, o WASD (+ Espacio), o el ratón.
 *   Jugador 2: su Joy-Con, o las flechas.
 *
 * Cuántos juegan se elige al empezar (escenas/jugadores.js) y queda en
 * `motor.expedicion.jugadores`: vale para El Camino y El Regreso, sin volver a
 * preguntar. Solo si se entra a una etapa sin haber elegido (las teclas 2 y 3
 * del operador), el Jugador 2 se une en las instrucciones: ↑ en el teclado o
 * cualquier botón de su Joy-Con. Y lo que pase ahí también se recuerda.
 */

/** Cuántos juegan, si se eligió al empezar (1 o 2); 0 si no se eligió. */
export function eleccion(motor) {
  const n = motor.expedicion && motor.expedicion.jugadores;
  return n === 1 || n === 2 ? n : 0;
}

/** El nombre que puso el jugador de la ranura `i`, o «JUGADOR n». */
export function nombreDe(motor, i) {
  const n = motor.expedicion && motor.expedicion.nombres && motor.expedicion.nombres[i];
  return n || 'JUGADOR ' + (i + 1);
}

/** «¡Gana ANA!» si hay nombre; si no, «Gana el Jugador 2». */
export function textoGana(motor, i) {
  const n = motor.expedicion && motor.expedicion.nombres && motor.expedicion.nombres[i];
  return n ? '¡Gana ' + n + '!' : 'Gana el Jugador ' + (i + 1);
}

import { MENU, cajaMenu, textoMenu, tituloMenu } from '../core/render.js';

/**
 * Las ranuras que corren. El Jugador 1 siempre (con mando, teclado o ratón);
 * el 2, si tiene mando o se unió por teclado. Caso raro que se respeta: si solo
 * hay mando en la ranura 2 y nadie tocó el teclado, juega ese mando solo.
 */
export function participantesDe(motor, teclado2Unido, teclado1Usado) {
  const [j1, j2] = motor.jugadores;
  const n = eleccion(motor);
  if (n === 2) return [0, 1];
  if (n === 1) return !j1.estado.conectado && j2 && j2.estado.conectado && !teclado1Usado ? [1] : [0];
  const con2 = !!(j2 && j2.estado.conectado) || teclado2Unido;
  if (!j1.estado.conectado && j2 && j2.estado.conectado && !teclado2Unido && !teclado1Usado) return [1];
  return con2 ? [0, 1] : [0];
}

/** 'izquierdo' / 'derecho' del Joy-Con de un jugador, o '' si no tiene. */
export function ladoDe(motor, i) {
  const j = motor.jugadores[i];
  return j && j.estado.conectado ? (j.esIzquierdo ? 'izquierdo' : 'derecho') : '';
}

/**
 * Pone como Jugador 2 el mando de reserva cuyo botón se pulsó (cuando se entra
 * a una etapa sin pasar por la vinculación). Devuelve '' si entró, el porqué
 * si no, o null si no aplica (ya hay Jugador 2).
 */
export async function unirJugador2(motor, entrada) {
  const g = motor.gestor;
  if (!g || g.ranuras[1]) return null;
  return (await g.activar(entrada.id, 1)) ? '' : 'Ese mando no respondió. Pulsa otra vez.';
}

/** El aviso de abajo en las instrucciones: quién está listo y cómo se une el segundo. */
export function dibujarUnion(c, W, H, motor, teclado2Unido, aviso2, avisoLado = null) {
  // Se eligió jugar solo: no se ofrece un segundo jugador.
  if (eleccion(motor) === 1) return;
  const g = motor.gestor;
  const j2 = motor.jugadores[1];
  const porMando = !!(j2 && j2.estado.conectado);
  const listo = porMando || teclado2Unido;
  const texto = porMando
    ? 'Jugador 2 listo · Joy-Con ' + (j2.esIzquierdo ? 'izquierdo' : 'derecho')
    : teclado2Unido
      ? 'Jugador 2 listo · teclado: flechas ← → y ↑'
      : '¿Juegan dos? Jugador 2: pulsa ↑ en el teclado' +
        (g && g.relevo ? ' o cualquier botón de otro Joy-Con' : '');
  c.font = '19px ' + MENU.letra;
  const w = c.measureText(texto).width + 44;
  const x = (W - w) / 2, y = H - 66;
  cajaMenu(c, x, y, w, 44, { relleno: listo ? 'rgba(20,50,80,0.85)' : 'rgba(8,5,3,0.85)' });
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  textoMenu(c, texto, W / 2, y + 22, 19, listo ? '#9fd0ff' : MENU.beige);
  if (aviso2) tituloMenu(c, '¡El Jugador 2 se unió!', W / 2, y - 34, 32);
  else if (avisoLado && avisoLado.t > 0) {
    // El mando no respondió al intentar unirse.
    c.font = 'bold 20px ' + MENU.letra;
    const w2 = c.measureText(avisoLado.texto).width + 40;
    cajaMenu(c, (W - w2) / 2, y - 58, w2, 42, { relleno: 'rgba(90,20,10,0.9)' });
    textoMenu(c, avisoLado.texto, W / 2, y - 37, 20, '#ffd2c2');
  }
}

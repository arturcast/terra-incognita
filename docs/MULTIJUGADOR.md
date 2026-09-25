# Multijugador — dos Joy-Con compitiendo

**Estado:** infraestructura implementada y probada (2026-09-22). **Las dos
etapas finales ya son de dos jugadores:** El Camino a pantalla partida y El
Regreso en un mismo cielo compartido.

## Lo que ya existe

| Pieza | Dónde |
|---|---|
| Un `JoyCon` por jugador (ranuras) | `src/main.js` crea `jc` y `jc2` |
| `motor.jugadores`, `motor.jugadoresActivos` | `src/core/engine.js` |
| Pantalla partida: `motor.ranura(i, n)`, `motor.enRanura(i, n, fn)` | `src/core/engine.js` |
| `gestor.ranuras`, `activar(id, ranura)`, cambio en caliente por jugador | `src/core/mandos.js` |
| Asignar Jugador 1 / Jugador 2 | Panel F9: tarjetas **JUGADORES** arriba del todo |
| Sala de prueba de dos jugadores (y plantilla) | `src/juego/escenas/prueba2j.js`, tecla **P** |
| Pruebas | `tests/multijugador.test.js` |

### Medido con los dos Joy-Con reales

| | Un mando | Los dos a la vez |
|---|---|---|
| Joy-Con R | 67,6 Hz | 60,5 Hz |
| Joy-Con L | — | 66,8 Hz |
| Peor hueco | 136 ms | 60 ms |

El Bluetooth del equipo aguanta los dos con el IMU encendido. No hace falta el
plan B de quitarle el giroscopio al segundo jugador.

### Cómo se escribe una etapa de dos jugadores

Copiar la estructura de `prueba2j.js`:

1. En el constructor, un `Puntero` y unas `Acciones` **por ranura**
   (`motor.jugadores.map(...)`), creados una sola vez.
2. En cada fotograma, `motor.jugadoresActivos` dice quién está; se reparte la
   pantalla con `motor.ranura(k, n)`.
3. Cada `Puntero` se actualiza con el ancho y alto de **su** mitad.
4. Se dibuja cada jugador con `motor.enRanura(k, n, (ctx, rect) => ...)`, en
   coordenadas locales, como si tuviera la pantalla entera.
5. Si entra o sale un jugador, recentrar: las mitades cambian de tamaño.

El jugador 1 es siempre `motor.jc`: las escenas de un jugador no cambian.

### Cómo se une el Jugador 2 sin tocar el teclado

Mientras un mando está de reserva, el gestor lo vigila en modo simple (0x3F)
para leer la batería. Si en ese modo alguien pulsa un botón, el gestor emite
`'botonReserva'` con el id del mando. `camino.js` lo escucha durante las
instrucciones y lo activa como Jugador 2. El panel F9 sigue siendo el plan B.

El ejemplo completo es `src/juego/escenas/camino.js`: los dos corren **la
misma semilla** (mismo camino), cada uno con su `Carrera`; si el Jugador 2 se
desconecta a mitad de carrera, su mitad se congela y la etapa sigue
(`tests/humo.test.js` lo comprueba).

---

*Lo que sigue es el diseño original, del plan de seis etapas. Se conserva
como referencia; el reparto vigente es el de la tabla siguiente.*

| Etapa vigente | Modo | Controles |
|---|---|---|
| 1 · El Mapa | Uno | Giroscopio (linterna) + ZR |
| 2 · El Camino | **Uno o dos, competitivo** | Apuntar a un carril + ZR analiza |
| 3 · El Regreso | **Uno o dos, competitivo** | ZR bate alas · mismo cielo, no pantalla partida |

**Cuándo hacerlo:** *antes* de construir las etapas 2 a 6, no después.

---

## Por qué el orden importa

Convertir un minijuego de un jugador en uno de dos no es añadir un mando: es
duplicar el estado, el marcador, la cámara y la condición de fin. Si se
construyen cuatro etapas pensadas para uno y luego se intenta meterles un
segundo jugador, hay que reescribirlas.

Hacer el cambio ahora cuesta un día. Hacerlo después de la etapa 6 cuesta una
semana y deja el código lleno de parches.

---

## Qué hay que cambiar

La buena noticia: la abstracción de entrada ya está preparada. `Puntero`,
`Acciones` y `Sacudida` reciben el Joy-Con como parámetro en el constructor, no
lo sacan de una variable global. Eso ya es por jugador.

Lo que asume un solo mando son dos sitios:

### 1. `Motor` — de `jc` a `jugadores[]`

```js
// hoy
motor.jc            // un JoyCon

// propuesta
motor.jugadores     // [JoyCon, JoyCon] — siempre array, aunque haya uno
motor.jc            // se mantiene como alias de jugadores[0]
```

El alias evita tocar la Etapa 1 y todo lo que ya funciona. Las etapas nuevas
leen `motor.jugadores` y se adaptan a cuántos haya.

### 2. `GestorMandos` — de un activo a ranuras

```js
// hoy
gestor.idActivo                 // un id
await gestor.activar(id)

// propuesta
gestor.ranuras                  // [idJugador1, idJugador2]
await gestor.activar(id, 0)     // ranura 0 = jugador 1
await gestor.cambiarARelevo(1)  // cambio en caliente de la ranura 2
```

Cada ranura mantiene su propio cambio en caliente y su propia vigilancia de
batería. El panel del operador muestra a qué ranura está asignado cada mando.

### 3. Las escenas declaran cuántos jugadores admiten

```js
export class EscenaCamino extends Escena {
  static jugadores = 'uno-o-dos';   // 'uno' | 'dos' | 'uno-o-dos'
}
```

Con dos mandos conectados, las que admitan dos arrancan en modo competencia;
las demás usan el mando de la ranura 0. Sin segundo mando, todo funciona como
ahora. **Nunca se bloquea la experiencia por falta de un segundo mando**: el
stand tiene que seguir funcionando si uno se descarga.

---

## Lo que hay que probar en hardware

Dos Joy-Con con el IMU encendido son dos flujos de 60 Hz sobre el mismo
adaptador Bluetooth. En las pruebas con uno solo se midieron 65-67 Hz
sostenidos, pero **con dos a la vez no se ha medido**. Es lo primero que hay
que comprobar, antes de diseñar nada encima:

```js
// con los dos en juego, mirar que ninguno baje de ~55 Hz
setInterval(() => console.log(TI.motor.jugadores.map(j => j.estado.hz)), 1000);
```

Si la frecuencia cae, la salida es bajar el segundo mando a modo sin IMU y
usar solo botones para el jugador 2 en las etapas que lo permitan.

---

## Qué etapa se juega de a dos

No todas ganan con la competencia. Las de reflexión pierden si hay alguien
apurando al lado.

| Etapa | Modo | Por qué |
|---|---|---|
| 1 · El Mapa | **Uno** | Es la etapa de criterio y reflexión. Con alguien compitiendo al lado, el visitante deja de pensar y empieza a correr. Pierde justo lo que queremos enseñar |
| 2 · El Equipaje | Uno o dos, **cooperativo** | Una sola mula, dos personas decidiendo qué cargar. La discusión *es* la mecánica |
| 3 · El Camino | **Dos, competitivo** | Pantalla partida. Quien traiga la mejor muestra, no el que más recoja. Es la etapa más vistosa para el público de atrás |
| 4 · La Grieta | **Dos, competitivo** | La más divertida y la que genera corrillo. Cortar lo que no encaja, con penalización por falsos positivos |
| 5 · La Fogata | Uno | Sostener el equilibrio mientras argumentas no mejora con alguien compitiendo |
| 6 · El Regreso | **Dos, competitivo** | Vuelo lado a lado. El que aguante más obstáculos |

Con la 3, la 4 y la 6 en modo competencia ya hay suficiente para que el stand
tenga momentos de ruido y público, que es lo que hace que la gente se acerque.

---

## Controles: movimiento y botones

Hasta ahora todo se juega con giroscopio. Para las etapas nuevas conviene
mezclar, porque el giro solo cansa el brazo en sesiones largas y porque un
botón da una respuesta más precisa para acciones instantáneas.

| Etapa | Movimiento | Botón |
|---|---|---|
| 3 · El Camino | Girar el mando cambia de senda | Sacudir o **ZR** recoge |
| 4 · La Grieta | El corte se traza con el movimiento real | — |
| 6 · El Regreso | — | **ZR** para batir alas, estilo *Flappy Bird* |

La etapa 6 es el caso más claro: *Flappy Bird* con un botón es una mecánica que
todo el mundo entiende en dos segundos, funciona con el Joy-Con en horizontal y
no cansa. Y encaja con el mensaje: siempre hay un obstáculo más, y el
seguimiento es insistencia, no puntería.

---

## Pantalla partida

Para las competitivas, dos mitades verticales con un marcador común arriba.
El `Motor` tendría que ofrecer un helper para acotar el dibujo:

```js
motor.enRanura(0, () => escena.dibujarJugador(0));   // recorta y traslada
```

Así cada minijuego se escribe una vez, para un jugador, y el motor lo pinta dos
veces. Es la diferencia entre escribir cuatro minijuegos y escribir ocho.

---

## Orden recomendado

1. **Medir dos mandos a la vez.** Media hora. Si la frecuencia no aguanta,
   todo lo demás cambia.
2. **Refactor de `Motor` y `GestorMandos` a ranuras.** Un día. La Etapa 1 no se
   toca gracias al alias.
3. **Helper de pantalla partida.** Medio día.
4. **Etapa 3 (El Camino)**, ya nativa de dos jugadores. Es la que más aporta al
   mensaje del área: analítica y muestreo.
5. Etapas 4 y 6.
6. Etapas 2 y 5, de un jugador.

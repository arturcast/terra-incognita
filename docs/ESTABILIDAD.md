# Estabilidad del mando

Qué fallaba después de la primera demo, por qué, cómo se arregló y cómo se
comprueba que sigue arreglado.

---

## Los síntomas

Tras la demo con la Dirección, en el juego:

- «A veces **se pierde** y no funciona bien.»
- «Es muy **difícil mover la linterna**.»
- «**Se bloquea**.»

Y la pista decisiva: **en `herramientas/joycon-lab/` el mismo mando funcionaba
perfecto.** El hardware estaba bien; el problema era cómo el juego usaba los
datos.

---

## Las ocho causas

Siete se encontraron comparando el juego con el laboratorio línea a línea; la
octava —la más grave— solo apareció grabando los dos mandos reales. Cada una
tiene una prueba que la reproduce en `tests/`.

### 0. El Joy-Con izquierdo iba al revés → «muy difícil mover la linterna»

El izquierdo lleva el sensor montado **girado 180° sobre su eje largo**
respecto al derecho. Sobre la mesa, en la misma postura, el derecho marca
Z = −0,98 g y el izquierdo Z = +1,00 g. Con un signo fijo para los ejes, con el
izquierdo la linterna iba **al revés en horizontal y en vertical**. Y el juego
entra con el mando que tenga más batería, así que podía tocar cualquiera.

**Arreglo:** el sentido de los ejes lo decide la gravedad (`Puntero._actualizarSigno`):
si "arriba" cae hacia −Z, signo +1; hacia +Z, −1. Con histéresis, para no
cambiar de signo si se sostiene de canto. Funciona igual con los dos mandos y
con cualquiera de ellos boca abajo.

**Medido con los mandos reales:** «hacia la derecha» da +14° con el derecho y
+18° con el izquierdo; «hacia arriba» sube con los dos.

### 1. Pulsaciones perdidas y fantasma → «se bloquea», «no funciona bien»

El laboratorio evalúa el gatillo **en cada reporte del mando**. El juego lo
evaluaba **una vez por fotograma**, comparando el último reporte con el
penúltimo. El mando manda ~67 reportes por segundo y el juego pinta ~60
fotogramas: nunca van al compás. Eso fallaba en los dos sentidos:

- si llegaban **dos** reportes entre dos fotogramas, la pulsación se perdía;
- si no llegaba **ninguno**, la misma pulsación se contaba dos veces.

**Medido con 20 pulsaciones reales** reproducidas en el juego:

| Fotogramas | Lógica anterior | Ahora |
|---|---|---|
| 60 fps | 23 detectadas: **3 fantasma** | 20 |
| 45 fps | 17: se pierden 3 | 20 |
| 30 fps | 15: se pierden 5 | 20 |

Una pulsación fantasma en la fase de decidir envía un equipo y lo retira en el
mismo instante; en las instrucciones, se salta dos pantallas.

**Arreglo:** el driver acumula los flancos reporte a reporte y el motor los
olvida al terminar cada fotograma (`JoyCon.finDeFrame()`).

### 2. Linterna pegada al borde → «difícil de mover», «se pierde»

El punto se recortaba a la pantalla, pero el ángulo seguía sumando. Si girabas
de más, para volver había que deshacer todo el giro sobrante antes de que la
linterna se moviera. **Medido:** tras un barrido largo había que deshacer
**unos 115°** de muñeca.

**Arreglo:** el `Puntero` trabaja con diferencias de ángulo, como un ratón. Al
llegar al borde se detiene y en cuanto giras de vuelta responde.

### 3. Sensibilidad demasiado baja → «difícil de mover»

Cruzar la pantalla exigía unos **113°** de giro, más de lo que da una muñeca.

**Arreglo:** la sensibilidad se define en grados para cruzar la pantalla
(`PUNTERO.gradosAncho = 55`), con aceleración suave para los barridos rápidos.
Media pantalla son ahora 27,5°.

### 4. Calibrar hacía saltar la linterna

Al terminar de calibrar, el driver ponía los ángulos a cero. El `Puntero`
guardaba un desplazamiento calculado con los ángulos viejos, así que la
linterna saltaba un segundo después de conectar.

**Arreglo:** calibrar solo cambia el sesgo. Cuando algo reinicia los ángulos de
verdad, el driver sube `estado.generacion` y el `Puntero` lo ignora.

### 5. Sesgo mal medido → «se mueve sola», «se pierde»

La calibración aceptaba muestras aunque el mando se estuviera moviendo, y
`main.js` la repetía justo cuando la persona cogía el mando. Un sesgo de 2,5 °/s
mal medido hace que la linterna se deslice unos **436 px cada 5 segundos** sin
que nadie la toque, hasta acabar pegada al borde (causa 2).

**Arreglo:**
- La calibración solo acepta muestras quietas; si detecta movimiento, vuelve a
  empezar, y si nunca lo consigue se rinde sin romper nada.
- El sesgo se sigue corrigiendo solo cada vez que el mando está quieto. Con un
  sesgo ya fiable, solo se aceptan **retoques pequeños** (hasta 1,5 °/s, lo que
  deriva un sensor por temperatura).

Ese tope no es un detalle. Sin él, un barrido **lento y constante** —apuntar con
cuidado— se tomaba por sesgo y se «corregía»: la linterna dejaba de responder
justo cuando más precisión hacía falta. Un giro horizontal no cambia la
gravedad, así que el acelerómetro no puede distinguirlo de un sesgo. Lo atrapó
una prueba antes de que llegara al stand.

### 6. Dos mandos transmitiendo a la vez → «se pierde»

Para leer la batería del mando de reserva, el gestor lo ponía a transmitir el
reporte completo a 60 Hz. Con los dos Joy-Con autorizados eran **dos flujos a
60 Hz compitiendo por el mismo Bluetooth**. El laboratorio abre uno solo.

**Arreglo:** el mando de reserva va en modo simple (`0x3F`, solo transmite al
pulsar un botón), con el IMU apagado, y se le pregunta la batería cada 20 s con
el subcomando `0x50`.

### 7. Escrituras solapadas

Cada vibración son dos envíos al mando, y varios descubrimientos seguidos los
disparaban en ráfaga sin esperar a que terminara el anterior. En Windows,
escribir mientras otra escritura sigue en curso puede fallar o atascar el
enlace.

**Arreglo:** todas las escrituras van en cola. Si la cola se atasca, se
descartan los *arranques* de vibración, nunca los apagados: el mando no se
queda vibrando.

---

## Además

- **El suavizado va por tiempo, no por fotograma.** El mismo gesto lleva al
  mismo sitio a 30, 60 o 144 fps. Antes, en un equipo lento, la linterna iba
  más pesada.
- **Filtro de temblor gradual.** Por debajo de 2 °/s el movimiento se atenúa en
  proporción: la mano sosteniendo quieto no hace bailar la linterna (2 px medido),
  pero un movimiento deliberado lento sí pasa.
- **Menos trabajo por fotograma.** La tierra, las curvas de nivel y la isla se
  dibujan una vez en una capa aparte (antes, ~1.400 segmentos por fotograma), y
  el grano de papel ya no usa un modo de fusión a pantalla completa.
- **Medidor de fps** en el chip del operador. Si en el stand algo va mal, lo
  primero es saber si el equipo aguanta.
- La tecla **R** recentra la linterna de la escena, no solo los ángulos.

---

## Cómo se comprueba

### Pruebas simuladas — `tests/entrada.test.js`

Simulan el mando reporte a reporte: ráfagas de Bluetooth, ruido del sensor,
sesgo mal medido, temblor de mano, distintas velocidades de fotograma. Donde
tiene sentido, miden también cómo se comportaba la versión anterior, para que
quede constancia de que el fallo existía.

```bash
node --test tests/entrada.test.js
```

21 pruebas, incluidos el izquierdo y el derecho boca arriba y boca abajo.
Deben pasar todas antes de tocar el stand.

### Pruebas con el mando real — `tests/captura.test.js`

La simulación usa un modelo de mando. Lo que solo el hardware responde —cuánto
tiembla una mano de verdad, si los ejes cuadran con cómo se sostiene, hacia
dónde va cada eje en cada mando— se prueba grabando el mando:

1. Cerrar el juego en Chrome y despertar los dos Joy-Con.
2. Doble clic en `tests/grabar-mando.cmd`. Siete fases por mando; **cada una
   espera a que se pulse Enter**, así da tiempo a leer y colocarse.
3. `node --test tests/captura.test.js`

Tres lecciones de construir esta herramienta, por si alguien la toca:

- **La palabra importa.** La primera versión decía «gira hacia la derecha» y se
  entendió como torcer la muñeca, que no mueve una linterna. Ahora dice «mueve
  la punta del mando» y trae un dibujo. Las capturas de esa versión (sin campo
  `version`) no sirven para medir el sentido y la prueba las salta.
- **hidapi acumula reportes** mientras nadie lee y los entrega de golpe, todos
  con la misma hora. Hay que vaciarlos antes de cada fase (`vaciar()`): sin eso
  llegaban 40 reportes viejos al empezar, y parecían ráfagas de Bluetooth.
- **`read(n, 0)` espera sin límite** en esa librería. Para vaciar hay que usar
  el modo no bloqueante; con timeout 0 la grabación se colgaba en la fase 1.

Las capturas de `tests/capturas/` se quedan: son la batería de regresión con
mandos reales. Con el equipo del evento conviene grabar de nuevo.

La prueba reproduce la grabación, con sus tiempos reales, dentro del mismo
driver y el mismo `Puntero` del juego, y comprueba que:

- se calibra sobre la mesa y la linterna no se mueve sola;
- sostenido quieto, la linterna no baila;
- un barrido horizontal mueve la linterna en horizontal, y uno vertical en
  vertical — **con ese mando**: el Joy-Con izquierdo y el derecho llevan el
  sensor montado distinto;
- ningún gatillo se pierde;
- el mando entrega datos con regularidad.

Conviene repetir la grabación con el equipo y los mandos del evento.

---

## Parámetros

Todos en unidades físicas. Si se tocan, hay que volver a pasar las dos pruebas.

| Dónde | Parámetro | Valor | Qué controla |
|---|---|---|---|
| `input.js` `PUNTERO` | `gradosAncho` | 55 | Grados para cruzar la pantalla |
| | `velLenta` / `velRapida` / `gananciaMax` | 20 / 140 °/s / 1,7 | Aceleración de barridos |
| | `temblor` | 2 °/s | Por debajo, se atenúa |
| | `suaveLento` / `suaveRapido` | 0,10 / 0,018 s | Suavizado según velocidad |
| `joycon.js` `QUIETUD` | `magnitudMax` | 6 °/s | Techo para considerarlo quieto |
| | `desviacionMax` | 1,2 °/s | Temblor admitido como «quieto» |
| | `correccionMax` | 1,5 °/s | Tope de corrección con sesgo fiable |
| | `constanteAprendizaje` | 2 s | Velocidad de corrección del sesgo |

## Reglas para no volver a romperlo

0. **Nunca** un signo fijo para los ejes según el lado del mando. El sentido lo
   decide la gravedad. El izquierdo y el derecho llevan el sensor montado distinto.
1. **Nunca** detectar pulsaciones comparando `mascara` con `mascaraPrevia` en un
   fotograma. Usar `reciénPulsado()` / `Acciones`.
2. `Puntero.actualizar()` **una sola vez por fotograma**, pasándole `dt`.
3. Nada reinicia ángulos sin subir `estado.generacion` (lo hace `recentrar()`).
4. Ningún mando en reserva transmite a 60 Hz.
5. Toda escritura al mando pasa por la cola (`_escribir` / `_subcomandoSuelto`).

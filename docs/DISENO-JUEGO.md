# Diseño de juego — tres etapas

Recorrido completo: **10 a 12 minutos**. La Etapa 1 es de un jugador; las dos
últimas, de uno o dos.

| # | Etapa | Juego | Jugadores | Lo que hace el área | Estado |
|---|---|---|---|---|---|
| 1 | **El Mapa** | linterna con el giroscopio | 1 | Plan Anual | **Jugable** |
| 2 | **El Camino** | estilo *Subway Surfers*, en 3D | 1 o 2 | Ejecución con analítica de datos: hallazgos | **Jugable** |
| 3 | **El Regreso** | estilo *Flappy Bird* | 1 o 2 | Informe, recomendaciones, planes de acción, seguimiento | **Jugable** |

Hasta septiembre de 2026 el plan era de seis etapas (Mapa, Equipaje, Camino,
Grieta, Fogata, Regreso). Se condensó en tres por decisión del área: menos
etapas, cada una más jugable, y las dos últimas de dos jugadores para que el
stand tenga competencia y público.

---

## Lo que el área quiere que se entienda

Dicho por el propio equipo, y es la vara con la que se mide cada etapa:

> Extraemos la información cruda de los procesos, directo de la base de datos.
> La analizamos, por lo general con Power BI. Comparamos con las cifras del
> proceso y encontramos hallazgos, errores, problemas, para construir nuestras
> conclusiones y generar informes. No nos dedicamos solamente a probar sus
> controles ni a seguir sus manuales: entendemos el proceso de principio a fin
> y así encontramos lo escondido o invisible. El resultado son hallazgos y
> recomendaciones, que se monitorean con planes de acción.

| Idea del área | Dónde se vive |
|---|---|
| Ver toda la compañía y priorizar | Etapa 1: la linterna y los cinco equipos |
| Información cruda, directo de la fuente | Etapa 2: los ◆ datos crudos |
| Analizar (Power BI) y cruzar cifras | Etapa 2: la lente, y el tablero final |
| No solo probar controles ni seguir el manual | Etapa 2: los carteles «✓ Todo en orden» suman poco |
| Recorrer el proceso de principio a fin | Etapa 2: las cinco estaciones del gas |
| Encontrar lo escondido o invisible | Etapa 2: lo que solo aparece al analizar |
| Hallazgos y recomendaciones → informe | Etapa 3: llevar lo encontrado de vuelta |
| Monitoreo con planes de acción | Etapa 3: volver y verificar que cambió |

---

## Principios comunes

**Todo se juega con el Joy-Con.** Movimiento para apuntar o moverse; el
gatillo (ZR o ZL) para la acción principal. En la Etapa 3 el botón es el
protagonista: batir alas es pulsar.

**Toda etapa da retorno háptico.** Descubrir, acertar, chocar y confirmar
vibran distinto.

**Toda etapa se abre con instrucciones** (`Briefing`, `src/core/briefing.js`):
qué va a hacer, cómo se juega, cuánto tiempo tiene. **Y se cierra con una
revelación**: qué acaba de hacer, en la vida real. Durante el juego no se usa
vocabulario del oficio; en la revelación, sí. Ver [`NARRATIVA.md`](NARRATIVA.md).

**Ninguna etapa se pierde.** Hay resultados mejores y peores y un cierre que
explica la diferencia. Nadie queda humillado delante de sus compañeros.

**Música y sonido sintetizados** con Web Audio (`src/core/audio.js`), sin
archivos: la red del evento puede fallar, y la música generativa no se repite
igual en seis horas de stand.

**Los marcadores son grandes**, legibles a tres metros.

**Dos jugadores, mismo recorrido.** En las etapas de competencia los dos
juegan exactamente el mismo camino (misma semilla): gana quien juega mejor, no
quien tuvo suerte.

**El Jugador 2 se une pulsando cualquier botón** del otro Joy-Con durante las
instrucciones. No hace falta el panel ni el teclado.

---

## ETAPA 1 · El Mapa  *(jugable, 1 jugador)*

**Equivale a:** Plan Anual de Auditoría.
**Capacidades:** mirar todo · criterio · priorizar.

Un territorio a oscuras, una linterna que alcanza poco, **cinco equipos para
catorce lugares**. Cada lugar es un guiño a un proceso real (tabla completa en
[`NARRATIVA.md`](NARRATIVA.md)).

1. **Explorar (60 s).** El giroscopio mueve la linterna; lo iluminado queda
   descubierto; detenerse sobre un lugar lo revela con sus tres barras. Termina
   sola si se encuentran los catorce.
2. **Decidir (60 s).** Instrucciones propias que explican las barras. Al apuntar
   aparece una ficha flotante con las lecturas en palabras. Confirmar envía un
   equipo; el orden es la prioridad; confirmar otra vez lo retira; no se puede
   enviar a un lugar nunca visto. El botón **Enviar equipos** termina cuando se
   quiera.
3. **Despacho.** Los equipos salen del campamento como fichas sobre un tablero.
4. **Relato.** Cada lugar elegido con su proceso real y qué se va a revisar.
5. **Resultado**, paginado: tres notas, lo elegido y lo que se escapó, y La
   Isla Brillante si no se encontró.
6. **Revelación: «Así elegimos».** El aterrizaje de la etapa, en tres tiempos:
   primero se le devuelve al visitante lo que acaba de hacer con sus propias
   palabras (*«miraste toda la compañía… no alcanzaba para todos… escogiste los
   que más pesaban y decidiste a cuáles ir primero»*), después la traducción
   pieza por pieza —la linterna es el alcance, los catorce lugares son los
   procesos, las tres barras son riesgo, importancia y señales, los cinco
   equipos son las auditorías que caben en el año, el orden es la prioridad, y
   lo que se escapó también se documenta— y solo al final el nombre: **«Eso es
   el Plan Anual de Auditoría»**, con lo que implica: define qué se revisa, en
   qué orden y qué queda por fuera, se sustenta ante la Dirección y de ahí sale
   el trabajo de los doce meses.

   Ese orden no es decorativo: nombrar antes de que reconozca lo que hizo
   convierte la revelación en una definición, que es justo lo que este proyecto
   evita.

| Barra | Qué es | Trampa |
|---|---|---|
| Riesgo | Qué tan probable es que algo salga mal | — |
| Importancia | Cuánto le pesa a la compañía si falla | — |
| Señales | Cuánto avisan los datos | **Puede haber peligro sin señales** |

Dos trampas deliberadas: **El Puente Viejo** (riesgo 0.78, señales 0.31: el
riesgo emergente) y **La Isla Brillante** (Brilla, fuera del mapa: hay que
salirse de la tierra firme para encontrarla). Las dos están verificadas dentro
de las cinco correctas; quien persigue solo la señal más fuerte saca 40 sobre
100 en criterio. Si se tocan las lecturas, volver a comprobarlo (`AGENTS.md`).

> No recorriste todo el territorio. Nadie puede. Elegiste dónde mirar.

---

## ETAPA 2 · El Camino  *(jugable, 1 o 2 jugadores)*

**Equivale a:** ejecución con analítica de datos, de principio a fin.
**Código:** lógica pura en `src/juego/carrera.js`, escena en
`src/juego/escenas/camino.js`, pruebas en `tests/camino.test.js` y
`tests/humo.test.js`.

### Premisa
Los equipos llegaron. Ahora hay que caminar todo el proceso por la cadena real
del gas: **El Manantial** (donde entra) → **Los Ramales** (por donde se
reparte) → **La Montaña Perdida** (donde algo se pierde) → **El Gran Caudal**
(donde se mide y se cobra) → **La Represa** (donde llega la plata). Son lugares
que el visitante ya conoce del mapa.

### Mecánica

Corredor de tres carriles, en perspectiva. **Apuntar el Joy-Con a un carril**
mueve al explorador. Unos 70 segundos, a 16-24 m/s (subida tras la primera
prueba: a 10-14 m/s se sentía lento).

| En el camino | Qué es | Qué pasa |
|---|---|---|
| ◆ azul | Datos crudos, tal como salen de la fuente | Se recogen pasando por encima. Abundan en el centro |
| **Gatillo** | Analizar | Gasta 6 datos. Durante 2,4 s hace **visible lo escondido** a 75 m. Sin datos, no hay análisis |
| ◆ rojo con «!» | Algo escondido (en la revelación: *hallazgo*) | Invisible hasta que se analiza. 72 % en los carriles laterales, lo menos transitado |
| Cartel «✓ Todo en orden» | Lo que el proceso dice de sí mismo: controles, manual | Suena bien y suma poco. Casi siempre en el centro |
| Muro con texto | Las excusas de siempre: *«Pídelo por correo»*, *«Siempre se ha hecho así»* | Chocar cuesta 4 datos y frena |

La cadena que se aprende jugando: **sin datos no hay análisis, y sin análisis
lo escondido no aparece.**

### Tablero final — el momento Power BI
Por cada estación, lo encontrado frente a lo que había: es cuando se ve todo lo
que estuvo escondido. Además: datos recogidos, veces que se analizó, carteles ✓
revisados (*«ninguno escondía nada»*), choques con excusas, lo que pasó al lado
sin verse, y si se quedó en el carril cómodo. Con dos jugadores, un tablero por
mitad y el cartel del ganador. Gana quien encuentre más cosas escondidas;
desempata por puntos. El tablero no se puede saltar en los primeros 3 s.

### Revelación: «Así trabajamos»

| En el juego | En la vida real |
|---|---|
| ◆ Los datos crudos | Sacamos la información directo de la base de datos, no de lo que el proceso reporta de sí mismo |
| La lente | La analizamos con herramientas como Power BI y cruzamos las cifras |
| ✓ Los carteles | Revisamos los controles y el manual… pero lo que importa casi nunca está ahí |
| El camino completo | Recorremos el proceso de principio a fin |
| Lo que brilló en rojo | Se llama **hallazgo**: lo escondido, lo que nadie estaba viendo |
| Los muros | Y sí: siempre aparece una excusa en el camino |

> No nos quedamos con lo que el proceso dice de sí mismo. Vamos a ver.

### Equilibrio, medido
Simulado sobre 60 caminos distintos (`tests/camino.test.js`):

| Forma de jugar | Encuentra |
|---|---|
| Carril del centro, sin analizar | **0 de 14** |
| Persiguiendo los carteles ✓ | **0 de 14** (revisa 21 controles) |
| Recogiendo datos, analizando, explorando | **100 %** de media (un bot perfecto; una persona, menos) |

Reglas de justicia del generador, vigiladas por las pruebas: ningún hallazgo en
los primeros 70 m (nadie tiene datos todavía), al menos 30 m entre dos
hallazgos (también al cruzar de una estación a otra), nunca un hallazgo detrás de un muro y como mucho un muro por fila.

---

## ETAPA 3 · El Regreso  *(jugable, 1 o 2 jugadores)*

**Código:** lógica pura en `src/juego/vuelo.js`, escena en
`src/juego/escenas/regreso.js`, pruebas en `tests/regreso.test.js` y
`tests/humo.test.js`.

**Equivale a:** informe, recomendaciones, planes de acción y seguimiento.

### Premisa
Lo encontrado no sirve si se queda en el camino. Hay que **llevarlo de vuelta**
—contarlo, recomendar qué hacer— y meses después **volver a verificar** que se
hizo.

### Mecánica: *Flappy Bird*
**Pulsar el gatillo bate las alas.** Se entiende en dos segundos, no cansa el
brazo y funciona igual con cualquier agarre. Dos jugadores, lado a lado, mismo
recorrido.

| En el vuelo | Qué es |
|---|---|
| Los sobres | Los hallazgos de la Etapa 2 viajan con el jugador: más encontrados, más que entregar (más tres de base) |
| Columnas con texto | Las excusas del seguimiento: *«Ya está resuelto»*, *«No hubo presupuesto»*, *«Cambió el responsable»*, *«Lo vemos el otro trimestre»* |
| Aros dorados | Recomendaciones y planes de acción: atravesarlos los entrega |
| Puestos de control | Seguimiento: pasar por ellos verifica que el plan se cumplió |

No es difícil. Es **insistente**: siempre hay una columna más. El cansancio es
el mensaje. Chocar no termina la partida (ninguna etapa se pierde): hace perder
altura y tiempo.

> Un hallazgo que nadie verifica es una anécdota.

Es la mecánica más reconocible de las tres, la más rápida de aprender y la que
más se presta al público: dos personas pulsando a la vez es ruido y risas.

---

## Ruta de etapas *(jugable)*

Entre etapa y etapa se vuelve a una pantalla con las tres paradas del
recorrido: la recién terminada recibe su **✓** y su resultado en una línea, el
sendero se ilumina hasta la siguiente y la pantalla entra en ella. Dura 4,4 s y
el gatillo la adelanta. Código en `src/juego/escenas/ruta.js`.

Aquí tampoco se nombra el oficio: *Elige a dónde ir*, *Encuentra lo que está
escondido*, *Llévalo de vuelta y verifica*.

## Aspecto gráfico de El Camino *(en 3D)*

Desde el 22 de septiembre la etapa se dibuja en **3D con Three.js**: cámara
detrás del explorador, tuberías amarillas de gas entre los carriles, casas
caribeñas y palmeras a los lados, pórticos que marcan el ritmo, y un horizonte
que cambia con cada estación. Lo escondido sale del suelo con una columna de
luz roja cuando se analiza, y una onda azul recorre el camino.

Si el equipo no puede con 3D, la etapa vuelve sola a la vista 2D. El plan y la
arquitectura están en [`PLAN-GRAFICO-CAMINO.md`](PLAN-GRAFICO-CAMINO.md).

---

## Pantalla final (`cierre.js`)

1. *Primero miraste todo el territorio… después fuiste a la fuente, recorriste
   el proceso y encontraste lo que nadie estaba viendo.* **Eso es Auditoría
   Interna.** Cada etapa con su nombre real, y: *no nos limitamos a probar los
   controles ni a seguir el manual.*
2. La Isla Brillante: lo que no se mira porque «no es lo nuestro».
3. El recorrido completo, con las etapas jugadas.

---

## Orden de construcción

Ver [`PLAN-DE-TRABAJO.md`](PLAN-DE-TRABAJO.md): es la única lista de
pendientes del proyecto; aquí no se duplica.

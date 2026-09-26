# Plan de trabajo

**Punto de entrada para retomar el proyecto** (persona o agente de IA).
Última actualización: **2026-09-22**.

Orden de lectura para retomar en frío:

0. [`ARRANQUE-EN-OTRO-EQUIPO.md`](ARRANQUE-EN-OTRO-EQUIPO.md) si el proyecto
   es nuevo en este computador: requisitos, cómo servirlo, cómo publicarlo.
1. Este archivo: dónde estamos y qué sigue.
2. [`../AGENTS.md`](../AGENTS.md): reglas que no se negocian.
3. El documento de la unidad que vayas a construir (enlazado en su ficha).
4. Corre las pruebas antes de tocar nada (sección «Verificación»). Si no
   pasan tal como están, no empieces: algo cambió.

---

## 1. Dónde estamos

### Lo que existe y funciona

| Pieza | Estado | Verificado en |
|---|---|---|
| Etapa 1 · El Mapa (1 jugador) | Terminada; **revelación propia añadida el 2026-09-25** | Chrome con Joy-Con; demo aprobada por la Directora (2026-09-21). La revelación nueva **falta probarla en Chrome** |
| Etapa 2 · El Camino (1 o 2 jugadores) | Terminada, **en 3D** con respaldo 2D | Mecánica en Chrome con dos Joy-Con (2026-09-22); el 3D **falta Chrome** |
| Etapa 3 · El Regreso (1 o 2 jugadores) | Terminada | Pruebas automáticas; **falta Chrome** |
| Ruta de etapas (pantalla entre etapas) | Terminada | Pruebas automáticas; **falta Chrome** |
| Etapa 3 · El Regreso (1 o 2 jugadores) | Terminada | Pruebas automáticas; **falta Chrome** |
| Ruta de etapas (pantalla entre etapas) | Terminada | Pruebas automáticas; **falta Chrome** |
| Etapa 3 · El Regreso (1 o 2 jugadores) | Terminada | Pruebas automáticas; **falta Chrome** |
| Ruta de etapas (pantalla entre etapas) | Terminada | Pruebas automáticas; **falta Chrome** |
| Gestor de mandos, panel de mandos (J), batería, relevo | Terminado | Chrome con Joy-Con |
| Modo de dos jugadores (ranuras, pantalla partida) | Terminado | Dos Joy-Con reales: R 60,5 Hz y L 66,8 Hz a la vez |
| Jugador 2 se une pulsando un botón de su mando | Terminado | Probado por el usuario: entra sin el panel |
| Estabilidad del mando (8 causas corregidas) | Terminado | Pruebas simuladas + grabaciones reales (`tests/capturas/`) |
| Cierre / revelación final (3 etapas) | Terminado | `tests/humo.test.js` |
| Documentación | Al día con este archivo | — |
| Guion web para la Dirección | Publicado 2026-09-22; **reemplazado** el 2026-09-26 por `docs/TEXTOS-DEL-JUEGO.md` (la copia local `docs/guion-web/` se retiró: sus textos ya no eran los del juego) | https://claude.ai/artifact/H9Cd8UmZeuzdizeh4BevY8 |

### Retroalimentación de la última prueba del usuario (2026-09-22)

1. El cambio de carril, el movimiento y todo en general **funciona bien**.
2. Saltar con las teclas `1` y `2` funciona.
3. La pantalla partida funciona; el Jugador 2 entró pulsando un botón.
4. Los letreros se leen bien de tamaño. **«Por momentos es muy lento, se
   necesita más velocidad».** → *Atendido el mismo día* (unidad U1).
5. Pide una **pantalla de etapas** entre etapa y etapa (unidad U2).
6. Pide **mejorar mucho lo gráfico de El Camino**, con la referencia de un
   Subway Surfers hecho con Three.js (unidad U4, plan en
   [`PLAN-GRAFICO-CAMINO.md`](PLAN-GRAFICO-CAMINO.md)).
7. De El Regreso dice: *«El Flappy Bird es mucho más sencillo de hacer una
   versión idéntica al juego»* (unidad U3).

---

## 2. Qué sigue, en orden

| # | Unidad | Tamaño | Depende de | Estado |
|---|---|---|---|---|
| U1 | Más velocidad en El Camino | S | — | **Hecho** 2026-09-22 |
| G0 | Prueba de WebGL en el equipo del stand | XS | — | **Hecho** 2026-09-22: el usuario la corrió, **apto** |
| U2 | Ruta de etapas entre etapa y etapa | S | — | **Hecho** 2026-09-22 · falta probarlo en Chrome |
| U3 | Etapa 3 · El Regreso (Flappy, 1-2 jugadores) | M | — | **Hecho** 2026-09-22 · falta probarlo en Chrome |
| U4 | El Camino en 3D (Three.js) | L | — | **Hecho** 2026-09-22 · falta probarlo en Chrome con los mandos |
| U6 | Procesar e integrar las imágenes de El Camino | S | — | **Hecho** 2026-09-22: procesadas a `assets/` (1,4 MB) y puestas en la escena 3D |
| U5 | Pulido para el stand | M | U2-U4 | Pendiente |

**Por qué este orden.** Primero la historia completa, después la vitrina. U2
y U3 cierran el arco de tres etapas con la tecnología que ya está probada; si
el evento llegara antes de tiempo, habría una experiencia completa que
mostrar. U4 es la mejora más vistosa pero también la única con un riesgo
técnico real (la tarjeta gráfica del equipo corporativo), por eso va detrás de
G0, que despeja ese riesgo en cinco minutos y puede correrse ya.

---

## 2.1 Segunda ronda de pedidos (2026-09-25)

Pedidos del usuario tras revisar el proyecto completo. Las texturas y modelos
los consigue el usuario **uno por uno, a pedido**: cada vez que se integra una,
se analiza antes (orientación, cómo se ve, cómo quedaría en el juego).

| # | Unidad | Estado |
|---|---|---|
| V1 | El Camino: se juegan **solo 2 tramos**, elegidos **solos** con la prioridad de El Mapa (los dos primeros equipos enviados a un lugar de la cadena del gas; si no hay dos, se completa con el orden de siempre) | **Hecho** · pruebas · falta Chrome |
| V2 | El Camino: **animación de paso** entre tramos (velo dorado, barrido de luz, «Entrando a…») y el aire del 3D cambia de color poco a poco | **Hecho** · pruebas y captura · falta Chrome |
| V3 | El Regreso: **pantalla partida** para dos jugadores (revisa D3) | **Hecho** · pruebas y captura · falta Chrome |
| V4 | El Regreso: **la dificultad la pone El Camino**: +11 px de paso por hallazgo traído (tope +88). Más hallazgos = más fácil y más que entregar | **Hecho** · pruebas · falta Chrome |
| V5 | El Regreso: **sin sobre**, solo la paloma | **Hecho** · captura · falta Chrome |
| V6 | El Regreso: **animación de choque** (plumas, sacudida, destello rojo, paloma girando con estrellitas) | **Hecho** · captura · falta Chrome |
| V7 | **Cinemáticas**: video opcional antes de las instrucciones de cada etapa (`assets/cinematicas/<etapa>.mp4`), agregado, no reemplazo | **Hecho** el hueco · faltan los videos |
| V8 | El Mapa: **dibujo de isla estilo arcade** (`assets/mapa-territorio.jpg`, del usuario). Cada lugar va encima de su hito (faro, torre, represa, hornos…); la costa de `territorio.js` se calcó del dibujo (`herramientas/calcar-costa.py`). Relato, resultados, revelación y marcadores con la temática de los menús | **Hecho** · las 3 verificaciones del mapa en verde · falta Chrome |
| V9 | El Camino: **pirámides estilo Egipto** | **Hecho** con textura de arenisca en bloques (`tex-piramide`) · falta Chrome |
| V10 | El Camino: **personaje nuevo**, exploradora estilo muñeco de vinilo (cabeza grande, cola alta con trenza y aros dorados, camiseta turquesa —coral el J2—, short oliva, fundas, guantes, botas). Modelado por código en `camino3d/explorador.js`, animado (zancada, trenza que se mece, inclinación, tropiezo). Lleva una linterna encendida, no armas. Ahora mira hacia donde corre (antes corría de cara a la cámara). Vista previa: `herramientas/vista-personaje.html` | **Hecho** · captura · falta Chrome |
| V11 | GUI general estilo menú de Tomb Raider (N64): título de fuego, fondo rojo oscuro, cajas con doble borde beige, aro decorativo. Hecho en portada (ahora es un menú), pausa, pantalla de conexión e instrucciones (`render.js`: `tituloMenu`, `cajaMenu`, `aroMenu`; `ui/menu.js`) | **En curso** · texturas de Tomb Raider integradas (lava en títulos, roca en fondos y cajas, medallón; ver ACTIVOS-VISUALES §7.1) · falta el HUD de las etapas. La cara del personaje se reserva para cuando exista el modelo |
| V12 | **Esc pausa** (antes sacaba al inicio): Continuar, Reiniciar etapa, Pantalla completa, Música, Volver al inicio. En pantalla completa se bloquea Esc para el juego (mantener Esc sale). + / − en el Joy-Con también pausa | **Hecho** · pruebas y captura · falta Chrome |
| V13 | Pantalla completa al entrar; letrero de tramo de 2,6 s sin muros; objetos que pasan de largo; WASD y flechas en todo el juego | **Hecho** · pruebas · falta Chrome |
| V14 | El Camino en **dos zonas que no se mezclan**, por orden: 1ª zona pueblo (casas y palmeras, más espaciadas), 2ª zona desierto (pirámides, volcanes, rocas, dunas y arena a los lados). Se mantienen las ilustraciones de fondo de cada tramo, las tuberías, los pórticos y los bordillos. El muro con el que se choca cae al suelo | **Hecho** · pruebas y captura · falta Chrome |
| V15 | **Cambios de nivel con la paleta de los menús**: pantalla del recorrido (roca, título de fuego, paradas con doble anillo, sello ✓ dorado), letrero «Entrando a…», cuenta 3-2-1 de fuego y fundido rojo oscuro | **Hecho** · captura · falta Chrome |
| V16 | **Letra más grande y legible**: instrucciones con escala automática (crece con la pantalla y se achica si no cabe); marcadores, tablero y revelación de El Camino y El Regreso con la temática (revelación compartida en `ui/revelacion.js`) | **Hecho** · captura · falta Chrome |
| V17 | **El Mapa, lugares más fáciles de encontrar** sin mover nada: balizas doradas que laten a través de la oscuridad (salvo La Isla Brillante, a propósito), linterna 105→120 px, descubrir al tocar (no al centrar) y en 0,5 s, etiquetas grandes sobre placa oscura | **Hecho** · captura · falta Chrome |
| V18 | **El Regreso con texturas y tuberías con sentido**: tubería madre arriba de la que bajan los bajantes (unión en T), tubos que salen del suelo con base de concreto y válvula, cielo de atardecer con pirámides, volcán y pueblo en silueta, suelo de arenisca y roca. La paloma, igual | **Hecho** · captura · falta Chrome |
| V19 | **El Regreso sin límite de entregas y más fácil**: se quitan los «sobres» (ya no se vuela sin nada que entregar); cada aro suma hasta el final. Lo traído de El Camino abre el paso (+13 px por hallazgo) y multiplica el valor de cada entrega (+12,5 %, hasta x2). Tuberías más fáciles para todos: paso 200→230, columnas 270→300 px, saltos 150→120, aros 55→70 % y más grandes. Chocar solo cuesta tiempo. Gana quien hace más puntos | **Hecho** · pruebas · falta Chrome |
| V20 | **Cierre final** (las 3 páginas, con «El recorrido completo») con la temática y letra grande | **Hecho** · captura · falta Chrome |
| V21 | **Templos en vez de casas** en la 1ª zona de El Camino (escalonado con santuario, de columnas con frontón, y ruinas), con las texturas de arenisca, bloques y tallado; la entrada mira al camino. Siluetas de templos también en el fondo de El Regreso. **La linterna alumbra el suelo de enfrente** (brazo a ~35° hacia abajo y un charco de luz en el camino) | **Hecho** · captura · falta Chrome |
| V22 | **Portada nueva**: la exploradora del usuario a la derecha (`assets/menu-exploradora.png`, sobre pedestal con resplandor), subtítulo, premisa más legible, y menú con encabezado y botones de piedra (el elegido se enciende en fuego con flechas); la pausa usa los mismos botones. Se quita el templo escalonado de El Camino (quedan columnas, ruinas y palmeras). **Ojo:** el subtítulo «Una expedición por las tierras de auditoría» nombra el oficio antes de jugar, contra la regla de oro; decisión del usuario tras el aviso (constante `SUBTITULO` en `intro.js`) | **Hecho** · captura · falta Chrome |
| V23 | **Dos jugadores con teclado**: J1 con WASD (+Espacio), J2 con las flechas (se une con ↑ en las instrucciones); cualquiera puede ser Joy-Con. Jugando solo, las flechas siguen moviendo al J1 (`ui/jugadores.js`) | **Hecho** · pruebas · falta Chrome |
| V24 | **Recuento final** (`escenas/recuento.js`, `datos/puntajes.js`): puntos por etapa que suben con sonido, total, frase de cómo le fue a cada uno y ganador; **nombre con letras de arcade** (Joy-Con o teclado); **tabla de mejores** guardada en el equipo (localStorage) y opción «Mejores puntajes» en el menú | **Hecho** · pruebas y captura · falta Chrome |
| V25 | **Rendimiento** sin quitar nada: fondo de menús y viñeta precalculados, cielo de El Regreso precalculado, resolución adaptable del 3D (baja hasta 0,75 si hay menos de 50 fps y vuelve a subir), entorno 3D más allá de la niebla sin dibujar | **Hecho** · falta medir en Chrome |
| V26 | Horizontes de El Camino por zona (`fondo-templos`, `fondo-desierto`): el juego ya los usa si existen | Terminado · imágenes del usuario (2508×627) pasadas a JPG 2048×512 |
| V27 | **Cuántos juegan y nombres al empezar** (`escenas/jugadores.js`, `ui/nombre.js`): menú «1 jugador / 2 jugadores» y nombre de cada uno con letras de arcade antes de salir; lo elegido vale para El Camino y El Regreso sin volver a preguntar (y quien se une en El Camino sigue en El Regreso); los nombres salen en los marcadores, tableros y recuento, que ya no los pide al final | **Hecho** · pruebas y captura |
| V28 | **El Camino nunca cae a la vista 2D por lentitud**: el usuario la vio como «el juego se rompió» (puntos sobre negro, sin personaje). Ahora el 3D baja resolución hasta 0,5 y, si pierde la tarjeta gráfica o falla muchos fotogramas seguidos, se vuelve a crear solo | **Hecho** · falta confirmar en Chrome |
| V29 | **El Regreso más liviano**: degradado de los tubos pintado una vez y estirado (antes ~30 degradados por fotograma), siluetas lejanas en lienzos aparte que solo se copian (y de paso ya no saltan al dar la vuelta) | **Hecho** · falta medir en Chrome |
| V30 | **El Regreso a 60 fps** (medido en la AMD Radeon del equipo con `herramientas/medir-escena.html`: de ~100 ms a ~17 ms por fotograma). La causa: `cajaMenu` rellenaba con textura escalada cada fotograma, y en esa tarjeta, mezclado con el resto, costaba decenas de ms. Ahora cada caja se pinta una vez por tamaño y se copia (sirve a todo el juego: la portada bajó de 50 a 19 ms). Además: capas del cielo solo en su franja, nubes y suelo precalculados, bridas/aros/válvulas/carteles como piezas guardadas, grano dentro del cielo, resolución 1:1 en esa etapa | **Hecho** · medido en Chrome con ventana |
| V31 | Portada: subtítulo en dos líneas, «Una expedición por las tierras de» grande con contorno y **AUDITORÍA** con la letra de fuego del título | **Hecho** · captura |
| V32 | **Cinemáticas**: huecos nuevos `inicio` (tras los nombres) y `final` (antes del recuento), la música se baja mientras suena un video; **nivel 3 con historia nueva** («El camino despejado»: lo encontrado sirve para corregir y deja el regreso más fácil) en instrucciones, marcador, tablero y revelación; prompts en docs/CINEMATICAS.md y referencias en assets/originales/referencias-cine/ | **Hecho** el código · videos: el usuario los genera uno a uno (va el de inicio) |
| V33 | **Los cinco videos puestos** (`assets/cinematicas/`, 10 s cada uno, de Gemini); **música**: el tema de Tomb Raider (1996) en `assets/musica/tema.mp3`, en bucle en todo el juego, volumen 0,32 bajo los efectos, se aparta durante los videos; si falta, vuelve la música generada (OJO: derechos de autor, decisión del usuario como con las texturas); **AUDITORÍA** en la portada con acabado de arenisca dorada tallada (`tituloMenu(..., 'piedra')`), distinto del fuego del título; **pantallas de lectura más grandes**: resultados, «Tu plan» y «Así elegimos» del nivel 1 se escalan según su contenido; revelaciones y tableros de los niveles 2 y 3 con letra mayor; títulos nítidos al escalar | **Hecho** · capturas en 1536×864 y 1280×720 |
| V34 | **Power BI en El Camino**: el cartel ✓ pasa a ser un portátil con un tablero de Power BI (imagen del usuario, `assets/obj-powerbi.png`), siempre en los carriles laterales; al tomarlo analiza sin gastar datos. Textos de instrucciones, avisos, tablero y «Así trabajamos» actualizados. **Destellos al recoger** (chispas y anillo del color de lo recogido, pegados al jugador) y «+1 ◆ / +10 · Power BI / +100» que suben desde el explorador. **docs/TEXTOS-DEL-JUEGO.md**: todos los textos del juego con código por línea, para que el usuario los revise | **Hecho** · pruebas y capturas · textos: esperando la revisión del usuario |
| V35 | **Orden para subir al repositorio** (rama `mejoras-stand`): imágenes sin uso retiradas con sus originales (fachadas, cartel ✓, guías del explorador, objetos 2D, relieve, paneles, mapa realista), `docs/guion-web` retirada (la reemplaza TEXTOS-DEL-JUEGO.md), README con el recorrido, controles, atajos, videos, música y estructura al día, OPERACION-STAND con uno o dos jugadores y cómo vaciar la tabla; **tabla de puntajes limpia** (clave nueva `ti.mejores.v2`, la vieja se borra sola) y botón **«Borrar tabla de puntajes»** en el panel de mandos (J) | **Hecho** · 18 pantallas cargadas sin errores, todos los archivos presentes, pruebas en verde · falta la prueba del usuario y el commit |
| V36 | **Revisión de compatibilidad con Joy-Con** de todo lo nuevo: en «cuántos juegan / nombres», + y − vuelven atrás (antes abrían la pausa); los menús se manejan también con X/B/A del Joy-Con derecho (antes solo stick); en el recuento, un solo Joy-Con puede escribir el nombre del jugador sin mando. Nuevas pruebas `tests/joycon-flujo.test.js` (10): todo el recorrido nuevo solo con Joy-Con L y R, dos mandos en El Camino y El Regreso, pausa, recuento y saltar videos | **Hecho** · 156 pruebas, 148 pasan |
| V37 | **Vinculación estilo Switch**: tras «Un jugador / Dos jugadores», pantalla «Vincula los mandos»: cada jugador mantiene gatillo + hombro (ZL + L o ZR + R) de SU Joy-Con; el primero es el Jugador 1; vibra y enciende sus luces con su número. **Un Joy-Con por jugador, de cualquier lado** (se descartó la idea de «izquierdo para uno, derecho para otro»: el usuario aclaró que no era eso). Varios Joy-Con conectados en reserva; el gestor emite `registro` al detectar el gesto. Teclado de respaldo (Espacio / ↑). Cada uno escribe su nombre solo con su mando | **Hecho** · 161 pruebas, 153 pasan · **falta confirmar con los Joy-Con reales** que el gesto se detecta en los mandos de reserva |
| V38 | **Permisos de los Joy-Con, uno por uno**: la ventana de Chrome no salía (se pedía tras esperas y en pantalla completa: Chrome la cancela). Ahora se pide al instante del clic. La pantalla de conexión muestra la lista de mandos y «＋ Conectar otro Joy-Con» (Chrome deja elegir uno por vez y los recuerda), y «Empezar» cuando están todos. En «Vincula los mandos», botón clicable «＋ Conectar otro Joy-Con»; el panel J sale de pantalla completa antes de pedir el permiso | **Hecho** · 162 pruebas, 154 pasan · confirmado por el usuario que la ventana ya aparece |
| V39 | **Calibrar mandos** desde el menú: Controles → «Calibrar mandos» (`escenas/calibrar.js`): una barra de avance por Joy-Con en juego, aviso si se movió y reintento, y prueba de la linterna con el punto de cada jugador. Botón adicional en la **pausa** (calibra sin salir de la etapa) y en el **panel J**. `JoyCon.progresoCalibracion` para la barra | **Hecho** · 165 pruebas, 157 pasan |
| V40 | **Calibrar un mando con drift**: la calibración exigía que el giro marcara < 6 °/s estando quieto, y un Joy-Con con mucho desvío se quedaba para siempre en «esperando que esté quieto». Ahora basta con que esté apoyado (acelerómetro quieto, giro sin sacudidas; `CALIBRACION` en joycon.js), y la quietud del día a día mira el giro ya corregido. La calibración también vuelve a medir el centro del stick (drift del stick) | **Hecho** · prueba nueva con un mando de 14 °/s de desvío · falta confirmar con el Joy-Con del usuario |

---

## 3. Decisión pendiente (2026-09-25)

**D4 · Qué imágenes del usuario se usan en el juego.** De las 19 que generó,
**13 están en uso** (las cinco estaciones, el horizonte, la tierra del camino,
las tres fachadas, la palmera, el cartel ✓ y la barrera). **No están en uso:**
las dos guías del explorador, `obj-dato`, `obj-oculto`, `obj-lente` y
`tex-muro-paneles`.

El usuario preguntó por esto el 2026-09-25 y tiene razón en preguntarlo. Los
motivos y las opciones:

| Imagen | Por qué no está | Opción |
|---|---|---|
| `camino-explorador-guia` (y la del J2) | El personaje corre, se inclina y tropieza: eso pide un muñeco de piezas, no una lámina. La imagen se usó como **guía de diseño** del muñeco (casco, chaleco, mochila) | Mostrarla entera en la pantalla de instrucciones de la etapa, donde nadie corre |
| `obj-dato`, `obj-oculto` | Se modelaron en 3D (octaedro azul, cristal rojo que emerge) porque son cosas por las que se pasa por encima, y una lámina vista de lado se ve como calcomanía | Se pueden cambiar por las imágenes en minutos: hacer las dos versiones y comparar capturas |
| `obj-lente` | Descuido: cabe tal cual en el marcador de ANALIZAR | Ponerla |
| `tex-muro-paneles` | Se prefirieron las fachadas para las casas | Usarla en muros laterales de algún tramo |

**Actualización 2026-09-26:** las imágenes sin uso (las dos guías del explorador, `obj-dato`, `obj-oculto`, `obj-lente`, `tex-muro-paneles`) y las que dejaron de usarse (las tres fachadas, al cambiar las casas por templos, y `obj-control`, al cambiar el cartel ✓ por Power BI) **se retiraron del repositorio** junto con sus originales. Siguen en el historial de git.

~~**Propuesta a la espera de respuesta:** poner `obj-lente`, usar
`tex-muro-paneles`, mostrar al explorador en las instrucciones, probar la
versión con `obj-dato`/`obj-oculto` para comparar, y dejar el personaje
animado como está.~~

---

## 3.1 Decisiones ya resueltas el 2026-09-22

El usuario aprobó las tres recomendaciones. **D1 aprobada: Three.js se puede
usar**, copiado en `vendor/`, versión fijada, y ninguna otra librería.
**D2: chocar no termina la partida** en El Regreso. **D3: los dos pájaros
vuelan en el mismo cielo.** Quedan como referencia de por qué se decidió así:

| # | Decisión (aprobada) | Recomendación seguida | Por qué |
|---|---|---|---|
| D1 | ¿Se permite **una** librería, Three.js, copiada dentro del proyecto? | **Sí** | Es lo que usa el video de referencia. Es JavaScript que ejecuta Chrome, no un binario: Sophos no la bloquea. Se copia una vez a `vendor/` y no depende de internet ni de npm. Rompe la letra de la regla «cero librerías», no su razón. Ver [`PLAN-GRAFICO-CAMINO.md`](PLAN-GRAFICO-CAMINO.md) §3 |
| D2 | En El Regreso, ¿chocar termina la partida como en el Flappy original? | **No: el pájaro cae, pierde un sobre y vuelve a los 1,5 s** | «Ninguna etapa se pierde» (`DISENO-JUEGO.md`). Con dos jugadores, que uno muera a los 5 s deja a una persona mirando 55 s. Se conserva todo lo demás del original |
| D3 | En El Regreso, ¿los dos pájaros en el mismo cielo o pantalla partida? | **Mismo cielo** | Mismas columnas para los dos, se ven y se estorban la vista: es más divertido y más barato de dibujar. En Flappy la pantalla partida desperdicia el ancho |

Las tres están aprobadas: se construyen tal cual. D2 y D3 viven en constantes
de `src/juego/vuelo.js`, por si hay que probar lo contrario en el stand.

---

## 4. Fichas de trabajo

Cada ficha tiene objetivo, archivos, criterio de aceptación comprobable y
restricciones. Están pensadas para poder entregarse tal cual a un agente.

### U1 · Más velocidad en El Camino — HECHO

- **Cambio:** `src/juego/carrera.js`, `CAMINO`: velocidad 10→14 m/s pasó a
  **16→24 m/s**. Todo lo espacial se estiró en proporción para que la
  carrera siga durando ~71 s y todo siga siendo alcanzable: `largo` 820→1400,
  `vista` 60→80, `alcanceLente` 55→75, `separacionFila` 7→9, `inicioOcultos`
  45→70, `sepOcultos` 20→30, `costoLente` 5→6 (con más filas hay más datos).
- **Defecto encontrado de paso:** la separación mínima entre hallazgos solo se
  aplicaba dentro de cada estación; al cruzar de una a otra podían quedar
  pegados. Ahora se lleva la cuenta en todo el camino.
- **Verificado:** `tests/camino.test.js` 17/17 (centro sin analizar: 0/14;
  persiguiendo controles: 0/14; explorador: 100 %, 71 s) y batería completa
  91/91.
- **Falta:** que el usuario confirme en Chrome que ya no se siente lento. Si
  quiere más, subir `velInicial`/`velFinal` y `largo` en la misma proporción
  y volver a correr `camino.test.js`.

### G0 · Prueba de WebGL en el equipo del stand

- **Objetivo:** saber si el equipo corporativo pinta 3D por tarjeta gráfica
  antes de invertir en U4.
- **Resultado (2026-09-22):** **apto**. El equipo tiene gráficos Intel Iris Xe
  con WebGL 2 por hardware (ANGLE/Direct3D 11). U4 va por el plan principal,
  no por el plan B.
- **Cómo:** con el servidor arriba, abrir
  `http://localhost:8740/herramientas/prueba-webgl.html` en Chrome, **en el
  mismo equipo y la misma pantalla del stand**. Dura 10 segundos y da un
  veredicto.
- **Aceptación:** veredicto «apto»: WebGL 2 disponible, renderizador de
  hardware (Intel/NVIDIA/AMD, no «SwiftShader» ni «Basic Render»), y ≥ 50 fps
  con la escena de carga.
- **Si falla:** U4 se hace con el plan B de `PLAN-GRAFICO-CAMINO.md` §8
  (mejorar el 2D), o se pide a TI activar la aceleración por hardware de
  Chrome (`chrome://settings/system`).

### U2 · Ruta de etapas entre etapa y etapa — HECHO

Construida en `src/juego/escenas/ruta.js`. El recorrido quedó así:
`intro → ruta → mapa → ruta(✓1) → camino → ruta(✓2) → regreso → ruta(✓3) →
cierre`. La secuencia dura 4,4 s: sello, sendero que se ilumina y entrada. El
gatillo adelanta cada parte, pero no dos seguidas (medio segundo entre
adelantos), así el ✓ siempre se ve. Las teclas `1`, `2`, `3` y `0` saltan a
cada etapa y a la ruta, para el operador. Probado en `tests/humo.test.js`
(cadena de escenas, dos resoluciones, y que machacar el gatillo no se lo salte).

#### Diseño original (se construyó tal cual) — HECHO

Construida en `src/juego/escenas/ruta.js`. El recorrido quedó así:
`intro → ruta → mapa → ruta(✓1) → camino → ruta(✓2) → regreso → ruta(✓3) →
cierre`. La secuencia dura 4,4 s: sello, sendero que se ilumina y entrada. El
gatillo adelanta cada parte, pero no dos seguidas (medio segundo entre
adelantos), así el ✓ siempre se ve. Las teclas `1`, `2`, `3` y `0` saltan a
cada etapa y a la ruta, para el operador. Probado en `tests/humo.test.js`
(cadena de escenas, dos resoluciones, y que machacar el gatillo no se lo salte).

#### Diseño original (se construyó tal cual) — HECHO

Construida en `src/juego/escenas/ruta.js`. El recorrido quedó así:
`intro → ruta → mapa → ruta(✓1) → camino → ruta(✓2) → regreso → ruta(✓3) →
cierre`. La secuencia dura 4,4 s: sello, sendero que se ilumina y entrada. El
gatillo adelanta cada parte, pero no dos seguidas (medio segundo entre
adelantos), así el ✓ siempre se ve. Las teclas `1`, `2`, `3` y `0` saltan a
cada etapa y a la ruta, para el operador. Probado en `tests/humo.test.js`
(cadena de escenas, dos resoluciones, y que machacar el gatillo no se lo salte).

#### Diseño original (se construyó tal cual)

- **Lo que pidió el usuario:** *«cuando vayamos a pasar de etapa a etapa,
  volver a la pantalla donde se muestran todas las etapas, que muestre que una
  se terminó con un check y pasamos a la siguiente iluminando y entrando».*
- **Diseño:**
  - Escena nueva `src/juego/escenas/ruta.js` (nombre de escena `'ruta'`).
  - Se ven las tres etapas como tres paradas unidas por un sendero punteado
    sobre fondo de mapa: número, nombre (*El Mapa*, *El Camino*, *El
    Regreso*), una línea de qué se hace (*Elige a dónde ir*, *Encuentra lo
    escondido*, *Llévalo de vuelta*) y el icono de jugadores (1 / 1-2).
    **Sin vocabulario del oficio**: la ruta se ve mientras se juega.
  - Secuencia al llegar (≈4 s, se puede acelerar con el gatillo):
    1. Aparece la ruta con las etapas ya terminadas en su estado final.
    2. La recién terminada recibe su **✓ dorado** (sello que cae con rebote,
       sonido `especial`, vibración corta) y su resultado en una línea
       (*«5 equipos enviados»*, *«9 de 14 descubiertos»*).
    3. El sendero se **ilumina** hasta la siguiente (trazo que avanza, sonido
       `avanzar`).
    4. La siguiente **late** y crece hasta llenar la pantalla: fundido y se
       entra (`motor.ir(siguiente)`).
  - Flujo completo: `intro → ruta → mapa → ruta → camino → ruta → regreso →
    ruta (las tres con ✓) → cierre`. En la primera visita no hay ✓: solo se
    ilumina la Etapa 1.
  - Estado: `motor.expedicion.completadas` (lista de ids) y
    `motor.expedicion.puntajes` (ya existe). `Esc`/intro los reinicia.
  - Mientras U3 no exista, al terminar El Camino la ruta muestra El Regreso
    como «Próximamente» y va al cierre.
  - Las teclas `1`/`2`/`3` siguen saltando directo a cada etapa (ensayo).
- **Archivos:** `ruta.js` (nuevo), `mapa.js` (al terminar: `ir('ruta')` en vez
  de `ir('camino')`), `camino.js` (ídem en vez de `ir('cierre')`),
  `intro.js`, `main.js` (registrar escena), `tests/humo.test.js`.
- **Aceptación:**
  - Prueba de humo: la cadena de escenas es exactamente la de arriba; la ruta
    dibuja sin errores a 1920×1080 y 1280×720 con 0, 1, 2 y 3 etapas
    completadas.
  - Pulsar sin parar al terminar una etapa **no** se salta la animación del ✓
    (mismo bloqueo que `BLOQUEO_TABLERO` en `camino.js`).
  - Ningún texto con coordenadas fijas: medir con `partirLineas()`.

### U3 · Etapa 3 · El Regreso — HECHO

Lógica pura en `src/juego/vuelo.js`, escena en `src/juego/escenas/regreso.js`,
pruebas en `tests/regreso.test.js` (12) y `tests/humo.test.js`. Se construyó el
diseño de abajo, con estos números de partida: gravedad 1500 px/s², impulso
−430, mundo a 195 px/s, paso de 200 px cada 270, vuelo de 60 s, y una paloma de
24 px de radio en un lienzo lógico de 720 de alto.

Lo medido: un piloto que apunta al centro del paso entrega el **100 %** de lo
que trae sin chocar (es un robot perfecto; una persona, menos), y quien no
pulsa nunca no entrega nada. Traer más hallazgos de El Camino permite entregar
más: la etapa anterior cuenta de verdad.

Falta: probarlo en Chrome con los mandos, y las imágenes R-* de
`ACTIVOS-VISUALES.md` (hoy la paloma, las columnas y los aros están dibujados
por código).

#### Diseño original (se construyó tal cual)

- **Diseño narrativo:** [`DISENO-JUEGO.md`](DISENO-JUEGO.md), Etapa 3. El
  protagonista es una **paloma mensajera**: lleva de vuelta lo encontrado.
  Analogía directa y que todo el mundo entiende.
- **Mecánica: idéntica al Flappy Bird original** (lo pidió el usuario):
  gravedad constante, cada pulsación del gatillo da un impulso hacia arriba,
  columnas con un hueco que avanzan a velocidad constante. Parámetros de
  partida (ajustar jugando): gravedad 1500 px/s², impulso −430 px/s,
  velocidad 190 px/s, hueco 190 px, separación 260 px, en un lienzo lógico de
  alto 720 escalado a la pantalla. Duración fija: **60 s**.
- **Lo que se ve en el vuelo:**

  | En el vuelo | Qué es (se dice en la revelación) |
  |---|---|
  | Sobres que lleva la paloma: tantos como hallazgos trajo de El Camino (mín. 3) | El informe con los hallazgos |
  | Columnas con una excusa escrita: *«Ya está resuelto»*, *«No hubo presupuesto»*, *«Cambió el responsable»*, *«Lo vemos el otro trimestre»* | La resistencia en el seguimiento |
  | Aro dorado en el hueco de algunas columnas | Recomendación entregada (suelta un sobre) |
  | Poste con bandera cada ~15 s | Puesto de control: seguimiento del plan de acción |

- **Choque (D2):** la paloma cae girando, pierde un sobre y reaparece a los
  1,5 s en el centro, parpadeando e invulnerable 1 s.
- **Dos jugadores (D3):** mismo cielo, dos palomas de color distinto
  (colores de jugador de `camino.js`: `COLOR_J`), mismas columnas. Se une el
  J2 igual que en El Camino (botón del mando de reserva). Gana quien entregue
  más; desempata quien pasó más puestos de control.
- **Revelación («Así terminamos»):** sobres = informe; aros = recomendaciones;
  puestos de control = seguimiento a los planes de acción; columnas = las
  excusas de siempre. Cierre: *«Un hallazgo que nadie verifica es una
  anécdota.»*
- **Arquitectura:** igual que El Camino. Lógica pura en
  `src/juego/vuelo.js` (física, generador con semilla, colisiones, puntaje,
  `resultado()`), escena en `src/juego/escenas/regreso.js`, música y efectos
  nuevos en `audio.js` (`aleteo`, `entrega`), registro en `main.js` (tecla
  `3`). Dibujo en Canvas 2D con figuras hechas por código: **no necesita
  Three.js**.
- **Aceptación:**
  - `tests/regreso.test.js`: siempre hay hueco alcanzable entre dos columnas
    seguidas (diferencia de altura acotada por lo que la física permite
    subir/bajar en la separación); la misma semilla da el mismo cielo; un
    jugador que nunca pulsa entrega 0; un bot que apunta al centro del hueco
    entrega casi todo; los sobres iniciales salen de
    `motor.expedicion.puntajes.camino`.
  - `tests/humo.test.js`: la etapa completa con 1 y 2 jugadores, y con el J2
    desconectándose a mitad.
  - Vocabulario: ninguna palabra vetada fuera de la revelación.
  - `cierre.js`: El Regreso pasa a `estado: 'listo'`.

### U4 · El Camino en 3D — HECHO

Construido tal como lo planteaba `PLAN-GRAFICO-CAMINO.md`:

- **Three.js r161** en `vendor/three.module.min.js` (660 KB) con su licencia
  MIT. Es la única librería del proyecto; nada de npm, CDN ni compilación.
- **`src/juego/camino3d/`**: `vista3d.js` (render, cámaras, pantalla partida),
  `escenario.js` (camino, tuberías amarillas, casas, palmeras, pórticos,
  horizonte por estación), `objetos.js` (datos, carteles ✓, muros con su
  excusa, lo escondido, arcos de estación; todo con reservas reutilizables) y
  `explorador.js` (el personaje de cajas, animado).
- **`camino.js` no cambió de lógica**: intenta encender el 3D al entrar; si no
  puede, dibuja en 2D como antes. Si durante la carrera baja de 40 fps por más
  de 3 s, **vuelve solo al 2D** sin cortar la partida.
- El lienzo 3D va detrás del de siempre (`index.html`): marcadores, avisos,
  instrucciones y tablero siguen pintándose en 2D, ahora sobre transparente y
  con un velo oscuro arriba y abajo para que se lean sobre el cielo claro.
- **Las 19 imágenes** del usuario, procesadas con
  `herramientas/procesar-imagenes.py`, se usan como texturas: tierra del
  camino, tres fachadas caribeñas, palmera, cartel ✓, barrera y los cinco
  fondos de estación, que cambian el horizonte y el color del aire al entrar
  en cada tramo.
- **`tests/camino3d.test.js`** (6 pruebas) construye la escena entera en Node
  —Three.js funciona sin navegador mientras no se pida WebGL— y corre una
  carrera completa: comprueba que nada se crea dentro del bucle, que el
  entorno se recicla, y **que lo escondido no se dibuja hasta que se analiza**,
  que es la lección de la etapa.

Falta: verlo en Chrome con los mandos y medir los fps reales (el chip de
estado los muestra). Si con dos jugadores no llegara a 50, bajar
`setPixelRatio` a 1 y quitar el antialias en `vista3d.js`.

#### Plan original

Plan completo, con arquitectura, fases y criterios:
[`PLAN-GRAFICO-CAMINO.md`](PLAN-GRAFICO-CAMINO.md). Requiere G0 «apto» y D1
aprobada.

### U5 · Pulido para el stand

- Modo atracción: si nadie juega en 60 s, una carrera de demostración en
  bucle (un bot de `camino.test.js` jugando) con el cartel «Toma un mando».
- Medir tiempos reales con gente del área y ajustar duraciones.
- Registro local de partidas (cuántos jugaron, cuántos encontraron La Isla
  Brillante, hallazgos por partida) en `localStorage`, exportable.
- Actualizar `OPERACION-STAND.md` con el flujo final.

---

## 5. Verificación (antes y después de cualquier cambio)

```bash
cd terra-incognita
node --test tests/entrada.test.js tests/captura.test.js tests/multijugador.test.js tests/camino.test.js tests/regreso.test.js tests/camino3d.test.js tests/humo.test.js tests/joycon-flujo.test.js
```

Resultado esperado hoy: `# tests 166 · # pass 158 · # fail 0 · # skipped 8`
(los 8 omitidos son pruebas de dirección sobre grabaciones antiguas, v1, que
no las permiten; es lo esperado). En Windows hay que nombrar los archivos:
`node --test tests/` no funciona. Cada unidad nueva añade sus archivos de
prueba a esta línea, y a la de `AGENTS.md` y `CLAUDE.md`.

Para ver el juego: `python servidor.py` y Chrome en
`http://localhost:8740/index.html` (o doble clic en `abrir.cmd`). El puerto
no se cambia: Chrome ata los permisos de los mandos al origen.

**Lo que las pruebas no ven** y solo confirma el usuario en Chrome con los
mandos: cómo se siente, cómo se ve y si se lee a tres metros. Ninguna unidad
se da por terminada sin esa prueba; el estado de la tabla de la §2 lo
distingue.

---

## 6. Historial de decisiones

| Fecha | Decisión |
|---|---|
| 2026-09-20 | Proyecto web (Chrome + WebHID) porque Sophos bloquea pygame y motores nativos |
| 2026-09-20 | Metáfora: expedición a territorio inexplorado |
| 2026-09-21 | La Directora de Auditoría aprueba la demo de la Etapa 1 |
| 2026-09-22 | Estabilidad del mando rehecha tras fallos en la demo |
| 2026-09-22 | De seis etapas a **tres**: Mapa, Camino (Subway), Regreso (Flappy); las dos últimas de dos jugadores |
| 2026-09-22 | Cada etapa puede nombrar el oficio en su revelación final; durante el juego, nunca |
| 2026-09-22 | El Camino: más velocidad (16→24 m/s) |
| 2026-09-22 | El equipo del stand pasa la prueba de 3D (Intel Iris Xe, WebGL 2 por hardware) |
| 2026-09-22 | **Aprobado (D1): Three.js copiado en `vendor/`**, única librería del proyecto |
| 2026-09-22 | **Aprobado (D2):** en El Regreso, chocar no termina la partida |
| 2026-09-22 | **Aprobado (D3):** en El Regreso, los dos jugadores vuelan en el mismo cielo |
| 2026-09-22 | El usuario entrega las 19 imágenes de El Camino generadas con IA |
| 2026-09-22 | Se publica el guion web con todos los textos, para revisión de la Dirección |
| 2026-09-22 | Construidas la ruta de etapas (U2) y la Etapa 3, El Regreso (U3) |
| 2026-09-22 | El Camino pasa a 3D con Three.js (U4), con respaldo automático a 2D |
| 2026-09-25 | El proyecto queda autocontenido para publicarlo en GitHub y seguir en otro equipo |
| 2026-09-25 | La Etapa 1 recupera su revelación propia («Así elegimos» → Plan Anual), que se había perdido al pasar de seis etapas a tres |
| 2026-09-25 | La revelación de la Etapa 1 se hace más honda: primero lo que hizo, después la traducción, al final el nombre |
| 2026-09-25 | Repositorio privado en GitHub: arturcast/terra-incognita |
| 2026-09-25 | **D3 revisada:** El Regreso pasa a pantalla partida (antes, mismo cielo). Mismas columnas para los dos |
| 2026-09-25 | El Camino se acorta a 2 tramos, elegidos con la prioridad de El Mapa: la Etapa 1 decide la Etapa 2 |
| 2026-09-25 | Lo encontrado en El Camino pone la dificultad de El Regreso: la Etapa 2 decide la Etapa 3 |
| 2026-09-25 | Cinemáticas como agregado antes de las instrucciones; el texto de instrucciones se conserva |
| 2026-09-25 | El usuario pone «auditoría» en el subtítulo de la portada, sabiendo que adelanta la revelación |
| 2026-09-22 | Construidas la ruta de etapas (U2) y la Etapa 3, El Regreso (U3) |
| 2026-09-22 | Construidas la ruta de etapas (U2) y la Etapa 3, El Regreso (U3) |

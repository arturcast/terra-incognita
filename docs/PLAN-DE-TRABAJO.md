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
| Gestor de mandos, panel F9, batería, relevo | Terminado | Chrome con Joy-Con |
| Modo de dos jugadores (ranuras, pantalla partida) | Terminado | Dos Joy-Con reales: R 60,5 Hz y L 66,8 Hz a la vez |
| Jugador 2 se une pulsando un botón de su mando | Terminado | Probado por el usuario: entra sin F9 |
| Estabilidad del mando (8 causas corregidas) | Terminado | Pruebas simuladas + grabaciones reales (`tests/capturas/`) |
| Cierre / revelación final (3 etapas) | Terminado | `tests/humo.test.js` |
| Documentación | Al día con este archivo | — |
| Guion web para la Dirección | Publicado 2026-09-22 | https://claude.ai/artifact/H9Cd8UmZeuzdizeh4BevY8 · copia en `docs/guion-web/` |

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

**Propuesta a la espera de respuesta:** poner `obj-lente`, usar
`tex-muro-paneles`, mostrar al explorador en las instrucciones, probar la
versión con `obj-dato`/`obj-oculto` para comparar, y dejar el personaje
animado como está.

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
node --test tests/entrada.test.js tests/captura.test.js tests/multijugador.test.js tests/camino.test.js tests/regreso.test.js tests/camino3d.test.js tests/humo.test.js
```

Resultado esperado hoy: `# tests 124 · # pass 116 · # fail 0 · # skipped 8`
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
| 2026-09-22 | Construidas la ruta de etapas (U2) y la Etapa 3, El Regreso (U3) |
| 2026-09-22 | Construidas la ruta de etapas (U2) y la Etapa 3, El Regreso (U3) |

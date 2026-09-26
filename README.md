# TERRA INCÓGNITA

**Una expedición por las tierras de auditoría.**

Experiencia interactiva con Joy-Con de Nintendo Switch para el stand de
**Auditoría Interna** en el *Tour Conéctate* de Gases del Caribe.

---

## Qué es

Un visitante llega al stand, toma un Joy-Con y juega. En unos diez minutos
recorre tres etapas —las dos últimas, compitiendo con alguien más—. Mientras
juega no se le habla de auditoría: eso se le dice al final de cada etapa.

Se le habla de un territorio a oscuras que nadie ha recorrido entero, de una
linterna que alcanza poco, y de decidir a dónde mandar los pocos equipos que
tiene. Al final —y solo al final— se le dice qué acaba de hacer:

> *Acabas de recorrer un territorio enorme con una linterna pequeña, y decidir
> a dónde mandar los pocos equipos que tenías.*
> **Eso se llama Plan Anual de Auditoría.**

Esa inversión del orden habitual —primero vivir la capacidad, después ponerle
nombre— es toda la apuesta del proyecto. Una presentación explica lo que hace
un área. Esto hace que el visitante lo ejerza.

## Por qué así

El área ha destacado por implementar tecnología, IA y analítica. El stand debe
demostrarlo, no afirmarlo. Un tablero de PowerPoint diciendo "somos
innovadores" contradice su propio mensaje; un mando de consola leyendo su
giroscopio en tiempo real a 60 Hz, no.

La segunda razón es didáctica. Explicar un plan anual de auditoría a alguien de
Cartera o de Talento Humano es aburrido y no se recuerda. Hacerle sentir la
frustración de tener cinco equipos para catorce lugares, y después mostrarle cuál
se le escapó y por qué, sí se recuerda.

Y una tercera, aprendida probándolo: **el lenguaje tiene que ser el del
pasillo.** La primera versión decía "catalejo" y "paraje". Nadie sabía qué era
eso. Ahora dice "linterna" y "lugar".

---

## Estado actual

| Etapa | Juego | Jugadores | Equivale a | Estado |
|---|---|---|---|---|
| 1 · El Mapa | linterna con el giroscopio | 1 | Plan Anual de Auditoría | **Jugable** |
| 2 · El Camino | estilo *Subway Surfers*, en 3D | 1 o 2 | Ejecución con analítica de datos | **Jugable** |
| 3 · El Regreso | estilo *Flappy Bird* | 1 o 2 | Recomendaciones y seguimiento | **Jugable** |

El recorrido completo: **portada → cuántos juegan y sus nombres → video de
inicio → El Mapa → El Camino → El Regreso → video final → recuento de puntos y
tabla de los mejores → cierre.** Cada etapa tiene su video, sus instrucciones,
su tablero y su pantalla de revelación («Así elegimos / trabajamos / terminamos»).

**La Etapa 1, El Mapa**, tiene dos partes: **explorar** el mapa a oscuras con la
linterna (60 s) y **decidir** a dónde mandar cinco equipos entre catorce
lugares. Cada lugar es un guiño al proceso que representa (*El Gran Caudal* era
facturación, *La Montaña Perdida* pérdida no operacional…). **Uno de los catorce
está fuera del mapa**: *La Isla Brillante*, es decir Brilla, el negocio que no
es gas.

**La Etapa 2, El Camino**, recorre en 3D los dos tramos de la cadena del gas a
los que el visitante dio más prioridad en El Mapa. Se recogen **datos crudos**
(◆ azules), con el gatillo se **analizan** y aparece lo que estaba escondido;
los **tableros de Power BI** analizan solos, y las excusas son muros. Dos
jugadores corren el mismo camino a pantalla partida.

**La Etapa 3, El Regreso** («el camino despejado»), cuenta que lo encontrado
sirve para corregir y deja el camino más fácil: **mientras más cosas escondidas
atrapó cada jugador en El Camino, más ancho es su paso entre las tuberías y más
vale cada aro.**

Todos los textos del juego, con un código por línea para pedir cambios, están
en [`docs/TEXTOS-DEL-JUEGO.md`](docs/TEXTOS-DEL-JUEGO.md). El diseño de las
etapas, en [`docs/DISENO-JUEGO.md`](docs/DISENO-JUEGO.md).

---

**Repositorio:** https://github.com/arturcast/terra-incognita (privado).

> **¿Llegas nuevo al proyecto, o lo abres en otro computador?** Empieza por
> [`docs/ARRANQUE-EN-OTRO-EQUIPO.md`](docs/ARRANQUE-EN-OTRO-EQUIPO.md):
> requisitos, cómo ponerlo a andar, cómo seguir trabajando (también con una IA)
> y cómo publicarlo en GitHub.

## Cómo ejecutarlo

**Requisitos:** Google Chrome (o Edge) y Python. Nada más. No hay que instalar
dependencias, no hay paso de compilación, no hay `npm install`. La única
librería, Three.js, viene copiada dentro del proyecto.

1. Enciende un Joy-Con y emparéjalo por Bluetooth con Windows
   (mantén pulsado el botón de sincronización del lateral hasta que parpadeen
   las luces, y búscalo en *Configuración → Bluetooth*).
2. Doble clic en **`abrir.cmd`**.
3. Se abre Chrome. Pulsa **«＋ Conectar un Joy-Con»** y elígelo en la ventana de
   Chrome; repite con **«＋ Conectar otro Joy-Con»** por cada mando (Chrome deja
   elegir uno por vez y los recuerda: la próxima vez aparecen solos). Luego
   **«Empezar»**.
4. Para salir, cierra la ventana negra del servidor.

> **Importante:** no abras `index.html` haciendo doble clic sobre el archivo.
> WebHID solo funciona en un contexto seguro y `file://` no lo es. Por eso
> existe `abrir.cmd`, que sirve la página desde `localhost`.

Si el Joy-Con falla en pleno evento, el botón **Continuar con ratón o
teclado** deja la experiencia jugable. Es una red de seguridad deliberada.

### Controles

- **Joy-Con:** moverlo apunta; **ZR/ZL** es la acción; **+ / −** pausa;
  **HOME/CAPTURA** recentra la mira.
- **Teclado, Jugador 1:** **W A S D** para moverse, **W o Espacio** para la acción.
- **Teclado, Jugador 2:** flechas **← →** para moverse, **↑** para la acción.
- **Un Joy-Con por jugador**, de cualquier lado. Al empezar se elige «Un
  jugador» o «Dos jugadores» y se **vinculan los mandos** en una pantalla
  estilo Switch: cada uno mantiene pulsados **el gatillo y el botón de hombro**
  de su Joy-Con (ZL + L o ZR + R); el primero es el Jugador 1. El mando vibra
  y enciende sus luces con su número. Sin Joy-Con: Espacio el Jugador 1, ↑ el
  Jugador 2. Todo el juego se maneja con un solo Joy-Con por persona.
- **Varios Joy-Con a la vez:** todos los autorizados quedan conectados en
  reserva; el operador agrega uno nuevo con la tecla J → «Sincronizar un mando
  nuevo».

### Atajos del operador

| Tecla | Acción |
|---|---|
| `F` | Pantalla completa |
| `J` | Panel de mandos: asignar Jugador 1 y 2, sincronizar mandos, **borrar la tabla de puntajes** (también `F9`, pero en portátiles esa tecla suele ser volumen o brillo) |
| `P` | Sala de prueba de dos jugadores |
| `1` / `2` / `3` | Saltar a una etapa (para ensayar) |
| `0` | Ver la pantalla del recorrido |
| `M` | Silenciar la música |
| `C` | Calibrar el giroscopio (deja el mando quieto un segundo). También: menú principal → Controles → **Calibrar mandos** (con barra de avance y prueba de la linterna), **Pausa → Calibrar mandos** en plena partida, y el panel J |
| `R` | Recentrar el puntero |
| `Esc` | Pausa (desde ahí: reiniciar la etapa o volver al inicio) |

### Videos, música y puntajes

- **Videos** (cinemáticas): `assets/cinematicas/` — `inicio`, `mapa`, `camino`,
  `regreso` y `final` (.mp4). Si falta uno, el juego sigue sin él. Cómo se
  hicieron y cómo rehacerlos: [`docs/CINEMATICAS.md`](docs/CINEMATICAS.md).
- **Música:** `assets/musica/tema.mp3`, en bucle; se aparta mientras suena un
  video. Si falta, suena una música generada en el momento. Los efectos de
  sonido siempre se generan con Web Audio.
- **Tabla de los mejores:** se guarda en el propio navegador del equipo del
  stand (no necesita internet). Se vacía desde el panel de mandos (tecla J).

---

## Estructura

```
terra-incognita/
├── index.html              página y capa de enlace del mando
├── abrir.cmd / abrir.sh    lanzadores del stand (sirven la página en localhost:8740)
├── servidor.py             servidor local sin caché
├── package.json            solo declara módulos ES; sin dependencias
├── src/
│   ├── main.js             punto de entrada: mandos, motor, escenas, teclado
│   ├── core/
│   │   ├── joycon.js       driver WebHID: protocolo, IMU, vibración
│   │   ├── input.js        puntero por giroscopio y acciones con nombre
│   │   ├── engine.js       bucle, lienzo, escenas, pantalla partida
│   │   ├── render.js       paleta, letras de fuego/piedra, cajas, fondos (con caché)
│   │   ├── audio.js        música (tema en mp3) y efectos sintetizados
│   │   ├── cinematica.js   reproduce los videos entre pantallas
│   │   ├── briefing.js     pantallas de instrucciones que se miden solas
│   │   └── mandos.js       inventario, batería y cambio de mando en caliente
│   ├── ui/
│   │   ├── menu.js         menús con estilo de consola (portada, pausa)
│   │   ├── pausa.js        menú de pausa
│   │   ├── jugadores.js    quién juega, nombres, aviso del Jugador 2
│   │   ├── nombre.js       escribir el nombre con letras de arcade
│   │   ├── revelacion.js   pantallas «Así trabajamos / terminamos»
│   │   └── panel-mandos.js panel del operador (tecla J)
│   ├── datos/
│   │   ├── territorio.js   los catorce lugares y la evaluación de El Mapa
│   │   └── puntajes.js     recuento final y tabla de los mejores
│   └── juego/
│       ├── carrera.js      lógica pura de El Camino: generador y reglas
│       ├── vuelo.js        lógica pura de El Regreso: física y cielo
│       ├── camino3d/       la vista 3D de El Camino (Three.js)
│       │   ├── vista3d.js      render, cámaras, pantalla partida, destellos
│       │   ├── escenario.js    camino, templos, desierto, horizonte por zona
│       │   ├── objetos.js      datos, Power BI, muros, lo escondido, arcos
│       │   └── explorador.js   la exploradora y su animación
│       └── escenas/
│           ├── intro.js        portada y menú principal
│           ├── jugadores.js    cuántos juegan, vincular los mandos y nombres
│           ├── calibrar.js     calibrar los Joy-Con y probar la linterna
│           ├── ruta.js         la pantalla entre etapa y etapa
│           ├── mapa.js         ETAPA 1 — El Mapa
│           ├── camino.js       ETAPA 2 — El Camino (1 o 2 jugadores)
│           ├── regreso.js      ETAPA 3 — El Regreso (1 o 2 jugadores)
│           ├── recuento.js     puntos de cada uno y tabla de los mejores
│           ├── cierre.js       la revelación final y el recorrido completo
│           └── prueba2j.js     sala de prueba de dos jugadores (tecla P)
├── vendor/
│   └── three.module.min.js la única librería: Three.js r161, copiada, con su licencia
├── assets/                 imágenes del juego, ya procesadas
│   ├── cinematicas/        los cinco videos (.mp4)
│   ├── musica/             el tema musical (.mp3)
│   └── originales/         las imágenes tal como salieron (IA, texturas, referencias de los videos)
├── herramientas/
│   ├── vista-escena.html   ver una pantalla suelta, sin jugar hasta ella
│   ├── vista-personaje.html la exploradora 3D en tres vistas
│   ├── medir-escena.html   cuánto tarda cada fotograma (rendimiento)
│   ├── prueba-webgl.html   ¿puede este equipo con 3D?
│   ├── procesar-imagenes.py deja las imágenes de IA listas para el juego
│   ├── recortar-texturas.py saca las texturas de piedra y lava de las láminas
│   ├── calcar-costa.py     calca la costa del mapa de la imagen
│   └── joycon-lab/         banco de pruebas del mando, aparte del juego
├── tests/                  pruebas (node --test), ver AGENTS.md §6
└── docs/
    ├── ARRANQUE-EN-OTRO-EQUIPO.md  cómo ponerlo a andar en otra máquina
    ├── PLAN-DE-TRABAJO.md  estado, qué se hizo y qué sigue
    ├── TEXTOS-DEL-JUEGO.md todos los textos del juego, con código por línea
    ├── CINEMATICAS.md      los cinco videos: historia y prompts
    ├── ACTIVOS-VISUALES.md imágenes con IA: catálogo y prompts
    ├── NARRATIVA.md        biblia de tono; qué se puede y no se puede decir
    ├── DISENO-JUEGO.md     las tres etapas, mecánica por mecánica
    ├── PLAN-GRAFICO-CAMINO.md  El Camino en 3D: solución y arquitectura
    ├── ARQUITECTURA.md     decisiones técnicas y por qué
    ├── PROTOCOLO-JOYCON.md referencia del protocolo HID del Joy-Con
    ├── MODULO-MANDOS.md    gestor de mandos: diseño y verificación
    ├── MULTIJUGADOR.md     dos jugadores: cómo está hecho
    ├── ESTABILIDAD.md      por qué fallaba el mando tras la demo y cómo se prueba
    └── OPERACION-STAND.md  guion y checklist para el día del evento
```

Lo que sigue y el historial de cambios están en
[`docs/PLAN-DE-TRABAJO.md`](docs/PLAN-DE-TRABAJO.md).

---

## La restricción que definió la arquitectura

El equipo corporativo corre **Sophos Intercept X**, que bloquea la carga de
`SDL2.dll` por reputación. Es un falso positivo conocido con los paquetes de
pygame, y deja fuera a pygame, Godot, Love2D y cualquier motor que cargue
librerías nativas sin firma.

Por eso el proyecto es web: **Chrome habla HID directamente y no carga ninguna
DLL que Sophos pueda bloquear.** La decisión no fue estética, fue la única vía
que funciona hoy en este equipo sin depender de un ticket de TI.

El detalle completo del diagnóstico, con hashes y lo que hay que pedirle a TI
si algún día se quiere un motor nativo, está en
[`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

---

## Para agentes de IA

Si eres un agente trabajando en este repositorio, lee **[`AGENTS.md`](AGENTS.md)**
antes de tocar nada. Contiene las reglas del proyecto, en particular la regla de
oro narrativa, que es fácil de romper sin darse cuenta y difícil de detectar
revisando código.

---

## Autoría

Área de Auditoría de Control Interno — Coordinación de Analítica de Auditoría.
Gases del Caribe, 2026.

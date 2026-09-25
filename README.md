# TERRA INCÓGNITA

**Una expedición al interior de la compañía.**

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
| 3 · El Regreso | estilo *Flappy Bird* | 1 o 2 | Informe, recomendaciones y seguimiento | **Jugable** |

La Dirección de Auditoría aprobó el demo de la Etapa 1 el 21 de septiembre de
2026. El recorrido se condensó entonces de seis etapas a tres.

**La Etapa 2, El Camino**, recorre la cadena del gas de punta a punta (El
Manantial → Los Ramales → La Montaña Perdida → El Gran Caudal → La Represa).
Se recogen **datos crudos**, con el gatillo se **analizan** y aparece lo que
estaba escondido; los carteles «✓ Todo en orden» suman poco y las excusas son
muros. Cierra con un tablero por estación y la revelación: sacamos la
información directo de la fuente, la analizamos con Power BI, recorremos el
proceso completo, y lo escondido se llama **hallazgo**. Dos jugadores corren el
mismo camino a pantalla partida.

La Etapa 1 tiene dos partes, cada una con su pantalla de instrucciones:
**explorar** el mapa a oscuras con la linterna (60 s) y **decidir** a dónde
mandar cinco equipos entre catorce lugares (45 s). Al apuntar a un lugar sale
una ficha con lo que hay ahí. Cierra explicando qué se te escapó y por qué
importaba.

Cada lugar es un guiño al proceso que representa, y la gracia está en el
cierre: *El Gran Caudal* era facturación, *La Montaña Perdida* era pérdida no
operacional, *Los Grandes Hornos* era Gran Industria. La tabla completa está en
[`docs/NARRATIVA.md`](docs/NARRATIVA.md).

**Uno de los catorce está fuera del mapa** y casi nadie lo encuentra: *La Isla
Brillante*, es decir Brilla, el negocio que no es gas. Lo que una compañía no
mira porque "no es lo nuestro" suele ser lo que menos control tiene — y ese
mensaje aparece al final aunque el visitante nunca llegue hasta allá.

El diseño de las tres etapas está en [`docs/DISENO-JUEGO.md`](docs/DISENO-JUEGO.md).

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
3. Se abre Chrome. Pulsa **Conectar Joy-Con** y elígelo en la lista.
4. Para salir, cierra la ventana negra del servidor.

> **Importante:** no abras `index.html` haciendo doble clic sobre el archivo.
> WebHID solo funciona en un contexto seguro y `file://` no lo es. Por eso
> existe `abrir.cmd`, que sirve la página desde `localhost`.

Si el Joy-Con falla en pleno evento, el botón **Continuar con ratón** deja la
experiencia jugable. Es una red de seguridad deliberada, no un descuido.

### Atajos

| Tecla | Acción |
|---|---|
| `F` | Pantalla completa |
| `F9` | Panel de mandos del operador: asignar Jugador 1 y Jugador 2 |
| `P` | Sala de prueba de dos jugadores |
| `1` / `2` / `3` | Saltar a una etapa (para ensayar) |
| `0` | Ver la pantalla del recorrido |
| `M` | Silenciar la música |
| `C` | Calibrar el giroscopio (deja el mando quieto un segundo) |
| `R` | Recentrar el puntero |
| `Esc` | Volver al inicio |

La música y los sonidos se generan con Web Audio en el momento: no hay
archivos de audio que descargar ni que puedan faltar.

En el mando: **ZR/ZL** confirma, **HOME/CAPTURA** recentra la mira. En las
instrucciones de El Camino, **el Jugador 2 se une pulsando cualquier botón**
del otro Joy-Con.

---

## Estructura

```
terra-incognita/
├── index.html              página y capa de enlace del mando
├── abrir.cmd               lanzador del stand
├── package.json            solo declara módulos ES; sin dependencias
├── src/
│   ├── main.js             punto de entrada: enlaza mando y arranca el motor
│   ├── core/
│   │   ├── joycon.js       driver WebHID: protocolo, IMU, vibración
│   │   ├── input.js        puntero por giroscopio y acciones con nombre
│   │   ├── engine.js       bucle, lienzo y máquina de escenas
│   │   ├── render.js       paleta, tipografía y ayudantes de dibujo
│   │   ├── audio.js        música y efectos sintetizados, sin archivos
│   │   ├── briefing.js     pantallas de instrucciones que se miden solas
│   │   └── mandos.js       inventario, batería y cambio de mando en caliente
│   ├── ui/
│   │   └── panel-mandos.js panel del operador (F9)
│   ├── datos/
│   │   └── territorio.js   los catorce lugares y la lógica de evaluación
│   ├── juego/camino3d/     la vista 3D de El Camino (Three.js)
│   │   ├── vista3d.js      render, cámaras y pantalla partida
│   │   ├── escenario.js    camino, tuberías, casas, palmeras, horizonte
│   │   ├── objetos.js      datos, carteles, muros, lo escondido, arcos
│   │   └── explorador.js   el personaje y su animación
│   └── juego/
│       ├── carrera.js      lógica pura de El Camino: generador y reglas
│       ├── vuelo.js        lógica pura de El Regreso: física y cielo
│       └── escenas/
│           ├── intro.js        apertura
│           ├── mapa.js         ETAPA 1 — El Mapa
│           ├── camino.js       ETAPA 2 — El Camino (1 o 2 jugadores)
│           ├── regreso.js      ETAPA 3 — El Regreso (1 o 2 jugadores)
│           ├── ruta.js         la pantalla entre etapa y etapa
│           ├── cierre.js       la revelación y el recorrido completo
│           └── prueba2j.js     sala de prueba de dos jugadores (tecla P)
├── vendor/
│   └── three.module.min.js la única librería: Three.js r161, copiada, con su licencia
├── assets/                 imágenes del juego, ya procesadas
│   └── originales/         las que salen de la IA, sin tocar
├── herramientas/
│   ├── prueba-webgl.html   ¿puede este equipo con 3D? (fase G0)
│   ├── procesar-imagenes.py deja las imágenes listas para el juego
│   ├── vista-escena.html   ver una pantalla suelta, sin jugar hasta ella
│   └── joycon-lab/         banco de pruebas del mando, aparte del juego
├── assets/
│   └── originales/         imágenes generadas con IA, sin procesar
├── tests/
│   ├── entrada.test.js     estabilidad del mando, simulado
│   ├── captura.test.js     lo mismo con grabaciones del mando real
│   ├── multijugador.test.js ranuras, pantalla partida, independencia
│   ├── camino.test.js      equilibrio y justicia de El Camino
│   ├── regreso.test.js     equilibrio y justicia de El Regreso
│   ├── camino3d.test.js    la escena 3D, construida y corrida sin navegador
│   ├── humo.test.js        juega las escenas enteras sobre un lienzo falso
│   ├── captura.py          graba el mando (grabar-mando.cmd lo lanza)
│   └── capturas/           las grabaciones
└── docs/
    ├── ARRANQUE-EN-OTRO-EQUIPO.md  cómo ponerlo a andar en otra máquina
    ├── PLAN-DE-TRABAJO.md  ← EMPIEZA AQUÍ: estado, qué sigue, decisiones pendientes
    ├── PLAN-GRAFICO-CAMINO.md  El Camino en 3D: solución, arquitectura, fases
    ├── ACTIVOS-VISUALES.md imágenes con IA: catálogo y prompts
    ├── ARQUITECTURA.md     decisiones técnicas y por qué
    ├── NARRATIVA.md        biblia de tono; qué se puede y no se puede decir
    ├── DISENO-JUEGO.md     las tres etapas, mecánica por mecánica
    ├── PROTOCOLO-JOYCON.md referencia del protocolo HID del Joy-Con
    ├── MODULO-MANDOS.md    gestor de mandos: diseño y verificación
    ├── MULTIJUGADOR.md     dos Joy-Con compitiendo: cómo está hecho
    ├── ESTABILIDAD.md      por qué fallaba el mando tras la demo y cómo se prueba
    └── OPERACION-STAND.md  guion y checklist para el día del evento
```

## Lo siguiente

El **gestor de mandos** ya está: cambio en caliente sin recargar, vigilancia de
batería con avisos que nunca interrumpen una partida, y diagnóstico con F9.
Ver [`docs/MODULO-MANDOS.md`](docs/MODULO-MANDOS.md).

El **modo de dos jugadores** también: dos Joy-Con a la vez, pantalla partida y
cambio en caliente por jugador, medido con los mandos reales. Ver
[`docs/MULTIJUGADOR.md`](docs/MULTIJUGADOR.md).

**La Etapa 2, El Camino**, está jugable con uno o dos jugadores, probada por
el usuario en Chrome con dos Joy-Con.

**Lo que sigue, en orden, está en
[`docs/PLAN-DE-TRABAJO.md`](docs/PLAN-DE-TRABAJO.md):** la ruta de etapas entre
etapa y etapa, **El Regreso** (*Flappy Bird* de dos jugadores: los hallazgos
se llevan de vuelta y se verifica que cambiaron) y **El Camino en 3D** con
Three.js ([`docs/PLAN-GRAFICO-CAMINO.md`](docs/PLAN-GRAFICO-CAMINO.md)), con
imágenes generadas con IA ([`docs/ACTIVOS-VISUALES.md`](docs/ACTIVOS-VISUALES.md)).

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

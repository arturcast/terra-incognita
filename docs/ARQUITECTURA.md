# Arquitectura

## La decisión que lo condicionó todo

El proyecto es una página web que corre en Chrome y habla con el Joy-Con por
WebHID. No es la elección obvia para un juego, y no se tomó por preferencia.

### Qué pasó

Al preparar el entorno se intentó el camino natural: Python con `pygame`. La
instalación funcionó pero el módulo no cargaba:

```
ImportError: DLL load failed while importing base: Acceso denegado.
```

El diagnóstico descartó, en orden:

| Hipótesis | Cómo se descartó |
|---|---|
| Permisos de archivo | Las ACL de `SDL2.dll` y `freetype.dll` son idénticas; la segunda carga bien |
| Marca de zona por descarga | Ningún archivo tenía flujo `Zone.Identifier` |
| Firma digital | Las tres DLL están sin firmar, y una de ellas sí carga |
| Bloqueo por ruta | Copiada a otra carpeta, `SDL2.dll` sigue fallando |
| Smart App Control | Desactivado (`VerifiedAndReputablePolicyState = 0`) |
| AppLocker / WDAC en modo usuario | Sin política; `UsermodeCodeIntegrityPolicyEnforcementStatus = 0` |

Lo que quedó: **Sophos Intercept X** (gestionado por la empresa) bloquea
`SDL2.dll` por reputación. El bloqueo sigue al archivo, no a la ruta. Windows
Defender está cedido a Sophos y ni siquiera responde (`0x800106ba`).

### Archivos afectados

```
SDL2.dll         520D0459B91EFA32FBCCF9027A9CA1FC5AAE657E679CE8E90F179F9CF5AFD279
SDL2_image.dll   1E364AF75FEE0C83506FBDFD4D5B0E386C4E9C6A33DDBDDAC61DDB131E360194
SDL2_mixer.dll   2A0FC5E9F72C2EAEC3240CB82B7594A58CCDA609485981F256B94D0A4DD8D6F8
SDL2_ttf.dll     FCDFABDFCE868EB33F7514025FF59C1BB6C418F1BCD6ACE2300A9CD4053E1D63
```

Equipo: `GCP31740` · `GASCARIBE\artcas` · Windows 11 Enterprise.

### Qué implica

Quedan descartados pygame, Godot, Love2D, raylib y cualquier motor que cargue
librerías nativas sin firma. No es un problema de pygame: es un problema de
categoría.

### Si algún día se quiere un motor nativo

Hay que pedirle a TI, en Sophos Central, **las tres cosas** (no solo la
primera, porque el bloqueo viene de la protección en tiempo de ejecución, que
es un módulo distinto del antivirus clásico):

1. Exclusión de análisis sobre la carpeta de desarrollo.
2. Exclusión de *Exploit Mitigation* para el proceso `python.exe`.
3. Exclusión de detección de comportamiento sobre esa carpeta.

Conviene mover antes el proyecto a `C:\Dev\` y pedir la exclusión sobre esa
ruta: ningún administrador sensato excluye `AppData` completo.

### Por qué WebHID resuelve el problema

Chrome está firmado y aprobado corporativamente. Habla HID directamente desde
un proceso que Sophos ya confía. No se carga ninguna DLL nueva. El bloqueo
simplemente no aplica.

---

## Forma del sistema

```
index.html
   │  capa de enlace en HTML (WebHID exige un gesto del usuario,
   │  y un <canvas> no puede recibirlo con un botón)
   ▼
src/main.js ──────────── enlaza el mando, arma el motor, registra escenas
   │
   ├── core/joycon.js ── WebHID: subcomandos, reporte 0x30, IMU, vibración
   ├── core/input.js ─── Puntero (giroscopio → pantalla), Acciones, Sacudida
   ├── core/engine.js ── bucle con dt, lienzo con DPR, escenas con fundido
   ├── core/render.js ── paleta, tipografía, primitivas de dibujo
   ├── core/audio.js ─── música generativa y efectos, sin archivos
   └── core/briefing.js  pantallas de instrucciones que se miden solas
          │
          ▼
   juego/escenas/*.js ── intro · mapa (Etapa 1) · camino (Etapa 2) · cierre
   juego/carrera.js ──── lógica pura de El Camino, probada con Node
          │
          ▼
   datos/territorio.js ─ los catorce lugares, la costa y la evaluación
```

### Capas y su regla

**`core/` no sabe nada del juego.** No conoce regiones, ni auditoría, ni
expediciones. Es reutilizable tal cual para las demás etapas.

**`datos/` es puro.** No toca el DOM ni el lienzo. Por eso se puede ejecutar y
verificar con Node sin navegador, que es como se prueban la validez del mapa y
la lógica de puntuación.

**`juego/escenas/` es lo único que conoce la metáfora.** Cada etapa nueva es un
archivo aquí más su registro en `main.js`.

### Por qué una máquina de escenas y no rutas

La experiencia es lineal y dura diez o quince minutos sin tocar el teclado. No
hay navegación, no hay URLs que compartir, no hay estado que marcar. Una
máquina de escenas con fundido es exactamente lo que hace falta y cabe en
ciento veinte líneas.

El progreso entre etapas vive en `motor.expedicion`, que sobrevive a los
cambios de escena. Ahí se acumulan los puntajes de cada etapa
(`puntajes.mapa`, `puntajes.camino`); El Regreso usará los hallazgos de El
Camino.

---

## Decisiones menores, y por qué

**Lienzo único en vez de DOM.** El puntero se mueve a 60 Hz siguiendo el
giroscopio; animar posiciones con CSS a esa frecuencia pelea con el motor de
composición. Además la niebla necesita composición `destination-out`, que es
trivial en canvas e imposible en DOM.

**La niebla es un canvas a media resolución.** Perforar un gradiente radial 60
veces por segundo a resolución completa desperdicia relleno sin que se note la
diferencia: la niebla es difusa por definición.

**La cobertura explorada se mide en una rejilla de 72×42, no en píxeles.**
Contar píxeles del canvas de niebla exigiría leer datos de imagen cada frame,
que es la operación más cara que hay. Tres mil celdas dan una precisión de
sobra para una nota sobre cien.

**El respaldo de ratón está en cada escena, no en una capa aparte.** En un
evento, con gente esperando, un mando que se duerme no puede ser el final de la
demo. Cada escena comprueba `jc.estado.conectado` y cae al ratón sola.

**La costa se normaliza a un recuadro fijo.** La suma de senos que genera la
silueta no es simétrica, así que ajustar la escala a ojo dejaba la masa de
tierra descentrada y cortada por un borde. Normalizar el resultado a un
recuadro conocido elimina la constante mágica.

**El texto se mide antes de dibujarse.** La primera versión apilaba bloques con
coordenadas fijas y en cuanto creció una frase los títulos se montaron unos
sobre otros. Ahora `partirLineas()` devuelve las líneas reales, se suman las
alturas y solo entonces se decide dónde empieza el bloque. Está verificado que
los paneles de instrucciones caben hasta en 1280×720.

**La música se sintetiza, no se reproduce.** Web Audio genera notas dentro de
una escala en vez de repetir un bucle. Dos razones: no hay archivo que
descargar —la red del evento puede fallar y Sophos no tiene nada que bloquear—
y en un stand donde suena seis horas seguidas un bucle corto se vuelve
insoportable. Esto no se repite nunca exactamente igual.

**El audio es siempre opcional.** Web Audio puede no arrancar. Toda llamada va
protegida y el juego funciona idéntico en silencio.

---

## Rendimiento

Objetivo: 60 fps sostenidos en el portátil del stand.

Lo caro por frame es perforar la niebla y repintar catorce lugares con texto,
más la ficha flotante del lugar apuntado. Ni
de lejos es un problema en hardware de 2026, pero conviene saber dónde mirar si
algún día baja:

- `_perforar()` en `mapa.js` — un gradiente radial por frame.
- `grano()` en `render.js` — la textura se genera una vez y se cachea en
  `_texturaRuido`; si alguien la mueve dentro del bucle, se cae el rendimiento.
- El bucle de la rejilla de cobertura recorre solo el recuadro de la linterna, no
  las tres mil celdas.

---

## Qué falta para producción

- Todo lo pendiente está en `PLAN-DE-TRABAJO.md`. En lo técnico: la escena
  `ruta.js`, la Etapa 3 (`vuelo.js` + `regreso.js`, mismo patrón que
  `carrera.js` + `camino.js`) y la capa 3D de El Camino (`src/juego/camino3d/`
  sobre Three.js en `vendor/`, un lienzo WebGL debajo del lienzo 2D), descrita
  en `PLAN-GRAFICO-CAMINO.md` §5.
- Modo atracción: algo en bucle cuando no hay nadie jugando.
- Registro de partidas si se quiere una estadística del evento. Interesa sobre
  todo cuántos encuentran La Isla Brillante.
- Ajuste fino de la música por etapa cuando existan las tres.

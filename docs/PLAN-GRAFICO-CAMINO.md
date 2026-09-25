# Plan gráfico — El Camino en 3D

**Estado: construido el 2026-09-22.** G0 dio apto (Intel Iris Xe, WebGL 2 por
hardware), el usuario autorizó Three.js (D1) y las fases G1 a G8 están hechas:
Three.js en `vendor/`, escenario, objetos, explorador, estaciones, pantalla
partida, respaldo automático a 2D y las 19 imágenes integradas. Falta la
prueba en Chrome con los mandos y medir los fps reales. El detalle de lo
construido está en [`PLAN-DE-TRABAJO.md`](PLAN-DE-TRABAJO.md), ficha U4; lo
que sigue en este documento es el plan con el que se construyó.

---

## 1. Qué pidió el usuario

> Mejorar gráficamente el Subway Surfer. No pido una animación como el juego
> original, pero sí un juego más visual, mejor trabajado.

Referencia: un video de YouTube que trajo el usuario
(`youtube.com/watch?v=65C2dHtOGJg`), un *Subway Rush* hecho con **Three.js**.
Las capturas no se guardan en el repositorio por ser material de terceros; lo
que importaba de ellas está descrito en la tabla de abajo.

### Lo que hace que la referencia se vea bien

Mirando las capturas, no es detalle: es **3D de verdad con poco**.

| Rasgo | En la referencia | Por qué funciona |
|---|---|---|
| Cámara detrás y encima del personaje | Tercera persona, a ~3 m | Se ve al personaje correr: da identidad |
| Geometría *low-poly* de colores planos | Cajas, cilindros, sin texturas finas | Se lee al instante y cualquier tarjeta la mueve |
| Profundidad real | Edificios a los lados, niebla al fondo, cielo | La velocidad se *siente* |
| Sombras | Personaje y objetos proyectan sombra | Ancla los objetos al suelo |
| Elementos que pasan por encima | Pórticos, puentes | Marcan el ritmo de la velocidad |
| Objetos grandes y coloridos | Tren verde, barreras rayadas, monedas doradas | Se distinguen a distancia |
| Personaje animado | Brazos y piernas que se balancean | Vida con cuatro cajas |
| HUD mínimo | Puntos arriba a la izquierda, monedas arriba a la derecha | No tapa el juego |

Nuestra versión 2D tiene la mecánica; le falta todo lo de esta tabla.

---

## 2. La solución, en una frase

**Dibujar la pista con Three.js (WebGL) en un lienzo de fondo, y dejar encima
el lienzo 2D actual para textos, marcadores, instrucciones y tablero.** La
lógica del juego (`carrera.js`) no se toca: el 3D es solo otra forma de
dibujar el mismo estado.

```
 ┌───────────────────────────────────────────┐
 │  lienzo 2D (el de hoy, fondo transparente)│  ← HUD, avisos, briefing, tablero
 ├───────────────────────────────────────────┤
 │  lienzo WebGL (nuevo)                     │  ← pista, personaje, objetos
 └───────────────────────────────────────────┘
          ▲ lee cada fotograma
   Carrera (carrera.js) — sin cambios, sigue probada en Node
```

---

## 3. Qué se necesita usar

| Pieza | Qué es | Cómo entra al proyecto |
|---|---|---|
| **Three.js** (licencia MIT) | Librería 3D sobre WebGL, la más usada en la web | Un archivo, `vendor/three.module.min.js` (~700 KB), copiado **una vez** desde el paquete oficial, con su `LICENSE`. Se importa como cualquier módulo: `import * as THREE from '../../vendor/three.module.min.js'` |
| Chrome con aceleración gráfica | La tarjeta del equipo (Intel/NVIDIA/AMD) | Se comprueba con G0 |
| Modelos 3D | Hechos **por código** con primitivas (cajas, cilindros, conos) | Nada que descargar |
| Imágenes | Texturas, carteles, fondo lejano, figuras planas | Opcional: generadas con IA por el usuario. Catálogo y prompts en [`ACTIVOS-VISUALES.md`](ACTIVOS-VISUALES.md) |
| Textos sobre objetos (excusas en los muros, nombres de estación) | Se pintan con Canvas 2D sobre una textura (`CanvasTexture`) | Por código: la IA de imágenes escribe mal |

### Por qué Three.js es compatible con las reglas del proyecto

La regla «cero dependencias» (`AGENTS.md` §3) existe por tres motivos. Three.js
copiado en `vendor/` no choca con ninguno:

| Motivo de la regla | ¿Lo rompe Three.js en `vendor/`? |
|---|---|
| Sophos bloquea binarios nativos sin firma | No: es JavaScript que ejecuta Chrome, igual que nuestro código |
| La red del evento puede no dejar salir a un CDN | No: el archivo está dentro de la carpeta |
| Nada de npm ni paso de compilación | No: es un módulo ES listo; no se instala ni se compila nada |

Rompe la letra («ni librerías»), no la razón. Por eso requiere el sí del
usuario (D1) y, aprobada, se actualiza `AGENTS.md` §3 con la excepción
explícita: **Three.js en `vendor/`, versión fijada, y nada más**.

### Alternativas consideradas

| Opción | Resultado | Por qué no |
|---|---|---|
| Mejorar el 2D actual (pseudo-3D con más capas) | Mejor que hoy, lejos de la referencia | Es el plan B si G0 falla (§8) |
| WebGL a mano, sin librería | Igual que Three.js | Semanas reinventando lo que Three.js ya resuelve |
| Babylon.js / PlayCanvas | Similar | Más pesados; Three.js es la referencia del usuario |
| Unity / Godot exportado a web | Más bonito | Paso de compilación, binarios, editor que Sophos puede bloquear |

---

## 4. Cómo se verá — dirección de arte

Mismo lenguaje *low-poly* de la referencia, pero **nuestro**: el territorio del
mapa, la cadena del gas y el Caribe. Colores de `PALETA` (`src/core/render.js`)
para lo interactivo, y colores cálidos y claros para el entorno (a diferencia
de la Etapa 1, que es de noche: El Camino ocurre **de día**, ya se fue a ver).

### La pista

- **Tres carriles** sobre un camino de tierra clara con bordillos; entre
  carriles, **tuberías amarillas de gas** a ras de suelo (el amarillo es el
  color de la tubería de gas: lo reconoce cualquiera de la compañía). Cumplen
  el papel de los rieles de la referencia.
- **A los lados:** casas bajas de colores caribeños (cajas con techo), muros
  con paneles de color, palmeras (cilindro + hojas planas), postes con cables.
  Se generan por tramos y se reciclan.
- **Por encima, cada ~60 m:** pórticos de tubería (como los puentes de la
  referencia) que marcan el ritmo.
- **Fondo:** cielo degradado, sol, niebla que funde lo lejano, y una silueta
  lejana (plana, imagen) con el horizonte.

### Las cinco estaciones, cada una reconocible

Al entrar a una estación pasa un **gran arco** con su nombre (textura de
Canvas) y el entorno cambia de color y de elementos:

| Estación | Qué representa | Elementos | Color dominante |
|---|---|---|---|
| El Manantial | donde entra el gas | Tanques cilíndricos, válvulas grandes, agua | Azul claro |
| Los Ramales | por donde se reparte | Tubos que se bifurcan, zanjas, conos naranjas | Naranja obra |
| La Montaña Perdida | donde algo se pierde | Una montaña enorme al fondo, niebla más densa, tubos que desaparecen | Violeta grisáceo |
| El Gran Caudal | donde se mide y se cobra | Hileras de medidores de gas en las fachadas | Verde |
| La Represa | donde llega la plata | Muro de represa, compuertas, monedas en el agua | Dorado |

### Los objetos del juego

| Objeto | Hoy (2D) | En 3D |
|---|---|---|
| ◆ Dato crudo | Rombo azul | **Octaedro azul** girando, flotando; al recogerlo, destello y sube al medidor |
| Algo escondido | Rombo rojo con «!» | **Invisible** hasta analizar; al revelarse, **cristal rojo** grande con halo que late y una columna de luz hasta el cielo (se ve desde lejos) |
| Cartel ✓ | Cartel verde | **Letrero verde** con ✓ sobre un poste, brillante y limpio (a propósito: «todo en orden») |
| Muro de excusa | Rectángulo con texto | **Barrera rayada** (roja y blanca, como la referencia) con la excusa escrita en un cartel encima |
| Estación | Cartel | Arco con el nombre |
| Explorador | Figura | **Personaje *low-poly*** con casco de obra, chaleco y mochila; brazos y piernas se balancean; se inclina al cambiar de carril; tropieza al chocar |

### La lente (analizar)

El momento estrella. Al pulsar el gatillo:

1. Una **onda** azul sale del personaje hacia delante por el suelo.
2. La escena se tiñe un instante (como una capa de análisis) y aparecen
   **líneas de cuadrícula** sobre el camino (guiño a tablero de datos).
3. Lo escondido al alcance **emerge del suelo** con su columna de luz roja.

Esto vende «analizar» mejor que cualquier texto.

### Cámara y sensación de velocidad

- Tercera persona, detrás y arriba; sigue al carril con suavidad.
- El campo de visión se abre un poco al subir la velocidad.
- Sacudida corta al chocar; pequeño salto de cámara al atrapar un hallazgo.
- Líneas de velocidad sutiles a los lados en el último tramo.

### Dos jugadores

Una sola escena 3D, **dos cámaras**: cada una se pinta en su mitad
(`renderer.setViewport` + `setScissor`). Como los dos corren el mismo camino,
los objetos son los mismos; lo único que difiere es qué recogió o reveló cada
uno, y eso se ajusta antes de pintar cada mitad. El segundo explorador lleva
el color del Jugador 2 (`COLOR_J`).

---

## 5. Arquitectura

```
src/
├── juego/carrera.js            SIN CAMBIOS — el estado y las reglas
├── juego/escenas/camino.js     decide qué vista usar; HUD, tablero y revelación siguen en 2D
└── juego/camino3d/             NUEVO — solo dibuja, no decide nada
    ├── vista3d.js              clase Vista3D: crea el renderer, sincroniza con Carrera, pinta 1 o 2 mitades
    ├── escenario.js            suelo, carriles, tuberías, cielo, niebla, luces, entorno por tramos
    ├── estaciones.js           arcos y decorado de cada estación
    ├── objetos.js              mallas de dato, oculto, control, muro; reserva (pool) reciclable
    ├── explorador.js           personaje y su animación por código
    ├── efectos.js              lente, destellos, partículas, sacudida
    └── texturas.js             CanvasTexture de textos + carga de imágenes de assets/
vendor/
└── three.module.min.js + LICENSE
assets/                         imágenes (opcionales), ver ACTIVOS-VISUALES.md
```

**Reglas:**

1. `camino3d/` **lee** la `Carrera`; nunca la modifica. Si una regla del juego
   cambia, cambia en `carrera.js` y sus pruebas.
2. **Nada se crea por fotograma.** Mallas, materiales y texturas se crean al
   entrar y se reciclan (los objetos que quedan atrás vuelven a la reserva). Es
   el error de rendimiento más común en Three.js.
3. **Presupuesto:** ≤ 150 llamadas de dibujo por mitad; `InstancedMesh` para
   lo repetido (datos, durmientes, casas); una sola luz con sombra, o sombras
   de disco (círculo oscuro bajo cada objeto), que son casi gratis;
   `pixelRatio` máximo 1,5.
4. **Respaldo automático:** si WebGL no arranca, o si la media baja de 40 fps
   durante 3 s, la escena vuelve a la vista 2D actual sin interrumpir la
   carrera. La vista 2D se conserva, no se borra.
5. `camino3d/` se importa **dinámicamente** (`await import(...)`) solo en el
   navegador: las pruebas de Node siguen corriendo con la vista 2D y no
   necesitan WebGL.
6. Las imágenes de `assets/` son **opcionales**: si falta una, se usa el
   color plano o la figura por código. El juego nunca depende de que exista
   una imagen.

---

## 6. Fases de construcción

| Fase | Entrega | Criterio de aceptación |
|---|---|---|
| G0 | Prueba de WebGL (`herramientas/prueba-webgl.html`) | Veredicto «apto» en el equipo del stand |
| G1 | Three.js en `vendor/`, `AGENTS.md` actualizado | Página mínima con un cubo girando servida por `servidor.py`; ninguna petición a internet (pestaña Red de Chrome) |
| G2 | Pista, entorno y cámara, 1 jugador, sin objetos | 60 fps en el equipo del stand a 1920×1080; la velocidad se siente |
| G3 | Objetos desde `Carrera`, con reserva | Lo que se ve coincide con lo que `carrera.js` resuelve (mismo carril, mismo instante); `camino.test.js` sin cambios y en verde |
| G4 | Explorador animado, lente y efectos | El usuario reconoce el «analizar» sin leer el briefing |
| G5 | Estaciones temáticas y arcos | Cada estación se distingue en una captura de pantalla |
| G6 | Pantalla partida con dos cámaras | ≥ 50 fps con dos jugadores en el equipo del stand |
| G7 | Respaldo 2D automático | Forzando la falla (bandera de prueba), la carrera sigue en 2D sin error |
| G8 | Imágenes de IA integradas (si el usuario las genera) | Cada imagen de `ACTIVOS-VISUALES.md` marcada «integrada» se ve en su sitio |

Cada fase termina con la batería completa en verde y una prueba del usuario en
Chrome con los mandos.

---

## 7. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| La tarjeta gráfica del equipo no da (o Chrome la tiene bloqueada) | Media | G0 antes de todo; respaldo 2D (regla 4); pedir a TI la aceleración |
| Ir lento con dos jugadores (se pinta dos veces) | Media | Presupuesto de la regla 3; medir en G6; bajar sombras y `pixelRatio` |
| Mareo con cámara muy movida | Baja | Movimientos suaves; nada de balanceo de cámara continuo |
| Que el 3D tape la lección | Media | Lo escondido y la lente son lo más llamativo de la escena, no el decorado |
| Una actualización de Three.js rompa algo | Baja | Versión fijada en `vendor/`; no se actualiza sin motivo |

---

## 8. Plan B: si G0 dice «no apto»

Mejorar el 2D actual sin librerías, tomando de la referencia lo que se puede
en 2D: cielo y horizonte con edificios en capas (paralaje), bordes de pista
con casas que pasan, sombras bajo los objetos, objetos como imágenes
(`ACTIVOS-VISUALES.md`, variante «figura plana»), personaje visto de espaldas
con animación de dos cuadros, y la onda de la lente. Se ve bastante mejor que
hoy, aunque no alcanza la referencia.

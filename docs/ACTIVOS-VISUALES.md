# Activos visuales — imágenes generadas con IA

Catálogo de las imágenes que el usuario puede generar con una IA de imágenes
(ChatGPT, Copilot/Designer, Gemini, Midjourney…) para El Camino en 3D
([`PLAN-GRAFICO-CAMINO.md`](PLAN-GRAFICO-CAMINO.md)), El Regreso y la ruta de
etapas ([`PLAN-DE-TRABAJO.md`](PLAN-DE-TRABAJO.md), U2 y U3).

**Ninguna es obligatoria.** El juego se construye primero con figuras hechas
por código; cada imagen que llega mejora una pieza y, si falta, no se nota que
faltó. Así el trabajo gráfico nunca bloquea el trabajo del juego.

---

## 1. Qué hace bien la IA y qué no

| Sí sirve para | No sirve para |
|---|---|
| Fondos y horizontes | **Texto**: la IA escribe mal las letras. Las excusas, los nombres de estación y todo lo escrito se pintan por código |
| Texturas que se repiten (tierra, fachadas, agua) | **Logos** de la compañía: se usan los oficiales de Comunicaciones, nunca uno inventado |
| Figuras planas (palmera, nube, arbusto) | Animaciones de varios cuadros coherentes entre sí: se animan por código (ver la paloma, §5) |
| Iconos (dato, hallazgo, ✓) | Modelos 3D: el explorador y la pista se modelan por código; la imagen del personaje sirve como **guía de diseño** |
| Personajes 2D para El Regreso | Personas reales reconocibles |

---

## 2. Reglas técnicas para todas las imágenes

1. **Formato PNG.** Si la herramienta ofrece **fondo transparente**, úsalo
   (ChatGPT lo hace si se pide). Si no, **fondo verde puro (#00FF00)**: se
   quita después con un script. Nunca fondo blanco para objetos (el blanco
   se come los bordes claros).
2. **Un objeto por imagen**, centrado, entero, con margen alrededor. Nada
   cortado por el borde.
3. **Cuadrada, 1024×1024**, salvo que la ficha diga otra cosa.
4. **Sin texto, sin letras, sin números, sin marcas de agua, sin logos.**
5. **Mismo estilo en todo**: empieza cada prompt con el bloque de estilo
   (§3). Genera todas en **la misma conversación** y, cuando tengas la
   primera que te guste, adjúntala como referencia: *«same style as the
   attached image»*.
6. Guarda cada imagen en `terra-incognita/assets/originales/` con **el nombre
   exacto de la ficha**. El agente las procesa (quitar fondo, recortar,
   escalar, optimizar) y las deja en `assets/`.
7. Marca en la tabla del §7 cuáles generaste.

Los prompts van en **inglés** porque casi todas estas herramientas responden
mejor así. La descripción en español dice qué debe verse; si el resultado no
coincide con la descripción, repite.

---

## 3. Bloques de estilo (copiar al inicio de cada prompt)

**Estilo A — objetos y personajes 3D** (El Camino, iconos):

```
Low-poly 3D game asset, stylized, flat shading, simple chunky geometric shapes,
bright saturated Caribbean colors, soft even lighting, three-quarter view from
slightly above, single object centered with generous margin, isolated on a
plain pure green #00FF00 background (or transparent), no text, no letters, no
numbers, no logo, no watermark, no ground shadow.
```

**Estilo B — texturas repetibles:**

```
Seamless tileable texture, top-down orthographic view, stylized low-poly game
art, flat colors with subtle variation, no perspective, no text, no logo, no
watermark, even lighting with no shadows, edges must tile perfectly.
```

**Estilo C — fondos lejanos:**

```
Stylized low-poly game background, flat shading, soft atmospheric haze,
bright Caribbean daylight, warm sky, simple geometric shapes, no people, no
text, no logo, no watermark, wide panoramic composition.
```

**Estilo D — El Regreso (2D, estilo Flappy Bird):**

```
2D mobile game sprite, cute cartoon style like classic Flappy Bird, bold
clean outlines, flat vibrant colors with simple shading, side view, single
object centered, isolated on a plain pure green #00FF00 background (or
transparent), no text, no letters, no logo, no watermark.
```

---

## 4. El Camino (Etapa 2)

### 4.1 Personaje

#### C-01 · `camino-explorador-guia.png` — Prioridad ALTA
**Qué es:** el explorador que corre. Se modela en 3D por código; esta imagen
es la **guía de diseño** (proporciones, colores, accesorios).
**Descripción:** persona joven de cuerpo cuadrado tipo juguete, casco de obra
amarillo, chaleco reflectivo naranja, camisa azul, pantalón oscuro, botas,
mochila grande con una antena pequeña y una tableta en la mano. Vista de
frente, de espaldas y de lado en la misma imagen.
**Tamaño:** 2048×1024 (horizontal).

```
[Estilo A] Character turnaround sheet of a friendly blocky low-poly field
explorer, like a toy figure: yellow hard hat, orange high-visibility vest over
a blue shirt, dark trousers, brown boots, large backpack with a small antenna,
holding a tablet. Three views side by side: front, back, and side. Neutral
standing pose, arms slightly away from the body. Simple cube-based proportions,
big head. Wide 2:1 image.
```

#### C-02 · `camino-explorador-j2-guia.png` — Prioridad MEDIA
Igual que C-01 pero para el Jugador 2: mismo diseño, chaleco **azul claro** y
casco **blanco**. Adjunta C-01 y pide: *«same character, but light-blue vest
and white hard hat»*.

### 4.2 Objetos con los que se interactúa

(En 3D se modelan por código; estas imágenes sirven para el **HUD**, el
**tablero**, la **revelación** y el **plan B 2D**.)

#### C-10 · `obj-dato.png` — Prioridad ALTA
**Qué es:** ◆ un dato crudo. Se recoge a montones.
**Descripción:** gema octaédrica azul brillante, facetada, con un pequeño
destello; transmite «información pura».

```
[Estilo A] A glowing blue octahedron crystal gem, faceted low-poly, slightly
translucent with an inner light, small sparkle, floating.
```

#### C-11 · `obj-oculto.png` — Prioridad ALTA
**Qué es:** lo escondido, ya revelado (en la revelación se llama hallazgo). Es
lo más importante de la etapa: tiene que llamar la atención.
**Descripción:** cristal rojo grande y puntiagudo emergiendo de una grieta del
suelo, con halo rojo y un signo de exclamación **hecho de luz** (sin letras).

```
[Estilo A] A large jagged red crystal cluster bursting out of a small crack in
the ground, intense red glow and halo, a vertical beam of red light rising
from it, dramatic and important-looking, low-poly facets.
```

#### C-12 · `obj-control.png` — Prioridad ALTA
**Qué es:** cartel «✓ Todo en orden»: lo que el proceso dice de sí mismo. Se
ve impecable a propósito.
**Descripción:** letrero verde brillante, limpio y perfecto, sobre un poste,
con un gran visto bueno blanco (✓ es un símbolo, no texto).

```
[Estilo A] A shiny spotless green road sign on a metal pole with a large white
check mark symbol on it, perfectly clean and neat, slightly too perfect, no
letters.
```

#### C-13 · `obj-muro.png` — Prioridad ALTA
**Qué es:** muro de excusa. El texto de la excusa se pinta encima por código,
así que el cartel va **en blanco**.
**Descripción:** barrera de obra rayada roja y blanca sobre dos patas, con un
cartel blanco vacío encima.

```
[Estilo A] A road construction barrier with diagonal red and white stripes on
two sturdy legs, with an empty blank white rectangular sign mounted on top,
no writing on the sign.
```

#### C-14 · `obj-lente.png` — Prioridad MEDIA
**Qué es:** el icono de «analizar» (botón del HUD).
**Descripción:** lupa futurista azul con un pequeño gráfico de barras dentro.

```
[Estilo A] A futuristic blue magnifying glass with a tiny glowing bar chart
visible inside the lens, holographic feel.
```

### 4.3 Entorno

#### C-20 · `tex-camino-tierra.png` — Prioridad MEDIA
Tierra clara compactada del camino, con piedritas.
```
[Estilo B] Light packed sandy dirt road surface with a few small pebbles and
subtle tire marks, warm beige tones.
```

#### C-21 · `tex-fachada-caribe.png` — Prioridad MEDIA
Fachada de casa caribeña para las casas de los lados. **Genera 3 variantes**
(`-1`, `-2`, `-3`) cambiando el color: turquesa, amarillo mango, rosa coral.
```
[Estilo B] Front facade of a simple Caribbean house wall, painted turquoise
stucco, one window with white frame and wooden shutters, a small door, front
view, flat, fills the entire image.
```

#### C-22 · `tex-muro-paneles.png` — Prioridad BAJA
Muro lateral de concreto con paneles de colores abstractos (como la
referencia), sin letras ni grafiti legible.
```
[Estilo B] Grey concrete wall with a few abstract colorful rectangular paint
panels in magenta, lime green and orange, no letters, no graffiti words.
```

#### C-23 · `fig-palmera.png` — Prioridad MEDIA
Palmera *low-poly* para los lados del camino (se usa como figura plana que
siempre mira a la cámara).
```
[Estilo A] A single low-poly coconut palm tree, slightly curved trunk, bright
green fronds, full tree visible from base to top, front view.
```

#### C-24 · `fondo-horizonte.png` — Prioridad ALTA
**Qué es:** lo que se ve al fondo, detrás de la niebla, en todo el recorrido.
**Descripción:** horizonte costero caribeño: cielo claro, sol, colinas suaves,
una ciudad baja lejana con algún edificio alto, torres de tanques de gas y un
río ancho. **Tamaño:** 4096×1024 (4:1).
```
[Estilo C] Distant horizon panorama of a Caribbean riverside city at midday:
clear light-blue sky with a few soft clouds, bright sun, low coastal hills, a
low city skyline with a few tall buildings, cylindrical gas storage tanks, a
wide river. Seen from far away, hazy. Very wide 4:1 image, the lower third
left mostly flat and simple.
```

### 4.4 Estaciones (una imagen por estación)

Se usan como **fondo lejano** de cada estación (sustituyen al horizonte
genérico mientras se recorre ese tramo) y como ilustración en el tablero.
**Tamaño:** 2048×1024. Prioridad **MEDIA**. Sin texto: el nombre lo pone el
juego.

| Archivo | Estación | Prompt (tras el Estilo C) |
|---|---|---|
| `est-manantial.png` | El Manantial — donde entra el gas | `A gas intake station by a river: large blue cylindrical tanks, big valves and pipes coming out of the ground, water springs, fresh morning light, blue dominant palette.` |
| `est-ramales.png` | Los Ramales — por donde se reparte | `A network of yellow gas pipes branching in many directions across a neighborhood under construction, trenches, orange traffic cones, excavators in the distance, orange dominant palette.` |
| `est-montana.png` | La Montaña Perdida — donde algo se pierde | `A huge mysterious mountain rising in thick fog, yellow pipes entering the mountain and disappearing, eerie but friendly atmosphere, purple-grey dominant palette.` |
| `est-caudal.png` | El Gran Caudal — donde se mide y se cobra | `A colorful Caribbean street where every house facade has rows of small gas meters with dials, neat and busy, green dominant palette.` |
| `est-represa.png` | La Represa — donde llega la plata | `A big concrete dam with open gates, golden light reflecting on the water, a few gold coins glinting in the stream, warm golden dominant palette.` |

---

## 5. El Regreso (Etapa 3, estilo Flappy Bird)

Aquí las imágenes **sí son el juego**: es 2D. Prioridad **ALTA** para todo lo
de esta sección, excepto donde se diga.

#### R-01 · `regreso-paloma-cuerpo.png`
**Qué es:** la paloma mensajera que lleva de vuelta lo encontrado.
**Descripción:** paloma redondita y simpática, gris azulada, con un pequeño
morral cruzado donde asoma un sobre, ojos grandes y decididos, de perfil
mirando a la derecha, **sin alas** (el ala va aparte para animarla).
```
[Estilo D] A cute round carrier pigeon, blue-grey feathers, big determined
eyes, small orange beak, wearing a tiny messenger bag across its body with an
envelope sticking out, side view facing right, WITHOUT wings (wings will be
added separately), compact and round like Flappy Bird.
```

#### R-02 · `regreso-ala.png`
**Qué es:** el ala, que el juego hace aletear rotándola.
```
[Estilo D] A single cartoon pigeon wing, blue-grey feathers with lighter tips,
side view, extended flat, the attachment point on the left side.
```
**Nota:** si la herramienta no logra la paloma sin alas, genera la paloma
completa con las **alas arriba** y otra con las **alas abajo** (misma
conversación, misma paloma): `regreso-paloma-arriba.png` y
`regreso-paloma-abajo.png`.

#### R-03 · `regreso-paloma-j2.png`
La misma paloma para el Jugador 2: plumas **café claro**, morral **azul**.
Adjunta R-01: *«same pigeon, light-brown feathers and a blue bag»*.

#### R-10 · `regreso-columna.png`
**Qué es:** la columna que hay que esquivar (en Flappy son tubos verdes; aquí,
**tubería amarilla de gas**, que encaja con la compañía). La excusa se pinta
encima por código.
**Tamaño:** 256×1024 (vertical).
```
[Estilo D] A tall vertical yellow gas pipe section with a wider flange cap at
the top end, industrial but cartoonish, bold outline, fills the image height,
front view. Tall narrow 1:4 image.
```

#### R-11 · `regreso-aro.png`
**Qué es:** aro dorado en el hueco de algunas columnas. Atravesarlo entrega un
sobre (en la revelación: una recomendación).
```
[Estilo D] A shiny golden ring hoop seen from the side slightly angled, glowing,
with small sparkles, like a collectible in a mobile game.
```

#### R-12 · `regreso-sobre.png`
**Qué es:** el sobre que lleva la paloma (en la revelación: el informe). Se
usa en el HUD para contar cuántos lleva.
```
[Estilo D] A small cream-colored paper envelope sealed with a red wax seal,
slightly tilted, cartoon.
```

#### R-13 · `regreso-puesto-control.png`
**Qué es:** el puesto de control cada ~15 s (seguimiento).
```
[Estilo D] A small checkpoint post: a wooden pole with a green flag and a
round lamp on top, standing on a little grass mound, cartoon.
```

#### R-20 · `regreso-fondo-cielo.png` — 2048×1024
Capa más lejana: cielo de tarde con nubes suaves.
```
[Estilo D] Side-scrolling game background layer: warm afternoon sky gradient
from light blue to soft peach, a few fluffy cartoon clouds, nothing else, must
tile horizontally. Wide 2:1 image. Solid, no transparency.
```

#### R-21 · `regreso-fondo-ciudad.png` — 2048×1024
Capa media: silueta de ciudad costera caribeña con palmeras, el río, casas de
colores. Fondo transparente o verde arriba (se superpone al cielo).
```
[Estilo D] Side-scrolling game background layer: silhouette of a colorful low
Caribbean riverside city with palm trees, small houses, a few taller buildings
and gas tanks, occupying the lower half, the upper half empty pure green
#00FF00, must tile horizontally. Wide 2:1 image.
```

#### R-22 · `regreso-suelo.png` — 1024×256
Capa del suelo que se desplaza: franja de pasto y tierra.
```
[Estilo D] Side-scrolling game ground strip: bright green grass top edge over
light brown striped soil, must tile horizontally. Wide 4:1 image. Solid, no
transparency.
```

---

## 6. Ruta de etapas (U2) — Prioridad MEDIA

Tres iconos, uno por etapa, en el mismo estilo (Estilo A), para las tres
paradas de la ruta:

| Archivo | Etapa | Prompt (tras el Estilo A) |
|---|---|---|
| `ruta-mapa.png` | El Mapa | `A rolled-open treasure-style map with a small glowing flashlight lying on it, five small colored flag pins on the map.` |
| `ruta-camino.png` | El Camino | `A dirt path going into the distance between yellow gas pipes, with a glowing blue gem and a red crystal on the path.` |
| `ruta-regreso.png` | El Regreso | `A cute carrier pigeon flying carrying an envelope, passing through a golden ring.` |

Y el fondo de la pantalla:

#### U-01 · `ruta-fondo.png` — 2048×1152 (16:9)
```
[Estilo C] Top-down view of a stylized adventure map on warm parchment, a
winding dotted trail crossing it from left to right with three empty round
clearings along it (for three stops), subtle terrain drawings, no text, no
labels, no compass letters.
```

---

## 7. Estado de cada imagen

El usuario marca «generada» al dejarla en `assets/originales/`; el agente
marca «integrada» cuando la ve en el juego.

**Las 19 imágenes de El Camino están integradas en la escena 3D** (procesadas
con `python herramientas/procesar-imagenes.py`, que las deja en `assets/`).
Llegaron el 2026-09-22 y son coherentes entre
sí. Dos observaciones para quien las integre: el explorador del Jugador 2 se
distingue por el **casco blanco** (el chaleco quedó naranja como el del
Jugador 1), y las cinco imágenes de estación son ilustraciones completas, así
que se usan como **fondo lejano** detrás de la niebla, no como decorado
cercano. Faltan solo las de El Regreso (R-*) y las de la ruta (U-*).

| Id | Archivo | Prioridad | Estado |
|---|---|---|---|
| C-01 | `camino-explorador-guia.png` | Alta | **Integrada** 2026-09-22 |
| C-02 | `camino-explorador-j2-guia.png` | Media | **Integrada** 2026-09-22 |
| C-10 | `obj-dato.png` | Alta | **Integrada** 2026-09-22 |
| C-11 | `obj-oculto.png` | Alta | **Integrada** 2026-09-22 |
| C-12 | `obj-control.png` | Alta | **Integrada** 2026-09-22 |
| C-13 | `obj-muro.png` | Alta | **Integrada** 2026-09-22 |
| C-14 | `obj-lente.png` | Media | **Integrada** 2026-09-22 |
| C-20 | `tex-camino-tierra.png` | Media | **Integrada** 2026-09-22 |
| C-21 | `tex-fachada-caribe-1/2/3.png` | Media | **Integrada** 2026-09-22 |
| C-22 | `tex-muro-paneles.png` | Baja | **Integrada** 2026-09-22 |
| C-23 | `fig-palmera.png` | Media | **Integrada** 2026-09-22 |
| C-24 | `fondo-horizonte.png` | Alta | **Integrada** 2026-09-22 |
| C-3x | `est-*.png` (5) | Media | **Integrada** 2026-09-22 |
| R-01 | `regreso-paloma-cuerpo.png` | Alta | Pendiente |
| R-02 | `regreso-ala.png` | Alta | Pendiente |
| R-03 | `regreso-paloma-j2.png` | Alta | Pendiente |
| R-10 | `regreso-columna.png` | Alta | Pendiente |
| R-11 | `regreso-aro.png` | Alta | Pendiente |
| R-12 | `regreso-sobre.png` | Alta | Pendiente |
| R-13 | `regreso-puesto-control.png` | Alta | Pendiente |
| R-20 | `regreso-fondo-cielo.png` | Alta | Pendiente |
| R-21 | `regreso-fondo-ciudad.png` | Alta | Pendiente |
| R-22 | `regreso-suelo.png` | Alta | Pendiente |
| U-0x | `ruta-*.png` (4) | Media | Pendiente |

**Si solo hay tiempo para pocas:** las de El Regreso (R-01 a R-22) y
C-10/C-11/C-12/C-13/C-24. Son las que más cambian lo que se ve.

---

## 8. Para el agente: cómo procesar las imágenes

- Origen: `assets/originales/`. Destino: `assets/` con el mismo nombre.
- Quitar el fondo verde (#00FF00 ± tolerancia, con suavizado de borde y sin
  dejar halo verde), recortar al contenido con 8 px de margen, escalar al
  tamaño de uso (objetos a 256 o 512 px; texturas a potencia de dos; fondos a
  2048 de ancho como máximo) y guardar PNG optimizado.
- Python con Pillow está disponible en el equipo (verificado: Pillow 11.1).
  El script va en `herramientas/procesar-imagenes.py`.
- Cada imagen se carga de forma opcional (§5, regla 6 de
  `PLAN-GRAFICO-CAMINO.md`): si falta, se usa la figura por código.
- **Licencia:** anotar en este archivo con qué herramienta se generó cada
  imagen. El uso es interno (evento de la compañía).

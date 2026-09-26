# Cinemáticas

Videos cortos, sin diálogo ni texto, que cuentan la historia de la exploradora
mientras se juega. Se hacen con IA: **ChatGPT** dibuja los fotogramas clave en
estilo cómic y **Gemini / Google Flow (Veo)** anima entre uno y otro.

| Archivo | Cuándo sale | Mensaje |
|---|---|---|
| `inicio.mp4` | Tras poner los nombres, antes del recorrido | Nadie ha ido a mirar: alguien tiene que ir a ver con sus propios ojos |
| `mapa.mp4` | Antes de la Etapa 1 | No se puede revisar todo: se prioriza donde más riesgo hay |
| `camino.mp4` | Antes de la Etapa 2 | No basta con el manual: hay que ir a los datos y mirar lo escondido |
| `regreso.mp4` | Antes de la Etapa 3 | Lo encontrado sirve para corregir, y eso deja el camino más fácil |
| `final.mp4` | Al terminar la Etapa 3, antes del recuento | La auditoría deja las cosas mejor que como estaban (aquí ya directo) |

Van en `assets/cinematicas/`. MP4 (H.264), 1920×1080, **máximo 15 s**. Si falta
uno, el juego sigue sin él. Mientras suena, la música del juego se baja sola.

## Método (igual para todas)

1. **Referencias** — están en `assets/originales/referencias-cine/`:
   `1-estilo-portada.jpg` (estilo y paleta del juego), `2-personaje.png` (la
   protagonista), `3-mapa.png` (la isla del juego), `4-fondo-templos.png`,
   `5-fondo-desierto.png`, `6-juego-camino.jpg`, `7-juego-regreso.jpg`.
2. **ChatGPT, en UNA sola conversación por cinemática**: primero el mensaje
   maestro con las referencias adjuntas, después un *storyboard* de todas las
   viñetas (fija composición y continuidad) y después cada fotograma en grande,
   uno por mensaje. Si un fotograma cambia a la personaje, pedir «rehazlo
   idéntica a la referencia 2».
3. **Google Flow → «De fotogramas a video»** (usa Veo, el mismo motor de
   Gemini): cada clip va de un fotograma al siguiente (inicio y final). Así la
   IA no inventa: solo anima lo que hay entre dos imágenes que ya aprobaste. En
   la app de Gemini, si solo deja una imagen, se sube el fotograma de inicio y
   se describe el final con el mismo prompt.
4. **Montaje** (Clipchamp, que viene con Windows): se pegan los clips en orden,
   se acelera o recorta cada uno a su duración y se pone **un solo audio**
   (ambiente + música) para toda la cinemática: quita el audio de cada clip,
   así no hay saltos de sonido entre uno y otro. Exportar 1080p.

---

## 1 · INICIO — «El mapa vacío» (15 s)

Historia: de noche, en un campamento entre ruinas, la exploradora desenrolla un
mapa antiguo de la isla. Solo tiene dibujada la costa; el interior está vacío,
cubierto de niebla. Al acercar el farol, bajo la niebla asoman caminos dorados
y un destello rojo: hay cosas que nadie ha visto. Al amanecer sale al borde del
acantilado, enciende la linterna y da el primer paso hacia lo desconocido.

Cinco fotogramas clave, cuatro clips:

| Fotograma | Segundo | Qué se ve |
|---|---|---|
| F1 | 0 | Campamento de noche, carpa iluminada |
| F2 | 4 | Dentro: desenrolla el mapa vacío |
| F3 | 8 | El farol revela caminos dorados y un destello rojo |
| F4 | 11,5 | Amanecer, de espaldas en el acantilado |
| F5 | 15 | Enciende la linterna y da el primer paso |

### ChatGPT — mensaje maestro (adjunta las referencias 1, 2, 3 y 4)

> Vamos a crear los fotogramas clave de una cinemática de 15 segundos para mi videojuego «Terra Incógnita». Luego otra IA animará entre un fotograma y el siguiente, así que la CONTINUIDAD es lo más importante: mismo personaje, misma ropa, mismas proporciones, misma paleta y la misma luz en todos.
>
> Referencias adjuntas: (1) el estilo y la paleta de mi juego; (2) la protagonista: debe salir SIEMPRE idéntica —exploradora chibi de cabeza grande tipo figura coleccionable, cabello castaño largo con una trenza, camiseta sin mangas verde azulado, shorts verde oliva, cinturón marrón con fundas, guantes sin dedos, botas marrones altas, mochila—; (3) la isla del juego, cuyo contorno aparecerá en un mapa; (4) el ambiente de selva con templos en ruinas.
>
> Estilo para TODAS las imágenes: ilustración de cómic de aventura con línea de tinta negra gruesa y sombreado cel, con la paleta y el ambiente de mi juego: rojo fuego, naranja lava, dorado, roca volcánica oscura y luz cálida de farol y de atardecer; inspiración en los menús de piedra tallada y fuego de Tomb Raider de Nintendo 64. Una paloma mensajera gris la acompaña.
>
> Reglas: formato horizontal 16:9 (si no puedes, horizontal 3:2 con el motivo centrado para que pueda recortar); una sola escena a cuadro completo, sin viñetas divididas; sin texto, sin letras, sin números, sin globos de diálogo, sin marcas de agua.
>
> Si lo entendiste, responde solo «listo» y espera mis indicaciones.

### ChatGPT — storyboard

> Primero haz un storyboard: UNA imagen horizontal con 5 viñetas en fila, numeradas solo por su orden, de izquierda a derecha, con estos momentos: (1) de noche, campamento entre ruinas con una carpa iluminada por dentro; (2) dentro de la carpa ella desenrolla sobre una mesa un mapa antiguo con solo el contorno de la isla de la referencia 3 y el interior vacío cubierto de niebla; (3) primer plano del mapa: su mano acerca un farol y bajo la niebla asoman caminos dorados y un destello rojo; (4) amanecer, ella de espaldas en el borde de un acantilado mirando un territorio cubierto de niebla con templos y una tubería dorada; (5) enciende la linterna, el haz abre la niebla y da el primer paso. Mantén la protagonista idéntica en las cinco.

*(Este storyboard solo es para fijar las composiciones: no lleva números dentro del dibujo y no se usa en el video.)*

### ChatGPT — F1 (0 s)

> Fotograma 1, en grande, basado en la viñeta 1: plano general, cámara frontal a la altura de los ojos. Noche con luna y estrellas, niebla baja. Campamento en el borde de una selva con ruinas de templos de columnas cubiertas de enredaderas y palmeras (como la referencia 4, pero de noche, en azules profundos y violetas). En el centro, una carpa de lona iluminada desde dentro por la luz naranja cálida de un farol; a contraluz, sobre la lona, se ve la silueta de la exploradora inclinada sobre una mesa. Junto a la carpa, una columna de piedra rota y una fogata casi apagada con brasas rojas. La paloma gris posada en el palo de la carpa. La luz cálida de la carpa es lo más brillante de la imagen.

### ChatGPT — F2 (4 s)

> Fotograma 2, basado en la viñeta 2: dentro de la carpa, plano medio, cámara a la altura de la mesa. La exploradora, idéntica a la referencia 2, de tres cuartos, desenrolla con ambas manos un pergamino antiguo de bordes quemados sobre una mesa de madera. En el pergamino está dibujado solo el contorno de la isla de la referencia 3 (costa, acantilados, el mar alrededor), pero TODO el interior de la isla está vacío, cubierto por una mancha de niebla gris oscura que parece moverse. Sobre la mesa: un farol encendido a su lado, una brújula de latón y su linterna apagada. La paloma posada sobre la mochila, colgada de una silla. Expresión de curiosidad. Luz naranja del farol desde un lado; el fondo de la carpa, en penumbra rojiza.

### ChatGPT — F3 (8 s)

> Fotograma 3, basado en la viñeta 3: primer plano en picado sobre el mapa (casi cenital). La mano enguantada de la exploradora sostiene el farol justo encima del centro vacío. En el círculo de luz cálida, bajo la niebla, asoman líneas doradas finas —caminos y una tubería que serpentea— y, en un punto, un pequeño destello rojo intenso, como un cristal escondido. Fuera del círculo de luz el mapa sigue oscuro y con niebla. En el borde superior de la imagen, su cara iluminada desde abajo por el farol, con los ojos muy abiertos y decididos.

### ChatGPT — F4 (11,5 s)

> Fotograma 4, basado en la viñeta 4: exterior, amanecer. La exploradora, de espaldas y un poco de tres cuartos, de pie en el borde de un acantilado junto al campamento, con la mochila puesta y la linterna apagada en la mano. Delante, el territorio real de la isla: un mar de niebla del que asoman ruinas de templos, palmeras, una cascada y, a lo lejos, un templo escalonado sobre una montaña; una tubería dorada serpentea y se pierde en la niebla. El sol aún no sale: cielo naranja y rojo fuego en el horizonte, violeta arriba. La paloma despega de su hombro. Cámara detrás de ella, a la altura de su hombro.

### ChatGPT — F5 (15 s)

> Fotograma 5, basado en la viñeta 5: el mismo lugar y la misma luz que el fotograma 4, un instante después. La cámara está más baja y más cerca, detrás de ella. Ha encendido la linterna: un haz de luz cálida corta la niebla y abre un claro que deja ver un sendero que baja hacia las ruinas. Ella ya dio el primer paso: un pie adelante sobre el sendero. El borde del sol asoma en el horizonte. La paloma vuela delante, siguiendo el haz de luz.

### Gemini / Flow — clip 1: F1 → F2 (≈ 4 s)

> Anima entre estas dos imágenes manteniendo exactamente su estilo de cómic con línea de tinta gruesa y sombreado cel. La cámara avanza despacio hacia la carpa iluminada; la brisa mueve la niebla baja y las hojas de las palmeras, las brasas de la fogata chisporrotean y la paloma ladea la cabeza. La cámara entra por la abertura de la lona y queda dentro de la carpa, donde la exploradora desenrolla el mapa sobre la mesa. La personaje no cambia de cara, ropa ni proporciones. Sin texto, sin diálogos, sin voces.

### Gemini / Flow — clip 2: F2 → F3 (≈ 4 s)

> Anima entre estas dos imágenes manteniendo su estilo de cómic. La exploradora termina de extender el mapa y levanta el farol; la cámara se inclina hacia abajo hasta quedar casi encima del mapa. La niebla dibujada en el centro del mapa se mueve como humo vivo y, donde toca la luz del farol, se aparta y deja ver líneas doradas que se encienden una a una; al final late un pequeño destello rojo. La llama del farol parpadea. Sin texto, sin diálogos, sin voces.

### Gemini / Flow — clip 3: F3 → F4 (≈ 3,5 s)

> Transición entre estas dos imágenes manteniendo su estilo de cómic: el destello rojo y la luz del farol crecen hasta llenar la pantalla de luz cálida, y al apagarse ya es el amanecer afuera: la exploradora está de espaldas en el borde del acantilado frente al mar de niebla. La paloma despega de su hombro. Movimiento suave, sin cortes bruscos. Sin texto, sin diálogos, sin voces.

### Gemini / Flow — clip 4: F4 → F5 (≈ 3,5 s)

> Anima entre estas dos imágenes manteniendo su estilo de cómic. La exploradora levanta la linterna y la enciende; el haz de luz cálida atraviesa la niebla y la abre como una cortina, revelando el sendero. Ella da el primer paso con decisión mientras la cámara baja y la sigue por detrás. El sol empieza a asomar y la paloma vuela delante siguiendo el haz. La personaje no cambia. Sin texto, sin diálogos, sin voces.

### Montaje

Clips 1-2-3-4 en orden: 4 s + 4 s + 3,5 s + 3,5 s = 15 s. Si Flow los entrega
de 8 s, en Clipchamp se aceleran (×2 los dos primeros, ×2,3 los otros dos) o se
recortan. Audio único para todo el video: viento nocturno y grillos, que pasan a
un tema de aventura suave al llegar el amanecer. Guardar como
`assets/cinematicas/inicio.mp4`.

---

## 2 · EL MAPA — «Pocos equipos, muchos lugares» (15 s)

Historia: al anochecer la exploradora sube a una torre de vigía sobre la isla,
que está a oscuras. Barre el territorio con la linterna: donde pasa la luz se
encienden lugares; algunos laten en rojo (riesgo) y otros brillan tranquilos. En
el borde, casi fuera del haz, destella una islita que casi nadie mira. De vuelta
en la carpa, sobre el mapa ya iluminado, solo tiene cinco banderines para
muchos lugares: los clava en orden en los que laten más rojo, y cinco pequeños
equipos con faroles salen hacia ellos. Es lo que el jugador hace en la etapa:
explorar con la linterna, mirar también las orillas y priorizar por riesgo.

| Fotograma | Segundo | Qué se ve |
|---|---|---|
| F1 | 0 | Llega a la torre de vigía; la isla, a oscuras |
| F2 | 4 | El haz de la linterna enciende lugares: unos laten en rojo |
| F3 | 8 | En la orilla, casi fuera del haz, destella una islita |
| F4 | 11,5 | En la carpa: cinco banderines para muchos lugares |
| F5 | 15 | Banderines clavados; cinco equipos salen con faroles |

### ChatGPT — mensaje maestro

Conversación nueva. Pega **tal cual el mensaje maestro de la cinemática 1** y
adjunta `1-estilo-portada.jpg`,
`2-personaje.png`, `3-mapa.png` y, además, el **F2 aprobado de la cinemática 1**
(la carpa con el mapa), para que la carpa, la mesa y el pergamino sean los
mismos. Añade al final:

> Esta es la cinemática 2. La quinta imagen adjunta es un fotograma ya aprobado de la cinemática anterior: la carpa, la mesa, el farol y el pergamino deben verse igual.

### ChatGPT — storyboard

> Primero haz un storyboard: UNA imagen horizontal con 5 viñetas en fila, en orden de izquierda a derecha: (1) al anochecer, ella llega a lo alto de una torre de vigía de madera y ve abajo la isla de la referencia 3 completamente a oscuras; (2) el haz de su linterna barre la isla y donde pasa se encienden lugares: algunos laten con un aura roja, otros brillan dorados y tranquilos; (3) en el borde del haz, sobre el mar, destella una islita pequeña en la esquina y ella la mira sorprendida; (4) dentro de la carpa, sobre el pergamino ahora con la isla iluminada, ella sostiene solo cinco banderines pequeños frente a muchos lugares y clava el primero en el que late más rojo; (5) vista desde arriba del mapa convertido en maqueta: cinco banderines clavados y cinco pequeños equipos con faroles saliendo del campamento hacia ellos. Protagonista idéntica en las cinco.

### ChatGPT — F1 (0 s)

> Fotograma 1, en grande, basado en la viñeta 1: anochecer, cielo violeta con el último resplandor rojo fuego en el horizonte. La exploradora, idéntica a la referencia 2, de espaldas y de tres cuartos, acaba de llegar a la plataforma de una torre de vigía de madera y cuerdas, con una mano en la baranda y la linterna apagada en la otra. Abajo se extiende la isla de la referencia 3 completa, pero casi a oscuras: solo se adivinan siluetas de montañas, selva, templos, una represa y chimeneas, bajo una niebla azulada. El mar alrededor, oscuro. La paloma posada en la baranda. Cámara detrás de ella, un poco por encima.

### ChatGPT — F2 (4 s)

> Fotograma 2, basado en la viñeta 2: la misma torre y la misma hora, cámara por encima de su hombro. Ella apunta la linterna encendida hacia la isla: un haz ancho de luz cálida cae sobre el territorio como un reflector. Donde toca el haz, los lugares se iluminan: una represa con cascadas, una fundición con chimeneas, un faro en la costa, un manantial. Tres de esos lugares laten con un aura roja intensa como brasas (peligro); los demás brillan dorados y tranquilos. Fuera del haz, todo sigue a oscuras.

### ChatGPT — F3 (8 s)

> Fotograma 3, basado en la viñeta 3: el mismo encuadre que el fotograma 2, un instante después. El haz se ha desplazado hasta el borde de la isla, sobre el mar. En la esquina, muy lejos, casi fuera de la luz, destella una islita pequeña con un templo, como si guardara algo. La exploradora se inclina sobre la baranda, con una ceja levantada y media sonrisa: la descubrió. La paloma estira el cuello en la misma dirección.

### ChatGPT — F4 (11,5 s)

> Fotograma 4, basado en la viñeta 4: dentro de la carpa, de noche, igual que el fotograma aprobado de la cinemática anterior (misma mesa, farol y pergamino). Ahora el pergamino muestra la isla ya dibujada e iluminada, con muchos lugares marcados, varios con un brillo rojo. La exploradora, de tres cuartos, sostiene en una mano solo cinco banderines pequeños de tela roja y dorada, pocos para tantos lugares, y con la otra clava el primero, con decisión, en el lugar que late más rojo. Expresión concentrada. Luz naranja del farol.

### ChatGPT — F5 (15 s)

> Fotograma 5, basado en la viñeta 5: vista desde arriba en diagonal del pergamino, que se ha convertido en una maqueta viva de la isla. Hay cinco banderines clavados en los lugares que laten en rojo, unidos en orden por una línea fina de luz dorada, y los lugares tranquilos quedan sin banderín. Desde el campamento, en el borde del mapa, salen cinco pequeños equipos de exploradores con faroles hacia los banderines, dejando senderos de luz cálida. En primer plano, desenfocada, la mano enguantada de la exploradora sobre la mesa.

### Gemini / Flow — clip 1: F1 → F2 (≈ 4 s)

> Anima entre estas dos imágenes manteniendo exactamente su estilo de cómic con línea de tinta gruesa y sombreado cel. La exploradora levanta la linterna y la enciende; la cámara se desplaza por encima de su hombro. El haz de luz cálida cae sobre la isla oscura y, a su paso, los lugares se encienden uno a uno; tres de ellos empiezan a latir con un aura roja como brasas. El viento mueve su trenza y la niebla. La personaje no cambia de cara, ropa ni proporciones. Sin texto, sin diálogos, sin voces.

### Gemini / Flow — clip 2: F2 → F3 (≈ 4 s)

> Anima entre estas dos imágenes manteniendo su estilo de cómic. El haz de la linterna sigue barriendo la isla hacia la orilla y sale sobre el mar oscuro; en la esquina, lejos, destella una islita pequeña. La exploradora se inclina sobre la baranda, levanta una ceja y sonríe; la paloma estira el cuello hacia el destello. Movimiento de cámara suave. Sin texto, sin diálogos, sin voces.

### Gemini / Flow — clip 3: F3 → F4 (≈ 3,5 s)

> Transición entre estas dos imágenes manteniendo su estilo de cómic: la cámara se acerca al destello de la islita hasta que su luz llena la pantalla y, al apagarse, estamos dentro de la carpa, sobre el pergamino iluminado; la exploradora, con cinco banderines en la mano, clava el primero en el lugar que late más rojo. Movimiento suave, sin cortes bruscos. Sin texto, sin diálogos, sin voces.

### Gemini / Flow — clip 4: F4 → F5 (≈ 3,5 s)

> Anima entre estas dos imágenes manteniendo su estilo de cómic. La exploradora clava rápidamente los demás banderines en los lugares rojos; una línea de luz dorada los une en orden. La cámara se eleva hasta ver el mapa desde arriba mientras el pergamino se convierte en una maqueta viva y cinco pequeños equipos con faroles salen del campamento hacia los banderines dejando senderos de luz. Sin texto, sin diálogos, sin voces.

### Montaje

4 s + 4 s + 3,5 s + 3,5 s = 15 s (acelerar si Flow los entrega de 8 s). Audio
único: viento en lo alto de la torre, un zumbido grave cada vez que un lugar
late en rojo, un golpe de tambor por cada banderín y música de aventura que
arranca al salir los equipos. Guardar como `assets/cinematicas/mapa.mp4`.

---

## Lecciones de los dos primeros videos (2026-09-25)

- A Gemini se le sube **un fotograma grande**, nunca la hoja del storyboard: en
  el video 1 animó la hoja entera y salieron tres viñetas quietas una al lado
  de la otra.
- Con una sola imagen y un prompt general, Gemini casi no mueve nada (video 2:
  10 s de la misma toma). El prompt debe decir **qué pasa segundo a segundo**.
- Para que la personaje no cambie de estilo, a ChatGPT se le adjunta **una
  imagen ya aprobada** (un fotograma de ChatGPT de la cinemática 1) y se le pide
  «misma personaje y mismo estilo que esta imagen».
- Gemini entrega clips de unos 10 s en 1280×720: con 3 clips, cada uno se
  recorta a sus 5 mejores segundos.

## 3 · EL CAMINO — «Lo que el cartel no dice» (15 s)

Historia: la exploradora llega corriendo por uno de los senderos de luz a un
camino de piedra entre templos, con rieles de tubería dorada a los lados. Va
recogiendo diamantes azules (los datos), pasa junto a carteles de madera con un
gran visto bueno verde que brillan pero no guardan nada, y esquiva un muro de
piedra que le cierra el paso. Ya en el desierto de las pirámides se detiene y
levanta una lente cargada con la luz azul de los diamantes: el barrido revela
cristales rojos escondidos justo detrás de un cartel de visto bueno y en las
grietas de la tubería. Atrapa uno y lo levanta.

Mensaje (indirecto): no basta con lo que dice el cartel (el manual, el control
que «todo está en orden»); hay que ir a los datos y mirar, y lo importante suele
estar escondido justo donde decían que no había nada.

| Fotograma | Segundo | Qué se ve |
|---|---|---|
| F1 | 0 | Llega corriendo al camino entre templos; diamantes azules delante |
| F2 | 5 | Recoge diamantes, pasa los carteles de visto bueno, esquiva un muro |
| F3 | 10 | En el desierto: la lente azul revela cristales rojos escondidos |
| F4 | 15 | Atrapa un cristal rojo y lo levanta |

### ChatGPT — mensaje maestro

Conversación nueva. Pega tal cual el mensaje maestro de la cinemática 1 y
adjunta `1-estilo-portada.jpg`, `2-personaje.png`, `4-fondo-templos.png`,
`5-fondo-desierto.png`, `6-juego-camino.jpg` y **un fotograma aprobado de la
cinemática 1** (por ejemplo, la carpa). Añade al final:

> Esta es la cinemática 3. La última imagen adjunta es un fotograma ya aprobado: la protagonista y el estilo de dibujo deben ser EXACTAMENTE esos. La imagen 6 es una captura del juego: el camino de piedra con dos rieles de tubería dorada, los diamantes azules y los carteles deben parecerse a los de esa captura, pero dibujados en el estilo de cómic.

### ChatGPT — storyboard

> Primero haz un storyboard: UNA imagen horizontal con 4 viñetas en fila, en orden de izquierda a derecha: (1) de mañana, ella llega corriendo por un sendero de luz a un camino de piedra entre templos de columnas y palmeras, con dos rieles de tubería dorada a los lados y diamantes azules flotando delante; (2) corriendo, recoge diamantes azules, pasa junto a carteles de madera con un gran visto bueno verde y esquiva de un salto un muro de piedra que cierra el paso; (3) en un desierto con pirámides y un volcán, se detiene y levanta una lente mágica azul; el barrido de luz revela cristales rojos escondidos detrás de un cartel de visto bueno y en las grietas de la tubería; (4) primer plano: atrapa un cristal rojo brillante y lo levanta, con la luz roja en la cara. Protagonista idéntica en las cuatro.

### ChatGPT — F1 (0 s)

> Fotograma 1, en grande, basado en la viñeta 1: mañana dorada. Plano general desde atrás y un poco de lado: la exploradora, idéntica a la imagen aprobada, llega corriendo por un sendero de luz cálida que desemboca en un camino recto de piedra que se aleja hacia el horizonte. A los dos lados del camino corren rieles de tubería dorada. Alrededor, templos de columnas con enredaderas, palmeras, cascadas y un río, como la referencia 4. Delante de ella, sobre el camino, flotan varios diamantes azules brillantes en fila. A lo lejos, sobre un arco de piedra, ondea uno de sus banderines rojo y dorado. La paloma vuela por encima.

### ChatGPT — F2 (5 s)

> Fotograma 2, basado en la viñeta 2: el mismo camino entre templos, cámara al costado siguiéndola a la carrera. Ella está en el aire, a mitad de un salto lateral, esquivando un muro bajo de piedra agrietada que cierra uno de los carriles. Con la mano atrapa un diamante azul, y un rastro de luz azul entra a su mochila, que ya brilla por dentro. Junto al camino, dos carteles de madera con un gran visto bueno verde relucen muy limpios, pero no hay nada detrás. Movimiento, polvo, energía.

### ChatGPT — F3 (10 s)

> Fotograma 3, basado en la viñeta 3: ahora en un desierto al atardecer con pirámides y un volcán humeante, como la referencia 5; el mismo camino de piedra con rieles de tubería dorada. La exploradora, de pie y de tres cuartos, sostiene en alto una lente mágica redonda que brilla azul con la energía de los diamantes. De la lente sale un barrido de luz azul, como un radar, que recorre el suelo. Donde pasa, aparecen cristales rojos brillantes que estaban escondidos: uno justo detrás de un cartel de madera con visto bueno verde, otros en las grietas de la tubería dorada y medio enterrados en la arena. Fuera del barrido no se ven. Cara de sorpresa y concentración.

### ChatGPT — F4 (15 s)

> Fotograma 4, basado en la viñeta 4: primer plano, contrapicado, el mismo desierto al atardecer detrás. La exploradora sostiene en alto, con la mano enguantada, un cristal rojo que brilla intensamente y le ilumina la cara de rojo; sonrisa de triunfo. En su cinturón y en la mochila se ven otros cristales rojos brillando. Detrás, desenfocados, el cartel de visto bueno y la tubería dorada. La paloma posada en su hombro, mirando el cristal.

### Gemini — un clip por fotograma (≈ 5 s cada uno)

Sube **solo el fotograma** indicado (no el storyboard).

**Clip 1 · desde F1:**

> Anima esta imagen manteniendo exactamente su estilo de cómic con línea de tinta gruesa. Durante todo el clip la cámara sigue a la exploradora por detrás mientras corre por el camino de piedra: segundo 0-1, sale del sendero de luz y pisa el camino; segundos 1-3, atrapa al vuelo los diamantes azules uno tras otro y cada uno deja un rastro azul que entra en su mochila; segundos 3-5, acelera y la cámara la sigue entre los templos mientras el banderín ondea al fondo. Movimiento continuo y rápido, nunca quieta. La personaje no cambia de cara, ropa ni proporciones. Sin texto, sin diálogos, sin voces.

**Clip 2 · desde F2:**

> Anima esta imagen manteniendo su estilo de cómic. Segundo 0-1, termina el salto lateral y cae rodando junto al muro de piedra, que queda atrás; segundos 1-3, se levanta y sigue corriendo junto a los carteles de visto bueno verde, que brillan pero se mueven vacíos, como decorado; segundos 3-5, el camino cambia: la selva queda atrás y aparecen dunas y pirámides mientras sigue corriendo. Cámara lateral que la sigue sin parar. Sin texto, sin diálogos, sin voces.

**Clip 3 · desde F3:**

> Anima esta imagen manteniendo su estilo de cómic. Segundo 0-2, la lente se enciende más y lanza un barrido de luz azul que recorre el suelo como un radar; segundos 2-4, a su paso aparecen uno a uno los cristales rojos escondidos, primero el que está justo detrás del cartel de visto bueno, luego los de las grietas de la tubería; segundo 4-5, ella corre hacia el cristal de detrás del cartel, lo atrapa y lo levanta con una sonrisa de triunfo mientras la luz roja le ilumina la cara. Sin texto, sin diálogos, sin voces.

*(En Google Flow, con «De fotogramas a video», usar F1→F2, F2→F3 y F3→F4 con
los mismos prompts: sale más preciso.)*

### Montaje

Tres clips de 5 s = 15 s: de cada clip de Gemini (≈10 s) se deja el tramo donde
pasa la acción o se acelera ×2. Audio único: pasos rápidos y música de aventura
con ritmo, un «tin» cristalino por cada diamante, un golpe seco en el muro y un
zumbido grave que se vuelve un acorde brillante cuando aparecen los cristales
rojos. Guardar como `assets/cinematicas/camino.mp4`.

---

## 4 · EL CAMINO DESPEJADO — «Lo que encontraste abre el paso» (15 s)

Historia: al atardecer, la exploradora llega con la mochila llena de cristales
rojos a una antigua sala de válvulas de piedra, en lo alto, desde donde se ve la
ruta de regreso: una red de tuberías amarillas (una tubería madre arriba, con
bajantes, y tubos que salen del suelo con válvulas de volante rojo) que deja
pasos estrechísimos. Coloca los cristales uno a uno en un panel: con cada uno
giran las válvulas y los tubos de la ruta se apartan un poco más; las grietas
se sellan con luz dorada y aparecen aros dorados en los pasos abiertos. Suelta a
su paloma, que cruza con facilidad el primer paso y el primer aro.

Mensaje (indirecto): lo que encontraste sirve para corregir, y corregir deja el
camino más fácil; cada cristal (cada hallazgo) abre un poco más el paso. Es
exactamente la mecánica de la etapa.

| Fotograma | Segundo | Qué se ve |
|---|---|---|
| F1 | 0 | Llega a la sala de válvulas; abajo, la ruta cerrada por tuberías |
| F2 | 5 | Coloca los cristales; las válvulas giran |
| F3 | 10 | Los tubos se apartan: pasos anchos y aros dorados |
| F4 | 15 | Suelta a la paloma, que cruza el primer paso y el primer aro |

### ChatGPT — mensaje maestro

Conversación nueva. Pega tal cual el mensaje maestro de la cinemática 1 y
adjunta `1-estilo-portada.jpg`, `2-personaje.png`, `5-fondo-desierto.png`,
`7-juego-regreso.jpg` y **una imagen aprobada de la cinemática 3** (mejor si es
la del cristal rojo). Añade al final:

> Esta es la cinemática 4. La última imagen adjunta es un fotograma ya aprobado: la protagonista y el estilo de dibujo deben ser EXACTAMENTE esos. La imagen 7 es una captura del juego: las tuberías amarillas (una tubería madre horizontal arriba de la que bajan tubos, y tubos que salen del suelo con bridas y válvulas de volante rojo), los aros dorados y la paloma deben parecerse a los de esa captura, pero dibujados en el estilo de cómic.

### ChatGPT — storyboard

> Primero haz un storyboard: UNA imagen horizontal con 4 viñetas en fila, en orden de izquierda a derecha: (1) al atardecer, ella llega con la mochila brillando de cristales rojos a una antigua sala de válvulas de piedra en lo alto, y abajo se ve la ruta de regreso cerrada por tuberías amarillas que dejan pasos muy estrechos; (2) coloca los cristales rojos uno a uno en los huecos de un panel de piedra y grandes válvulas de volante rojo giran; (3) vista amplia de la ruta: los tubos se apartan, los pasos quedan anchos, las grietas se sellan con luz dorada y aparecen aros dorados flotando en los pasos; (4) ella suelta a su paloma desde las manos y la paloma cruza el primer paso ancho y el primer aro. Protagonista idéntica en las cuatro.

### ChatGPT — F1 (0 s)

> Fotograma 1, en grande, basado en la viñeta 1: atardecer rojo y dorado con un sol grande y bajo, pirámides y un volcán humeante en el horizonte, como la referencia 5. En primer plano, a la izquierda, la exploradora, idéntica a la imagen aprobada, de tres cuartos, entra a una sala de válvulas de piedra tallada y abierta al paisaje; su mochila y su cinturón brillan con varios cristales rojos. A su lado, un panel de piedra con una fila de huecos redondos vacíos y dos grandes válvulas de volante rojo. Más allá del borde, abajo, se extiende la ruta de regreso: una tubería madre amarilla horizontal cruza por arriba y de ella bajan muchos tubos, y del suelo suben otros tubos con bridas y válvulas rojas, tan juntos que entre ellos solo quedan pasos estrechísimos. Algunos tubos tienen grietas oscuras. La paloma gris posada en su hombro.

### ChatGPT — F2 (5 s)

> Fotograma 2, basado en la viñeta 2: dentro de la misma sala de válvulas, plano medio, la misma luz de atardecer. La exploradora coloca con decisión un cristal rojo en uno de los huecos del panel de piedra; tres huecos ya tienen su cristal y brillan en rojo intenso, y de ellos salen líneas de luz dorada que recorren el panel hasta las dos válvulas de volante rojo, que están girando (con líneas de movimiento de cómic). Su cara iluminada de rojo y dorado, concentrada. La paloma, en el borde del panel, mirando.

### ChatGPT — F3 (10 s)

> Fotograma 3, basado en la viñeta 3: vista amplia de la ruta de regreso desde la sala de válvulas, la misma hora y el mismo paisaje. Los tubos que bajaban de la tubería madre se han recogido hacia arriba y los que salían del suelo han bajado: ahora entre ellos hay pasos ANCHOS y despejados. Las grietas de los tubos están selladas con costuras de luz dorada. En el centro de cada paso flota un aro dorado brillante. Junto al camino, postes de piedra con una bandera verde azulado y un farol encendido. Un pulso de luz dorada recorre toda la tubería madre. En el borde inferior, de espaldas, la silueta de la exploradora mirando la ruta abierta.

### ChatGPT — F4 (15 s)

> Fotograma 4, basado en la viñeta 4: la exploradora, de tres cuartos, en el borde de la sala de válvulas, con los brazos extendidos hacia delante: acaba de soltar a la paloma. La paloma gris, con las alas abiertas, ya vuela sobre la ruta y está cruzando el primer paso ancho entre los tubos amarillos, justo a través del primer aro dorado, que destella. Ella sonríe. Detrás, el sol rojo del atardecer, las pirámides y el volcán. Sensación de alivio y de camino abierto.

### Gemini — un clip por fotograma (≈ 5 s cada uno)

Sube **solo el fotograma** indicado.

**Clip 1 · desde F1:**

> Anima esta imagen manteniendo exactamente su estilo de cómic con línea de tinta gruesa. Segundo 0-2, la exploradora entra a la sala de válvulas y se asoma al borde; la cámara pasa por encima de su hombro y muestra abajo la ruta cerrada por tuberías amarillas con pasos estrechísimos, mientras el viento levanta arena. Segundos 2-5, ella mira los cristales rojos de su mochila, los saca y se acerca al panel de piedra con los huecos vacíos. Movimiento continuo, nunca quieta. La personaje no cambia de cara, ropa ni proporciones. Sin texto, sin diálogos, sin voces.

**Clip 2 · desde F2:**

> Anima esta imagen manteniendo su estilo de cómic. Segundos 0-4, la exploradora coloca los cristales rojos uno a uno en los huecos del panel; con cada cristal, el hueco se enciende en rojo, una línea de luz dorada corre hasta las válvulas y los grandes volantes rojos dan una vuelta completa, cada vez más rápido. Segundo 4-5, la cámara gira hacia el borde de la sala y empieza a mostrar la ruta de abajo, donde los tubos amarillos empiezan a moverse. Sin texto, sin diálogos, sin voces.

**Clip 3 · desde F3:**

> Anima esta imagen manteniendo su estilo de cómic. Segundo 0-1, un pulso de luz dorada recorre la tubería madre; segundos 1-3, los tubos que cuelgan de arriba se recogen y los que salen del suelo bajan, abriendo pasos cada vez más anchos, y las grietas se sellan con luz dorada; segundos 3-4, aparecen los aros dorados en el centro de cada paso y se encienden los faroles de los postes con bandera; segundo 4-5, la exploradora suelta a su paloma, que alza el vuelo y cruza el primer paso y el primer aro, que destella. Sin texto, sin diálogos, sin voces.

*(En Google Flow, con «De fotogramas a video»: F1→F2, F2→F3 y F3→F4 con los
mismos prompts.)*

### Montaje

Tres tramos de 5 s = 15 s. Audio único: viento del desierto, un clic de piedra y
un tono que sube por cada cristal, el chirrido metálico de las válvulas, un
estruendo suave cuando los tubos se apartan y, al volar la paloma, aleteo y
música que se abre. Guardar como `assets/cinematicas/regreso.mp4`.

---

## 5 · FINAL — «El mapa completo» (15 s)

Historia: al amanecer, la paloma llega al pueblo de templos junto a la gran red
de tuberías y se posa en la mano de una trabajadora del pueblo. La gente del
pueblo y los pequeños equipos de exploradores (los de la cinemática 2) arreglan
juntos las tuberías: cierran válvulas y sellan grietas, y los cristales rojos,
al colocarse, se vuelven dorados. Un pulso de luz dorada recorre toda la red y
enciende la isla entera, sin una sola zona oscura. En lo alto de una colina, la
exploradora abre el mapa, ahora completo, lo enrolla, mira a la cámara y guiña:
a lo lejos, entre la niebla, asoma otra isla por explorar.

Mensaje (aquí ya directo, sin palabras): encontrar lo que estaba mal no es para
buscar culpables; se arregla junto con quienes trabajan ahí, y todo queda mejor
que como estaba. Y el trabajo no termina: siempre hay un territorio nuevo que
mirar.

| Fotograma | Segundo | Qué se ve |
|---|---|---|
| F1 | 0 | La paloma llega al pueblo y se posa en la mano de una trabajadora |
| F2 | 5 | Pueblo y exploradores arreglan juntos; los cristales rojos se vuelven dorados |
| F3 | 10 | Un pulso dorado enciende toda la red y toda la isla |
| F4 | 15 | En la colina, el mapa completo; guiño; una isla nueva a lo lejos |

### ChatGPT — mensaje maestro

Conversación nueva. Pega tal cual el mensaje maestro de la cinemática 1 y
adjunta `1-estilo-portada.jpg`, `2-personaje.png`, `3-mapa.png`,
`7-juego-regreso.jpg` y **dos imágenes aprobadas**: una de la cinemática 4 (la
paloma y las tuberías) y una de la cinemática 2 (los pequeños equipos con
faroles), si la tienes. Añade al final:

> Esta es la cinemática 5, la final. Las dos últimas imágenes adjuntas son fotogramas ya aprobados: la protagonista, la paloma, los pequeños equipos de exploradores y el estilo de dibujo deben ser EXACTAMENTE esos. Las tuberías amarillas son las de la imagen 7 y la isla es la de la imagen 3.

### ChatGPT — storyboard

> Primero haz un storyboard: UNA imagen horizontal con 4 viñetas en fila, en orden de izquierda a derecha: (1) al amanecer, la paloma mensajera llega a la plaza de un pueblo de templos junto a una gran red de tuberías amarillas y se posa en la mano de una trabajadora del pueblo; (2) la gente del pueblo y pequeños exploradores con faroles arreglan juntos las tuberías: giran válvulas rojas, sellan grietas con luz dorada y colocan cristales rojos que se vuelven dorados; (3) vista aérea de la isla completa: un pulso de luz dorada recorre toda la red de tuberías y la isla entera queda iluminada, sin ninguna zona oscura; (4) en lo alto de una colina, la exploradora con la paloma en el hombro sostiene el mapa completo, lo enrolla y guiña un ojo a la cámara; a lo lejos, entre la niebla del mar, asoma otra isla. Protagonista idéntica.

### ChatGPT — F1 (0 s)

> Fotograma 1, en grande, basado en la viñeta 1: amanecer, cielo naranja y rosado. La plaza empedrada de un pueblo de templos de columnas con palmeras, atravesado por una gran red de tuberías amarillas con bridas y válvulas de volante rojo, como las de la imagen 7; algunos tramos tienen grietas oscuras. La paloma gris, con las alas todavía abiertas, se posa en la mano extendida de una trabajadora del pueblo con ropa de trabajo sencilla y guantes; a su alrededor, varias personas del pueblo se acercan con curiosidad. Luz cálida y rasante del sol que sale.

### ChatGPT — F2 (5 s)

> Fotograma 2, basado en la viñeta 2: la misma plaza y la misma luz, plano medio. La gente del pueblo y cuatro o cinco pequeños exploradores con faroles (como los de la imagen aprobada de la cinemática 2) trabajan JUNTOS en las tuberías amarillas: uno gira una válvula de volante rojo, otro sella una grieta que se cierra con una costura de luz dorada, y una trabajadora coloca un cristal rojo en un hueco de la tubería que, al encajar, se vuelve dorado y brillante. Todos sonríen; ambiente de equipo, no de regaño. La paloma posada sobre la tubería.

### ChatGPT — F3 (10 s)

> Fotograma 3, basado en la viñeta 3: vista aérea en diagonal de la isla de la referencia 3, al amanecer. Un pulso de luz dorada recorre toda la red de tuberías, que ahora se ve como líneas doradas brillantes que conectan la represa, la fundición, el faro, el manantial y el pueblo. La isla entera está iluminada: no queda ninguna zona oscura ni niebla sobre ella. Los cinco banderines de la exploradora, ahora dorados, ondean en sus lugares. La islita de la esquina también brilla.

### ChatGPT — F4 (15 s)

> Fotograma 4, basado en la viñeta 4: lo alto de una colina verde al amanecer, con la isla iluminada abajo. La exploradora, idéntica a la imagen aprobada, de frente y de tres cuartos, con la paloma en el hombro, sostiene el pergamino del mapa abierto: ahora está COMPLETO, sin ninguna zona vacía, con líneas doradas y pequeñas estrellas doradas donde antes había destellos rojos. Mira a la cámara con una sonrisa y un guiño. Detrás de ella, a lo lejos en el mar, entre la niebla, asoma la silueta de otra isla desconocida. El sol sale detrás.

### Gemini — un clip por fotograma (≈ 5 s cada uno)

Sube **solo el fotograma** indicado.

**Clip 1 · desde F1:**

> Anima esta imagen manteniendo exactamente su estilo de cómic con línea de tinta gruesa. Segundo 0-2, la paloma baja planeando sobre la plaza y se posa en la mano de la trabajadora, que sonríe; segundos 2-4, la gente del pueblo se acerca y mira hacia las tuberías agrietadas; segundo 4-5, desde el camino llegan corriendo los pequeños exploradores con faroles y todos se ponen manos a la obra. Movimiento continuo, nunca quieto. Sin texto, sin diálogos, sin voces.

**Clip 2 · desde F2:**

> Anima esta imagen manteniendo su estilo de cómic. Segundos 0-2, giran las válvulas de volante rojo y las grietas de la tubería se cierran una a una con costuras de luz dorada; segundos 2-4, la trabajadora encaja el cristal rojo en la tubería y el cristal se vuelve dorado con un destello; la gente del pueblo y los exploradores chocan las manos; segundo 4-5, del cristal dorado sale un pulso de luz que corre por la tubería hacia fuera de la plaza. Sin texto, sin diálogos, sin voces.

**Clip 3 · desde F3:**

> Anima esta imagen manteniendo su estilo de cómic. Segundos 0-3, la cámara vuela sobre la isla mientras el pulso de luz dorada recorre toda la red de tuberías y, a su paso, la niebla se disuelve y cada lugar se enciende; los banderines dorados ondean; segundos 3-5, la cámara baja hacia una colina donde la exploradora abre el mapa completo, lo enrolla, mira a la cámara, sonríe y guiña un ojo mientras a lo lejos, en el mar, asoma otra isla entre la niebla. La personaje no cambia de cara, ropa ni proporciones. Sin texto, sin diálogos, sin voces.

*(En Google Flow, con «De fotogramas a video»: F1→F2, F2→F3 y F3→F4 con los
mismos prompts.)*

### Montaje

Tres tramos de 5 s = 15 s. Audio único: aleteo y murmullo del pueblo al
principio, chirrido de válvulas y un destello cristalino cuando el cristal se
vuelve dorado, un acorde que crece con el pulso dorado y un cierre musical
épico y cálido con el guiño. Guardar como `assets/cinematicas/final.mp4`.

Después del video el juego pasa al recuento de puntos, y al final la pantalla
de cierre es la que dice con palabras lo que es la auditoría.

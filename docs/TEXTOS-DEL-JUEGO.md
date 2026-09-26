# Todos los textos del juego

Documento para revisar y cambiar lo que dice el juego. Está ordenado como lo
vive el visitante, pantalla por pantalla.

**Cómo usarlo:** cambia el texto que quieras directamente en este archivo y
devuélvemelo. Cada línea lleva un código (por ejemplo `[C-07]`): no lo borres,
así sé dónde va cada cambio. Si quieres quitar una línea, escribe `(quitar)`.

- Lo que está entre llaves se rellena solo: `{botón}` es el botón que toca
  pulsar (ZR, ZL, ENTER…), `{n}` un número, `{nombre}` el nombre del jugador.
  Puedes mover las llaves de sitio, pero no cambiar lo que dicen.
- ⚠ = texto que quedó de antes y creo que conviene cambiar (te digo por qué).
- **Regla de oro:** mientras se juega no se dice «auditoría», «hallazgo»,
  «plan anual», «control interno» ni «informe». Solo en las pantallas «Así
  elegimos / trabajamos / terminamos» y en el cierre. Si pones una de esas
  palabras en otra parte, te aviso antes de aplicarlo.

---

## 1. Pantalla de conexión (antes de entrar)

- `[G-01]` Título: TERRA INCÓGNITA
- `[G-02]` Subtítulo: Una expedición por las tierras de auditoría
- `[G-03]` Conecta los Joy-Con para jugar con el movimiento: cada jugador usa uno, de cualquier lado, sostenido como una linterna. Dentro del juego, cada uno vincula el suyo. Si un mando falla, se puede jugar con el teclado o el ratón.
- `[G-04]` Botón: ＋ Conectar un Joy-Con  /  con alguno ya conectado: ＋ Conectar otro Joy-Con
- `[G-05]` Botón: Jugar con ratón o teclado
- `[G-06]` Botón (con algún Joy-Con conectado): Empezar ▸
- `[G-13]` Lista: ✓ Joy-Con (L) · ✓ Joy-Con (R) · ✗ … · no responde
- `[G-14]` Sin mandos: Ningún Joy-Con conectado todavía. Pulsa «Conectar un Joy-Con» una vez por cada mando.
- `[G-15]` Con mandos: ¿Juegan más? Conecta otro. Chrome los recuerda: la próxima vez ya aparecen aquí.
- `[G-07]` Ayuda de teclas: W A S D o flechas para jugar con teclado · Espacio acción / F pantalla completa · M silenciar música · C calibrar giro · R recentrar · J panel de mandos · P prueba de dos jugadores · Esc pausa

Mensajes si algo falla (los ve el operador):

- `[G-08]` Este navegador no expone WebHID. Abre la página en Chrome o Edge.
- `[G-09]` No elegiste ningún mando.
- `[G-10]` El mando no respondió. Pulsa un botón para despertarlo y reintenta, o cierra Steam o BetterJoy si los tienes abiertos.
- `[G-11]` No se pudo abrir el Joy-Con: {error}
- `[G-12]` Solo hay un mando autorizado. Pulsa J y autoriza el de relevo antes de empezar.

## 2. Portada (menú principal)

- `[P-01]` TERRA
- `[P-02]` INCÓGNITA
- `[P-03]` Una expedición por las tierras de
- `[P-04]` AUDITORÍA
- `[P-05]` Así marcaban los mapas antiguos las zonas que nadie había recorrido. No quería decir que no hubiera nada. Quería decir que nadie había ido a ver.
  *(solo se ve si hay espacio en la pantalla)*
- `[P-06]` Encabezado del menú: Menú principal
- `[P-07]` Empezar el recorrido
- `[P-08]` Ir a una etapa
- `[P-09]` Mejores puntajes
- `[P-10]` Controles
- `[P-11]` Abajo, con mando: Joy-Con {L/R} conectado · gatillo para elegir
- `[P-12]` Abajo, sin mando: Sin mando · teclado o ratón

**Ir a una etapa**
- `[P-13]` Encabezado: Elige una etapa
- `[P-14]` 1 · El Mapa
- `[P-15]` 2 · El Camino
- `[P-16]` 3 · El Regreso
- `[P-17]` ‹ Volver

**Mejores puntajes**
- `[P-18]` Encabezado: Mejores puntajes
- `[P-19]` Cada fila: {puesto}.  {nombre}  ·  {puntos} puntos
- `[P-20]` Si no hay nadie: Todavía nadie ha terminado la expedición. ¡Sé el primero!

**Controles** (encabezado `[P-21]` Cómo se juega; además del botón «Calibrar mandos» y «‹ Volver»)
- `[P-22]` Joy-Con: muévelo para apuntar · gatillo (ZR o ZL) para la acción · + o − para pausar
- `[P-23]` Teclado, Jugador 1: WASD para moverte · W o Espacio para la acción
- `[P-24]` Teclado, Jugador 2: flechas para moverte · ↑ para la acción (se une con ↑)
- `[P-25]` Enter para continuar · Esc para pausar · Ratón: apunta y haz clic

## 3. Cuántos juegan, vincular los mandos y nombres

**El modo**
- `[J-01]` Título: La expedición
- `[J-02]` Encabezado: ¿Cuántos juegan?
- `[J-03]` El Mapa lo juega el Jugador 1. El Camino y El Regreso, los que elijan aquí.
- `[J-04]` Cada jugador usa un Joy-Con (o el teclado).
- `[J-05]` Un jugador
- `[J-06]` Dos jugadores
- `[J-07]` ‹ Volver

**Vincular los mandos** (estilo Switch)
- `[J-20]` Título: Vincula los mandos  /  al terminar: ¡Listos!
- `[J-21]` Mantén pulsados a la vez el gatillo y el botón de hombro de tu Joy-Con
- `[J-22]` ZL + L en el izquierdo · ZR + R en el derecho · el primero es el Jugador 1
- `[J-23]` Tarjeta: JUGADOR {n} — y sobre el Joy-Con dibujado: ZL + L · ZR + R
- `[J-24]` Estado de la tarjeta: Esperando… / Después del Jugador {n} / Vinculando… / ✓ Joy-Con izquierdo / ✓ Joy-Con derecho / ✓ Teclado · W A S D / ✓ Teclado · flechas ← → ↑
- `[J-25]` Botón: ＋ Conectar otro Joy-Con (clic aquí)  —  al conectarlo: ✓ Joy-Con conectado. Ahora mantén pulsados su gatillo y su botón de hombro.
- `[J-26]` Si un mando no responde: Ese Joy-Con no respondió. Vuelve a mantener pulsados los dos botones.
- `[J-27]` Pie: Sin Joy-Con: Jugador 1 pulsa Espacio · Jugador 2 pulsa ↑   ·   Esc o + / −: volver

**Los nombres**
- `[J-08]` Título: Escribe tu nombre
- `[J-09]` JUGADOR {n}
- `[J-10]` Con Joy-Con: Escribe con tu Joy-Con ({izquierdo/derecho})
- `[J-11]` Con teclado: Escribe con el teclado · juegas con W A S D / con las flechas
- `[J-13]` Ayuda: Joy-Con: stick, ↑/↓ o X/B cambian la letra · gatillo, → o A la ponen · ← o Y borra
- `[J-14]` Ayuda: Teclado: escribe tu nombre directo · Retroceso borra · Enter termina
- `[J-15]` Ayuda: Elige ✓ para terminar
- `[J-16]` Casillas de abajo: J1: {nombre} / J2: {nombre}
- `[J-18]` Pie: Esc o + / − del Joy-Con: volver a vincular los mandos
- `[J-19]` Si no escribe nada: SIN NOMBRE

## 4. El recorrido (la pantalla entre etapas)

- `[R-01]` Título: Tu recorrido
- `[R-02]` Al empezar: Tres tramos. Empecemos por el primero.
- `[R-03]` Entre etapas: Un tramo menos. Queda camino.
- `[R-04]` Al terminar las tres: Recorriste los tres tramos.
- `[R-05]` Parada 1: El Mapa — Elige a dónde ir — 1 jugador
- `[R-06]` Parada 2: El Camino — Encuentra lo que está escondido — 1 o 2 jugadores
- `[R-07]` ⚠ Parada 3: El Regreso — Llévalo de vuelta y verifica — 1 o 2 jugadores
  *(la historia nueva del nivel 3 es «el camino despejado»; propuesta: «Recorre el camino que abriste»)*
- `[R-08]` Resumen El Mapa: {n} equipos enviados · viste el {n} % del mapa
- `[R-09]` Resumen El Camino: {n} de {n} descubrimientos (con dos: J1: {n} · J2: {n} de {n} descubrimientos)
- `[R-10]` ⚠ Resumen El Regreso: {n} entregados  *(ahora se llaman «aros»)*
- `[R-11]` Marca sobre la parada siguiente: AHORA / PRÓXIMAMENTE
- `[R-12]` Pie: Pulsa {botón} para entrar ya / Pulsa {botón} para continuar

## 5. Etapa 1 · El Mapa

### Instrucciones, primera parte
- `[M-01]` Etapa 1 · Primera parte
- `[M-02]` Explora el mapa
- `[M-03]` Tienes delante el territorio de toda la compañía. Está a oscuras y nadie lo ha recorrido completo.
- `[M-04]` Mueve el Joy-Con como si tuvieras una linterna en la mano: donde apuntes, se ilumina el mapa.
- `[M-05]` Cuando pases por encima de un lugar, detente un momento sobre él. Si te quedas quieto ahí, el lugar se revela y te muestra su información.
- `[M-06]` Hay {n} lugares en total. Recórrelo todo: también las orillas y las esquinas. No todo está en el centro.
- `[M-07]` Con teclado: WASD o las flechas mueven la linterna; Espacio o Enter confirman.
- `[M-08]` Aviso: Tienes 60 segundos. No te va a alcanzar para mirarlo todo con calma: por eso importa cómo lo recorres.
- `[M-09]` Pulsa {botón} para empezar a explorar

### Mientras explora
- `[M-10]` Marcador: Lugares encontrados  {n} / {n}
- `[M-11]` Barra: MAPA ILUMINADO {n}%
- `[M-12]` Reloj: SEG
- `[M-13]` Pie: Mueve el Joy-Con para iluminar. Detente sobre un lugar para descubrirlo.
- `[M-14]` Al descubrir un lugar sale su nombre flotando (ver sección 6).
- `[M-15]` Al descubrir la isla escondida: ¡fuera del mapa!
- `[M-16]` Si encuentra todos: ¡Encontraste los {n}!

### Instrucciones, segunda parte
- `[M-17]` Etapa 1 · Segunda parte
- `[M-18]` Decide a dónde ir
- `[M-19]` Ya viste lo que alcanzaste a ver. Ahora hay que escoger, y no alcanza para todos.
- `[M-20]` Tienes {n} equipos para {n} lugares. Solo puedes enviarlos a lugares que hayas descubierto.
- `[M-21]` Apunta a un lugar y te aparece una ficha con lo que hay ahí y sus tres barras. Léela antes de decidir.
- `[M-22]` Confirma para enviar un equipo. Vuelve a confirmar sobre él si quieres retirarlo.
- `[M-23]` El orden en que los envías es tu prioridad: el primero es el más urgente.
- `[M-24]` Cuando estés conforme, apunta al botón «Enviar equipos» de abajo y confirma. No tienes que gastar todo el tiempo ni usar los cinco.
- `[M-25]` Leyenda de las barras: **Riesgo** — Qué tan probable es que algo salga mal en ese lugar.
- `[M-26]` **Importancia** — Cuánto le pesa a la compañía si ese lugar falla.
- `[M-27]` **Señales** — Cuánto están avisando los datos de que ahí pasa algo. Ojo: puede haber peligro sin señales.
- `[M-28]` Aviso: Tienes {n} segundos. Fíjate sobre todo en el riesgo y en la importancia: las señales ayudan, pero un lugar puede estar en peligro sin que los datos lo estén gritando.
- `[M-29]` Pulsa {botón} para decidir

### Mientras decide
- `[M-30]` Marcador: Equipos enviados {n} / 5
- `[M-31]` Cuadro: CÓMO SE LEE — Riesgo / Importancia / Señales
- `[M-32]` Ficha del lugar: {nombre}, sus tres barras con una palabra (muy alto · alto · medio · bajo · muy bajo) y su pista (sección 6)
- `[M-33]` En la ficha, si ya mandó a alguien: EQUIPO {n} ENVIADO AQUÍ
- `[M-34]` Botón: Enviar {n} equipo / Enviar {n} equipos
- `[M-35]` Aviso al enviar: Equipo {n} enviado
- `[M-36]` Pie normal: Apunta a un lugar y pulsa {botón}. El orden en que los envías es tu prioridad.
- `[M-37]` Pie sobre el botón: Pulsa {botón} para que salgan ya
- `[M-38]` Pie si apunta a un lugar no descubierto: No puedes enviar un equipo a un lugar que nunca miraste
- `[M-39]` Animación de salida: Los equipos salen del campamento.

### Tu plan
- `[M-40]` Título: Tu plan
- `[M-41]` Esto es lo que acabas de mandar a revisar, y en este orden.
- `[M-42]` Cada fila: {n} {lugar} es {área real} — y debajo qué se revisa ahí (sección 6)
- `[M-43]` Si no envió a nadie: No enviaste a nadie a ninguna parte.
- `[M-44]` El territorio se queda como estaba, y nadie sabrá qué había en él.
- `[M-45]` Pulsa {botón} para ver qué tal elegiste

### Resultados (tres páginas)
- `[M-46]` RESULTADO DE TU EXPEDICIÓN
- `[M-47]` Veredicto (según la nota): Muy buen ojo · Buen criterio · Vas aprendiendo · Saliste sin mirar bien
- `[M-48]` MIRASTE — cuánto del mapa alcanzaste a ver
- `[M-49]` ELEGISTE BIEN — acertaste en los lugares que más pesaban
- `[M-50]` PRIORIZASTE — y los pusiste en el orden correcto
- `[M-51]` POR QUÉ
- `[M-52]` A dónde enviaste tus equipos
- `[M-53]` Cada lugar: buena elección / no era de las más urgentes
- `[M-54]` Si no envió ninguno: No enviaste ningún equipo.
- `[M-55]` SE TE ESCAPÓ — {lugar} — y su «por qué importa» (sección 6)
- `[M-56]` Si no se le escapó nada: No se te escapó ninguno de los importantes.
- `[M-57]` Miraste lo suficiente y elegiste bien. Eso es exactamente lo difícil.
- `[M-58]` Página de la isla (si no la encontró): HABÍA UN LUGAR MÁS — La Isla Brillante — y sus textos (sección 6)
- `[M-59]` Pie: Pulsa {botón} para ver por qué / Pulsa {botón} para ver qué acabas de hacer

### Así elegimos (revelación: aquí sí se nombra el oficio)
- `[M-60]` LO QUE ACABAS DE HACER, EN LA VIDA REAL
- `[M-61]` Así elegimos
- `[M-62]` Miraste toda la compañía: catorce lugares, y cada uno le importa a alguien. No alcanzaba para todos. Leíste lo que había en cada uno, escogiste los que más pesaban y decidiste a cuáles ir primero.
- `[M-63]` **La linterna** — El alcance: lo que un equipo pequeño alcanza a mirar en un año. Nunca da para toda la compañía, y ese es el punto de partida.
- `[M-64]` **Los catorce lugares** — Los procesos de la compañía, todos: facturación, recaudo, compras, mantenimiento, Brilla… los que acabas de recorrer con otro nombre.
- `[M-65]` **Las tres barras** — Riesgo, importancia y señales. Con eso se decide, y los datos son solo una de las tres: un proceso puede estar en peligro sin que nada lo esté gritando.
- `[M-66]` **Los cinco equipos** — Las auditorías que caben en el año. Escoger a dónde van es decir que no a los otros nueve, y hay que poder sustentarlo.
- `[M-67]` **El orden** — La prioridad. No es lo mismo llegar en enero que en noviembre: a lo más crítico se va primero.
- `[M-68]` **Lo que se te escapó** — También nos pasa. Por eso el plan se revisa: si aparece algo nuevo a mitad de año, se cambia.
- `[M-69]` Eso es el Plan Anual de Auditoría.
- `[M-70]` Es la decisión más importante del año del área: define qué se revisa, en qué orden y qué queda por fuera. Se sustenta ante la Dirección, y de ahí sale el trabajo de los doce meses.
- `[M-71]` Pulsa {botón} para seguir el recorrido

## 6. Los catorce lugares del mapa

Por cada lugar: **nombre** · **es** (el área real, sale en «Tu plan» y en el cierre) · **pista** (la ficha al apuntarlo) · **qué se revisa** (sale en «Tu plan») · **por qué importa** (sale en resultados si se le escapó). La «verdad» solo se muestra hoy en la Isla Brillante.

**`[L-01]` El Gran Caudal** · es: Facturación
- pista: Todo lo que se consume en el territorio pasa por aquí, y aquí se mide cuánto fue.
- qué se revisa: Que a cada quien se le cobre lo que consumió: ni un peso de más, ni uno de menos.
- por qué importa: Mucho riesgo, muchísima importancia y los datos gritando. Era la primera de la lista.
- verdad (no se muestra): Por aquí pasa toda la plata de la compañía. Un desvío del 1% no se nota a simple vista, pero arrastra más que cualquier otro lugar.

**`[L-02]` La Torre de Señales** · es: Dirección Digital
- pista: Desde arriba se ve todo el territorio. Todas las señales pasan por esta torre.
- qué se revisa: Quién puede entrar a los sistemas, qué puede hacer adentro, y qué pasaría si alguien se cuela.
- por qué importa: Alta en las tres barras. De las más claras de elegir.
- verdad (no se muestra): Desde arriba se ve todo el territorio. Por eso mismo, quien se tome la torre ve todo el territorio.

**`[L-03]` La Fundición** · es: Compras y contratación
- pista: Aquí se funde el metal con el que se sellan los tratos. Mucho calor y pocos testigos.
- qué se revisa: Cómo se eligen los proveedores y si los contratos se cumplen como se firmaron.
- por qué importa: De los riesgos más altos del mapa, y con mucho en juego.
- verdad (no se muestra): Aquí el dinero cambia de manos. Mucho calor, pocos testigos, y decisiones que comprometen años.

**`[L-04]` Los Ramales** · es: Construcciones e Ingeniería
- pista: De aquí salen los caminos nuevos hacia donde todavía no llega nada.
- qué se revisa: Que las obras se hagan bien y a tiempo, y que lo que se pagó sea lo que se construyó.
- por qué importa: Buena candidata, y se queda por fuera por muy poco. De las que siempre dan para discutir.
- verdad (no se muestra): Crecen más rápido de lo que alcanzan a ponerse en el mapa. Crecer bien y crecer rápido casi nunca son lo mismo.

**`[L-05]` El Manantial** · es: Compra y venta de gas
- pista: De aquí brota lo que mueve todo el territorio. Si se seca, no hay nada que repartir.
- qué se revisa: Los contratos de suministro: cuánto se compra, a qué precio, y si eso le conviene a la compañía.
- por qué importa: La importancia más alta después del caudal. El riesgo propio es moderado, y por eso no entra.
- verdad (no se muestra): El origen de todo. No es el lugar donde más cosas salen mal, pero es el único sin el cual ningún otro lugar existe.

**`[L-06]` La Montaña Perdida** · es: Pérdida No Operacional
- pista: Sube gas por la ladera y arriba siempre llega menos del que salió. Nadie sabe bien dónde se queda.
- qué se revisa: A dónde se va el gas que sale y no llega. Cuánto es pérdida técnica y cuánto es otra cosa.
- por qué importa: Muy cerca de entrar. Se sabe que hay fuga y se sabe cuánta; lo difícil es dónde. Dejarla fuera se defiende, pero hay que defenderlo.
- verdad (no se muestra): Lo que sale y no llega. Está medido, se sabe cuánto es, y aun así es el lugar donde más cuesta señalar al responsable.

**`[L-07]` Las Salinas** · es: Tarifas y subsidios regulados
- pista: Reglas endurecidas por el sol. Las escribió gente de afuera y no se negocian.
- qué se revisa: Que las tarifas se apliquen como manda la regulación y que el subsidio llegue a quien debe.
- por qué importa: Riesgo e importancia altos. Queda cerca de entrar.
- verdad (no se muestra): Reglas que vienen de afuera y no se negocian: se cumplen. Y el costo de no cumplirlas no lo pone uno.

**`[L-08]` Los Acantilados** · es: Seguridad y salud en el trabajo
- pista: Un paso en falso aquí no se arregla con dinero.
- qué se revisa: Que la gente que trabaja en campo vuelva a su casa igual que salió.
- por qué importa: El riesgo más alto de todo el mapa. Se queda afuera por poco, y es una decisión que siempre da para discutir.
- verdad (no se muestra): Un error aquí no se corrige con un ajuste contable. Es el único lugar del mapa donde lo que está en juego no es plata.

**`[L-09]` Los Grandes Hornos** · es: Gran Industria
- pista: Unos pocos hornos consumen aquí lo que consumen miles de casas en otra parte.
- qué se revisa: La medición y la facturación de los clientes grandes, donde un error pequeño es mucha plata.
- por qué importa: Importa mucho y se revisa poco, pero su riesgo propio no alcanza al de las que entraron.
- verdad (no se muestra): Pocos clientes, volúmenes enormes. Un error de medición que en una casa son centavos, aquí son millones.

**`[L-10]` El Faro** · es: Atención a usuarios
- pista: Desde aquí se oyen las voces de todos los que viven en el territorio.
- qué se revisa: Qué están reclamando los usuarios, si se les resuelve, y qué nos está diciendo eso.
- por qué importa: Las señales más fuertes del mapa, pero poco riesgo propio. Aquí es donde muchos se equivocan: seguir la luz más brillante no es lo mismo que ir a donde más se necesita.
- verdad (no se muestra): No causa la tormenta: la anuncia. Quien aprende a leer su luz se entera antes que nadie de lo que viene.

**`[L-11]` La Represa** · es: Recaudo y cartera
- pista: Aquí se retiene lo que baja por el caudal. No todo lo que entra alcanza a salir.
- qué se revisa: Lo que se cobró, lo que sigue pendiente, y qué se está haciendo para recuperarlo.
- por qué importa: Bien vigilada y con señales claras. No era de las urgentes.
- verdad (no se muestra): Lo que se cobró y lo que todavía no. El agua que se queda detrás del muro también es agua de la compañía.

**`[L-12]` El Poblado** · es: Gestión Humana
- pista: Aquí vive la gente que hace que el territorio funcione.
- qué se revisa: Cómo se contrata, cómo se paga y cómo se cuida a la gente.
- por qué importa: Lo más bajo del mapa en riesgo. Decidir no ir también es decidir.
- verdad (no se muestra): Denso y constante. Pocas veces es el origen del problema; siempre es parte de la solución.

**`[L-13]` El Puente Viejo** · es: Mantenimiento de infraestructura
- pista: Lleva años aguantando y nadie recuerda cuándo se revisó por última vez.
- qué se revisa: El estado real de la infraestructura, y si el mantenimiento se está haciendo o solo se está reportando.
- por qué importa: Aquí está la trampa. Riesgo alto, señales casi en cero. Si solo mirabas la barra azul, lo dejaste pasar. Los datos avisan de lo que ya pasó; no de lo que se está gastando en silencio.
- verdad (no se muestra): Aguanta desde hace años y por eso nadie lo mira. Casi no da señales. Su peligro todavía no está en los datos: está en el tiempo.

**`[L-14]` La Isla Brillante** · es: Brilla — financiación no bancaria
- pista: Brilla a lo lejos, separada de todo. No se parece en nada al resto del territorio.
- qué se revisa: Cómo se otorgan los créditos, cómo se recuperan, y quién responde cuando no se pagan.
- verdad (sale en su página de resultados): Está lejos de tierra firme y no se parece a nada del resto del mapa. Casi nadie llega hasta acá — y sin embargo se mueve mucho dinero.
- por qué importa (sale en su página de resultados): Casi nadie la encuentra, porque para verla hay que mirar por fuera del mapa. No se parece al resto y por eso se revisa poco. Pero mueve plata de verdad y tiene sus propios riesgos. Lo que una compañía no mira porque "no es lo nuestro" suele ser justo lo que menos control tiene.

## 7. Etapa 2 · El Camino

### Instrucciones
- `[C-01]` Etapa 2 · El Camino
- `[C-02]` Recorre el proceso de principio a fin
- `[C-03]` Tus equipos llegaron. Ahora hay que caminar los dos tramos a los que diste más prioridad: {tramo 1} y {tramo 2}. Ve con tus propios ojos qué pasa ahí.
- `[C-04]` Apunta el Joy-Con hacia un carril para moverte: izquierda, centro o derecha.
- `[C-05]` Recoge los ◆ azules: son los datos tal como salen de la fuente.
- `[C-06]` Pulsa el gatillo para ANALIZAR: gasta datos y hace visible lo que está escondido en el camino. Lo que brille en rojo, atrápalo.
- `[C-07]` Atrapa los tableros de Power BI: cruzan los datos por ti y analizan el camino sin gastar tus ◆. Esquiva los muros: son las excusas de siempre, y te hacen perder datos.  *(nuevo)*
- `[C-08]` Con teclado: Jugador 1 con A/D y W (o Espacio); Jugador 2 con las flechas ← → y ↑. Si juegas solo, también valen las flechas.
- `[C-09]` Aviso: Pueden jugar dos, en el mismo camino. Gana quien encuentre más de lo que estaba escondido.
- `[C-10]` Jugador 1: pulsa {botón} para empezar
- `[C-11]` Abajo, si no se eligió cuántos juegan: ¿Juegan dos? Jugador 2: pulsa ↑ en el teclado o cualquier botón del otro Joy-Con
- `[C-12]` Jugador 2 listo · Joy-Con {L/R}  /  Jugador 2 listo · teclado: flechas ← → y ↑
- `[C-13]` ¡El Jugador 2 se unió!

### Los tramos (salen en el letrero «Entrando a…» y en la barra de arriba)
- `[C-14]` El Manantial — donde entra el gas
- `[C-15]` Los Ramales — por donde se reparte
- `[C-16]` La Montaña Perdida — donde algo se pierde
- `[C-17]` El Gran Caudal — donde se mide y se cobra
- `[C-18]` La Represa — donde llega la plata
- `[C-19]` Letrero al cambiar de tramo: E N T R A N D O   A — {tramo} — {qué es}

### Las excusas de los muros
- `[C-20]` Siempre se ha hecho así
- `[C-21]` Pídelo por correo
- `[C-22]` Ese dato no existe
- `[C-23]` Eso no está en el manual
- `[C-24]` Ya lo revisaron el año pasado
- `[C-25]` No es mi área
- `[C-26]` El sistema no deja
- `[C-27]` Eso siempre cuadra

### Mientras corre
- `[C-28]` Marcador: {nombre o JUGADOR n} — {n} puntos
- `[C-29]` Marcador: DESCUBRIMIENTOS
- `[C-30]` Barra: ◆ DATOS {n}
- `[C-31]` Botón: {botón} · ANALIZAR  /  ANALIZANDO…  /  Faltan datos para analizar
- `[C-32]` Al recoger un dato: +1 ◆  *(nuevo)*
- `[C-33]` Al tomar un tablero de Power BI: Power BI cruzó los datos por ti  y  +10 · Power BI  *(nuevo)*
- `[C-34]` Al chocar: «{excusa}»
- `[C-35]` Sin datos: Sin datos no hay nada que analizar
- `[C-36]` Al atrapar algo escondido: ¡Encontraste algo escondido!  y  +100
- `[C-37]` Primer tramo: {tramo} · {qué es}
- `[C-38]` Si llega antes que el otro: Llegaste — Esperando al otro jugador…

### Tablero (al llegar)
- `[C-39]` T A B L E R O · {nombre}
- `[C-40]` {n} de {n} — cosas escondidas encontradas
- `[C-41]` {n} datos recogidos · analizaste {n} vez/veces
- `[C-42]` Tomaste {n} tablero(s) de Power BI: analizaron el camino por ti  /  No tomaste ningún tablero de Power BI  *(nuevo)*
- `[C-43]` Chocaste {n} vez/veces con una excusa  /  No chocaste con ninguna excusa
- `[C-44]` {n} cosas escondidas pasaron a tu lado sin que las atraparas
- `[C-45]` Pasaste el {n} % del camino por el carril del centro  *(solo si fue más del 70 %)*
- `[C-46]` {n} puntos
- `[C-47]` Con dos: ¡Gana {nombre}! / Gana el Jugador {n} / Empate
- `[C-48]` Pulsa {botón} para ver qué acabas de hacer

### Así trabajamos (revelación)
- `[C-49]` LO QUE ACABAS DE HACER, EN LA VIDA REAL
- `[C-50]` Así trabajamos
- `[C-51]` **◆ Los datos crudos** — Sacamos la información directo de la base de datos, no de lo que el proceso reporta de sí mismo.
- `[C-52]` **La lente** — Analizar: mirar los datos con intención. Sin datos no hay análisis, y sin análisis no se ve nada.  *(nuevo)*
- `[C-53]` **El tablero de Power BI** — Con él cruzamos las cifras del proceso con las nuestras: por eso, al tomarlo, apareció lo que estaba escondido.  *(nuevo)*
- `[C-54]` **Los dos tramos** — Vamos a donde el plan dijo que más pesaba, en ese orden, y recorremos el proceso de principio a fin.
- `[C-55]` **Lo que brilló en rojo** — Se llama HALLAZGO: lo escondido, lo que nadie estaba viendo. Con él se construyen las conclusiones.
- `[C-56]` **Los muros** — Y sí: siempre aparece una excusa en el camino.
- `[C-57]` Cierre: No nos quedamos con lo que el proceso dice de sí mismo. Vamos a ver.
- `[C-58]` Pulsa {botón} para continuar

## 8. Etapa 3 · El Regreso («El camino despejado»)

### Instrucciones
- `[V-01]` Etapa 3 · El Regreso
- `[V-02]` El camino despejado
- `[V-03]` Lo que encontraste no se quedó guardado: sirvió para arreglar lo que estaba mal. Ahora el regreso es más fácil, y mientras más encontraste, más despejado está.
- `[V-04]` Pulsa el gatillo para batir las alas. Nada más. Con teclado: Jugador 1 con W o Espacio; Jugador 2 con la flecha ↑.
- `[V-05]` Atraviesa los aros dorados: cada uno es una mejora que ya funciona y suma puntos, hasta el último segundo.
- `[V-06]` Pasa por los puestos de control: son la vuelta a verificar que sí cambió.
- `[V-07]` Las tuberías son lo que nadie ha arreglado todavía. Chocar no te saca del juego, pero te frena.
- `[V-08]` Cada cosa escondida que atrapaste en El Camino abrió más el paso entre las tuberías y hace valer más cada aro.
- `[V-09]` Aviso: Pueden jugar dos, cada uno en su mitad de la pantalla. Gana quien haga más puntos.
- `[V-10]` Jugador 1: pulsa {botón} para despegar

### Las excusas en los carteles de las tuberías
- `[V-11]` Ya está resuelto
- `[V-12]` No hubo presupuesto
- `[V-13]` Cambió el responsable
- `[V-14]` Lo vemos el otro trimestre
- `[V-15]` Estamos en cierre de mes
- `[V-16]` Eso ya lo sabíamos

### Mientras vuela
- `[V-17]` Marcador: TU VUELO (o el nombre) — {n} aros — {n} puntos — ✓ {n} verificados
- `[V-18]` Marcador: Lo que encontraste vale x{n}
- `[V-19]` Reloj: {n} s
- `[V-20]` Al pasar un aro: ¡Mejora! +{n}
- `[V-21]` Al pasar un puesto de control: Volviste a verificar
- `[V-22]` Al chocar con el suelo: Te fuiste al suelo
- `[V-23]` Al chocar con una tubería: «{excusa}»
- `[V-24]` Al empezar: Pulsa {botón} para aletear

### Tablero
- `[V-25]` Tu regreso
- `[V-26]` T U   V U E L O  (o el nombre)
- `[V-27]` {n} aros · {n} puntos
- `[V-28]` ✓ {n} vez/veces volviste a verificar
- `[V-29]` Te frenaron {n} vez/veces  /  No te frenó ninguna tubería
- `[V-30]` {n} aro se te escapó / {n} aros se te escaparon  /  No se te escapó ningún aro
- `[V-31]` Lo que descubriste en El Camino te abrió el paso e hizo valer cada aro x{n}
- `[V-32]` Sin descubrimientos de El Camino, el paso fue estrecho y cada aro valió lo normal
- `[V-33]` Con dos: ¡Gana {nombre}! / Gana el Jugador {n} / Empate
- `[V-34]` Pulsa {botón} para ver qué acabas de hacer

### Así terminamos (revelación)
- `[V-35]` LO QUE ACABAS DE HACER, EN LA VIDA REAL
- `[V-36]` Así terminamos
- `[V-37]` **Lo que encontraste** — Los HALLAZGOS. No son para buscar culpables: son lo que hay que arreglar.
- `[V-38]` **El paso más ancho** — Cada hallazgo corregido deja el proceso más fácil y más seguro para todos.
- `[V-39]` **Los aros** — Las recomendaciones que el proceso ya puso en marcha.
- `[V-40]` **Los puestos de control** — El seguimiento: volvemos a mirar que el cambio se quedó.
- `[V-41]` **Las tuberías** — Los riesgos que siguen ahí mientras nadie los corrija.
- `[V-42]` Cierre: Auditar no es poner trabas: es dejar el camino más fácil.
- `[V-43]` Pulsa {botón} para continuar

## 9. Recuento de puntos

- `[F-01]` Título: Cómo te fue  /  con dos: Cómo le fue a cada uno
- `[F-02]` Filas: El Mapa · El Camino · El Regreso · TOTAL
- `[F-03]` Frase según el total: Leyenda del territorio (5000+) · Gran explorador (3000+) · Buena expedición (1500+) · Primera expedición
- `[F-04]` Con dos: ¡Gana {nombre}! / Gana el Jugador {n} / ¡Empate!
- `[F-05]` Pie: Pulsa el gatillo, Espacio o Enter para ver la tabla de los mejores  (o «para poner tu nombre» si no lo puso al empezar)
- `[F-06]` Si pide el nombre aquí: Escribe tu nombre — JUGADOR {n} · {n} puntos (y la misma ayuda de J-13 a J-15)
- `[F-07]` Título: Mejores expediciones
- `[F-08]` {nombre}: ¡el mejor puntaje del stand!  /  {nombre}: puesto {n}
- `[F-09]` Pie: Pulsa el gatillo, Espacio o Enter para seguir

## 10. Cierre (tres páginas)

**Página 1**
- `[F-10]` ⚠ Primero miraste todo el territorio y decidiste a dónde ir. Después fuiste a la fuente, recorriste el proceso de principio a fin y encontraste lo que nadie estaba viendo. Al final lo llevaste de vuelta y verificaste que cambiara.
  *(la última frase es de la historia anterior; propuesta: «Al final, lo que encontraste sirvió para corregir, y el camino quedó más fácil para todos.»)*
- `[F-11]` Eso es Auditoría Interna.
- `[F-12]` El Mapa → Plan Anual de Auditoría
- `[F-13]` El Camino → Ejecución con analítica de datos
- `[F-14]` ⚠ El Regreso → Informe, recomendaciones y seguimiento  *(propuesta: «Recomendaciones, planes de acción y seguimiento»)*
- `[F-15]` No nos limitamos a probar los controles ni a seguir el manual: entendemos el proceso completo para encontrar lo invisible. Así es como generamos valor.

**Página 2 (la isla)**
- `[F-16]` Encabezado si la encontró: Y LLEGASTE HASTA ALLÁ  /  si no: Y HABÍA UN LUGAR MÁS
- `[F-17]` La Isla Brillante — era Brilla — financiación no bancaria
- `[F-18]` Si la encontró: La encontraste, y eso es raro: casi nadie se sale del mapa a mirar. Es el negocio que no se parece al resto, y justamente por eso suele revisarse menos que los demás.
- `[F-19]` Si no: Casi nadie la encuentra, porque para verla hay que mirar por fuera del mapa. Es el negocio que no se parece al resto del territorio.
- `[F-20]` Lo que una compañía no revisa porque "no es lo nuestro" suele ser justo lo que menos control tiene.

**Página 3**
- `[F-21]` El recorrido completo
- `[F-22]` Jugaste {n} de las 3 etapas. Así se ve el camino completo.
- `[F-23]` Tarjetas: E T A P A {n} — {nombre} — {qué hiciste} — {qué es} — YA SE JUEGA / EN DISEÑO
- `[F-24]` El Mapa — Mirar todo y elegir a dónde ir
- `[F-25]` El Camino — Ir a la fuente y encontrar lo escondido
- `[F-26]` ⚠ El Regreso — Contarlo, y volver a ver que cambió  *(propuesta: «Corregir lo encontrado y verificar que cambió»)*
- `[F-27]` Esto es lo que hacemos. Todos los años, en toda la compañía.
- `[F-28]` Pie: Pulsa {botón} para seguir / Pulsa {botón} para volver al inicio

## 11. Pausa, calibración y videos

- `[X-01]` Continuar
- `[X-02]` Reiniciar esta etapa
- `[X-08]` Calibrar mandos  →  Calibrando… {n}% · no los muevas  →  ✓ Mandos calibrados / ✗ Se movieron: calibrar otra vez / Calibrar: no hay Joy-Con en juego
- `[X-03]` Pantalla completa: Sí / No
- `[X-04]` Música: Sí / No
- `[X-05]` Volver al inicio
- `[X-06]` Sobre los videos: Pulsa el gatillo para saltar
- `[X-07]` Instrucciones de cualquier etapa, botón por defecto: Pulsa {botón} para continuar

**Pantalla «Calibrar mandos»** (menú principal → Controles)
- `[K-01]` Título: Calibrar mandos
- `[K-02]` Deja los Joy-Con quietos sobre una mesa  /  Listo. Prueba la linterna: mueve tu Joy-Con  /  No hay ningún Joy-Con en juego
- `[K-03]` No toques el stick. Se mide el desvío del giroscopio y el centro del stick (corrige el drift).
- `[K-04]` Con el mando quieto, su punto también debe quedarse quieto. HOME o CAPTURA recentra el punto.
- `[K-05]` Sin mandos: Conéctalo en la pantalla de inicio o con la tecla J. Los de reserva se calibran solos al entrar en juego.
- `[K-06]` Tarjeta: JUGADOR {n} — Joy-Con {izquierdo/derecho} — Esperando que esté quieto… / Midiendo… no lo muevas / ✓ Calibrado / No quedó quieto. Intenta otra vez
- `[K-07]` Pie: Gatillo o Enter: terminar · A / ↓ del Joy-Con o C: calibrar otra vez · + / − o Esc: volver

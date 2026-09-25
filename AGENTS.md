# Instrucciones para agentes de IA

Este archivo es para cualquier agente (Claude Code, Codex, Copilot u otro) que
trabaje sobre este repositorio. Léelo completo antes de la primera edición.

---

## 0. Si vienes a retomar el trabajo

0. Si es la primera vez que abres el proyecto en este equipo, lee
   [`docs/ARRANQUE-EN-OTRO-EQUIPO.md`](docs/ARRANQUE-EN-OTRO-EQUIPO.md):
   requisitos, cómo servirlo y cómo correr las pruebas.
1. **Lee [`docs/PLAN-DE-TRABAJO.md`](docs/PLAN-DE-TRABAJO.md)**: estado actual,
   lo que sigue en orden (fichas con criterio de aceptación), decisiones
   pendientes del usuario (D1-D3) e historial de decisiones.
2. Lee este archivo completo: las reglas no se negocian.
3. Corre la batería de pruebas (§6). Debe dar 116 pass, 0 fail, 8 skipped
   antes de que toques nada.
4. Construye **una** ficha a la vez, en el orden del plan, y actualiza su
   estado en el plan al terminar. No marques «hecho» lo que el usuario no
   haya probado en Chrome con los mandos: escribe «verificado por pruebas,
   falta Chrome».
5. **No implementes nada que dependa de una decisión pendiente** (hoy: D1,
   usar Three.js). Pregunta.

El usuario es el Coordinador de Analítica de Auditoría. Escribe en español;
responde en español, sin jerga técnica innecesaria. Prefiere ver funcionando
antes que leer que funciona.

---

## 1. Qué es esto en una frase

Una experiencia de tres etapas jugada con Joy-Con de Nintendo Switch (la
primera de un jugador, las dos últimas de uno o dos), que enseña el proceso de
Auditoría Interna **sin nombrarlo mientras se juega**, para el stand del *Tour
Conéctate* de Gases del Caribe. Cada etapa lo nombra en su pantalla final.

---

## 2. La regla de oro

> **En pantalla no aparece jamás una palabra del oficio de auditoría.**

Prohibido en cualquier texto visible por el visitante: *auditoría, auditor,
proceso, riesgo residual, control interno, hallazgo, papel de trabajo,
materialidad, muestreo, aseguramiento, cumplimiento, plan anual, informe*.

Las excepciones son **la revelación al final de cada etapa** (en `mapa.js`
el relato y el resultado; en `camino.js` la fase `revelacion`, «Así
trabajamos») y la escena `cierre.js`: ahí nombrar el oficio es el objetivo.
Mientras se juega —instrucciones, HUD, avisos, tablero— está mal. En El
Camino se juega con «algo escondido» y «descubrimientos»; «hallazgo» solo
aparece en la revelación.

**Traducción obligatoria:**

| En vez de… | Se dice… |
|---|---|
| proceso | lugar, región, territorio |
| riesgo | peligro, lo que puede salir mal |
| valor estratégico | lo que está en juego |
| indicador / dato anómalo | señal |
| auditar una zona | mandar un equipo |
| recursos de auditoría | equipos disponibles |
| herramienta de análisis | la linterna |
| priorizar | decidir a dónde ir primero |

Esta regla es fácil de romper por descuido y difícil de detectar en revisión de
código. Si dudas, consulta [`docs/NARRATIVA.md`](docs/NARRATIVA.md).

### 2.1 Segunda regla: vocabulario corriente

Añadida tras la primera prueba con usuarios reales. **Si una palabra obliga a
detenerse a pensar qué significa, está mal elegida.** Esto lo juega gente de
toda la compañía en Barranquilla: personal de campo, call center, cartera.

Ya retiradas por oscuras: *catalejo* (→ linterna), *paraje* (→ lugar),
*cartógrafo* (→ nada, se eliminó), *vado* (→ cruce), *estuario* (→ río).

Al escribir texto nuevo, la prueba es simple: ¿lo diría así en voz alta a un
compañero en el pasillo? Si no, reescríbelo.

### 2.2 Tercera regla: cada nombre es un guiño al proceso

Los lugares no llevan nombres decorativos. Llevan nombres que **al revelarse
en el cierre se explican solos y hacen sonreír**.

| Lugar | Proceso | Por qué ese nombre |
|---|---|---|
| El Gran Caudal | Facturación | Todo el consumo pasa por ahí y ahí se mide |
| La Represa | Recaudo y cartera | Retiene lo que baja por el caudal; no todo alcanza a salir |
| El Manantial | Compra y venta de gas | De ahí brota lo que mueve el territorio |
| La Montaña Perdida | Pérdida No Operacional | Sube gas por la ladera y arriba llega menos |
| Los Grandes Hornos | Gran Industria | Unos pocos consumen lo que miles en otra parte |
| Los Ramales | Construcciones e Ingeniería | De ahí salen los caminos nuevos |
| El Puente Viejo | Mantenimiento | Lleva años aguantando y nadie lo mira |
| La Fundición | Compras y contratación | Se funde el metal de los tratos; mucho calor, pocos testigos |
| La Torre de Señales | Dirección Digital | Desde arriba se ve todo; todas las señales pasan por ahí |
| El Faro | Atención a usuarios | Se oyen las voces de quienes viven en el territorio |
| Las Salinas | Tarifas y subsidios | Reglas endurecidas, escritas por gente de afuera |
| Los Acantilados | Seguridad y salud | Un paso en falso no se arregla con dinero |
| El Poblado | Gestión Humana | Ahí vive la gente que hace funcionar el territorio |
| **La Isla Brillante** | **Brilla** | Brilla a lo lejos, separada de todo |

**El listón para cualquier lugar nuevo:** si al leer «X era Y» nadie levanta
una ceja de reconocimiento, el nombre no sirve. Un nombre bonito que no dice
nada desperdicia el mejor momento de la experiencia.

Cada lugar lleva tres textos, cada uno para un momento distinto:

| Campo | Cuándo aparece |
|---|---|
| `pista` | Ficha flotante al apuntarlo en la fase de decidir |
| `verdad` | Qué era ese lugar, en el resultado |
| `porQueImporta` | Por qué debía o no elegirse |

Los tres van **dentro de la historia**. El proceso real solo se nombra en
`equivale`, y `equivale` solo se muestra en el cierre.

---

## 3. Restricciones técnicas que no se negocian

**No añadas dependencias.** Ni npm, ni CDN, ni librerías. El proyecto corre en
un equipo corporativo con Sophos Intercept X, que bloquea binarios sin firma, y
en una red que puede no dejar salir a un CDN el día del evento. Todo debe
funcionar con los archivos del repositorio y un navegador.

**No introduzcas un paso de compilación.** Módulos ES nativos servidos por
`python servidor.py` (sin caché). Si necesitas bundler, la respuesta es que no.

**No propongas pygame, Godot, Love2D, Electron ni ningún motor nativo.** Ya se
evaluaron y están bloqueados por Sophos. El diagnóstico completo, con hashes,
está en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md). No repitas esa
investigación.

**WebHID exige contexto seguro.** `file://` no sirve. Siempre `localhost`.

**Única excepción, aprobada por el usuario el 2026-09-22:** **Three.js**,
copiado una vez en `vendor/` con la versión fijada, para El Camino en 3D. Es
JavaScript que ejecuta Chrome, no un binario; no usa npm, ni CDN, ni paso de
compilación. **Ninguna otra librería, ni siquiera de ejemplos de Three.js, sin
volver a preguntar.** El razonamiento está en
[`docs/PLAN-GRAFICO-CAMINO.md`](docs/PLAN-GRAFICO-CAMINO.md) §3.

---

## 4. Convenciones de código

- **Todo en español**: nombres de variables, funciones, clases, comentarios y
  commits. `elegidas`, no `selected`. Es un proyecto interno en una empresa
  hispanohablante y lo van a leer personas del área, no solo programadores.
- Comentarios que expliquen **por qué**, no qué. El qué ya lo dice el código.
- Sin punto y coma opcional omitido: se usan.
- Dos espacios de indentación.
- Las escenas heredan de `Escena` (`src/core/engine.js`) e implementan
  `entrar / salir / actualizar(dt) / dibujar(ctx)`.
- Las escenas **nunca** leen el giroscopio directamente. Piden un `Puntero`
  (`src/core/input.js`) y reciben coordenadas de pantalla. Si necesitas un
  gesto nuevo, añádelo a `input.js`, no a la escena.
- Las escenas **nunca** preguntan por botones físicos (`ZR`, `A`). Preguntan
  por intención a través de `Acciones`: `confirmar()`, `cancelar()`. Así el
  mismo código funciona con Joy-Con izquierdo o derecho.

---

## 5. Cosas que rompen y no son obvias

**El IMU viene apagado.** Un Joy-Con recién conectado reporta ceros en
acelerómetro y giroscopio hasta que recibe el subcomando `0x40` con argumento
`0x01`. Si ves sensores en cero, es esto, no un mando averiado.

**El giroscopio deriva.** Integrar velocidad angular acumula error. Recentrar
no es un parche, es parte del diseño: el visitante recentra al empezar cada
etapa y puede hacerlo cuando quiera con HOME/CAPTURA.

**WebHID entrega el `DataView` sin el byte de report ID.** Todos los
desplazamientos del reporte `0x30` van corridos en uno respecto a la
documentación de ingeniería inversa, que sí cuenta ese byte. Ver
[`docs/PROTOCOLO-JOYCON.md`](docs/PROTOCOLO-JOYCON.md).

**Las regiones del mapa deben caer en tierra.** `src/datos/territorio.js`
define posiciones en fracción del lienzo y una costa generada
procedimentalmente. Si mueves una región o tocas `generarCosta()`, **verifica**
con la prueba de la sección 7. Una región en el mar se ve rota.

**El texto se mide antes de dibujarse, nunca se apila a mano.** Poner
coordenadas fijas (`y + 120`, `cx - 26`) funciona hasta que crece una frase o
cambia la pantalla, y entonces los bloques se montan. Usa `partirLineas()` de
`briefing.js` para medir y acumula la `y`. Si añades texto con posición fija,
lo estás rompiendo otra vez.

**El objeto `JoyCon` no se reemplaza nunca.** `Puntero` y `Acciones` guardan
una referencia a él. Si al cambiar de mando se creara una instancia nueva, esas
referencias apuntarían a la vieja y el juego dejaría de responder **sin dar
error**, que es la peor forma de fallar. Al implementar el cambio en caliente,
el dispositivo HID se sustituye dentro del objeto. Ver
[`docs/MODULO-MANDOS.md`](docs/MODULO-MANDOS.md).

**El puerto del servidor es 8740 y no se cambia.** Chrome ata las
autorizaciones de WebHID al origen, y el puerto forma parte del origen. Servir
en otro puerto vacía el inventario de mandos autorizados.

**La batería tiene cinco estados, no cien.** No dibujes porcentajes.

**El Joy-Con izquierdo lleva el sensor girado 180°.** Un signo fijo de ejes
deja la linterna al revés con uno de los dos mandos. El sentido lo decide la
gravedad en `Puntero._actualizarSigno()`; no lo sustituyas por una tabla L/R.

**Las pulsaciones se detectan por reporte, no por fotograma.** Comparar
`mascara` con `mascaraPrevia` dentro de un fotograma pierde pulsaciones cuando
Bluetooth entrega dos reportes de golpe: en la primera demo se perdían casi
todas. Usa siempre `reciénPulsado()` o `Acciones`. Las cinco reglas completas
están al final de [`docs/ESTABILIDAD.md`](docs/ESTABILIDAD.md).

**El audio nunca es obligatorio.** Web Audio puede no arrancar. Toda llamada
va como `this.audio && this.audio.sfx(...)`. Sin sonido el juego debe correr
igual.

**El respaldo de ratón debe seguir funcionando.** Cada escena acepta ratón
cuando no hay mando conectado. Es la red de seguridad para el día del evento.
No lo elimines al refactorizar.

---

## 6. Cómo ejecutar y probar

```bash
# Servir (desde la raíz del proyecto)
python servidor.py   # sin caché; ver servidor.py
# y abrir http://localhost:8740/index.html en Chrome
```

**Pruebas del mando** (obligatorias si tocas `joycon.js`, `input.js`,
`mandos.js` o el bucle del motor). Usan `node:test`, que viene con Node: cero
dependencias. Ver [`docs/ESTABILIDAD.md`](docs/ESTABILIDAD.md).

```bash
node --test tests/entrada.test.js tests/captura.test.js tests/multijugador.test.js tests/camino.test.js tests/regreso.test.js tests/camino3d.test.js tests/humo.test.js
```

`camino.test.js` vigila el equilibrio de El Camino (jugar en el centro sin
analizar no encuentra nada; explorar y analizar, casi todo) y la justicia del
generador. `humo.test.js` juega las escenas de principio a fin sobre un lienzo
falso: detecta un error de dibujo que rompería una partida delante de la gente.
Obligatorias si tocas `src/juego/`.

`entrada.test.js` simula el mando; `captura.test.js` reproduce grabaciones del
mando real (`tests/grabar-mando.cmd`). En Windows hay que nombrar los archivos:
`node --test tests/` no funciona.

El resto de verificaciones se hacen con Node ejecutando los módulos de datos
directamente, que son puros y no dependen del navegador.

**Verificación de sintaxis de todos los módulos:**

```bash
for f in $(find src -name '*.js'); do node --check "$f" || echo "FALLA $f"; done
```

**Verificación del mapa.** Cada región debe caer en tierra firme y ninguna
solaparse. **La Isla Brillante es la excepción**: lleva `oculta: true` y tiene que estar
FUERA de la costa; ahí está su gracia.

```bash
node --input-type=module -e "
import { REGIONES, generarCosta, dentroDeCosta } from './src/datos/territorio.js';
const costa = generarCosta();
let mal = 0;
for (const r of REGIONES) {
  const dentro = dentroDeCosta(r.x, r.y, costa);
  if (dentro === !!r.oculta) { console.log('MAL UBICADA:', r.nombre, dentro ? '(deberia estar fuera)' : '(esta en el mar)'); mal++; }
}
for (let i=0;i<REGIONES.length;i++) for (let j=i+1;j<REGIONES.length;j++) {
  const d = Math.hypot(REGIONES[i].x-REGIONES[j].x, REGIONES[i].y-REGIONES[j].y);
  if (d < 0.105) { console.log('MUY JUNTAS:', REGIONES[i].nombre, '/', REGIONES[j].nombre); mal++; }
}
console.log(mal ? 'HAY PROBLEMAS' : 'MAPA VALIDO');
"
```

**Verificación de las dos lecciones** — si cambias las lecturas de alguna
región, confirma que las dos trampas sigan dentro de las cinco correctas. Si
alguna sale del top 5, la etapa pierde su enseñanza:

- **El Puente Viejo** — riesgo alto, señal casi nula. Enseña que los datos
  cuentan lo que ya pasó, no lo que se deteriora en silencio.
- **La Isla Brillante** — está fuera del mapa. Enseña que lo que no se mira "porque no
  es lo nuestro" suele ser lo que menos control tiene.

```bash
node --input-type=module -e "
import { rankingIdeal, BANDERAS_DISPONIBLES } from './src/datos/territorio.js';
const top = rankingIdeal().slice(0, BANDERAS_DISPONIBLES).map(r => r.id);
console.log('top:', top.join(', '));
const ok = top.includes('puente') && top.includes('isla');
console.log(ok ? 'OK — las dos lecciones se mantienen' : 'ROTO — una trampa quedo fuera del top');
"
```

Cualquier cambio en `territorio.js` obliga a correr las tres.

---

## 7. Lo que NO debes hacer sin preguntar

- Cambiar la metáfora o el tono. Están decididos y documentados.
- Añadir marca corporativa, logos o colores de la empresa a las escenas de
  juego. La revelación al final es suficiente; adornarlo antes rompe el efecto.
- Simplificar la Etapa 1 "para que sea más fácil". La frustración de tener
  cinco equipos para catorce lugares **es** el contenido.
- Quitar La Isla Brillante o ponerla fácil de encontrar. Que casi nadie la halle es
  justamente el mensaje.
- Subir puntajes o hacer que todo el mundo gane. El cierre que más enseña es el
  que muestra lo que se te escapó.
- Convertir esto en una presentación con botones. Si deja de jugarse con
  movimiento, pierde la razón de existir.

---

## 8. Dónde está cada cosa

| Necesitas… | Archivo |
|---|---|
| **Saber qué sigue** | **`docs/PLAN-DE-TRABAJO.md`** |
| Reglas de El Camino (velocidad, lente, generador) | `src/juego/carrera.js` (constantes `CAMINO`) + `tests/camino.test.js` |
| Dibujo de El Camino | `src/juego/escenas/camino.js` (2D) y `src/juego/camino3d/` (3D) |
| Tocar el 3D | `src/juego/camino3d/vista3d.js` + `tests/camino3d.test.js`. **El 3D solo dibuja**: si cambias una regla, va en `carrera.js` |
| Añadir o cambiar una imagen | `assets/originales/` + `python herramientas/procesar-imagenes.py` |
| Plan gráfico 3D de El Camino | `docs/PLAN-GRAFICO-CAMINO.md` |
| Imágenes generadas con IA (catálogo y prompts) | `docs/ACTIVOS-VISUALES.md`; originales en `assets/originales/` |
| Probar si el equipo puede con 3D | `herramientas/prueba-webgl.html` |
| Saber si falla el mando o el juego | `herramientas/joycon-lab/abrir.cmd` |
| Poner el proyecto en otro equipo o en GitHub | `docs/ARRANQUE-EN-OTRO-EQUIPO.md` |
| **Ver una pantalla sin jugar hasta ella** | `herramientas/vista-escena.html?escena=ruta&t=2.9` (también desde Chrome sin interfaz: ver el comentario del archivo) |
| Reglas de El Regreso (física, cielo, puntaje) | `src/juego/vuelo.js` + `tests/regreso.test.js` |
| Dibujo de El Regreso | `src/juego/escenas/regreso.js` |
| Pantalla entre etapas | `src/juego/escenas/ruta.js` |
| **Ver una pantalla sin jugar hasta ella** | `herramientas/vista-escena.html?escena=ruta&t=2.9` (también desde Chrome sin interfaz: ver el comentario del archivo) |
| Reglas de El Regreso (física, cielo, puntaje) | `src/juego/vuelo.js` + `tests/regreso.test.js` |
| Dibujo de El Regreso | `src/juego/escenas/regreso.js` |
| Pantalla entre etapas | `src/juego/escenas/ruta.js` |
| Cambiar qué dicen las regiones | `src/datos/territorio.js` |
| Ajustar dificultad o tiempos | constantes al inicio de `src/juego/escenas/mapa.js` |
| Tocar el protocolo del mando | `src/core/joycon.js` + `docs/PROTOCOLO-JOYCON.md` |
| Cambiar sensibilidad del puntero | `src/core/input.js` |
| Colores y tipografía | `src/core/render.js` |
| Música y efectos de sonido | `src/core/audio.js` |
| Pantallas de instrucciones | `src/core/briefing.js` + el constructor de cada escena |
| Mandos, batería, cambio en caliente | `src/core/mandos.js` |
| Panel del operador (F9) | `src/ui/panel-mandos.js` |
| Escena de dos jugadores | copiar la estructura de `src/juego/escenas/prueba2j.js`; ver `docs/MULTIJUGADOR.md` |
| Añadir una etapa nueva | `docs/DISENO-JUEGO.md` primero, luego `src/juego/escenas/` |
| Entender el tono permitido | `docs/NARRATIVA.md` |
| Operar el stand el día del evento | `docs/OPERACION-STAND.md` |
| Gestionar mandos, batería, cambio en caliente | `docs/MODULO-MANDOS.md` |
| Diseñar una etapa de dos jugadores | `docs/MULTIJUGADOR.md` |

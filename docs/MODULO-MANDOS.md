# Módulo de mandos — plan de construcción

Gestión de Joy-Con para el stand: conectar, desconectar, sincronizar, probar,
cambiar de mando en caliente, y vigilar la batería.

**Estado:** implementado. Fases 1 a 5 en `src/core/mandos.js` y
`src/ui/panel-mandos.js`. Pendiente: probarlo en hardware durante una jornada
real, y adaptarlo a dos jugadores (ver [`MULTIJUGADOR.md`](MULTIJUGADOR.md)).

**Motivo:** en una jornada de seis horas el mando se descarga, se duerme y se
desconecta. Hoy eso obliga a recargar la página, y recargar delante de la fila
es exactamente lo que no puede pasar.

---

## 1. El problema real

Lo que hay hoy (`src/core/joycon.js`) sirve para una partida: conecta un mando
y lo usa. Lo que falta es todo lo demás.

| Situación en el stand | Qué pasa hoy | Qué debería pasar |
|---|---|---|
| El mando se queda sin batería a media partida | La experiencia se congela | Aviso previo y cambio al de relevo sin recargar |
| El mando se duerme entre visitantes | Hay que recargar la página | Se despierta o se reconecta solo |
| Llega un mando nuevo sin autorizar | Nadie sabe qué hacer | Flujo guiado de sincronización |
| «¿Está fallando el mando o el juego?» | Hay que abrir otra herramienta | Diagnóstico integrado con una tecla |
| ¿Cuánta batería queda? | Un número diminuto en la esquina | Panel del operador con aviso anticipado |

---

## 2. La restricción que define el diseño

### La batería es discreta, no continua

El reporte `0x30` entrega el nivel en el nibble alto del byte 1, y Nintendo solo
usa **cinco valores**:

| Valor | Significado | Autonomía aproximada restante |
|---|---|---|
| 8 | Llena | 15–20 h |
| 6 | Media | 8–12 h |
| 4 | Baja | 3–5 h |
| 2 | Crítica | 30–60 min |
| 0 | Vacía | minutos |

El bit 0 del mismo byte indica que está cargando.

**Consecuencia:** no se puede mostrar un porcentaje honesto. Mostrar «87 %» es
inventarse un dato. El módulo trabaja con estos cinco estados y con el tiempo
transcurrido entre transiciones, que sí es una señal real.

### Las autorizaciones de WebHID van atadas al origen

Chrome recuerda qué dispositivos autorizó **por origen** — esquema, host y
puerto. `http://localhost:8740` y `http://localhost:8741` son orígenes
distintos y no comparten permisos.

**Consecuencia:** el puerto del stand queda fijo en **8740**. Si alguien cambia
el puerto, todos los mandos hay que volver a autorizarlos a mano. Esto va como
advertencia en el propio panel.

### El emparejamiento Bluetooth es del sistema operativo

El navegador no puede emparejar un Joy-Con con Windows. Solo puede pedir
permiso para hablar con uno **ya emparejado**. Son dos pasos distintos y la
gente los confunde:

1. **Emparejar** (Windows, una vez por mando) — botón de sincronización del
   lateral y *Configuración → Bluetooth*.
2. **Autorizar** (Chrome, una vez por origen) — el selector de `requestDevice`.

El módulo no puede hacer el paso 1. Sí puede detectar que falta y explicarlo
bien, que es lo que hoy no ocurre.

---

## 3. Arquitectura

### Decisión central: el objeto `JoyCon` nunca se reemplaza

`Puntero` y `Acciones` guardan una referencia al `JoyCon` (`this.jc`). Si al
cambiar de mando se creara un objeto nuevo, esas referencias apuntarían al
viejo y el juego dejaría de responder sin dar error.

Por eso el cambio ocurre **dentro** del objeto: `JoyCon` cambia el dispositivo
HID que tiene debajo y conserva su identidad. Las escenas ni se enteran.

```
GestorMandos                     ← nuevo, src/core/mandos.js
  ├── inventario: MandoInfo[]    ← todos los autorizados, con su estado
  ├── activo: MandoInfo
  ├── joycon: JoyCon             ← SIEMPRE el mismo objeto
  │     └── cambiarDispositivo() ← nuevo método en joycon.js
  ├── vigilancia de batería
  └── eventos: 'cambio' | 'bateria' | 'perdido' | 'recuperado'

PanelMandos                      ← nuevo, src/ui/panel-mandos.js
  └── superposición HTML, la abre el operador con F9
```

### Por qué el panel es HTML y no lienzo

Tres razones. `requestDevice` necesita un gesto real del usuario sobre un
elemento del DOM. El panel tiene listas, botones y texto que el DOM resuelve
gratis. Y debe poder abrirse **encima de cualquier escena** sin que esta se
entere ni se pause.

---

## 4. Interfaz del módulo

```js
// src/core/mandos.js
export class GestorMandos extends EventTarget {
  constructor(joycon)

  // --- inventario
  async refrescar()            // navigator.hid.getDevices(), sin diálogo
  get inventario()             // [{ id, nombre, esIzquierdo, estado, bateria, cargando, ultimoVisto }]
  get activo()                 // el mando en uso, o null
  get relevo()                 // el mejor candidato para un cambio

  // --- ciclo de vida
  async autorizar()            // abre el selector de Chrome; exige gesto
  async activar(id)            // lo pone en juego (cambio en caliente)
  async soltar(id)             // lo cierra sin perder la autorización
  async cambiarARelevo()       // atajo: pasa al mejor disponible

  // --- diagnóstico
  async probar(id)             // 3 s de escucha; devuelve un informe
  get diagnostico()            // { hz, reportes, ultimoReporte, deriva, imuVivo }
}
```

`probar(id)` devuelve algo accionable, no un booleano:

```js
{
  ok: true,
  hz: 66,                 // < 40 indica interferencia o distancia
  imuVivo: true,          // false => el subcomando 0x40 no llegó
  botonesResponden: true,
  bateria: 6,
  latencia: 18,           // ms entre reportes, media
  veredicto: 'Funciona correctamente'
}
```

### Estados de un mando

```
desconocido → emparejado → autorizado → abierto → activo
                                ↓          ↓        ↓
                            (dormido) ← perdido ← agotado
```

`perdido` y `dormido` se distinguen: `dormido` se resuelve pulsando un botón,
`perdido` exige reabrir el dispositivo.

---

## 5. El panel del operador

Se abre con **F9**. Nunca aparece solo, y nunca lo ve el visitante salvo que el
operador lo llame.

```
┌─ MANDOS ─────────────────────────────── F9 cierra ─┐
│                                                     │
│  ● Joy-Con (R)   EN JUEGO      ████░ baja   67 Hz  │
│      quedan ~4 h · probar · soltar                  │
│                                                     │
│  ○ Joy-Con (L)   LISTO         █████ llena  —      │
│      poner en juego · probar                        │
│                                                     │
│  ＋ Sincronizar un mando nuevo                      │
│                                                     │
│  ──────────────────────────────────────────────────│
│  Servidor en el puerto 8740. No lo cambies: Chrome  │
│  olvidaría los mandos autorizados.                  │
└─────────────────────────────────────────────────────┘
```

Al pulsar **Sincronizar un mando nuevo**, si no hay ninguno emparejado en
Windows, el panel explica el paso que falta con el dibujo del botón lateral. No
sirve de nada abrir un selector vacío.

---

## 6. Vigilancia y alertas de batería

### Principio: nunca interrumpir a un visitante jugando

Una alerta a mitad de la Etapa 1 arruina la experiencia de esa persona para
ahorrarle treinta segundos al operador. El módulo **acumula** los avisos y los
suelta en el siguiente cambio de escena.

La única excepción es la desconexión total: ahí no hay nada que preservar.

### Escalado

| Nivel | Visitante ve | Operador ve | Acción |
|---|---|---|---|
| Llena / media | nada | chip normal | — |
| **Baja** (4) | nada | chip ámbar | Sugerir cambio entre visitantes |
| **Crítica** (2) | nada durante la partida | banda ámbar + aviso al terminar | Cambio recomendado ya |
| **Vacía / perdido** | «Cambiando de mando…» 2 s | panel abierto solo | Cambio automático al relevo |

### Estimación de autonomía

Los cinco estados no dan una curva, pero **el tiempo entre transiciones sí**.
El módulo anota cuándo bajó cada escalón en `localStorage` y con eso estima:

> *Bajó de llena a media en 5 h 10 min → quedan unas 4 h.*

Se muestra como aproximación explícita («~4 h»), nunca como dato exacto. En la
primera jornada no habrá historial y dirá «sin estimación todavía»; a partir de
la segunda ya sirve.

### Cambio automático

Cuando el activo llega a vacío o se pierde, y hay relevo con carga:

1. Se congela la escena y se muestra «Cambiando de mando…».
2. `joycon.cambiarDispositivo(nuevo)` — mismo objeto, dispositivo nuevo.
3. Secuencia de arranque: modo `0x30`, IMU `0x40`, vibración, LED.
4. **Calibración y recentrado automáticos**: es otro mando, con otro sesgo de
   giroscopio y otra orientación en la mano.
5. Un pulso de vibración en el mando nuevo, que además confirma al operador
   cuál quedó activo.
6. La escena continúa donde iba.

Presupuesto: **menos de 1,5 s**. Si tarda más, es preferible mostrar la
pantalla de instrucciones de la fase actual mientras tanto, que es tiempo que
el visitante aprovecha leyendo.

---

## 7. Diagnóstico integrado

Hoy, para saber si falla el mando o el juego, hay que abrir
`herramientas/joycon-lab/`. Eso implica salir de la experiencia delante de la
gente.

El plan es traer **lo imprescindible** de esa herramienta al panel: rejilla de
botones que se encienden, punto del stick, tres barras de giroscopio, Hz y
batería. Diez segundos de comprobación sin salir.

`herramientas/joycon-lab/` se queda como está: sigue siendo la herramienta profunda
—volcado hexadecimal, acelerómetro, orientación 3D— para cuando algo falle de
verdad. El panel es el estetoscopio; el laboratorio es la radiografía.

---

## 8. Fases de construcción

Ordenadas por lo que evita el fallo más caro primero.

### Fase 1 — Cambio en caliente *(el núcleo)*
`joycon.cambiarDispositivo()` + `GestorMandos` con inventario y activación.
Sin interfaz: se prueba desde la consola con `TI.mandos`.
**Evita:** recargar la página cuando se descarga un mando.
**Esfuerzo:** medio. Es donde está la dificultad real.

### Fase 2 — Panel del operador
Superposición HTML con F9: lista, activar, soltar, autorizar.
**Evita:** depender de quien construyó esto para cualquier gestión.
**Esfuerzo:** bajo.

### Fase 3 — Vigilancia de batería
Umbrales, avisos diferidos al cambio de escena, cambio automático al agotarse.
**Evita:** la muerte del mando en mitad de una partida.
**Esfuerzo:** bajo. El dato ya llega en cada reporte; no hay que sondear nada.

### Fase 4 — Diagnóstico integrado
La pestaña de prueba dentro del panel.
**Evita:** salir de la experiencia para diagnosticar.
**Esfuerzo:** bajo. Se adapta lo de `joycon-lab`.

### Fase 5 — Estimación de autonomía
Historial de transiciones en `localStorage`.
**Evita:** quedarse sin margen por no saber cuánto queda.
**Esfuerzo:** bajo, pero necesita una jornada de datos para valer algo.

Las fases 1 a 3 cubren el 90 % del riesgo operativo. Si hay poco tiempo antes
del evento, con esas tres basta.

---

## 9. Cómo se verifica

Sigue sin haber framework de pruebas, y las partes nuevas dependen del
navegador y del hardware. La verificación es por guion, con el mando en la
mano.

**Cambio en caliente sin perder el hilo**
1. Empezar la Etapa 1 y descubrir tres o cuatro lugares.
2. En consola: `TI.mandos.cambiarARelevo()`.
3. Comprobar que el mapa descubierto **sigue igual**, que el puntero responde
   al mando nuevo, y que el reloj no se reinició.

**Simular batería baja sin esperar horas**
`TI.mandos._forzarNivel(2)` inyecta el nivel sin tocar el hardware. Debe
aparecer el aviso al operador y **no** interrumpir la partida en curso.

**Pérdida súbita**
Apagar el mando activo manteniendo HOME pulsado. Debe pasar al relevo en menos
de 1,5 s.

**Autorizaciones atadas al origen**
Servir en 8741 en vez de 8740 y comprobar que el inventario sale vacío. Es la
prueba de que la advertencia del panel está justificada.

---

## 10. Riesgos conocidos

**Un mando sin autorizar no aparece.** `getDevices()` solo devuelve lo ya
autorizado, y `requestDevice()` exige un gesto del usuario. No hay cambio
automático posible hacia un mando que nadie autorizó antes. **Mitigación:**
autorizar los dos mandos en la prueba de humo, antes de que llegue nadie. Va
como paso obligatorio en `OPERACION-STAND.md`.

**Un Joy-Con dormido no responde a la escritura.** Los subcomandos se pierden
en silencio y el IMU no arranca. **Mitigación:** tras `cambiarDispositivo`,
confirmar que llegan reportes con IMU vivo antes de declarar el cambio
completo; si no, reintentar una vez y luego pedir que pulsen un botón.

**Chrome puede revocar permisos al limpiar datos del sitio.** **Mitigación:**
detectar inventario vacío al arrancar y guiar la reautorización.

**La estimación de autonomía puede engañar.** Cinco escalones son poca
resolución y la descarga no es lineal. **Mitigación:** mostrarla siempre como
aproximación y no automatizar ninguna decisión con ella; las decisiones se
toman con los umbrales, que son un dato real.

---

## 11. Archivos que toca

| Archivo | Cambio |
|---|---|
| `src/core/joycon.js` | Añadir `cambiarDispositivo()`. Separar la secuencia de arranque para poder reutilizarla |
| `src/core/mandos.js` | **Nuevo.** `GestorMandos` |
| `src/ui/panel-mandos.js` | **Nuevo.** Panel del operador |
| `src/main.js` | Instanciar el gestor, atar F9, exponer `TI.mandos` |
| `index.html` | Contenedor del panel y sus estilos |
| `docs/OPERACION-STAND.md` | Autorizar los dos mandos en la prueba de humo; cómo usar el panel |
| `docs/PROTOCOLO-JOYCON.md` | Tabla de los cinco niveles de batería |
| `AGENTS.md` | La regla de que el objeto `JoyCon` nunca se reemplaza |

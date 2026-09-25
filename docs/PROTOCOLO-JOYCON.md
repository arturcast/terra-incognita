# Protocolo del Joy-Con por WebHID

Referencia de lo que hay que saber para tocar `src/core/joycon.js`. Todo lo de
aquí está verificado sobre el hardware real (dos Joy-Con emparejados a Windows
11 por Bluetooth), no copiado de documentación.

## Identificación

| | Valor |
|---|---|
| Vendor ID | `0x057E` (Nintendo) |
| Product ID — Joy-Con (L) | `0x2006` |
| Product ID — Joy-Con (R) | `0x2007` |

Windows los enumera como **dos gamepads independientes**, no como un par. Para
unirlos en un mando único habría que fusionarlos por software. Este proyecto no
lo hace: usa uno solo.

## Lo primero que hay que saber

**El IMU viene apagado.** Un Joy-Con recién conectado entrega ceros en
acelerómetro y giroscopio, indefinidamente, hasta que recibe el subcomando
`0x40` con argumento `0x01`.

Este fue el hallazgo que desbloqueó el proyecto. Si alguien reporta «el
giroscopio no funciona», es esto en el 90 % de los casos.

**La API clásica de joystick no sirve.** `joyGetPosEx` de `winmm` y DirectInput
ven los Joy-Con como gamepads de 16 botones pero devuelven estado congelado
(ejes en 32767, botones en 0) aunque se estén pulsando. El descriptor HID del
Joy-Con es un bloque propietario (1 *button cap*, 10 *value caps*) que Windows
enumera pero no sabe interpretar. Tampoco son mandos XInput.

Solo funciona leer HID en crudo. Eso es exactamente lo que hace WebHID.

## Secuencia de arranque

En este orden, con pausas. Sin las pausas el mando ignora subcomandos.

```js
await subcomando(0x03, [0x30]);  await dormir(60);  // modo de reporte completo, 60 Hz
await subcomando(0x40, [0x01]);  await dormir(60);  // ENCENDER el IMU
await subcomando(0x48, [0x01]);  await dormir(60);  // habilitar vibración
await subcomando(0x30, [0x01]);  await dormir(30);  // LED de jugador
```

### Formato del reporte de salida para subcomandos

Report ID `0x01`, carga útil de 48 bytes:

```
[0]      contador de paquete, incrementa y se envuelve en 0x0F
[1..8]   datos de vibración — neutro: 00 01 40 40 00 01 40 40
[9]      identificador del subcomando
[10..]   argumentos
```

El contador debe incrementarse en cada envío, incluidos los de vibración. Si se
queda fijo, el mando empieza a descartar paquetes.

## Reporte de entrada `0x30`

**Cuidado con los desplazamientos.** WebHID entrega el `DataView` **sin** el
byte de report ID. Toda la documentación de ingeniería inversa que circula sí
lo cuenta, así que sus índices van corridos en uno respecto a estos.

| Offset (WebHID) | Contenido |
|---|---|
| `0` | contador de tiempo |
| `1` | batería en el nibble alto · carga en el bit 0 |
| `2` | botones del lado derecho |
| `3` | botones compartidos |
| `4` | botones del lado izquierdo |
| `5..7` | stick izquierdo, dos ejes de 12 bits |
| `8..10` | stick derecho |
| `11` | eco del vibrador |
| `12..47` | IMU: 3 muestras de 12 bytes, separadas 5 ms |

### Batería: cinco estados, no un porcentaje

El nibble alto del byte 1 no es una escala continua. Nintendo solo usa cinco
valores, y conviene saberlo antes de dibujar una barra que sugiera precisión
que no existe:

| Valor | Estado | Autonomía aproximada |
|---|---|---|
| 8 | Llena | 15–20 h |
| 6 | Media | 8–12 h |
| 4 | Baja | 3–5 h |
| 2 | Crítica | 30–60 min |
| 0 | Vacía | minutos |

El bit 0 del mismo byte indica que está cargando. Cualquier porcentaje que
muestre una interfaz es una interpolación inventada: lo honesto es trabajar con
umbrales. Ver [`MODULO-MANDOS.md`](MODULO-MANDOS.md).

### Botones

```
byte 2 (derecho):    bit 0 Y · 1 X · 2 B · 3 A · 4 SR · 5 SL · 6 R · 7 ZR
byte 3 (compartido): bit 0 − · 1 + · 2 StickR · 3 StickL · 4 Home · 5 Captura
byte 4 (izquierdo):  bit 0 ↓ · 1 ↑ · 2 → · 3 ← · 4 SR · 5 SL · 6 L · 7 ZL
```

En el código se acumulan en una máscara de 24 bits:
`derecho | compartido<<8 | izquierdo<<16`. Ver la constante `BOTON`.

### Sticks — 12 bits empaquetados en 3 bytes

```js
const x = d.getUint8(o)     | ((d.getUint8(o + 1) & 0x0f) << 8);
const y = (d.getUint8(o + 1) >> 4) | (d.getUint8(o + 2) << 4);
```

Sin calibración de fábrica el centro no es 2048. El driver promedia los
primeros 30 reportes para fijarlo, **así que no hay que tocar el stick al
conectar**. La calibración real vive en la SPI del mando (subcomando `0x10`);
para esta experiencia no hace falta.

### IMU — 3 muestras por reporte

Cada bloque de 12 bytes, todos `int16` little-endian:

```
+0  accel X    +2  accel Y    +4  accel Z
+6  giro  X    +8  giro  Y   +10  giro  Z
```

Factores de escala:

```
acelerómetro   × 0.000244   → g
giroscopio     × 0.06103    → grados/segundo
```

Llegan tres muestras por reporte porque el IMU muestrea a 200 Hz y el reporte
sale a 60 Hz. Integrar las tres, no solo la última, o se pierde dos tercios del
movimiento.

### Deriva

Integrar velocidad angular acumula error. Dos mitigaciones, ambas en el driver:

- **Bias**: `calibrar()` promedia 180 muestras con el mando quieto y resta ese
  sesgo. Se llama al conectar, cuando el mando suele estar en la mesa.
- **Recentrar**: `recentrar()` pone los ángulos en cero. Es una operación
  normal del diseño, no un parche. El visitante puede hacerlo con HOME/CAPTURA.

## Apagar el mando

El Joy-Con **no tiene botón de encendido**. Lo más parecido a apagarlo es
mandarlo a dormir con el subcomando `0x06` (estado HCI):

| Argumento | Efecto |
|---|---|
| `0x00` | Desconectar y dormir |
| `0x01` | Reiniciar y reconectar |
| `0x02` | Reiniciar y entrar en modo emparejamiento |

Sin este comando el mando se queda unos treinta segundos parpadeando en busca
de conexión antes de dormirse por su cuenta. Con él es inmediato.

Dormirlo **no** rompe el emparejamiento con Windows ni la autorización de
Chrome: para despertarlo basta pulsar cualquier botón. Implementado en
`JoyCon.dormir()`.

## Vibración

Report ID `0x10`, carga útil de 48 bytes:

```
[0]      contador de paquete
[1..4]   actuador izquierdo
[5..8]   actuador derecho
```

La codificación de frecuencia y amplitud no es lineal; está implementada en
`codificarVibracion()`. Neutro (apagado) es `00 01 40 40`.

Un pulso es encender y apagar con un `setTimeout`. El mando **no** apaga solo:
si no se envía el apagado, vibra indefinidamente.

## Medidas observadas

Sobre el hardware real, capturando 14 segundos por mando:

| | Joy-Con (L) | Joy-Con (R) |
|---|---|---|
| Frecuencia de reporte | ~67 Hz | ~65 Hz |
| Reportes en 14 s | 934 | 905 |
| Rango útil del stick | ~2585 | ~1352 * |

\* El rango menor del derecho corresponde a un recorrido parcial durante la
prueba, no a un defecto medido.

## Fallos frecuentes

| Síntoma | Causa |
|---|---|
| IMU en ceros | Falta el subcomando `0x40` |
| `navigator.hid` no existe | Firefox, o se abrió con `file://` en vez de `localhost` |
| No se puede abrir el dispositivo | Steam, BetterJoy u otro programa lo tiene tomado |
| El mando deja de responder | Se durmió; pulsar cualquier botón lo despierta |
| Se mueve solo | Falta calibrar el bias (tecla `C` con el mando quieto) |
| El puntero se va de la pantalla | Deriva acumulada; recentrar con HOME/CAPTURA |

## Banco de pruebas

En `herramientas/joycon-lab/` hay una herramienta independiente que muestra en vivo
todos los botones, el stick, el acelerómetro, el giroscopio y el volcado hexa
del reporte. Es el sitio donde diagnosticar el hardware antes de sospechar del
juego.

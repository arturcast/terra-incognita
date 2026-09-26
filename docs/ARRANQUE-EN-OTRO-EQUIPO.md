# Arrancar en otro equipo

Para quien recibe este proyecto por primera vez: cómo ponerlo a andar, cómo
seguir trabajando (con o sin ayuda de una IA) y cómo publicarlo en GitHub.

**Si solo vas a continuar el trabajo**, lee esto y después
[`PLAN-DE-TRABAJO.md`](PLAN-DE-TRABAJO.md), que es el estado real del proyecto.

---

## 1. Qué es

Una experiencia interactiva de tres etapas que se juega con los mandos Joy-Con
de una Nintendo Switch, para el stand de **Auditoría de Control Interno** en el
*Tour Conéctate* de Gases del Caribe (Barranquilla). El visitante juega sin que
se le hable de auditoría; al final de cada etapa se le revela qué acaba de
hacer. El porqué de todo está en [`../README.md`](../README.md) y
[`NARRATIVA.md`](NARRATIVA.md).

Corre en el navegador, sin instalar nada y sin internet.

---

## 2. Qué necesitas

| Para | Necesitas | Probado con |
|---|---|---|
| Jugar | **Google Chrome** o Edge (WebHID no existe en Safari ni Firefox) | Chrome en Windows 11 |
| Servir los archivos | **Python 3.8+** | 3.11.11 |
| Correr las pruebas | **Node 20+** (solo `node`, sin npm) | 22.23.2 |
| Jugar con mando | Un Joy-Con (izquierdo o derecho) por jugador, emparejado por Bluetooth | Joy-Con de Switch 1 |
| Grabar el mando (opcional) | `pip install hidapi` | — |

**No hace falta:** `npm install`, compilar, ni conexión a internet. La única
librería del proyecto, Three.js, viene copiada en `vendor/`.

Sin Joy-Con también se juega: la pantalla de inicio ofrece **Continuar con
ratón**, y con el teclado valen `Espacio`/`Enter` y las flechas.

---

## 3. Ponerlo a andar

```bash
git clone <la-url-del-repositorio>
cd terra-incognita
python servidor.py          # deja esta ventana abierta
```

y abre **http://localhost:8740/index.html** en Chrome.

En Windows, `abrir.cmd` hace las dos cosas de un doble clic. En macOS o Linux,
`./abrir.sh`.

> **El puerto 8740 no se cambia.** Chrome ata los permisos de los mandos al
> origen, y el puerto forma parte del origen: si lo cambias, hay que volver a
> autorizar cada Joy-Con. Para pruebas sueltas sí puedes usar otro:
> `python servidor.py 8746`.

> **No abras `index.html` con doble clic.** WebHID exige contexto seguro y
> `file://` no lo es. Por eso existe el servidor.

> **«La página localhost ha rechazado la conexión» (`ERR_CONNECTION_REFUSED`)**
> quiere decir que el servidor no está corriendo; no es el antivirus.
> - Casi siempre falta **Python**: `abrir.cmd` lo detecta y lo dice. Instálalo
>   desde https://www.python.org/downloads/ marcando **«Add python.exe to
>   PATH»**, y vuelve a abrir `abrir.cmd`. (El «python» de la Microsoft Store
>   que solo abre la tienda no sirve.)
> - La ventana negra de `abrir.cmd` tiene que **quedarse abierta** mientras se
>   juega: al cerrarla se apaga el servidor.
> - `abrir.cmd` abre Chrome cuando el servidor ya está escuchando. Si abriste
>   la dirección a mano antes de tiempo, basta con recargar (F5).

### Atajos mientras juegas

`F` pantalla completa · `J` panel de mandos del operador (o `F9`) · `1` `2` `3` saltar
a una etapa · `0` la pantalla del recorrido · `P` sala de prueba de dos
jugadores · `C` calibrar · `R` recentrar · `M` silenciar · `Esc` volver al
inicio.

---

## 4. Las pruebas

Antes de tocar nada, y después de cada cambio:

```bash
node --test tests/entrada.test.js tests/captura.test.js tests/multijugador.test.js tests/camino.test.js tests/regreso.test.js tests/camino3d.test.js tests/humo.test.js tests/joycon-flujo.test.js
```

Resultado esperado hoy: **166 pruebas, 158 pasan, 0 fallan, 8 omitidas.** Las
omitidas son pruebas de dirección sobre grabaciones antiguas del mando que no
las permiten: es lo normal, no un fallo.

En Windows hay que nombrar los archivos: `node --test tests/` no funciona.

Estas pruebas no son decorado. Detectaron, entre otras cosas, que una pulsación
se saltaba una pantalla entera y que el generador ponía hallazgos imposibles de
alcanzar. Lo que **no** ven es cómo se ve y cómo se siente: eso solo se
comprueba en Chrome con los mandos en la mano.

---

## 5. Cómo seguir trabajando con una IA

El proyecto está escrito para que un agente (Claude Code, Codex, Copilot…)
pueda retomarlo en frío. Ábrelo en la carpeta `terra-incognita` y dale este
primer mensaje:

```
Este es el proyecto Terra Incógnita. Lee, en este orden:
  docs/ARRANQUE-EN-OTRO-EQUIPO.md, docs/PLAN-DE-TRABAJO.md y AGENTS.md.
Después corre la batería de pruebas y dime en qué estado está el proyecto y
qué propones hacer a continuación, sin tocar nada todavía.
```

Reglas que el proyecto se toma en serio, y que están en
[`../AGENTS.md`](../AGENTS.md):

- **Cero dependencias nuevas.** La excepción, ya aprobada, es Three.js en
  `vendor/`. Nada de npm, CDN ni compilación: el equipo corporativo bloquea
  binarios sin firma y la red del evento puede fallar.
- **Todo en español**, incluidos nombres de variables y comentarios: lo lee
  gente del área, no solo programadores.
- **Mientras se juega no se nombra el oficio.** «Auditoría», «hallazgo» o
  «plan anual» solo aparecen en la revelación del final de cada etapa.
- **La lógica del juego vive aparte del dibujo** (`carrera.js`, `vuelo.js`,
  `territorio.js` son puros y se prueban en Node). Si cambias una regla, va
  ahí y con su prueba.

---

## 6. En qué estado está

| Etapa | Estado |
|---|---|
| 1 · El Mapa | Jugable y probada con mandos; su revelación final es nueva y **falta probar** |
| 2 · El Camino (en 3D) | Jugable; la mecánica probada con mandos, el 3D **falta probar** |
| 3 · El Regreso | Jugable y probada con mandos |
| Pantalla entre etapas | Construida; **falta probar** |

Lo pendiente, con fichas de trabajo listas para repartir, está en
[`PLAN-DE-TRABAJO.md`](PLAN-DE-TRABAJO.md). Ahí también está el historial de
decisiones: por qué es web y no un motor de videojuegos, por qué tres etapas y
no seis, y qué se aprobó y cuándo.

---

## 7. El repositorio

**https://github.com/arturcast/terra-incognita** — privado, rama `main`.
Creado el 2026-09-25 con todo el proyecto (125 archivos).

```bash
git clone https://github.com/arturcast/terra-incognita.git
```

Para dar acceso a alguien: en GitHub, *Settings → Collaborators → Add people*.
Con permiso de escritura puede clonar, trabajar y subir cambios.

Tres cosas que conviene saber:

1. **Es privado, y debe seguir siéndolo.** Aquí hay material interno de la
   compañía: los nombres de los procesos y qué revisa Auditoría en cada uno,
   los textos que se van a proyectar en el evento y el guion completo. Nada de
   esto es secreto técnico, pero no es material para publicar en abierto sin
   preguntarle a Comunicaciones y a la Dirección de Auditoría.
2. **Pesa unos 32 MB.** La mayor parte son las imágenes originales generadas
   con IA (`assets/originales/`, 27 MB), que se conservan a propósito: sin
   ellas no se pueden volver a procesar. Si quieres un repositorio liviano,
   quítalas y deja solo `assets/` (1,4 MB), que es lo que el juego carga.
3. **No hay claves ni datos personales** en el proyecto, y no debe haberlos.
   Las grabaciones de `tests/capturas/` son movimientos de un mando, nada más.

**Licencia:** no lleva. Es material interno de Gases del Caribe. La única
pieza de terceros es Three.js, con su licencia MIT en
`vendor/LICENSE-three.txt`. Las imágenes se generaron con IA para este
proyecto; están anotadas en [`ACTIVOS-VISUALES.md`](ACTIVOS-VISUALES.md).

---

## 8. Dónde está cada cosa

```
terra-incognita/
├── README.md              qué es y por qué, para cualquiera
├── AGENTS.md / CLAUDE.md  las reglas, para quien programa (o para una IA)
├── index.html, abrir.cmd, abrir.sh, servidor.py
├── src/                   el juego (ver README para el detalle)
├── vendor/                Three.js r161, la única librería
├── assets/                imágenes listas para el juego (+ originales/)
├── tests/                 las pruebas y las grabaciones de mando reales
├── herramientas/
│   ├── prueba-webgl.html  ¿este equipo puede con el 3D?
│   ├── vista-escena.html  ver una pantalla suelta sin jugar hasta ella
│   ├── procesar-imagenes.py
│   └── joycon-lab/        banco de pruebas del mando, independiente del juego
└── docs/
    ├── ARRANQUE-EN-OTRO-EQUIPO.md   este archivo
    ├── PLAN-DE-TRABAJO.md           estado, pendientes y decisiones
    ├── ARQUITECTURA.md              decisiones técnicas y por qué
    ├── NARRATIVA.md                 qué se puede decir y qué no
    ├── DISENO-JUEGO.md              las tres etapas, mecánica por mecánica
    ├── PLAN-GRAFICO-CAMINO.md       el 3D de El Camino
    ├── ACTIVOS-VISUALES.md          las imágenes: catálogo y prompts
    ├── MULTIJUGADOR.md              dos Joy-Con a la vez
    ├── MODULO-MANDOS.md             batería, relevo, panel de mandos (J)
    ├── ESTABILIDAD.md               por qué falló el mando y cómo se prueba
    ├── PROTOCOLO-JOYCON.md          el protocolo HID, documentado
    ├── OPERACION-STAND.md           guion y checklist del día del evento
    ├── TEXTOS-DEL-JUEGO.md          todos los textos del juego, con código por línea
    └── CINEMATICAS.md               los cinco videos: historia y prompts
```

---

## 9. Si algo no funciona

| Síntoma | Qué mirar |
|---|---|
| La página carga en blanco | Que la abras por `http://localhost:8740`, no con doble clic |
| «Conectar Joy-Con» no lista nada | Empareja primero el mando por Bluetooth en el sistema; en Windows aparece como *Joy-Con (L)* o *(R)* |
| El mando se conecta pero no responde | `herramientas/joycon-lab/abrir.cmd`: si ahí funciona, el problema es del juego; si no, del mando. Ver [`ESTABILIDAD.md`](ESTABILIDAD.md) |
| El 3D se ve a tirones | Abre `herramientas/prueba-webgl.html`. El juego ya baja solo a 2D si no rinde |
| Cambié un archivo y Chrome sigue igual | El servidor sirve sin caché; asegúrate de haber reiniciado `servidor.py` si cambiaste el propio servidor |

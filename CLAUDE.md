# CLAUDE.md

Instrucciones para Claude Code en este repositorio.

**Para retomar: [`docs/PLAN-DE-TRABAJO.md`](docs/PLAN-DE-TRABAJO.md)** dice
dónde estamos y qué sigue. Si el proyecto es nuevo en este equipo, antes:
[`docs/ARRANQUE-EN-OTRO-EQUIPO.md`](docs/ARRANQUE-EN-OTRO-EQUIPO.md).

**Lee [`AGENTS.md`](AGENTS.md) completo antes de tu primera edición.** Contiene
las reglas del proyecto y no se repiten aquí. Lo que sigue son solo los puntos
que más se olvidan.

## Los tres que más se rompen

1. **Regla de oro narrativa** — ninguna palabra del oficio de auditoría en
   texto visible mientras se juega; solo en la revelación de cada etapa y en
   `src/juego/escenas/cierre.js`. Ver
   [`docs/NARRATIVA.md`](docs/NARRATIVA.md).

2. **Cero dependencias, cero compilación** — Sophos Intercept X bloquea
   binarios sin firma en este equipo, y la red del evento puede no dejar salir
   a un CDN. Nada de npm, nada de bundlers, nada de CDN.

3. **Vocabulario corriente** — si una palabra hace dudar a alguien de call
   center o de campo, está mal elegida. Nada de *catalejo*, *paraje*, *vado*.

4. **Tras tocar `src/datos/territorio.js`**, corre las verificaciones de la
   sección 6 de `AGENTS.md`: sintaxis, validez del mapa, y que *El Puente
   Viejo* y *La Isla Brillante* sigan entre las cinco regiones correctas.

5. **Nada de texto con coordenadas fijas.** Mide con `partirLineas()` y
   acumula. Es la causa de que los títulos se montaran.

6. **Tras tocar el mando, el puntero, el gestor o el motor**, `node --test
   tests/entrada.test.js tests/captura.test.js tests/multijugador.test.js tests/camino.test.js tests/regreso.test.js tests/camino3d.test.js tests/humo.test.js tests/joycon-flujo.test.js`.
   También tras tocar `src/juego/` (equilibrio de El Camino y prueba de humo). Ver [`docs/ESTABILIDAD.md`](docs/ESTABILIDAD.md):
   la primera demo falló por cosas que solo esas pruebas ven.

## Ejecutar

```bash
python servidor.py   # sin caché; ver servidor.py
# Chrome -> http://localhost:8740/index.html
```

No abras `index.html` por doble clic: WebHID exige contexto seguro y `file://`
no lo es.

## Idioma

Todo el código, los comentarios y los commits van en español.

#!/usr/bin/env bash
# Terra Incógnita — lanzador para macOS y Linux. En Windows se usa abrir.cmd.
#
# WebHID exige contexto seguro: localhost lo es; abrir el .html directo NO.
# servidor.py sirve sin caché, para que cada recarga traiga el código actual.
#
# Aviso: los Joy-Con solo se han probado en Chrome sobre Windows. En macOS y
# Linux el juego se ve igual, pero el emparejamiento Bluetooth puede
# comportarse distinto; el botón «Continuar con ratón» siempre funciona.
set -e
cd "$(dirname "$0")"

URL="http://localhost:8740/index.html"
echo
echo "  TERRA INCÓGNITA"
echo "  $URL"
echo

# El servidor abre el navegador cuando ya está escuchando (--abrir): así no
# sale «conexión rechazada» por abrirlo antes de tiempo.
python3 servidor.py --abrir

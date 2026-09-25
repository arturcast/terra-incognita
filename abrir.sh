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

# Se abre Chrome si está; si no, el navegador por defecto (que debe ser Chrome
# o Edge: WebHID no existe en Safari ni en Firefox).
if command -v google-chrome >/dev/null 2>&1; then
  google-chrome --start-fullscreen "$URL" &
elif [ -d "/Applications/Google Chrome.app" ]; then
  open -a "Google Chrome" --args --start-fullscreen "$URL" &
else
  echo "  No se encontró Chrome: abre $URL a mano en Chrome o Edge."
fi

python3 servidor.py

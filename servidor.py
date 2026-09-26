# -*- coding: utf-8 -*-
"""
servidor.py — Sirve el juego en http://localhost:8740 SIN caché.

Por qué no basta `python -m http.server`: ese servidor no le dice al
navegador que no guarde los archivos, y Chrome puede seguir usando una copia
vieja de un módulo después de actualizarlo. Pasó de verdad: tras añadir el modo
de dos jugadores, el panel de mandos (J) seguía mostrando la versión anterior.

Aquí cada respuesta lleva `Cache-Control: no-store`: cada recarga trae el
código que hay en disco. En un stand donde se ajusta sobre la marcha, eso vale
más que los milisegundos que ahorraría la caché.

El puerto es 8740 y no se cambia: Chrome ata las autorizaciones de los mandos
al origen, y el puerto forma parte del origen (ver docs/MODULO-MANDOS.md).

Uso:  python servidor.py          (lo lanza abrir.cmd)
"""
import http.server
import os
import socketserver
import sys

# Otro puerto solo para pruebas. En el stand, siempre 8740.
PUERTO = int(sys.argv[1]) if len(sys.argv) > 1 else 8740


class SinCache(http.server.SimpleHTTPRequestHandler):
    # Los módulos ES exigen un tipo JavaScript o el navegador no los ejecuta.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.json': 'application/json',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, formato, *args):
        pass   # silencio: la ventana del servidor no debe llenarse de ruido


class Servidor(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with Servidor(('127.0.0.1', PUERTO), SinCache) as s:
        print('  Sirviendo en http://localhost:%d  (sin caché)' % PUERTO)
        print('  Cierra esta ventana para detener el servidor.')
        s.serve_forever()

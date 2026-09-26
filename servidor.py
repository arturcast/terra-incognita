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
import socket
import socketserver
import sys

# Otro puerto solo para pruebas. En el stand, siempre 8740.
#   python servidor.py            solo sirve
#   python servidor.py --abrir    sirve y, ya escuchando, abre Chrome (abrir.cmd)
#   python servidor.py 8741       otro puerto (pruebas)
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
PUERTO = int(ARGS[0]) if ARGS else 8740
ABRIR = '--abrir' in sys.argv
URL = 'http://localhost:%d/index.html' % PUERTO


def abrir_navegador():
    """
    Abre Chrome en pantalla completa; si no está, Edge (los dos tienen WebHID);
    si tampoco, el navegador por defecto. Se llama con el servidor YA
    escuchando: así nunca sale «ERR_CONNECTION_REFUSED» por llegar antes.
    """
    import subprocess
    import webbrowser
    candidatos = []
    if os.name == 'nt':
        for base in (os.environ.get('PROGRAMFILES'), os.environ.get('PROGRAMFILES(X86)'), os.environ.get('LOCALAPPDATA')):
            if base:
                candidatos.append(os.path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'))
        for base in (os.environ.get('PROGRAMFILES(X86)'), os.environ.get('PROGRAMFILES')):
            if base:
                candidatos.append(os.path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
    for ruta in candidatos:
        if os.path.isfile(ruta):
            subprocess.Popen([ruta, '--start-fullscreen', URL])
            return
    print('  No se encontró Chrome ni Edge: se abre el navegador por defecto.')
    print('  Si no es Chrome o Edge, los Joy-Con no funcionarán (Firefox y Safari no tienen WebHID).')
    webbrowser.open(URL)


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
    # En Windows, SO_REUSEADDR deja que DOS servidores abran el mismo puerto
    # (y el segundo se queda colgado sin servir nada). Ahí se usa el modo
    # exclusivo, para que el segundo sepa que el juego ya estaba abierto.
    allow_reuse_address = os.name != 'nt'

    def server_bind(self):
        if os.name == 'nt' and hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    try:
        s = Servidor(('127.0.0.1', PUERTO), SinCache)
    except OSError:
        # El puerto ya está ocupado: casi siempre es que el juego ya está
        # abierto en otra ventana negra. Se abre el navegador y listo.
        print('  El puerto %d ya está en uso: el juego ya estaba abierto en otra ventana.' % PUERTO)
        print('  Si no, cierra el programa que lo usa y vuelve a abrir abrir.cmd.')
        if ABRIR:
            abrir_navegador()
        sys.exit(0)
    with s:
        print('  Sirviendo en %s  (sin caché)' % URL)
        print('  Cierra esta ventana para detener el servidor.')
        if ABRIR:
            abrir_navegador()
        s.serve_forever()

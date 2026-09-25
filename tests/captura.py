# -*- coding: utf-8 -*-
"""
captura.py — Graba el Joy-Con real para validar el juego con datos de verdad.

Guía por siete fases y guarda cada reporte 0x30 tal cual lo entregaría
WebHID. Después `tests/captura.test.js` reproduce la grabación dentro del
código del juego y comprueba que la linterna y los botones se comportan como
deben con ESE mando y ESA mano.

Cada fase espera a que la persona pulse Enter: primero se lee, se acomoda el
mando, y solo entonces empieza la cuenta atrás. La primera versión arrancaba
sola y no daba tiempo; además decía "gira", y "girar" se entendía como torcer
la muñeca, que no es lo que mueve una linterna.

Uso (desde la carpeta terra-incognita):
    python tests/captura.py          graba todos los Joy-Con despiertos, uno tras otro
    python tests/captura.py R        solo el derecho
    python tests/captura.py L        solo el izquierdo

Requiere el paquete `hidapi` (pip install hidapi). Cierra el juego en Chrome
antes de grabar, para que no compitan por el mando.
"""
import hid
import json
import os
import sys
import time
from datetime import datetime

VID = 0x057E
PIDS = {0x2006: 'L', 0x2007: 'R'}
GYR = 0.06103

COMO_SOSTENER = """
  Sostén el Joy-Con como una LINTERNA: la punta apuntando a la pantalla,
  como lo tenías en el juego. Mantén ese mismo agarre en todas las fases.

  Para mover la luz, mueve la PUNTA del mando. NO tuerzas la muñeca.

      BIEN: la punta se mueve             MAL: el mando gira sobre sí mismo
      (la luz se desplaza)                (como girando una llave)

          <--  [=====]  -->                     (  [=====]  )
                                                  ↻        ↺
"""

# (clave, segundos, título, explicación). Las fases "derecha" y "arriba"
# existen para saber el SENTIDO de cada eje: un solo movimiento, un solo sentido.
FASES = [
    ('mesa', 5, 'SOBRE LA MESA',
     'Deja el Joy-Con boca arriba sobre la mesa y suéltalo.\n'
     '  No lo toques mientras graba.'),
    ('mano', 6, 'QUIETO EN LA MANO',
     'Tómalo como una linterna y apunta al CENTRO de la pantalla.\n'
     '  Cuando ya lo tengas quieto, pulsa Enter. Mientras graba, no lo muevas.'),
    ('derecha', 5, 'HACIA LA DERECHA',
     'Apunta al CENTRO de la pantalla.\n'
     '  Cuando diga GRABANDO, mueve despacio la PUNTA del mando hacia la DERECHA,\n'
     '  como alumbrando algo que está a tu derecha, y QUÉDATE AHÍ.\n'
     '  Un solo movimiento. Sin volver. Sin torcer la muñeca.'),
    ('arriba', 5, 'HACIA ARRIBA',
     'Vuelve a apuntar al CENTRO de la pantalla.\n'
     '  Cuando diga GRABANDO, sube despacio la PUNTA del mando hacia ARRIBA,\n'
     '  como alumbrando el techo por encima de la pantalla, y QUÉDATE AHÍ.\n'
     '  Un solo movimiento. Sin volver.'),
    ('horizontal', 6, 'IZQUIERDA Y DERECHA',
     'Mueve la luz de IZQUIERDA a DERECHA varias veces,\n'
     '  como barriendo una pared con la linterna. Sin torcer la muñeca.'),
    ('vertical', 6, 'ARRIBA Y ABAJO',
     'Ahora mueve la luz de ARRIBA a ABAJO varias veces,\n'
     '  como asintiendo con la linterna.'),
    ('botones', 5, 'EL GATILLO',
     'Pulsa rápido el gatillo de atrás unas 10 veces:\n'
     '  ZR si es el Joy-Con derecho, ZL si es el izquierdo.'),
]

_contador = 0


def subcomando(h, sid, args=()):
    global _contador
    buf = [0x01, _contador & 0x0F, 0x00, 0x01, 0x40, 0x40, 0x00, 0x01, 0x40, 0x40, sid] + list(args)
    buf += [0] * (49 - len(buf))
    _contador += 1
    h.write(buf)
    time.sleep(0.06)


def vaciar(h):
    """
    Descarta lo que el sistema tenía guardado. hidapi acumula reportes mientras
    nadie lee y los entrega de golpe al empezar, todos con la misma hora: eso
    contaminaba el principio de cada fase con lo que pasó durante la espera.

    Ojo: en esta librería `read(n, 0)` NO significa "sin esperar", sino
    "esperar sin límite". Como el mando transmite sin parar, un bucle así no
    termina nunca (así se colgó la fase 1). Se usa el modo no bloqueante y,
    además, un tope de tiempo.
    """
    h.set_nonblocking(1)
    limite = time.perf_counter() + 0.5
    try:
        while time.perf_counter() < limite and h.read(512):
            pass
    finally:
        h.set_nonblocking(0)


def preparar(n, total, titulo, texto):
    print()
    print('-' * 70)
    print('  FASE %d DE %d:  %s' % (n, total, titulo))
    print('-' * 70)
    print('  ' + texto)
    print()
    input('  Cuando estés listo, pulsa Enter...')
    for s in (3, 2, 1):
        print('      empieza en %d...' % s, end='\r', flush=True)
        time.sleep(1)
    print('      >>> GRABANDO <<<        ', flush=True)


def grabar_mando(info):
    lado = PIDS[info['product_id']]
    h = hid.device()
    h.open_path(info['path'])
    subcomando(h, 0x03, [0x30])   # reporte completo
    subcomando(h, 0x40, [0x01])   # IMU encendido
    subcomando(h, 0x30, [0x01 if lado == 'L' else 0x02])

    print()
    print('=' * 70)
    print('  JOY-CON %s' % ('IZQUIERDO (L)' if lado == 'L' else 'DERECHO (R)'))
    print('=' * 70)
    print(COMO_SOSTENER)
    input('  Toma el Joy-Con %s y pulsa Enter para empezar...' % ('izquierdo' if lado == 'L' else 'derecho'))

    registros = []
    t0 = time.perf_counter()
    for n, (fase, segundos, titulo, texto) in enumerate(FASES, 1):
        preparar(n, len(FASES), titulo, texto)
        vaciar(h)
        fin = time.perf_counter() + segundos
        while time.perf_counter() < fin:
            r = h.read(512, 30)
            if r and r[0] == 0x30 and len(r) >= 49:
                registros.append({
                    't': round(time.perf_counter() - t0, 5),
                    'f': fase,
                    'r': bytes(r[1:49]).hex(),   # disposición de WebHID: sin el id
                })
        print('      listo.')

    subcomando(h, 0x40, [0x00])
    h.close()
    return lado, registros


def resumen(lado, registros):
    """Lo mínimo para saber si la grabación sirve, sin esperar a las pruebas."""
    ts = [r['t'] for r in registros]
    dur = sum(1 for _ in registros) and (ts[-1] - ts[0]) or 1
    print()
    print('  Joy-Con %s: %d reportes, %.0f por segundo.' % (lado, len(registros), len(registros) / max(dur, 1)))
    for fase in [f[0] for f in FASES]:
        n = sum(1 for r in registros if r['f'] == fase)
        aviso = '' if n > 100 else '   <-- muy pocos, ¿se durmió el mando?'
        print('    %-10s %4d reportes%s' % (fase, n, aviso))


def main():
    pedido = sys.argv[1].upper() if len(sys.argv) > 1 else None
    mandos = [d for d in hid.enumerate() if d['vendor_id'] == VID and d['product_id'] in PIDS]
    # Windows lista a veces el mismo mando más de una vez: uno por lado basta.
    unicos = {}
    for d in mandos:
        unicos.setdefault(d['product_id'], d)
    mandos = [unicos[p] for p in sorted(unicos, reverse=True)]
    if pedido:
        mandos = [d for d in mandos if PIDS[d['product_id']] == pedido]
    if not mandos:
        print('No veo ningún Joy-Con. Pulsa un botón del mando para despertarlo y vuelve a intentarlo.')
        sys.exit(1)

    carpeta = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'capturas')
    os.makedirs(carpeta, exist_ok=True)
    print()
    print('Se van a grabar: ' + ', '.join('Joy-Con %s' % PIDS[d['product_id']] for d in mandos))
    print('Cada fase espera a que pulses Enter. Tómate el tiempo que necesites para leer.')

    for d in mandos:
        lado, registros = grabar_mando(d)
        nombre = 'captura-%s-%s.json' % (lado, datetime.now().strftime('%Y%m%d-%H%M%S'))
        ruta = os.path.join(carpeta, nombre)
        with open(ruta, 'w', encoding='utf-8') as f:
            json.dump({'mando': lado, 'fecha': datetime.now().isoformat(timespec='seconds'),
                       'version': 2, 'fases': [f[0] for f in FASES], 'reportes': registros}, f)
        resumen(lado, registros)
        print('    guardado en tests/capturas/' + nombre)

    print()
    print('Listo. Ya puedes volver al chat.')


if __name__ == '__main__':
    main()

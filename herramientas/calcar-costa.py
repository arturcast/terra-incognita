# -*- coding: utf-8 -*-
"""
calcar-costa.py — Deja listo el dibujo del mapa de la Etapa 1 y calca su costa.

1. assets/originales/mapa-arcade.png  ->  assets/mapa-territorio.jpg
2. Separa tierra de agua por color (el agua es azul: oscura mar adentro,
   turquesa en la orilla), se queda con la mancha más grande (la tierra
   firme) y con la de arriba a la derecha (la isla del templo), y las recorre
   desde su centro en abanico. Imprime los puntos, en fracción de la imagen,
   para pegarlos en COSTA e ISLA de src/datos/territorio.js.

Después de pegarlos, correr las tres verificaciones de AGENTS.md §6.

Uso:  python herramientas/calcar-costa.py
"""
import math
import os
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, 'assets', 'originales', 'mapa-arcade.png')
DESTINO = os.path.join(RAIZ, 'assets', 'mapa-territorio.jpg')


def manchas(t):
    """Etiqueta las manchas de tierra (relleno por anchura, sin librerías extra)."""
    h, w = t.shape
    lab = np.zeros((h, w), int)
    tam = {}
    n = 0
    for y in range(h):
        for x in range(w):
            if t[y, x] and not lab[y, x]:
                n += 1
                lab[y, x] = n
                q = deque([(y, x)])
                c = 0
                while q:
                    yy, xx = q.popleft()
                    c += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = yy + dy, xx + dx
                        if 0 <= ny < h and 0 <= nx < w and t[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = n
                            q.append((ny, nx))
                tam[n] = c
    return lab, sorted(tam, key=tam.get, reverse=True)


def abanico(mascara, n, rmax):
    """El punto de tierra más lejano del centro, en n direcciones."""
    h, w = mascara.shape
    ys, xs = np.nonzero(mascara)
    cx, cy = xs.mean(), ys.mean()
    puntos = []
    for i in range(n):
        a = i / n * 2 * math.pi
        ultimo = (cx, cy)
        for r in np.arange(0, rmax, 0.5):
            x, y = int(cx + math.cos(a) * r), int(cy + math.sin(a) * r)
            if not (0 <= x < w and 0 <= y < h):
                break
            if mascara[y, x]:
                ultimo = (x + 0.5, y + 0.5)
        puntos.append((round(ultimo[0] / w, 4), round(ultimo[1] / h, 4)))
    return puntos


if __name__ == '__main__':
    im = Image.open(ORIGEN).convert('RGB')
    im.save(DESTINO, quality=88, optimize=True)
    print('Dibujo del mapa ->', DESTINO, im.size)

    k = 4                                    # se trabaja a un cuarto: sobra precisión
    chica = im.resize((im.width // k, im.height // k), Image.BILINEAR)
    a = np.asarray(chica).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    tierra = ((r > b + 8) | (g > b + 20)) & ((r + g + b) > 120)
    m = Image.fromarray((tierra * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    t = np.asarray(m) > 128

    lab, orden = manchas(t)
    h, w = t.shape
    print('COSTA =', abanico(lab == orden[0], 160, 400))
    for i in orden[1:10]:
        c = lab == i
        ys, xs = np.nonzero(c)
        if xs.mean() > w * 0.8 and ys.mean() < h * 0.3 and c.sum() > 100:
            print('ISLA =', abanico(c, 48, 100))
            break

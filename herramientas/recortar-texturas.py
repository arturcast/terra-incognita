# -*- coding: utf-8 -*-
"""
recortar-texturas.py — Saca de las hojas de texturas las que usa el juego.

Las hojas están en assets/originales/tomb-raider/ (Texturas1..4.png). Son
texturas de los juegos de Tomb Raider que entregó el usuario el 2026-09-25 y
que decidió usar como definitivas; el origen y el riesgo están anotados en
docs/ACTIVOS-VISUALES.md.

Las hojas son pequeñas: en Texturas4 cada casilla mide 70x72 px. Se recorta
un píxel hacia adentro por cada lado para no arrastrar el borde de la casilla
vecina, y se agranda con interpolación suave (el filtrado bilineal era el
aspecto propio de la Nintendo 64).

Uso:  python herramientas/recortar-texturas.py
"""
import os
from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, 'assets', 'originales', 'tomb-raider')
DESTINO = os.path.join(RAIZ, 'assets')


def hoja(n):
    return Image.open(os.path.join(ORIGEN, 'Texturas%d.png' % n)).convert('RGB')


def casilla4(t4, col, y0, alto=72):
    """Una casilla de Texturas4 (columnas de 70 px), un píxel hacia adentro."""
    x = col * 70
    return t4.crop((x + 1, y0 + 1, x + 69, y0 + alto - 1))


def fundir_bordes(im):
    """
    Esconde la unión al repetir. Se mezcla la casilla con una copia corrida
    media casilla: en el centro manda la original y en los bordes la copia, cuyos
    bordes son el centro de la original y por tanto casan con el vecino.
    (Espejarla también esconde la unión, pero las rocas quedaban como un
    caleidoscopio.)
    """
    w, h = im.size
    corrida = Image.new('RGB', (w, h))
    corrida.paste(im.crop((w // 2, h // 2, w, h)), (0, 0))
    corrida.paste(im.crop((0, h // 2, w // 2, h)), (w - w // 2, 0))
    corrida.paste(im.crop((w // 2, 0, w, h // 2)), (0, h - h // 2))
    corrida.paste(im.crop((0, 0, w // 2, h // 2)), (w - w // 2, h - h // 2))
    mascara = Image.new('L', (w, h))
    px = mascara.load()
    for y in range(h):
        for x in range(w):
            # 255 en el centro, 0 en el borde, con transición suave
            d = min(x, w - 1 - x, y, h - 1 - y) / (min(w, h) * 0.28)
            px[x, y] = int(255 * min(1.0, d))
    return Image.composite(im, corrida, mascara)


def repetible(im, lado, veces=1):
    """Agranda la casilla, con los bordes fundidos (repetida `veces` x `veces`)."""
    im = fundir_bordes(im.resize((im.size[0] * 4, im.size[1] * 4), Image.BICUBIC))
    w, h = im.size
    mosaico = Image.new('RGB', (w * veces, h * veces))
    for a in range(veces):
        for b in range(veces):
            mosaico.paste(im, (a * w, b * h))
    return mosaico.resize((lado, lado), Image.BICUBIC)


def piramide(arena, lado=256, hiladas=8):
    """Arenisca con hiladas de bloques: cada fila corrida media pieza, junta oscura y filo de luz."""
    base = repetible(arena, lado, 2)
    d = ImageDraw.Draw(base, 'RGBA')
    alto = lado // hiladas
    for f in range(hiladas):
        y = f * alto
        d.line([(0, y), (lado, y)], fill=(60, 38, 16, 170), width=3)
        d.line([(0, y + 3), (lado, y + 3)], fill=(255, 230, 170, 60), width=1)
        desfase = (alto if f % 2 else 0)
        for x in range(-desfase, lado, alto * 2):
            d.line([(x, y), (x, y + alto)], fill=(60, 38, 16, 150), width=3)
    return base


def circulo(im, lado):
    """Recorta en círculo, con fondo transparente (para el medallón)."""
    im = im.resize((lado, lado), Image.BICUBIC).convert('RGBA')
    mascara = Image.new('L', (lado * 4, lado * 4), 0)
    ImageDraw.Draw(mascara).ellipse((6, 30, lado * 4 - 6, lado * 4 - 30), fill=255)
    im.putalpha(mascara.resize((lado, lado), Image.LANCZOS))
    return im


def guardar(im, nombre):
    ruta = os.path.join(DESTINO, nombre)
    im.save(ruta, optimize=True)
    print('  %-24s %dx%d' % (nombre, im.size[0], im.size[1]))


if __name__ == '__main__':
    t4 = hoja(4)
    t1 = hoja(1)
    print('Texturas recortadas a assets/:')
    guardar(casilla4(t4, 0, 663).resize((272, 280), Image.BICUBIC), 'ui-lava.png')
    guardar(repetible(casilla4(t4, 1, 88), 256), 'ui-roca-lava.png')
    guardar(repetible(casilla4(t4, 0, 232), 256), 'ui-roca-oscura.png')
    guardar(circulo(casilla4(t4, 3, 304), 256), 'ui-medallon.png')
    guardar(piramide(t4.crop((255, 522, 348, 580))), 'tex-piramide.png')
    guardar(repetible(t4.crop((255, 522, 348, 580)), 256), 'ui-arenisca.png')
    guardar(casilla4(t4, 1, 448).resize((272, 280), Image.BICUBIC), 'ui-tallado.png')

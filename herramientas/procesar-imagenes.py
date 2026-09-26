# -*- coding: utf-8 -*-
"""
procesar-imagenes.py — Deja las imágenes de `assets/originales/` listas para el
juego, en `assets/`.

Qué hace con cada una:
  - quita el fondo verde puro (#00FF00) si lo tiene, suavizando el borde;
  - recorta lo transparente que sobra;
  - la escala al tamaño de uso (las que se repiten, a potencia de dos);
  - guarda PNG si necesita transparencia y JPG si no, optimizados.

Las imágenes generadas con IA vienen a 1000-2000 px y pesan megas: servirlas
tal cual en el stand es tiempo de carga y memoria de vídeo tirados. Ver
docs/ACTIVOS-VISUALES.md.

Uso:  python herramientas/procesar-imagenes.py      (desde la raíz del proyecto)
Necesita Pillow, que ya está instalado en el equipo.
"""
import os
import sys

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, "assets", "originales")
DESTINO = os.path.join(RAIZ, "assets")

# nombre -> (ancho final, ¿necesita transparencia?)
PLAN = {
    "obj-muro.png": (320, True),
    "fig-palmera.png": (256, True),
    "tex-camino-tierra.png": (512, False),
    "fondo-horizonte.png": (2048, False),
    # Horizontes de El Camino por zona (2508×627 → 2048 de ancho)
    "fondo-templos.png": (2048, False),
    "fondo-desierto.png": (2048, False),
    "est-manantial.png": (1024, False),
    "est-ramales.png": (1024, False),
    "est-montana.png": (1024, False),
    "est-caudal.png": (1024, False),
    "est-represa.png": (1024, False),
}

VERDE = (0, 255, 0)
TOLERANCIA = 90          # distancia al verde puro que todavía se considera fondo


def quitar_verde(im):
    """Fondo verde -> transparente, con el borde suavizado."""
    im = im.convert("RGBA")
    datos = im.getdata()
    nuevos = []
    for r, g, b, a in datos:
        d = ((r - VERDE[0]) ** 2 + (g - VERDE[1]) ** 2 + (b - VERDE[2]) ** 2) ** 0.5
        if d < TOLERANCIA:
            nuevos.append((r, g, b, 0))
        elif d < TOLERANCIA * 1.8 and g > r + 30 and g > b + 30:
            # borde: se quita el tinte verde y se baja la opacidad
            k = (d - TOLERANCIA) / (TOLERANCIA * 0.8)
            v = int(min(r, b) + (g - min(r, b)) * k)
            nuevos.append((r, v, b, int(a * k)))
        else:
            nuevos.append((r, g, b, a))
    im.putdata(nuevos)
    return im


def tiene_verde(im):
    """¿La imagen usa fondo verde? Se mira una esquina."""
    p = im.convert("RGB").getpixel((2, 2))
    return p[1] > 180 and p[0] < 120 and p[2] < 120


def procesar(nombre, ancho, transparencia):
    origen = os.path.join(ORIGEN, nombre)
    if not os.path.exists(origen):
        return None
    im = Image.open(origen)

    if transparencia:
        if im.mode != "RGBA" and tiene_verde(im):
            im = quitar_verde(im)
        im = im.convert("RGBA")
        caja = im.split()[3].getbbox()
        if caja:
            im = im.crop(caja)
    else:
        if im.mode == "RGBA":
            fondo = Image.new("RGB", im.size, (255, 255, 255))
            fondo.paste(im, mask=im.split()[3])
            im = fondo
        im = im.convert("RGB")

    alto = max(1, round(im.height * ancho / im.width))
    im = im.resize((ancho, alto), Image.LANCZOS)

    salida = os.path.join(DESTINO, nombre if transparencia else nombre.replace(".png", ".jpg"))
    if transparencia:
        im.save(salida, optimize=True)
    else:
        im.save(salida, quality=84, optimize=True)
    return salida, im.size, os.path.getsize(salida)


def main():
    if not os.path.isdir(ORIGEN):
        print("No existe", ORIGEN)
        return 1
    os.makedirs(DESTINO, exist_ok=True)
    total = 0
    for nombre, (ancho, alfa) in PLAN.items():
        r = procesar(nombre, ancho, alfa)
        if r is None:
            print("  falta   ", nombre)
            continue
        salida, tam, peso = r
        total += peso
        print("  %-34s %4dx%-4d %6d KB" % (os.path.basename(salida), tam[0], tam[1], peso // 1024))
    print("  total: %d KB" % (total // 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())

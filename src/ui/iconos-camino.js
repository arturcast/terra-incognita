/**
 * iconos-camino.js — Los objetos de El Camino, en pequeño, para ponerlos al
 * lado de cada paso de las instrucciones (pedido del usuario, 2026-09-30):
 * quien lee «recoge los ◆ azules» ve el mismo diamante que va a encontrar en
 * el camino, y lo mismo con el tablero de Power BI, lo escondido y los muros.
 *
 * El portátil y la barrera son las mismas imágenes que usa el 3D
 * (assets/obj-powerbi.png, assets/obj-muro.png). El diamante y el cristal
 * rojo se dibujan con sus caras, como los sólidos del 3D (camino3d/objetos.js).
 * Si una imagen no carga (o en las pruebas de Node), se dibuja una versión
 * hecha por código: las instrucciones nunca se quedan sin icono.
 *
 * Cada icono es una función (c, cx, cy, tam) que pinta centrado en un cuadro
 * de lado `tam`: es lo que espera `Briefing` en `pasos: [{ texto, icono }]`.
 */

const IMAGENES = { powerbi: '/assets/obj-powerbi.png', muro: '/assets/obj-muro.png' };
const cargadas = {};
let pedidas = false;

/** Pide las imágenes una sola vez. Mientras llegan, se usa el dibujo de respaldo. */
function cargar() {
  if (pedidas || typeof Image === 'undefined') return;
  pedidas = true;
  for (const [clave, ruta] of Object.entries(IMAGENES)) {
    const im = new Image();
    im.onload = () => { cargadas[clave] = im; };
    im.src = ruta;
  }
}

/** Dibuja una imagen ajustada al cuadro, sin deformarla. */
function imagenEnCuadro(c, im, cx, cy, tam) {
  const k = (tam * 0.9) / Math.max(im.width, im.height);
  const w = im.width * k, h = im.height * k;
  c.drawImage(im, cx - w / 2, cy - h / 2, w, h);
}

/** Resplandor redondo detrás de un objeto, del color de su destello en el juego. */
function halo(c, cx, cy, r, color) {
  const g = c.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fill();
}

/** Un rombo de cuatro caras con luz arriba a la izquierda: el octaedro visto de frente. */
function rombo(c, cx, cy, a, h, colores) {
  const [luz, medio, sombra, fondo] = colores;
  const caras = [
    [[cx, cy - h], [cx - a, cy], [cx, cy], luz],
    [[cx, cy - h], [cx + a, cy], [cx, cy], medio],
    [[cx, cy + h], [cx - a, cy], [cx, cy], sombra],
    [[cx, cy + h], [cx + a, cy], [cx, cy], fondo],
  ];
  for (const [p1, p2, p3, color] of caras) {
    c.beginPath();
    c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]);
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = Math.max(1, a * 0.05);
  c.beginPath();
  c.moveTo(cx, cy - h); c.lineTo(cx + a, cy); c.lineTo(cx, cy + h); c.lineTo(cx - a, cy);
  c.closePath();
  c.stroke();
}

/** ◆ El dato: el diamante azul. */
export function iconoDato(c, cx, cy, tam) {
  halo(c, cx, cy, tam * 0.48, 'rgba(90,169,230,0.45)');
  rombo(c, cx, cy, tam * 0.26, tam * 0.36, ['#b5ddfa', '#5aa9e6', '#2f78b3', '#1d4f7c']);
}

/** Lo escondido: el cristal rojo que aparece al analizar, con su columna de luz. */
export function iconoEscondido(c, cx, cy, tam) {
  c.fillStyle = 'rgba(255,90,74,0.18)';
  c.fillRect(cx - tam * 0.13, cy - tam * 0.5, tam * 0.26, tam);
  halo(c, cx, cy, tam * 0.46, 'rgba(255,90,74,0.5)');
  rombo(c, cx, cy, tam * 0.27, tam * 0.3, ['#ffb1a6', '#ff5a4a', '#c23a2c', '#7a1508']);
  c.fillStyle = '#fff';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = 'bold ' + Math.round(tam * 0.3) + 'px sans-serif';
  c.fillText('!', cx, cy + tam * 0.02);
}

/** El tablero de Power BI: el portátil de piedra y oro. */
export function iconoPowerBI(c, cx, cy, tam) {
  cargar();
  halo(c, cx, cy + tam * 0.1, tam * 0.5, 'rgba(240,201,119,0.35)');
  if (cargadas.powerbi) { imagenEnCuadro(c, cargadas.powerbi, cx, cy, tam); return; }
  // Respaldo: pantalla con barras amarillas sobre una base.
  const w = tam * 0.7, h = tam * 0.45, y0 = cy - h * 0.7;
  c.fillStyle = '#6b5a45';
  c.fillRect(cx - w / 2, y0, w, h);
  c.fillStyle = '#1a1712';
  c.fillRect(cx - w / 2 + 4, y0 + 4, w - 8, h - 8);
  c.fillStyle = '#f6c343';
  [0.4, 0.7, 0.55, 0.9].forEach((f, b) => {
    const hb = (h - 14) * f;
    c.fillRect(cx - w / 2 + 9 + b * w * 0.2, y0 + h - 6 - hb, w * 0.12, hb);
  });
  c.fillStyle = '#8a7658';
  c.fillRect(cx - w / 2 - 6, y0 + h, w + 12, tam * 0.1);
}

/** El muro de excusas: la barrera rayada. */
export function iconoMuro(c, cx, cy, tam) {
  cargar();
  if (cargadas.muro) { imagenEnCuadro(c, cargadas.muro, cx, cy, tam); return; }
  // Respaldo: barrera roja y blanca sobre dos patas.
  const w = tam * 0.8, h = tam * 0.22;
  c.fillStyle = '#4a4f5a';
  c.fillRect(cx - w * 0.38, cy - h / 2, tam * 0.08, tam * 0.42);
  c.fillRect(cx + w * 0.3, cy - h / 2, tam * 0.08, tam * 0.42);
  c.save();
  c.beginPath();
  c.rect(cx - w / 2, cy - h / 2, w, h);
  c.clip();
  c.fillStyle = '#f2f2f2';
  c.fillRect(cx - w / 2, cy - h / 2, w, h);
  c.fillStyle = '#e0352b';
  for (let x = -w; x < w; x += h * 1.4) {
    c.beginPath();
    c.moveTo(cx - w / 2 + x, cy + h / 2);
    c.lineTo(cx - w / 2 + x + h * 0.7, cy + h / 2);
    c.lineTo(cx - w / 2 + x + h * 1.4, cy - h / 2);
    c.lineTo(cx - w / 2 + x + h * 0.7, cy - h / 2);
    c.closePath();
    c.fill();
  }
  c.restore();
}

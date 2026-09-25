/**
 * render.js — Identidad visual y ayudantes de dibujo.
 *
 * La estética es "carta náutica de noche": fondo profundo, tinta de pergamino,
 * latón de instrumento. Evita el look corporativo de presentación y evita
 * también el look de videojuego infantil. Debe verse serio y atractivo en una
 * pantalla grande, de pie, a tres metros de distancia.
 */

export const PALETA = {
  fondo: '#0a1018',
  fondoHondo: '#05070c',
  territorio: '#13202b',
  territorioAlto: '#1b2d3a',
  costa: '#2c4456',
  niebla: '#070b11',

  tinta: '#e8d9b5',      // texto principal, color pergamino
  tintaTenue: '#8b9099',
  tintaDebil: '#5a6068',

  oro: '#d9a441',        // acento, latón, elementos interactivos
  oroClaro: '#f0c977',

  riesgo: '#e0614a',     // lectura: peligro
  valor: '#4ec9a5',      // lectura: valor estratégico
  senal: '#5aa9e6',      // lectura: intensidad de datos

  exito: '#4ec9a5',
  alerta: '#e8b04b',
};

export const FUENTE = {
  // Serif para la voz narrativa: evoca bitácora de expedición.
  narrativa: 'Georgia, "Times New Roman", serif',
  // Monoespaciada para instrumentos y lecturas: evoca medición.
  instrumento: 'Consolas, "Cascadia Mono", monospace',
  interfaz: '"Segoe UI", system-ui, sans-serif',
};

// ---------------------------------------------------------------- primitivas

export function rectRedondeado(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

/** Dibuja texto con salto de línea automático. Devuelve la altura usada. */
export function textoEnvuelto(c, texto, x, y, anchoMax, altoLinea) {
  const palabras = texto.split(' ');
  let linea = '';
  let cy = y;
  for (const p of palabras) {
    const prueba = linea ? linea + ' ' + p : p;
    if (c.measureText(prueba).width > anchoMax && linea) {
      c.fillText(linea, x, cy);
      linea = p;
      cy += altoLinea;
    } else {
      linea = prueba;
    }
  }
  if (linea) { c.fillText(linea, x, cy); cy += altoLinea; }
  return cy - y;
}

/** Anillo de progreso. Se usa para temporizadores y para la espera sobre un lugar. */
export function anillo(c, x, y, radio, fraccion, color, grosor = 4, fondo = '#1b2d3a') {
  c.lineWidth = grosor;
  c.strokeStyle = fondo;
  c.beginPath();
  c.arc(x, y, radio, 0, Math.PI * 2);
  c.stroke();
  if (fraccion > 0) {
    c.strokeStyle = color;
    c.beginPath();
    c.arc(x, y, radio, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, fraccion));
    c.stroke();
  }
}

/** Barra horizontal de lectura, con etiqueta. */
export function barraLectura(c, x, y, ancho, alto, fraccion, color, etiqueta) {
  c.fillStyle = '#0d1620';
  rectRedondeado(c, x, y, ancho, alto, alto / 2);
  c.fill();
  if (fraccion > 0) {
    c.fillStyle = color;
    rectRedondeado(c, x, y, Math.max(alto, ancho * Math.min(1, fraccion)), alto, alto / 2);
    c.fill();
  }
  if (etiqueta) {
    c.font = '10px ' + FUENTE.instrumento;
    c.fillStyle = PALETA.tintaDebil;
    c.textAlign = 'left';
    c.fillText(etiqueta, x, y - 5);
  }
}

/**
 * Ruido sutil sobre todo el lienzo. Le quita el aspecto plano y digital,
 * acercándolo al grano del papel. Se genera una vez y se reutiliza.
 */
let _texturaRuido = null;
export function grano(c, ancho, alto, alfa = 0.035) {
  if (!_texturaRuido) {
    const n = document.createElement('canvas');
    n.width = n.height = 160;
    const nc = n.getContext('2d');
    const img = nc.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 120 + Math.random() * 135;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    nc.putImageData(img, 0, 0);
    _texturaRuido = c.createPattern(n, 'repeat');
  }
  // Mezcla normal y no 'overlay': a pantalla completa y en cada fotograma, un
  // modo de fusión cuesta caro en gráficos integrados, y a este alfa la
  // diferencia visual no se aprecia.
  c.save();
  c.globalAlpha = alfa * 0.6;
  c.fillStyle = _texturaRuido;
  c.fillRect(0, 0, ancho, alto);
  c.restore();
}

/** Viñeta oscura en los bordes. Centra la mirada del visitante. */
export function vineta(c, ancho, alto, fuerza = 0.55) {
  const g = c.createRadialGradient(
    ancho / 2, alto / 2, Math.min(ancho, alto) * 0.3,
    ancho / 2, alto / 2, Math.max(ancho, alto) * 0.75
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,' + fuerza + ')');
  c.fillStyle = g;
  c.fillRect(0, 0, ancho, alto);
}

/** Cartucho de texto narrativo: la voz que guía la expedición. */
export function cartucho(c, texto, x, y, ancho, opciones = {}) {
  const tamano = opciones.tamano ?? 19;
  const color = opciones.color ?? PALETA.tinta;
  const alineacion = opciones.alineacion ?? 'center';
  c.font = 'italic ' + tamano + 'px ' + FUENTE.narrativa;
  c.fillStyle = color;
  c.textAlign = alineacion;
  c.textBaseline = 'top';
  return textoEnvuelto(c, texto, x, y, ancho, tamano * 1.55);
}

/**
 * Etiqueta de instrumento: mayúsculas, ligeramente espaciada, pequeña.
 *
 * Respeta el `textAlign` y el `textBaseline` que traiga el contexto. Antes los
 * forzaba, lo que obligaba a quien llamaba a centrar restando píxeles a ojo
 * (`cx - 26`); esas cuentas se desajustaban al cambiar el texto y dejaban
 * títulos montados o fuera de pantalla. Ahora centrar es poner
 * `textAlign = 'center'` y pasar el centro.
 */
export function etiqueta(c, texto, x, y, color = PALETA.tintaDebil, tamano = 10) {
  c.font = tamano + 'px ' + FUENTE.instrumento;
  c.fillStyle = color;
  c.fillText(texto.toUpperCase().split('').join(' '), x, y);
}

/** Interpolación con suavizado de entrada/salida. */
export function suave(t) { return t < 0 ? 0 : t > 1 ? 1 : 0.5 - Math.cos(t * Math.PI) / 2; }
export function mezcla(a, b, t) { return a + (b - a) * t; }
export function limitar(v, a, b) { return v < a ? a : v > b ? b : v; }

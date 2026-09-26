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

/**
 * Viñeta oscura en los bordes. Centra la mirada del visitante. Como el fondo,
 * se pinta una vez por tamaño y fuerza, y después solo se copia.
 */
const _cacheVineta = new Map();
export function vineta(c, ancho, alto, fuerza = 0.55) {
  if (typeof document === 'undefined' || typeof window === 'undefined') { _vinetaDirecta(c, ancho, alto, fuerza); return; }
  const dpr = window.devicePixelRatio || 1;
  const clave = ancho + 'x' + alto + '@' + dpr + ':' + fuerza;
  let lienzo = _cacheVineta.get(clave);
  if (!lienzo) {
    if (_cacheVineta.size > 8) _cacheVineta.clear();      // cambió la pantalla: se tira lo viejo
    lienzo = document.createElement('canvas');
    lienzo.width = Math.max(1, Math.round(ancho * dpr));
    lienzo.height = Math.max(1, Math.round(alto * dpr));
    const cx = lienzo.getContext('2d');
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    _vinetaDirecta(cx, ancho, alto, fuerza);
    _cacheVineta.set(clave, lienzo);
  }
  c.drawImage(lienzo, 0, 0, ancho, alto);
}

function _vinetaDirecta(c, ancho, alto, fuerza) {
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

// ------------------------------------------------ estilo menú de consola
/*
 * Estilo de los menús, a la manera de los juegos de aventura de Nintendo 64:
 * título de letras gruesas con degradado de fuego y biselado, fondo rojo muy
 * oscuro, cajas negras translúcidas con doble borde beige, y la opción
 * elegida enmarcada en su propia caja. Todo por código; si más adelante llega
 * una textura para el título, se aplica encima sin cambiar quién llama.
 */
export const MENU = {
  letra: '"Times New Roman", Georgia, serif',
  beige: '#e9dcb4',
  beigeBorde: '#cdbb8a',
  sombra: 'rgba(0,0,0,0.85)',
};

/**
 * Texturas de los menús, recortadas con herramientas/recortar-texturas.py.
 * Ninguna es obligatoria: si una no carga, se dibuja como antes, por código.
 * Rutas absolutas desde la raíz del servidor (igual que en vista3d.js), para
 * que también las encuentre herramientas/vista-escena.html.
 */
const TEXTURAS_MENU = {
  lava: '/assets/ui-lava.png',
  roca: '/assets/ui-roca-lava.png',
  rocaOscura: '/assets/ui-roca-oscura.png',
  medallon: '/assets/ui-medallon.png',
  arenisca: '/assets/ui-arenisca.png',
};
const _tex = {};
const _patrones = new WeakMap();      // contexto -> { clave: CanvasPattern }
const _titulos = new Map();           // 'texto|tamaño' -> lienzo ya pintado

/** Carga las texturas de los menús. Se llama una vez al arrancar (main.js). */
export function cargarTexturasMenu() {
  if (typeof Image === 'undefined') return Promise.resolve();
  return Promise.all(Object.entries(TEXTURAS_MENU).map(([k, url]) => new Promise((ok) => {
    const im = new Image();
    im.onload = () => { _tex[k] = im; ok(); };
    im.onerror = () => ok();
    im.src = url;
  })));
}

/** Patrón repetido de una textura, escalado. null si no cargó. */
function patron(c, clave, escala = 1) {
  const im = _tex[clave];
  if (!im || !c.createPattern) return null;
  let porCtx = _patrones.get(c);
  if (!porCtx) _patrones.set(c, (porCtx = {}));
  const k = clave + '@' + escala;
  if (!porCtx[k]) {
    const p = c.createPattern(im, 'repeat');
    if (p && p.setTransform && typeof DOMMatrix !== 'undefined') p.setTransform(new DOMMatrix().scale(escala));
    porCtx[k] = p;
  }
  return porCtx[k];
}

/**
 * Patrón de una textura de menú para quien pinta escenarios en 2D (El
 * Regreso): 'roca', 'rocaOscura', 'arenisca', 'lava'. null si no cargó, y
 * entonces quien llama pinta un color plano.
 */
export function patronMenu(c, clave, escala = 1) { return patron(c, clave, escala); }

/**
 * Fondo de menú: roca volcánica con grietas rojas, oscurecida hacia los bordes.
 *
 * Rendimiento: no cambia nunca, así que se pinta UNA vez en un lienzo aparte
 * (por tamaño de pantalla) y cada fotograma solo se copia. Pintarlo entero 60
 * veces por segundo —textura y degradado a pantalla completa— era de lo más
 * caro de los menús, las instrucciones y los tableros.
 */
// Uno por tamaño: a pantalla partida se piden la mitad y la pantalla entera
// en el mismo fotograma, y con uno solo se repintaría todo el tiempo.
const _cacheFondo = new Map();
export function fondoMenu(c, W, H) {
  if (typeof document === 'undefined' || typeof window === 'undefined') { _fondoMenuDirecto(c, W, H); return; }
  const dpr = window.devicePixelRatio || 1;
  const clave = W + 'x' + H + '@' + dpr + (_tex.roca ? '+roca' : '');
  let lienzo = _cacheFondo.get(clave);
  if (!lienzo) {
    if (_cacheFondo.size > 6) _cacheFondo.clear();         // cambió la pantalla: se tira lo viejo
    lienzo = document.createElement('canvas');
    lienzo.width = Math.max(1, Math.round(W * dpr));
    lienzo.height = Math.max(1, Math.round(H * dpr));
    const cx = lienzo.getContext('2d');
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    _fondoMenuDirecto(cx, W, H);
    _cacheFondo.set(clave, lienzo);
  }
  c.drawImage(lienzo, 0, 0, W, H);
}

function _fondoMenuDirecto(c, W, H) {
  const roca = patron(c, 'roca', 1.6);
  if (roca) {
    c.fillStyle = roca;
    c.fillRect(0, 0, W, H);
  }
  const g = c.createRadialGradient(W * 0.55, H * 0.45, Math.min(W, H) * 0.1, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
  // Con textura, el degradado va translúcido encima: tiñe de rojo y apaga los bordes.
  g.addColorStop(0, roca ? 'rgba(74,17,9,0.55)' : '#4a1109');
  g.addColorStop(0.55, roca ? 'rgba(36,6,4,0.78)' : '#240604');
  g.addColorStop(1, roca ? 'rgba(11,2,2,0.95)' : '#0b0202');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

/**
 * El título con la lava metida dentro de las letras. Se pinta una vez en un
 * lienzo aparte y se reutiliza: los títulos no cambian, y componer texto con
 * textura en cada fotograma es caro.
 */
/**
 * Los dos acabados de las letras grandes:
 *   fuego  — el de los títulos: degradado de fuego con lava dentro;
 *   piedra — arenisca dorada tallada, para lo que va debajo de un título de
 *            fuego y tiene que distinguirse de él (p. ej. AUDITORÍA en la portada).
 */
const ACABADOS = {
  fuego: {
    textura: 'lava', alfaTextura: 0.6, escalaTextura: 1.3,
    degradado: [[0, '#ffe7a0'], [0.3, '#f6a92c'], [0.62, '#c2411a'], [1, '#4e0c04']],
    contorno: '#1e0402', bisel: 'rgba(255,236,190,0.55)',
  },
  piedra: {
    textura: 'arenisca', alfaTextura: 0.55, escalaTextura: 2.2,
    degradado: [[0, '#fff6d8'], [0.35, '#e8c77f'], [0.7, '#b8863e'], [1, '#6b4718']],
    contorno: '#2a1406', bisel: 'rgba(255,250,225,0.8)', tallado: 'rgba(60,32,8,0.55)',
  },
};

function tituloConTextura(texto, tamano, estilo = 'fuego', resolucion = 0) {
  const A = ACABADOS[estilo];
  if (!_tex[A.textura] || typeof document === 'undefined') return null;
  // Se pinta a la resolución a la que se va a ver (pantalla × escala de quien
  // lo dibuja): un título agrandado con c.scale no sale borroso.
  const dpr = resolucion || (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const clave = estilo + '|' + texto + '|' + tamano + '@' + dpr;
  if (_titulos.has(clave)) return _titulos.get(clave);
  if (_titulos.size > 300) _titulos.clear();

  const medir = document.createElement('canvas').getContext('2d');
  const fuente = 'bold ' + tamano + 'px ' + MENU.letra;
  medir.font = fuente;
  if ('letterSpacing' in medir) medir.letterSpacing = Math.round(tamano * 0.04) + 'px';
  const w = Math.ceil(medir.measureText(texto).width);
  const pad = Math.ceil(tamano * 0.15);
  const alto = Math.ceil(tamano * 1.4);

  const lienzo = document.createElement('canvas');
  lienzo.width = Math.ceil((w + pad * 2) * dpr);
  lienzo.height = Math.ceil(alto * dpr);
  const c = lienzo.getContext('2d');
  c.scale(dpr, dpr);
  c.font = fuente;
  if ('letterSpacing' in c) c.letterSpacing = Math.round(tamano * 0.04) + 'px';
  c.textBaseline = 'middle';
  const x = pad, y = alto / 2;

  // 1. las letras con su degradado
  const g = c.createLinearGradient(0, y - tamano * 0.45, 0, y + tamano * 0.45);
  for (const [k, color] of A.degradado) g.addColorStop(k, color);
  c.fillStyle = g;
  c.fillText(texto, x, y);
  // 2. la textura, solo dentro de las letras
  const im = _tex[A.textura];
  const tex = c.createPattern(im, 'repeat');
  if (tex.setTransform) tex.setTransform(new DOMMatrix().scale((tamano * A.escalaTextura) / im.height));
  c.globalCompositeOperation = 'source-atop';
  c.globalAlpha = A.alfaTextura;
  c.fillStyle = tex;
  c.fillRect(0, 0, w + pad * 2, alto);
  // 2b. piedra: un filo oscuro abajo a la derecha, como letra tallada
  if (A.tallado) {
    c.globalAlpha = 1;
    c.lineWidth = Math.max(1, tamano * 0.025);
    c.strokeStyle = A.tallado;
    c.strokeText(texto, x + tamano * 0.012, y + tamano * 0.015);
  }
  // 3. contorno y sombra, por detrás
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'destination-over';
  c.lineJoin = 'round';
  c.lineWidth = Math.max(2, tamano * 0.07);
  c.strokeStyle = A.contorno;
  c.strokeText(texto, x, y);
  c.fillStyle = 'rgba(0,0,0,0.75)';
  c.fillText(texto, x + tamano * 0.05, y + tamano * 0.06);
  // 4. el filo de luz del bisel, encima
  c.globalCompositeOperation = 'source-over';
  c.lineWidth = Math.max(1, tamano * 0.015);
  c.strokeStyle = A.bisel;
  c.strokeText(texto, x - 1, y - 1);

  const hecho = { lienzo, w, pad, alto };
  _titulos.set(clave, hecho);
  return hecho;
}

/**
 * Título grueso con degradado de fuego, contorno oscuro, brillo de bisel y
 * sombra. Se alinea con el textAlign/textBaseline que traiga el contexto.
 */
export function tituloMenu(c, texto, x, y, tamano, estilo = 'fuego') {
  const t = c.getTransform ? c.getTransform() : null;
  const resolucion = t ? Math.max(1, Math.round(Math.hypot(t.a, t.b) * 4) / 4) : 0;
  const hecho = tituloConTextura(texto, tamano, estilo, resolucion);
  if (hecho) {
    const a = c.textAlign;
    const dx = a === 'center' ? hecho.w / 2 : (a === 'right' || a === 'end') ? hecho.w : 0;
    c.drawImage(hecho.lienzo, x - dx - hecho.pad, y - hecho.alto / 2, hecho.w + hecho.pad * 2, hecho.alto);
    return;
  }
  c.save();
  c.font = 'bold ' + tamano + 'px ' + MENU.letra;
  c.textBaseline = 'middle';
  if ('letterSpacing' in c) c.letterSpacing = Math.round(tamano * 0.04) + 'px';
  // sombra
  c.fillStyle = 'rgba(0,0,0,0.75)';
  c.fillText(texto, x + tamano * 0.05, y + tamano * 0.06);
  // cuerpo con degradado de fuego
  const g = c.createLinearGradient(0, y - tamano * 0.45, 0, y + tamano * 0.45);
  g.addColorStop(0, '#ffe7a0');
  g.addColorStop(0.3, '#f6a92c');
  g.addColorStop(0.62, '#c2411a');
  g.addColorStop(1, '#4e0c04');
  c.lineJoin = 'round';
  c.lineWidth = Math.max(2, tamano * 0.07);
  c.strokeStyle = '#1e0402';
  c.strokeText(texto, x, y);
  c.fillStyle = g;
  c.fillText(texto, x, y);
  // bisel: un filo de luz arriba
  c.lineWidth = Math.max(1, tamano * 0.015);
  c.strokeStyle = 'rgba(255,236,190,0.55)';
  c.strokeText(texto, x - 1, y - 1);
  c.restore();
}

/**
 * La cuenta atrás 3-2-1 antes de una carrera o un vuelo: el número de fuego
 * entra grande y se encoge mientras se apaga. Tamaño fijo y escala por
 * transformación, así el título en caché sirve para todos los fotogramas.
 * @param {number} t segundos desde que empezó la cuenta (0 a 3)
 */
export function cuentaMenu(c, W, H, t) {
  const n = Math.max(1, Math.ceil(3 - t));
  const f = (3 - t) % 1;                  // 1 → 0 dentro de cada segundo
  c.save();
  c.globalAlpha = 0.35 + f * 0.65;
  c.translate(W / 2, H / 2);
  const s = 1 + (1 - f) * 0.3;
  c.scale(s, s);
  c.textAlign = 'center';
  tituloMenu(c, String(n), 0, 0, 210);
  c.restore();
}

/**
 * Caja negra translúcida con doble borde: oscuro por fuera, beige por dentro.
 *
 * Rendimiento: la roca de debajo es un relleno con textura escalada, y en
 * tarjetas integradas (medido en una AMD Radeon con herramientas/
 * medir-escena.html) hacerlo cada fotograma, mezclado con el resto del
 * dibujo, costaba decenas de milisegundos: El Regreso pasaba de 60 a 10 fps
 * solo por sus marcadores. Así que cada caja se pinta UNA vez por tamaño y
 * estilo en un lienzo aparte, y después solo se copia.
 */
const _cacheCajas = new Map();
export function cajaMenu(c, x, y, w, h, opciones = {}) {
  if (typeof document === 'undefined' || typeof window === 'undefined' || !(w > 0 && h > 0)) {
    _cajaDirecta(c, x, y, w, h, opciones);
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  // Un poco más de resolución si la caja se dibuja agrandada (cajas que crecen).
  const t = c.getTransform ? c.getTransform() : null;
  const escala = t ? Math.max(1, Math.round(Math.hypot(t.a, t.b) * 4) / 4) : dpr;
  const wr = Math.round(w), hr = Math.round(h);
  const clave = wr + 'x' + hr + '|' + (opciones.relleno ?? '') + '|' + (opciones.brillo ?? 1) + '|' +
    (opciones.textura === false ? 0 : 1) + '|' + escala + (_tex.rocaOscura ? '+r' : '');
  let lienzo = _cacheCajas.get(clave);
  if (!lienzo) {
    if (_cacheCajas.size > 400) _cacheCajas.clear();
    lienzo = document.createElement('canvas');
    lienzo.width = Math.max(1, Math.ceil(wr * escala));
    lienzo.height = Math.max(1, Math.ceil(hr * escala));
    const cx = lienzo.getContext('2d');
    cx.setTransform(escala, 0, 0, escala, 0, 0);
    _cajaDirecta(cx, 0, 0, wr, hr, opciones);
    _cacheCajas.set(clave, lienzo);
  }
  c.drawImage(lienzo, x, y, w, h);
}

function _cajaDirecta(c, x, y, w, h, opciones) {
  const relleno = opciones.relleno ?? 'rgba(8,5,3,0.72)';
  const brillo = opciones.brillo ?? 1;
  c.save();
  // La roca oscura asoma por debajo del relleno translúcido.
  const roca = opciones.textura === false ? null : patron(c, 'rocaOscura', 1.2);
  if (roca) {
    c.fillStyle = roca;
    c.fillRect(x, y, w, h);
  }
  c.fillStyle = relleno;
  c.fillRect(x, y, w, h);
  c.lineWidth = 3;
  c.strokeStyle = '#150b05';
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  c.lineWidth = 2;
  c.globalAlpha = brillo;
  c.strokeStyle = MENU.beigeBorde;
  c.strokeRect(x + 3, y + 3, w - 6, h - 6);
  c.restore();
}

/** Texto de menú: beige con sombra dura, como en consola. */
export function textoMenu(c, texto, x, y, tamano, color = MENU.beige) {
  c.save();
  c.font = tamano + 'px ' + MENU.letra;
  c.fillStyle = MENU.sombra;
  c.fillText(texto, x + 2, y + 2);
  c.fillStyle = color;
  c.fillText(texto, x, y);
  c.restore();
}

/**
 * El aro decorativo: un anillo con marcas doradas, como una brújula, y una
 * gema hexagonal ámbar en el centro que late. Gira muy despacio.
 */
export function aroMenu(c, x, y, r, t = 0) {
  c.save();
  c.translate(x, y);
  // anillo
  c.lineWidth = r * 0.07;
  c.strokeStyle = 'rgba(150,40,20,0.55)';
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
  // marcas
  c.rotate(t * 0.12);
  c.strokeStyle = '#e8c872';
  c.lineWidth = Math.max(1.5, r * 0.025);
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const largo = i % 6 === 0 ? r * 0.2 : r * 0.08;
    if (i % 12 > 7 && i % 6 !== 0) continue;    // huecos, como un dial gastado
    c.beginPath();
    c.moveTo(Math.cos(a) * (r - largo), Math.sin(a) * (r - largo));
    c.lineTo(Math.cos(a) * (r + largo * 0.3), Math.sin(a) * (r + largo * 0.3));
    c.stroke();
  }
  c.rotate(-t * 0.12);
  // centro: el medallón dorado, si cargó; si no, la gema hexagonal
  const rg = r * 0.3 * (1 + Math.sin(t * 2.2) * 0.04);
  if (_tex.medallon) {
    const lado = rg * 3.2;
    const brillo = c.createRadialGradient(0, 0, lado * 0.2, 0, 0, lado * 0.75);
    brillo.addColorStop(0, 'rgba(245,176,38,' + (0.25 + Math.sin(t * 2.2) * 0.1).toFixed(3) + ')');
    brillo.addColorStop(1, 'rgba(245,176,38,0)');
    c.fillStyle = brillo;
    c.beginPath(); c.arc(0, 0, lado * 0.75, 0, Math.PI * 2); c.fill();
    c.drawImage(_tex.medallon, -lado / 2, -lado / 2, lado, lado);
    c.restore();
    return;
  }
  const hex = (rr) => {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i / 6) * Math.PI * 2;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
  };
  const g = c.createRadialGradient(-rg * 0.3, -rg * 0.3, rg * 0.1, 0, 0, rg);
  g.addColorStop(0, '#fff2b0');
  g.addColorStop(0.45, '#f5b026');
  g.addColorStop(1, '#8a3a06');
  hex(rg * 1.25);
  c.fillStyle = '#3a1204';
  c.fill();
  hex(rg);
  c.fillStyle = g;
  c.fill();
  c.restore();
}

/** Interpolación con suavizado de entrada/salida. */
export function suave(t) { return t < 0 ? 0 : t > 1 ? 1 : 0.5 - Math.cos(t * Math.PI) / 2; }
export function mezcla(a, b, t) { return a + (b - a) * t; }
export function limitar(v, a, b) { return v < a ? a : v > b ? b : v; }

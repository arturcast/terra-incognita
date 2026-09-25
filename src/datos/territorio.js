/**
 * territorio.js — El mapa y lo que esconde.
 *
 * REGLA DE ORO: en pantalla nunca aparece "proceso", "auditoría" ni ningún
 * término del oficio. El campo `equivale` existe solo para el cierre.
 *
 * SEGUNDA REGLA: vocabulario corriente. Nada de "catalejo", "paraje",
 * "cartógrafo". Si una palabra obliga a detenerse a pensar qué significa, está
 * mal elegida. Esto lo juega gente de toda la compañía en Barranquilla.
 *
 * TERCERA REGLA, la que da nombre a este archivo: **cada lugar es un guiño al
 * proceso real**. No un nombre decorativo cualquiera, sino uno que al
 * revelarse en el cierre haga sonreír porque encaja. El Gran Caudal es
 * facturación porque todo el consumo pasa y se mide ahí. La Montaña Perdida
 * es pérdida no operacional porque sube gas por la ladera y arriba llega
 * menos. La Isla Brillante es Brilla. Ese es el listón para cualquier lugar
 * nuevo: si el nombre no se explica solo al revelarlo, no sirve.
 *
 * Tres textos por lugar, cada uno para un momento distinto:
 *   pista         — leyenda flotante al apuntarlo en la fase de decidir.
 *   verdad        — qué era ese lugar, en el resultado.
 *   porQueImporta — por qué debía o no elegirse.
 *
 * Coordenadas en fracción del lienzo (0-1).
 */

/** Las tres barras. Se usan en el juego, en las instrucciones y en el cierre. */
export const LECTURAS = [
  {
    clave: 'riesgo',
    nombre: 'Riesgo',
    color: '#e0614a',
    texto: 'Qué tan probable es que algo salga mal en ese lugar.',
  },
  {
    clave: 'valor',
    nombre: 'Importancia',
    color: '#4ec9a5',
    texto: 'Cuánto le pesa a la compañía si ese lugar falla.',
  },
  {
    clave: 'senal',
    nombre: 'Señales',
    color: '#5aa9e6',
    texto: 'Cuánto están avisando los datos de que ahí pasa algo. Ojo: puede haber peligro sin señales.',
  },
];

export const REGIONES = [
  {
    id: 'caudal',
    nombre: 'El Gran Caudal',
    equivale: 'Facturación',
    x: 0.30, y: 0.62,
    riesgo: 0.72, valor: 0.95, senal: 0.88,
    dificultad: 1.0,
    descubierto: false,
    pista: 'Todo lo que se consume en el territorio pasa por aquí, y aquí se mide cuánto fue.',
    verdad: 'Por aquí pasa toda la plata de la compañía. Un desvío del 1% no se nota a simple vista, pero arrastra más que cualquier otro lugar.',
    porQueImporta: 'Mucho riesgo, muchísima importancia y los datos gritando. Era la primera de la lista.',
  },
  {
    id: 'torre',
    nombre: 'La Torre de Señales',
    equivale: 'Dirección Digital',
    x: 0.50, y: 0.22,
    riesgo: 0.74, valor: 0.80, senal: 0.77,
    dificultad: 1.1,
    descubierto: false,
    pista: 'Desde arriba se ve todo el territorio. Todas las señales pasan por esta torre.',
    verdad: 'Desde arriba se ve todo el territorio. Por eso mismo, quien se tome la torre ve todo el territorio.',
    porQueImporta: 'Alta en las tres barras. De las más claras de elegir.',
  },
  {
    id: 'fundicion',
    nombre: 'La Fundición',
    equivale: 'Compras y contratación',
    x: 0.62, y: 0.30,
    riesgo: 0.85, valor: 0.78, senal: 0.54,
    dificultad: 1.2,
    descubierto: false,
    pista: 'Aquí se funde el metal con el que se sellan los tratos. Mucho calor y pocos testigos.',
    verdad: 'Aquí el dinero cambia de manos. Mucho calor, pocos testigos, y decisiones que comprometen años.',
    porQueImporta: 'De los riesgos más altos del mapa, y con mucho en juego.',
  },
  {
    id: 'ramales',
    nombre: 'Los Ramales',
    equivale: 'Construcciones e Ingeniería',
    x: 0.47, y: 0.45,
    riesgo: 0.60, valor: 0.82, senal: 0.70,
    dificultad: 0.9,
    descubierto: false,
    pista: 'De aquí salen los caminos nuevos hacia donde todavía no llega nada.',
    verdad: 'Crecen más rápido de lo que alcanzan a ponerse en el mapa. Crecer bien y crecer rápido casi nunca son lo mismo.',
    porQueImporta: 'Buena candidata, y se queda por fuera por muy poco. De las que siempre dan para discutir.',
  },
  {
    id: 'manantial',
    nombre: 'El Manantial',
    equivale: 'Compra y venta de gas',
    x: 0.61, y: 0.56,
    riesgo: 0.56, valor: 0.90, senal: 0.44,
    dificultad: 1.0,
    descubierto: false,
    pista: 'De aquí brota lo que mueve todo el territorio. Si se seca, no hay nada que repartir.',
    verdad: 'El origen de todo. No es el lugar donde más cosas salen mal, pero es el único sin el cual ningún otro lugar existe.',
    porQueImporta: 'La importancia más alta después del caudal. El riesgo propio es moderado, y por eso no entra.',
  },
  {
    id: 'montana',
    nombre: 'La Montaña Perdida',
    equivale: 'Pérdida No Operacional',
    x: 0.38, y: 0.26,
    riesgo: 0.68, valor: 0.66, senal: 0.60,
    dificultad: 1.0,
    descubierto: false,
    pista: 'Sube gas por la ladera y arriba siempre llega menos del que salió. Nadie sabe bien dónde se queda.',
    verdad: 'Lo que sale y no llega. Está medido, se sabe cuánto es, y aun así es el lugar donde más cuesta señalar al responsable.',
    porQueImporta: 'Muy cerca de entrar. Se sabe que hay fuga y se sabe cuánta; lo difícil es dónde. Dejarla fuera se defiende, pero hay que defenderlo.',
  },
  {
    id: 'salinas',
    nombre: 'Las Salinas',
    equivale: 'Tarifas y subsidios regulados',
    x: 0.78, y: 0.58,
    riesgo: 0.69, valor: 0.74, senal: 0.40,
    dificultad: 1.3,
    descubierto: false,
    pista: 'Reglas endurecidas por el sol. Las escribió gente de afuera y no se negocian.',
    verdad: 'Reglas que vienen de afuera y no se negocian: se cumplen. Y el costo de no cumplirlas no lo pone uno.',
    porQueImporta: 'Riesgo e importancia altos. Queda cerca de entrar.',
  },
  {
    id: 'acantilados',
    nombre: 'Los Acantilados',
    equivale: 'Seguridad y salud en el trabajo',
    x: 0.70, y: 0.82,
    riesgo: 0.88, valor: 0.52, senal: 0.35,
    dificultad: 1.0,
    descubierto: false,
    pista: 'Un paso en falso aquí no se arregla con dinero.',
    verdad: 'Un error aquí no se corrige con un ajuste contable. Es el único lugar del mapa donde lo que está en juego no es plata.',
    porQueImporta: 'El riesgo más alto de todo el mapa. Se queda afuera por poco, y es una decisión que siempre da para discutir.',
  },
  {
    id: 'hornos',
    nombre: 'Los Grandes Hornos',
    equivale: 'Gran Industria',
    x: 0.74, y: 0.45,
    riesgo: 0.55, valor: 0.79, senal: 0.52,
    dificultad: 0.9,
    descubierto: false,
    pista: 'Unos pocos hornos consumen aquí lo que consumen miles de casas en otra parte.',
    verdad: 'Pocos clientes, volúmenes enormes. Un error de medición que en una casa son centavos, aquí son millones.',
    porQueImporta: 'Importa mucho y se revisa poco, pero su riesgo propio no alcanza al de las que entraron.',
  },
  {
    id: 'faro',
    nombre: 'El Faro',
    equivale: 'Atención a usuarios',
    x: 0.16, y: 0.33,
    riesgo: 0.44, valor: 0.66, senal: 0.92,
    dificultad: 0.7,
    descubierto: false,
    pista: 'Desde aquí se oyen las voces de todos los que viven en el territorio.',
    verdad: 'No causa la tormenta: la anuncia. Quien aprende a leer su luz se entera antes que nadie de lo que viene.',
    porQueImporta: 'Las señales más fuertes del mapa, pero poco riesgo propio. Aquí es donde muchos se equivocan: seguir la luz más brillante no es lo mismo que ir a donde más se necesita.',
  },
  {
    id: 'represa',
    nombre: 'La Represa',
    equivale: 'Recaudo y cartera',
    x: 0.13, y: 0.55,
    riesgo: 0.52, valor: 0.70, senal: 0.66,
    dificultad: 0.8,
    descubierto: false,
    pista: 'Aquí se retiene lo que baja por el caudal. No todo lo que entra alcanza a salir.',
    verdad: 'Lo que se cobró y lo que todavía no. El agua que se queda detrás del muro también es agua de la compañía.',
    porQueImporta: 'Bien vigilada y con señales claras. No era de las urgentes.',
  },
  {
    id: 'poblado',
    nombre: 'El Poblado',
    equivale: 'Gestión Humana',
    x: 0.24, y: 0.42,
    riesgo: 0.39, valor: 0.62, senal: 0.48,
    dificultad: 0.8,
    descubierto: false,
    pista: 'Aquí vive la gente que hace que el territorio funcione.',
    verdad: 'Denso y constante. Pocas veces es el origen del problema; siempre es parte de la solución.',
    porQueImporta: 'Lo más bajo del mapa en riesgo. Decidir no ir también es decidir.',
  },
  {
    id: 'puente',
    nombre: 'El Puente Viejo',
    equivale: 'Mantenimiento de infraestructura',
    x: 0.55, y: 0.72,
    riesgo: 0.78, valor: 0.58, senal: 0.31,
    dificultad: 1.1,
    descubierto: false,
    emergente: true,
    pista: 'Lleva años aguantando y nadie recuerda cuándo se revisó por última vez.',
    verdad: 'Aguanta desde hace años y por eso nadie lo mira. Casi no da señales. Su peligro todavía no está en los datos: está en el tiempo.',
    porQueImporta: 'Aquí está la trampa. Riesgo alto, señales casi en cero. Si solo mirabas la barra azul, lo dejaste pasar. Los datos avisan de lo que ya pasó; no de lo que se está gastando en silencio.',
  },

  // ------------------------------------------------------------------
  // El lugar de afuera. No está en la tierra principal: hay que salirse
  // del mapa para encontrarlo. Es el negocio que no es "el negocio".
  // ------------------------------------------------------------------
  {
    id: 'isla',
    nombre: 'La Isla Brillante',
    equivale: 'Brilla — financiación no bancaria',
    x: 0.90, y: 0.145,
    riesgo: 0.70, valor: 0.76, senal: 0.20,
    dificultad: 1.15,
    descubierto: false,
    emergente: true,
    oculta: true,
    pista: 'Brilla a lo lejos, separada de todo. No se parece en nada al resto del territorio.',
    verdad: 'Está lejos de tierra firme y no se parece a nada del resto del mapa. Casi nadie llega hasta acá — y sin embargo se mueve mucho dinero.',
    porQueImporta: 'Casi nadie la encuentra, porque para verla hay que mirar por fuera del mapa. No se parece al resto y por eso se revisa poco. Pero mueve plata de verdad y tiene sus propios riesgos. Lo que una compañía no mira porque "no es lo nuestro" suele ser justo lo que menos control tiene.',
  },
];

/** Banderas disponibles. Escasez deliberada: 5 para 14 lugares. */
export const BANDERAS_DISPONIBLES = 5;

/**
 * Prioridad "verdadera". El visitante no la ve: la deduce.
 *
 * Las regiones `emergente` llevan un multiplicador porque su peligro no está
 * reflejado en las señales. Es la lección central de la etapa: los datos
 * cuentan lo que ya pasó, no lo que se está deteriorando en silencio.
 */
export function prioridadReal(r) {
  const base = r.riesgo * 0.45 + r.valor * 0.35 + r.senal * 0.20;
  return r.emergente ? base * 1.15 : base;
}

export function rankingIdeal() {
  return [...REGIONES].sort((a, b) => prioridadReal(b) - prioridadReal(a));
}

/**
 * Evalúa la decisión. Devuelve tres notas y, sobre todo, material para
 * explicarle al visitante por qué. La explicación importa más que la nota.
 */
export function evaluar(elegidas, fraccionExplorada) {
  const ideal = rankingIdeal();
  const top = ideal.slice(0, BANDERAS_DISPONIBLES);
  const idsIdeales = top.map((r) => r.id);

  const vision = Math.round(fraccionExplorada * 100);

  const aciertos = elegidas.filter((r) => idsIdeales.includes(r.id)).length;
  const criterio = Math.round((aciertos / BANDERAS_DISPONIBLES) * 100);

  let puntosOrden = 0;
  elegidas.forEach((r, i) => {
    const pos = idsIdeales.indexOf(r.id);
    if (pos === -1) return;
    puntosOrden += Math.max(0, 1 - Math.abs(pos - i) / BANDERAS_DISPONIBLES);
  });
  const priorizacion = Math.round((puntosOrden / BANDERAS_DISPONIBLES) * 100);

  const total = Math.round(vision * 0.3 + criterio * 0.45 + priorizacion * 0.25);

  let veredicto;
  if (total >= 80) veredicto = 'Muy buen ojo';
  else if (total >= 60) veredicto = 'Buen criterio';
  else if (total >= 40) veredicto = 'Vas aprendiendo';
  else veredicto = 'Saliste sin mirar bien';

  const acertadas = elegidas.filter((r) => idsIdeales.includes(r.id));
  const sobrantes = elegidas.filter((r) => !idsIdeales.includes(r.id));
  const perdidas = top.filter((r) => !elegidas.some((e) => e.id === r.id));

  const comparaciones = [];
  for (let i = 0; i < Math.min(sobrantes.length, perdidas.length); i++) {
    comparaciones.push({ elegida: sobrantes[i], mejor: perdidas[i] });
  }

  const isla = REGIONES.find((r) => r.id === 'isla');
  const islaDescubierta = !!(isla && isla.descubierto);
  const islaElegida = elegidas.some((r) => r.id === 'isla');

  return {
    vision, criterio, priorizacion, total, veredicto,
    acertadas, sobrantes, perdidas, comparaciones,
    idsIdeales, ideal: top,
    islaDescubierta, islaElegida,
    elegidas,
  };
}

/**
 * Costa del territorio. Determinista: el mapa es siempre el mismo, para que
 * quien vuelva reconozca el lugar.
 */
export function generarCosta(puntos = 220) {
  const crudo = [];
  for (let i = 0; i < puntos; i++) {
    const a = (i / puntos) * Math.PI * 2;
    const r =
      0.335 +
      Math.sin(a * 2 + 0.7) * 0.055 +
      Math.sin(a * 3 - 1.3) * 0.038 +
      Math.sin(a * 5 + 2.1) * 0.022 +
      Math.sin(a * 8 - 0.4) * 0.011;
    crudo.push({ x: Math.cos(a) * r * 1.22, y: Math.sin(a) * r });
  }

  // Encajar en un recuadro fijo: la suma de senos no es simétrica y sin esto
  // la tierra se sale por un borde y deja hueco en el otro.
  const xs = crudo.map((p) => p.x), ys = crudo.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const CAJA = { x: 0.08, y: 0.17, w: 0.76, h: 0.70 };

  return crudo.map((p) => ({
    x: CAJA.x + ((p.x - x0) / (x1 - x0)) * CAJA.w,
    y: CAJA.y + ((p.y - y0) / (y1 - y0)) * CAJA.h,
  }));
}

/** Contorno de la isla escondida, centrada en su región. */
export function generarIsla(puntos = 60) {
  const r0 = 0.042;
  const salida = [];
  for (let i = 0; i < puntos; i++) {
    const a = (i / puntos) * Math.PI * 2;
    const r = r0 + Math.sin(a * 3 + 1.1) * 0.010 + Math.sin(a * 5 - 0.6) * 0.005;
    salida.push({ x: Math.cos(a) * r * 1.25, y: Math.sin(a) * r });
  }
  return salida;
}

/** ¿Cae el punto dentro de un polígono? Se usa en las pruebas del mapa. */
export function dentroDeCosta(x, y, costa = generarCosta()) {
  let dentro = false;
  for (let i = 0, j = costa.length - 1; i < costa.length; j = i++) {
    const xi = costa[i].x, yi = costa[i].y;
    const xj = costa[j].x, yj = costa[j].y;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/**
 * Qué va a revisar el equipo en cada lugar.
 *
 * Se muestra en el relato, justo después de decidir. Es el único momento de la
 * etapa donde la metáfora y el proceso real se tocan: el visitante ya tomó sus
 * decisiones y ahora ve qué acaba de mandar a revisar de verdad.
 *
 * Va aparte de REGIONES a propósito. Son frases del mundo real, no del
 * territorio, y mezclarlas con `pista` o `verdad` invita a confundirlas y a
 * colarlas donde no deben aparecer.
 */
const QUE_REVISAMOS = {
  caudal: 'Que a cada quien se le cobre lo que consumió: ni un peso de más, ni uno de menos.',
  torre: 'Quién puede entrar a los sistemas, qué puede hacer adentro, y qué pasaría si alguien se cuela.',
  fundicion: 'Cómo se eligen los proveedores y si los contratos se cumplen como se firmaron.',
  ramales: 'Que las obras se hagan bien y a tiempo, y que lo que se pagó sea lo que se construyó.',
  manantial: 'Los contratos de suministro: cuánto se compra, a qué precio, y si eso le conviene a la compañía.',
  montana: 'A dónde se va el gas que sale y no llega. Cuánto es pérdida técnica y cuánto es otra cosa.',
  salinas: 'Que las tarifas se apliquen como manda la regulación y que el subsidio llegue a quien debe.',
  acantilados: 'Que la gente que trabaja en campo vuelva a su casa igual que salió.',
  hornos: 'La medición y la facturación de los clientes grandes, donde un error pequeño es mucha plata.',
  faro: 'Qué están reclamando los usuarios, si se les resuelve, y qué nos está diciendo eso.',
  represa: 'Lo que se cobró, lo que sigue pendiente, y qué se está haciendo para recuperarlo.',
  poblado: 'Cómo se contrata, cómo se paga y cómo se cuida a la gente.',
  puente: 'El estado real de la infraestructura, y si el mantenimiento se está haciendo o solo se está reportando.',
  isla: 'Cómo se otorgan los créditos, cómo se recuperan, y quién responde cuando no se pagan.',
};

REGIONES.forEach((r) => { r.queRevisamos = QUE_REVISAMOS[r.id]; });

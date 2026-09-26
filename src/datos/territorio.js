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
    x: 0.44, y: 0.52,
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
    x: 0.485, y: 0.12,
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
    x: 0.63, y: 0.32,
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
    x: 0.5, y: 0.41,
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
    x: 0.655, y: 0.57,
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
    x: 0.36, y: 0.22,
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
    x: 0.87, y: 0.6,
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
    x: 0.74, y: 0.79,
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
    x: 0.75, y: 0.45,
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
    x: 0.093, y: 0.28,
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
    x: 0.28, y: 0.63,
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
    x: 0.25, y: 0.41,
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
    x: 0.61, y: 0.68,
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
    x: 0.905, y: 0.125,
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
 * Costa del territorio, calcada del dibujo del mapa (assets/mapa-territorio.jpg,
 * 1672x941) con herramientas/calcar-costa.py: 160 puntos en fracción de la
 * imagen, que se dibuja ocupando todo el lienzo. Antes era una suma de senos;
 * ahora la costa tiene que coincidir con el dibujo, o un lugar podría caer en
 * el agua pintada. Las pruebas de AGENTS.md §6 la usan para verificarlo.
 */
const COSTA = [
  [0.9342, 0.5], [0.9318, 0.5298], [0.9533, 0.5596], [0.9629, 0.5936], [0.9486, 0.6234], [0.9629, 0.6574],
  [0.939, 0.683], [0.9246, 0.7043], [0.9007, 0.7213], [0.8888, 0.7468], [0.8816, 0.7681], [0.8792, 0.7979],
  [0.8242, 0.7766], [0.7955, 0.7809], [0.7763, 0.7809], [0.7572, 0.7894], [0.7548, 0.8064], [0.75, 0.8277],
  [0.75, 0.8574], [0.7476, 0.883], [0.738, 0.8957], [0.7045, 0.866], [0.6998, 0.8787], [0.6471, 0.7979],
  [0.6471, 0.8191], [0.6328, 0.8064], [0.6256, 0.8191], [0.616, 0.8191], [0.616, 0.8532], [0.6089, 0.8574],
  [0.6065, 0.883], [0.5993, 0.9], [0.5873, 0.883], [0.5778, 0.883], [0.5682, 0.883], [0.5586, 0.8787],
  [0.5514, 0.883], [0.5419, 0.8787], [0.5323, 0.8872], [0.5251, 0.9043], [0.5156, 0.8787], [0.5084, 0.8745],
  [0.4988, 0.8702], [0.494, 0.8277], [0.4868, 0.8191], [0.4868, 0.7723], [0.4773, 0.7936], [0.4677, 0.8106],
  [0.4605, 0.8021], [0.4533, 0.7979], [0.4486, 0.7894], [0.4414, 0.7851], [0.4342, 0.7809], [0.427, 0.7851],
  [0.4222, 0.7766], [0.4151, 0.7681], [0.4079, 0.7638], [0.4294, 0.6957], [0.3911, 0.7596], [0.3816, 0.7596],
  [0.3744, 0.7511], [0.3648, 0.7468], [0.3529, 0.7511], [0.3481, 0.7383], [0.3505, 0.7128], [0.3122, 0.7426],
  [0.2955, 0.7383], [0.2883, 0.7298], [0.2955, 0.7], [0.2189, 0.7426], [0.2045, 0.7298], [0.183, 0.717],
  [0.1806, 0.6957], [0.1639, 0.6787], [0.1567, 0.6532], [0.1184, 0.6404], [0.1017, 0.6191], [0.0993, 0.5894],
  [0.0778, 0.5596], [0.0801, 0.5298], [0.0897, 0.5], [0.0969, 0.4702], [0.1065, 0.4447], [0.073, 0.4064],
  [0.0467, 0.3681], [0.0634, 0.3426], [0.073, 0.3085], [0.0921, 0.2872], [0.0945, 0.2574], [0.1687, 0.2702],
  [0.1854, 0.2574], [0.1902, 0.2319], [0.2045, 0.2191], [0.2452, 0.2319], [0.2644, 0.2277], [0.2859, 0.2277],
  [0.2907, 0.2064], [0.3026, 0.1979], [0.3074, 0.1851], [0.3266, 0.1894], [0.3337, 0.1723], [0.3457, 0.1723],
  [0.3529, 0.1596], [0.3624, 0.1511], [0.3696, 0.1426], [0.3888, 0.1638], [0.4079, 0.1851], [0.4151, 0.1766],
  [0.4222, 0.1723], [0.4294, 0.1638], [0.4366, 0.1553], [0.4438, 0.1553], [0.4533, 0.1511], [0.4581, 0.1298],
  [0.4653, 0.1298], [0.4749, 0.1213], [0.4797, 0.0957], [0.4892, 0.0957], [0.4988, 0.1213], [0.5084, 0.117],
  [0.5156, 0.1213], [0.5251, 0.1128], [0.5323, 0.117], [0.5419, 0.1085], [0.5514, 0.1043], [0.5586, 0.1255],
  [0.5658, 0.1255], [0.5754, 0.1298], [0.5825, 0.1383], [0.5897, 0.1426], [0.5945, 0.1596], [0.5945, 0.1979],
  [0.6089, 0.1809], [0.6184, 0.1723], [0.6232, 0.1936], [0.6304, 0.1936], [0.64, 0.1979], [0.6471, 0.2064],
  [0.6591, 0.2021], [0.6328, 0.2787], [0.6423, 0.2787], [0.6639, 0.2574], [0.6782, 0.2574], [0.6854, 0.2617],
  [0.6926, 0.2745], [0.7045, 0.2787], [0.7093, 0.2872], [0.7213, 0.2957], [0.7404, 0.2957], [0.7572, 0.3043],
  [0.7691, 0.3128], [0.7955, 0.317], [0.817, 0.3255], [0.8313, 0.3426], [0.8385, 0.3638], [0.8529, 0.3809],
  [0.8672, 0.4021], [0.8624, 0.4277], [0.8983, 0.4447], [0.9246, 0.4702],
].map(([x, y]) => ({ x, y }));

/** Contorno de la isla del templo, en fracción de la imagen (absoluto). */
const ISLA = [
  [0.9438, 0.1426], [0.9438, 0.1553], [0.9318, 0.1638], [0.9318, 0.1766], [0.9318, 0.1851], [0.9151, 0.1809],
  [0.9127, 0.1894], [0.9079, 0.1894], [0.9055, 0.1936], [0.9007, 0.1979], [0.8959, 0.1936], [0.8911, 0.1936],
  [0.8864, 0.1936], [0.884, 0.1936], [0.8768, 0.2106], [0.8768, 0.1936], [0.872, 0.1894], [0.872, 0.1766],
  [0.8696, 0.1723], [0.8648, 0.1723], [0.86, 0.1681], [0.8577, 0.1638], [0.8361, 0.1681], [0.8242, 0.1553],
  [0.8266, 0.1426], [0.8313, 0.1298], [0.8433, 0.1213], [0.8553, 0.117], [0.8577, 0.1085], [0.8624, 0.1085],
  [0.8672, 0.1043], [0.8696, 0.1], [0.8744, 0.1], [0.8768, 0.0957], [0.8816, 0.0957], [0.884, 0.1043],
  [0.8864, 0.1043], [0.8911, 0.0915], [0.8959, 0.0872], [0.8983, 0.0915], [0.9031, 0.0915], [0.9175, 0.0745],
  [0.9222, 0.0787], [0.9222, 0.0957], [0.9175, 0.1085], [0.9175, 0.117], [0.9199, 0.1255], [0.9199, 0.134],
].map(([x, y]) => ({ x, y }));

/** La costa de la tierra firme. Determinista: el mapa es siempre el mismo. */
export function generarCosta() {
  return COSTA.map((p) => ({ ...p }));
}

/**
 * Contorno de la isla escondida, RELATIVO a su región (quien dibuja le suma
 * `isla.x, isla.y`, como siempre).
 */
export function generarIsla() {
  const isla = REGIONES.find((r) => r.id === 'isla');
  return ISLA.map((p) => ({ x: p.x - isla.x, y: p.y - isla.y }));
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

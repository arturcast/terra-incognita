/**
 * panel-mandos.js — Panel del operador del stand. Se abre con la tecla J (o F9).
 *
 * Es HTML y no lienzo por tres razones: `requestDevice()` exige un gesto real
 * del usuario sobre un elemento del DOM; la lista, los botones y el texto los
 * resuelve el DOM gratis; y tiene que poder abrirse encima de cualquier escena
 * sin que esta se entere ni se pause.
 *
 * Nunca aparece solo. El visitante no debería verlo jamás.
 */

import { TablaPuntajes } from '../datos/puntajes.js';
import { BOTON } from '../core/joycon.js';
import { ETIQUETA_NIVEL, COLOR_NIVEL, NIVEL } from '../core/mandos.js';

// Botones que existen en cada mitad, para el diagnóstico en vivo.
const BOTONES_R = [
  ['Y', BOTON.Y], ['X', BOTON.X], ['B', BOTON.B], ['A', BOTON.A],
  ['SR', BOTON.SR_R], ['SL', BOTON.SL_R], ['R', BOTON.R], ['ZR', BOTON.ZR],
  ['+', BOTON.MAS], ['Stick', BOTON.STICK_R], ['Home', BOTON.HOME],
];
const BOTONES_L = [
  ['↑', BOTON.ARRIBA], ['↓', BOTON.ABAJO], ['←', BOTON.IZQUIERDA], ['→', BOTON.DERECHA],
  ['SR', BOTON.SR_L], ['SL', BOTON.SL_L], ['L', BOTON.L], ['ZL', BOTON.ZL],
  ['−', BOTON.MENOS], ['Stick', BOTON.STICK_L], ['Capt', BOTON.CAPTURA],
];

export class PanelMandos {
  constructor(gestor, joycon, motor) {
    this.gestor = gestor;
    this.jc = joycon;
    this.motor = motor;
    this.abierto = false;
    this._refresco = null;
    this._ultimaPrueba = null;

    this.raiz = document.getElementById('panelMandos');
    this.banda = document.getElementById('bandaAviso');
    this._construir();

    gestor.addEventListener('inventario', () => this._pintarLista());
    gestor.addEventListener('cambio', () => this._pintarLista());
    gestor.addEventListener('aviso', () => this._revisarAvisos());
  }

  _construir() {
    this.raiz.innerHTML = `
      <div class="pm-caja">
        <header>
          <b>Mandos</b>
          <span class="pm-cerrar">J o Esc cierra</span>
        </header>
        <div class="pm-sub">JUGADORES</div>
        <div class="pm-jugadores"></div>
        <button class="pm-accion pm-dos">Ir a la sala de prueba de dos jugadores (tecla P)</button>
        <button class="pm-accion pm-calibrar">Calibrar los mandos en juego (déjalos quietos)</button>
        <div class="pm-sub" style="margin-top:18px">MANDOS AUTORIZADOS</div>
        <div class="pm-lista"></div>
        <button class="pm-accion pm-sync">＋ Sincronizar un mando nuevo</button>
        <div class="pm-prueba"></div>
        <div class="pm-diag"></div>
        <div class="pm-sub" style="margin-top:18px">PUNTAJES</div>
        <button class="pm-accion pm-borrar">Borrar tabla de puntajes</button>
        <div class="pm-borrado"></div>
        <div class="pm-nota">
          Servidor en el puerto <b>8740</b>. No lo cambies: Chrome ataría las
          autorizaciones a otro origen y olvidaría los mandos.
        </div>
      </div>`;

    this.lista = this.raiz.querySelector('.pm-lista');
    this.zonaJugadores = this.raiz.querySelector('.pm-jugadores');
    this.zonaPrueba = this.raiz.querySelector('.pm-prueba');
    this.zonaDiag = this.raiz.querySelector('.pm-diag');

    this.raiz.querySelector('.pm-sync').addEventListener('click', () => this._sincronizar());
    this.raiz.querySelector('.pm-calibrar').addEventListener('click', () => {
      const js = this.motor.jugadores.filter((j) => j.estado.conectado);
      js.forEach((j) => j.calibrar());
      this.zonaPrueba.innerHTML = js.length
        ? '<div class="pm-probando">Calibrando ' + js.length + (js.length === 1 ? ' mando' : ' mandos') +
          '… déjalos quietos sobre la mesa unos segundos (el chip de arriba dice «calibrando…»).</div>'
        : '<div class="pm-mal">No hay ningún mando en juego para calibrar.</div>';
    });
    this.raiz.querySelector('.pm-dos').addEventListener('click', () => {
      this.alternar(false);
      this.motor.ir('prueba2j');
    });
    // Vaciar la tabla de los mejores (p. ej. tras las pruebas o antes de un evento).
    // Pide confirmar con un segundo clic: no se borra por accidente.
    const borrar = this.raiz.querySelector('.pm-borrar');
    const zonaBorrado = this.raiz.querySelector('.pm-borrado');
    let armado = false;
    borrar.addEventListener('click', () => {
      if (!armado) {
        armado = true;
        borrar.textContent = '¿Seguro? Pulsa otra vez para borrar todos los puntajes';
        setTimeout(() => { armado = false; borrar.textContent = 'Borrar tabla de puntajes'; }, 4000);
        return;
      }
      armado = false;
      new TablaPuntajes().borrar();
      borrar.textContent = 'Borrar tabla de puntajes';
      zonaBorrado.innerHTML = '<div class="pm-ok">Tabla de puntajes vacía.</div>';
      setTimeout(() => { zonaBorrado.innerHTML = ''; }, 3000);
    });
    // Clic fuera de la caja cierra, igual que cualquier diálogo.
    this.raiz.addEventListener('click', (e) => { if (e.target === this.raiz) this.alternar(false); });
  }

  // ------------------------------------------------------------- apertura
  alternar(forzar) {
    this.abierto = forzar === undefined ? !this.abierto : forzar;
    this.raiz.classList.toggle('oculto', !this.abierto);
    document.body.classList.toggle('jugando', !this.abierto);

    if (this.abierto) {
      this.gestor.refrescar();
      this._pintarLista();
      this._refresco = setInterval(() => { this._pintarLista(); this._pintarDiagnostico(); }, 250);
    } else {
      clearInterval(this._refresco);
      this._refresco = null;
      this.zonaPrueba.innerHTML = '';
    }
  }

  // --------------------------------------------------------------- lista
  /**
   * Tarjetas de Jugador 1 y Jugador 2: lo primero que se ve al abrir el panel.
   *
   * La primera versión metía "Jugador 2" como un botón más dentro de la fila de
   * cada mando, y no había forma de encontrar "el modo de dos jugadores". Ahora
   * se ve de un vistazo quién juega con qué mando y cómo añadir al segundo.
   */
  _pintarJugadores() {
    const inv = this.gestor.inventario;
    const libres = inv.filter((m) => m.ranura < 0 && m.estado !== 'perdido');
    this.zonaJugadores.innerHTML = '';

    this.gestor.jugadores.forEach((jc, r) => {
      const id = this.gestor.ranuras[r];
      const m = id ? inv.find((x) => x.id === id) : null;
      const tarjeta = document.createElement('div');
      tarjeta.className = 'pm-jugador' + (m ? ' ocupado' : '');

      if (m) {
        const nivel = m.nivel === null ? null : m.nivel;
        const color = nivel === null ? '#5a6068' : COLOR_NIVEL[nivel];
        tarjeta.innerHTML = `
          <div class="pm-jt">JUGADOR ${r + 1}</div>
          <div class="pm-jm">${m.nombre}</div>
          <div class="pm-tenue"><span style="color:${color}">${nivel === null ? 'batería sin leer' : 'batería ' + ETIQUETA_NIVEL[nivel]}</span>${jc.estado.hz ? ' · ' + jc.estado.hz + ' Hz' : ''}</div>
          <div class="pm-jb"></div>`;
        const b = tarjeta.querySelector('.pm-jb');
        // El jugador 1 no se quita: sin él no hay juego. Se cambia de mando.
        if (r > 0) b.appendChild(this._boton('Quitar jugador', () => this.gestor.liberarRanura(r)));
        for (const l of libres) b.appendChild(this._boton('Cambiar a ' + l.nombre, () => this.gestor.activar(l.id, r)));
      } else {
        tarjeta.innerHTML = `
          <div class="pm-jt">JUGADOR ${r + 1}</div>
          <div class="pm-jm pm-vacia">sin mando</div>
          <div class="pm-jb"></div>`;
        const b = tarjeta.querySelector('.pm-jb');
        if (libres.length) {
          for (const l of libres) b.appendChild(this._boton('Usar ' + l.nombre, () => this.gestor.activar(l.id, r), 'principal'));
        } else {
          b.innerHTML = '<div class="pm-tenue">No hay otro mando libre. Enciende el segundo Joy-Con '
            + '(pulsa un botón) y, si no aparece abajo, usa «Sincronizar un mando nuevo».</div>';
        }
      }
      this.zonaJugadores.appendChild(tarjeta);
    });
  }

  _pintarLista() {
    if (!this.abierto) return;
    this._pintarJugadores();
    const inv = this.gestor.inventario;

    if (!inv.length) {
      this.lista.innerHTML = `
        <div class="pm-vacio">
          <p>No hay ningún Joy-Con autorizado en este navegador.</p>
          <p class="pm-pasos">
            <b>1.</b> Empareja el mando con Windows: mantén pulsado el botón pequeño
            del lateral (entre los rieles SL y SR) hasta que las luces corran, y
            búscalo en <i>Configuración → Bluetooth</i>.<br>
            <b>2.</b> Vuelve aquí y pulsa <i>Sincronizar un mando nuevo</i>.
          </p>
          <p class="pm-pasos">Son dos pasos distintos: el navegador no puede hacer el primero.</p>
        </div>`;
      return;
    }

    this.lista.innerHTML = '';
    for (const m of inv) {
      const fila = document.createElement('div');
      fila.className = 'pm-fila' + (m.esActivo ? ' activa' : '');

      const nivel = m.nivel === null ? null : m.nivel;
      const etiqueta = nivel === null ? 'sin lectura' : ETIQUETA_NIVEL[nivel];
      const color = nivel === null ? '#5a6068' : COLOR_NIVEL[nivel];
      const pips = [8, 6, 4, 2].map((n) =>
        `<i style="background:${nivel !== null && nivel >= n ? color : 'rgba(255,255,255,.12)'}"></i>`
      ).join('');

      const estado = m.ranura >= 0 ? 'JUGADOR ' + (m.ranura + 1) : ({
        listo: 'EN RESERVA', autorizado: 'AUTORIZADO',
        perdido: 'PERDIDO', dormido: 'DORMIDO',
      }[m.estado] || m.estado.toUpperCase());

      fila.innerHTML = `
        <div class="pm-punto ${m.esActivo ? 'on' : ''}"></div>
        <div class="pm-info">
          <div class="pm-linea1">
            <b>${m.nombre}</b>
            <span class="pm-estado">${estado}</span>
          </div>
          <div class="pm-linea2">
            <span class="pm-pips">${pips}</span>
            <span style="color:${color}">${etiqueta}${m.cargando ? ' ⚡' : ''}</span>
            ${m.autonomia !== null ? `<span class="pm-tenue">quedan ~${m.autonomia} h</span>` : ''}
            ${m.hz ? `<span class="pm-tenue">${m.hz} Hz</span>` : ''}
          </div>
        </div>
        <div class="pm-botones"></div>`;

      const botones = fila.querySelector('.pm-botones');
      // Asignar a un jugador se hace arriba, en las tarjetas: un solo sitio.
      botones.appendChild(this._boton('Probar', () => this._probar(m.id)));
      if (m.estado !== 'autorizado') {
        botones.appendChild(this._boton('Soltar', () => this.gestor.soltar(m.id)));
      }
      this.lista.appendChild(fila);
    }
  }

  _boton(texto, fn, clase = '') {
    const b = document.createElement('button');
    b.className = 'pm-accion ' + clase;
    b.textContent = texto;
    b.addEventListener('click', fn);
    return b;
  }

  async _sincronizar() {
    try {
      // En pantalla completa la ventana de permisos de Chrome puede no verse:
      // se sale antes de pedirla (sin esperar, para no perder el clic).
      if (document.fullscreenElement) {
        if (this.motor.salirDePantallaCompleta) this.motor.salirDePantallaCompleta();   // sin abrir la pausa
        else if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
      const id = await this.gestor.autorizar();
      if (id) {
        this.zonaPrueba.innerHTML = '<div class="pm-ok">Mando autorizado. Ya puedes ponerlo en juego.</div>';
        this._pintarLista();
      }
    } catch (e) {
      this.zonaPrueba.innerHTML = '<div class="pm-mal">No se pudo abrir el selector: ' + e.message + '</div>';
    }
  }

  async _probar(id) {
    this.zonaPrueba.innerHTML = '<div class="pm-probando">Escuchando 3 segundos… mueve el mando y pulsa botones.</div>';
    const r = await this.gestor.probar(id);
    this._ultimaPrueba = r;
    const clase = r.ok ? 'pm-ok' : 'pm-mal';
    const detalles = [];
    if (r.hz !== undefined) detalles.push(r.hz + ' Hz');
    if (r.latencia) detalles.push(r.latencia + ' ms');
    if (r.imuVivo !== undefined) detalles.push('giroscopio ' + (r.imuVivo ? 'activo' : 'APAGADO'));
    if (r.botonesResponden !== undefined) {
      detalles.push('botones ' + (r.botonesResponden ? 'ok' : 'sin pulsar'));
    }
    if (r.movimientoDetectado === false && r.imuVivo) detalles.push('no lo moviste');
    this.zonaPrueba.innerHTML =
      `<div class="${clase}"><b>${r.veredicto}</b>` +
      (detalles.length ? `<span class="pm-tenue"> · ${detalles.join(' · ')}</span>` : '') +
      `</div>`;
  }

  // ------------------------------------------------- diagnóstico en vivo
  _pintarDiagnostico() {
    if (!this.abierto) return;
    const conectados = this.gestor.jugadores
      .map((j, i) => ({ j, i }))
      .filter(({ j }) => j.estado.conectado);
    if (!conectados.length) {
      this.zonaDiag.innerHTML = '<div class="pm-tenue">Sin mando en juego: nada que diagnosticar.</div>';
      return;
    }

    const barra = (v, max, color) => {
      const f = Math.max(-1, Math.min(1, v / max));
      const w = Math.abs(f) * 50;
      const izq = f >= 0 ? 50 : 50 - w;
      return `<u><s style="left:${izq}%;width:${w}%;background:${color}"></s></u>`;
    };

    this.zonaDiag.innerHTML = conectados.map(({ j, i }) => {
      const s = j.estado;
      const lista = j.esIzquierdo ? BOTONES_L : BOTONES_R;
      const chips = lista.map(([n, bit]) =>
        `<i class="${(s.mascara & (1 << bit)) !== 0 ? 'on' : ''}">${n}</i>`).join('');
      return `
        <div class="pm-sub">EN VIVO · JUGADOR ${i + 1} · ${j.esIzquierdo ? 'Joy-Con L' : 'Joy-Con R'} · ${s.hz} Hz</div>
        <div class="pm-chips">${chips}</div>
        <div class="pm-ejes">
          <span>giro X</span>${barra(s.giroX, 400, '#5aa9e6')}
          <span>giro Y</span>${barra(s.giroY, 400, '#5aa9e6')}
          <span>giro Z</span>${barra(s.giroZ, 400, '#5aa9e6')}
        </div>`;
    }).join('<div style="height:12px"></div>');
  }

  // ------------------------------------------------------------- avisos
  /**
   * Suelta los avisos acumulados, pero **nunca durante una partida**.
   *
   * Mientras el visitante está en el mapa la banda se calla; reaparece al
   * volver a una pantalla donde interrumpir no cuesta nada.
   */
  _revisarAvisos() {
    if (this.motor.nombreEscena === 'mapa' && !this.abierto) return;
    const avisos = this.gestor.consumirAvisos();
    if (!avisos.length) return;
    const grave = avisos.some((a) => a.gravedad === 'grave');
    this.banda.textContent = avisos[avisos.length - 1].texto;
    this.banda.className = 'banda ' + (grave ? 'grave' : 'aviso');
    clearTimeout(this._ocultarBanda);
    this._ocultarBanda = setTimeout(() => { this.banda.className = 'banda oculto'; }, 9000);
  }

  /** Llamar desde el bucle: al salir del mapa se vacía la cola pendiente. */
  alCambiarEscena() {
    if (this.gestor.avisosPendientes.length) this._revisarAvisos();
  }
}

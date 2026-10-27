// Taulell projectat (el que veuen els alumnes).
import { createStore } from './store.js';
import { normalize } from './state.js';
import { TYPES } from './modules.js';
import { h } from './dom.js';
import { actius, renderOverlay } from './programats.js';
import { foraHorari } from './horari.js';

const preview = new URLSearchParams(location.search).has('preview');
const zona = document.getElementById('zona');
const missatge = document.getElementById('missatge');
let cleanups = [];
let current = null;

function render(state) {
  current = state;
  missatge.hidden = true;
  cleanups.forEach((f) => f());
  cleanups = [];
  const s = state.settings;
  document.body.dataset.theme = s.theme;
  aplicaNegre();

  const lliure = s.disposicio === 'lliure';
  document.body.classList.toggle('lliure', lliure);
  if (lliure) {
    // Disposició lliure: els mòduls es poden posar a qualsevol lloc de la imatge projectada.
    Object.assign(zona.style, { width: '100%', left: '0', top: '0', bottom: '0', paddingInline: '0' });
  } else {
    const amp = Math.min(100, Math.max(10, s.amplada));
    zona.style.width = `${amp}%`;
    zona.style.left = s.alineacio === 'esquerra' ? '0' : s.alineacio === 'dreta' ? `${100 - amp}%` : `${(100 - amp) / 2}%`;
    zona.style.top = `${s.margeDalt}%`;
    zona.style.bottom = `${s.margeBaix}%`;
    zona.style.paddingInline = `${s.margeLateral}vw`;
  }

  const moduls = h('div', { class: 'moduls' + (lliure ? ' lliure' : ''), style: `--cols:${s.columnes}` });
  let n = 0;
  for (const mod of state.modules) {
    const type = TYPES[mod.type];
    if (!mod.visible || !type) continue;
    const sec = h('section', { class: `mod mod-${mod.type}`, dataset: { id: mod.id } });
    if (mod.title.trim()) sec.append(h('h2', {}, mod.title));
    const cleanup = type.render(mod, sec);
    if (typeof cleanup === 'function') cleanups.push(cleanup);
    if (lliure) {
      // Un mòdul nou encara sense posició apareix en cascada a dalt a l'esquerra.
      mod.layout ||= { x: 2 + 4 * n, y: 2 + 6 * n, w: 40, h: 30 };
      placeAt(sec, mod.layout);
      if (preview) makeDraggable(sec, mod, moduls);
      moduls.append(sec);
    } else if (sec.childElementCount) {
      moduls.append(sec);
    }
    n++;
  }
  zona.replaceChildren(...[s.titol.trim() && h('header', { class: 'titol' }, s.titol), moduls].filter(Boolean));
  fit();
  updateProgramats();
}

// ---------- Avisos programats ----------

const capaProgramats = document.getElementById('programats');
let provaFins = 0; // a la vista prèvia, "Provar" mostra un avís uns segons
let prova = null;

function updateProgramats() {
  if (!current) return;
  const llista = actius(current.programats);
  if (prova && Date.now() < provaFins) llista.push(prova);
  renderOverlay(capaProgramats, estaEnNegre() ? [] : llista);
}

// Pantalla en negre: manual (botó del panell) o automàtica fora de l'horari de projecció.
// La vista prèvia del panell no segueix l'horari, perquè la mestra pugui editar a qualsevol hora.
function estaEnNegre() {
  return current.settings.negre || (!preview && foraHorari(current.settings.horari));
}

function aplicaNegre() {
  document.body.classList.toggle('negre', estaEnNegre());
}

setInterval(() => {
  if (!current) return;
  aplicaNegre();
  updateProgramats();
}, 10e3);

function placeAt(sec, l) {
  Object.assign(sec.style, { left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%`, height: `${l.h}%` });
}

// Ajusta la mida de la lletra perquè tot hi càpiga sense haver de fer scroll.
// En disposició lliure, cada mòdul s'ajusta dins la seva pròpia caixa.
function fit() {
  if (!current) return;
  const base = current.settings.escala;
  zona.style.fontSize = `calc(${base} * 2.6vh)`;
  if (current.settings.disposicio === 'lliure') {
    zona.querySelectorAll('.moduls.lliure > .mod').forEach(fitBox);
    return;
  }
  let k = 1;
  while (zona.scrollHeight > zona.clientHeight + 1 && k > 0.4) {
    k -= 0.05;
    zona.style.fontSize = `calc(${base * k} * 2.6vh)`;
  }
}

function fitBox(sec) {
  let k = 1;
  sec.style.fontSize = '1em';
  while (sec.scrollHeight > sec.clientHeight + 1 && k > 0.3) {
    k -= 0.05;
    sec.style.fontSize = `${k}em`;
  }
}

// ---------- Edició de la posició (només a la vista prèvia del panell) ----------

const round = (v) => Math.round(v * 2) / 2; // passos de 0,5% per alinear fàcilment
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function makeDraggable(sec, mod, moduls) {
  sec.classList.add('editable');
  const handle = h('div', { class: 'redimensiona', title: 'Arrossega per canviar la mida' });
  sec.append(handle);
  sec.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const resize = e.target === handle;
    const box = moduls.getBoundingClientRect();
    const start = { ...mod.layout };
    const sx = e.clientX;
    const sy = e.clientY;
    sec.setPointerCapture(e.pointerId);
    sec.classList.add('arrossegant');
    const move = (ev) => {
      const dx = ((ev.clientX - sx) / box.width) * 100;
      const dy = ((ev.clientY - sy) / box.height) * 100;
      const l = mod.layout;
      if (resize) {
        l.w = clamp(round(start.w + dx), 8, 100 - l.x);
        l.h = clamp(round(start.h + dy), 5, 100 - l.y);
      } else {
        l.x = clamp(round(start.x + dx), 0, 100 - l.w);
        l.y = clamp(round(start.y + dy), 0, 100 - l.h);
      }
      placeAt(sec, l);
      if (resize) fitBox(sec);
    };
    const up = () => {
      sec.removeEventListener('pointermove', move);
      sec.classList.remove('arrossegant');
      parent.postMessage({ type: 'taulell-layout', id: mod.id, layout: { ...mod.layout } }, location.origin);
    };
    sec.addEventListener('pointermove', move);
    sec.addEventListener('pointerup', up, { once: true });
    sec.addEventListener('pointercancel', up, { once: true });
  });
}

// Mesura on queden els mòduls en disposició automàtica (en % de tota la pantalla),
// per passar a lliure sense que res es mogui.
function measureLayouts() {
  const out = {};
  zona.querySelectorAll('.moduls > .mod').forEach((sec) => {
    const r = sec.getBoundingClientRect();
    const w = round((r.width / innerWidth) * 100);
    const hh = clamp(round((r.height / innerHeight) * 100) + 1, 5, 100);
    out[sec.dataset.id] = {
      x: clamp(round((r.left / innerWidth) * 100), 0, 100 - w),
      y: clamp(round((r.top / innerHeight) * 100), 0, 100 - hh),
      w,
      h: hh,
    };
  });
  return out;
}

addEventListener('resize', fit);
document.fonts?.ready.then(fit);

function showMessage(...content) {
  zona.replaceChildren();
  missatge.replaceChildren(...content);
  missatge.hidden = false;
}

if (preview) {
  // Vista prèvia dins del panell de control: rep l'estat directament, sense esperar el núvol.
  addEventListener('message', (e) => {
    if (e.origin !== location.origin) return;
    if (e.data?.type === 'taulell-state') render(normalize(e.data.state));
    if (e.data?.type === 'taulell-prova') {
      prova = e.data.programat;
      provaFins = Date.now() + 5000;
      updateProgramats();
      setTimeout(updateProgramats, 5100);
    }
    if (e.data?.type === 'taulell-measure') parent.postMessage({ type: 'taulell-measured', layouts: measureLayouts() }, location.origin);
  });
  parent.postMessage({ type: 'taulell-preview-ready' }, location.origin);
} else {
  start();
}

async function start() {
  document.body.classList.add('projector');
  keepAwake();
  scheduleDailyReload();
  const offline = document.getElementById('offline');
  const updateOnline = () => { offline.hidden = navigator.onLine; };
  addEventListener('online', updateOnline);
  addEventListener('offline', updateOnline);
  updateOnline();

  let store;
  try {
    store = await createStore();
  } catch (err) {
    console.error(err);
    showMessage(h('p', {}, 'No s\'ha pogut connectar. Es tornarà a provar en 30 segons…'));
    setTimeout(() => location.reload(), 30000);
    return;
  }

  let unsub = null;
  store.onAuth((user) => {
    unsub?.();
    unsub = null;
    if (!user) {
      showMessage(
        h('p', {}, 'Cal iniciar sessió una sola vegada en aquest ordinador.'),
        h('button', { onclick: () => store.signIn().catch((e) => alert(e.message)) }, 'Inicia sessió amb Google'),
      );
      return;
    }
    unsub = store.subscribe(
      (state) => {
        if (state) render(normalize(state));
        else showMessage(h('p', {}, 'El taulell encara és buit. Obre el panell de control per començar.'));
      },
      (err) => {
        console.error(err);
        showMessage(
          h('p', {}, 'Aquest compte no té permís per veure el taulell.'),
          h('button', { onclick: () => store.signOut() }, 'Canviar de compte'),
        );
      },
    );
  });
}

async function keepAwake() {
  if (!('wakeLock' in navigator)) return;
  const req = () => navigator.wakeLock.request('screen').catch(() => {});
  await req();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') req(); });
}

// Recarrega la pàgina cada matinada per agafar actualitzacions de l'app.
function scheduleDailyReload() {
  const loadedAt = Date.now();
  setInterval(() => {
    const d = new Date();
    if (d.getHours() === 5 && Date.now() - loadedAt > 3600e3) location.reload();
  }, 60e3);
}

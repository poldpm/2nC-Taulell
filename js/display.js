// Taulell projectat (el que veuen els alumnes).
import { createStore } from './store.js';
import { normalize } from './state.js';
import { TYPES } from './modules.js';
import { h } from './dom.js';

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
  document.body.classList.toggle('negre', s.negre);

  const amp = Math.min(100, Math.max(10, s.amplada));
  zona.style.width = `${amp}%`;
  zona.style.left = s.alineacio === 'esquerra' ? '0' : s.alineacio === 'dreta' ? `${100 - amp}%` : `${(100 - amp) / 2}%`;
  zona.style.top = `${s.margeDalt}%`;
  zona.style.bottom = `${s.margeBaix}%`;
  zona.style.paddingInline = `${s.margeLateral}vw`;

  const moduls = h('div', { class: 'moduls', style: `--cols:${s.columnes}` });
  for (const mod of state.modules) {
    const type = TYPES[mod.type];
    if (!mod.visible || !type) continue;
    const sec = h('section', { class: `mod mod-${mod.type}` });
    if (mod.title.trim()) sec.append(h('h2', {}, mod.title));
    const cleanup = type.render(mod, sec);
    if (typeof cleanup === 'function') cleanups.push(cleanup);
    if (sec.childElementCount) moduls.append(sec);
  }
  zona.replaceChildren(...[s.titol.trim() && h('header', { class: 'titol' }, s.titol), moduls].filter(Boolean));
  fit();
}

// Ajusta la mida de la lletra perquè tot hi càpiga sense haver de fer scroll.
function fit() {
  if (!current) return;
  const base = current.settings.escala;
  let k = 1;
  zona.style.fontSize = `calc(${base} * 2.6vh)`;
  while (zona.scrollHeight > zona.clientHeight + 1 && k > 0.4) {
    k -= 0.05;
    zona.style.fontSize = `calc(${base * k} * 2.6vh)`;
  }
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
    if (e.origin === location.origin && e.data?.type === 'taulell-state') render(normalize(e.data.state));
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

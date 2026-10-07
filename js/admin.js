// Panell de control (ordinador de la mestra).
import { createStore } from './store.js';
import { defaultState, normalize } from './state.js';
import { TYPES, newModule } from './modules.js';
import { TAULELL_ID } from './config.js';
import { h } from './dom.js';

const $ = (id) => document.getElementById(id);
const HIST_KEY = `taulell-historial:${TAULELL_ID}`;

let store;
let state = null;
let lastJson = null; // últim estat desat / rebut del núvol
let saveTimer = null;
let pending = false;
let lastSnapshot = 0;

// ---------- Desar ----------

function setEstat(text, cls = '') {
  $('estat').textContent = text;
  $('estat').className = `estat ${cls}`;
}

// Cridada per qualsevol canvi. rerender=true quan canvia l'estructura (afegir, esborrar, moure...).
function change(rerender = false, focusKey = null) {
  pushPreview();
  if (rerender) renderAll(focusKey);
  pending = true;
  setEstat('Desant…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 500);
}

async function save() {
  const json = JSON.stringify(state);
  try {
    snapshot();
    await store.save(state);
    lastJson = json;
    if (JSON.stringify(state) === json) {
      pending = false;
      setEstat('Desat ✓', 'ok');
    }
  } catch (err) {
    console.error(err);
    setEstat(err.code === 'permission-denied' ? '⚠ Aquest compte no té permís per desar' : '⚠ No s\'ha pogut desar', 'error');
  }
}

// ---------- Historial local de versions ----------

function readHist() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY)) || []; } catch { return []; }
}

function snapshot() {
  if (!lastJson || Date.now() - lastSnapshot < 60e3) return;
  lastSnapshot = Date.now();
  const hist = readHist();
  hist.unshift({ t: Date.now(), json: lastJson });
  try { localStorage.setItem(HIST_KEY, JSON.stringify(hist.slice(0, 40))); } catch { /* ple */ }
  renderHist();
}

function renderHist() {
  const fmt = new Intl.DateTimeFormat('ca-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const hist = readHist();
  $('historial').replaceChildren(
    hist.length
      ? h('option', { value: '' }, 'Tria una versió anterior…')
      : h('option', { value: '' }, 'Encara no hi ha versions anteriors'),
    hist.map((v, i) => h('option', { value: i }, fmt.format(v.t))),
  );
}

// ---------- Vista prèvia ----------

function pushPreview() {
  $('preview').contentWindow?.postMessage({ type: 'taulell-state', state }, location.origin);
}
// La vista prèvia és un taulell de 1920×1080 reduït a l'amplada disponible.
new ResizeObserver(([entry]) => {
  entry.target.style.setProperty('--k', entry.contentRect.width / 1920);
}).observe(document.querySelector('.preview-wrap'));
addEventListener('message', (e) => {
  if (e.origin === location.origin && e.data?.type === 'taulell-preview-ready' && state) pushPreview();
});

// ---------- Renderitzat del panell ----------

function renderAll(focusKey = null) {
  renderModules();
  renderSettings();
  $('btn-negre').classList.toggle('actiu', state.settings.negre);
  $('btn-negre').textContent = state.settings.negre ? '▶ Tornar a projectar' : '⬛ Pantalla en negre';
  if (focusKey) document.querySelector(`[data-focus-key="${focusKey}"]`)?.focus();
}

function renderModules() {
  const ctx = { change };
  const mods = state.modules;
  $('moduls').replaceChildren(...mods.map((mod, i) => {
    const type = TYPES[mod.type];
    const move = (d) => {
      const j = i + d;
      [mods[i], mods[j]] = [mods[j], mods[i]];
      change(true);
    };
    return h('article', { class: 'modul' + (mod.visible ? '' : ' amagat') },
      h('header', {},
        h('span', { class: 'tipus', title: type.name }, type.icon),
        h('input', {
          class: 'titol-modul grow', value: mod.title, placeholder: `${type.name} (sense títol)`,
          oninput: (e) => { mod.title = e.target.value; change(); },
        }),
        h('button', {
          class: 'icon toggle' + (mod.visible ? ' on' : ''), title: mod.visible ? 'Es projecta. Clica per amagar-lo' : 'Amagat. Clica per mostrar-lo',
          onclick: () => { mod.visible = !mod.visible; change(true); },
        }, mod.visible ? '👁' : '🚫'),
        h('button', { class: 'icon', title: 'Pujar', disabled: i === 0, onclick: () => move(-1) }, '↑'),
        h('button', { class: 'icon', title: 'Baixar', disabled: i === mods.length - 1, onclick: () => move(1) }, '↓'),
        h('button', {
          class: 'icon perill', title: 'Esborrar mòdul',
          onclick: () => {
            if (!confirm(`Segur que vols esborrar el mòdul «${mod.title || type.name}»?`)) return;
            mods.splice(i, 1);
            change(true);
          },
        }, '🗑'),
      ),
      h('div', { class: 'cos' }, type.editor(mod, ctx)),
    );
  }));
}

const SETTINGS_FORM = [
  { key: 'titol', label: 'Títol a dalt de tot', type: 'text' },
  { key: 'theme', label: 'Tema', type: 'select', options: { fosc: 'Fosc (recomanat a la pissarra)', clar: 'Clar' } },
  { key: 'alineacio', label: 'Posició', type: 'select', options: { esquerra: 'A l\'esquerra', centre: 'Al centre', dreta: 'A la dreta' } },
  { key: 'amplada', label: 'Amplada', type: 'range', min: 15, max: 100, step: 1, unit: '%' },
  { key: 'margeDalt', label: 'Marge de dalt', type: 'range', min: 0, max: 40, step: 1, unit: '%' },
  { key: 'margeBaix', label: 'Marge de baix', type: 'range', min: 0, max: 40, step: 1, unit: '%' },
  { key: 'margeLateral', label: 'Marge lateral', type: 'range', min: 0, max: 15, step: 0.5, unit: '%' },
  { key: 'escala', label: 'Mida de la lletra', type: 'range', min: 0.5, max: 2.5, step: 0.05, unit: '×' },
  { key: 'columnes', label: 'Columnes', type: 'select', options: { 1: '1', 2: '2', 3: '3' }, number: true },
];

function renderSettings() {
  const s = state.settings;
  $('ajustos').replaceChildren(...SETTINGS_FORM.map((f) => {
    let input;
    if (f.type === 'select') {
      input = h('select', { onchange: (e) => { s[f.key] = f.number ? Number(e.target.value) : e.target.value; change(); } },
        Object.entries(f.options).map(([v, l]) => h('option', { value: v, selected: String(s[f.key]) === v }, l)));
    } else if (f.type === 'range') {
      const out = h('output', {}, `${s[f.key]}${f.unit}`);
      input = h('span', { class: 'range' },
        h('input', {
          type: 'range', min: f.min, max: f.max, step: f.step, value: s[f.key],
          oninput: (e) => { s[f.key] = Number(e.target.value); out.textContent = `${s[f.key]}${f.unit}`; change(); },
        }),
        out);
    } else {
      input = h('input', { value: s[f.key], oninput: (e) => { s[f.key] = e.target.value; change(); } });
    }
    return h('label', { class: 'camp' }, h('span', {}, f.label), input);
  }));
}

// ---------- Inici ----------

function setupStaticUi() {
  $('nou-tipus').replaceChildren(...Object.entries(TYPES).map(([k, t]) => h('option', { value: k }, `${t.icon} ${t.name}`)));
  $('btn-afegir').onclick = () => {
    state.modules.push(newModule($('nou-tipus').value));
    change(true);
    $('moduls').lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  };
  $('btn-negre').onclick = () => { state.settings.negre = !state.settings.negre; change(true); };
  $('btn-login').onclick = () => store.signIn().catch((e) => alert(e.message));

  $('btn-restaurar').onclick = () => {
    const i = $('historial').value;
    if (i === '') return;
    const v = readHist()[i];
    if (!v || !confirm('Segur que vols tornar a aquesta versió? (La versió actual també quedarà guardada a l\'historial.)')) return;
    lastSnapshot = 0;
    state = normalize(JSON.parse(v.json));
    change(true);
  };
  $('btn-exportar').onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `taulell-${TAULELL_ID}-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(a.href);
  };
  $('fitxer').onchange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const imported = normalize(JSON.parse(await file.text()));
      if (!confirm('Això substituirà el contingut actual del taulell. Continuar?')) return;
      lastSnapshot = 0;
      state = imported;
      change(true);
    } catch {
      alert('Aquest fitxer no és una còpia vàlida del taulell.');
    }
  };
  renderHist();
}

async function main() {
  try {
    store = await createStore();
  } catch (err) {
    console.error(err);
    setEstat('⚠ No s\'ha pogut connectar amb el núvol', 'error');
    return;
  }
  setupStaticUi();
  $('avis-mode').hidden = store.mode !== 'local';

  let unsub = null;
  store.onAuth((user) => {
    unsub?.();
    unsub = null;
    $('login').hidden = !!user;
    $('app').hidden = !user;
    $('usuari').replaceChildren(...(user && store.mode === 'cloud'
      ? [h('span', {}, user.name), h('button', { class: 'btn petit', onclick: () => store.signOut() }, 'Sortir')]
      : []));
    if (!user) return;

    setEstat('Carregant…');
    unsub = store.subscribe(
      (incoming) => {
        if (!incoming) {
          // Primer cop: es crea un taulell d'exemple.
          state = defaultState();
          renderAll();
          change();
          return;
        }
        const json = JSON.stringify(normalize(incoming));
        if (pending || json === lastJson) return; // ignorem el "ressò" dels nostres propis canvis
        lastJson = json;
        state = JSON.parse(json);
        renderAll();
        pushPreview();
        setEstat('Desat ✓', 'ok');
      },
      (err) => {
        console.error(err);
        setEstat('⚠ Aquest compte no té permís. Prova amb un altre compte.', 'error');
      },
    );
  });
}

main();

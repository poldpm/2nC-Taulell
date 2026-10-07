// Mòduls del taulell. Cada tipus defineix:
//   name, icon      → com es mostra al panell de control
//   create()        → valors per defecte d'un mòdul nou
//   render(mod, el) → com es pinta al taulell projectat (pot retornar una funció de neteja)
//   editor(mod, ctx)→ formulari d'edició al panell de control
// Per afegir un mòdul nou n'hi ha prou amb afegir una entrada a TYPES.
import { h, uid } from './dom.js';

export const COLORS = {
  blau: { hex: '#4da3ff', label: '🔵 Blau' },
  verd: { hex: '#4cd27a', label: '🟢 Verd' },
  groc: { hex: '#ffd23f', label: '🟡 Groc' },
  taronja: { hex: '#ff9f43', label: '🟠 Taronja' },
  vermell: { hex: '#ff5c5c', label: '🔴 Vermell' },
  lila: { hex: '#b07cff', label: '🟣 Lila' },
  rosa: { hex: '#ff7eb6', label: '💗 Rosa' },
  gris: { hex: '#a0a8b8', label: '⚪ Gris' },
};
export const colorHex = (c) => (COLORS[c] || COLORS.blau).hex;

const EMOJIS = [
  '📖', '📚', '✏️', '📝', '🖍️', '🎨', '✂️', '🧩', '🔢', '🧮', '➕', '🔤',
  '🗂️', '📒', '💻', '🎧', '🌱', '🔬', '🗺️', '🎵', '🧹', '🗑️', '💧', '🪴',
  '🚪', '💡', '📣', '⭐', '❤️', '✅', '⏰', '🍎', '🏃', '🤫', '🙋', '👀',
];

const DIES = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];
const MESOS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
const deMes = (m) => (/^[aeiou]/.test(MESOS[m]) ? "d'" : 'de ') + MESOS[m];

export const TYPES = {
  rellotge: {
    name: 'Data i hora',
    icon: '🕒',
    create: () => ({ title: '', data: { hora: true, data: true } }),
    render(mod, el) {
      const hora = h('div', { class: 'hora' });
      const data = h('div', { class: 'data' });
      const tick = () => {
        const d = new Date();
        hora.textContent = d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
        const txt = `${DIES[d.getDay()]}, ${d.getDate()} ${deMes(d.getMonth())}`;
        data.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
      };
      tick();
      if (mod.data.hora) el.append(hora);
      if (mod.data.data) el.append(data);
      const t = setInterval(tick, 5000);
      return () => clearInterval(t);
    },
    editor(mod, ctx) {
      return h('div', { class: 'row' },
        checkbox('Mostrar l\'hora', mod.data.hora, (v) => { mod.data.hora = v; ctx.change(); }),
        checkbox('Mostrar la data', mod.data.data, (v) => { mod.data.data = v; ctx.change(); }),
      );
    },
  },

  avis: {
    name: 'Avís destacat',
    icon: '📣',
    create: () => ({ title: '', data: { emoji: '📣', text: '', color: 'groc' } }),
    render(mod, el) {
      if (!mod.data.text.trim()) return;
      el.append(h('div', { class: 'avis', style: `--c:${colorHex(mod.data.color)}` },
        mod.data.emoji && h('span', { class: 'emoji' }, mod.data.emoji),
        h('span', { class: 'txt' }, mod.data.text),
      ));
    },
    editor(mod, ctx) {
      return h('div', { class: 'stack' },
        h('div', { class: 'row' },
          emojiButton(mod.data.emoji, (e) => { mod.data.emoji = e; ctx.change(true); }),
          colorSelect(mod.data.color, (c) => { mod.data.color = c; ctx.change(); }),
        ),
        h('textarea', {
          rows: 2, value: mod.data.text, placeholder: 'Ex.: Avui tenim excursió! Porteu la gorra 🧢',
          oninput: (e) => { mod.data.text = e.target.value; ctx.change(); },
        }),
      );
    },
  },

  tasques: {
    name: 'Tasques ("Quan acabis...")',
    icon: '✅',
    create: () => ({ title: 'Quan acabis, pots fer...', data: { numerades: true, items: [] } }),
    render(mod, el) {
      const items = mod.data.items.filter((i) => i.visible && i.text.trim());
      if (!items.length) {
        el.append(h('p', { class: 'buit' }, 'Cap tasca pendent 🎉'));
        return;
      }
      el.append(h('ol', { class: 'tasques' + (mod.data.numerades ? ' numerades' : '') },
        items.map((i) => h('li', {
          class: 'tasca' + (i.destacada ? ' destacada' : ''),
          style: `--c:${colorHex(i.color)}`,
        },
        h('span', { class: 'emoji' }, i.emoji || '•'),
        h('span', { class: 'txt' }, i.text),
        i.destacada && h('span', { class: 'estrella' }, '⭐'),
        )),
      ));
    },
    editor(mod, ctx) {
      const d = mod.data;
      const nouKey = `${mod.id}-nou`;
      const nou = h('input', {
        class: 'grow', placeholder: '+ Nova tasca… (escriu i prem Enter)', dataset: { focusKey: nouKey },
        onkeydown: (e) => {
          if (e.key !== 'Enter' || !nou.value.trim()) return;
          d.items.push(newTask(nou.value.trim()));
          ctx.change(true, nouKey);
        },
      });
      return h('div', { class: 'stack' },
        checkbox('Numerar-les (ordre recomanat)', d.numerades, (v) => { d.numerades = v; ctx.change(); }),
        h('div', { class: 'items' }, d.items.map((it, i) => h('div', { class: 'item' + (it.visible ? '' : ' amagat') },
          emojiButton(it.emoji, (e) => { it.emoji = e; ctx.change(true); }),
          h('input', { class: 'grow', value: it.text, placeholder: 'Escriu la tasca…', oninput: (e) => { it.text = e.target.value; ctx.change(); } }),
          colorSelect(it.color, (c) => { it.color = c; ctx.change(); }),
          toggle('⭐', it.destacada, 'Destacar', (v) => { it.destacada = v; ctx.change(true); }),
          toggle('👁', it.visible, 'Visible al taulell (si l\'apagues, queda guardada però no es projecta)', (v) => { it.visible = v; ctx.change(true); }),
          rowControls(d.items, i, ctx, it.text),
        ))),
        h('div', { class: 'row' }, nou),
      );
    },
  },

  encarregats: {
    name: 'Encarregats',
    icon: '🧑‍🤝‍🧑',
    create: () => ({
      title: 'Encarregats',
      data: {
        items: [
          { id: uid(), emoji: '🧹', rol: 'Ordre', nom: '' },
          { id: uid(), emoji: '💡', rol: 'Llums', nom: '' },
          { id: uid(), emoji: '🪴', rol: 'Plantes', nom: '' },
        ],
      },
    }),
    render(mod, el) {
      const items = mod.data.items.filter((i) => i.rol.trim() || i.nom.trim());
      el.append(h('ul', { class: 'encarregats' }, items.map((i) => h('li', {},
        h('span', { class: 'emoji' }, i.emoji),
        h('span', { class: 'rol' }, i.rol),
        h('span', { class: 'nom' }, i.nom || '—'),
      ))));
    },
    editor(mod, ctx) {
      const d = mod.data;
      return h('div', { class: 'stack' },
        h('div', { class: 'items' }, d.items.map((it, i) => h('div', { class: 'item' },
          emojiButton(it.emoji, (e) => { it.emoji = e; ctx.change(true); }),
          h('input', { value: it.rol, placeholder: 'Feina', oninput: (e) => { it.rol = e.target.value; ctx.change(); } }),
          h('input', { class: 'grow', value: it.nom, placeholder: 'Nom de l\'alumne/a', oninput: (e) => { it.nom = e.target.value; ctx.change(); } }),
          rowControls(d.items, i, ctx, it.rol),
        ))),
        h('button', { class: 'btn', onclick: () => { d.items.push({ id: uid(), emoji: '⭐', rol: '', nom: '' }); ctx.change(true); } }, '+ Afegir encàrrec'),
      );
    },
  },

  text: {
    name: 'Text lliure',
    icon: '📝',
    create: () => ({ title: 'Recorda', data: { text: '' } }),
    render(mod, el) {
      if (mod.data.text.trim()) el.append(h('p', { class: 'text-lliure' }, mod.data.text));
    },
    editor(mod, ctx) {
      return h('textarea', {
        rows: 3, value: mod.data.text, placeholder: 'Escriu el que vulguis que vegin els alumnes…',
        oninput: (e) => { mod.data.text = e.target.value; ctx.change(); },
      });
    },
  },
};

export function newTask(text) {
  return { id: uid(), emoji: '📝', text, color: 'blau', destacada: false, visible: true };
}

export function newModule(type) {
  const base = TYPES[type].create();
  return { id: uid(), type, visible: true, title: base.title, data: base.data };
}

// ---- Petits components per als editors ----

function checkbox(label, checked, onChange) {
  return h('label', { class: 'check' },
    h('input', { type: 'checkbox', checked, onchange: (e) => onChange(e.target.checked) }),
    label,
  );
}

function toggle(icon, on, title, onChange) {
  return h('button', {
    class: 'icon toggle' + (on ? ' on' : ''), title, ariaPressed: String(on),
    onclick: () => onChange(!on),
  }, icon);
}

function colorSelect(value, onChange) {
  return h('select', { title: 'Color', onchange: (e) => onChange(e.target.value) },
    Object.entries(COLORS).map(([k, c]) => h('option', { value: k, selected: k === value }, c.label)),
  );
}

function rowControls(arr, i, ctx, text) {
  const move = (d) => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    ctx.change(true);
  };
  return h('span', { class: 'controls' },
    h('button', { class: 'icon', title: 'Pujar', disabled: i === 0, onclick: () => move(-1) }, '↑'),
    h('button', { class: 'icon', title: 'Baixar', disabled: i === arr.length - 1, onclick: () => move(1) }, '↓'),
    h('button', {
      class: 'icon perill', title: 'Esborrar',
      onclick: () => {
        if (text && text.trim() && !confirm(`Segur que vols esborrar «${text}»?`)) return;
        arr.splice(i, 1);
        ctx.change(true);
      },
    }, '🗑'),
  );
}

function emojiButton(value, onPick) {
  const wrap = h('span', { class: 'emoji-pick' });
  const btn = h('button', { class: 'icon emoji-btn', title: 'Canviar icona' }, value || '•');
  const pop = h('div', { class: 'emoji-pop', hidden: true },
    h('div', { class: 'emoji-grid' }, EMOJIS.map((e) => h('button', { class: 'icon', onclick: () => onPick(e) }, e))),
    h('input', {
      placeholder: 'O enganxa\'n un altre i prem Enter', maxLength: 8,
      onkeydown: (e) => { if (e.key === 'Enter' && e.target.value.trim()) onPick(e.target.value.trim()); },
    }),
  );
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = pop.hidden;
    document.querySelectorAll('.emoji-pop').forEach((p) => { p.hidden = true; });
    pop.hidden = !open;
  });
  pop.addEventListener('click', (e) => e.stopPropagation());
  wrap.append(btn, pop);
  return wrap;
}
document.addEventListener('click', () => document.querySelectorAll('.emoji-pop').forEach((p) => { p.hidden = true; }));

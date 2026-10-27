// Avisos programats: missatges que apareixen en gran a sobre del taulell un dia i hora concrets
// (p. ex. cada dimarts a les 15:55 «ALANA CAP A PORTERIA!») i desapareixen sols.
import { h, uid } from './dom.js';
import { COLORS, colorHex } from './modules.js';

// Ordre de la setmana començant per dilluns; el valor és el de Date.getDay() (0 = diumenge).
const DIES = [[1, 'Dl'], [2, 'Dt'], [3, 'Dc'], [4, 'Dj'], [5, 'Dv'], [6, 'Ds'], [0, 'Dg']];

export function newProgramat() {
  return { id: uid(), actiu: true, emoji: '🔔', text: '', color: 'vermell', repeticio: 'setmanal', dies: [], data: '', hora: '09:00', durada: 10 };
}

export function normalizeProgramats(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((p) => p && typeof p === 'object').map((p) => {
    const d = { ...newProgramat(), ...p };
    d.dies = Array.isArray(d.dies) ? d.dies.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6) : [];
    d.durada = Math.min(240, Math.max(1, Number(d.durada) || 10));
    if (!/^\d{2}:\d{2}$/.test(d.hora)) d.hora = '09:00';
    return d;
  });
}

const minuts = (hhmm) => { const [hh, mm] = hhmm.split(':').map(Number); return hh * 60 + mm; };
const dataLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Avisos que s'han de veure ara mateix.
export function actius(list, now = new Date()) {
  const ara = now.getHours() * 60 + now.getMinutes();
  return list.filter((p) => {
    if (!p.actiu || !p.text.trim()) return false;
    const dia = p.repeticio === 'data' ? p.data === dataLocal(now) : p.dies.includes(now.getDay());
    const inici = minuts(p.hora);
    return dia && ara >= inici && ara < inici + p.durada;
  });
}

// Capa a sobre del taulell amb els avisos actius.
export function renderOverlay(el, list) {
  el.replaceChildren(...list.map((p) => h('div', { class: 'programat', style: `--c:${colorHex(p.color)}` },
    p.emoji && h('span', { class: 'emoji' }, p.emoji),
    h('span', { class: 'txt' }, p.text),
  )));
  el.hidden = !list.length;
}

// Editor al panell de control.
export function editor(list, ctx, onTest) {
  return h('div', { class: 'stack' },
    list.length ? null : h('p', { class: 'ajuda' }, 'Encara no n\'hi ha cap. Per exemple: cada dimarts a les 15:55, «ALANA CAP A PORTERIA!».'),
    list.map((p, i) => h('div', { class: 'programat-editor' + (p.actiu ? '' : ' amagat') },
      h('div', { class: 'row' },
        emojiInput(p, ctx),
        h('input', { class: 'grow', value: p.text, placeholder: 'Missatge (p. ex. ALANA CAP A PORTERIA!)', oninput: (e) => { p.text = e.target.value; ctx.change(); } }),
        h('select', { title: 'Color', onchange: (e) => { p.color = e.target.value; ctx.change(); } },
          Object.entries(COLORS).map(([k, c]) => h('option', { value: k, selected: k === p.color }, c.label))),
      ),
      h('div', { class: 'row' },
        h('select', { onchange: (e) => { p.repeticio = e.target.value; ctx.change(true); } },
          h('option', { value: 'setmanal', selected: p.repeticio === 'setmanal' }, 'Cada setmana'),
          h('option', { value: 'data', selected: p.repeticio === 'data' }, 'Un sol dia')),
        p.repeticio === 'data'
          ? h('input', { type: 'date', value: p.data, onchange: (e) => { p.data = e.target.value; ctx.change(); } })
          : h('span', { class: 'dies' }, DIES.map(([v, nom]) => h('button', {
            class: 'dia-btn' + (p.dies.includes(v) ? ' on' : ''),
            onclick: () => { p.dies = p.dies.includes(v) ? p.dies.filter((x) => x !== v) : [...p.dies, v]; ctx.change(true); },
          }, nom))),
        h('label', { class: 'check' }, 'a les',
          h('input', { type: 'time', value: p.hora, onchange: (e) => { if (e.target.value) { p.hora = e.target.value; ctx.change(); } } })),
        h('label', { class: 'check' }, 'durant',
          h('input', { type: 'number', class: 'num', min: 1, max: 240, value: p.durada, onchange: (e) => { p.durada = Math.min(240, Math.max(1, Number(e.target.value) || 10)); ctx.change(true); } }),
          'min'),
      ),
      h('div', { class: 'row' },
        h('button', { class: 'btn petit', onclick: () => onTest(p) }, '▶ Provar a la vista prèvia'),
        h('button', { class: 'btn petit', onclick: () => { p.actiu = !p.actiu; ctx.change(true); } }, p.actiu ? '⏸ Pausar' : '▶ Activar'),
        h('button', {
          class: 'btn petit perill', onclick: () => {
            if (p.text.trim() && !confirm(`Segur que vols esborrar l'avís «${p.text}»?`)) return;
            list.splice(i, 1);
            ctx.change(true);
          },
        }, '🗑 Esborrar'),
      ),
    )),
    h('button', { class: 'btn', onclick: () => { list.push(newProgramat()); ctx.change(true); } }, '+ Nou avís programat'),
  );
}

function emojiInput(p, ctx) {
  return h('input', {
    class: 'emoji-input', value: p.emoji, maxLength: 8, title: 'Icona (pots enganxar-hi un emoji)',
    oninput: (e) => { p.emoji = e.target.value; ctx.change(); },
  });
}

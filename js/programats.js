// Avisos programats: missatges que apareixen en gran a sobre del taulell un dia i hora concrets
// (p. ex. cada dimarts a les 15:55 «ALANA CAP A PORTERIA!») i desapareixen sols.
import { h, uid, horaSelect } from './dom.js';
import { COLORS, colorHex } from './modules.js';
import { foraHorari } from './horari.js';

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

// Pròxima vegada que sonarà un avís: { ara: true, fi } si sona ara mateix, { inici } si sonarà més endavant,
// o { motiu } si no sonarà mai.
export function proxima(p, now = new Date()) {
  if (!p.actiu) return { motiu: 'Pausat: no sonarà fins que l\'activis.' };
  if (!p.text.trim()) return { motiu: 'No sonarà: falta escriure el missatge.' };
  const [hh, mm] = p.hora.split(':').map(Number);
  const a = (d) => { const x = new Date(d); x.setHours(hh, mm, 0, 0); return x; };
  const candidats = [];
  if (p.repeticio === 'data') {
    if (!p.data) return { motiu: 'No sonarà: falta triar el dia.' };
    const [y, m, d] = p.data.split('-').map(Number);
    candidats.push(a(new Date(y, m - 1, d)));
  } else {
    if (!p.dies.length) return { motiu: 'No sonarà: tria almenys un dia de la setmana.' };
    for (let i = -1; i <= 7; i++) {
      const d = new Date(now); d.setDate(d.getDate() + i);
      if (p.dies.includes(d.getDay())) candidats.push(a(d));
    }
  }
  for (const inici of candidats) {
    const fi = new Date(inici.getTime() + p.durada * 60e3);
    if (now >= inici && now < fi) return { ara: true, inici, fi };
    if (inici > now) return { inici };
  }
  return { motiu: 'Ja ha passat: no tornarà a sonar.' };
}

function durada(ms) {
  let min = Math.ceil(ms / 60e3);
  if (min < 1) return 'menys d\'un minut';
  const dies = Math.floor(min / 1440); min -= dies * 1440;
  const hores = Math.floor(min / 60); min -= hores * 60;
  const parts = [];
  if (dies) parts.push(`${dies} ${dies === 1 ? 'dia' : 'dies'}`);
  if (hores) parts.push(`${hores} ${hores === 1 ? 'hora' : 'hores'}`);
  if (min) parts.push(`${min} ${min === 1 ? 'minut' : 'minuts'}`);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} i ${parts.at(-1)}` : parts[0];
}

const fmtQuan = new Intl.DateTimeFormat('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const hm = (d) => d.toTimeString().slice(0, 5);

// Text "Sonarà d'aquí..." per al panell. `settings` serveix per avisar si a aquella hora el taulell és en negre.
export function compte(p, settings, now = new Date()) {
  const r = proxima(p, now);
  if (r.motiu) return { text: r.motiu, cls: 'mai' };
  if (r.ara) return { text: `🔔 Està sonant ara (fins a les ${hm(r.fi)}).`, cls: 'ara' };
  let text = `⏳ Sonarà d'aquí ${durada(r.inici - now)} (${fmtQuan.format(r.inici)} a les ${p.hora}).`;
  if (settings?.negre) text += ' ⚠ Ara el taulell està en negre a mà: no es veurà si no el tornes a encendre.';
  else if (settings?.horari && foraHorari(settings.horari, r.inici)) text += ' ⚠ A aquella hora el taulell està en negre (fora de l\'horari de projecció) i no es veurà.';
  return { text, cls: 'futur' };
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
export function editor(list, ctx, onTest, onProjecta, settings) {
  // Després de cada canvi s'actualitza el text "Sonarà d'aquí..." sense redibuixar el formulari.
  const canvi = (p, el) => { ctx.change(); pintaCompte(el, p, settings); };
  return h('div', { class: 'stack' },
    list.length ? null : h('p', { class: 'ajuda' }, 'Encara no n\'hi ha cap. Per exemple: cada dimarts a les 15:55, «ALANA CAP A PORTERIA!».'),
    list.map((p, i) => { const compteEl = h('p', { class: 'compte', dataset: { programat: p.id } }); pintaCompte(compteEl, p, settings); return h('div', { class: 'programat-editor' + (p.actiu ? '' : ' amagat') },
      h('div', { class: 'row' },
        emojiInput(p, ctx),
        h('input', { class: 'grow', value: p.text, placeholder: 'Missatge (p. ex. ALANA CAP A PORTERIA!)', oninput: (e) => { p.text = e.target.value; canvi(p, compteEl); } }),
        h('select', { title: 'Color', onchange: (e) => { p.color = e.target.value; ctx.change(); } },
          Object.entries(COLORS).map(([k, c]) => h('option', { value: k, selected: k === p.color }, c.label))),
      ),
      h('div', { class: 'row' },
        h('select', { onchange: (e) => { p.repeticio = e.target.value; ctx.change(true); } },
          h('option', { value: 'setmanal', selected: p.repeticio === 'setmanal' }, 'Cada setmana'),
          h('option', { value: 'data', selected: p.repeticio === 'data' }, 'Un sol dia')),
        p.repeticio === 'data'
          ? h('input', { type: 'date', value: p.data, onchange: (e) => { p.data = e.target.value; canvi(p, compteEl); } })
          : h('span', { class: 'dies' }, DIES.map(([v, nom]) => h('button', {
            class: 'dia-btn' + (p.dies.includes(v) ? ' on' : ''),
            onclick: () => { p.dies = p.dies.includes(v) ? p.dies.filter((x) => x !== v) : [...p.dies, v]; ctx.change(true); },
          }, nom))),
        h('button', {
          class: 'btn petit' + (p.repeticio === 'data' && p.data === dataLocal(new Date()) ? ' actiu-avui' : ''),
          title: 'Que soni només avui',
          onclick: () => { p.repeticio = 'data'; p.data = dataLocal(new Date()); ctx.change(true); },
        }, '📅 Només avui'),
        h('label', { class: 'check' }, 'a les',
          horaSelect(p.hora, (v) => { p.hora = v; canvi(p, compteEl); })),
        h('label', { class: 'check' }, 'durant',
          h('input', { type: 'number', class: 'num', min: 1, max: 240, value: p.durada, onchange: (e) => { p.durada = Math.min(240, Math.max(1, Number(e.target.value) || 10)); ctx.change(true); } }),
          'min'),
      ),
      h('div', { class: 'row' },
        h('button', { class: 'btn petit', onclick: () => onTest(p) }, '▶ Provar a la vista prèvia'),
        h('button', { class: 'btn petit', title: 'Es veu al projector durant 30 segons', onclick: () => onProjecta(p) }, '📽️ Provar al projector'),
        h('button', { class: 'btn petit', onclick: () => { p.actiu = !p.actiu; ctx.change(true); } }, p.actiu ? '⏸ Pausar' : '▶ Activar'),
        h('button', {
          class: 'btn petit perill', onclick: () => {
            if (p.text.trim() && !confirm(`Segur que vols esborrar l'avís «${p.text}»?`)) return;
            list.splice(i, 1);
            ctx.change(true);
          },
        }, '🗑 Esborrar'),
      ),
      compteEl,
    ); }),
    h('button', { class: 'btn', onclick: () => { list.push(newProgramat()); ctx.change(true); } }, '+ Nou avís programat'),
  );
}

function pintaCompte(el, p, settings) {
  const c = compte(p, settings);
  el.textContent = c.text;
  el.className = `compte ${c.cls}`;
}

// Refresca tots els "Sonarà d'aquí..." visibles (el panell ho crida cada 30 segons).
export function actualitzaComptes(container, list, settings) {
  container.querySelectorAll('.compte[data-programat]').forEach((el) => {
    const p = list.find((x) => x.id === el.dataset.programat);
    if (p) pintaCompte(el, p, settings);
  });
}

function emojiInput(p, ctx) {
  return h('input', {
    class: 'emoji-input', value: p.emoji, maxLength: 8, title: 'Icona (pots enganxar-hi un emoji)',
    oninput: (e) => { p.emoji = e.target.value; ctx.change(); },
  });
}

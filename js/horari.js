// Horari de projecció: fora d'aquestes hores (i els dies no marcats) el taulell es posa en negre sol.
import { h } from './dom.js';

const DIES = [[1, 'Dl'], [2, 'Dt'], [3, 'Dc'], [4, 'Dj'], [5, 'Dv'], [6, 'Ds'], [0, 'Dg']];

export const DEFAULT_HORARI = { actiu: true, dies: [1, 2, 3, 4, 5], inici: '08:30', fi: '16:45' };

export function normalizeHorari(raw) {
  const o = { ...DEFAULT_HORARI, ...(raw && typeof raw === 'object' ? raw : {}) };
  o.actiu = o.actiu !== false;
  o.dies = Array.isArray(o.dies) ? o.dies.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6) : [...DEFAULT_HORARI.dies];
  if (!/^\d{2}:\d{2}$/.test(o.inici)) o.inici = DEFAULT_HORARI.inici;
  if (!/^\d{2}:\d{2}$/.test(o.fi)) o.fi = DEFAULT_HORARI.fi;
  return o;
}

const minuts = (hhmm) => { const [hh, mm] = hhmm.split(':').map(Number); return hh * 60 + mm; };

export function foraHorari(horari, now = new Date()) {
  if (!horari.actiu) return false;
  const ara = now.getHours() * 60 + now.getMinutes();
  return !horari.dies.includes(now.getDay()) || ara < minuts(horari.inici) || ara >= minuts(horari.fi);
}

export function editor(horari, ctx) {
  return h('div', { class: 'stack' },
    h('label', { class: 'check' },
      h('input', { type: 'checkbox', checked: horari.actiu, onchange: (e) => { horari.actiu = e.target.checked; ctx.change(true); } }),
      'Posar el taulell en negre automàticament fora d\'aquest horari'),
    h('div', { class: 'row' + (horari.actiu ? '' : ' desactivat') },
      h('span', { class: 'dies' }, DIES.map(([v, nom]) => h('button', {
        class: 'dia-btn' + (horari.dies.includes(v) ? ' on' : ''),
        onclick: () => { horari.dies = horari.dies.includes(v) ? horari.dies.filter((x) => x !== v) : [...horari.dies, v]; ctx.change(true); },
      }, nom))),
      h('label', { class: 'check' }, 'de',
        h('input', { type: 'time', value: horari.inici, onchange: (e) => { if (e.target.value) { horari.inici = e.target.value; ctx.change(true); } } })),
      h('label', { class: 'check' }, 'a',
        h('input', { type: 'time', value: horari.fi, onchange: (e) => { if (e.target.value) { horari.fi = e.target.value; ctx.change(true); } } })),
    ),
  );
}

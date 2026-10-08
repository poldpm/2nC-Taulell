// Estat del taulell: valors per defecte i normalització (per tolerar dades antigues o incompletes).
import { TYPES, newModule, newTask } from './modules.js';
import { uid } from './dom.js';

export const DEFAULT_SETTINGS = {
  titol: '2n C',
  theme: 'fosc', // fosc | clar
  amplada: 100, // % de la imatge projectada que fa servir el taulell
  alineacio: 'centre', // esquerra | centre | dreta
  margeDalt: 3,
  margeBaix: 3,
  margeLateral: 3,
  escala: 1,
  columnes: 1,
  disposicio: 'columna', // columna (automàtica) | lliure (cada mòdul on el posa la mestra)
  negre: false, // pantalla en negre (no es projecta res)
};

export function defaultState() {
  const tasques = newModule('tasques');
  tasques.data.items = [
    newTask('Acabar la fitxa de mates'),
    { ...newTask('Llegir un llibre de la biblioteca d\'aula'), emoji: '📖', color: 'verd' },
    { ...newTask('Dibuix lliure al quadern'), emoji: '🎨', color: 'lila' },
  ];
  const avis = newModule('avis');
  avis.data.text = 'Bon dia, 2n C! 😊';
  return {
    v: 1,
    settings: { ...DEFAULT_SETTINGS },
    modules: [newModule('rellotge'), avis, tasques],
  };
}

// Posició d'un mòdul en disposició lliure, en % de l'àrea del taulell.
function validLayout(l) {
  if (!l || !['x', 'y', 'w', 'h'].every((k) => Number.isFinite(l[k]))) return null;
  return { x: l.x, y: l.y, w: l.w, h: l.h };
}

export function normalize(raw) {
  if (!raw || typeof raw !== 'object') return defaultState();
  const settings = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) };
  const modules = (Array.isArray(raw.modules) ? raw.modules : [])
    .filter((m) => m && TYPES[m.type])
    .map((m) => {
      const base = TYPES[m.type].create();
      const data = { ...base.data, ...(m.data || {}) };
      if (Array.isArray(data.items)) data.items = data.items.map((it) => ({ id: uid(), ...it }));
      if (Array.isArray(data.dies)) {
        data.dies = [0, 1, 2, 3, 4].map((i) => (Array.isArray(data.dies[i]) ? data.dies[i] : []).map((it) => ({ id: uid(), ...it })));
      }
      return {
        id: m.id || uid(),
        type: m.type,
        visible: m.visible !== false,
        title: typeof m.title === 'string' ? m.title : base.title,
        data,
        layout: validLayout(m.layout),
      };
    });
  return { v: 1, settings, modules };
}

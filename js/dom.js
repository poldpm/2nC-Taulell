// Petit ajudant per crear elements del DOM sense innerHTML (el text sempre és text, mai HTML).
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k in el) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

// Selector d'hora en format 24 h amb dos desplegables (hores i minuts). Evita que el navegador
// interpreti l'hora en format a.m./p.m. segons la configuració de l'ordinador.
export function horaSelect(value, onChange) {
  const [hh, mm] = (value || '09:00').split(':');
  const opcions = (n, sel) => Array.from({ length: n }, (_, i) => {
    const v = String(i).padStart(2, '0');
    return h('option', { value: v, selected: v === sel }, v);
  });
  const hores = h('select', { class: 'hora-h', title: 'Hora' }, opcions(24, hh));
  const minuts = h('select', { class: 'hora-m', title: 'Minuts' }, opcions(60, mm));
  const avisa = () => onChange(`${hores.value}:${minuts.value}`);
  hores.addEventListener('change', avisa);
  minuts.addEventListener('change', avisa);
  return h('span', { class: 'hora-select' }, hores, ':', minuts);
}

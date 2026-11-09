const KEY = 'rotina-v1';
const today = new Date().toLocaleDateString('en-CA'); // data local AAAA-MM-DD
const parts = [
  { id: 'manha', title: 'Manhã', from: 5, to: 12 },
  { id: 'tarde', title: 'Tarde', from: 12, to: 18 },
  { id: 'noite', title: 'Noite', from: 18, to: 29 }
];

let data = load();

function load() {
  let d;
  try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!d) d = { day: today, items: [
    { id: 1, name: 'Acordar e beber água', start: '06:30', dur: 15 },
    { id: 2, name: 'Trabalho', start: '08:00', dur: 480 },
    { id: 3, name: 'Estudar programação', start: '17:00', dur: 60 },
    { id: 4, name: 'Faculdade', start: '19:00', dur: 180 }
  ], done: [] };
  if (d.day !== today) { d.day = today; d.done = []; } // marcações zeram todo dia
  return d;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }

const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmt = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const partOf = t => { const h = Math.floor(mins(t) / 60); return h >= 5 && h < 12 ? 'manha' : h >= 12 && h < 18 ? 'tarde' : 'noite'; };

function render() {
  const items = [...data.items].sort((a, b) => mins(a.start) - mins(b.start));
  const done = new Set(data.done);

  const track = document.getElementById('track');
  track.querySelectorAll('.block').forEach(b => b.remove());
  items.forEach(it => {
    const b = document.createElement('button');
    b.className = 'block' + (done.has(it.id) ? ' done' : '');
    b.style.left = (mins(it.start) / 1440 * 100) + '%';
    b.style.width = (Math.min(it.dur, 1440 - mins(it.start)) / 1440 * 100) + '%';
    b.title = `${it.start} ${it.name}`;
    b.setAttribute('aria-label', `${it.name}, ${it.start}. ${done.has(it.id) ? 'Feito' : 'A fazer'}`);
    b.onclick = () => toggle(it.id);
    track.appendChild(b);
  });

  const lists = document.getElementById('lists');
  lists.innerHTML = '';
  parts.forEach(p => {
    const sec = document.createElement('section');
    sec.className = 'part';
    sec.innerHTML = `<h2>${p.title}</h2>`;
    const mine = items.filter(it => partOf(it.start) === p.id);
    if (!mine.length) { sec.insertAdjacentHTML('beforeend', '<p class="empty">Nada marcado. Adicione algo abaixo.</p>'); }
    else {
      const ul = document.createElement('ul');
      mine.forEach(it => {
        const li = document.createElement('li');
        if (done.has(it.id)) li.className = 'done';
        const end = fmt(mins(it.start) + it.dur);
        li.innerHTML = `<input type="checkbox" id="c${it.id}" ${done.has(it.id) ? 'checked' : ''}>
          <span class="time">${it.start}–${end}</span>
          <label class="name" for="c${it.id}"></label>
          <button class="del" aria-label="Remover ${it.name.replace(/"/g, '')}">×</button>`;
        li.querySelector('.name').textContent = it.name;
        li.querySelector('input').onchange = () => toggle(it.id);
        li.querySelector('.del').onclick = () => remove(it.id);
        ul.appendChild(li);
      });
      sec.appendChild(ul);
    }
    lists.appendChild(sec);
  });

  const n = items.length, k = items.filter(i => done.has(i.id)).length;
  document.getElementById('progress').textContent =
    n ? (k === n ? `Tudo feito hoje: ${k} de ${n}. Bom trabalho.` : `${k} de ${n} feitos hoje.`) : 'Sua rotina está vazia.';
}

function tick() {
  const d = new Date(), m = d.getHours() * 60 + d.getMinutes();
  document.getElementById('now').style.left = (m / 1440 * 100) + '%';
  document.getElementById('nowLabel').textContent = 'agora ' + fmt(m);
  const h = d.getHours();
  const part = h >= 5 && h < 12 ? 'manha' : h >= 12 && h < 18 ? 'tarde' : 'noite';
  document.body.dataset.part = part;
  document.getElementById('greet').textContent = part === 'manha' ? 'Bom dia' : part === 'tarde' ? 'Boa tarde' : 'Boa noite';
  const txt = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('date').textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
}

function toggle(id) {
  data.done = data.done.includes(id) ? data.done.filter(x => x !== id) : [...data.done, id];
  save(); render();
}
function remove(id) {
  data.items = data.items.filter(i => i.id !== id);
  data.done = data.done.filter(x => x !== id);
  save(); render();
}

document.getElementById('add').onsubmit = e => {
  e.preventDefault();
  const f = new FormData(e.target);
  data.items.push({ id: Date.now(), name: f.get('name').trim(), start: f.get('start'), dur: +f.get('dur') });
  save(); render();
  e.target.reset();
};

tick(); render();
setInterval(tick, 30000);

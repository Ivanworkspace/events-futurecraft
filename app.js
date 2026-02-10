/**
 * Promemoria / Lista impegni
 * App statica: orologio, data, striscia settimana, form e lista con persistenza localStorage.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'promemoria-impegni';
  const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  // ----- Stato -----
  let appointments = [];

  // ----- DOM -----
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const weekStrip = document.querySelector('.week-strip');
  const form = document.getElementById('appointment-form');
  const listContainer = document.getElementById('appointments-list');
  const emptyState = document.getElementById('empty-state');

  /**
   * Formatta un numero con due cifre (es. 5 -> "05").
   */
  function pad(n) {
    return String(n).padStart(2, '0');
  }

  /**
   * Aggiorna orologio e data in tempo reale.
   */
  function updateClock() {
    const now = new Date();
    clockEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    dateEl.textContent = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /**
   * Evidenzia il giorno corrente nella striscia della settimana (Lun = 0, Dom = 6).
   */
  function highlightCurrentDay() {
    const today = new Date().getDay();
    const adjusted = today === 0 ? 6 : today - 1; // Lun=0 .. Dom=6
    weekStrip.querySelectorAll('.week-day').forEach((btn, i) => {
      const isCurrent = i === adjusted;
      btn.classList.toggle('current', isCurrent);
      btn.setAttribute('aria-pressed', isCurrent);
    });
  }

  /**
   * Carica gli impegni da localStorage.
   */
  function loadAppointments() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      appointments = raw ? JSON.parse(raw) : [];
    } catch (e) {
      appointments = [];
    }
  }

  /**
   * Salva gli impegni in localStorage.
   */
  function saveAppointments() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    } catch (e) {
      console.warn('Impossibile salvare in localStorage', e);
    }
  }

  /**
   * Genera un id univoco per un impegno.
   */
  function nextId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  /**
   * Restituisce la stringa "YYYY-MM-DD" per una data.
   */
  function toDateKey(d) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return y + '-' + pad(m) + '-' + pad(day);
  }

  /**
   * Restituisce l’etichetta del gruppo (Oggi, Domani, Dopodomani o nome del giorno).
   */
  function getGroupLabel(dateKey) {
    const today = toDateKey(new Date());
    const tomorrow = toDateKey(new Date(Date.now() + 86400000));
    const dayAfter = toDateKey(new Date(Date.now() + 86400000 * 2));
    if (dateKey === today) return 'Oggi';
    if (dateKey === tomorrow) return 'Domani';
    if (dateKey === dayAfter) return 'Dopodomani';
    const d = new Date(dateKey + 'T12:00:00');
    return DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1];
  }

  /**
   * Ordina gli impegni: prima per data, poi per ora (senza ora in coda).
   */
  function sortAppointments(list) {
    return list.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  }

  /**
   * Raggruppa gli impegni per data e restituisce un array di { dateKey, label, items }.
   */
  function groupByDay() {
    const sorted = sortAppointments(appointments);
    const groups = {};
    sorted.forEach(function (apt) {
      if (!groups[apt.date]) {
        groups[apt.date] = { dateKey: apt.date, label: getGroupLabel(apt.date), items: [] };
      }
      groups[apt.date].items.push(apt);
    });
    return Object.values(groups);
  }

  /**
   * Rimuove un impegno dalla lista (con animazione) e aggiorna il modello.
   */
  function removeAppointment(id) {
    const item = appointments.find(function (a) { return a.id === id; });
    if (!item) return;
    const el = document.querySelector('[data-appointment-id="' + id + '"]');
    if (el) {
      el.classList.add('removing');
      setTimeout(function () {
        appointments = appointments.filter(function (a) { return a.id !== id; });
        saveAppointments();
        renderList();
      }, 250);
    } else {
      appointments = appointments.filter(function (a) { return a.id !== id; });
      saveAppointments();
      renderList();
    }
  }

  /**
   * Toggle stato "fatto" di un impegno.
   */
  function toggleDone(id) {
    const item = appointments.find(function (a) { return a.id === id; });
    if (item) {
      item.done = !item.done;
      saveAppointments();
      renderList();
    }
  }

  /**
   * Crea il DOM di un singolo impegno.
   */
  function createAppointmentNode(apt) {
    const wrap = document.createElement('div');
    wrap.className = 'appointment-item' + (apt.done ? ' done' : '');
    wrap.setAttribute('data-appointment-id', apt.id);
    wrap.setAttribute('role', 'listitem');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'appointment-checkbox';
    checkbox.checked = !!apt.done;
    checkbox.setAttribute('aria-label', 'Segna come ' + (apt.done ? 'da fare' : 'fatto'));
    checkbox.addEventListener('change', function () { toggleDone(apt.id); });

    const content = document.createElement('div');
    content.className = 'appointment-content';

    const text = document.createElement('div');
    text.className = 'appointment-text';
    text.textContent = apt.text;

    const meta = document.createElement('div');
    meta.className = 'appointment-meta';
    if (apt.time) {
      const timeBadge = document.createElement('span');
      timeBadge.className = 'appointment-time-badge';
      timeBadge.textContent = apt.time;
      meta.appendChild(timeBadge);
    }

    content.appendChild(text);
    if (apt.notes && apt.notes.trim()) {
      const notes = document.createElement('div');
      notes.className = 'appointment-notes';
      notes.textContent = apt.notes.trim();
      content.appendChild(notes);
    }
    content.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'appointment-actions';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-delete';
    deleteBtn.setAttribute('aria-label', 'Elimina impegno');
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', function () { removeAppointment(apt.id); });

    actions.appendChild(deleteBtn);
    wrap.appendChild(checkbox);
    wrap.appendChild(content);
    wrap.appendChild(actions);
    return wrap;
  }

  /**
   * Svuota e ripopola la lista degli impegni raggruppata per giorno.
   */
  function renderList() {
    listContainer.innerHTML = '';
    const groups = groupByDay();
    if (groups.length === 0) return;

    groups.forEach(function (group) {
      const section = document.createElement('div');
      section.className = 'day-group';
      section.setAttribute('role', 'group');
      section.setAttribute('aria-label', group.label);

      const title = document.createElement('h3');
      title.className = 'day-group-title';
      title.textContent = group.label;

      const ul = document.createElement('div');
      ul.className = 'day-group-list';
      ul.setAttribute('role', 'list');
      group.items.forEach(function (apt) {
        ul.appendChild(createAppointmentNode(apt));
      });

      section.appendChild(title);
      section.appendChild(ul);
      listContainer.appendChild(section);
    });
  }

  /**
   * Inizializza il form: default data = oggi, submit aggiunge impegno e ripulisce.
   */
  function initForm() {
    function setDefaultDate() {
      const dateInput = form.querySelector('#appointment-date');
      if (!dateInput.value) {
        dateInput.value = toDateKey(new Date());
      }
    }
    setDefaultDate();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const dateInput = form.querySelector('#appointment-date');
      const timeInput = form.querySelector('#appointment-time');
      const textInput = form.querySelector('#appointment-text');
      const notesInput = form.querySelector('#appointment-notes');
      const text = (textInput.value || '').trim();
      if (!text) {
        textInput.focus();
        return;
      }
      const apt = {
        id: nextId(),
        date: dateInput.value,
        time: (timeInput.value || '').trim() || null,
        text: text,
        notes: (notesInput.value || '').trim() || null,
        done: false
      };
      appointments.push(apt);
      saveAppointments();
      renderList();
      textInput.value = '';
      notesInput.value = '';
      timeInput.value = '';
      setDefaultDate();
      textInput.focus();
    });
  }

  /**
   * Avvio: orologio, evidenziazione giorno, caricamento e render.
   */
  function init() {
    updateClock();
    setInterval(updateClock, 1000);
    highlightCurrentDay();
    setInterval(highlightCurrentDay, 60000);
    loadAppointments();
    renderList();
    initForm();
  }

  init();
})();

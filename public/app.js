/**
 * Promemoria / Lista impegni
 * Persistenza: Firestore (se disponibile) oppure localStorage.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'promemoria-impegni';
  const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const FIRESTORE_COLLECTION = 'appointments';

  // ----- Stato -----
  let appointments = [];

  // ----- DOM -----
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const weekStrip = document.querySelector('.week-strip');
  const form = document.getElementById('appointment-form');
  const listContainer = document.getElementById('appointments-list');
  const emptyState = document.getElementById('empty-state');

  function useFirestore() {
    return !!(window.firebaseDb && window.firebaseAuth && window.firebaseAuth.currentUser);
  }

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
      var raw = localStorage.getItem(STORAGE_KEY);
      appointments = raw ? JSON.parse(raw) : [];
    } catch (e) {
      appointments = [];
    }
  }

  /**
   * Carica gli impegni da Firestore (agenda condivisa: tutti vedono gli stessi impegni).
   */
  function loadAppointmentsFromFirestore() {
    var db = window.firebaseDb;
    return db.collection(FIRESTORE_COLLECTION).get().then(function (snap) {
      appointments = snap.docs.map(function (d) {
        var data = d.data();
        return {
          id: d.id,
          date: data.date,
          time: data.time || null,
          text: data.text,
          notes: data.notes || null,
          done: !!data.done
        };
      });
    }).catch(function (err) {
      console.warn('Errore caricamento Firestore, uso localStorage:', err);
      loadAppointments();
    });
  }

  /**
   * Salva gli impegni in localStorage (fallback).
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
   * Restituisce l'etichetta del gruppo (Oggi, Domani, Dopodomani o nome del giorno).
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
    var item = appointments.find(function (a) { return a.id === id; });
    if (!item) return;
    var el = document.querySelector('[data-appointment-id="' + id + '"]');

    function doRemove() {
      appointments = appointments.filter(function (a) { return a.id !== id; });
      if (!useFirestore()) saveAppointments();
      renderList();
    }

    if (el) el.classList.add('removing');

    if (useFirestore()) {
      window.firebaseDb.collection(FIRESTORE_COLLECTION).doc(id).delete()
        .then(function () { setTimeout(doRemove, el ? 250 : 0); })
        .catch(function (err) {
          console.warn('Errore eliminazione Firestore:', err);
          doRemove();
        });
    } else {
      setTimeout(doRemove, el ? 250 : 0);
    }
  }

  /**
   * Toggle stato "fatto" di un impegno.
   */
  function toggleDone(id) {
    var item = appointments.find(function (a) { return a.id === id; });
    if (!item) return;
    if (useFirestore()) {
      var newDone = !item.done;
      window.firebaseDb.collection(FIRESTORE_COLLECTION).doc(id).update({ done: newDone })
        .then(function () {
          item.done = newDone;
          renderList();
        })
        .catch(function (err) {
          console.warn('Errore aggiornamento Firestore:', err);
          item.done = newDone;
          renderList();
        });
    } else {
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
      var dateInput = form.querySelector('#appointment-date');
      if (!dateInput.value) {
        dateInput.value = toDateKey(new Date());
      }
    }
    setDefaultDate();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var dateInput = form.querySelector('#appointment-date');
      var timeInput = form.querySelector('#appointment-time');
      var textInput = form.querySelector('#appointment-text');
      var notesInput = form.querySelector('#appointment-notes');
      var text = (textInput.value || '').trim();
      if (!text) {
        textInput.focus();
        return;
      }
      var apt = {
        date: dateInput.value,
        time: (timeInput.value || '').trim() || null,
        text: text,
        notes: (notesInput.value || '').trim() || null,
        done: false
      };

      if (useFirestore()) {
        var payload = {
          date: apt.date,
          time: apt.time,
          text: apt.text,
          notes: apt.notes,
          done: false
        };
        window.firebaseDb.collection(FIRESTORE_COLLECTION).add(payload).then(function (ref) {
          apt.id = ref.id;
          appointments.push(apt);
          renderList();
          textInput.value = '';
          notesInput.value = '';
          timeInput.value = '';
          setDefaultDate();
          textInput.focus();
        }).catch(function (err) {
          console.warn('Errore aggiunta Firestore:', err);
          apt.id = nextId();
          appointments.push(apt);
          saveAppointments();
          renderList();
          textInput.value = '';
          notesInput.value = '';
          timeInput.value = '';
          setDefaultDate();
          textInput.focus();
        });
      } else {
        apt.id = nextId();
        appointments.push(apt);
        saveAppointments();
        renderList();
        textInput.value = '';
        notesInput.value = '';
        timeInput.value = '';
        setDefaultDate();
        textInput.focus();
      }
    });
  }

  /**
   * Mostra l'app (nasconde login).
   */
  function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
  }

  /**
   * Mostra il login (nasconde app).
   */
  function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
  }

  /**
   * Carica i dati e renderizza (dopo login).
   */
  function initAppData() {
    if (useFirestore()) {
      loadAppointmentsFromFirestore().then(function () {
        renderList();
      }).catch(function () {
        loadAppointments();
        renderList();
      });
    } else {
      loadAppointments();
      renderList();
    }
  }

  /**
   * Login form handler.
   */
  function initLoginForm() {
    var loginForm = document.getElementById('login-form');
    var loginError = document.getElementById('login-error');
    var loginBtn = document.getElementById('login-btn');

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('login-email').value.trim();
      var password = document.getElementById('login-password').value;
      if (!email || !password) return;

      loginError.style.display = 'none';
      loginBtn.disabled = true;
      loginBtn.textContent = 'Accesso...';

      window.firebaseAuth.signInWithEmailAndPassword(email, password)
        .catch(function (err) {
          console.error('Errore login:', err);
          loginError.textContent = 'Email o password errati. Riprova.';
          loginError.style.display = 'block';
          loginBtn.disabled = false;
          loginBtn.textContent = 'Accedi';
        });
    });
  }

  /**
   * Logout button handler.
   */
  function initLogoutBtn() {
    var logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', function () {
      if (window.firebaseAuth) {
        window.firebaseAuth.signOut();
      }
    });
  }

  /**
   * Avvio: orologio, evidenziazione giorno, form, auth listener.
   */
  function init() {
    updateClock();
    setInterval(updateClock, 1000);
    highlightCurrentDay();
    setInterval(highlightCurrentDay, 60000);

    initLoginForm();
    initLogoutBtn();
    initForm();

    // Auth state listener: mostra login o app a seconda dello stato
    if (window.firebaseAuth) {
      window.firebaseAuth.onAuthStateChanged(function (user) {
        if (user) {
          showApp();
          initAppData();
        } else {
          showLogin();
        }
      });
    } else {
      // Fallback: se Firebase non è disponibile, usa localStorage
      showApp();
      loadAppointments();
      renderList();
    }
  }

  init();
})();

/**
 * Inizializzazione Firebase (Firestore + Auth con email/password).
 * Config pubblico: ok per client-side (le regole Firestore proteggono i dati).
 * 
 * NOTA: Credenziali hardcoded per uso personale/privato.
 * Se vuoi più sicurezza, aggiungi un form di login e rimuovi le credenziali da qui.
 */
(function () {
  'use strict';

  var firebaseConfig = {
    apiKey: 'AIzaSyCD8koWRxZttPklLpMWGsYIz4DaQTGLWNo',
    authDomain: 'events-futurecraft.firebaseapp.com',
    projectId: 'events-futurecraft',
    storageBucket: 'events-futurecraft.firebasestorage.app',
    messagingSenderId: '983941664362',
    appId: '1:983941664362:web:5fca20fa40f8308134c413'
  };

  // Credenziali per login automatico (uso personale)
  var USER_EMAIL = 'ivansantantonio.workspace@gmail.com';
  var USER_PASSWORD = 'Ivan2004@@';

  if (typeof firebase === 'undefined') {
    window.firebaseReady = Promise.reject(new Error('Firebase SDK non caricato'));
    return;
  }

  firebase.initializeApp(firebaseConfig);
  window.firebaseDb = firebase.firestore();
  window.firebaseAuth = firebase.auth();

  // Login automatico con email/password
  window.firebaseReady = window.firebaseAuth.signInWithEmailAndPassword(USER_EMAIL, USER_PASSWORD)
    .then(function () { return window.firebaseAuth.currentUser; })
    .catch(function (err) {
      console.warn('Firebase Auth fallita (controlla email/password in Firebase Console):', err);
      return null;
    });
})();

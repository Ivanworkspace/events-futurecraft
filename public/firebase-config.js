/**
 * Inizializzazione Firebase (Firestore + Auth anonima).
 * Config pubblico: ok per client-side (le regole Firestore proteggono i dati).
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

  if (typeof firebase === 'undefined') {
    window.firebaseReady = Promise.reject(new Error('Firebase SDK non caricato'));
    return;
  }

  firebase.initializeApp(firebaseConfig);
  window.firebaseDb = firebase.firestore();
  window.firebaseAuth = firebase.auth();

  // Auth anonima: ogni dispositivo ha i propri impegni senza login
  window.firebaseReady = window.firebaseAuth.signInAnonymously()
    .then(function () { return window.firebaseAuth.currentUser; })
    .catch(function (err) {
      console.warn('Firebase Auth anonima non disponibile:', err);
      return null;
    });
})();

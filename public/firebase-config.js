/**
 * Inizializzazione Firebase (Firestore + Auth con email/password).
 * Config pubblico: ok per client-side (le regole Firestore proteggono i dati).
 * Il login avviene tramite form utente, non automaticamente.
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
    console.error('Firebase SDK non caricato');
    return;
  }

  firebase.initializeApp(firebaseConfig);
  window.firebaseDb = firebase.firestore();
  window.firebaseAuth = firebase.auth();

  // Persistenza della sessione: l'utente resta loggato anche dopo refresh
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
})();

# Promemoria – Lista impegni (Future Craft)

App statica (HTML, CSS, JS) per gestire impegni. Persistenza: **Firestore** (se configurato) oppure localStorage.

## Firebase / Firestore (persistenza cloud)

✅ **Login automatico**: l'app fa login con l'account configurato (email/password in `firebase-config.js`).

⚠️ **Agenda condivisa**: tutti i dispositivi con lo stesso account vedono e modificano gli stessi impegni.

### Configurazione Firebase Console

1. **Authentication → Sign-in method**: abilita **Email/Password**.
2. **Authentication → Users**: crea un utente con email `ivansantantonio.workspace@gmail.com` (o quello che hai configurato in `firebase-config.js`).
3. **Firestore Database → Regole**: usa queste regole per permettere l'accesso agli utenti autenticati:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appointments/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Se Firebase non è configurato o il login fallisce, l'app usa solo **localStorage** (nessun errore, stesso comportamento).

## Deploy su Vercel (obbligatorio)

**Per evitare 404 sulla homepage:**

1. Vercel → tuo progetto → **Settings** → **General**
2. **Root Directory** → inserisci: `public`
3. Salva e fai **Redeploy** (Deployments → ⋮ → Redeploy)

Tutti i file del sito sono nella cartella `public/`; Vercel deve usare quella cartella come root del deploy.

## Sviluppo locale

```bash
npm run dev
```

Serve la cartella `public/` su http://localhost:3000 (o apri direttamente `public/index.html` nel browser).

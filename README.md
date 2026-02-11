# Promemoria – Lista impegni (Future Craft)

App statica (HTML, CSS, JS) per gestire impegni. Persistenza: **Firestore** (se configurato) oppure localStorage.

## Firebase / Firestore (persistenza cloud)

⚠️ **Agenda condivisa**: tutti i dispositivi che accedono al sito vedono e possono modificare gli stessi impegni.

1. **Authentication → Sign-in method**: abilita **Anonymous**.
2. **Firestore Database → Regole**: usa queste regole per permettere l'accesso condiviso:

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

**Importante**: Queste regole permettono a chiunque (con auth anonima) di leggere e modificare gli impegni. L'app è pensata per uso personale/privato.

Se Firebase non è configurato o la auth anonima fallisce, l'app usa solo **localStorage** (nessun errore, stesso comportamento).

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

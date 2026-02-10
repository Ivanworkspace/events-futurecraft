# Promemoria – Lista impegni (Future Craft)

App statica (HTML, CSS, JS) per gestire impegni con persistenza in localStorage.

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

# Hubbo — come metterla online e installarla sul telefono

Tutti i file che servono sono in questa cartella. Non devi modificare niente:
carichi e funziona.

```
index.html          l'app
manifest.json       dice al telefono come installarla
sw.js               fa funzionare l'app offline
offerte.json        fallback locale del catalogo, legato alla release
catalog/offerte.json catalogo remoto primario, aggiornabile senza release
icons/              l'icona che vedrai sulla schermata home
```

---

## Perché serve metterla online

Una PWA si installa solo da un indirizzo web con HTTPS. Aprendo il file
direttamente dal telefono l'app funziona, ma non compare l'opzione "installa" e
le notifiche restano bloccate. GitHub Pages fa questo gratis, senza limiti di
tempo.

---

## Passo 1 — Crea un account GitHub (2 minuti)

1. Vai su **github.com** e premi **Sign up**
2. Inserisci email, password, un nome utente (es. `ernesto-dev`)
3. Conferma l'email che ricevi

Se hai già un account, salta al passo 2.

---

## Passo 2 — Crea il repository (2 minuti)

1. In alto a destra premi **+** → **New repository**
2. **Repository name**: `hubbo`
3. Lascia selezionato **Public**
4. Premi **Create repository**

> Public significa che il *codice* è visibile ad altri. I dati degli utenti no:
> quelli restano sul loro telefono.

---

## Passo 3 — Carica i file (3 minuti)

1. Nella pagina del repository appena creato, premi **uploading an existing file**
   (il link nel testo al centro)
2. Trascina **index.html**, **manifest.json**, **sw.js**, **offerte.json**
3. Trascina anche le cartelle **catalog**, **icons** e **vendor** intere
4. In fondo premi **Commit changes**

Verifica che si veda così:

```
hubbo/
├── index.html
├── manifest.json
├── sw.js
├── offerte.json
├── catalog/
│   ├── offerte.json
│   └── README.md
├── vendor/
│   ├── react.production.min.js
│   └── react-dom.production.min.js
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-maskable-512.png
    └── apple-touch-icon.png
```

Se `icons` non si è caricata come cartella, creala con **Add file → Create new
file**, scrivi `icons/icon-192.png` nel nome (la barra crea la cartella), poi
carica le immagini lì dentro.

---

## Passo 4 — Attiva la pubblicazione (1 minuto)

1. Nel repository vai su **Settings** (in alto)
2. Nel menu a sinistra premi **Pages**
3. Sotto **Source** scegli **Deploy from a branch**
4. **Branch**: `main`, cartella `/ (root)` → **Save**

Aspetta 1-2 minuti e ricarica la pagina: comparirà il tuo indirizzo, tipo

```
https://TUONOME.github.io/hubbo/
```

Quello è il link da aprire e da mandare a chi vuoi far provare l'app.

---

## Passo 5 — Installala sul telefono

**Android (Chrome)**
1. Apri il link
2. Menu **⋮** in alto a destra → **Installa app** (o "Aggiungi a schermata Home")
3. Conferma

**iPhone (Safari — deve essere Safari, non Chrome)**
1. Apri il link
2. Tocca il tasto **Condividi** (quadrato con freccia in su)
3. Scorri e tocca **Aggiungi a Home**
4. Conferma

Ora hai l'icona sulla schermata home. Aprendola parte a schermo intero, senza
barra del browser: indistinguibile da un'app normale.

---

## Cosa puoi testare adesso che prima non potevi

- **Notifiche vere** — attivale nelle impostazioni dell'app: al primo avvio il
  telefono chiederà il permesso, e riceverai gli avvisi dei rinnovi in arrivo
- **Uso offline** — attiva la modalità aereo e riapri: funziona lo stesso
- **Tasto indietro** del telefono, a schermo intero
- **Tema automatico** che segue quello di sistema

---

## Quando modifichi l'app

1. Sostituisci il file cambiato su GitHub (**Add file → Upload files**, stesso nome)
2. **Importante**: apri `sw.js` su GitHub, premi la matita ✏️ e cambia la riga

   ```js
   const CACHE = "hubbo-v1";
   ```

   in `"hubbo-v2"`, poi `v3` e così via a ogni aggiornamento.

   Senza questo passaggio chi ha già installato l'app continua a vedere la
   versione vecchia, perché è salvata sul suo telefono.
3. Chi ha l'app installata riceve l'aggiornamento alla riapertura successiva

---

## Aggiornare il catalogo senza rilasciare l'app — Parte 8A

Dalla v240 Hubbo distingue due copie del catalogo:

- **`catalog/offerte.json`** è la fonte remota primaria. È questa la copia da
  aggiornare quando cambiano prezzi, piani, promozioni o opportunità. Il suo URL
  pubblico stabile è `https://dod86.github.io/Hubbo/catalog/offerte.json`.
- **`offerte.json`** alla radice è il fallback locale della release. Va cambiato
  solo insieme a una nuova release dell'app, non durante la manutenzione
  settimanale ordinaria. Il service worker lo precachea per garantire un
  catalogo di emergenza anche offline.

All'avvio Hubbo usa questa sequenza: ultima copia valida già salvata → tentativo
del catalogo remoto → fallback locale soltanto se non esiste ancora nessuna
copia valida. Se il remoto non risponde, una copia valida già scaricata non viene
sostituita dal fallback più vecchio. Quando l'app torna in primo piano, ricontrolla
periodicamente solo il catalogo remoto.

Quindi, per un normale aggiornamento commerciale, su GitHub devi modificare
**solo `catalog/offerte.json`**: non cambiare `index.html`, `sw.js`, il numero di
versione app o `offerte.json` alla radice. Le Parti 8B–8D aggiungeranno manifest,
versioning formale, SHA-256, storico immutabile e rollback.

Dentro il catalogo restano gli stessi elenchi e le stesse regole della v239:

- **piani** — piani e listini strutturati;
- **offerte** — promozioni a tempo, sempre con `scade`;
- **opportunita** — regole multi-servizio del motore Risparmio.

Il campo `verificato` indica quando una voce è stata ricontrollata. I nomi in
`servizio` devono continuare a corrispondere al catalogo interno/alias supportati:
i controlli automatici segnalano gli errori.

---

## Nota sui dati

Ogni persona che installa l'app ha i **suoi** dati, salvati solo sul suo
telefono. Nessuno vede quelli degli altri e niente viene inviato online.

Attenzione però: disinstallando l'app o cancellando i dati del browser, gli
abbonamenti inseriti si perdono. Per questo esiste **Esporta backup** nelle
impostazioni — vale la pena dirlo a chi fa da tester.

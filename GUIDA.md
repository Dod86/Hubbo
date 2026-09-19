# Hubbo — come metterla online e installarla sul telefono

Tutti i file che servono sono in questa cartella. Non devi modificare niente:
carichi e funziona.

```
index.html          l'app
manifest.json       dice al telefono come installarla
sw.js               fa funzionare l'app offline
offerte.json        fallback locale del catalogo, legato alla release
catalog/offerte.json catalogo remoto primario, aggiornabile senza release
catalog/manifest.json versione/schema/hash del catalogo remoto
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
│   ├── manifest.json
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

## Aggiornare il catalogo senza rilasciare l'app — Parti 8A/8B/8C/8D/8E

Dalla v243 il catalogo remoto usa **snapshot immutabili**. Il file
`catalog/offerte.json` resta la copia di lavoro, mentre l'app legge
`catalog/manifest.json`, che punta a una cartella versionata sotto
`catalog/versions/`.

Struttura corrente:

- `catalog/offerte.json` — copia di lavoro per il prossimo aggiornamento;
- `catalog/manifest.json` — puntatore live alla versione attiva;
- `catalog/versions/v000001/offerte.json` — snapshot immutabile v1;
- `catalog/versions/v000001/manifest.json` — manifest immutabile v1;
- `offerte.json` alla radice — fallback locale della release app.

La catena sicura resta:

1. scarica il manifest live;
2. controlla schema e versione minima dell'app;
3. scarica lo snapshot indicato dal manifest;
4. valida JSON e schema;
5. verifica lo SHA-256 sui byte ricevuti;
6. salva il candidato in staging e lo rilegge;
7. lo rende attivo solo dopo il salvataggio verificato.

### Nuovo aggiornamento commerciale

1. modifica `catalog/offerte.json`;
2. esegui dalla radice del progetto:

   ```bash
   node build/publish-catalog-version.js
   ```

   Lo script crea automaticamente la versione successiva, ad esempio
   `catalog/versions/v000002/`, e rifiuta di sovrascrivere cartelle già
   pubblicate;
3. verifica:

   ```bash
   node build/generate-catalog-manifest.js --check
   node build/rollback-catalog.js --check
   node verifiche/checks-catalog-versioning.js
   node verifiche/checks-catalog-rollback.js
   ```

4. su GitHub carica **la nuova cartella versionata** e il nuovo
   `catalog/manifest.json`.

Per un normale aggiornamento dati non serve cambiare `index.html`, `sw.js`,
versione app o `offerte.json` alla radice finché schema e compatibilità minima
restano invariati.

### Audit settimanale prima di toccare il catalogo

Dalla v244, dalla radice del progetto esegui:

```bash
node build/catalog-weekly-audit.js
```

Il comando controlla automaticamente struttura, duplicati, alias, categorie,
prezzi, frequenze/addebiti, vincoli/rateizzazioni, promo e target, fonti/link,
date di verifica, piani selezionabili, opportunità intelligenti e compatibilità
con i vecchi snapshot. Confronta inoltre `catalog/offerte.json` con la versione
attualmente live e crea un report in `audit/reports/`.

Il report separa i **blocchi automatici** dalle sole voci che richiedono una
verifica umana. I link vengono ricontrollati online e gli errori temporanei non
vengono elevati subito: `audit/state.json` conserva gli esiti fra una settimana
e l'altra. Per una prova senza rete: `node build/catalog-weekly-audit.js --offline`.

La policy è configurabile in `audit/policy.json`; non modificare prezzi o
condizioni per “far passare” l'audit: ogni dato commerciale va confermato sulla
fonte ufficiale italiana.

### Rollback

Per tornare a una versione già pubblicata:

```bash
node build/rollback-catalog.js --catalog-version 1
```

Lo script riverifica integralmente lo snapshot scelto e aggiorna solo il
manifest live. Per applicare il rollback online basta quindi caricare su GitHub
**solo `catalog/manifest.json`**. Le versioni successive non vengono cancellate.

La v243 parte con `catalogVersion: 1`, schema 5 e `minAppVersion: v240`. Il
numero del catalogo è indipendente dalla versione Hubbo.

Dentro il catalogo restano gli stessi elenchi e le stesse regole della v239:
**piani**, **offerte** e **opportunita**. Nessun prezzo va inventato o convertito
arbitrariamente; il campo `verificato` continua a indicare l'ultima verifica
della singola voce.

---

## Nota sui dati

Ogni persona che installa l'app ha i **suoi** dati, salvati solo sul suo
telefono. Nessuno vede quelli degli altri e niente viene inviato online.

Attenzione però: disinstallando l'app o cancellando i dati del browser, gli
abbonamenti inseriti si perdono. Per questo esiste **Esporta backup** nelle
impostazioni — vale la pena dirlo a chi fa da tester.

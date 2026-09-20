# Catalogo remoto Hubbo — Parti 8A/8B/8C/8D/8E/8F/8G/8H

Questa cartella contiene i dati commerciali aggiornabili senza una nuova release
dell'app. Dalla v243 il manifest pubblico è un **puntatore live** a snapshot
immutabili del catalogo.

Struttura:

- `offerte.json` — copia di lavoro usata per preparare il prossimo aggiornamento;
- `manifest.json` — puntatore live alla versione attiva;
- `versions/vNNNNNN/offerte.json` — snapshot immutabile dei dati;
- `versions/vNNNNNN/manifest.json` — manifest immutabile dello stesso snapshot.
- `contracts/client-contract-v1.json` — protocollo multipiattaforma PWA/Android;
- `contracts/manifest-v1.schema.json` — schema machine-readable del manifest;
- `contracts/catalog-v5.schema.json` — schema machine-readable del catalogo v5;
- `contracts/user-catalog-ref-v1.schema.json` — schema del riferimento stabile salvato nei dati utente.

Endpoint live:

- `https://dod86.github.io/Hubbo/catalog/manifest.json`

Lo storico parte da `catalogVersion: 1`, conservata immutabilmente in
`catalog/versions/v000001/`. La versione live corrente è **catalogVersion 4**,
in `catalog/versions/v000004/`. La v4 introduce il modello dati additivo della
Parte 9B senza aggiungere ancora nuovi bundle commerciali. Il manifest live punta a:

`https://dod86.github.io/Hubbo/catalog/versions/v000004/offerte.json`

## Pubblicare una nuova versione del catalogo

1. modificare `catalog/offerte.json` solo con dati verificati;
2. dalla radice eseguire il **solo comando operativo consigliato**:

```bash
node build/publish-catalog-pipeline.js
```

La pipeline 8F esegue audit del candidato, tutti i test automatici, controllo
chiavi JSON duplicate e verifica della build effettiva. Se un controllo critico
fallisce **non crea alcuna nuova versione**. Solo a gate verdi crea lo snapshot
immutabile, aggiorna il manifest live e riverifica l'intero storico. Se anche un
post-check fallisse, ripristina la situazione locale precedente.

Al termine stampa esattamente cosa caricare su GitHub: normalmente i due file
della nuova `versions/vNNNNNN/` più `catalog/manifest.json`. Per provare senza
pubblicare usare `--dry-run`; `--offline` è riservato ai test.

`build/publish-catalog-version.js` resta il componente di basso livello usato
dalla pipeline, non il comando normale di pubblicazione.

## Rollback rapido

Per tornare, ad esempio, a `catalogVersion 1`:

```bash
node build/rollback-catalog.js --catalog-version 1
```

Lo script verifica nuovamente JSON, schema, URL e SHA-256 dello snapshot scelto e
poi cambia **solo** `catalog/manifest.json`. Per applicare il rollback in
produzione basta quindi caricare su GitHub quel solo manifest live. Le versioni
più recenti restano nello storico e non vengono cancellate.

Non rinominare, modificare o riutilizzare una cartella `versions/vNNNNNN/` già
pubblicata: l'immutabilità del percorso è ciò che rende affidabili hash e
rollback.

## Sicurezza

La catena v242 resta invariata anche per gli snapshot v243:

**scarica manifest → valida compatibilità → scarica snapshot → valida JSON/schema
→ verifica SHA-256 → staging → read-back → commit → attiva**.

Se qualunque passaggio fallisce, Hubbo conserva l'ultima copia verificata. Se non
ne esiste una usa `../offerte.json`, fallback locale legato alla release.
## Audit settimanale (v244)

Prima di preparare una nuova versione commerciale eseguire dalla radice:

```bash
node build/catalog-weekly-audit.js
```

Il report in `audit/reports/` confronta la copia di lavoro con il catalogo live e
mette in coda manuale solo modifiche, dati scaduti/in scadenza o anomalie che non
possono essere risolte automaticamente. Il comando normale controlla anche i link;
`--offline` serve soltanto per test/riproducibilità. Policy e memoria link sono in
`audit/policy.json` e `audit/state.json`.

Questo audit non pubblica nulla e non modifica il catalogo. La pubblicazione passa
dalla pipeline 8F `build/publish-catalog-pipeline.js`, che riesegue l'audit come gate.


## Compatibilità futura Android (v246 / Parte 8G)

Il formato remoto non dipende più concettualmente dalla versione della PWA. Il
campo storico `minAppVersion` indica il **livello minimo di capability del client
catalogo**, non il `versionName`/`versionCode` dello store. La PWA espone tale
livello con `CATALOG_CLIENT_CAPABILITY_VERSION`; Android dovrà avere una costante
equivalente e potrà mantenere una numerazione app propria.

Il contratto condiviso è in `contracts/`. Android dovrà riusare gli stessi URL,
manifest, schema v5, SHA-256, snapshot immutabili, rollback e sequenza di
attivazione sicura. Cambiano solo gli adapter di piattaforma (HTTP, SHA-256,
storage pending/active e fallback incluso nell'AAB/APK). Nessun codice Android è
necessario in questa fase e nessun dato commerciale è stato modificato.


## Protezione dati utente (v247 / Parte 8H)

`catalogVersion 2` aggiunge `identitaCatalogo` versione 1. Ogni servizio e piano
rappresentato possiede un `serviceId`/`planId` stabile: una rinominazione futura non
deve cambiarlo e il vecchio nome deve restare alias. Nella fotografia v2 sono censiti
263 servizi e 204 piani con ID, senza collisioni. Lo schema catalogo resta v5 perché
il registro è opzionale e `v000001` deve continuare a validare.

La PWA salva, quando possibile, un riferimento additivo `catalogRef` negli abbonamenti
e nel cestino. Il riferimento segue `contracts/user-catalog-ref-v1.schema.json` e
contiene gli ID oltre ai nomi/alias necessari al fallback. L'app confronta prima gli
ID; i nomi sono compatibilità legacy, non identità. Nessun aggiornamento catalogo deve
riscrivere nome, piano, prezzo, frequenza, date o storico inseriti dall'utente.

Il registro permette anche il rollback a snapshot pre-8H: se lo snapshot scelto non
ha ID, `catalogRef` conserva nomi/alias sufficienti a tentare la riconciliazione. La
pipeline 8F esegue `checks-user-data-protection.js` e blocca la pubblicazione se un ID
già pubblicato sparisce, viene riutilizzato in modo incompatibile o una rinominazione
perde l'alias storico.


## Parte 9B — modello bundle complessi (v257)

Il catalogo v5 supporta ora campi opzionali per prezzi standard/promozionali e
fasi successive, costi una tantum, target/requisiti/vincoli, scadenza promo e
piani effettivamente inclusi nel bundle. L’estensione è backward-compatible:
Apple One e le regole `incluso` esistenti continuano a funzionare con i campi
legacy. La Parte 9B non aggiunge ancora TIMVISION né altri bundle commerciali.

La distinzione `pianiAmmessi`/`pianiEsclusi` (piano posseduto e sostituibile) vs
`pianoIncluso`/`pianiInclusi` (piano fornito dal bundle) è parte del contratto
multipiattaforma e va preservata anche nell’app Android.

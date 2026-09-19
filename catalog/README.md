# Catalogo remoto Hubbo — Parti 8A/8B/8C/8D

Questa cartella contiene i dati commerciali aggiornabili senza una nuova release
dell'app. Dalla v243 il manifest pubblico è un **puntatore live** a snapshot
immutabili del catalogo.

Struttura:

- `offerte.json` — copia di lavoro usata per preparare il prossimo aggiornamento;
- `manifest.json` — puntatore live alla versione attiva;
- `versions/vNNNNNN/offerte.json` — snapshot immutabile dei dati;
- `versions/vNNNNNN/manifest.json` — manifest immutabile dello stesso snapshot.

Endpoint live:

- `https://dod86.github.io/Hubbo/catalog/manifest.json`

La v243 parte con `catalogVersion: 1`, conservata in
`catalog/versions/v000001/`. Il manifest live punta quindi a:

`https://dod86.github.io/Hubbo/catalog/versions/v000001/offerte.json`

## Pubblicare una nuova versione del catalogo

1. Modificare solo `catalog/offerte.json` dopo le verifiche commerciali.
2. Dalla radice del progetto eseguire:

```bash
node build/publish-catalog-version.js
```

Lo script:

- sceglie il numero successivo;
- crea una nuova cartella `versions/vNNNNNN/`;
- copia dentro i byte esatti del catalogo;
- genera il manifest con schema, data, app minima, URL versionato e SHA-256;
- rifiuta di sovrascrivere una versione già esistente;
- aggiorna `catalog/manifest.json` solo dopo aver verificato lo snapshot.

Poi verificare:

```bash
node build/generate-catalog-manifest.js --check
node build/rollback-catalog.js --check
node verifiche/checks-catalog-versioning.js
node verifiche/checks-catalog-rollback.js
```

Per un aggiornamento commerciale si pubblicano su GitHub **la nuova cartella
versionata** e `catalog/manifest.json`. `index.html`, `sw.js` e la versione app
non vanno modificati finché schema/compatibilità dell'app restano invariati.

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

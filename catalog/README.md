# Catalogo remoto Hubbo — Parti 8A/8B

Questa cartella contiene i dati commerciali aggiornabili senza una nuova release
dell'app. Da v241 i file pubblicati sono due:

- `offerte.json` — catalogo remoto;
- `manifest.json` — metadati/versioning del catalogo.

Endpoint di produzione:
- `https://dod86.github.io/Hubbo/catalog/manifest.json`
- `https://dod86.github.io/Hubbo/catalog/offerte.json`

`manifest.json` contiene almeno `catalogVersion`, `schemaVersion`, `generatedAt`,
`minAppVersion`, `catalogUrl` e `sha256`. Il manifest iniziale è catalogVersion 1,
schemaVersion 5 e minAppVersion v240.

Per un normale aggiornamento commerciale modificare `offerte.json`, quindi dalla
radice del progetto eseguire:

```bash
node build/generate-catalog-manifest.js
node build/generate-catalog-manifest.js --check
```

Il primo comando incrementa automaticamente `catalogVersion` e ricalcola schema,
data e SHA-256; il secondo verifica che manifest e JSON coincidano. Pubblicare
sempre **insieme** `catalog/offerte.json` e `catalog/manifest.json`.

Il file `../offerte.json` resta il fallback locale della release e non va
aggiornato nella manutenzione commerciale settimanale. In 8B la PWA usa il
manifest per individuare il catalogo ma non applica ancora la verifica
crittografica obbligatoria: quella catena sicura appartiene alla Parte 8C.

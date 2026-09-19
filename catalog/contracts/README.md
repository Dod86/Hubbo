# Hubbo Catalog Client Contract v1

Questi file sono il contratto **indipendente dalla piattaforma** fra il catalogo
Hubbo e qualunque client che lo consuma. La PWA e la futura app Android devono
implementare lo stesso protocollo; storage, API HTTP e libreria SHA-256 possono
cambiare, ma non l'ordine di validazione/attivazione.

File:

- `client-contract-v1.json` — protocollo di aggiornamento e responsabilità del client;
- `manifest-v1.schema.json` — forma machine-readable del manifest live/snapshot;
- `catalog-v5.schema.json` — forma machine-readable del catalogo commerciale v5.

## Versione app vs capability catalogo

Il campo storico `minAppVersion` del manifest non va interpretato come numero
Play Store o versione marketing. Indica il **livello minimo di capability del
client catalogo** nel formato `vNNN`. La PWA dichiara questo livello con
`CATALOG_CLIENT_CAPABILITY_VERSION`; Android dovrà avere una costante equivalente,
indipendente dal proprio `versionCode`/`versionName`.

Questo evita che una futura Android 1.0 debba fingersi “app v246” e permette di
far evolvere UI e versioni degli store senza cambiare il protocollo dati.

## Adapter Android futuro

Il client nativo dovrà fornire solo gli adapter di piattaforma:

1. GET HTTPS del manifest e dello snapshot restituendo i byte originali;
2. SHA-256 sui byte ricevuti;
3. decode UTF-8 rigoroso e parsing JSON;
4. validazione contro manifest v1 + catalogo v5;
5. storage persistente separato per `pending` e `active`;
6. commit atomico/equivalente;
7. fallback JSON incluso nell'APK/AAB.

La sequenza e le regole di errore sono in `client-contract-v1.json`. Un client
Android non deve dipendere da localStorage, service worker, DOM o nomi di chiavi
PWA.

## Regola di evoluzione

- Campi **aggiuntivi compatibili** possono essere introdotti mantenendo lo stesso
  schema se i client possono ignorarli in sicurezza.
- Una modifica incompatibile richiede nuova `schemaVersion` e un aggiornamento
  esplicito dei contratti prima di pubblicare il catalogo.
- Gli snapshot restano immutabili; rollback e pipeline 8F non cambiano fra PWA e
  Android.

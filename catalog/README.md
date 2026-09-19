# Catalogo remoto Hubbo — Parte 8A

`offerte.json` in questa cartella è la **fonte remota primaria** letta dalla PWA.
L'URL di produzione usato dalla v240 è:

`https://dod86.github.io/Hubbo/catalog/offerte.json`

Il file `../offerte.json` resta invece il **fallback locale della release** e non
va aggiornato durante la normale manutenzione commerciale settimanale.

Con la Parte 8A la PWA legge prima la copia valida già salvata, prova poi questo
catalogo remoto e usa il fallback locale solo quando non ha ancora nessun
catalogo valido. Manifest, hash, versioning formale e rollback verranno aggiunti
nelle Parti 8B–8D.

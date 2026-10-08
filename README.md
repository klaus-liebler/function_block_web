# function_block_web

Standalone-Version des Function-Block-Editors (FBD) aus labathome: Editor + Simulator im Browser,
ohne Hardware. Diagramme werden lokal als `.fbd` exportiert/importiert.

## Aufbau

Der eigentliche Editor/Simulator liegt nicht hier, sondern im geteilten Paket
`npm-packages/@klaus-liebler/flowchart` und wird von beiden Projekten genutzt:

| Projekt | Host | Device |
|---|---|---|
| `labathome_firmware/web` | `AppController` (Websocket) | `DevelopCFCController` implementiert `IFlowchartDevice` (Dateien auf dem Gerät, Debug, Run via ws-protocol) |
| `function_block_web` (dieses) | `StandaloneHost` in `app.ts` (nur Dialog + Snackbar) | keines |

Ohne `IFlowchartDevice` blendet der Flowchart alle Geräte-Menüs aus, lädt beim Start keine
Default-FBD und ruft den Binärcompiler nicht auf. Exportierte Dateien haben dann einen leeren
Binärteil (Länge 0) plus den JSON-Teil. Sie lassen sich hier und im labathome-Editor öffnen und
bekommen den Binärteil beim Speichern auf das Gerät.

## Bedienung

| Aktion | Maus | Tastatur |
|---|---|---|
| Baustein hinzufügen | Bibliothek über die Lasche am linken Rand herausziehen (Überfahren oder Klick), Baustein auf die Arbeitsfläche ziehen | Esc schließt sie |
| Verbinden | Von einem Ausgang auf einen Eingang gleichen Typs ziehen | |
| Eigenschaften ändern | Baustein anklicken, im Panel rechts bearbeiten (wird sofort übernommen) | |
| Auswahl aufheben / löschen | Klick auf freie Fläche / „Delete block“ | Esc / Entf |
| Öffnen / Speichern | Menü File | Ctrl+O / Ctrl+S |
| Simulation starten / neu starten / stoppen | Menü Simulation | F5 / Ctrl+Shift+F5 / Shift+F5 |
| Eingänge in der Simulation | Klick schaltet um, Mausrad ändert Werte | |

Das Menü ist eine WAI-ARIA-Menüleiste (Pfeiltasten, Home/End, Enter, Esc).

## Regelkreise simulieren (Gruppe „Simulation“)

Diese Bausteine gibt es nur im Simulator, nicht in der Firmware (Typ-Index ab 100, alle Ein- und
Ausgänge float). Diagramme damit lassen sich speichern, aber nicht auf ein Gerät übertragen.

| Baustein | Funktion | Parameter |
|---|---|---|
| DeadTime | Out = In, um die Totzeit verzögert (vorher 0) | Dead time [s] |
| PT1 | Verzögerungsglied 1. Ordnung | Time constant [s] |
| Gain | Out = Gain · In | Gain |
| Switch | Umschalter: Out = A oder B, in der Simulation per Klick | Position (Grundstellung) |
| Meter | Digitalanzeige des Eingangswerts | Decimals |
| Plotter | Kurvenschreiber, drei Eingänge, letzte N Sekunden | Time span [s], Autoscale, Y min, Y max |

Rückkopplungen müssen über DeadTime oder PT1 laufen: Nur dort wird der Kreis für die
Ausführungsreihenfolge aufgetrennt (`HasDirectFeedthrough`). Ein Kreis ohne einen dieser Bausteine
wird beim Start der Simulation mit einer Fehlermeldung abgelehnt.

## Voraussetzungen

`C:\repos\npm-packages` muss neben diesem Verzeichnis liegen, und die geteilten Pakete brauchen
jeweils ihre eigenen `node_modules` (einmalig `npm install` in `@klaus-liebler/flowchart`,
`@klaus-liebler/web-components` und `@klaus-liebler/commons`).

## Entwickeln / Bauen / Deployen

```
npm install
npm run dev      # lokaler Dev-Server
npm run build    # -> dist/
```

Wie in labathome und sensact baut das geteilte Plugin `@klaus-liebler/vite-firmware-single-file`
alles zu einer einzigen Datei: JS und CSS werden in `index.html` eingebettet, Leerzeichen entfernt
(auch in Lit-Templates). `dist/` enthält danach nur

- `index.html` – die komplette Anwendung, lädt nichts nach
- `index.html.br` – dieselbe Datei Brotli-komprimiert (ca. ein Viertel der Größe)

Zum Deployen beide Dateien in ein beliebiges Verzeichnis des Webservers kopieren; ein Backend wird
nicht benötigt. Mit `brotli_static on;` (nginx, Modul ngx_brotli) bzw. einer entsprechenden
Rewrite-Regel (Apache) wird die vorkomprimierte Datei ausgeliefert, sonst einfach `index.html`.

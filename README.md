# Travel Tracker

Travel Tracker ist eine Web-App zum Speichern und Verwalten von Orten auf einer interaktiven Karte. Nutzer koennen Reiseorte anlegen, bearbeiten, loeschen, nach Trips organisieren und Orte mit anderen Nutzern oder per Public-Share-Link teilen.

## Projektueberblick

Tech Stack:

| Bereich | Technologien |
| --- | --- |
| Frontend | Next.js, React, Tailwind CSS, Leaflet / React Leaflet |
| Backend | Express, Prisma |
| Datenbank | SQLite |
| Tests | Vitest, Cypress |

Die App besteht aus einem Next.js-Frontend, einem Express-Backend und einer lokalen SQLite-Datenbank ueber Prisma. Fuer die lokale Entwicklung sind die aktuell konfigurierten Standard-Ports:

| Teil | URL / Port |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:3003` |
| SQLite DB | `backend/dev.db` |

## Voraussetzungen

- Node.js: empfohlen `>= 20`; lokal zuletzt mit `v24.15.0` geprueft.
- npm: lokal zuletzt mit `11.12.1` geprueft.
- Prisma: wird ueber die Backend-Dependencies installiert und per `npx prisma ...` oder Root-Skripten ausgefuehrt.
- SQLite: wird lokal ueber Prisma/`better-sqlite3` genutzt; es ist kein separater Datenbankserver noetig.

## Environment Setup

Beispiele liegen bewusst ohne echte Secrets im Repository:

- `backend/.env.example` -> nach `backend/.env` kopieren
- `frontend/.env.example` -> nach `frontend/.env.local` kopieren

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Wichtige Backend-Variablen:

| Variable | Lokaler Default | Beschreibung |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | SQLite-Datei relativ zu `backend/`. |
| `JWT_SECRET` | `dev-secret-change-me` | Nur lokaler Entwicklungswert; fuer Deployments ersetzen. |
| `PORT` | `3003` | Express-Port aus `backend/.env.example`. Ohne Env-Fallback startet `server.js` auf `3001`. |
| `BACKEND_URL` | `http://localhost:3003` | Kanonische Backend-URL fuer lokale Checks, CORS/CSRF und CSP. |
| `FRONTEND_URL` | `http://localhost:3000` | Erlaubte Frontend-Origin fuer CORS/CSRF-Pruefungen. |
| `RESEND_API_KEY` | leer | Optional fuer echten E-Mail-Versand. |
| `RESEND_FROM_EMAIL` | `no-reply@travel-tracker.local` | Absender fuer optionale Transaktionsmails. |

Wichtige Frontend-Variablen:

| Variable | Lokaler Default | Beschreibung |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Oeffentliche URL der Next-App. |
| `BACKEND_URL` | `http://localhost:3003` | Server-seitiger Proxy-Zielhost fuer Next API Routes. |
| `NEXT_PUBLIC_API_BASE_URL` | `/api` | Browser-API-Basis; bleibt lokal beim Next-Proxy. |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:3003` | Browser-Ziel fuer SSE und socket.io. |
| `NEXT_PUBLIC_DEBUG_API` | `false` | Optionales Fetch-Debugging. |

Keine echten Secrets in `.env.example`, README oder Git eintragen. Fuer Production muss `JWT_SECRET` mindestens 32 Zeichen/Bytes lang sein und darf nicht `dev-secret-change-me` sein.

## Installation

Der Root enthaelt ein `package.json` fuer gemeinsame Skripte. Die eigentlichen Dependencies liegen in `backend/` und `frontend/`.

```bash
npm run install:all
```

Alternativ getrennt:

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

## Datenbank und Prisma

Lokale SQLite-Daten liegen standardmaessig in `backend/dev.db`. Das Prisma-Schema liegt unter `backend/prisma/schema.prisma`.

```bash
npm run prisma:generate
npm run prisma:migrate
```

Die Root-Skripte fuehren im Backend aus:

```bash
npx prisma generate
npx prisma migrate deploy
```

Fuer neue Entwicklungs-Migrationen:

```bash
npm --prefix backend run prisma:migrate:dev
```

Das entspricht `npx prisma migrate dev` im Backend-Kontext.

## App Starten

One-Command-Start aus dem Root:

```bash
npm run dev
```

Danach ist die App unter `http://localhost:3000` erreichbar. Registrierung und Login laufen ueber die Next-API-Routen im Frontend, die intern zum Express-Backend auf `http://localhost:3003` proxyn.

Alternativ getrennt:

```bash
npm --prefix backend start
npm --prefix frontend run dev
```

## Root-Skripte

| Befehl | Zweck |
| --- | --- |
| `npm run install:all` | Installiert Backend- und Frontend-Abhaengigkeiten. |
| `npm run dev` | Startet Backend und Frontend gemeinsam in einem Terminal. |
| `npm run prisma:generate` | Erstellt den Prisma Client im Backend. |
| `npm run prisma:migrate` | Spielt vorhandene Prisma-Migrationen nicht-interaktiv gegen SQLite ein. |
| `npm run test` | Fuehrt alle Tests aus: Backend/Frontend Vitest plus Cypress E2E. |
| `npm run test:unit` | Fuehrt nur Backend- und Frontend-Vitest-Tests aus. |
| `npm run test:e2e` | Startet die App und fuehrt Cypress E2E aus. |
| `npm run test:coverage` | Fuehrt Backend- und Frontend-Tests mit Coverage aus. |
| `npm run build` | Generiert Prisma Client und baut das Next.js-Frontend. |

## Tests

```bash
npm run test
npm run test:unit
npm run test:e2e
npm run test:coverage
```

`npm run test` fuehrt Backend/Frontend Vitest und danach Cypress E2E aus. `npm run test:e2e` startet die App automatisch und fuehrt Cypress aus.

Aktuelle Coverage-Werte:

| Metrik | Wert |
| --- | ---: |
| Statements | 85.66% |
| Branches | 82.52% |
| Functions | 91.66% |
| Lines | 85.55% |

Coverage-Reports:

- Backend: `backend/coverage/index.html`
- Frontend: `frontend/coverage/index.html`

## Security-Hinweise

- JWTs werden als HttpOnly Cookie `authToken` gesetzt.
- `tokenVersion` invalidiert alte Tokens nach sensiblen Profil-Aenderungen wie Passwort- oder E-Mail-Aenderung.
- Rate Limiting ist fuer Auth-Routen, Profil-Updates und Place-Creation konfiguriert.
- CORS erlaubt nur konfigurierte Origins aus `FRONTEND_URL` plus lokale Entwicklungs-Origins.
- CSRF-Schutz erfolgt in diesem Projekt ueber Origin-/Referer-Pruefung fuer mutierende Requests plus SameSite-Cookie-Strategie.
- SSE filtert Events nach Besitzer und Share-Berechtigung, bevor ein Client ein `place-created` Event erhaelt.
- CSP ist im Backend und im Next-Middleware-Layer gesetzt. `unsafe-inline` fuer Scripts bleibt im Frontend bewusst gesetzt, damit Next-/Hydration-Kompatibilitaet nicht bricht; im Backend wird inline JavaScript nicht freigegeben.

## Bekannte Hinweise und Limitations

- `frontend/index.html` und `frontend/src/App.jsx` existieren noch als Legacy/Vite-Reste. Die produktive App laeuft ueber Next.js unter `frontend/app/` und `frontend/components/`.
- Cypress kann je nach lokalem Binary-Cache Probleme machen. Die Specs liegen unter `frontend/cypress/e2e/`; in einem lokalen Lauf trat ein Cypress-Binary-Cache-Fehler mit `bad option: --smoke-test` auf.
- Nicht ins Repo gehoeren `.env`, `.next`, `node_modules`, `.DS_Store` und lokale Build-/Cache-Artefakte.
- Der Backend-Port ist in den Env-Beispielen `3003`; `backend/server.js` hat nur ohne gesetztes `PORT` einen Fallback auf `3001`.

## Architektur

Eine separate `docs/architecture.md` ist im aktuellen Repository nicht vorhanden. Die Architektur ist deshalb in dieser README dokumentiert:

- Next.js stellt die UI und API-Proxy-Routen bereit.
- Express kapselt Authentifizierung, Places, Sharing, Realtime und E-Mail-Queue.
- Prisma verwaltet die SQLite-Persistenz fuer User, Places, private Shares und Public Share Links.
- Auth, Places und Notification/Realtime sind als Bounded Contexts unter `backend/modules/`, `backend/middleware/` und `backend/lib/` getrennt.

## Troubleshooting

Wenn `npm run dev` mit `EADDRINUSE` fehlschlaegt, ist ein benoetigter Port bereits belegt. Pruefen:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:3003 -sTCP:LISTEN
```

Den betroffenen Prozess beenden:

```bash
kill <PID>
```

Falls alte Projektversionen noch auf `3001` laufen, ebenfalls pruefen:

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN
```

Wenn Login oder Registrierung nach Codeaenderungen merkwuerdig reagieren, den Browser-Tab neu oeffnen oder einen Hard Reload ausfuehren. Next.js muss ausserdem nach Aenderungen an `.env.local` neu gestartet werden.

## Technologie-Entscheidung: SSR/Next.js vs. Vite

Die App verwendet Next.js mit Server-Side Rendering (SSR), da SEO für die Reiseorte entscheidend ist – Suchmaschinen können den HTML-Inhalt sofort indexieren. Für Interaktivität (z.B. Karte und Formulare) reicht Client-Side Rendering aus, aber Vite wäre in der Entwicklung schneller und einfacher, bietet jedoch keine native SSR-Unterstützung.

**Beobachtung:** Die App erfordert sowohl gute SEO für die Reiseorte als auch hohe Interaktivität durch Karten und Formulare.

**Architekturentscheidung:** Next.js mit SSR wird verwendet, da es SEO durch serverseitiges Rendering unterstützt und gleichzeitig Client-Side Rendering für Interaktivität ermöglicht. Vite wäre schneller in der Entwicklung, bietet aber keine native SSR-Unterstützung.

## Backend Refactor: Bestandsaufnahme und Modulgrenzen

### Bestandsaufnahme des aktuellen Backends

Einen Ordner `backend/routes/` gibt es im aktuellen Stand nicht mehr. Die HTTP-Routen liegen bereits kontextbezogen unter `backend/modules/`; die folgenden Dateien ersetzen die früheren Route-Dateien.

| Datei | Verantwortung | Zugriff auf Daten anderer Bereiche? |
| --- | --- | --- |
| `backend/server.js` | Express-Setup, CORS, Cookies, Router-Mounting, SSE-Endpoint und Socket.IO-Gateway. | Nein; keine Prisma-Abfrage. |
| `backend/modules/auth/auth.routes.js` | HTTP-Endpunkte für Registrierung, Login, Logout und die aktuelle Identität. | Nein; delegiert vollständig an den Auth-Service. |
| `backend/modules/places/places.routes.js` | HTTP-Endpunkte zum Lesen, Anlegen, Ändern und Löschen eigener Orte. | Nein; delegiert vollständig an den Places-Service. |

Die Route-Handler enthalten keine direkte Geschäfts- oder Prisma-Logik: Sie lesen HTTP-Eingaben, rufen einen Service auf und übersetzen erwartete Fehler in HTTP-Statuscodes. Die Umwandlung von `req.params.id` in der Places-Route ist bewusst HTTP-Input-Validierung.

### Bounded Contexts

| Kontext | Einheitliche Begriffe und Verantwortlichkeit | Eigene Daten/Logik |
| --- | --- | --- |
| Auth & User | User, Registrierung, Login, Passwort, JWT und Sitzung | `User`, Passwort-Hash, JWT-Prüfung und Identität aus dem Cookie |
| Place Management | Ort, Kategorie, Koordinaten und Ownership | `Place`, Validierung und CRUD nur für die eigene `userId` |
| Notification & Realtime | E-Mail, Queue, SSE-Event und Broadcast | E-Mail-Template, In-Memory-Queue und verbundene SSE-Clients; keine eigene Datenbanktabelle |

Place Management erhält vom Auth-&-User-Kontext die authentifizierte `userId` und fragt für die Bestätigungs-E-Mail ausschließlich den freigegebenen Empfänger ab. Es übergibt an Notification & Realtime nur den gespeicherten Ort sowie Empfängername und -adresse; weder der Notification-Kontext noch Auth benötigt interne Place-Änderungslogik.

### Modulare Struktur

```text
backend/
├── modules/
│   ├── auth/
│   │   ├── auth.routes.js
│   │   └── auth.service.js
│   └── places/
│       ├── places.routes.js
│       └── places.service.js
├── middleware/authenticate.js
├── prisma/schema.prisma
└── server.js
```

### Service-Schnittstellen

`auth.service.js`

- öffentlich: `registerUser()`, `loginUser()`, `getUserNotificationRecipient()`, `setAuthCookie()`, `getAuthCookieOptions()`
- intern: `validateRegisterData()`, `createConflictError()`, `getJwtSecret()`

`places.service.js`

- öffentlich: `getPlacesForUser()`, `createPlace()`, `updatePlace()`, `deletePlace()`
- intern: `validatePlaceData()`, `buildPlacePayload()`

Der Auth-Service ist die einzige Schnittstelle zum `User`-Modell. Der Places-Service greift nur direkt auf `prisma.place` zu und bezieht E-Mail-Empfänger über `authService.getUserNotificationRecipient(userId)`; damit existiert kein direkter modulübergreifender Prisma-Zugriff mehr.

### Architektur-Analyse des aktuellen Stands

- Es gibt keine Route-Datei mit direktem `prisma.*`-Zugriff oder ausgelagerter Geschäftslogik. Authentifizierung, Validierung, Ownership-Prüfung und Persistenz liegen in den jeweiligen Services.
- `places.service.js` löst nach einem gespeicherten Ort ein SSE-Event und eine E-Mail aus. Das ist derzeit ein pragmatischer Application-Use-Case, koppelt Place Management aber an Infrastruktur; bei weiterer Größe sollte ein `PlaceCreated`-Event von separaten Notification-/Realtime-Handlern verarbeitet werden.
- `auth.service.js` enthält mit `setAuthCookie()` noch eine HTTP-nahe Funktion. Die Cookie-Optionen könnten später in einen HTTP-/Cookie-Adapter wandern; das ist keine Datenbank- oder Kontextverletzung.
- Socket.IO empfängt aktuell ein clientseitiges `new-place` und broadcastet es direkt. Der Kanal sollte langfristig nur Ereignisse verteilen, die nach erfolgreicher Persistenz serverseitig erzeugt wurden, damit kein nicht gespeicherter Ort als Ereignis erscheint.

### Prompt-Iterationen für den Refactor

1. Erste Iteration: „Lagere Validierung und Prisma-Abfrage der Place-Handler in `places.service.js` aus; die Routen sollen nur Request, Response und HTTP-Fehler behandeln.“ Ergebnis: Die CRUD-Use-Cases liegen im Places-Service, inklusive Ownership-Filter.
2. Zweite Iteration: „Prüfe Service-Dateien auf direkte Prisma-Zugriffe auf fremde Modelle und definiere dafür eine Service-Schnittstelle.“ Präzisierung: Der vorherige `include.user`-Zugriff im Places-Service wurde entfernt; für die E-Mail wird nun ausschließlich `authService.getUserNotificationRecipient(userId)` verwendet.

### Architektur-Review / Microservices-Vorbereitung

Die meisten eingehenden Abhängigkeiten hat derzeit die Authentifizierungs-Grenze: Beide Router verwenden `authenticate`, und der Places-Service nutzt eine klar begrenzte Auth-Service-Funktion. Das ist als gemeinsame Sicherheits- und Identitätsfunktion kein Warnsignal, solange Auth keine Place-Details zurückfordert. Am leichtesten wäre später Notification & Realtime auszulagern, weil dieser Bereich keine eigene Persistenz besitzt und bereits über „Ort wurde erstellt“ als Ereignis angesprochen werden kann.

## Echtzeit-Kommunikation

**Gibt es Daten in eurer App, die sich ändern können, während ein anderer Nutzer die Seite offen hat?**
Ja. Orte (`places`) können von anderen Nutzern angelegt oder gelöscht werden, während ein Nutzer die Seite geöffnet hat.

**Müssen Änderungen sofort sichtbar sein – oder reicht ein Reload?**
Für die Produktfunktionalität reicht technisch ein Reload oder gelegentliches Polling. Die Echtzeit-Integration ist hier eher als Lernübung eingebaut und nicht zwingend notwendig für den grundsätzlichen Betrieb.

**Ist die Kommunikation einseitig (Server → Client) oder bidirektional (beide senden)?**
Die App verwendet beides: SSE für serverseitige Push-Benachrichtigungen und socket.io für bidirektionale Events beim Erstellen neuer Orte.

**Wie viele Clients könnten gleichzeitig verbunden sein?**
In der aktuellen Architektur dürften es im Realbetrieb eher wenige Dutzend bis wenige Hundert gleichzeitig aktive Clients sein. Die App ist kein skalierender Echtzeit-Messenger, sondern ein kollaboratives Reiseplanungswerkzeug mit begrenzter Nutzerzahl.

**Technologieentscheidung**
- Keine Echtzeit nötig: Polling oder Reload reicht für den normalen Use-Case, weil Orte nicht im Sekundentakt geändert werden und synchronisierte Zusammenarbeit hier nur ein Netzeffekt ist.
- Wir bauen trotzdem SSE und socket.io als Lernübung ein und kennzeichnen sie ausdrücklich als „nicht produktiv notwendig".

### Implementierung
- `backend/server.js`: SSE-Endpoint `GET /api/events` hinzugefügt.
- `backend/modules/places/places.service.js`: Nach `createPlace()` wird ein SSE-Event `place-created` ausgelöst.
- `frontend/components/TravelTrackerApp.jsx`: `EventSource`-Listener öffnet eine Verbindung zum Backend, hört auf `place-created` und lädt die Liste bei neuen Daten nach.
- `frontend/components/TravelTrackerApp.jsx`: `socket.io-client` sendet beim Anlegen eines neuen Ortes das Event `new-place` an den Server.

### Prompt-Iterationen
- SSE erste Iteration: allgemeine Anforderung formuliert. Zweite Iteration: konkretes Event `place-created` benannt und die Anforderung zur Liste-Aktualisierung ohne Reload präzisiert.
- WebSockets erste Iteration: Beschreibung des generischen Broadcasts. Zweite Iteration: konkretes Event `new-place`, Verwendung von `socket.broadcast.emit` und exakte Aktualisierungslogik im Frontend ergänzt.
- E-Mail erste Iteration: Resend + React Email Template anstoßen. Zweite Iteration: Template konkretisiert mit Ortstitel, Nutzername, Deep Link, und Backend-Queue, damit der Request nicht auf den Mailversand warten muss.

### SSE vs WebSockets
Kriterium | SSE | WebSockets
--- | --- | ---
Richtung | Server → Client | Bidirektional
Komplexität im Code | Gering | Mittel
Reconnect bei Verbindungsabbruch | Automatisch (Browser) | Manuell / socket.io übernimmt
Geeignet für mein Projekt | Ja, fuer serverseitige Updates an berechtigte Clients. | Ja, fuer bidirektionale Events zwischen Client und Server. |
Warum? | Die App benötigt vor allem Server-Updates, wenn andere Nutzer neue Orte anlegen. | WebSockets sind praktisch, weil der Client beim Erstellen des Ortes aktiv ein Ereignis abschickt und andere Browser sofort informiert. |

**Was passiert beim Server-Neustart?**
Verbundene Clients verlieren die Verbindung. `EventSource` reconnectt automatisch nach dem Neustart, und socket.io bemüht sich ebenfalls um Reconnect. Während der Downtime gehen währenddessen eintreffende Aktualisierungen verloren, die nach Wiederverbindung nicht automatisch nachgeholt werden.

### Agenten-Einschätzung
In dieser App profitieren vor allem kollaborative Änderungen wie Orte, die von mehreren Nutzern gleichzeitig erstellt oder geteilt werden, von Echtzeit-Kommunikation. Einzelne Lesezugriffe auf die Place-Liste oder persönliche Orterstellung sind dagegen eher geeignet für einfaches Polling, weil die Datenmenge klein ist und der Nutzer kein sofortiges Feedback wie bei einem Chat erwartet. Da unser Frontend bisher vor allem neue Orte anlegt und die Liste lädt, würde ein 5-Sekunden-Polling hier ehrlicher sein, wenn die App keine echte Multi-User-Kollaboration braucht. Ich stimme der Einschätzung zu: Echtzeit ist für dieses Projekt nützlich, aber nicht zwingend, solange die Aktualisierungsanforderung moderat bleibt.

### Benachrichtigungsanalyse
Event | AppNotification sinnvoll? | Typ | Kanal | Begründung
--- | --- | --- | --- | ---
Neuer Ort angelegt | Teilweise | Transactional | E-Mail | Eine Bestätigung an den Ersteller ist sinnvoll; geteilte Orte werden zusätzlich über Sharing- und Realtime-Mechanismen sichtbar.
Ort gelöscht | Nein | - | keiner | In der aktuellen App betrifft Löschen nur den eigenen Nutzer, eine zusätzliche Notification wäre redundant.
Passwort oder E-Mail geändert | Teilweise | Security | keiner im aktuellen Stand | Alte Tokens werden über `tokenVersion` invalidiert; eine zusätzliche Sicherheitsmail wäre ein möglicher Ausbau.

- Gibt es Events, bei denen der Nutzer sofort reagieren muss – oder reicht eine Mail, die er später liest? 
  - In unserem Modell reicht eine Mail später; es gibt keinen dringenden Assign- oder Sicherheits-Alarm, der unmittelbares Handeln erfordert.
- Habt ihr Marketing-Content geplant, der ein explizites Opt-in braucht? 
  - Nein, es gibt keinen Marketing-Content im aktuellen Projekt.
- Wie viele verschiedene Events würden pro Stunde realistisch Notifications auslösen? 
  - Realistisch sind es wenige E-Mail-Events pro Stunde, typischerweise 0–5 bei aktiver Nutzung; es handelt sich nicht um eine hochfrequente Benachrichtigungsplattform.

**Kanalentscheidung**
Wir setzen für den ersten Event `Neuer Ort angelegt` auf Transactional E-Mail, weil dies eine klare Nutzerbestätigung liefert und keinen aktiven Push-Kanal erfordert. Web Push wäre aktuell overkill, weil das App-Design keine echte Multi-User-Zusammenarbeit oder zeitkritische Zuweisung enthält.

**Implementierung**
Die E-Mail wird in `backend/lib/emailQueue.js` asynchron in eine lokale Queue gelegt und nicht im `POST /places`-Handler synchron versendet. Das Template wird mit React Email gebaut und der API-Key aus `backend/.env` geladen. Die Mail enthält den Ortstitel, die Kategorie, die Koordinaten und einen direkten Deep Link zum Landing-Page-Dashboard mit `?place=<id>`.

## Ressourcen und API-Struktur

**Ressourcen:** places (Reiseorte)

**Hierarchie:** Keine Hierarchie, da alle Orte flach organisiert sind.

**Entschiedene Struktur:** Flaches Design mit Query-Parametern (/places?category=stadt). Begründung: Da keine komplexe Hierarchie vorliegt, ist ein flaches Design einfacher und ermöglicht flexible Filterung nach Kategorien oder anderen Attributen ohne unnötige Verschachtelung.

## Datenmodell

```
users                          places
-------------------------      --------------------------------
id (PK, not null)              id (PK, not null)
email (not null, unique)       title (not null)
name (not null)                description
passwordHash (not null)        category
tokenVersion (not null)        tripName
createdAt (not null)           status
                                moodTags
                                lat (not null)
                                lng (not null)
                                userId (FK -> users.id, not null)

shared_places                  public_place_shares
-------------------------      --------------------------------
id (PK, not null)              id (PK, not null)
placeId (FK, not null)         placeId (FK, unique, not null)
recipientId (FK, not null)     tokenHash (unique, not null)
sharedById (FK, not null)      createdAt (not null)
createdAt (not null)           disabledAt
```

**Beziehungen:** users 1:n places (ein User kann viele Places haben); places 1:n shared_places fuer private Freigaben; places 1:1 public_place_shares fuer optionale Public-Share-Links.

**Felder, die nicht leer sein dürfen:** id, email, name, passwordHash, tokenVersion, createdAt (users); id, title, lat, lng, userId (places); alle Foreign Keys in shared_places; id, placeId, tokenHash, createdAt in public_place_shares.

## Prisma und Persistenz

Das Backend nutzt Prisma als ORM und SQLite als Entwicklungsdatenbank. Die Datenbankverbindung liegt in `backend/.env`:

```txt
DATABASE_URL="file:./dev.db"
```

Die Datei `.env` ist in `backend/.gitignore` eingetragen und soll nicht committet werden. Das Prisma-Schema liegt unter `backend/prisma/schema.prisma`; die Migrationen erstellen `User`, `Place`, `SharedPlace`, `PublicPlaceShare` und `tokenVersion`.

Die Place-Use-Cases verwenden Prisma im Service-Layer:

- `getPlacesForUser()`: lädt eigene Orte und fuer den Nutzer freigegebene Orte.
- `createPlace()`: erstellt einen Ort mit `prisma.place.create()`.
- `updatePlace()` und `deletePlace()`: verwenden einen Ownership-Filter mit `id` und `userId`.
- `sharePlace()`, `unsharePlace()` und Public-Share-Funktionen kapseln private Freigaben und oeffentliche Share-Links.

Die alten Orte aus `backend/places.json` wurden einmalig mit `npm run import:places` in die SQLite-Datenbank importiert.

## Test-Pyramide

Ebene | Was testen wir bei uns? | Tool
--- | --- | ---
Unit | Validierungslogik für E-Mail/Passwort und korrekte Eingaben | Vitest
Integration | `POST /api/auth/login`/`register` und `GET /places` mit Auth-Token | Vitest
E2E | Login-Flow, Registrieren und Seiten-Weiterleitung | Cypress

Kernrisiken:

1. Authentifizierung und Token-Prüfung: Wenn Login/Logout oder JWT-Verifikation brechen, können Nutzer nicht mehr auf ihre eigenen Orte zugreifen.
2. Ownership/DB-Filter: Wenn die `userId`-Prüfung in `GET /places`/`DELETE /places/:id` ausfällt, könnten Nutzer fremde Daten sehen oder löschen.

## Test-Iterationen

1. Erste Iteration: Testpyramide und Unit-Tests planen; reine Validierungsfunktionen extrahieren und mit Vitest absichern.
2. Zweite Iteration: Cypress für End-to-End-Tests installieren und den kritischen Login-/Registrierungsflow inklusive Fehlermeldung absichern.

## Prompt-Iterationen

1. Erste Iteration: Prisma mit SQLite einrichten und das Datenmodell `users` und `places` als verknuepfte Modelle beschreiben.
2. Zweite Iteration: Die bisherigen Mock-Daten-Handler ersetzen, Fehlerbehandlung mit `try/catch` ergaenzen und einen Demo-User einfuehren, weil das Frontend beim Erstellen eines Ortes noch keine `userId` sendet.

## Persistenz-Test

Testablauf:

1. Backend starten: `cd backend && npm start`
2. Neuen Ort per `POST /places` anlegen.
3. Server mit `Ctrl+C` stoppen.
4. Backend erneut starten.
5. `GET /places` ausfuehren.

Ergebnis: Der neu angelegte Ort `Persistenz-Test` war nach dem Serverneustart weiterhin vorhanden. Der Test ist damit bestanden, weil der Eintrag in SQLite gespeichert wurde und nicht mehr nur in einem In-Memory-Array liegt.

## Architekturentscheidung Datenhaltung

In die Datenbank gehoeren dauerhaft gespeicherte App-Daten wie Benutzer und Reiseorte inklusive Titel, Beschreibung, Kategorie und Koordinaten. Redis waere langfristig eher fuer kurzlebige Daten sinnvoll, zum Beispiel Sessions, Rate-Limits oder Caches. Ein Cloud Object Store wie S3 waere sinnvoll, falls zu Reiseorten spaeter Bilder oder andere groessere Dateien gespeichert werden.

## Authentifizierung

Das Express-Backend stellt zwei Auth-Routen bereit:

- `POST /api/auth/register`: legt einen neuen User an und speichert das Passwort als bcrypt-Hash.
- `POST /api/auth/login`: prueft E-Mail und Passwort, erstellt ein JWT mit `userId`, `email` und `tokenVersion` und setzt es fuer 24 Stunden als HttpOnly Cookie `authToken`.

Der JWT-Secret liegt in `backend/.env` als `JWT_SECRET`. Bei bereits vergebener E-Mail antwortet das Backend mit `409`. Bei falscher E-Mail oder falschem Passwort antwortet es immer identisch mit `401` und der Meldung `E-Mail oder Passwort ungültig.`

## Sicherheitsstatus der Place-Endpunkte

Die früheren offenen Mock-Routen sind durch die aktuelle Modulstruktur ersetzt. Alle Place-Endpunkte verwenden `authenticate`; der Service erhält die `userId` ausschließlich aus dem validierten JWT-Payload und filtert Datenbankzugriffe nach Ownership.

| Endpoint | Anonym nutzbar? | Ownership-Schutz | Aktuelle Stelle |
| --- | --- | --- | --- |
| `GET /places` | Nein | laedt eigene Orte plus freigegebene Orte fuer `recipientId` | `modules/places/places.routes.js`, `places.service.js` |
| `POST /places` | Nein | neuer Ort erhält die `userId` des Tokens | `modules/places/places.routes.js`, `places.service.js` |
| `PUT /places/:id` | Nein | Lookup mit `id` und `userId` vor dem Update | `modules/places/places.routes.js`, `places.service.js` |
| `DELETE /places/:id` | Nein | `deleteMany({ where: { id, userId } })` | `modules/places/places.routes.js`, `places.service.js` |
| `POST /places/:id/share` | Nein | nur Owner kann private Freigaben erstellen | `modules/places/places.routes.js`, `places.service.js` |
| `DELETE /places/:id/share/:shareId` | Nein | nur Owner kann eigene Freigaben entfernen | `modules/places/places.routes.js`, `places.service.js` |
| `POST /places/:id/public-share` | Nein | nur Owner kann Public-Share-Link erstellen | `modules/places/places.routes.js`, `places.service.js` |
| `GET /places/public-shares/:token` | Ja | nur ueber nicht deaktivierten Token-Hash | `modules/places/places.routes.js`, `places.service.js` |

## Sicherheitskonzept

1. Sicherheitslücken vor der Authentifizierung
- Vorher waren die `places`-Routen ohne Authentifizierung zugänglich. `GET /places`, `POST /places` und `DELETE /places/:id` konnten von anonymen Nutzern aufgerufen werden.
- Dadurch waren sowohl Lesefunktionen als auch Schreib- und Löschvorgänge ohne Nutzerprüfung möglich.

2. JWT-Authentifizierung
- Das Backend erstellt bei erfolgreichem Login einen JWT mit `userId`, `email` und `tokenVersion`.
- Dieser Token wird als HttpOnly-Cookie `authToken` ausgegeben und bei jedem Request automatisch mitgesendet.
- Backend-Validierung erfolgt über `jwt.verify()`.
- Bei sensiblen Profil-Aenderungen wird `tokenVersion` erhoeht; alte Tokens passen dann nicht mehr zum User-Datensatz und werden abgewiesen.

3. Passwort-Hashing mit bcrypt
- Passwörter werden nicht im Klartext gespeichert.
- Beim Registrieren erzeugt `bcrypt.hash(password, 12)` einen sicheren Passwort-Hash.
- Beim Login wird `bcrypt.compare(password, passwordHash)` genutzt, um die Eingabe zu prüfen.

4. Ownership-Checks
- Der Zugriff auf `places` wurde auf den aktuellen Benutzer eingeschränkt.
- `userId` wird beim Erstellen eines Ortes gesetzt und bei Lese-/Löschoperationen geprüft.
- Nur der Benutzer, dem ein Place gehört, kann diesen Place ändern oder löschen.

5. Warum manipulierte JWTs nicht funktionieren
- JWTs sind mit einem geheimen Schlüssel signiert (`JWT_SECRET`).
- Jede Veränderung am Token ändert die Signatur und macht den Token ungültig.
- Das Backend prüft die Signatur; manipulierte oder abgelaufene Tokens werden abgewiesen.

6. Manuelle Testergebnisse
- Ohne Login: Weiterleitung zu `/login` bei geschützten Seiten.
- Login mit korrekten Daten: erfolgreicher Zugriff auf `GET /places` und Erstellen eines Ortes.
- Login mit falschen Daten: `401 Unauthorized` und keine Sitzung.
- Logout: Cookie wird gelöscht, danach erneute Weiterleitung zu `/login`.

## OWASP Backend Bewertung

| OWASP | Status | Dateien | Relevante Zeilen | Konkrete Fixes |
| --- | --- | --- | --- | --- |
| A01 Broken Access Control | Abgedeckt | `backend/middleware/authenticate.js`, `backend/modules/places/places.service.js` | Auth-Middleware und Ownership-Filter | Auth-Middleware und Ownership-Checks beibehalten; neue Place-Routen immer schützen. |
| A02 Cryptographic Failures | Abgedeckt mit Produktionsanforderung | `backend/modules/auth/auth.service.js`, `backend/middleware/authenticate.js` | JWT-Secret-Pruefung und Cookie-Optionen | `JWT_SECRET` in Produktion mit mindestens 32 Zeichen setzen; HTTPS fuer sichere Cookies nutzen. |
| A03 Injection | Abgedeckt | `backend/modules/*/*.service.js` | Prisma-Queries | Prisma beibehalten; Validierung bei wachsenden Eingabeformaten schema-basiert ergänzen. |
| A07 Authentication Failures | Teilweise abgedeckt | `backend/server.js`, `backend/modules/auth/auth.service.js`, `backend/middleware/authenticate.js` | Login, JWT-Prüfung, `tokenVersion`, Auth-/Profil-Rate-Limits | Account-Lockout waere ein moeglicher naechster Ausbau; Rate-Limits und Token-Invalidierung sind vorhanden. |

# travel-tracker

## Technologie-Entscheidung: SSR/Next.js vs. Vite

Unsere App verwendet Next.js mit Server-Side Rendering (SSR), da SEO für die Reiseorte entscheidend ist – Suchmaschinen können den HTML-Inhalt sofort indexieren. Für Interaktivität (z.B. Karte und Formulare) reicht Client-Side Rendering aus, aber Vite wäre in der Entwicklung schneller und einfacher, bietet jedoch keine native SSR-Unterstützung.

**Beobachtung:** Die App erfordert sowohl gute SEO für die Reiseorte als auch hohe Interaktivität durch Karten und Formulare.

**Architekturentscheidung:** Next.js mit SSR wird verwendet, da es SEO durch serverseitiges Rendering unterstützt und gleichzeitig Client-Side Rendering für Interaktivität ermöglicht. Vite wäre schneller in der Entwicklung, bietet aber keine native SSR-Unterstützung.

**Beobachtung:** Die App erfordert sowohl gute SEO für die Reiseorte als auch hohe Interaktivität durch Karten und Formulare.

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
- `backend/routes/places.js`: Nach `POST /places` wird ein SSE-Event `place-created` ausgelöst.
- `frontend/components/TravelTrackerApp.jsx`: `EventSource`-Listener öffnet eine Verbindung zum Backend, hört auf `place-created` und lädt die Liste bei neuen Daten nach.
- `frontend/components/TravelTrackerApp.jsx`: `socket.io-client` sendet beim Anlegen eines neuen Ortes das Event `new-place` an den Server.

### Prompt-Iterationen
- SSE erste Iteration: allgemeine Anforderung formuliert. Zweite Iteration: konkretes Event `place-created` benannt und die Anforderung zur Liste-Aktualisierung ohne Reload präzisiert.
- WebSockets erste Iteration: Beschreibung des generischen Broadcasts. Zweite Iteration: konkretes Event `new-place`, Verwendung von `socket.broadcast.emit` und exakte Aktualisierungslogik im Frontend ergänzt.

### SSE vs WebSockets
Kriterium | SSE | WebSockets
--- | --- | ---
Richtung | Server → Client | Bidirektional
Komplexität im Code | Gering | Mittel
Reconnect bei Verbindungsabbruch | Automatisch (Browser) | Manuell / socket.io übernimmt
Geeignet für unser Projekt | ✅ | ✅
Warum? | Die App benötigt vor allem Server-Updates, wenn andere Nutzer neue Orte anlegen. | WebSockets sind praktisch, weil der Client beim Erstellen des Ortes aktiv ein Ereignis abschickt und andere Browser sofort informiert.

**Was passiert beim Server-Neustart?**
Verbundene Clients verlieren die Verbindung. `EventSource` reconnectt automatisch nach dem Neustart, und socket.io bemüht sich ebenfalls um Reconnect. Während der Downtime gehen währenddessen eintreffende Aktualisierungen verloren, die nach Wiederverbindung nicht automatisch nachgeholt werden.

### Agenten-Einschätzung
Langfristig würden in dieser App vor allem kollaborative Änderungen wie Reiseort-Updates, gemeinsame Listen oder Benachrichtigungen von mehreren Nutzern von Echtzeit-Kommunikation profitieren. Reines Lesen und gelegentliches Anlegen von Orten ist dagegen einfacher und ehrlicher mit Polling alle 5 Sekunden gelöst, weil die Datenmenge niedrig ist und es keine zwingende Live-Interaktion wie bei Chat oder Multiplayer gibt. Ich stimme der Einschätzung zu: Echtzeit ist lehrreich und wertvoll für Benutzerfeedback, aber es ist nicht die technisch notwendige Grundlage für die Kernfunktionalität.

## Ressourcen und API-Struktur

**Ressourcen:** places (Reiseorte)

**Hierarchie:** Keine Hierarchie, da alle Orte flach organisiert sind.

**Entschiedene Struktur:** Flaches Design mit Query-Parametern (/places?category=stadt). Begründung: Da keine komplexe Hierarchie vorliegt, ist ein flaches Design einfacher und ermöglicht flexible Filterung nach Kategorien oder anderen Attributen ohne unnötige Verschachtelung.

## Datenmodell

```
users                         places
------------------------      -------------------------------
id (PK, not null)             id (PK, not null)
email (not null, unique)      title (not null)
name (not null)               description
                               category
                               lat (not null)
                               lng (not null)
                               userId (FK -> users.id, not null)
```

**Beziehungen:** users 1:n places (ein User kann viele Places haben).

**Felder, die nicht leer sein dürfen:** id, email, name (users); id, title, lat, lng, userId (places).

## Prisma und Persistenz

Das Backend nutzt Prisma als ORM und SQLite als Entwicklungsdatenbank. Die Datenbankverbindung liegt in `backend/.env`:

```txt
DATABASE_URL="file:./dev.db"
```

Die Datei `.env` ist in `backend/.gitignore` eingetragen und soll nicht committet werden. Das Prisma-Schema liegt unter `backend/prisma/schema.prisma`; die erste Migration erstellt die Tabellen `User` und `Place`.

Die CRUD-Handler fuer `places` wurden von Mock-/JSON-Daten auf Prisma-Queries umgestellt:

- `GET /places`: laedt alle Orte mit `prisma.place.findMany()`.
- `POST /places`: erstellt einen Ort mit `prisma.place.create()`. Da es noch kein Login gibt, wird ein Demo-User per `prisma.user.upsert()` angelegt bzw. wiederverwendet.
- `DELETE /places/:id`: loescht einen Ort mit `prisma.place.delete()`.

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
- `POST /api/auth/login`: prueft E-Mail und Passwort, erstellt ein JWT mit `userId` und `email` und setzt es fuer 24 Stunden als HttpOnly Cookie `authToken`.

Der JWT-Secret liegt in `backend/.env` als `JWT_SECRET`. Bei bereits vergebener E-Mail antwortet das Backend mit `409`. Bei falscher E-Mail oder falschem Passwort antwortet es immer identisch mit `401` und der Meldung `E-Mail oder Passwort ungültig.`

## Ursprüngliche Sicherheitsluecken

Vor der Auth-Implementierung lagen mehrere `places`-Routen offen: `GET /places`, `POST /places` und `DELETE /places/:id` konnten anonym aufgerufen werden. Es fehlte eine Auth-Middleware, die das `authToken` prüft, und es fehlten Ownership-Checks, die sicherstellen, dass `Place.userId` nur zum angemeldeten Nutzer passt.

| Route | Anonymer Nutzer kann Daten lesen? | Anonymer Nutzer kann Daten veraendern? | Anonymer Nutzer kann Daten loeschen? | Konkrete Stelle |
| --- | --- | --- | --- | --- |
| `GET /places` | Ja. Die Route liefert alle Places inklusive User-Daten aus. | Nein. | Nein. | `backend/routes/places.js`: `prisma.place.findMany({ orderBy: { id: 'asc' }, include: { user: { select: { id, email, name } } } })` |
| `POST /places` | Indirekt ja, weil die Antwort den neu angelegten Place inklusive User-Daten zurueckgibt. | Ja. Jeder Request mit `lat`, `lng` und `title` kann einen neuen Datensatz anlegen. | Nein. | `backend/routes/places.js`: `getDefaultUser()` nutzt `prisma.user.upsert(...)`, danach erstellt `prisma.place.create(...)` einen Place mit `userId: user.id`. |
| `DELETE /places/:id` | Nein. | Nein. | Ja. Jeder Request mit einer numerischen ID kann einen Place loeschen. | `backend/routes/places.js`: `prisma.place.delete({ where: { id } })` loescht ohne User-Pruefung. |
| `POST /api/auth/register` | Teilweise. Die Route prueft mit `prisma.user.findUnique({ where: { email } })`, ob eine E-Mail existiert, und antwortet bei Treffer mit `409`. Dadurch kann ein anonymer Nutzer E-Mail-Adressen testen. | Ja. Ein anonymer Nutzer kann neue User mit `prisma.user.create(...)` anlegen. | Nein. | `backend/routes/auth.js`: `prisma.user.findUnique(...)` und `prisma.user.create(...)`. |
| `POST /api/auth/login` | Nur mit gueltigen Zugangsdaten. Die Route liest intern per `prisma.user.findUnique(...)` den User und gibt bei erfolgreichem Passwortvergleich `id`, `email` und `name` zurueck. Ohne gueltige Zugangsdaten werden keine User-Daten ausgegeben. | Nein. Es wird kein Datenbankdatensatz veraendert; nur ein Cookie gesetzt. | Nein. | `backend/routes/auth.js`: `prisma.user.findUnique(...)`, `bcrypt.compare(...)`, `jwt.sign(...)`, `res.cookie('authToken', token, ...)`. |

Konkrete Beispiele:

- `GET /places` ist oeffentlich. Ein anonymer Request bekommt alle Reiseorte, weil `router.get('/')` direkt `prisma.place.findMany(...)` ausfuehrt und keine Auth-Pruefung davor liegt.
- `POST /places` ist oeffentlich. Ein anonymer Request kann neue Orte schreiben, weil `router.post('/')` nach der einfachen Feldvalidierung sofort `getDefaultUser()` und danach `prisma.place.create(...)` ausfuehrt. Der neue Ort wird immer dem Demo-User `demo@example.com` zugeordnet, nicht dem angemeldeten User.
- `DELETE /places/:id` ist oeffentlich. Ein anonymer Request kann beliebige Orte per ID loeschen, weil `router.delete('/:id')` nur prueft, ob die ID eine Zahl ist, und dann `prisma.place.delete({ where: { id } })` ausfuehrt.
- Es fehlt Autorisierung auf Besitzerebene. Selbst wenn spaeter eine Login-Pruefung vor `DELETE /places/:id` gesetzt wird, muesste die Query zusaetzlich sicherstellen, dass der Place dem angemeldeten User gehoert, zum Beispiel ueber `userId`. Aktuell wird bei `delete` nur nach `id` gefiltert.

## Sicherheitskonzept

1. Sicherheitslücken vor der Authentifizierung
- Vorher waren die `places`-Routen ohne Authentifizierung zugänglich. `GET /places`, `POST /places` und `DELETE /places/:id` konnten von anonymen Nutzern aufgerufen werden.
- Dadurch waren sowohl Lesefunktionen als auch Schreib- und Löschvorgänge ohne Nutzerprüfung möglich.

2. JWT-Authentifizierung
- Das Backend erstellt bei erfolgreichem Login einen JWT mit `userId` und `email`.
- Dieser Token wird als HttpOnly-Cookie `authToken` ausgegeben und bei jedem Request automatisch mitgesendet.
- Backend-Validierung erfolgt über `jwt.verify()`.

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
| A01 Broken Access Control | Abgedeckt | `backend/middleware/authenticate.js`, `backend/routes/places.js` | `authenticate.js` Zeilen 14-22, `places.js` Zeilen 7-13, 39-57, 89-99 | Auth-Middleware und Ownership-Checks beibehalten; neue Routen immer mit `authenticate` schützen. |
| A02 Cryptographic Failures | Verbesserungswürdig | `backend/routes/auth.js` | Zeilen 62-64, 109-124, 145 | `JWT_SECRET` in `.env` verwenden; in Produktion `secure: true`, `sameSite: 'strict'` und HTTPS erzwingen. |
| A03 Injection | Abgedeckt | `backend/routes/places.js` | Zeilen 13, 57, 99 | Prisma verhindert SQL-Injection; zusätzlich strenge Eingabevalidierung mit `zod`/`joi` oder Schema-Validierung ergänzen. |
| A07 Authentication Failures | Verbesserungswürdig | `backend/routes/auth.js`, `backend/middleware/authenticate.js` | `auth.js` Zeilen 109-124, `authenticate.js` Zeilen 14-22 | Login-Rate-Limitierung, Account-Lockout und Token-Rotationsstrategie ergänzen. |

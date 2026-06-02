# travel-tracker

## Technologie-Entscheidung: SSR/Next.js vs. Vite

Unsere App verwendet Next.js mit Server-Side Rendering (SSR), da SEO für die Reiseorte entscheidend ist – Suchmaschinen können den HTML-Inhalt sofort indexieren. Für Interaktivität (z.B. Karte und Formulare) reicht Client-Side Rendering aus, aber Vite wäre in der Entwicklung schneller und einfacher, bietet jedoch keine native SSR-Unterstützung.

**Beobachtung:** Die App erfordert sowohl gute SEO für die Reiseorte als auch hohe Interaktivität durch Karten und Formulare.

**Architekturentscheidung:** Next.js mit SSR wird verwendet, da es SEO durch serverseitiges Rendering unterstützt und gleichzeitig Client-Side Rendering für Interaktivität ermöglicht. Vite wäre schneller in der Entwicklung, bietet aber keine native SSR-Unterstützung.

**Prompt-Iterationen:** Die Entscheidung basiert auf der Analyse von SEO-Bedarf (für Suchmaschinen-Indexierung) und Interaktivitätsanforderungen (für Benutzererfahrung), wobei Next.js als ausgewogenste Lösung identifiziert wurde.

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

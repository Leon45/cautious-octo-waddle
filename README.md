# ✨ Persönlicher Assistent

Eine Web-App für den Alltag: **KI-Chat** (Claude), **Aufgaben & Erinnerungen**, **Notizen & Wissen** und **Karteikarten für die Klausurvorbereitung** (z. B. VWL, Steuerrecht, Englisch C1).

Der Chat kann selbstständig handeln: Sag ihm „Erinnere mich morgen an die Steuererklärung“ und er legt die Aufgabe an, „Merk dir …“ speichert eine Notiz, „Erstelle Karteikarten zu Preiselastizität“ baut ein komplettes Lern-Deck.

## Funktionen

| Bereich | Beschreibung |
|---|---|
| 💬 **Chat** | Streaming-Chat mit Claude (`claude-opus-4-8`), Verlauf bleibt gespeichert. Der Assistent nutzt Werkzeuge, um Aufgaben, Notizen und Karteikarten direkt anzulegen. |
| ✅ **Aufgaben** | To-dos mit Fälligkeitsdatum, „Jetzt dran“-Sektion, überfällige Aufgaben werden rot markiert. |
| 📝 **Notizen** | Notizen mit Schlagwörtern und Volltextsuche – dein persönliches Gedächtnis. |
| 🎓 **Lernen** | Karteikarten-Decks mit Abfragemodus (richtig/falsch-Statistik). Decks von Hand anlegen oder vom Chat generieren lassen. |

Alle Daten liegen lokal in einer SQLite-Datenbank (`server/data/assistant.db`).

## Voraussetzungen

- Node.js ≥ 20
- Ein [Anthropic-API-Key](https://platform.claude.com/) für den KI-Chat (Aufgaben, Notizen und Lernen funktionieren auch ohne)

## Einrichtung

```bash
# 1. Abhängigkeiten installieren
npm install
npm run install:all

# 2. API-Key hinterlegen
cp .env.example .env
# .env öffnen und ANTHROPIC_API_KEY eintragen

# 3. Entwicklung starten (Server auf :3001, Web auf :5173)
npm run dev
```

Dann http://localhost:5173 im Browser öffnen.

### Produktion

```bash
npm run build   # baut Frontend und Server
npm start       # ein Server auf http://localhost:3001 liefert App + API aus
```

## Technik

- **Backend:** Node.js, Express, better-sqlite3, TypeScript (`server/`)
- **Frontend:** React, Vite, TypeScript (`web/`)
- **KI:** `@anthropic-ai/sdk` mit Tool Runner — Claude erhält Werkzeuge (`create_task`, `search_notes`, `create_flashcards`, …) und die Antworten werden per Server-Sent Events in den Browser gestreamt.

## API-Überblick

| Methode & Pfad | Zweck |
|---|---|
| `POST /api/chat` | Chat-Nachricht senden (SSE-Stream) |
| `GET/DELETE /api/chat/history` | Verlauf lesen / löschen |
| `GET/POST/PATCH/DELETE /api/tasks` | Aufgaben verwalten |
| `GET/POST/PATCH/DELETE /api/notes` | Notizen verwalten (`?q=` für Suche) |
| `GET/POST/DELETE /api/learn/decks` | Karteikarten-Decks |
| `GET/POST /api/learn/decks/:id/cards` | Karten eines Decks |
| `POST /api/learn/cards/:id/review` | Abfrage-Ergebnis speichern |

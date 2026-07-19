import Anthropic from "@anthropic-ai/sdk";
import { betaTool } from "@anthropic-ai/sdk/helpers/beta/json-schema";
import * as db from "./db";

const MODEL = "claude-opus-4-8";

export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "tool"; label: string }
  | { type: "error"; message: string }
  | { type: "done" };

function systemPrompt(): string {
  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Berlin",
  });
  return `Du bist ein persönlicher Assistent und antwortest immer auf Deutsch (außer der Nutzer wünscht eine andere Sprache, z. B. beim Englischlernen).

Heute ist ${today}.

Du hilfst bei vier Dingen:
1. Allgemeine Fragen beantworten und Texte schreiben.
2. Aufgaben verwalten: Wenn der Nutzer eine Erledigung, einen Termin oder eine Erinnerung erwähnt ("erinnere mich an …", "ich muss noch …"), lege mit create_task eine Aufgabe an. Datumsangaben wie "morgen" oder "nächsten Freitag" rechnest du ins Format YYYY-MM-DD um. Mit list_tasks siehst du offene Aufgaben, mit complete_task hakst du sie ab.
3. Notizen: Wenn der Nutzer etwas festhalten möchte ("merk dir …", "notier …"), speichere es mit create_note. Mit search_notes findest du gespeichertes Wissen wieder – nutze das, bevor du sagst, dass du etwas nicht weißt.
4. Klausurvorbereitung (z. B. VWL, Steuerrecht, Englisch C1): Erkläre Konzepte verständlich, stelle Übungsfragen, korrigiere Antworten und gib konstruktives Feedback. Auf Wunsch erstellst du mit create_flashcards Karteikarten-Decks; formuliere die Karten präzise (Vorderseite: Frage/Begriff, Rückseite: knappe, korrekte Antwort).

Nutze Werkzeuge nur, wenn die Nachricht des Nutzers das nahelegt – bei reinen Wissensfragen antwortest du direkt. Antworte freundlich und kompakt.`;
}

function buildTools(emit: (event: ChatEvent) => void) {
  return [
    betaTool({
      name: "create_task",
      description:
        "Legt eine neue Aufgabe (To-do) für den Nutzer an. Nutze dies, wenn der Nutzer etwas erledigen möchte oder um eine Erinnerung bittet.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Kurzer Aufgabentitel" },
          due_date: {
            type: "string",
            description: "Fälligkeitsdatum im Format YYYY-MM-DD, falls genannt",
          },
        },
        required: ["title"],
      } as const,
      run: (input: { title: string; due_date?: string }) => {
        const task = db.createTask(input.title, input.due_date ?? null);
        emit({
          type: "tool",
          label: `Aufgabe angelegt: „${task.title}“${task.due_date ? ` (fällig ${task.due_date})` : ""}`,
        });
        return JSON.stringify(task);
      },
    }),
    betaTool({
      name: "list_tasks",
      description: "Listet alle Aufgaben des Nutzers auf (offene und erledigte).",
      inputSchema: { type: "object", properties: {} } as const,
      run: () => JSON.stringify(db.listTasks()),
    }),
    betaTool({
      name: "complete_task",
      description: "Markiert eine Aufgabe anhand ihrer ID als erledigt.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID der Aufgabe" },
        },
        required: ["id"],
      } as const,
      run: (input: { id: number }) => {
        const task = db.updateTask(input.id, { done: true });
        if (!task) return `Fehler: Aufgabe mit ID ${input.id} wurde nicht gefunden.`;
        emit({ type: "tool", label: `Aufgabe erledigt: „${task.title}“` });
        return JSON.stringify(task);
      },
    }),
    betaTool({
      name: "create_note",
      description:
        "Speichert eine Notiz für den Nutzer. Nutze dies, wenn der Nutzer sich etwas merken oder notieren möchte.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Überschrift der Notiz" },
          content: { type: "string", description: "Inhalt der Notiz" },
          tags: { type: "string", description: "Kommagetrennte Schlagwörter, z. B. 'vwl, klausur'" },
        },
        required: ["title", "content"],
      } as const,
      run: (input: { title: string; content: string; tags?: string }) => {
        const note = db.createNote(input.title, input.content, input.tags ?? "");
        emit({ type: "tool", label: `Notiz gespeichert: „${note.title}“` });
        return JSON.stringify(note);
      },
    }),
    betaTool({
      name: "search_notes",
      description:
        "Durchsucht die gespeicherten Notizen des Nutzers (Titel, Inhalt und Schlagwörter). Nutze dies, um früher Gespeichertes wiederzufinden.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Suchbegriff; leer lassen für alle Notizen" },
        },
      } as const,
      run: (input: { query?: string }) => JSON.stringify(db.listNotes(input.query)),
    }),
    betaTool({
      name: "create_flashcards",
      description:
        "Erstellt ein neues Karteikarten-Deck mit Lernkarten für die Klausurvorbereitung. Jede Karte hat eine Vorderseite (Frage/Begriff) und eine Rückseite (Antwort).",
      inputSchema: {
        type: "object",
        properties: {
          deck_name: { type: "string", description: "Name des Decks, z. B. 'Preiselastizität'" },
          subject: { type: "string", description: "Fach, z. B. 'VWL', 'Steuerrecht', 'Englisch'" },
          cards: {
            type: "array",
            description: "Die Lernkarten des Decks",
            items: {
              type: "object",
              properties: {
                front: { type: "string", description: "Vorderseite (Frage oder Begriff)" },
                back: { type: "string", description: "Rückseite (Antwort)" },
              },
              required: ["front", "back"],
            },
          },
        },
        required: ["deck_name", "cards"],
      } as const,
      run: (input: { deck_name: string; subject?: string; cards: { front: string; back: string }[] }) => {
        const deck = db.createDeck(input.deck_name, input.subject ?? "");
        for (const card of input.cards) {
          db.createCard(deck.id, card.front, card.back);
        }
        emit({
          type: "tool",
          label: `Deck „${deck.name}“ mit ${input.cards.length} Karten erstellt`,
        });
        return JSON.stringify({ deck, card_count: input.cards.length });
      },
    }),
  ];
}

/**
 * Führt eine Chat-Runde aus: Verlauf aus der DB + neue Nutzernachricht,
 * streamt Text-Deltas und Tool-Statusmeldungen über `emit` und gibt den
 * vollständigen Antworttext zurück.
 */
export async function runAssistant(
  userMessage: string,
  emit: (event: ChatEvent) => void
): Promise<string> {
  const client = new Anthropic();

  const history = db.listChatMessages().map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    system: systemPrompt(),
    tools: buildTools(emit),
    messages: [...history, { role: "user", content: userMessage }],
    max_iterations: 10,
    stream: true,
  });

  let fullText = "";
  for await (const messageStream of runner) {
    for await (const event of messageStream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullText += event.delta.text;
        emit({ type: "text", text: event.delta.text });
      }
    }
  }
  return fullText;
}

export function apiKeyAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

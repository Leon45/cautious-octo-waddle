export interface Task {
  id: number;
  title: string;
  due_date: string | null;
  done: number;
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface Deck {
  id: number;
  name: string;
  subject: string;
  created_at: string;
  card_count: number;
}

export interface Card {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  correct_count: number;
  wrong_count: number;
  last_reviewed: string | null;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "tool"; label: string }
  | { type: "error"; message: string }
  | { type: "done" };

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Fehler ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Tasks
export const getTasks = () => json<Task[]>("/api/tasks");
export const createTask = (title: string, due_date: string | null) =>
  json<Task>("/api/tasks", { method: "POST", body: JSON.stringify({ title, due_date }) });
export const updateTask = (id: number, fields: Partial<Pick<Task, "title" | "due_date">> & { done?: boolean }) =>
  json<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(fields) });
export const deleteTask = (id: number) => json<void>(`/api/tasks/${id}`, { method: "DELETE" });

// Notes
export const getNotes = (q?: string) =>
  json<Note[]>(`/api/notes${q ? `?q=${encodeURIComponent(q)}` : ""}`);
export const createNote = (title: string, content: string, tags: string) =>
  json<Note>("/api/notes", { method: "POST", body: JSON.stringify({ title, content, tags }) });
export const updateNote = (id: number, fields: Partial<Pick<Note, "title" | "content" | "tags">>) =>
  json<Note>(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(fields) });
export const deleteNote = (id: number) => json<void>(`/api/notes/${id}`, { method: "DELETE" });

// Learn (decks & cards)
export const getDecks = () => json<Deck[]>("/api/learn/decks");
export const createDeck = (name: string, subject: string) =>
  json<Deck>("/api/learn/decks", { method: "POST", body: JSON.stringify({ name, subject }) });
export const deleteDeck = (id: number) => json<void>(`/api/learn/decks/${id}`, { method: "DELETE" });
export const getCards = (deckId: number) => json<Card[]>(`/api/learn/decks/${deckId}/cards`);
export const createCard = (deckId: number, front: string, back: string) =>
  json<Card>(`/api/learn/decks/${deckId}/cards`, { method: "POST", body: JSON.stringify({ front, back }) });
export const reviewCard = (id: number, correct: boolean) =>
  json<Card>(`/api/learn/cards/${id}/review`, { method: "POST", body: JSON.stringify({ correct }) });
export const deleteCard = (id: number) => json<void>(`/api/learn/cards/${id}`, { method: "DELETE" });

// Chat
export const getChatHistory = () => json<ChatMessage[]>("/api/chat/history");
export const clearChatHistory = () => json<void>("/api/chat/history", { method: "DELETE" });

/** Sendet eine Chat-Nachricht und liefert Stream-Events über den Callback. */
export async function streamChat(message: string, onEvent: (event: StreamEvent) => void): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok || !res.body) {
    onEvent({ type: "error", message: `Serverfehler (${res.status}). Läuft der Server?` });
    onEvent({ type: "done" });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      try {
        onEvent(JSON.parse(line.slice(6)) as StreamEvent);
      } catch {
        // unvollständige/fehlerhafte Zeile ignorieren
      }
    }
  }
}

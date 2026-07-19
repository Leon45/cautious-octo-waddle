import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "assistant.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    due_date TEXT,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    last_reviewed TEXT
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
db.pragma("foreign_keys = ON");

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

// --- Tasks ---

export function listTasks(): Task[] {
  return db
    .prepare("SELECT * FROM tasks ORDER BY done ASC, due_date IS NULL, due_date ASC, id DESC")
    .all() as Task[];
}

export function createTask(title: string, dueDate: string | null): Task {
  const info = db
    .prepare("INSERT INTO tasks (title, due_date) VALUES (?, ?)")
    .run(title, dueDate);
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid) as Task;
}

export function updateTask(
  id: number,
  fields: { title?: string; due_date?: string | null; done?: boolean }
): Task | undefined {
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined;
  if (!existing) return undefined;
  db.prepare("UPDATE tasks SET title = ?, due_date = ?, done = ? WHERE id = ?").run(
    fields.title ?? existing.title,
    fields.due_date === undefined ? existing.due_date : fields.due_date,
    fields.done === undefined ? existing.done : fields.done ? 1 : 0,
    id
  );
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task;
}

export function deleteTask(id: number): boolean {
  return db.prepare("DELETE FROM tasks WHERE id = ?").run(id).changes > 0;
}

// --- Notes ---

export function listNotes(query?: string): Note[] {
  if (query && query.trim() !== "") {
    const like = `%${query.trim()}%`;
    return db
      .prepare(
        "SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? ORDER BY updated_at DESC"
      )
      .all(like, like, like) as Note[];
  }
  return db.prepare("SELECT * FROM notes ORDER BY updated_at DESC").all() as Note[];
}

export function createNote(title: string, content: string, tags: string): Note {
  const info = db
    .prepare("INSERT INTO notes (title, content, tags) VALUES (?, ?, ?)")
    .run(title, content, tags);
  return db.prepare("SELECT * FROM notes WHERE id = ?").get(info.lastInsertRowid) as Note;
}

export function updateNote(
  id: number,
  fields: { title?: string; content?: string; tags?: string }
): Note | undefined {
  const existing = db.prepare("SELECT * FROM notes WHERE id = ?").get(id) as Note | undefined;
  if (!existing) return undefined;
  db.prepare(
    "UPDATE notes SET title = ?, content = ?, tags = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(fields.title ?? existing.title, fields.content ?? existing.content, fields.tags ?? existing.tags, id);
  return db.prepare("SELECT * FROM notes WHERE id = ?").get(id) as Note;
}

export function deleteNote(id: number): boolean {
  return db.prepare("DELETE FROM notes WHERE id = ?").run(id).changes > 0;
}

// --- Decks & Cards ---

export function listDecks(): (Deck & { card_count: number })[] {
  return db
    .prepare(
      `SELECT d.*, (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.id) AS card_count
       FROM decks d ORDER BY d.id DESC`
    )
    .all() as (Deck & { card_count: number })[];
}

export function createDeck(name: string, subject: string): Deck {
  const info = db.prepare("INSERT INTO decks (name, subject) VALUES (?, ?)").run(name, subject);
  return db.prepare("SELECT * FROM decks WHERE id = ?").get(info.lastInsertRowid) as Deck;
}

export function deleteDeck(id: number): boolean {
  return db.prepare("DELETE FROM decks WHERE id = ?").run(id).changes > 0;
}

export function listCards(deckId: number): Card[] {
  return db.prepare("SELECT * FROM cards WHERE deck_id = ? ORDER BY id ASC").all(deckId) as Card[];
}

export function createCard(deckId: number, front: string, back: string): Card {
  const info = db
    .prepare("INSERT INTO cards (deck_id, front, back) VALUES (?, ?, ?)")
    .run(deckId, front, back);
  return db.prepare("SELECT * FROM cards WHERE id = ?").get(info.lastInsertRowid) as Card;
}

export function reviewCard(id: number, correct: boolean): Card | undefined {
  const column = correct ? "correct_count" : "wrong_count";
  const changes = db
    .prepare(`UPDATE cards SET ${column} = ${column} + 1, last_reviewed = datetime('now') WHERE id = ?`)
    .run(id).changes;
  if (changes === 0) return undefined;
  return db.prepare("SELECT * FROM cards WHERE id = ?").get(id) as Card;
}

export function deleteCard(id: number): boolean {
  return db.prepare("DELETE FROM cards WHERE id = ?").run(id).changes > 0;
}

// --- Chat history ---

export function listChatMessages(): ChatMessage[] {
  return db.prepare("SELECT * FROM chat_messages ORDER BY id ASC").all() as ChatMessage[];
}

export function addChatMessage(role: "user" | "assistant", content: string): ChatMessage {
  const info = db.prepare("INSERT INTO chat_messages (role, content) VALUES (?, ?)").run(role, content);
  return db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(info.lastInsertRowid) as ChatMessage;
}

export function clearChatMessages(): void {
  db.prepare("DELETE FROM chat_messages").run();
}

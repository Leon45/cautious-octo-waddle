import { FormEvent, useEffect, useState } from "react";
import { createNote, deleteNote, getNotes, Note, updateNote } from "../api";

export default function NotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [editing, setEditing] = useState<Note | null>(null);
  const [showForm, setShowForm] = useState(false);

  const reload = (q?: string) => getNotes(q).then(setNotes).catch(() => {});

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => void reload(query), 250);
    return () => clearTimeout(handle);
  }, [query]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (title.trim() === "") return;
    if (editing) {
      await updateNote(editing.id, { title: title.trim(), content, tags }).catch(() => {});
    } else {
      await createNote(title.trim(), content, tags).catch(() => {});
    }
    setTitle("");
    setContent("");
    setTags("");
    setEditing(null);
    setShowForm(false);
    void reload(query);
  }

  function startEdit(note: Note) {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags);
    setShowForm(true);
  }

  async function onDelete(id: number) {
    await deleteNote(id).catch(() => {});
    if (editing?.id === id) {
      setEditing(null);
      setShowForm(false);
    }
    void reload(query);
  }

  return (
    <div className="panel">
      <h2>Notizen &amp; Wissen</h2>
      <div className="form-row">
        <input
          className="input grow"
          placeholder="Notizen durchsuchen …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="btn primary"
          onClick={() => {
            setEditing(null);
            setTitle("");
            setContent("");
            setTags("");
            setShowForm((v) => !v);
          }}
        >
          {showForm && !editing ? "Abbrechen" : "+ Neue Notiz"}
        </button>
      </div>

      {showForm && (
        <form className="note-form" onSubmit={onSave}>
          <input
            className="input"
            placeholder="Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="input textarea"
            placeholder="Inhalt"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <input
            className="input"
            placeholder="Schlagwörter, kommagetrennt (z. B. vwl, klausur)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <div className="form-row">
            <button className="btn primary" type="submit" disabled={title.trim() === ""}>
              {editing ? "Speichern" : "Anlegen"}
            </button>
            {editing && (
              <button
                className="btn subtle"
                type="button"
                onClick={() => {
                  setEditing(null);
                  setShowForm(false);
                }}
              >
                Abbrechen
              </button>
            )}
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <p className="muted">
          {query ? "Keine Notizen gefunden." : "Noch keine Notizen. Leg die erste an – oder sag es dem Chat: „Merk dir …“"}
        </p>
      ) : (
        <div className="note-grid">
          {notes.map((note) => (
            <article key={note.id} className="note-card">
              <header className="note-card-header">
                <h3>{note.title}</h3>
                <div className="note-actions">
                  <button className="btn icon" title="Bearbeiten" onClick={() => startEdit(note)}>
                    ✏️
                  </button>
                  <button className="btn icon" title="Löschen" onClick={() => void onDelete(note.id)}>
                    🗑
                  </button>
                </div>
              </header>
              {note.content && <p className="note-content">{note.content}</p>}
              {note.tags && (
                <div className="tag-row">
                  {note.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

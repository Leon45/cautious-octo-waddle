import { FormEvent, useEffect, useState } from "react";
import { createTask, deleteTask, getTasks, Task, updateTask } from "../api";

function todayISO(): string {
  return new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD in lokaler Zeit
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const calendarUrl = `${window.location.origin}/api/calendar.ics`;

  async function copyCalendarUrl() {
    try {
      await navigator.clipboard.writeText(calendarUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard nicht verfügbar (z. B. ohne HTTPS) — URL bleibt zum manuellen Kopieren sichtbar
    }
  }

  const reload = () => getTasks().then(setTasks).catch((e) => setError(String(e.message ?? e)));

  useEffect(() => {
    void reload();
  }, []);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (title.trim() === "") return;
    await createTask(title.trim(), dueDate || null).catch((e) => setError(String(e.message ?? e)));
    setTitle("");
    setDueDate("");
    void reload();
  }

  async function onToggle(task: Task) {
    await updateTask(task.id, { done: !task.done }).catch(() => {});
    void reload();
  }

  async function onDelete(id: number) {
    await deleteTask(id).catch(() => {});
    void reload();
  }

  const today = todayISO();
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const dueNow = open.filter((t) => t.due_date && t.due_date <= today);
  const later = open.filter((t) => !t.due_date || t.due_date > today);

  const renderTask = (task: Task) => (
    <li key={task.id} className="list-item">
      <label className="check-label">
        <input type="checkbox" checked={Boolean(task.done)} onChange={() => void onToggle(task)} />
        <span className={task.done ? "strike" : ""}>{task.title}</span>
      </label>
      {task.due_date && (
        <span
          className={`badge ${!task.done && task.due_date < today ? "overdue" : !task.done && task.due_date === today ? "due-today" : ""}`}
        >
          {!task.done && task.due_date < today
            ? `überfällig · ${formatDate(task.due_date)}`
            : !task.done && task.due_date === today
              ? "heute fällig"
              : formatDate(task.due_date)}
        </span>
      )}
      <button className="btn icon" title="Löschen" onClick={() => void onDelete(task.id)}>
        🗑
      </button>
    </li>
  );

  return (
    <div className="panel">
      <h2>Aufgaben &amp; Erinnerungen</h2>
      <form className="form-row" onSubmit={onAdd}>
        <input
          className="input grow"
          placeholder="Neue Aufgabe, z. B. „Skript Kapitel 3 lesen“"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          title="Fälligkeitsdatum (optional)"
        />
        <button className="btn primary" type="submit" disabled={title.trim() === ""}>
          Hinzufügen
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}

      {dueNow.length > 0 && (
        <>
          <h3 className="section-title urgent">Jetzt dran</h3>
          <ul className="list">{dueNow.map(renderTask)}</ul>
        </>
      )}
      <h3 className="section-title">Offen</h3>
      {later.length === 0 && dueNow.length === 0 ? (
        <p className="muted">Keine offenen Aufgaben – alles erledigt! 🎉</p>
      ) : (
        <ul className="list">{later.map(renderTask)}</ul>
      )}
      {done.length > 0 && (
        <>
          <h3 className="section-title">Erledigt</h3>
          <ul className="list done-list">{done.map(renderTask)}</ul>
        </>
      )}
      <p className="hint">Tipp: Du kannst Aufgaben auch im Chat anlegen – „Erinnere mich am Freitag an …“</p>
      <div className="hint">
        <strong>📅 Mit dem iPhone-Kalender verbinden:</strong> Abonniere auf dem iPhone unter{" "}
        <em>Einstellungen → Apps → Kalender → Accounts → Account hinzufügen → Andere → Kalenderabo</em> diese
        Adresse – fällige Aufgaben erscheinen dann als Termine:
        <div className="cal-row">
          <code className="cal-url">{calendarUrl}</code>
          <button className="btn subtle" type="button" onClick={() => void copyCalendarUrl()}>
            {copied ? "✓ Kopiert" : "Kopieren"}
          </button>
        </div>
        {["localhost", "127.0.0.1"].includes(window.location.hostname) && (
          <p className="cal-note">
            Hinweis: Ersetze „{window.location.hostname}“ dabei durch die IP-Adresse dieses Rechners im WLAN
            (z. B. 192.168.1.20) – dein iPhone muss den Rechner erreichen können.
          </p>
        )}
      </div>
    </div>
  );
}

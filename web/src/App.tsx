import { useState } from "react";
import ChatView from "./views/ChatView";
import LearnView from "./views/LearnView";
import NotesView from "./views/NotesView";
import TasksView from "./views/TasksView";

const TABS = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "tasks", label: "Aufgaben", icon: "✅" },
  { id: "notes", label: "Notizen", icon: "📝" },
  { id: "learn", label: "Lernen", icon: "🎓" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function App() {
  const [tab, setTab] = useState<TabId>("chat");

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="logo">✨</span> Persönlicher Assistent
        </h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {tab === "chat" && <ChatView />}
        {tab === "tasks" && <TasksView />}
        {tab === "notes" && <NotesView />}
        {tab === "learn" && <LearnView />}
      </main>
    </div>
  );
}

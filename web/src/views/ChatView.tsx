import { FormEvent, useEffect, useRef, useState } from "react";
import { clearChatHistory, getChatHistory, streamChat } from "../api";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  tools: string[];
  error?: string;
}

const SUGGESTIONS = [
  "Erinnere mich morgen daran, die Steuererklärung anzufangen",
  "Erkläre mir die Preiselastizität der Nachfrage",
  "Erstelle Karteikarten zu englischen C1-Vokabeln rund ums Thema Wirtschaft",
  "Merk dir: Klausurtermin VWL ist am 15. August",
];

export default function ChatView() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatHistory()
      .then((history) =>
        setMessages(history.map((m) => ({ role: m.role, content: m.content, tools: [] })))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (trimmed === "" || streaming) return;
    setInput("");
    setStreaming(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, tools: [] },
      { role: "assistant", content: "", tools: [] },
    ]);

    const patchLast = (patch: (m: DisplayMessage) => DisplayMessage) =>
      setMessages((prev) => [...prev.slice(0, -1), patch(prev[prev.length - 1])]);

    await streamChat(trimmed, (event) => {
      if (event.type === "text") {
        patchLast((m) => ({ ...m, content: m.content + event.text }));
      } else if (event.type === "tool") {
        patchLast((m) => ({ ...m, tools: [...m.tools, event.label] }));
      } else if (event.type === "error") {
        patchLast((m) => ({ ...m, error: event.message }));
      }
    });
    setStreaming(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  async function onClear() {
    await clearChatHistory().catch(() => {});
    setMessages([]);
  }

  return (
    <div className="chat">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="chat-empty-title">Womit kann ich dir helfen?</p>
            <p>Ich beantworte Fragen, verwalte Aufgaben und Notizen und helfe dir bei der Klausurvorbereitung.</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion" onClick={() => void send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble-row ${m.role}`}>
            <div className={`bubble ${m.role}`}>
              {m.tools.map((t, j) => (
                <div key={j} className="tool-chip">✓ {t}</div>
              ))}
              {m.content !== "" && <div className="bubble-text">{m.content}</div>}
              {m.error && <div className="bubble-error">⚠️ {m.error}</div>}
              {m.role === "assistant" &&
                streaming &&
                i === messages.length - 1 &&
                m.content === "" &&
                !m.error && <div className="typing">Denkt nach …</div>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input-row" onSubmit={onSubmit}>
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nachricht schreiben …"
          disabled={streaming}
          autoFocus
        />
        <button className="btn primary" type="submit" disabled={streaming || input.trim() === ""}>
          Senden
        </button>
        {messages.length > 0 && (
          <button className="btn subtle" type="button" onClick={() => void onClear()} disabled={streaming}>
            Verlauf löschen
          </button>
        )}
      </form>
    </div>
  );
}

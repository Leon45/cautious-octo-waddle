import { FormEvent, useEffect, useState } from "react";
import {
  Card,
  createCard,
  createDeck,
  Deck,
  deleteCard,
  deleteDeck,
  getCards,
  getDecks,
  reviewCard,
} from "../api";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface QuizState {
  cards: Card[];
  index: number;
  flipped: boolean;
  correct: number;
  wrong: number;
}

export default function LearnView() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selected, setSelected] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState("");
  const [deckSubject, setDeckSubject] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [quiz, setQuiz] = useState<QuizState | null>(null);

  const reloadDecks = () => getDecks().then(setDecks).catch(() => {});

  useEffect(() => {
    void reloadDecks();
  }, []);

  useEffect(() => {
    if (selected) {
      void getCards(selected.id).then(setCards).catch(() => {});
    } else {
      setCards([]);
    }
    setQuiz(null);
  }, [selected?.id]);

  async function onCreateDeck(e: FormEvent) {
    e.preventDefault();
    if (deckName.trim() === "") return;
    const deck = await createDeck(deckName.trim(), deckSubject.trim()).catch(() => null);
    setDeckName("");
    setDeckSubject("");
    await reloadDecks();
    if (deck) setSelected({ ...deck, card_count: 0 });
  }

  async function onDeleteDeck(id: number) {
    await deleteDeck(id).catch(() => {});
    if (selected?.id === id) setSelected(null);
    void reloadDecks();
  }

  async function onAddCard(e: FormEvent) {
    e.preventDefault();
    if (!selected || front.trim() === "" || back.trim() === "") return;
    await createCard(selected.id, front.trim(), back.trim()).catch(() => {});
    setFront("");
    setBack("");
    void getCards(selected.id).then(setCards);
    void reloadDecks();
  }

  async function onDeleteCard(id: number) {
    if (!selected) return;
    await deleteCard(id).catch(() => {});
    void getCards(selected.id).then(setCards);
    void reloadDecks();
  }

  function startQuiz() {
    if (cards.length === 0) return;
    setQuiz({ cards: shuffle(cards), index: 0, flipped: false, correct: 0, wrong: 0 });
  }

  async function answer(correct: boolean) {
    if (!quiz) return;
    const card = quiz.cards[quiz.index];
    void reviewCard(card.id, correct).catch(() => {});
    setQuiz({
      ...quiz,
      index: quiz.index + 1,
      flipped: false,
      correct: quiz.correct + (correct ? 1 : 0),
      wrong: quiz.wrong + (correct ? 0 : 1),
    });
  }

  // --- Abfragemodus ---
  if (quiz) {
    const finished = quiz.index >= quiz.cards.length;
    const card = quiz.cards[quiz.index];
    return (
      <div className="panel">
        <h2>Abfrage: {selected?.name}</h2>
        {finished ? (
          <div className="quiz-result">
            <p className="quiz-score">
              Ergebnis: {quiz.correct} richtig · {quiz.wrong} falsch
            </p>
            <p className="muted">
              {quiz.wrong === 0
                ? "Perfekt! Weiter so. 🎉"
                : "Übung macht den Meister – wiederhole die schwierigen Karten gleich noch einmal."}
            </p>
            <div className="form-row">
              <button className="btn primary" onClick={startQuiz}>
                Noch einmal
              </button>
              <button className="btn subtle" onClick={() => setQuiz(null)}>
                Zurück zum Deck
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="muted">
              Karte {quiz.index + 1} von {quiz.cards.length}
            </p>
            <button
              className={`quiz-card ${quiz.flipped ? "flipped" : ""}`}
              onClick={() => setQuiz({ ...quiz, flipped: !quiz.flipped })}
            >
              <span className="quiz-card-side">{quiz.flipped ? "Antwort" : "Frage"}</span>
              <span className="quiz-card-text">{quiz.flipped ? card.back : card.front}</span>
              <span className="quiz-card-hint">{quiz.flipped ? "" : "Zum Umdrehen klicken"}</span>
            </button>
            {quiz.flipped && (
              <div className="form-row center">
                <button className="btn danger" onClick={() => void answer(false)}>
                  ✗ Falsch
                </button>
                <button className="btn success" onClick={() => void answer(true)}>
                  ✓ Richtig
                </button>
              </div>
            )}
            <button className="btn subtle" onClick={() => setQuiz(null)}>
              Abfrage beenden
            </button>
          </>
        )}
      </div>
    );
  }

  // --- Deck-Detail ---
  if (selected) {
    return (
      <div className="panel">
        <button className="btn subtle" onClick={() => setSelected(null)}>
          ← Alle Decks
        </button>
        <h2>
          {selected.name} {selected.subject && <span className="badge">{selected.subject}</span>}
        </h2>
        <div className="form-row">
          <button className="btn primary" onClick={startQuiz} disabled={cards.length === 0}>
            Abfrage starten ({cards.length} Karten)
          </button>
        </div>
        <form className="form-row" onSubmit={onAddCard}>
          <input
            className="input grow"
            placeholder="Vorderseite (Frage)"
            value={front}
            onChange={(e) => setFront(e.target.value)}
          />
          <input
            className="input grow"
            placeholder="Rückseite (Antwort)"
            value={back}
            onChange={(e) => setBack(e.target.value)}
          />
          <button className="btn" type="submit" disabled={front.trim() === "" || back.trim() === ""}>
            + Karte
          </button>
        </form>
        {cards.length === 0 ? (
          <p className="muted">Noch keine Karten in diesem Deck.</p>
        ) : (
          <ul className="list">
            {cards.map((card) => (
              <li key={card.id} className="list-item card-item">
                <div className="card-faces">
                  <span className="card-front">{card.front}</span>
                  <span className="card-back">{card.back}</span>
                </div>
                <span className="badge">
                  ✓ {card.correct_count} · ✗ {card.wrong_count}
                </span>
                <button className="btn icon" title="Löschen" onClick={() => void onDeleteCard(card.id)}>
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // --- Deck-Übersicht ---
  return (
    <div className="panel">
      <h2>Lernen &amp; Klausurvorbereitung</h2>
      <form className="form-row" onSubmit={onCreateDeck}>
        <input
          className="input grow"
          placeholder="Neues Deck, z. B. „Marktformen“"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
        />
        <input
          className="input"
          placeholder="Fach (optional)"
          value={deckSubject}
          onChange={(e) => setDeckSubject(e.target.value)}
        />
        <button className="btn primary" type="submit" disabled={deckName.trim() === ""}>
          Anlegen
        </button>
      </form>
      {decks.length === 0 ? (
        <p className="muted">
          Noch keine Decks. Leg eines an – oder bitte den Chat: „Erstelle Karteikarten zu Angebots- und
          Nachfrageelastizität.“
        </p>
      ) : (
        <div className="note-grid">
          {decks.map((deck) => (
            <article key={deck.id} className="note-card deck-card" onClick={() => setSelected(deck)}>
              <header className="note-card-header">
                <h3>{deck.name}</h3>
                <button
                  className="btn icon"
                  title="Löschen"
                  onClick={(e) => {
                    e.stopPropagation();
                    void onDeleteDeck(deck.id);
                  }}
                >
                  🗑
                </button>
              </header>
              <p className="muted">
                {deck.subject && <span className="tag">{deck.subject}</span>} {deck.card_count} Karten
              </p>
            </article>
          ))}
        </div>
      )}
      <p className="hint">
        Tipp: Der Chat kann dich auch mündlich abfragen und deine Antworten korrigieren – frag z. B. „Stell mir fünf
        Übungsfragen zum Steuerrecht“.
      </p>
    </div>
  );
}

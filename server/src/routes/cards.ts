import { Router } from "express";
import * as db from "../db";

export const cardsRouter = Router();

// Decks
cardsRouter.get("/decks", (_req, res) => {
  res.json(db.listDecks());
});

cardsRouter.post("/decks", (req, res) => {
  const { name, subject } = req.body ?? {};
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "name ist erforderlich" });
  }
  res.status(201).json(db.createDeck(name.trim(), subject ?? ""));
});

cardsRouter.delete("/decks/:id", (req, res) => {
  if (!db.deleteDeck(Number(req.params.id))) {
    return res.status(404).json({ error: "Deck nicht gefunden" });
  }
  res.status(204).end();
});

// Cards
cardsRouter.get("/decks/:id/cards", (req, res) => {
  res.json(db.listCards(Number(req.params.id)));
});

cardsRouter.post("/decks/:id/cards", (req, res) => {
  const { front, back } = req.body ?? {};
  if (typeof front !== "string" || front.trim() === "" || typeof back !== "string" || back.trim() === "") {
    return res.status(400).json({ error: "front und back sind erforderlich" });
  }
  res.status(201).json(db.createCard(Number(req.params.id), front.trim(), back.trim()));
});

cardsRouter.post("/cards/:id/review", (req, res) => {
  const { correct } = req.body ?? {};
  const card = db.reviewCard(Number(req.params.id), Boolean(correct));
  if (!card) return res.status(404).json({ error: "Karte nicht gefunden" });
  res.json(card);
});

cardsRouter.delete("/cards/:id", (req, res) => {
  if (!db.deleteCard(Number(req.params.id))) {
    return res.status(404).json({ error: "Karte nicht gefunden" });
  }
  res.status(204).end();
});

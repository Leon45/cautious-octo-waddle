import Anthropic from "@anthropic-ai/sdk";
import { Router } from "express";
import { apiKeyAvailable, ChatEvent, runAssistant } from "../claude";
import * as db from "../db";

export const chatRouter = Router();

chatRouter.get("/history", (_req, res) => {
  res.json(db.listChatMessages());
});

chatRouter.delete("/history", (_req, res) => {
  db.clearChatMessages();
  res.status(204).end();
});

chatRouter.post("/", async (req, res) => {
  const { message } = req.body ?? {};
  if (typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "message ist erforderlich" });
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const emit = (event: ChatEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  if (!apiKeyAvailable()) {
    emit({
      type: "error",
      message:
        "Es ist kein Anthropic-API-Key hinterlegt. Kopiere .env.example nach .env, trage deinen Key als ANTHROPIC_API_KEY ein und starte den Server neu. Aufgaben, Notizen und Karteikarten funktionieren auch ohne Key.",
    });
    emit({ type: "done" });
    return res.end();
  }

  db.addChatMessage("user", message.trim());

  try {
    const answer = await runAssistant(message.trim(), emit);
    // Leeren Text nicht speichern — die API verlangt nicht-leere Nachrichten im Verlauf.
    db.addChatMessage("assistant", answer.trim() !== "" ? answer : "(Aktion ausgeführt)");
  } catch (error) {
    let message = "Beim Abruf der KI-Antwort ist ein Fehler aufgetreten. Bitte versuch es erneut.";
    if (error instanceof Anthropic.AuthenticationError) {
      message = "Der hinterlegte Anthropic-API-Key ist ungültig. Bitte prüfe die .env-Datei.";
    } else if (error instanceof Anthropic.RateLimitError) {
      message = "Das API-Kontingent ist momentan ausgeschöpft. Bitte warte kurz und versuch es erneut.";
    } else if (error instanceof Anthropic.APIConnectionError) {
      message = "Keine Verbindung zur Claude API möglich. Bitte prüfe deine Internetverbindung.";
    } else if (error instanceof Anthropic.APIError) {
      message = `Die Claude API hat einen Fehler gemeldet (${error.status ?? "unbekannt"}). Bitte versuch es erneut.`;
    }
    console.error("Chat-Fehler:", error);
    emit({ type: "error", message });
  }

  emit({ type: "done" });
  res.end();
});

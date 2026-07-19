import { Router } from "express";
import * as db from "../db";

export const notesRouter = Router();

notesRouter.get("/", (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q : undefined;
  res.json(db.listNotes(query));
});

notesRouter.post("/", (req, res) => {
  const { title, content, tags } = req.body ?? {};
  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title ist erforderlich" });
  }
  res.status(201).json(db.createNote(title.trim(), content ?? "", tags ?? ""));
});

notesRouter.patch("/:id", (req, res) => {
  const note = db.updateNote(Number(req.params.id), req.body ?? {});
  if (!note) return res.status(404).json({ error: "Notiz nicht gefunden" });
  res.json(note);
});

notesRouter.delete("/:id", (req, res) => {
  if (!db.deleteNote(Number(req.params.id))) {
    return res.status(404).json({ error: "Notiz nicht gefunden" });
  }
  res.status(204).end();
});

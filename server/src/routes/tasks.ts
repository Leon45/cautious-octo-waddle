import { Router } from "express";
import * as db from "../db";

export const tasksRouter = Router();

tasksRouter.get("/", (_req, res) => {
  res.json(db.listTasks());
});

tasksRouter.post("/", (req, res) => {
  const { title, due_date } = req.body ?? {};
  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title ist erforderlich" });
  }
  res.status(201).json(db.createTask(title.trim(), due_date || null));
});

tasksRouter.patch("/:id", (req, res) => {
  const task = db.updateTask(Number(req.params.id), req.body ?? {});
  if (!task) return res.status(404).json({ error: "Aufgabe nicht gefunden" });
  res.json(task);
});

tasksRouter.delete("/:id", (req, res) => {
  if (!db.deleteTask(Number(req.params.id))) {
    return res.status(404).json({ error: "Aufgabe nicht gefunden" });
  }
  res.status(204).end();
});

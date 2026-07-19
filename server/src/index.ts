import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

import express from "express";
import { cardsRouter } from "./routes/cards";
import { chatRouter } from "./routes/chat";
import { notesRouter } from "./routes/notes";
import { tasksRouter } from "./routes/tasks";

const app = express();
app.use(express.json());

app.use("/api/tasks", tasksRouter);
app.use("/api/notes", notesRouter);
app.use("/api/learn", cardsRouter);
app.use("/api/chat", chatRouter);

// Produktion: gebautes Frontend ausliefern
const webDist = path.join(__dirname, "..", "..", "web", "dist");
app.use(express.static(webDist));
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(webDist, "index.html"), (err) => {
    if (err) res.status(404).send("Frontend nicht gebaut. Bitte zuerst `npm run build` ausführen oder `npm run dev` nutzen.");
  });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Assistent-Server läuft auf http://localhost:${port}`);
});

import { Router } from "express";
import * as db from "../db";

export const calendarRouter = Router();

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** "2026-07-25" -> "20260725" */
function dateBasic(iso: string): string {
  return iso.replace(/-/g, "");
}

/** Folgetag für DTEND eines ganztägigen Termins (exklusives Ende laut RFC 5545). */
function nextDayBasic(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** SQLite-UTC-Zeitstempel "2026-07-19 20:49:18" -> "20260719T204918Z" */
function stampUTC(sqliteDatetime: string): string {
  return `${sqliteDatetime.replace(" ", "T").replace(/[-:]/g, "")}Z`;
}

/** RFC 5545 verlangt max. 75 Zeichen pro Zeile; Folgezeilen beginnen mit Leerzeichen. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  let out = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 0) {
    out += `\r\n ${rest.slice(0, 74)}`;
    rest = rest.slice(74);
  }
  return out;
}

calendarRouter.get("/", (_req, res) => {
  const tasks = db.listTasks().filter((t) => !t.done && t.due_date);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Persoenlicher Assistent//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Aufgaben (Assistent)",
    "X-WR-CALDESC:Fällige Aufgaben aus dem persönlichen Assistenten",
  ];

  for (const task of tasks) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:task-${task.id}@persoenlicher-assistent`,
      `DTSTAMP:${stampUTC(task.created_at)}`,
      `DTSTART;VALUE=DATE:${dateBasic(task.due_date!)}`,
      `DTEND;VALUE=DATE:${nextDayBasic(task.due_date!)}`,
      `SUMMARY:${escapeText(task.title)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'inline; filename="aufgaben.ics"');
  res.send(`${lines.map(fold).join("\r\n")}\r\n`);
});

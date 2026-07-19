# Berger & Kollegen – Website für eine Wirtschaftsprüfungskanzlei

Statische, responsive Website für eine Wirtschaftsprüfungsgesellschaft
(Platzhaltername „Berger & Kollegen"). Ohne Build-Tools, ohne externe
Abhängigkeiten – reines HTML, CSS und Vanilla-JavaScript.

## Seiten

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite: Hero, Leistungen, Kanzlei, Ablauf, Team, Kontaktformular |
| `impressum.html` | Impressum (Platzhalterdaten, inkl. berufsrechtlicher Angaben) |
| `datenschutz.html` | Datenschutzerklärung (Platzhalter-Gerüst) |

## Lokal ansehen

Einfach `index.html` im Browser öffnen – oder einen kleinen Server starten:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 aufrufen
```

## Anpassen

- **Name, Adresse, Kontaktdaten:** in allen drei HTML-Dateien ersetzen
  (Platzhalter: „Berger & Kollegen", Musterstraße 12, `*.example`-E-Mail).
- **Farben und Schriften:** zentrale CSS-Variablen am Anfang von
  `css/style.css` (`--navy`, `--gold` usw.).
- **Kontaktformular:** aktuell nur Demo-Verhalten (`js/main.js`). Für den
  Produktivbetrieb einen Formular-Dienst oder ein eigenes Backend anbinden.
- **Impressum/Datenschutz:** Platzhaltertexte vor Veröffentlichung durch
  geprüfte, echte Angaben ersetzen.

## Hinweise

- Keine externen Fonts, Skripte oder Tracker – DSGVO-freundlich und offline
  lauffähig.
- Responsive bis hinunter zu schmalen Smartphone-Viewports (mobiles Menü).

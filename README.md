# Wohnungsplaner 3D

Ein 3D-Planer für die eigene Wohnung: Räume anlegen, Möbel aus dem Katalog platzieren, verschieben und drehen — alles direkt im Browser.

## Starten

Einfach die Datei **`index.html`** im Browser öffnen (Doppelklick genügt). Es ist kein Server, keine Installation und keine Internetverbindung nötig — Three.js ist direkt in die Datei eingebettet.

## Funktionen

- **Räume anlegen**: Name, Breite und Tiefe eingeben — der Raum erscheint mit Wänden und beschriftetem Boden. Zum Verschieben erst anklicken, dann ziehen.
- **Möbel-Katalog**: 20 typische Möbelstücke (Bett, Sofa, Esstisch, Küchenzeile, Badewanne, …) mit realistischen Standardmaßen. Maße, Farbe und Name lassen sich pro Möbelstück anpassen.
- **Verschieben & Drehen**: Möbel anklicken und ziehen; drehen über den Regler in der Auswahl-Karte, den +90°-Knopf oder die Taste `R` (mit `Shift` in 90°-Schritten).
- **Intelligente Wände**: Wände, die die Sicht in einen Raum verdecken würden, werden automatisch ausgeblendet (Puppenhaus-Effekt).
- **Ansichten**: frei drehbar/zoombar, plus Schnellknöpfe für 3D-Ansicht und Draufsicht.
- **Automatisches Speichern**: Die Planung wird im Browser (localStorage) gespeichert. Über *Export/Import* lässt sie sich als JSON-Datei sichern oder auf ein anderes Gerät übertragen.
- **Rückgängig**: `Strg+Z` oder der ↩-Knopf.

## Bedienung

| Aktion | Eingabe |
|---|---|
| Ansicht drehen | Linke Maustaste ziehen (Touch: 1 Finger) |
| Zoomen | Mausrad (Touch: 2 Finger auseinander/zusammen) |
| Ansicht verschieben | Rechte Maustaste ziehen |
| Möbel bewegen | Möbelstück anklicken und ziehen |
| Möbel drehen | `R` / `Shift+R` oder Regler in der Auswahl-Karte |
| Löschen | `Entf` oder Knopf in der Auswahl-Karte |
| Auswahl aufheben | `Esc` oder ins Leere klicken |

Beim ersten Start ist bereits eine konkrete **2-Zimmer-Wohnung (54,59 m²)** nach Grundriss eingebaut — Wohnen, Schlafen, Küche (L-Zeile), Flur, Bad und Balkon inkl. passender Möblierung. Über *Wohnung laden* lässt sie sich jederzeit wiederherstellen, mit *Alles löschen* leerst du den Plan. Die Datei `wohnung.json` enthält denselben Stand zum *Import* auf einem anderen Gerät.

## Technik

Eine einzelne HTML-Datei ohne Build-Schritt. 3D-Rendering mit [Three.js](https://threejs.org/) r147 (MIT-Lizenz, eingebettet). Alle Maße in Metern.

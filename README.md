# Wohnungsplaner 3D

Ein 3D-Planer für die eigene Wohnung: Räume anlegen, Möbel aus dem Katalog platzieren, verschieben und drehen — alles direkt im Browser.

## Starten

Einfach die Datei **`index.html`** im Browser öffnen (Doppelklick genügt). Es ist kein Server, keine Installation und keine Internetverbindung nötig — Three.js ist direkt in die Datei eingebettet.

## Funktionen

- **Räume anlegen**: Name, Breite und Tiefe eingeben — der Raum erscheint mit Wänden und beschriftetem Boden. Zum Verschieben erst anklicken, dann ziehen.
- **Möbel-Katalog**: über 50 Möbelstücke in Kategorien (Wohnen, Schlafen, Essen, Büro, Küche, Bad, Aufbewahrung, Außen, Deko) mit realistischen Standardmaßen und Suchfeld. Maße, Farbe und Name lassen sich pro Möbelstück anpassen.
- **Möbel-Assistent (Chat)**: ein lokaler Assistent (unten rechts), der deutsche Befehle versteht und Möbel direkt platziert — z. B. „*großes Bett ins Schlafzimmer*", „*4 Stühle in die Küche*", „*rotes Sofa*" oder „*erstelle einen Billardtisch 2,2 × 1,2 × 0,8*". Erkennt Menge, Zielraum, Farbe, Größe (groß/klein/breit/hoch) und Maße; unbekannte Möbel werden als eigenes Möbelstück angelegt. Läuft komplett offline, ohne Internet oder API-Schlüssel.
- **Verschieben & Drehen**: Möbel anklicken und ziehen; drehen über den Regler in der Auswahl-Karte, den +90°-Knopf oder die Taste `R` (mit `Shift` in 90°-Schritten).
- **Türen & Fenster**: Wände haben echte Öffnungen — Türen mit Zarge (Durchgänge zwischen den Räumen) und Fenster mit Rahmen, Brüstung und Glas auf den Außenwänden.
- **Intelligente Wände**: Wände, die die Sicht in einen Raum verdecken würden, werden automatisch ausgeblendet (Puppenhaus-Effekt).
- **Balkon-Geländer**: Der Balkon wird als offene Fläche mit niedrigem Geländer statt geschlossener Wände dargestellt.
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

Beim ersten Start ist bereits eine konkrete **2-Zimmer-Wohnung (54,59 m²)** nach Grundriss eingebaut — Wohnen, Schlafen, Küche (L-Zeile) mit Speisekammer, Flur, Bad und Balkon inkl. passender Möblierung, Türen zwischen den Räumen und Fenstern auf den Außenwänden. Über *Wohnung laden* lässt sie sich jederzeit wiederherstellen, mit *Alles löschen* leerst du den Plan. Die Datei `wohnung.json` enthält denselben Stand zum *Import* auf einem anderen Gerät.

## Technik

Eine einzelne HTML-Datei ohne Build-Schritt. 3D-Rendering mit [Three.js](https://threejs.org/) r147 (MIT-Lizenz, eingebettet). Alle Maße in Metern.

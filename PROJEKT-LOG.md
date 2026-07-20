# Projekt-Log

Laufendes Protokoll aller Prompts und daraus folgenden Aktionen.
Nach **jedem** User-Prompt zwingend aktualisieren.

---

## 2026-07-19 — Prompt 1

**User:** Lege bitte eine MD-Datei an und aktualisiere sie zwingend nach jedem Prompt.

**Aktion:**
- `PROJEKT-LOG.md` angelegt
- Cursor-Regel `.cursor/rules/projekt-log.mdc` erstellt (`alwaysApply: true`), damit die Datei nach jedem Prompt aktualisiert wird

**Status:** erledigt

---

## 2026-07-19 — Prompt 2

**User:** Spiel „Spaß mit Karten“ designen. Version 1.0: spektakuläre Weltkarte; Länder werden vorgeschlagen und müssen auf der Karte gefunden werden.

**Aktion:**
- Vite + React + TypeScript App aufgesetzt
- Interaktive Weltkarte (TopoJSON) als zentrales, spektakuläres Spielfeld
- Gameplay: Zufallsland vorschlagen → Klick auf Karte → Feedback, Score, nächste Runde
- Visuelles Design: starke Marke, atmosphärische Karte, gezielte Motion

**Status:** erledigt

---

## 2026-07-19 — Prompt 3

**User:** Im Spielmodus eine optionale Filterfunktion nach Kontinenten einbauen.

**Aktion:**
- Kontinent-Zuordnung für Länder ergänzt (`src/continents.ts`)
- Optionaler Filter (Welt / Kontinente) im Intro und im HUD während des Spiels
- Länder-Pool und Karten-Interaktion folgen dem gewählten Kontinent

**Status:** erledigt

---

## 2026-07-19 — Prompt 4

**User:** Spektakulären Zoom/Übergang einbauen, der bei Auswahl eines Kontinents oder der ganzen Welt auslöst.

**Aktion:**
- Animierter Karten-Zoom (Projektion scale/translate) beim Kontinent-/Welt-Wechsel
- Cinematic Overlay und Glow während des Übergangs
- Fokus-Prop an `WorldMap` durchgereicht

**Status:** erledigt

---

## 2026-07-19 — Prompt 5

**User:** Zoom funktioniert nicht; Kontinent soll wirklich/ausschließlich den Ausschnitt füllen. Visuell gerne mit Erd-Drehung/Drehmoment.

**Aktion:**
- Karte auf Orthografie-Globus umgestellt
- Echter Spin (≥1 Umdrehung) + Zoom/ClipAngle pro Kontinent
- Animations-Bug (Strict Mode) behoben — Fokus-Ref erst nach Abschluss setzen

**Status:** erledigt

---

## 2026-07-19 — Prompt 6

**User:** Karte bewegbar machen (besonders Welt-Modus); spektakulärer aussehen lassen; Landschaften zeigen (Wälder, Gebirge, Wüsten etc.).

**Aktion:**
- Drag-Rotation inkl. Trägheit am Globus
- Landschafts-Layer (Wälder, Gebirge, Wüsten) + Biotop-Einfärbung
- Visuell aufgewerteter Globus (Atmosphäre, Schattierung, Muster)

**Status:** erledigt

---

## 2026-07-19 — Prompt 7

**User:** Weltkarte eher wie die klassische Wikipedia-Karte (flach, kartografisch) statt Globus: https://de.wikipedia.org/wiki/Karte_%28Kartografie%29#/media/Datei:Weltkarte.jpg

**Aktion:**
- Umstellung von Orthografie-Globus auf klassische flache Weltkarten-Projektion
- Optik an traditionelle physisch-politische Atlaskarte angenähert
- Pan/Drag für die flache Karte beibehalten

**Status:** erledigt

---

## 2026-07-19 — Prompt 7

**User:** Runder Globus beibehalten, aber Optik wie die klassische Wikipedia-Weltkarte (Atlas-Stil).

**Aktion:**
- Globus-Form behalten
- Optik auf klassische physisch-politische Atlaskarte umgestellt (Meeresblau, Landfarben, Borders)

**Status:** erledigt

---

## 2026-07-19 — Prompt 8

**User:** Keine Land-für-Land-Farben; echte Landschaften darstellen; Länderdarstellung nicht auf derselben Ebene.

**Aktion:**
- Einheitliche Landbasis statt Biotop-Farben pro Land
- Landschaften als dominante Schicht
- Länder nur noch als dezente Grenzen / Interaktionslayer

**Status:** erledigt

---

## 2026-07-19 — Prompt 9

**User:** Aktuell nur Farbschemas; was wird gebraucht, damit es landschaftlich wie das Referenzbild aussieht?

**Aktion:**
- Anforderungen für echte Atlas-/Satelliten-Textur geklärt (Asset, Lizenz, Format)

**Status:** erledigt

---

## 2026-07-19 — Prompt 10

**User:** Wikipedia-Weltkarte als Textur nutzen.

**Aktion:**
- Weltkarte.jpg geladen
- Als Globus-Textur gemappt; Länder nur noch als Interaktionslayer

**Status:** erledigt

---

## 2026-07-19 — Prompt 11

**User:** Wikipedia-Textur zurücknehmen; Karte wieder wie in der ersten Runde.

**Aktion:**
- Zurück auf flache Natural-Earth-Weltkarte (erste Optik)
- Globus-/Textur-Ansatz entfernt; Kontinent-Filter bleibt nutzbar

**Status:** erledigt

---

## 2026-07-19 — Prompt 12

**User:** Zoom- und Dreheffekte sollen bleiben (bei Optik der ersten Karte).

**Aktion:**
- Orthografie-Globus mit Spin/Zoom und Drag wiederhergestellt
- Optik wie erste Runde (Sand-Land, dunkler Ozean)

**Status:** erledigt

---

## 2026-07-19 — Prompt 13

**User:** Schaltfläche und Karte auseinander ziehen — Überlappungen beheben.

**Aktion:**
- Abstände zwischen HUD/Intro-Steuerung und Karte vergrößert

**Status:** erledigt

---

## 2026-07-19 — Prompt 14

**User:** Beim korrekten Klick (z. B. Polen) kommt kein Feedback — Spiel nicht spielbar.

**Aktion:**
- Klick-vs-Drag-Logik und Treffer-Feedback untersucht und behoben

**Status:** erledigt

---

## 2026-07-19 — Prompt 15

**User:** Zweiter Spielmodus — Hauptstadt vorgeben, passendes Land auswählen.

**Aktion:**
- Hauptstadt-Daten und Moduswahl ergänzt
- Gameplay: Hauptstadt anzeigen → Land auf Karte klicken

**Status:** erledigt

---

## 2026-07-19 — Prompt 16

**User:** Dritter Spielmodus — ins Land zoomen, nach nächsttieferer Verwaltungseinheit fragen (z. B. DE Länder, US Staaten).

**Aktion:**
- Admin-1-Geodaten eingebunden
- Zoom auf Land + Quiz auf Regionen/Bundesländer/Staaten

**Status:** erledigt

---

## 2026-07-19 — Prompt 17

**User:** Im Regionen-Modus soll man das Land selbst auswählen können, mit dem man spielen will.

**Aktion:**
- Länderauswahl für Regionen-Modus im Intro (und Wechsel während des Spiels)

**Status:** in Arbeit

**Status:** erledigt — Länderauswahl (Dropdown) im Intro und HUD für Regionen-Modus; Runden bleiben im gewählten Land

---

## 2026-07-19 — Prompt 18

**User:** Auf Regionenebene auch einen Hauptstadtfinder (wie bei Ländern).

**Aktion:**
- Region-Hauptstädte recherchieren/ergänzen und Spielmodus verdrahten

**Status:** in Arbeit

**Status:** erledigt — Regions-Hauptstadtfinder (Aufgabe „Hauptstadt finden“) inkl. Daten für DE/AT/CH/US/CA/AU/BR/MX/PL/ZA/BE/AR/NZ/JP/IN/CN

---

## 2026-07-19 — Prompt 19

**User:** Spielmodus mit Flaggen auf Länder- und Regionenebene.

**Aktion:**
- Flaggen-Quiz für Länder und Regionen (Aufgabe im Regionen-Modus)

**Status:** in Arbeit

**Status:** erledigt — Flaggen-Modus (Länder) + Regionsaufgabe „Flagge finden“ via iso3166-flags CDN

---

## 2026-07-19 — Prompt 20

**User:** In der Individualländeransicht die 10 größten Städte anzeigen und zuordnen lassen.

**Aktion:**
- Städtedaten + Marker auf Zoom-Karte + Quiz-Aufgabe „Stadt zuordnen“

**Status:** in Arbeit

**Status:** erledigt — Aufgabe „Städte zuordnen“: Top-10-Städte als nummerierte Marker, Name zuordnen per Klick

---

## 2026-07-19 — Prompt 21

**User:** Beim Klick auf eine Stadtnummer werden kurz alle Städtenamen angezeigt — unerwünscht.

**Aktion:**
- Nur Ziel-/Fehlklick-Label in der Reveal-Phase zeigen

**Status:** in Arbeit

**Status:** erledigt — nur noch Name der gesuchten (und ggf. falsch geklickten) Stadt

---

## 2026-07-19 — Prompt 22

**User:** Städte-Quiz nur für Regionen-Länder; Daten veraltet (DE ohne Leipzig).

**Aktion:**
- Städte für alle spielbaren Länder; DE Top-10 aktualisieren; Zoom ohne Regionen fixen

**Status:** in Arbeit

**Status:** erledigt — Städte für ~146 Länder; DE-Top-10 inkl. Leipzig/Düsseldorf; Städte-Quiz ohne Regionen-Zwang

**Status:** erledigt — Städte für ~146 Länder; DE-Top-10 inkl. Leipzig/Düsseldorf; Städte-Quiz ohne Regionen-Zwang

---

## 2026-07-19 — Prompt 23

**User:** Städtefinder als eigenen Spielmodus statt Regions-Aufgabe.

**Aktion:**
- Neuer Top-Level-Modus „Städte“; aus Regionen-Aufgaben entfernen

**Status:** in Arbeit

**Status:** erledigt — Städte als eigener Spielmodus; aus Regionen-Aufgaben entfernt

---

## 2026-07-19 — Prompt 24

**User:** Im Städtefinder sind weiterhin nicht alle Länder auswählbar.

**Aktion:**
- Abdeckung der Städtedaten prüfen und Pool auf alle spielbaren Länder erweitern

**Status:** in Arbeit

**Status:** erledigt — Städtedaten für alle 166 spielbaren Länder; Deduplizierung entschärft; Min. 3 Städte

---

## 2026-07-20 — Prompt 25

**User:** Link zum Öffnen im Browser (Safari).

**Aktion:**
- Dev-Server starten und Local-URL mitteilen

**Status:** in Arbeit

**Status:** erledigt — Dev-Server unter http://127.0.0.1:5173/

---

## 2026-07-20 — Prompt 26

**User:** Auf der Startseite soll sich der Globus drehen.

**Aktion:**
- Idle-Rotation im Intro-Zustand der WorldMap

**Status:** in Arbeit

**Status:** erledigt — Idle-Rotation des Globus auf der Startseite

---

## 2026-07-20 — Prompt 27

**User:** Spielmodi als Kreise mit Symbolen um den Globus; Kontinent/Land erst nach Klick auf einer Folgeseite.

**Aktion:**
- Intro-Orbit-UI + Setup-Schritt für Filter

**Status:** in Arbeit

---

## 2026-07-20 — Prompt 28

**User:** Orbit-Startseite und Setup-Schritt laut Plan umsetzen.

**Aktion:**
- Phase setup, Orbit-Modi, Setup-Panel, CSS

**Status:** in Arbeit

**Status:** erledigt — Orbit-Startseite mit Moduskreisen + Setup-Schritt

---

## 2026-07-20 — Prompt 29

**User:** Globus zoomen können, idealerweise mit Plus- und Minus-Zeichen.

**Aktion:**
- Zoom-Steuerung (+/−) in WorldMap

**Status:** in Arbeit

**Status:** erledigt — Zoom +/− Buttons am Globus

---

## 2026-07-20 — Prompt 30

**User:** Zoom überschneidet sich mit den Spielmodus-Symbolen.

**Aktion:**
- Zoom-Buttons auf Intro/Setup aus dem Orbit raus positionieren

**Status:** in Arbeit

**Status:** erledigt — Zoom-Buttons auf Intro/Setup fixed unten rechts, außerhalb des Orbit

---

## 2026-07-20 — Prompt 31

**User:** Projekt mit einem GitHub-Kanal/Repository verbinden.

**Aktion:**
- Git-Status prüfen, Repo anlegen und mit GitHub verknüpfen

**Status:** in Arbeit

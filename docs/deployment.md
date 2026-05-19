# Deployment-Anleitung — VisionLab auf vision.pingel-ai-solutions.de

Dieses Dokument beschreibt die einmaligen Schritte zur Aktivierung von
Repository, CI/CD und Custom Domain. Sobald alles eingerichtet ist, läuft
jeder weitere Deploy automatisch durch einen Push auf `main`.

---

## Architektur-Überblick

```
            ┌──────────────────────┐
            │ Local: D:\VisionLab  │  (Entwicklung, Tests, Build)
            └──────────┬───────────┘
                       │ git push main
                       ▼
            ┌──────────────────────┐
            │ GitHub: VisionLab    │  (public, AGPL-3.0)
            │ Actions-Workflow     │  (Test → Build → Deploy)
            └──────────┬───────────┘
                       │ deploy-pages
                       ▼
            ┌──────────────────────┐
            │ GitHub Pages         │  (CDN-Hosting)
            └──────────┬───────────┘
                       │ Custom Domain via CNAME
                       ▼
            ┌──────────────────────┐
            │ Cloudflare DNS       │
            │ vision → fabianpingel│
            │           .github.io │
            └──────────┬───────────┘
                       │
                       ▼
        https://vision.pingel-ai-solutions.de
```

---

## Schritt 1: GitHub-Repo anlegen

Auf <https://github.com/new>:

| Feld | Wert |
|---|---|
| Repository name | `VisionLab` |
| Description | "Live-Objekterkennung im Browser — Demo-PWA von PINGEL AI Solutions" |
| Visibility | **Public** (AGPL-Pflicht: Source muss zugänglich sein) |
| Initialize with README / .gitignore / license | **alles DEAKTIVIERT** — wir haben unsere eigenen Dateien |

Klick auf **Create repository**.

---

## Schritt 2: Lokales Repo pushen

GitHub zeigt nach Erstellung die Befehle für „existing local repository". Bei
uns ist `main` bereits der Default-Branch, daher:

```powershell
cd D:\VisionLab
git remote add origin https://github.com/fabianpingel/VisionLab.git
git push -u origin main
```

Beim ersten Push werden alle Commits (Phase 1–12) hochgeladen — inklusive der
ca. 49 MB ONNX-Modelle. Das kann je nach Upload-Geschwindigkeit ein paar Minuten dauern.

> **Hinweis:** Die einzelne `yolo11s-coco.onnx`-Datei ist 38 MB. GitHub erlaubt
> max. 100 MB pro Datei, also kein Problem — Git LFS ist nicht nötig.

---

## Schritt 3: GitHub Pages konfigurieren

Im Repo:

1. **Settings → Pages**
2. **Source:** `GitHub Actions` (NICHT „Deploy from a branch")
3. **Custom domain:** `vision.pingel-ai-solutions.de` eintragen
4. GitHub prüft DNS — der CNAME-Eintrag bei Cloudflare muss auf
   `fabianpingel.github.io` zeigen (das hast du schon eingerichtet). Wenn der
   DNS-Check grün ist:
5. **Enforce HTTPS** aktivieren (Pflicht für `getUserMedia`)

Falls der DNS-Check rot bleibt:
- Cloudflare-Eintrag `vision` muss auf **DNS-only** stehen (graue Wolke, nicht orange).
- Sonst kommt es zu SSL-Handshake-Fehlern.

---

## Schritt 4: Erster Deploy

Sobald der Push aus Schritt 2 durch ist, läuft der Actions-Workflow
automatisch los:

1. **Tests** (typecheck, lint, vitest)
2. **Build** (`npm run build` → `dist/`)
3. **Deploy** (Pages-Artefakt live schalten)

Im Repo: **Actions** → laufenden Workflow anklicken → Fortschritt verfolgen.

Dauer pro Deploy: 3–6 Minuten (mit npm-Cache nach dem ersten Lauf schneller).

---

## Schritt 5: Verifikation

Sobald der Workflow grün ist:

```
https://vision.pingel-ai-solutions.de
```

aufrufen und durch die **manuelle Checkliste** gehen (`tests/manual-checklist.md`).

GitHub Pages braucht ggf. 1–2 Minuten, bis ein neuer Deploy weltweit
propagiert ist. Falls die alte Version zwischengespeichert ist:
Hard-Reload (Strg+F5) oder Inkognito-Tab.

---

## Workflow im Alltag (nach Setup)

```powershell
# Änderung machen
# (z.B. Disclaimer-Text anpassen)

# Lokal verifizieren
npm run typecheck
npm run lint
npm run test
npm run build

# Manuell testen (Stichprobe)
npm run preview

# Committen + Pushen
git add -A
git commit -m "Kurze Beschreibung der Änderung"
git push
```

Ab dann läuft der Deploy automatisch. **Bei rot in Actions: kein Deploy** →
das CI-Gate verhindert kaputten Live-Stand.

---

## Troubleshooting

### „App installieren" erscheint nicht im Browser

- PWA braucht **HTTPS** und ein **valides Manifest**.
- Lighthouse-Audit in Chrome DevTools → PWA → schauen, was fehlt.
- Service Worker muss aktiv sein: DevTools → Application → Service Workers.

### Modelle laden nicht (404 in der Konsole)

- Vite legt sie unter `/models/` aus → muss exakt so im Manifest stehen.
- GitHub Pages serviert sie statisch. Falls Probleme: Workflow-Run prüfen, ob
  `public/models/` ins `dist/` kam.

### Custom Domain zeigt „GitHub Pages site not found"

- DNS-Propagation kann bis zu 24h dauern (üblich aber: 5–30 Min).
- Test mit `nslookup vision.pingel-ai-solutions.de` — sollte CNAME auf
  `fabianpingel.github.io` zeigen.
- In Repo-Settings prüfen, ob die Custom Domain noch eingetragen ist (sie kann
  bei Konflikten automatisch entfernt werden).

### „Mixed Content"-Fehler in der Konsole

- Alle Ressourcen müssen HTTPS sein. Da wir keine externen Quellen nutzen,
  sollte das nicht passieren — wenn doch, ist eine versehentliche http://-URL
  im Code.

---

## Sicherheits-Check vor Go-Live

Vor dem ersten Push einmal durchgehen:

- [ ] Keine `.env*` Dateien committed (`git status` vor Push)
- [ ] Keine API-Keys oder Tokens in der Codebase (Grep nach `sk-`, `pk_`, `token`)
- [ ] `LICENSE` enthält AGPL-Volltext + Third-Party-Notices
- [ ] Disclaimer-Modal funktioniert (manuell getestet)
- [ ] PWA-Manifest mit korrekten Brand-Daten (`dist/manifest.webmanifest`)

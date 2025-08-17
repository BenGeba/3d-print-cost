# 3D Print Cost

A cost calculator for FDM 3D prints. It helps you estimate **material**, **energy**, and (optionally) **business** costs with a clear, itemized breakdown. Built with **Vite + React**, **Tailwind CSS + daisyUI**, and shipped as a **PWA** (installable/offline-capable).

> PWA installability and offline features are best tested with the production preview (`npm run build && npm run preview`). ([vitejs][1])

---

## Features

* **Cost model:** material (by grams or length→grams), energy (avg. power × time), maintenance, depreciation, labor, margin
* **Hobby / Business mode** with inline validation and undo toasts
* **Material presets** (PLA, PETG, ABS), **printer power presets**, **custom overrides**
* **Dark/Light themes** via **daisyUI** (*Nord* for light, *Dracula* for dark) and a swap toggle ([daisyui.com][2])
* **PWA support:** installable on desktop & mobile, offline fallback, optional in-app “Install” button (`beforeinstallprompt`) ([MDN Web Docs][3])

---

## Tech Stack

* **Vite** (dev server & build)
* **React**
* **Tailwind CSS** + **daisyUI** (components/themes) ([daisyui.com][2])
* **vite-plugin-pwa** (manifest + Service Worker; `virtual:pwa-register`) ([vite-pwa-org.netlify.app][4])

---

## Quick Start

```bash
# 1) Install dependencies
npm install

# 2) Development (hot reload)
npm run dev

# 3) Production build
npm run build

# 4) Production preview (PWA testing: manifest + service worker active)
npm run preview
```

> The **preview** server renders your built app locally so you can verify PWA features (manifest, SW, caching) like in production. ([vitejs][5])

---

## PWA / Installability

Your app is installable when it has:

* a valid **Web App Manifest** (name/short\_name, `start_url`, **square icons 192 & 512 px**, etc.),
* an active **Service Worker**, and
* is served via **HTTPS or localhost**.
  Browsers may also apply small **engagement heuristics** before showing the install UI; Chrome exposes the `beforeinstallprompt` event to build a custom “Install” button. ([MDN Web Docs][3], [web.dev][6])

**Where to put static assets:** place icons, `offline.html`, and screenshots in Vite’s **`public/`** directory at the project root. Files in `public/` are available at the site root during dev and copied as-is to `dist/` on build. ([vitejs][7])

---

## Scripts

* `npm run dev` — start Vite dev server
* `npm run build` — production build
* `npm run preview` — serve the build locally (ideal for PWA testing) ([vitejs][1])

---

## Project Structure

```
.
├─ public/                    # icons, offline.html, screenshots, favicons (served at /)
├─ src/
│  ├─ components/InstallPWAButton.jsx
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ vite.config.ts
└─ package.json
```

> Reminder: assets in `public/` are referenced as `/file.png` (not `/public/file.png`). ([vitejs][7])

---

## Development Notes

* **daisyUI themes & swap:** enable themes in Tailwind (via `@plugin "daisyui" { themes: ... }`) and use the **Swap** component or Theme Controller to toggle light/dark. ([daisyui.com][2])
* **PWA registration:** `vite-plugin-pwa` can auto-register the SW; for interactive flows, import the virtual module (e.g., `virtual:pwa-register`) in `main.jsx`. ([vite-pwa-org.netlify.app][4])
* **Node.js version:** follow Vite’s current Node support policy (as of now: Node **20.19+ / 22.12+**). ([vitejs][8])

---

## Contributing

Issues and pull requests are welcome. Please ensure the project builds cleanly:

```bash
npm ci
npm run build
```

---

## License

See **`LICENSE`** in this repository.
(If you intend to **restrict commercial use**, consider a *source-available* non-commercial license such as **PolyForm Noncommercial 1.0.0** or **BSL-1.1**, instead of an OSI license like MIT/Apache, which **permit commercial use** by definition.)

---

## References

* Vite — **public directory** & production **build/preview** guides. ([vitejs][7])
* **vite-plugin-pwa** — registering the Service Worker & virtual modules. ([vite-pwa-org.netlify.app][4])
* **PWA installability** — MDN and Chrome install criteria; `beforeinstallprompt`. ([MDN Web Docs][3], [web.dev][6])
* **daisyUI** — themes & swap component. ([daisyui.com][2])

[1]: https://vite.dev/guide/build?utm_source=chatgpt.com "Building for Production"
[2]: https://daisyui.com/docs/themes/?lang=en&utm_source=chatgpt.com "daisyUI themes — Tailwind CSS Components ( version 5 ..."
[3]: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable?utm_source=chatgpt.com "Making PWAs installable - Progressive web apps | MDN"
[4]: https://vite-pwa-org.netlify.app/guide/register-service-worker?utm_source=chatgpt.com "Register Service Worker | Guide - Vite PWA"
[5]: https://vite.dev/guide/cli?utm_source=chatgpt.com "Command Line Interface"
[6]: https://web.dev/articles/install-criteria?utm_source=chatgpt.com "What does it take to be installable? | Articles"
[7]: https://vite.dev/guide/assets?utm_source=chatgpt.com "Static Asset Handling"
[8]: https://vite.dev/guide/?utm_source=chatgpt.com "Getting Started"

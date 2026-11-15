# Fieldwork — Personal Field Logbook
A simple, private logbook for recording the materials you used, near misses, and field notes on the job. It runs entirely in your browser: no accounts, no server, no build step.

## Features
- **Three entry types**: materials used (with quantity and unit), near misses (with Low / Medium / High severity), and general field notes
- **Search and filter** your log by entry type or free text
- **Live totals** for all entries, materials used, and near misses
- **Export backup** to JSON and **import it back** to restore or move your log between devices
- **Download CSV** for use in Excel or Google Sheets
- **Local-only storage** via `localStorage`, so your data never leaves your device
- **Responsive layout** that works on desktop and phone
- **Accessible** markup with labeled controls, visible focus states, and reduced-motion support

## Getting started

No installation or dependencies required.

1. Download or clone this repository.
2. Open `index.html` in any modern browser.

To host it, upload the files to any static host such as GitHub Pages, Netlify, or Cloudflare Pages.

## Usage

1. Choose an **entry type**, set the date, and fill in the details.
2. Click **Save entry**. It appears in your log immediately.
3. Use the filter and search box to find past entries.
4. Click **×** on an entry to delete it (you'll be asked to confirm).
5. Use **Export backup** regularly. Data lives in one browser on one device, so clearing site data will erase it.

> **Note:** Fieldwork is a personal notebook, not a formal reporting system. Always follow your employer's required process for urgent or formal safety reports.

## Data and privacy

- Entries are stored in your browser's `localStorage` under the key `fieldwork_friend_logbook_v1`.
- Nothing is uploaded or synced anywhere.
- Importing a backup **replaces** the entries currently on the device, and it validates the file structure before doing so.
- CSV exports neutralize cells that begin with `=`, `+`, `-`, or `@` to prevent spreadsheet formula injection.
- All user-entered text is HTML-escaped before rendering.

## Project structure

```
├── index.html   # Page markup
├── styles.css   # Styling and responsive layout
└── app.js       # Logic: storage, rendering, import/export
```

## Tech
Plain HTML, CSS, and vanilla JavaScript. No frameworks, no build tools.

## Browser support
Any current version of Chrome, Edge, Firefox, or Safari.

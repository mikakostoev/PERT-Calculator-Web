# PERT Calculator — Web

Browser version of [PERT Calculator](https://github.com/mikakostoev/PERT-Calculator).

**Live:** https://mikakostoev.github.io/PERT-Calculator-Web/

## How It Works

The app calculates project estimates using the PERT method:

`PERT = (optimistic + 4 × realistic + pessimistic) / 6`

Then it applies:

- a **familiarity mode** multiplier
- a **buffer risk** percentage
- the **hourly rate**

Familiarity modes:

- **FAMILIAR** — multiplier `1.0`
- **MODERATE** — multiplier `1.3`
- **FIRST TIME** — multiplier `1.7`

## How to Use

- add a new task
- delete a task
- edit the task title
- edit optimistic, realistic, and pessimistic hours
- change the hourly rate
- change the buffer risk
- cycle the familiarity mode for each task

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run test
npm run build    # static site in dist/
```

Pushes to `main` deploy to GitHub Pages automatically.

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Vite
- Vitest

# SpeedReader (Next.js)

A modern RSVP speed-reading experience rebuilt on **Next.js 14** with the App Router, Tailwind CSS, and rich customization controls.

## 🚀 Stack

- **Next.js 14 (App Router)** for routing, layouts, and hybrid rendering
- **React 18** client components for interactive reading flows
- **Tailwind CSS 3** with custom theme tokens and animations
- **Redux Toolkit** foundations for future global state
- **D3 + Recharts + Framer Motion** for data-rich visualizations and motion
- **React Hook Form** for ergonomic form handling

## 📋 Prerequisites

- Node.js 18+
- npm (included with Node) or pnpm/yarn if preferred

## 🛠️ Getting Started

```bash
npm install
npm run dev        # start Next.js dev server at http://localhost:3000

npm run build      # create a production build
npm start          # serve the production build
npm run lint       # run ESLint with Next.js rules
```

## 📁 Project Structure

```
.
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router entries (page/layout/not-found)
│   ├── components/             # Shared UI widgets (buttons, navigation, etc.)
│   ├── features/               # Screen-level React components (library, settings, RSVP reader)
│   ├── styles/                 # Tailwind + global styles and theme tokens
│   └── utils/                  # Reusable helpers (reader settings persistence)
├── tailwind.config.js          # Tailwind setup (App Router aware content globs)
├── next.config.mjs             # Next.js configuration
└── package.json                # Scripts and dependencies
```

### Routing overview

| Route | File |
| --- | --- |
| `/` and `/main-reader-interface` | `src/app/page.jsx`, `src/app/main-reader-interface/page.jsx`
| `/settings-configuration` | `src/app/settings-configuration/page.jsx`
| `/rsvp-reader-view` | `src/app/rsvp-reader-view/page.jsx`
| 404 fallback | `src/app/not-found.jsx`

Each page imports a client component from `src/features`, keeping data fetching/layout concerns in the App Router while the UI stays interactive.

## 🎨 Styling & Theming

Tailwind CSS powers the UI with custom CSS variables for colors, radii, and typography defined in `src/styles/tailwind.css`. Global styles are loaded in `src/app/layout.jsx`, and plugins like Typography, Container Queries, and Animate are enabled for expressive components.

## 📦 Deployment

Next.js outputs optimized assets in the `.next` directory. You can deploy via any Node-friendly platform (Vercel, Netlify, Render, etc.):

1. `npm run build`
2. `npm start` (or your platform’s Next.js adapter)

For static hosting, configure Next.js export or use the official adapters for your target platform.

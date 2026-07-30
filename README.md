<div align="center">

# wwew.tech

**A minimalist, performance-obsessed developer portfolio**

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion)

<br />

[![Live](https://img.shields.io/badge/live-wwew.tech-10b981?style=flat-square)](https://wwew.tech)
[![Deployed on Vercel](https://img.shields.io/badge/deployed-vercel-black?style=flat-square&logo=vercel)](https://wwew.tech)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)](.github/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](#license)

<br />

<samp>bilingual&nbsp;&nbsp;·&nbsp;&nbsp;3D WebGL&nbsp;&nbsp;·&nbsp;&nbsp;inertia scroll&nbsp;&nbsp;·&nbsp;&nbsp;fluid cursor&nbsp;&nbsp;·&nbsp;&nbsp;SSR-safe i18n</samp>

<br />

<a href="https://wwew.tech"><strong>&nbsp;&nbsp;Visit the site →&nbsp;&nbsp;</strong></a>

</div>

---

## Table of contents

- [Overview](#overview)
- [Highlights](#highlights)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Performance](#performance)
- [Internationalization](#internationalization)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**wwew.tech** is a full-stack developer's personal landing page — a single-page experience designed around three principles: *speed*, *restraint*, and *craft*. The site is built on the Next.js App Router with React Server Components, a Lenis-driven smooth-scroll pipeline, a Three.js holographic scene, and a bilingual (RU / EN) copy system that stays hydration-safe.

> Not a template. Every section — from the shiny-text hero to the fluid cursor — is written in-house.

Live at **[wwew.tech](https://wwew.tech)**.

---

## Highlights

<table>
<tr>
<td width="50%" valign="top">

### Experience

- **Bilingual** — Russian & English, toggled from the navbar, synchronized with SSR
- **3D scene** — Holographic WebGL background with postprocessing effects
- **Fluid cursor** — Custom canvas-based liquid cursor, gracefully disabled on touch
- **Smooth scroll** — GPU-accelerated inertia via [Lenis](https://github.com/darkroomengineering/lenis)
- **Motion** — Framer Motion spring physics plus CSS-only hero animations for LCP stability

</td>
<td width="50%" valign="top">

### Engineering

- **App Router** — React Server Components, streaming, typed metadata
- **SSR skeleton** — Hero text rendered on the server for instant LCP
- **Lazy loading** — Below-the-fold sections code-split and deferred
- **Tree shaking** — `optimizePackageImports` for framer-motion, three, drei, lucide
- **Hardened headers** — DNS prefetch, X-Content-Type-Options, aggressive asset caching
- **SEO** — Open Graph + Twitter cards, JSON-LD Person schema, sitemap, robots, manifest

</td>
</tr>
</table>

---

## Tech stack

| Layer          | Technology                                                               |
| :------------- | :----------------------------------------------------------------------- |
| Framework      | **Next.js 16** (App Router, RSC, streaming)                              |
| Language       | **TypeScript 5** (strict)                                                |
| Styling        | **Tailwind CSS v4** with CSS-variable design tokens                      |
| Animation      | **Framer Motion 12** + hand-written CSS keyframes                        |
| 3D / WebGL     | **Three.js** · `@react-three/fiber` · `@react-three/drei` · `postprocessing` |
| Scroll         | **Lenis 1.3** (inertia, RAF-synchronized)                                |
| Icons          | **Lucide React**                                                         |
| Fonts          | **Geist Sans** (`next/font`, preloaded, fallback-adjusted)               |
| CI             | **GitHub Actions** (lint · typecheck · build)                            |
| Hosting        | **Vercel** (edge runtime, automatic AVIF/WebP)                           |

---

## Architecture

```
         ┌──────────────────────────────────────────────────┐
         │                  app/layout.tsx                  │
         │  Metadata · JSON-LD · Viewport · Global fonts    │
         └──────────────────────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
        AppProvider       LenisProvider      FluidCursorWrapper
        (i18n state)      (inertia scroll)   (deferred canvas)
                                 │
                                 ▼
                       ┌──────────────────┐
                       │   app/page.tsx   │  ←  SSR hero skeleton
                       └──────────────────┘
                                 │
                                 ▼
                     ClientHomePage (hydrates)
                                 │
         ┌───────────────┬───────┴────────┬───────────────┐
         ▼               ▼                ▼               ▼
        Hero        Philosophy        Projects       ContactHub
                        +                 +
                   HolographicScene   StackGrid
                     (Three.js)       (lazy)
```

**Rendering strategy.** The hero is server-rendered as a skeleton for an instant LCP, then `ClientHomePage` hydrates on top of it. `FluidCursorWrapper` mounts a canvas deferred behind `requestIdleCallback`, and heavy below-the-fold components (`HolographicScene`, `StackGrid`) are dynamically imported.

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx            Root layout · metadata · JSON-LD
│   ├── page.tsx              SSR entry · hero skeleton
│   ├── opengraph-image.tsx   Dynamic OG image
│   ├── twitter-image.tsx     Dynamic Twitter card
│   ├── sitemap.ts            Sitemap generation
│   ├── robots.ts             Robots policy
│   └── globals.css           Tokens · keyframes · utilities
│
├── components/
│   ├── ClientHomePage.tsx    Client shell that composes sections
│   ├── layout/               Navbar · Footer
│   ├── providers/            LenisProvider · FluidCursorWrapper
│   ├── sections/             Hero · Philosophy · ContactHub
│   └── ui/                   HolographicScene · FluidCursor · ShinyText · StackGrid
│
├── context/
│   └── AppContext.tsx        Language context · RU/EN translation dictionary
│
├── lib/
│   └── utils.ts              cn() and shared helpers
│
└── proxy.ts                  Locale routing & i18n redirect handler
```

---

## Getting started

### Prerequisites

- **Node.js** ≥ 18
- **npm**, **yarn**, or **pnpm**

### Install

```bash
git clone https://github.com/wwewtech/wwew.tech.git
cd wwew.tech
npm install
```

### Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build && npm run start
```

No environment variables are required. Optionally set `NEXT_PUBLIC_SITE_URL` to override the canonical URL used in metadata.

---

## Scripts

| Command          | Purpose                                         |
| :--------------- | :---------------------------------------------- |
| `npm run dev`    | Start the Next.js dev server with HMR           |
| `npm run build`  | Create an optimized production build            |
| `npm run start`  | Serve the production build on port 3000         |
| `npm run lint`   | Run ESLint with the Next.js config              |
| `npx tsc --noEmit` | Type-check the project without emitting files  |

---

## Performance

The site is engineered for sub-second interaction on mid-range mobile hardware.

- **LCP-first hero** — plain-text H1 rendered server-side, zero animation on the critical path
- **Code splitting** — `HolographicScene`, `FluidCursor`, and the projects grid are dynamic imports
- **Font strategy** — `next/font` with `display: swap`, `adjustFontFallback`, and preload
- **Image pipeline** — AVIF → WebP fallback, custom `deviceSizes`, immutable 1-year cache on hashed assets
- **Bundle size** — `optimizePackageImports` applied to `framer-motion`, `three`, `@react-three/*`, `lucide-react`, `lenis`
- **Source maps** — disabled in production to shrink artifacts
- **Caching headers** — `public, max-age=31536000, immutable` for static assets and `/_next/static/*`

---

## Internationalization

Language state is managed by a lightweight context in [src/context/AppContext.tsx](src/context/AppContext.tsx):

- Translation dictionaries for **Russian** and **English** live inline — no network round-trip
- The default language is rendered in SSR so the first paint is never empty
- The toggle persists to `localStorage` and updates `<html lang>` on the client

Adding a locale is a matter of extending the `translations` record and the `Language` union.

---

## Deployment

The project is deployed continuously to **Vercel** from the `main` branch.

To deploy your own copy:

1. Fork this repository
2. Import it into [Vercel](https://vercel.com/new)
3. Accept the defaults — no environment variables required
4. *(Optional)* Set `NEXT_PUBLIC_SITE_URL` to your custom domain

CI (lint + type-check + build) runs on every push and pull request via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Contributing

Issues and pull requests are welcome. Please:

1. Open an issue first for non-trivial changes — templates are in [.github/ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE)
2. Keep commits focused and write meaningful messages
3. Make sure `npm run lint` and `npx tsc --noEmit` both pass
4. Follow the existing style — no comment noise, no speculative abstractions

---

## License

Released under the **MIT License**.

<br />

<div align="center">

<sub>Designed & built by <a href="https://wwew.tech"><b>wwew</b></a> — contact via <a href="https://t.me/wwewtech">Telegram</a></sub>

</div>

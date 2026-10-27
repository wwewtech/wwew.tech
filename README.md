<div align="center">

# wwew.tech

**A minimalist, performance-obsessed developer portfolio**

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org)
[![GLSL](https://img.shields.io/badge/GLSL-Shaders-5586A4?style=for-the-badge&logo=opengl&logoColor=white)](https://threejs.org)

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

> Every section is built in-house — the 3D holographic scene, the shiny-text hero, the fluid cursor engine (a React/Tailwind adaptation of the open-source [WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) by Pavel Dobryakov, MIT), the bento stack grid and the drag switcher.

Live at **[wwew.tech](https://wwew.tech)**.

---

## Highlights

<table>
<tr>
<td width="50%" valign="top">

### Experience

- **Bilingual** — Russian & English, toggled from the navbar, synchronized with SSR
- **3D scene** — Holographic WebGL Torus Knot with custom iridescent GLSL shaders
- **Fluid cursor** — Custom canvas-based liquid cursor, gracefully disabled on touch
- **Smooth scroll** — GPU-accelerated inertia via [Lenis](https://github.com/darkroomengineering/lenis)
- **Motion** — Hand-crafted CSS keyframes & Houdini `@property` for zero-overhead, LCP-stable animations

</td>
<td width="50%" valign="top">

### Engineering

- **App Router** — React Server Components, typed metadata
- **SSG hero** — complete hero text prerendered at build time for instant LCP
- **Lazy loading** — Below-the-fold sections code-split and deferred
- **Tree shaking** — `optimizePackageImports` for three, drei, lucide, lenis
- **Hardened headers** — DNS prefetch, X-Content-Type-Options, aggressive asset caching
- **SEO & AI** — Open Graph + Twitter cards, JSON-LD Person schema, sitemap, robots, manifest, llms.txt
- **Branded 404** — a themed, translated not-found page instead of the framework default

</td>
</tr>
</table>

---

## Tech stack

| Layer          | Technology                                                               |
| :------------- | :----------------------------------------------------------------------- |
| Framework      | **Next.js 16** (App Router, RSC)                                           |
| Language       | **TypeScript 5** (strict)                                                |
| Styling        | **Tailwind CSS v4** with CSS-variable design tokens                      |
| Animation      | **Hand-crafted CSS animations** + Houdini `@property` keyframes          |
| 3D / WebGL     | **Three.js** · `@react-three/fiber` · `@react-three/drei` · Custom GLSL   |
| Scroll         | **Lenis 1.3** (inertia, RAF-synchronized)                                |
| Icons          | **Lucide React**                                                         |
| Fonts          | **Geist Sans** (`next/font`, preloaded, fallback-adjusted)               |
| CI             | **GitHub Actions** (lint · typecheck · build)                            |
| Hosting        | **Vercel** (Node.js runtime + CDN, automatic AVIF/WebP)                    |

---

## Architecture

```
         ┌──────────────────────────────────────────────────┐
         │                  app/layout.tsx                  │
         │             Base metadata & root shell           │
         └──────────────────────────────────────────────────┘
                                 │
         ┌──────────────────────────────────────────────────┐
         │              app/[locale]/layout.tsx             │
         │  Metadata · JSON-LD · Viewport · Global fonts    │
         └──────────────────────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
        AppProvider       LenisProvider      FluidCursorWrapper
        (i18n state)      (inertia scroll)   (deferred canvas)
                                 │
                                 ▼
                     ┌──────────────────────┐
                     │ app/[locale]/page.tsx│  ←  SSG hero markup & LCP tokens
                     └──────────────────────┘
                                 │
                                 ▼
                     ClientHomePage (hydrates)
                                 │
         ┌───────────────┬───────┴────────┬───────────────┐
         ▼               ▼                ▼               ▼
        Hero        Philosophy        StackGrid       ContactHub
                        +             (Bento grid)    (Personal & Team)
                   HolographicScene
                  (Three.js + GLSL)
```

**Rendering strategy.** Both locales are prerendered as static HTML at build time (SSG via `generateStaticParams`), so the hero ships as complete server-rendered markup for an instant LCP — no skeleton swap, the H1 text is present in the first HTML response. `ClientHomePage` hydrates on top of it. `FluidCursorWrapper` mounts a canvas only after the user enables the effect, and heavy below-the-fold components (`HolographicScene`, `StackGrid`) are dynamically imported.

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx            Root metadata layout
│   ├── global-not-found.tsx  Branded 404 for unmatched URLs · own document shell
│   ├── [locale]/
│   │   ├── layout.tsx        Locale root layout · metadata · JSON-LD · providers
│   │   ├── page.tsx          SSG entry · hero markup
│   │   └── not-found.tsx     Branded 404 inside the locale layout
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
│   ├── sections/             Hero · Philosophy · ContactHub · NotFoundView
│   └── ui/                   HolographicScene · FluidCursor · ShinyText · StackGrid
│
├── context/
│   └── AppContext.tsx        Language / theme / fluid-cursor contexts
│
├── i18n/
│   ├── content.ts            Bilingual marketing copy for metadata & JSON-LD
│   ├── locales.ts            Locale negotiation · Accept-Language parsing
│   └── translations.ts       RU/EN UI dictionary
│
├── lib/
│   ├── device.ts             Device & reduced-motion detection
│   ├── fluidGL.ts            WebGL helpers · FBO/program disposal
│   ├── fluidShaders.ts       GLSL sources for the fluid simulation
│   ├── fluidSim.ts           Fluid simulation step / render / splat
│   └── metrika.ts            Yandex Metrika id & init snippet
│
├── __tests__/                Unit tests (Node's built-in runner)
│
└── proxy.ts                  Locale routing & i18n redirect handler
```

---

## Getting started

### Prerequisites

- **Node.js** ≥ 20
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
| `npm run typecheck` | Type-check the project without emitting files |
| `npm test`       | Run the unit tests (Node's built-in runner)     |

### Tests

Unit tests use the Node.js built-in test runner — no test framework dependency.
Node strips TypeScript types natively (enabled by default since v22.18.0), so
`npm test` runs `.ts` files directly.

```bash
npm test
```

Covered: locale negotiation (`Accept-Language` parsing, cookie override) and
the translation dictionaries.

---

## Performance

The site is engineered for sub-second interaction on mid-range mobile hardware.

- **LCP-first hero** — plain-text H1 rendered server-side, zero animation on the critical path
- **Code splitting** — `HolographicScene`, `FluidCursor`, and `StackGrid` are dynamic imports
- **Font strategy** — `next/font` with `display: swap`, `adjustFontFallback`, and preload
- **GPU hygiene** — the fluid cursor releases its textures, programs and context on teardown, and a theme switch updates uniforms instead of recreating the WebGL context
- **Bundle size** — `optimizePackageImports` applied to `three`, `@react-three/*`, `lucide-react`, `lenis`
- **Source maps** — disabled in production to shrink artifacts
- **Caching headers** — `public, max-age=31536000, immutable` for static assets and `/_next/static/*`

---

## Internationalization

Language state is managed by a lightweight context in [src/context/AppContext.tsx](src/context/AppContext.tsx):

- Translation dictionaries for **Russian** and **English** live in [src/i18n/translations.ts](src/i18n/translations.ts) — no network round-trip
- The active locale is rendered in SSR so the first paint is never empty
- The language toggle swaps the locale route; theme and fluid-cursor preferences persist to `localStorage`

Adding a locale is a matter of extending the `translations` record in [src/i18n/translations.ts](src/i18n/translations.ts) and the `Language` union.

### Locale negotiation

Requests to a URL without a locale are resolved by the proxy in
[src/proxy.ts](src/proxy.ts), using the logic in
[src/i18n/locales.ts](src/i18n/locales.ts):

1. The `locale` cookie — an explicit choice made by the visitor, remembered for
   a year. A visit to `/en` sets it, so the bare root keeps leading to the
   language the visitor picked.
2. The `Accept-Language` header — parsed properly, with `q`-weights honoured
   and only the primary language subtag compared.
3. `ru` as the fallback.

The redirect uses `307`, because the target now depends on the visitor and is
therefore not a permanent mapping.

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
3. Make sure `npm run lint` and `npm run typecheck` both pass
4. Follow the existing style — no comment noise, no speculative abstractions

---

## License

Released under the **MIT License**.

<br />

<div align="center">

<sub>Designed & built by <a href="https://wwew.tech"><b>wwew</b></a> — contact via <a href="https://t.me/wwewtech">Telegram</a></sub>

</div>

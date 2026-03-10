<div align="center">

# wwew.tech

**Personal portfolio & landing page**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://wwew.tech)

</div>

---

## Overview

A minimalist full-stack developer portfolio built for performance and visual quality. Features a bilingual interface (RU / EN), 3D WebGL visuals powered by Three.js, GPU-smooth scroll via Lenis, and physics-based animations with Framer Motion.

Live at **[wwew.tech](https://wwew.tech)**

---

## Features

- **Bilingual** — Russian & English, switchable in the navbar; SSR-safe with hydration-stable translations
- **3D scene** — Holographic WebGL background via `@react-three/fiber` + `@react-three/drei` + `postprocessing`
- **Smooth scroll** — Native-feel inertia scrolling with [Lenis](https://github.com/darkroomengineering/lenis)
- **Fluid cursor** — Custom canvas-based liquid cursor effect
- **Animations** — Intersection-observer–triggered entrance animations + Framer Motion spring physics
- **Performance** — Lazy-loaded below-fold sections, AVIF/WebP images, disabled production source maps, barrel-file tree shaking
- **SEO** — Metadata, Open Graph image, Twitter card, sitemap, robots.txt, web app manifest

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion 12 |
| 3D / WebGL | Three.js · React Three Fiber · Drei · Postprocessing |
| Scroll | Lenis 1.3 |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── app/                  # Next.js App Router (layout, page, metadata)
├── components/
│   ├── layout/           # Navbar, Footer
│   ├── providers/        # LenisProvider, FluidCursorWrapper
│   ├── sections/         # Hero, Philosophy, Projects, ContactHub
│   └── ui/               # FluidCursor, HolographicScene, StackGrid, ShinyText, …
├── context/
│   └── AppContext.tsx     # Language context + i18n translations
└── lib/
    └── utils.ts
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm / yarn / pnpm

### Installation

```bash
git clone https://github.com/wwewtech/wwew.tech.git
cd wwew.tech
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

---

## Deployment

The project is continuously deployed to **Vercel** on every push to `main`.

To deploy your own instance:

1. Fork this repository
2. Import into [Vercel](https://vercel.com/new)
3. No environment variables required — deploy as-is

---

## License

MIT

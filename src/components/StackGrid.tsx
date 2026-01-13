'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const stackCards = [
  {
    title: 'Frontend',
    desc: 'Pixel-perfect interfaces with smooth animations',
    tech: ['React', 'Next.js', 'TypeScript', 'Tailwind'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
  {
    title: 'Backend',
    desc: 'Scalable APIs and robust server architecture',
    tech: ['Python', 'FastAPI', 'Node.js', 'Django'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 12h14" />
        <path d="M5 6h14" />
        <path d="M5 18h14" />
        <circle cx="17" cy="6" r="2" />
        <circle cx="7" cy="12" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    ),
  },
  {
    title: 'Automation',
    desc: 'Data pipelines and intelligent automation',
    tech: ['Python', 'Selenium', 'Pandas'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M4.93 4.93l2.83 2.83" />
        <path d="M16.24 16.24l2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="M4.93 19.07l2.83-2.83" />
        <path d="M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    title: 'Mobile',
    desc: 'Cross-platform applications',
    tech: ['Flutter', 'React Native'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    title: 'Database',
    desc: 'Schema design & optimization',
    tech: ['PostgreSQL', 'MongoDB', 'Redis'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    title: 'DevOps',
    desc: 'CI/CD and cloud infrastructure',
    tech: ['Docker', 'Linux', 'AWS', 'Vercel'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7-7H4a2 2 0 00-2 2v17z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
  {
    title: 'Security',
    desc: 'Military-grade encryption',
    tech: ['OAuth', 'JWT', 'SSL'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'Performance',
    desc: 'Lightning-fast optimization',
    tech: ['Caching', 'CDN', 'SSR'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
];

export const StackGrid = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref}>
      {/* Grid with dividers - Vercel style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stackCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            className="group feature-card border-l border-[var(--border-subtle)] first:border-l-0 md:[&:nth-child(2)]:border-l md:[&:nth-child(5)]:border-l-0 lg:[&:nth-child(5)]:border-l"
          >
            {/* Icon */}
            <div className="text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors duration-300 mb-6">
              {card.icon}
            </div>

            {/* Content */}
            <h3 className="text-xl font-medium text-[var(--foreground)] mb-2 opacity-90 group-hover:opacity-100 transition-colors">
              {card.title}
            </h3>
            
            <p className="text-[var(--muted)] text-sm leading-relaxed mb-5">
              {card.desc}
            </p>

            {/* Tech Tags */}
            <div className="flex flex-wrap gap-2">
              {card.tech.map((tech, techIdx) => (
                <span
                  key={techIdx}
                  className="text-xs text-[var(--muted-foreground)] group-hover:text-[var(--muted)] transition-colors"
                >
                  {tech}{techIdx < card.tech.length - 1 && ' ·'}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

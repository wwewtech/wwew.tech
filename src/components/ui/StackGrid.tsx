'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

const stackCards = [
  {
    title: 'Frontend',
    desc: 'Pixel-perfect interfaces with smooth animations',
    tech: ['React', 'Next.js', 'Tailwind'],
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
    tech: ['Python', 'Node.js', '.NET'],
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
    tech: ['Selenium', 'OpenPyXL', 'n8n'],
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
    tech: ['Docker', 'Linux', 'Vercel', 'Dokploy'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7-7H4a2 2 0 00-2 2v17z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
  {
    title: 'AI',
    desc: 'LLM integration, AI agents, and smart solutions',
    tech: ['OpenAI', 'LangChain', 'Claude'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
        <path d="M9 1v3m6-3v3M9 20v3m6-3v3M20 9h3m-3 6h3M1 9h3m-3 6h3" />
      </svg>
    ),
  },
  {
    title: 'ML',
    desc: 'Model training, OpenCV, and intelligent solutions',
    tech: ['PyTorch', 'OpenCV', 'TensorFlow'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="5" r="2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="18" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
        <path d="M12 7v10" />
        <path d="M10.5 6.5l-3 4" />
        <path d="M13.5 6.5l3 4" />
        <path d="M7.5 13.5l3 4" />
        <path d="M16.5 13.5l-3 4" />
      </svg>
    ),
  },
];

export const StackGrid = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Простой IntersectionObserver вместо framer-motion useInView
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // once: true
        }
      },
      { threshold: 0.1, rootMargin: '-100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  return (
    <div ref={ref}>
      {/* Grid with dividers - Vercel style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stackCards.map((card, idx) => (
          <div
            key={idx}
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s ease ${idx * 0.05}s, transform 0.5s ease ${idx * 0.05}s`,
            }}
            onMouseMove={handleMouseMove}
            className="group feature-card flex flex-col h-full border-l border-(--border-subtle) first:border-l-0 md:nth-2:border-l md:nth-5:border-l-0 lg:nth-5:border-l"
          >
            {/* Icon with pulse effect */}
            <div className="text-(--muted) group-hover:text-foreground transition-all duration-500 mb-6 relative">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500">
                {card.icon}
              </div>
              <div>
                {card.icon}
              </div>
            </div>

            {/* Content */}
            <h3 className="text-xl font-medium text-foreground mb-2 opacity-90 group-hover:opacity-100 transition-all duration-300">
              {card.title}
            </h3>
            
            <p className="text-(--muted) text-sm leading-relaxed mb-5 min-h-[3rem] group-hover:text-foreground transition-colors duration-500">
              {card.desc}
            </p>

            {/* Tech Tags - без анимации для производительности */}
            <div className="flex flex-wrap gap-2 mt-auto">
              {card.tech.map((tech, techIdx) => (
                <span
                  key={techIdx}
                  className="text-xs text-(--muted-foreground) group-hover:text-(--muted) transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

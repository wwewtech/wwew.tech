'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ArrowUpRight, Github } from 'lucide-react';
import { useLanguage } from '@/lib/context';

const projects = [
  {
    title: 'E-Commerce Platform',
    desc: 'Full-featured online store with cart, payments, and admin dashboard.',
    tags: ['Next.js', 'Stripe', 'PostgreSQL'],
    link: '#',
    github: '#',
    image: '/project1.png',
  },
  {
    title: 'Automation System',
    desc: 'Data scraping and analytics pipeline processing 50+ sources.',
    tags: ['Python', 'Selenium', 'Telegram'],
    link: '#',
    github: '#',
    image: '/project2.png',
  },
  {
    title: 'SaaS Dashboard',
    desc: 'Real-time analytics dashboard with interactive data visualization.',
    tags: ['React', 'D3.js', 'WebSocket'],
    link: '#',
    github: '#',
    image: '/project3.png',
  },
];

export const Projects = () => {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '-100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative">
      {/* Header */}
      <div
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
        className="text-center mb-16"
      >
        <div className="pill-badge mx-auto mb-8">
          <span>{t('projects.badge')}</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 leading-[1.05]">
          <span className="text-gradient block pb-1">{t('projects.title')}</span>
        </h2>
        <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
          {t('projects.subtitle')}
        </p>
      </div>

      {/* Projects List - Clean rows like Vercel */}
      <div className="border-t border-[var(--border)]">
        {projects.map((project, idx) => (
          <article
            key={idx}
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s ease ${idx * 0.1}s, transform 0.5s ease ${idx * 0.1}s`,
            }}
            className="group border-b border-[var(--border)] py-10 md:py-14"
          >
            <div className="grid md:grid-cols-12 gap-8 items-center">
              {/* Project Info */}
              <div className="md:col-span-5">
                <h3 className="text-2xl md:text-3xl font-medium text-[var(--foreground)] mb-3 group-hover:opacity-80 transition-colors">
                  {project.title}
                </h3>
                <p className="text-[var(--muted)] leading-relaxed mb-4">
                  {project.desc}
                </p>
                <div className="flex items-center gap-3">
                  {project.tags.map((tag, tagIdx) => (
                    <span key={tagIdx} className="text-sm text-[var(--muted-foreground)]">
                      {tag}{tagIdx < project.tags.length - 1 && ' ·'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="md:col-span-5">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-[var(--border-subtle)] border border-[var(--border)]">
                  {/* Placeholder visual */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-lg border border-[var(--border)] bg-[var(--border-subtle)] flex items-center justify-center">
                      <span className="text-xl text-[var(--muted)]">⬡</span>
                    </div>
                  </div>
                  {/* Grid pattern */}
                  <div 
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
                      backgroundSize: '20px 20px'
                    }}
                  />
                </div>
              </div>

              {/* Links */}
              <div className="md:col-span-2 flex md:flex-col items-center md:items-end gap-3">
                <a
                  href={project.link}
                  className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  {t('projects.viewProject')}
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <a
                  href={project.github}
                  className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  {t('projects.viewCode')}
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* View All */}
      <div
        style={{
          opacity: isInView ? 1 : 0,
          transition: 'opacity 0.5s ease 0.5s',
        }}
        className="mt-12 text-center"
      >
        <a
          href="#"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30 transition-all"
        >
          View all projects
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
};

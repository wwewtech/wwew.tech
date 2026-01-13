'use client';

import React from 'react';
import { Github, Send, Mail } from 'lucide-react';
import { useLanguage } from '@/lib/context';

const socials = [
  { icon: Github, href: 'https://github.com/username', label: 'GitHub' },
  { icon: Send, href: 'https://t.me/your_username', label: 'Telegram' },
  { icon: Mail, href: 'mailto:hello@wwew.tech', label: 'Email' },
];

export const Footer = () => {
  const { t } = useLanguage();

  const links = [
    { label: t('nav.about'), href: '#about' },
    { label: t('nav.stack'), href: '#stack' },
    { label: t('nav.work'), href: '#projects' },
    { label: t('nav.contact'), href: '#contact' },
  ];

  return (
    <footer className="border-t border-[var(--border)] mt-32">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-12">
          {/* Logo & Description */}
          <div className="max-w-sm">
            <a href="#" className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-[var(--foreground)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 19.5h20L12 2z" />
              </svg>
              <span className="text-lg font-medium text-[var(--foreground)]">wwew.tech</span>
            </a>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-8">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Social */}
          <div className="flex items-center gap-2">
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="p-3 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-subtle)] transition-all"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} wwew.tech
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t('footer.built')}
          </p>
        </div>
      </div>
    </footer>
  );
};

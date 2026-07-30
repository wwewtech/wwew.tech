'use client';

import { useRef, useEffect, useState } from 'react';
import { Send, Mail, Github, Globe, ExternalLink, Briefcase, User, Users, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';

const personalContacts = [
  { 
    name: 'Telegram', 
    value: '@wwewtech',
    href: 'https://t.me/wwewtech', 
    icon: Send,
  },
  { 
    name: 'Email', 
    value: 'loiwerde666@gmail.com',
    href: 'mailto:loiwerde666@gmail.com', 
    icon: Mail,
  },
  { 
    name: 'GitHub', 
    value: 'github.com/wwewtech',
    href: 'https://github.com/wwewtech', 
    icon: Github,
  },
];

const teamContacts = [
  { 
    name: 'Website', 
    value: 'openspacedev.ru',
    href: 'https://openspacedev.ru/', 
    icon: Globe,
  },
  { 
    name: 'Kwork', 
    value: 'kwork.ru/user/openspaceteam',
    href: 'https://kwork.ru/user/openspaceteam', 
    icon: Briefcase,
  },
  { 
    name: 'Freelance.ru', 
    value: 'freelance.ru/openspaceai',
    href: 'https://freelance.ru/openspaceai', 
    icon: ExternalLink,
  },
];

export const ContactHub = () => {
  const ref = useRef<HTMLElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const personalBtnRef = useRef<HTMLButtonElement>(null);
  const teamBtnRef = useRef<HTMLButtonElement>(null);

  const [isInView, setIsInView] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'team'>('personal');
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null); // 0 = personal, 1 = team

  const [indicatorStyle, setIndicatorStyle] = useState<{ left: string; width: string }>({
    left: '6px',
    width: '48%',
  });

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

  // Compute slider indicator position & width dynamically in an effect (ref access outside render)
  useEffect(() => {
    const updateIndicatorStyle = () => {
      const pBtn = personalBtnRef.current;
      const tBtn = teamBtnRef.current;

      if (!pBtn || !tBtn) {
        setIndicatorStyle({
          left: activeTab === 'personal' ? '6px' : '50%',
          width: '48%',
        });
        return;
      }

      const pLeft = pBtn.offsetLeft;
      const pWidth = pBtn.offsetWidth;
      const tLeft = tBtn.offsetLeft;
      const tWidth = tBtn.offsetWidth;

      const progress = dragProgress !== null 
        ? dragProgress 
        : (activeTab === 'personal' ? 0 : 1);

      const currentLeft = pLeft + (tLeft - pLeft) * progress;
      const currentWidth = pWidth + (tWidth - pWidth) * progress;

      setIndicatorStyle({
        left: `${currentLeft}px`,
        width: `${currentWidth}px`,
      });
    };

    updateIndicatorStyle();
    window.addEventListener('resize', updateIndicatorStyle);
    return () => window.removeEventListener('resize', updateIndicatorStyle);
  }, [activeTab, dragProgress, t]);

  // Pointer drag & click handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    const startX = e.clientX;
    const initialProgress = activeTab === 'personal' ? 0 : 1;
    let isMoved = false;
    let currentProgress = initialProgress;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      if (Math.abs(deltaX) > 4) {
        isMoved = true;
        setIsDragging(true);
      }

      if (isMoved && personalBtnRef.current && teamBtnRef.current) {
        const distance = teamBtnRef.current.offsetLeft - personalBtnRef.current.offsetLeft;
        if (distance > 0) {
          const rawProgress = initialProgress + (deltaX / distance);
          currentProgress = Math.max(0, Math.min(1, rawProgress));
          setDragProgress(currentProgress);
        }
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (isMoved) {
        setIsDragging(false);
        setActiveTab(currentProgress > 0.5 ? 'team' : 'personal');
        setDragProgress(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const contactsToDisplay = activeTab === 'personal' ? personalContacts : teamContacts;

  return (
    <section ref={ref} className="relative">
      {/* Decorative background lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <path
          d="M0 100 Q 400 0, 800 100 T 1600 100"
          stroke="var(--border-subtle)"
          fill="none"
          strokeWidth="1"
        />
        <path
          d="M0 200 Q 300 100, 600 200 T 1200 200"
          stroke="var(--border-subtle)"
          fill="none"
          strokeWidth="1"
        />
      </svg>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Header */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight mb-6 leading-[1.05]">
            <span className="text-gradient block pb-1">{t('contact.title1')}</span>
            <span className="text-(--muted) block pb-1">{t('contact.title2')}</span>
          </h2>
          <p className="text-(--muted) text-lg max-w-xl mx-auto mb-8 transition-opacity duration-300 min-h-[3rem] flex items-center justify-center">
            {activeTab === 'personal' ? t('contact.subtitle') : t('contact.subtitleTeam')}
          </p>

          {/* Interactive Drag & Click Switcher Container */}
          <div
            ref={switcherRef}
            onPointerDown={handlePointerDown}
            className={`relative inline-flex items-center p-1.5 rounded-full border border-(--border) bg-(--border-subtle)/60 backdrop-blur-md mb-12 shadow-sm select-none touch-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Sliding Pill Indicator */}
            <div
              className="absolute top-1.5 bottom-1.5 rounded-full bg-foreground shadow-md pointer-events-none"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                transition: isDragging
                  ? 'none'
                  : 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            {/* Personal Tab Button */}
            <button
              ref={personalBtnRef}
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 ${
                activeTab === 'personal'
                  ? 'text-background'
                  : 'text-(--muted) hover:text-foreground'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('contact.tabPersonal')}</span>
            </button>

            {/* Team Tab Button */}
            <button
              ref={teamBtnRef}
              type="button"
              onClick={() => setActiveTab('team')}
              className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 ${
                activeTab === 'team'
                  ? 'text-background'
                  : 'text-(--muted) hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t('contact.tabTeam')}</span>
            </button>
          </div>
        </div>

        {/* Contact Links - horizontal */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
          }}
          className="flex flex-wrap justify-center gap-6 mb-14"
        >
          {contactsToDisplay.map((contact) => (
            <a
              key={contact.name}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contact via ${contact.name}`}
              className="group flex items-center gap-3 px-5 py-3 rounded-full border border-(--border) hover:border-(--foreground)/20 bg-(--border-subtle) hover:bg-(--border) transition-all"
            >
              <contact.icon className="w-5 h-5 text-(--muted) group-hover:text-foreground transition-colors" />
              <span className="text-(--muted) group-hover:text-foreground transition-colors">{contact.value}</span>
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transition: 'opacity 0.5s ease 0.4s',
          }}
        >
          {activeTab === 'personal' ? (
            <a
              href="https://t.me/wwewtech"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-foreground text-background font-medium text-lg hover:opacity-90 transition-all select-none"
            >
              {t('contact.telegram')}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          ) : (
            <a
              href="https://openspacedev.ru/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-foreground text-background font-medium text-lg hover:opacity-90 transition-all select-none"
            >
              {t('contact.teamWebsite')}
              <ExternalLink className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

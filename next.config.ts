import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Включить сжатие для production
  compress: true,
  
  // Экспериментальные оптимизации
  experimental: {
    // Оптимизация пакетов
    optimizePackageImports: ['framer-motion', 'lucide-react', 'lenis'],
  },
  
  // Оптимизация изображений
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Заголовки безопасности и кэширования
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
      {
        // Кэширование статических ассетов
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Кэширование JS/CSS
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Редиректы (если понадобятся)
  async redirects() {
    return [];
  },
};

export default nextConfig;

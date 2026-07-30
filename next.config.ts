import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Включить сжатие для production
  compress: true,
  
  // Source maps отключены в production для уменьшения размера артефактов
  productionBrowserSourceMaps: false,
  
  // Экспериментальные оптимизации
  experimental: {
    // Оптимизация пакетов - tree-shake barrel files
    optimizePackageImports: [
      'lucide-react',
      'lenis',
      '@react-three/drei',
      '@react-three/fiber',
      'three',
    ],
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
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
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
    ];
  },

};

export default nextConfig;

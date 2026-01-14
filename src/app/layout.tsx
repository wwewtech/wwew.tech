import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import { LenisProvider } from "@/components/LenisProvider";
import { FluidCursor } from "@/components/FluidCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "wwew.tech | Full-Stack Developer",
  description: "Building fast, scalable products with modern architecture. Full-stack development from concept to production.",
  keywords: ["development", "web development", "fullstack", "React", "Python", "Next.js"],
  authors: [{ name: "wwew.tech" }],
  openGraph: {
    title: "wwew.tech | Full-Stack Developer",
    description: "Building fast, scalable products",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider>
          <FluidCursor />
          <LenisProvider>
            {children}
          </LenisProvider>
        </AppProvider>
      </body>
    </html>
  );
}

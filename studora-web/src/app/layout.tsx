import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Studora | Modern Education Platform",
  description: "Experience a seamless educational ecosystem with advanced drive management, intelligent assignments, and automated notifications.",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeColorProvider } from "@/components/ThemeColorProvider";
import { PreferencesProvider } from "@/components/PreferencesProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
        <ThemeProvider>
          <ThemeColorProvider>
            <PreferencesProvider>
              {children}
            </PreferencesProvider>
          </ThemeColorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

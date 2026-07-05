import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
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
      className={`${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground relative">
        <ThemeProvider>
          <ThemeColorProvider>
            <PreferencesProvider>
              {/* Modern minimal grid background */}
              <div className="fixed inset-0 z-[-1] h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              <div className="fixed left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]"></div>
              
              {children}
            </PreferencesProvider>
          </ThemeColorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

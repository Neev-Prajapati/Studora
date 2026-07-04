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

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full flex overflow-hidden bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopNav />
          <main className="flex-1 overflow-y-auto outline-none">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

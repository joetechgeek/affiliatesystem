import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from '../components/Navigation'
import AIProductAssistant from '../components/AIProductAssistant';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "JoeTechStore",
  description: "Welcome to JoeTechStore",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <AIProductAssistant />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RedditBoard - A Trello-Style Reddit Dashboard",
  description: "Experience Reddit in a whole new way with RedditBoard's Trello-inspired dashboard. View multiple subreddits side-by-side, get real-time updates, and enjoy a clean, ad-free browsing experience.",
  openGraph: {
    title: "RedditBoard - A Trello-Style Reddit Dashboard",
    description: "Transform your Reddit browsing with a clean, column-based interface. Monitor multiple subreddits simultaneously with real-time updates.",
    url: "https://reddit-board.vercel.app",
    siteName: "RedditBoard",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RedditBoard - Trello-Style Reddit Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RedditBoard - A Trello-Style Reddit Dashboard",
    description: "Transform your Reddit browsing with a clean, column-based interface. Monitor multiple subreddits simultaneously with real-time updates.",
    creator: "@justmalhar",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}

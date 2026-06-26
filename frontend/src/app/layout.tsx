import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import TelemetryInitializer from "@/components/TelemetryInitializer";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChessHub Academy | Premium Online Chess Coaching & Training",
  description: "Accelerate your chess rating with FIDE rated coaches. Professional 1-to-1 coaching, interactive classroom boards, progress reports, automated Lichess game analytics, and curated puzzles for kids & adults.",
  keywords: [
    "online chess coaching",
    "kids chess lessons",
    "chess coach online",
    "FIDE chess training",
    "learn chess online",
    "chess tactics puzzles",
    "best online chess academy",
    "interactive chess lessons",
    "Lichess integration coaching"
  ],
  authors: [{ name: "Animesh Ray", url: "https://www.linkedin.com/in/animeshray786" }],
  creator: "Animesh Ray",
  publisher: "ChessHub Academy",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChessHub Academy",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chesshubacademyonline.vercel.app",
    title: "ChessHub Academy | Premium Online Chess Coaching & Training",
    description: "Accelerate your chess rating with FIDE rated coaches. Professional 1-to-1 coaching, interactive classroom boards, progress reports, automated Lichess game analytics, and curated puzzles.",
    siteName: "ChessHub Academy",
    images: [
      {
        url: "https://chesshubacademyonline.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ChessHub Academy Online Chess Training Board",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChessHub Academy | Premium Online Chess Coaching",
    description: "Accelerate your chess rating with FIDE rated coaches. Professional 1-to-1 coaching, interactive classroom boards, and automated Lichess analytics.",
    images: ["https://chesshubacademyonline.vercel.app/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <TelemetryInitializer />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}


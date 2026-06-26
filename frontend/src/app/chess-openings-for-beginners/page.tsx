import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Shield, Target } from 'lucide-react';
import DemoBookingForm from '@/components/landing/DemoBookingForm';
import FAQ from '@/components/landing/FAQ';

export const metadata: Metadata = {
  title: 'Chess Openings for Beginners | ChessHub Academy',
  description: 'Learn foundational chess openings for beginners. Master Italian Game, Ruy Lopez, Sicilian Defense, and fundamental opening principles with FIDE master coaches.',
  keywords: ['chess openings for beginners', 'chess openings list', 'learn chess openings online', 'italian game sicilian defense'],
  alternates: {
    canonical: 'https://chesshubacademy.online/chess-openings-for-beginners',
  },
  openGraph: {
    title: 'Chess Openings for Beginners | ChessHub Academy',
    description: 'Learn foundational chess openings for beginners. Master Italian Game, Ruy Lopez, Sicilian Defense, and fundamental opening principles.',
    url: 'https://chesshubacademy.online/chess-openings-for-beginners',
    type: 'website',
  },
};

export default function OpeningsBeginnerPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://chesshubacademy.online"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Chess Openings for Beginners",
        "item": "https://chesshubacademy.online/chess-openings-for-beginners"
      }
    ]
  };

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Chess Openings for Beginners",
    "description": "Introductory chess openings course. Focuses on core principles (center control, rapid development, castling) and introduces fundamental open, semi-open, and closed games.",
    "provider": {
      "@type": "Organization",
      "name": "ChessHub Academy",
      "sameAs": "https://chesshubacademy.online"
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xl">
              ♞
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent">
              ChessHub Academy
            </span>
          </Link>
          <Link href="/" className="text-xs font-bold uppercase tracking-wider text-muted hover:text-white transition">
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] text-accent font-bold uppercase tracking-widest">
            <Trophy className="w-3 h-3" /> Core Openings Syllabus
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Chess Openings coaching for Beginners
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-xl">
            Struggling to survive the first 10 moves of your chess games? Our Beginner Openings syllabus focuses on foundational opening principles—center control, rapid development, and king safety—and introduces you to classic opening lines like the Italian Game, Sicilian Defense, and Queen\'s Gambit.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>Center Control & Development</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>Avoid Early Opening Traps</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <DemoBookingForm />
        </div>
      </section>

      {/* Repertoires */}
      <section className="py-20 border-t border-border/40 bg-card/20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Essential Beginner Chess Openings Covered</h2>
            <p className="text-muted text-xs max-w-lg mx-auto">Master the key structures that define early middle-game positions.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">🇮🇹</span>
              <h4 className="font-bold text-white text-base mb-2">The Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4)</h4>
              <p className="text-muted text-xs leading-relaxed">Perfect for beginners. Promotes rapid bishop development, safe kingside castling, and active center control.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">🇮🇹</span>
              <h4 className="font-bold text-white text-base mb-2">Sicilian Defense (1.e4 c5)</h4>
              <p className="text-muted text-xs leading-relaxed">The ultimate asymmetric defense. Teaches beginners how to create counter-attacking chances from move one.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">👑</span>
              <h4 className="font-bold text-white text-base mb-2">Queen's Gambit (1.d4 d5 2.c4)</h4>
              <p className="text-muted text-xs leading-relaxed">The classic closed opening. Teaches positional space accumulation, pawn tension release, and minor piece coordination.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-border/40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h2>
            <p className="text-muted text-xs">Questions about openings? Review our detailed database below.</p>
          </div>
          <FAQ />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-[#02040a] py-8 px-6 text-center text-xs text-muted mt-auto">
        &copy; {new Date().getFullYear()} ChessHub Academy. All rights reserved.
      </footer>
    </div>
  );
}

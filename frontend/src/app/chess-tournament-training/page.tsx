import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Shield, Target } from 'lucide-react';
import DemoBookingForm from '@/components/landing/DemoBookingForm';
import FAQ from '@/components/landing/FAQ';

export const metadata: Metadata = {
  title: 'Chess Tournament Training | ChessHub Academy',
  description: 'Elite online chess training for competitive tournament players. Master calculation, psychological preparation, and advanced FIDE-level chess openings.',
  keywords: ['chess tournament training', 'tournament preparation chess', 'fide rating coaching', 'advanced chess coaching'],
  alternates: {
    canonical: 'https://chesshubacademy.online/chess-tournament-training',
  },
  openGraph: {
    title: 'Chess Tournament Training | ChessHub Academy',
    description: 'Elite online chess training for competitive tournament players. Master calculation, psychological preparation, and advanced FIDE-level openings.',
    url: 'https://chesshubacademy.online/chess-tournament-training',
    type: 'website',
  },
};

export default function TournamentTrainingPage() {
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
        "name": "Tournament Training",
        "item": "https://chesshubacademy.online/chess-tournament-training"
      }
    ]
  };

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Chess Tournament Training & Prep",
    "description": "Elite chess syllabus designed for players above 1400 Elo preparing for FIDE rated events. Covers opening branches, candidate move calculation, and time pressure strategies.",
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
            <Trophy className="w-3 h-3" /> FIDE Rating Preparation
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Elite Chess Tournament Training
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-xl">
            Are you preparing for your first FIDE rated classical event or looking to cross the 1800 Elo milestone? Our specialized tournament training syllabus is structured around deep opening theory branch variations, candidate move calculations, positional squeezes, and psychological mindset prep.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>Candidate Move Calculation</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>Endgame Positional Imbalances</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <DemoBookingForm />
        </div>
      </section>

      {/* Topics */}
      <section className="py-20 border-t border-border/40 bg-card/20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Tournament Preparation Modules</h2>
            <p className="text-muted text-xs max-w-lg mx-auto">Advanced training modules focused on tactical and psychological resilience.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">🧮</span>
              <h4 className="font-bold text-white text-base mb-2">Calculation & Visualization</h4>
              <p className="text-muted text-xs leading-relaxed">Developing deep visualization trees. Calculating forced lines, candidate moves, and pruning suboptimal branches under time pressure.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">♟️</span>
              <h4 className="font-bold text-white text-base mb-2">Theoretical Repertoire Build</h4>
              <p className="text-muted text-xs leading-relaxed">Constructing a bulletproof opening database for white and black. Using Chessbase / Lichess PGN files to study modern opening variations.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">🧠</span>
              <h4 className="font-bold text-white text-base mb-2">Tournament Psychology</h4>
              <p className="text-muted text-xs leading-relaxed">Managing clock pressure, controlling emotional fluctuations after errors, studying opponent tournament habits, and active defense principles.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-border/40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h2>
            <p className="text-muted text-xs">Questions about tournament prep? Review our detailed database below.</p>
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

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Shield, Target } from 'lucide-react';
import DemoBookingForm from '@/components/landing/DemoBookingForm';
import FAQ from '@/components/landing/FAQ';

export const metadata: Metadata = {
  title: 'Chess Coaching for Beginners | ChessHub Academy',
  description: 'Structured online chess classes for adult and kid beginners. Master chess rules, checkmate patterns, and core tactical principles with FIDE master coaches.',
  keywords: ['chess coaching for beginners', 'learn chess online', 'beginner chess classes', 'chess rules and tactics'],
  alternates: {
    canonical: 'https://chesshubacademy.online/chess-coaching-for-beginners',
  },
  openGraph: {
    title: 'Chess Coaching for Beginners | ChessHub Academy',
    description: 'Structured online chess classes for adult and kid beginners. Master chess rules, checkmate patterns, and core tactical principles.',
    url: 'https://chesshubacademy.online/chess-coaching-for-beginners',
    type: 'website',
  },
};

export default function BeginnerCoachingPage() {
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
        "name": "Beginner Chess Coaching",
        "item": "https://chesshubacademy.online/chess-coaching-for-beginners"
      }
    ]
  };

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Chess Coaching for Beginners",
    "description": "Foundational chess course for absolute beginners. Teaches board coordinates, piece movements, core rules, and basic checkmate patterns.",
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
            <Trophy className="w-3 h-3" /> Starter Foundations Syllabus
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Online Chess Coaching for Absolute Beginners
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-xl">
            Never played a game before, or just know the basic moves? Our Beginner Foundations syllabus takes you step-by-step from learning pieces to playing matches, executing tactics, and understanding coordinate grids.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>Rules, Moves & Castling</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>Basic forks, pins & skewering</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <DemoBookingForm />
        </div>
      </section>

      {/* Syllabus outline */}
      <section className="py-20 border-t border-border/40 bg-card/20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Beginner Foundations Syllabus Tiers</h2>
            <p className="text-muted text-xs max-w-lg mx-auto">Our structured blocks are designed to ease the learning curve.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">♟️</span>
              <h4 className="font-bold text-white text-base mb-2">Block 1: Rules & Coordination</h4>
              <p className="text-muted text-xs leading-relaxed">Understanding square labels, piece values, check vs checkmate, legal castling, stalemates, and draws.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">🧩</span>
              <h4 className="font-bold text-white text-base mb-2">Block 2: Basic Tactician</h4>
              <p className="text-muted text-xs leading-relaxed">Finding simple double attacks, executing pins to win queen/rook, avoiding hanging pieces, and basic pawn endgames.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">⚔️</span>
              <h4 className="font-bold text-white text-base mb-2">Block 3: Opening Principles</h4>
              <p className="text-muted text-xs leading-relaxed">Controlling center squares, developing minor pieces quickly, securing the king with early castling, and avoiding trap lines.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-border/40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h2>
            <p className="text-muted text-xs">Questions about starting chess? Review our detailed database below.</p>
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

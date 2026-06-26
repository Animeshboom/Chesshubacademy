import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Shield, Target } from 'lucide-react';
import DemoBookingForm from '@/components/landing/DemoBookingForm';
import FAQ from '@/components/landing/FAQ';

export const metadata: Metadata = {
  title: 'Online Chess Academy | ChessHub Academy',
  description: 'Elite global online chess academy offering certified chess courses for beginners, intermediate players, and competitive tournament players.',
  keywords: ['online chess academy', 'chess school online', 'learn chess courses', 'global chess academy'],
  alternates: {
    canonical: 'https://chesshubacademy.online/online-chess-academy',
  },
  openGraph: {
    title: 'Online Chess Academy | ChessHub Academy',
    description: 'Elite global online chess academy offering certified chess courses for beginners, intermediate players, and competitive tournament players.',
    url: 'https://chesshubacademy.online/online-chess-academy',
    type: 'website',
  },
};

export default function AcademyLandingPage() {
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
        "name": "Online Chess Academy",
        "item": "https://chesshubacademy.online/online-chess-academy"
      }
    ]
  };

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "ChessHub Academy",
    "url": "https://chesshubacademy.online",
    "description": "Global online chess school offering high-end structured chess courses, 1-on-1 private tuition, gamified leaderboards, and progress reporting.",
    "logo": "https://chesshubacademy.online/logo.png"
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
            <Trophy className="w-3 h-3" /> Global Online Chess Academy
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Premium Global Online Chess Academy
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-xl">
            We are more than just a chess website. ChessHub is a fully-equipped virtual training academy offering comprehensive, structured syllabi, certified FIDE master coaches, XP reward levels, and automated performance tracking.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>Structured 4-Tier Curriculums</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>Detailed Progress Reporting</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <DemoBookingForm />
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20 border-t border-border/40 bg-card/20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">The Three Pillars of ChessHub Academy</h2>
            <p className="text-muted text-xs max-w-lg mx-auto">How we deliver world-class training directly to your screen.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">🏫</span>
              <h4 className="font-bold text-white text-base mb-2">Pillar 1: Structured Pedagogy</h4>
              <p className="text-muted text-xs leading-relaxed">No random playing. Every session covers a specific, structured concept (e.g. Back-Rank Mate, Opposition, Outpost square) from our syllabus.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">🏆</span>
              <h4 className="font-bold text-white text-base mb-2">Pillar 2: Elite Coach Roster</h4>
              <p className="text-muted text-xs leading-relaxed">Our trainers are FIDE Master (FM), International Master (IM), or Candidate Master (CM) rated, ensuring your child learns the correct principles from the start.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">📱</span>
              <h4 className="font-bold text-white text-base mb-2">Pillar 3: Advanced Student Portal</h4>
              <p className="text-muted text-xs leading-relaxed">Students access interactive homework sheets, view leaderboard stats, check coach session feedback notes, and track Lichess progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-border/40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h2>
            <p className="text-muted text-xs">Questions about our online academy? Review our detailed database below.</p>
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

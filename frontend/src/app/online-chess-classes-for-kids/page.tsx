import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Clock, Shield, Target, ArrowRight } from 'lucide-react';
import DemoBookingForm from '@/components/landing/DemoBookingForm';
import FAQ from '@/components/landing/FAQ';

export const metadata: Metadata = {
  title: 'Online Chess Classes for Kids | ChessHub Academy',
  description: 'Elite online chess coaching for kids aged 6-18. Live 1-on-1 and group classes, monthly parent progress reports, gamified XP, and FIDE-certified trainers.',
  keywords: ['online chess classes for kids', 'kids chess coaching', 'learn chess for children', 'junior chess academy'],
  alternates: {
    canonical: 'https://chesshubacademy.online/online-chess-classes-for-kids',
  },
  openGraph: {
    title: 'Online Chess Classes for Kids | ChessHub Academy',
    description: 'Elite online chess coaching for kids aged 6-18. Live 1-on-1 classes, monthly progress reports, and gamified XP.',
    url: 'https://chesshubacademy.online/online-chess-classes-for-kids',
    type: 'website',
  },
};

export default function KidsCoachingPage() {
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
        "name": "Kids Chess Classes",
        "item": "https://chesshubacademy.online/online-chess-classes-for-kids"
      }
    ]
  };

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Online Chess Classes for Kids",
    "description": "Premium chess training designed for children aged 6 to 18. Includes 1-to-1 live tutoring, tactical puzzles, and parent feedback reports.",
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
            <Trophy className="w-3 h-3" /> Specialised Kids Syllabus
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Online Chess Classes for Kids & Teens
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-xl">
            Our specialized kids curriculum takes absolute beginners and turns them into confident, strategic players. We combine gamified level-ups, fun tactics, and structured parent visibility.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>For Ages 6 to 18</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>Small batches / 1-on-1</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <DemoBookingForm />
        </div>
      </section>

      {/* Why kids learn best with us */}
      <section className="py-20 border-t border-border/40 bg-card/20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Why Kids Learn Best at ChessHub</h2>
            <p className="text-muted text-xs max-w-lg mx-auto">Our unique system matches the natural learning speed of children.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">🎮</span>
              <h4 className="font-bold text-white text-base mb-2">Gamified XP System</h4>
              <p className="text-muted text-xs leading-relaxed">Kids earn XP and climb our academy leaderboard for solving puzzles and completing assignments.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">📈</span>
              <h4 className="font-bold text-white text-base mb-2">Visual Rating Growth</h4>
              <p className="text-muted text-xs leading-relaxed">Students link their Lichess profiles to track Elo points and unlock unique skill badges.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">👥</span>
              <h4 className="font-bold text-white text-base mb-2">Parent Portal Reports</h4>
              <p className="text-muted text-xs leading-relaxed">Monthly digital reports keep parents fully updated on class progress and strengths.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-border/40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h2>
            <p className="text-muted text-xs">Got questions about kids chess classes? Read our comprehensive database below.</p>
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

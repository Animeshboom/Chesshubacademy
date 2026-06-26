import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Shield, Target } from 'lucide-react';
import DemoBookingForm from '@/components/landing/DemoBookingForm';
import FAQ from '@/components/landing/FAQ';

export const metadata: Metadata = {
  title: 'One-to-One Chess Coaching | ChessHub Academy',
  description: 'Private 1-on-1 online chess classes with FIDE-certified trainers. Customized syllabus, individual opening preparation, and dedicated WhatsApp support.',
  keywords: ['one-to-one chess coaching', 'private chess lessons', 'personal chess coach online', '1-on-1 chess trainer'],
  alternates: {
    canonical: 'https://chesshubacademy.online/one-to-one-chess-coaching',
  },
  openGraph: {
    title: 'One-to-One Chess Coaching | ChessHub Academy',
    description: 'Private 1-on-1 online chess classes with FIDE-certified trainers. Customized syllabus and individual opening preparation.',
    url: 'https://chesshubacademy.online/one-to-one-chess-coaching',
    type: 'website',
  },
};

export default function OneToOneCoachingPage() {
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
        "name": "1-to-1 Chess Coaching",
        "item": "https://chesshubacademy.online/one-to-one-chess-coaching"
      }
    ]
  };

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "One-to-One Chess Coaching",
    "description": "Premium private chess tutoring with FIDE Master coaches. Standard 45-50 min sessions focused entirely on the student's unique styles, weak areas, and tournament profiles.",
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
            <Trophy className="w-3 h-3" /> Private 1-on-1 Coaching
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Personalised One-to-One Chess Coaching
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-xl">
            Get 100% focused attention from a FIDE-rated professional coach. Our private 1-to-1 lessons are optimized to your unique strengths, target opening repertoire weaknesses, and accelerate your Elo rating growth.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>Customized Opening Repertoire</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</div>
              <span>Interactive PGN Database Reviews</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <DemoBookingForm />
        </div>
      </section>

      {/* Repertoire features */}
      <section className="py-20 border-t border-border/40 bg-card/20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Premium Private Coaching Features</h2>
            <p className="text-muted text-xs max-w-lg mx-auto">Accelerated chess progress through dedicated, tailored tutoring.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">🎯</span>
              <h4 className="font-bold text-white text-base mb-2">Tailored Training Scope</h4>
              <p className="text-muted text-xs leading-relaxed">No generic schedules. Your coach analyzes your specific Lichess game archive to build a syllabus based on your mistakes.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">📁</span>
              <h4 className="font-bold text-white text-base mb-2">Dedicated Google Drive PGNs</h4>
              <p className="text-muted text-xs leading-relaxed">All opening studies, tactical templates, and game notes are archived directly to your personal Google Drive for lifetime access.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-border">
              <span className="text-2xl block mb-4">💬</span>
              <h4 className="font-bold text-white text-base mb-2">Direct WhatsApp Access</h4>
              <p className="text-muted text-xs leading-relaxed">Ask questions or send game screenshots directly to your coach on WhatsApp between classes for instant feedback.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-border/40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h2>
            <p className="text-muted text-xs">Questions about private tutoring? Review our detailed database below.</p>
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

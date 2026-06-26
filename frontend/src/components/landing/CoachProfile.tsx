'use client';

import React from 'react';
import { Award, BookOpen, Heart, Shield, ShieldCheck, Star } from 'lucide-react';

export default function CoachProfile() {
  return (
    <div className="w-full max-w-4xl mx-auto glass border border-accent/20 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="grid md:grid-cols-12 gap-8 items-center">
        {/* Profile Image & Badges */}
        <div className="md:col-span-5 flex flex-col items-center gap-4 text-center">
          <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-accent shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop"
              alt="Coach FM Priyadarshan"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-accent text-black px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              FM TITLE
            </div>
          </div>
          
          <div>
            <h4 className="font-extrabold text-white text-lg">FM Priyadarshan</h4>
            <p className="text-xs text-accent font-mono">FIDE Master & Elite Head Coach</p>
          </div>

          <div className="flex gap-2">
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-border text-[10px] text-muted font-bold uppercase">
              FIDE Certified
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-border text-[10px] text-muted font-bold uppercase">
              Peak: 2310 Elo
            </span>
          </div>
        </div>

        {/* Biography & Achievements details */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-white">Meet Your Coach</h3>
            <p className="text-muted text-sm leading-relaxed">
              With over 15 years of tournament competition and 8+ years of dedicated coaching, FM Priyadarshan has trained dozens of junior champions across India, the US, and Europe.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Teaching Philosophy */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" /> Teaching Philosophy
              </h5>
              <p className="text-muted text-xs leading-relaxed">
                "Chess is not about memorizing lines, it is about learning how to think. I teach kids how to analyze, calculate candidate moves, and stay mentally strong under time pressure."
              </p>
            </div>

            {/* Core Achievements */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Key Achievements
              </h5>
              <ul className="text-muted text-xs space-y-1 list-disc pl-4">
                <li>Winner, Indian National Under-19 Chess Championship (2009)</li>
                <li>Trained 8 FIDE Rated junior players</li>
                <li>FIDE Master title awarded by World Chess Federation (2011)</li>
              </ul>
            </div>
          </div>

          {/* Certifications footer badge row */}
          <div className="border-t border-border/60 pt-4 grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-border">
              <ShieldCheck className="w-5 h-5 mx-auto text-accent mb-1.5" />
              <span className="text-[10px] text-muted font-semibold block uppercase">FIDE Trainer</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-border">
              <BookOpen className="w-5 h-5 mx-auto text-accent mb-1.5" />
              <span className="text-[10px] text-muted font-semibold block uppercase">Opening Specialist</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-border">
              <Star className="w-5 h-5 mx-auto text-accent mb-1.5" />
              <span className="text-[10px] text-muted font-semibold block uppercase">10,000+ Hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

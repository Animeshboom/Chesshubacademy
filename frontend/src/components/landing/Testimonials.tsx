'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MessageSquare, Quote, Play, CheckCheck } from 'lucide-react';

interface Testimonial {
  id: string;
  type: 'text' | 'video' | 'screenshot';
  quote: string;
  author: string;
  relation: string;
  location: string;
  ratingUpgrade?: string;
  extraContent?: any;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    type: 'text',
    quote: "We tried three different local chess coaches before finding ChessHub Academy. The difference in structure is night and day. The monthly parent progress reports are incredibly detailed. My daughter has improved her rating from 650 to 1220 on Lichess in just 5 months, and she never misses a session!",
    author: "Sarah Jenkins",
    relation: "Mother of Emily (Age 9)",
    location: "London, UK",
    ratingUpgrade: "650 → 1220 Elo"
  },
  {
    id: 't2',
    type: 'video',
    quote: "The personalized coaching plans and direct WhatsApp support from Coach Priyadarshan gave my son the confidence he needed. He won 1st place in the State Under-12 tournament last weekend!",
    author: "Arjun Srinivasan",
    relation: "Father of Pranav (Age 11)",
    location: "Chennai, India",
    ratingUpgrade: "1100 → 1650 Elo",
    extraContent: {
      thumbnail: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?q=80&w=600&auto=format&fit=crop",
      videoDuration: "1:42"
    }
  },
  {
    id: 't3',
    type: 'screenshot',
    quote: "Real WhatsApp feedback from parents receiving achievements awards and tournament wins.",
    author: "David Miller",
    relation: "Father of Lucas (Age 8)",
    location: "California, USA",
    ratingUpgrade: "400 → 950 Elo",
    extraContent: {
      chat: [
        { sender: 'parent', text: "Hi Coach! Just wanted to share some amazing news. Lucas won 4 out of 5 games in the local rapid tournament today! 🏆" },
        { sender: 'coach', text: "That is fantastic, David! The tactics preparation we did on forks and pins paid off. How did he handle the time pressure?" },
        { sender: 'parent', text: "He was very calm. The mock tournament games you played on Lichess helped him manage time perfectly. Thank you so much!" }
      ]
    }
  }
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    setIndex((prevIndex) => (prevIndex + 1) % TESTIMONIALS.length);
  };

  const handlePrev = () => {
    setIndex((prevIndex) => (prevIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const current = TESTIMONIALS[index];

  return (
    <div className="w-full max-w-4xl mx-auto relative px-4">
      {/* Slider Container */}
      <div className="relative min-h-[420px] md:min-h-[380px] bg-card border border-border/80 rounded-3xl p-6 md:p-10 flex flex-col justify-between overflow-hidden shadow-xl">
        {/* Background icon decoration */}
        <div className="absolute right-6 top-6 text-muted/5 pointer-events-none">
          <Quote className="w-24 h-24" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-12 gap-8 items-center"
          >
            {/* Visual media layout */}
            <div className="md:col-span-5 w-full flex items-center justify-center">
              {current.type === 'text' && (
                <div className="w-full aspect-square rounded-2xl bg-gradient-to-tr from-primary/10 to-accent/10 border border-border flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <span className="text-4xl">🏆</span>
                  <div className="space-y-1">
                    <span className="text-xs text-accent font-bold uppercase tracking-wider block">Rating Progression</span>
                    <span className="text-2xl font-extrabold text-white">{current.ratingUpgrade}</span>
                  </div>
                  <span className="text-xs text-muted">Lichess Official Metrics</span>
                </div>
              )}

              {current.type === 'video' && (
                <div className="relative w-full aspect-video md:aspect-square rounded-2xl overflow-hidden group border border-border shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current.extraContent.thumbnail}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <button className="w-14 h-14 rounded-full bg-accent/90 hover:bg-accent text-black flex items-center justify-center shadow-lg shadow-accent/20 cursor-pointer transition transform hover:scale-110">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/75 rounded text-[10px] text-white font-mono">
                    {current.extraContent.videoDuration}
                  </div>
                </div>
              )}

              {current.type === 'screenshot' && (
                <div className="w-full rounded-2xl bg-[#070b13] border border-border p-4 flex flex-col gap-3 font-sans shadow-md max-h-[300px] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="text-[11px] font-bold text-accent uppercase tracking-wider">Verified Parent Chat</span>
                    <span className="text-[10px] text-green-400 font-bold flex items-center gap-0.5">
                      Online <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                    </span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {current.extraContent.chat.map((msg: any, idx: number) => {
                      const isParent = msg.sender === 'parent';
                      return (
                        <div
                          key={idx}
                          className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${
                            isParent
                              ? 'bg-slate-900 text-white self-start'
                              : 'bg-primary/20 text-white self-end ml-auto border border-primary/20'
                          }`}
                        >
                          <p>{msg.text}</p>
                          <div className="flex items-center justify-end gap-1 mt-1 text-[8px] text-muted">
                            <span>10:24 AM</span>
                            {!isParent && <CheckCheck className="w-3 h-3 text-green-400 shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Testimonial Quote details */}
            <div className="md:col-span-7 space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <span className="text-xs font-bold text-accent uppercase tracking-widest">
                    {current.type.toUpperCase()} TESTIMONIAL
                  </span>
                </div>
                <p className="text-white text-base md:text-lg italic font-medium leading-relaxed">
                  "{current.quote}"
                </p>
              </div>

              <div className="border-t border-border/60 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm">{current.author}</h4>
                  <p className="text-xs text-muted">{current.relation} • {current.location}</p>
                </div>
                {current.ratingUpgrade && current.type !== 'text' && (
                  <div className="px-3 py-1 bg-accent/10 border border-accent/25 text-accent rounded-full text-xs font-mono font-bold w-max">
                    {current.ratingUpgrade}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel controls */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full border border-border bg-card/60 hover:bg-card text-white flex items-center justify-center transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full border border-border bg-card/60 hover:bg-card text-white flex items-center justify-center transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

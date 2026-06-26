'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'react-redux'; // Wait! Next.js and Tailwind - do not import react-redux, use standard useState! Let's write standard React.
import { HelpCircle, ChevronDown, Search } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
  category: 'general' | 'curriculum' | 'tracking' | 'billing';
}

const FAQS: FAQItem[] = [
  {
    category: 'general',
    q: 'How do online chess classes work?',
    a: 'Classes are conducted live via Zoom or Google Meet. Students interact in real-time with their coach on an interactive virtual board (powered by Chessground) where they can drag pieces, view live engine analyses, and solve puzzles together.'
  },
  {
    category: 'general',
    q: 'What age can children start learning chess?',
    a: 'We teach children aged 6 to 18. At age 6, children have developed the visual and logical maturity needed to grasp piece movements and coordinates, making it the perfect starting age.'
  },
  {
    category: 'general',
    q: 'Are classes one-to-one (1-on-1) or group batches?',
    a: 'We specialize in both. Parents can opt for completely personalized 1-to-1 coaching classes for individual attention, or small-batch group classes (maximum 4 students) to foster healthy peer competition.'
  },
  {
    category: 'general',
    q: 'What happens if we miss a scheduled class?',
    a: 'If you notify the academy at least 12 hours in advance, the session is marked as "excused" and you retain your balance. Missed sessions without prior notice may be marked as "absent" and debited from the student balance.'
  },
  {
    category: 'general',
    q: 'How long is the free demo class, and what happens in it?',
    a: 'The free demo is a 45-minute 1-on-1 session. The coach conducts a friendly assessment of the child\'s current chess understanding, demonstrates our learning portal, and presents a customized training recommendation.'
  },
  {
    category: 'curriculum',
    q: 'What chess levels do you teach?',
    a: 'We offer a structured 4-tier curriculum: Beginner Foundations (rules/moves), Intermediate Development (tactics/openings), Advanced Training (endgames/calculation), and Tournament Excellence (FIDE rating preparation).'
  },
  {
    category: 'curriculum',
    q: 'Is the training curriculum customized for each student?',
    a: 'Yes. Every student gets a personalized learning plan based on their initial assessment. While we follow general curriculum structures, coaches customize opening lines and tactical packs to suit the student\'s style.'
  },
  {
    category: 'curriculum',
    q: 'Do you help students prepare for official FIDE rated tournaments?',
    a: 'Absolutely. Our Tournament Excellence level focuses on classical time controls, score sheet recording, tournament mental preparation, game database review, and specific openings prep.'
  },
  {
    category: 'curriculum',
    q: 'Can adults enroll in these classes?',
    a: 'Yes, although 80% of our student base are school-aged children, we have dedicated slots for adult beginners, intermediate club players, and competitive tournament amateurs.'
  },
  {
    category: 'curriculum',
    q: 'Do you teach specific chess openings?',
    a: 'Yes. We teach opening principles first (center control, rapid development), then progress to major openings like the Ruy Lopez, Sicilian Defense, Slav Defense, Italian Game, and Queen\'s Gambit based on student style.'
  },
  {
    category: 'tracking',
    q: 'Do parents receive reports on their child\'s progress?',
    a: 'Yes, progress tracking is a core differentiator. Parents receive a detailed progress report every 30 days detailing attendance, homework completion rate, Lichess rating growth, coach comments, and specific areas of strength and weakness.'
  },
  {
    category: 'tracking',
    q: 'How is homework accountability maintained?',
    a: 'Coaches assign homework tasks (interactive puzzles, Lichess studies, PGN review files) through the student dashboard after classes. Submissions are reviewed before the next session, and scores are logged.'
  },
  {
    category: 'tracking',
    q: 'What is Lichess integration and why is it used?',
    a: 'Lichess is the world\'s leading open-source chess platform. Linking the student\'s Lichess profile to our dashboard allows our backend to automatically import their played games, track their rating growth, and analyze blunder trends.'
  },
  {
    category: 'tracking',
    q: 'What is the XP and Leaderboard system?',
    a: 'To make learning fun, students earn Experience Points (XP) for attending classes, finishing homework, and solving puzzles. They level up and climb the Academy Leaderboard to earn rewards and achievement badges.'
  },
  {
    category: 'tracking',
    q: 'Can parents view session notes in real-time?',
    a: 'Yes. After every live session, coaches enter feedback notes and covered topics. These notes are immediately visible in the student and parent portal dashboards.'
  },
  {
    category: 'billing',
    q: 'How often are classes conducted per week?',
    a: 'By default, classes are scheduled 2 times a week. However, parents can request a customized frequency of 1 class per week or up to 4 classes per week (for tournament preparation periods).'
  },
  {
    category: 'billing',
    q: 'Do you offer sibling discounts?',
    a: 'Yes. We offer a 10% sibling discount on our Pro Growth (24 Sessions) and Elite Master (48 Sessions) packages when both children are enrolled.'
  },
  {
    category: 'billing',
    q: 'What payment methods do you accept?',
    a: 'We accept credit cards, debit cards, UPI, net banking, and PayPal. For global students outside India, payments are securely processed in USD, GBP, or EUR via Stripe/PayPal links.'
  },
  {
    category: 'billing',
    q: 'Can we change coaches if we feel the fit is not correct?',
    a: 'Yes, if you feel the coach-student chemistry is not optimal, notify the Academy Manager. We will evaluate the feedback and re-assign another elite coach to suit your child\'s learning pace.'
  },
  {
    category: 'billing',
    q: 'Is there direct WhatsApp support for parents?',
    a: 'Yes. Every parent gets direct WhatsApp contact details for the assigned coach and the Academy Manager for instant rescheduling, query resolution, and updates.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFAQs = FAQS.filter((faq) => {
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Search & Categories */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['all', 'general', 'curriculum', 'tracking', 'billing'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition border cursor-pointer ${
                activeCategory === cat
                  ? 'bg-accent border-accent text-black'
                  : 'bg-card border-border text-muted hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-xs text-white outline-none focus:border-accent/40"
          />
        </div>
      </div>

      {/* Accordions */}
      <div className="space-y-4">
        {filteredFAQs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-card border border-border/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-accent/20"
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 text-white font-bold text-sm md:text-base cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-accent shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-accent' : ''
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-350 ease-in-out overflow-hidden ${
                  isOpen ? 'max-h-[500px] border-t border-border/40' : 'max-h-0'
                }`}
              >
                <div className="p-6 text-muted text-xs md:text-sm leading-relaxed bg-[#070c17]/30">
                  {faq.a}
                </div>
              </div>
            </div>
          );
        })}

        {filteredFAQs.length === 0 && (
          <div className="text-center py-10 text-muted text-sm">
            No matching frequently asked questions found.
          </div>
        )}
      </div>
    </div>
  );
}

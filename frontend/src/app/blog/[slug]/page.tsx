'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { api } from '@/utils/api';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  featured_image_url: string;
  category_name?: string;
  published_at?: string;
  seo_description?: string;
  author_name?: string;
}

const MOCK_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: 'Top 5 Chess Openings for Junior Tournament Players',
    slug: 'top-5-chess-openings-junior-players',
    content: `Openings define the initial board battles. For kids, building a reliable space control is paramount. As FIDE trainers, we often see junior players struggle with early opening traps or lose games within the first 10 moves due to unstructured plans.

Here are the top 5 openings we recommend for junior players starting their tournament journey:

1. The Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4)
The Italian Game is excellent for developing visual alertness, controlling central squares, and understanding classic tactics. It guides players to rapidly develop minor pieces and castling kingside early.

2. The Sicilian Defense (1.e4 c5)
For black, the Sicilian offers asymmetric counter-attacks. It teaches junior players that chess is not just about defending, but actively complicating the board and seizing active space.

3. The Queen's Gambit (1.d4 d5 2.c4)
A closed opening that teaches positional concepts, pawn structure chains, and slow strategic maneuvering. It is essential for developing patience and positional calculation.

4. The French Defense (1.e4 e6)
French defense structures teach juniors how to defend closed positions, handle pawn chains, and launch counter-attacks on the queenside.

5. The Caro-Kann Defense (1.e4 c6)
Caro-Kann provides a solid, rock-like structure. It is perfect for kids who prefer a safe, positional game with minimal tactical blunders in the opening phase.`,
    featured_image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=1200&auto=format&fit=crop',
    category_name: 'Opening Guides',
    published_at: '2026-06-15T10:00:00Z',
    seo_description: 'Discover the top 5 chess openings for junior players to improve tactical alertness and board control.',
    author_name: 'FM Priyadarshan'
  },
  {
    id: 'b2',
    title: 'How to Manage Time Pressure in Classical Chess',
    slug: 'manage-time-pressure-classical-chess',
    content: `Clock management is as critical as piece management. FIDE classical events require calculation pacing. Many intermediate players lose equal or winning positions simply because they enter severe time scramble phases.

Here are three core tips from certified trainers to master the clock:

1. Use the 20-30-50 Rule
Allocate 20% of your time for the opening, 30% for middle-game calculation, and keep 50% for complex tactical decisions and endgame execution.

2. Do Not Calculate Simple Recaptures
If a capture is forced or there is only one logical legal move, execute it immediately. Do not waste minutes double-checking obvious trades.

3. Practice with Mock Matches
Play classical games online (30+30 or 45+45 time controls) on Lichess while setting a physical clock or monitoring your dashboard timing rigorously.`,
    featured_image_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=1200&auto=format&fit=crop',
    category_name: 'Training Tips',
    published_at: '2026-06-12T14:30:00Z',
    seo_description: 'FIDE-certified tips on how classical tournament chess players can manage clock pressure.',
    author_name: 'FM Priyadarshan'
  },
  {
    id: 'b3',
    title: 'ChessHub Summer Arena 2026: Tournament Report',
    slug: 'chesshub-summer-arena-2026-report',
    content: `The academy summer arena concluded with outstanding results. Over 150 junior players competed across beginner and intermediate divisions. 

Highlights of the event:
- Aman Kapoor won first prize in the Intermediate division with a perfect 7/7 score.
- Rohan Iyer secured second place, showcasing a brilliant execution of the Sicilian Defense.
- Over 90% of students logged rating improvements on Lichess post-event.

We are extremely proud of all participants and look forward to the upcoming Winter Arena.`,
    featured_image_url: 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?q=80&w=1200&auto=format&fit=crop',
    category_name: 'Tournament Reports',
    published_at: '2026-06-10T09:00:00Z',
    seo_description: 'Read the official recap and highlights from the ChessHub Academy Summer Arena 2026 tournament.',
    author_name: 'FM Priyadarshan'
  }
];

export default function BlogPostPage({ params }: { params: any }) {
  const [slug, setSlug] = useState<string>('');
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Un-wrap params promise in NextJS 15
  useEffect(() => {
    if (params) {
      Promise.resolve(params).then((resolvedParams: any) => {
        setSlug(resolvedParams.slug);
      });
    }
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const loadPost = async () => {
      try {
        const response = await api.get(`/blogs/posts/?slug=${slug}`);
        if (response.data && response.data.length > 0) {
          const match = response.data.find((p: any) => p.slug === slug);
          if (match) {
            setPost(match);
          }
        }
      } catch (err) {
        console.warn('API post fetch failed, falling back to mock assets.', err);
      } finally {
        // Double check local fallback
        setPost((current) => {
          if (current) return current;
          const fallback = MOCK_POSTS.find((p) => p.slug === slug);
          return fallback || null;
        });
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  useEffect(() => {
    if (post) {
      const filtered = MOCK_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);
      setRelated(filtered);
    }
  }, [post]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <h3 className="text-xl font-bold text-white">Article Not Found</h3>
        <Link href="/blog" className="text-accent text-sm hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Blog Listing
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
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
          <Link href="/blog" className="text-xs font-bold uppercase tracking-wider text-muted hover:text-white transition flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> All Articles
          </Link>
        </div>
      </header>

      {/* Main content body */}
      <article className="max-w-3xl mx-auto px-6 py-12 space-y-8 flex-1">
        <div className="space-y-4 text-left">
          <span className="text-xs font-bold text-accent uppercase tracking-widest bg-accent/10 border border-accent/20 px-3 py-1 rounded-full w-max block">
            {post.category_name || 'Chess Article'}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-4 text-xs text-muted border-b border-border pb-6">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> {post.author_name || 'FM Priyadarshan'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Featured image */}
        <div className="aspect-video w-full relative overflow-hidden bg-slate-900 rounded-3xl border border-border/80 shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content body */}
        <div className="text-sm md:text-base text-muted leading-relaxed whitespace-pre-line text-left space-y-4">
          {post.content}
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="bg-card/20 border-t border-border/40 py-16 px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="text-accent w-5 h-5" /> Related Articles
            </h4>

            <div className="grid md:grid-cols-2 gap-8">
              {related.map((rel) => (
                <div key={rel.id} className="glass p-5 rounded-2xl border-border flex flex-col justify-between hover:border-accent/30 transition">
                  <div className="space-y-2">
                    <span className="text-[10px] text-accent font-bold uppercase">{rel.category_name}</span>
                    <h5 className="font-bold text-white text-sm line-clamp-1">{rel.title}</h5>
                    <p className="text-muted text-xs line-clamp-2 leading-relaxed">{rel.seo_description}</p>
                  </div>
                  <Link href={`/blog/${rel.slug}`} className="text-xs text-accent font-bold flex items-center gap-1 hover:underline mt-4">
                    Read Article <span className="text-[10px]">→</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/60 bg-[#02040a] py-8 px-6 text-center text-xs text-muted mt-auto">
        &copy; {new Date().getFullYear()} ChessHub Academy. All rights reserved.
      </footer>
    </div>
  );
}

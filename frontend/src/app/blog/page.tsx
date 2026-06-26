'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Search, BookOpen } from 'lucide-react';
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
}

const MOCK_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: 'Top 5 Chess Openings for Junior Tournament Players',
    slug: 'top-5-chess-openings-junior-players',
    content: 'Openings define the initial board battles. For kids, building a reliable space control is paramount...',
    featured_image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=600&auto=format&fit=crop',
    category_name: 'Opening Guides',
    published_at: '2026-06-15T10:00:00Z',
    seo_description: 'Discover the top 5 chess openings for junior players to improve tactical alertness and board control.'
  },
  {
    id: 'b2',
    title: 'How to Manage Time Pressure in Classical Chess',
    slug: 'manage-time-pressure-classical-chess',
    content: 'Clock management is as critical as piece management. FIDE classical events require calculation pacing...',
    featured_image_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=600&auto=format&fit=crop',
    category_name: 'Training Tips',
    published_at: '2026-06-12T14:30:00Z',
    seo_description: 'FIDE-certified tips on how classical tournament chess players can manage clock pressure.'
  },
  {
    id: 'b3',
    title: 'ChessHub Summer Arena 2026: Tournament Report',
    slug: 'chesshub-summer-arena-2026-report',
    content: 'The academy summer arena concluded with outstanding results. Over 150 junior players competed...',
    featured_image_url: 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?q=80&w=600&auto=format&fit=crop',
    category_name: 'Tournament Reports',
    published_at: '2026-06-10T09:00:00Z',
    seo_description: 'Read the official recap and highlights from the ChessHub Academy Summer Arena 2026 tournament.'
  }
];

export default function BlogListingPage() {
  const [posts, setPosts] = useState<BlogPost[]>(MOCK_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get('/blogs/posts/');
        if (response.data && response.data.length > 0) {
          setPosts(response.data);
        }
      } catch (err) {
        console.warn('API blog fetch failed, falling back to mock assets.', err);
      }
    };
    fetchPosts();
  }, []);

  const categories = ['all', 'Opening Guides', 'Training Tips', 'Tournament Reports', 'Chess News', 'Academy Updates'];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (post.seo_description && post.seo_description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = activeCategory === 'all' || 
                            post.category_name === activeCategory || 
                            (post as any).category?.name === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

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
          <Link href="/" className="text-xs font-bold uppercase tracking-wider text-muted hover:text-white transition">
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center justify-center gap-1.5">
          <BookOpen className="w-4 h-4" /> CHESSHUB BLOG & MONOGRAPHS
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white">Chess Insights & Training Guides</h1>
        <p className="text-muted text-xs md:text-sm max-w-xl mx-auto">
          Read articles on openings, endgame patterns, calculation tips, and academy reports compiled by our FIDE-rated coaches.
        </p>
      </section>

      {/* Filters and search */}
      <section className="max-w-7xl mx-auto px-6 w-full mb-12 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
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
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-xs text-white outline-none focus:border-accent/40"
          />
        </div>
      </section>

      {/* Grid listing */}
      <section className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        {filteredPosts.map((post) => (
          <div key={post.id} className="glass rounded-3xl border-border overflow-hidden flex flex-col justify-between hover:border-accent/35 transition duration-300">
            <div>
              {/* Image */}
              <div className="aspect-video w-full relative overflow-hidden bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Contents */}
              <div className="p-6 space-y-3">
                <span className="text-[10px] text-accent font-bold uppercase tracking-widest">
                  {post.category_name || (post as any).category?.name || 'Chess Article'}
                </span>
                <h3 className="font-extrabold text-white text-base md:text-lg leading-snug line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-muted text-xs line-clamp-3 leading-relaxed">
                  {post.seo_description || post.content}
                </p>
              </div>
            </div>

            {/* Link Footer */}
            <div className="p-6 pt-0 border-t border-border/40 mt-4 flex items-center justify-between">
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'N/A'}
              </span>
              <Link
                href={`/blog/${post.slug}`}
                className="text-xs text-accent font-bold flex items-center gap-1 group hover:underline"
              >
                Read Article <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="col-span-full text-center py-20 text-muted">
            No blog posts found matching your criteria.
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-[#02040a] py-8 px-6 text-center text-xs text-muted mt-auto">
        &copy; {new Date().getFullYear()} ChessHub Academy. All rights reserved.
      </footer>
    </div>
  );
}

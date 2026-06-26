'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { api } from '@/utils/api';

interface GalleryItem {
  id: string;
  title: string;
  category: 'classes' | 'achievements' | 'tournaments' | 'certificates';
  image_url: string;
}

// Fallback high-quality design assets if backend is empty
const MOCK_GALLERY: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Live 1-to-1 Grandmaster Tactics Session',
    category: 'classes',
    image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'g2',
    title: 'National Under-14 Championship Winner',
    category: 'achievements',
    image_url: 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'g3',
    title: 'ChessHub Summer Arena Championship',
    category: 'tournaments',
    image_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'g4',
    title: 'FIDE Rated Master Class Certificate',
    category: 'certificates',
    image_url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'g5',
    title: 'Junior Squad Group Endgames Study',
    category: 'classes',
    image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'g6',
    title: 'Rating Milestone Award: 1800 Elo reached',
    category: 'achievements',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop',
  },
];

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>(MOCK_GALLERY);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await api.get('/academy/gallery/');
        if (response.data && response.data.length > 0) {
          setItems(response.data);
        }
      } catch (err) {
        console.warn('API gallery fetch failed, falling back to mock assets.', err);
      }
    };
    fetchGallery();
  }, []);

  const filteredItems = activeFilter === 'all' 
    ? items 
    : items.filter(item => item.category === activeFilter);

  const categories = [
    { value: 'all', label: 'All Media' },
    { value: 'classes', label: 'Live Classes' },
    { value: 'achievements', label: 'Achievements' },
    { value: 'tournaments', label: 'Tournaments' },
    { value: 'certificates', label: 'Certificates' }
  ];

  return (
    <div className="w-full">
      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveFilter(cat.value)}
            className={`px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition border cursor-pointer ${
              activeFilter === cat.value
                ? 'bg-accent border-accent text-black shadow-lg shadow-accent/15'
                : 'bg-card border-border text-muted hover:text-white hover:border-muted'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Masonry grid with Framer Motion Layout animations */}
      <motion.div 
        layout 
        className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 [column-fill:_balance] box-border"
      >
        <AnimatePresence>
          {filteredItems.map((item) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              key={item.id}
              className="break-inside-avoid relative rounded-2xl overflow-hidden group bg-card border border-border/80 cursor-pointer shadow-lg hover:shadow-2xl hover:border-accent/30 transition-all duration-300"
              onClick={() => setSelectedImage(item)}
            >
              {/* Image loading placeholder container */}
              <div className="relative overflow-hidden w-full bg-slate-900/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                />
                
                {/* Dark overlay & info on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <div className="bg-accent/10 border border-accent/30 text-accent text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded w-max mb-2">
                    {item.category.replace('_', ' ')}
                  </div>
                  <h4 className="text-white text-base font-bold flex items-center gap-2">
                    {item.title}
                    <ZoomIn className="w-4 h-4 text-accent shrink-0" />
                  </h4>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.image_url}
                alt={selectedImage.title}
                className="max-w-full max-h-[75vh] object-contain rounded-xl border border-accent/20 shadow-2xl"
              />
              <div className="text-center text-white space-y-1">
                <span className="text-xs text-accent font-bold uppercase tracking-wider">
                  {selectedImage.category.replace('_', ' ')}
                </span>
                <h3 className="text-lg font-bold">{selectedImage.title}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

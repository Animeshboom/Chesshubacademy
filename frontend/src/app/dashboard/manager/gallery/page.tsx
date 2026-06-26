'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import {
  Upload, Trash2, Image as ImageIcon, Calendar, Award,
  Trophy, FileBadge, Plus, X, Eye, Film, Loader2
} from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  category: 'classes' | 'achievements' | 'tournaments' | 'certificates';
  image_url: string;
  drive_file_id?: string;
  created_at: string;
}

const CATEGORY_DETAILS = {
  classes: { label: 'Live Classes', icon: Film, color: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400' },
  achievements: { label: 'Student Achievements', icon: Trophy, color: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400' },
  tournaments: { label: 'Tournaments', icon: Calendar, color: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400' },
  certificates: { label: 'Certificates', icon: FileBadge, color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400' },
};

export default function GalleryManagementPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'classes' | 'achievements' | 'tournaments' | 'certificates'>('classes');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Status messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch gallery list
  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/academy/gallery/');
      setItems(response.data);
    } catch (err) {
      console.error('Failed to load gallery items:', err);
      setErrorMsg('Failed to fetch gallery items. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  // Submit new gallery item
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a descriptive title.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('category', category);

    if (uploadMode === 'file') {
      if (!selectedFile) {
        setErrorMsg('Please select an image file to upload.');
        setSubmitting(false);
        return;
      }
      fd.append('file', selectedFile);
    } else {
      if (!imageUrl.trim()) {
        setErrorMsg('Please enter a valid image URL.');
        setSubmitting(false);
        return;
      }
      fd.append('image_url', imageUrl.trim());
    }

    try {
      await api.post('/academy/gallery/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMsg('Media uploaded and added to the gallery successfully!');
      setTitle('');
      setImageUrl('');
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchGallery();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to upload media. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete gallery item
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.delete(`/academy/gallery/${id}/`);
      setSuccessMsg('Media item deleted successfully!');
      fetchGallery();
    } catch (err) {
      console.error('Delete failed:', err);
      setErrorMsg('Failed to delete media item.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter items
  const filteredItems = selectedFilter === 'all'
    ? items
    : items.filter(item => item.category === selectedFilter);

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-5">
        <div>
          <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Management Console</span>
          <h2 className="text-xl font-extrabold text-white mt-1">Photo Gallery Management</h2>
          <p className="text-xs text-muted mt-1">
            Upload images, certificates, class memories, and highlights to showcase on the public website.
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="p-3.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-xl font-medium animate-fade-in">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-medium animate-fade-in">
          {errorMsg}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-5 rounded-3xl border-border bg-gradient-to-br from-primary/5 to-secondary/5 space-y-5">
            <div className="border-b border-border/60 pb-3 flex items-center gap-2">
              <Plus className="text-primary w-4 h-4" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Add Gallery Item</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-muted font-bold uppercase tracking-wider">Media Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Under-14 Tournament Championship Trophy"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:outline-none focus:border-primary transition"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-muted font-bold uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition"
                >
                  <option value="classes">Live Classes</option>
                  <option value="achievements">Student Achievements</option>
                  <option value="tournaments">Tournaments</option>
                  <option value="certificates">Certificates</option>
                </select>
              </div>

              {/* Upload Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-muted font-bold uppercase tracking-wider block">Source Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`py-2 rounded-xl border text-center transition font-semibold ${
                      uploadMode === 'file'
                        ? 'bg-primary/20 border-primary text-white'
                        : 'bg-background border-border text-muted hover:text-foreground'
                    }`}
                  >
                    File Upload (Drive)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`py-2 rounded-xl border text-center transition font-semibold ${
                      uploadMode === 'url'
                        ? 'bg-primary/20 border-primary text-white'
                        : 'bg-background border-border text-muted hover:text-foreground'
                    }`}
                  >
                    Direct Image URL
                  </button>
                </div>
              </div>

              {/* Upload Type Inputs */}
              {uploadMode === 'file' ? (
                <div className="space-y-1.5">
                  <label className="text-muted font-bold uppercase tracking-wider">Image File</label>
                  <div className="border border-dashed border-border rounded-2xl p-4 bg-background/55 text-center cursor-pointer hover:border-primary transition relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-muted group-hover:text-primary transition" />
                      <span className="font-semibold text-muted group-hover:text-foreground transition">
                        {selectedFile ? selectedFile.name : 'Select or drag an image'}
                      </span>
                      <span className="text-[10px] text-muted/60">Supports PNG, JPG, JPEG</span>
                    </div>
                  </div>
                  {previewUrl && (
                    <div className="mt-3 relative rounded-xl overflow-hidden border border-border/80 h-32 w-full bg-background/40">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-muted font-bold uppercase tracking-wider">Direct Image URL</label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:outline-none focus:border-primary transition"
                  />
                  {imageUrl.trim() && (
                    <div className="mt-3 relative rounded-xl overflow-hidden border border-border/80 h-32 w-full bg-background/40">
                      <img
                        src={imageUrl.trim()}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading and Syncing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Publish to Gallery
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Gallery List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Category Filter Tabs */}
          <div className="glass p-3 rounded-2xl border-border flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-foreground hover:bg-border/30'
              }`}
            >
              All Media
            </button>
            {Object.entries(CATEGORY_DETAILS).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setSelectedFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === key
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-foreground hover:bg-border/30'
                }`}
              >
                {value.label}
              </button>
            ))}
          </div>

          {/* Grid Layout */}
          {loading ? (
            <div className="glass p-20 rounded-3xl border-border text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs text-muted">Retrieving academy gallery...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="glass py-20 text-center text-muted text-xs border border-dashed border-border rounded-3xl">
              <ImageIcon className="w-8 h-8 mx-auto mb-3 opacity-40 text-primary" />
              No gallery items found in this category.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const catInfo = CATEGORY_DETAILS[item.category] || { label: item.category, icon: ImageIcon, color: 'bg-border text-muted' };
                const Icon = catInfo.icon;
                return (
                  <div key={item.id} className="glass rounded-2xl border-border overflow-hidden flex flex-col group hover:scale-[1.01] transition-all">
                    {/* Media Thumbnail Container */}
                    <div className="h-44 w-full relative bg-slate-950/40 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // fallback if fails to load
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=600&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/75 border border-white/10 flex items-center gap-1 text-white`}>
                          <Icon className="w-3 h-3" />
                          {catInfo.label}
                        </span>
                      </div>

                      {/* Overlay action */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <a
                          href={item.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition"
                          title="View Original"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl text-red-300 transition"
                          title="Delete Item"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Metadata Card Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-extrabold text-white text-xs leading-tight line-clamp-2">{item.title}</h4>
                        <p className="text-[10px] text-muted mt-1">
                          Uploaded: {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      
                      {item.drive_file_id && (
                        <div className="text-[9px] text-muted/80 bg-background/55 border border-border/40 px-2 py-0.5 rounded font-mono truncate w-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                          Google Drive Synced
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

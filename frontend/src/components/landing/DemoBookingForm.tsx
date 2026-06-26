'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Calendar, Phone, Globe, User, Award, ArrowRight } from 'lucide-react';
import { api } from '@/utils/api';

export default function DemoBookingForm() {
  const [formData, setFormData] = useState({
    parent_name: '',
    student_name: '',
    age: '',
    country: '',
    whatsapp_number: '',
    chess_level: 'beginner',
    preferred_time: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Post booking directly to Next.js API Route (which connects to Neon DB)
      const response = await fetch('/api/v1/academy/demo-bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong. Please check your inputs and try again.');
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      setError(
        err.message ||
        'Something went wrong. Please check your inputs and try again.'
      );
    }
  };

  return (
    <div className="relative glass border border-accent/25 rounded-3xl p-8 md:p-10 shadow-2xl shadow-accent/5 max-w-xl mx-auto overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.form
            key="booking-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="space-y-6 relative z-10"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent">
                Book a Free Demo Class
              </h3>
              <p className="text-muted text-sm mt-2">
                1-on-1 assessment and personalized learning roadmap session with our elite coach.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
              {/* Parent Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accent" /> Parent Name
                </label>
                <input
                  type="text"
                  name="parent_name"
                  required
                  value={formData.parent_name}
                  onChange={handleChange}
                  placeholder="e.g., Rajesh Kumar"
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-accent/50 outline-none text-white text-sm transition"
                />
              </div>

              {/* Student Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accent" /> Student Name
                </label>
                <input
                  type="text"
                  name="student_name"
                  required
                  value={formData.student_name}
                  onChange={handleChange}
                  placeholder="e.g., Aarav Kumar"
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-accent/50 outline-none text-white text-sm transition"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Age */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-accent" /> Student Age
                </label>
                <input
                  type="number"
                  name="age"
                  required
                  min="5"
                  max="99"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-accent/50 outline-none text-white text-sm transition"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-accent" /> Country
                </label>
                <input
                  type="text"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g., India or USA"
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-accent/50 outline-none text-white text-sm transition"
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-accent" /> WhatsApp Number (With Country Code)
              </label>
              <input
                type="tel"
                name="whatsapp_number"
                required
                value={formData.whatsapp_number}
                onChange={handleChange}
                placeholder="e.g., +91 98765 43210"
                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-accent/50 outline-none text-white text-sm transition"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Chess Level */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-accent" /> Current Chess Level
                </label>
                <select
                  name="chess_level"
                  value={formData.chess_level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-accent/50 outline-none text-white text-sm transition appearance-none"
                >
                  <option value="beginner">Beginner Foundations</option>
                  <option value="intermediate">Intermediate Development</option>
                  <option value="advanced">Advanced Training</option>
                  <option value="tournament">Tournament Excellence</option>
                </select>
              </div>

              {/* Preferred Time */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-accent" /> Preferred Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="preferred_time"
                  required
                  value={formData.preferred_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-accent/50 outline-none text-white text-sm transition [color-scheme:dark]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-accent to-amber-600 text-black font-bold rounded-xl hover:opacity-95 transition shadow-lg shadow-accent/15 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Confirm Free Booking <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="success-message"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-10 space-y-6 relative z-10"
          >
            <div className="inline-flex items-center justify-center p-4 bg-accent/10 border border-accent/30 text-accent rounded-full mb-2">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-extrabold text-white">Booking Confirmed!</h3>
            <p className="text-muted max-w-sm mx-auto leading-relaxed">
              Thank you, <span className="text-white font-semibold">{formData.parent_name}</span>. A confirmation notification has been dispatched to <span className="text-accent font-semibold">{formData.whatsapp_number}</span>.
            </p>
            <div className="p-4 rounded-2xl bg-card border border-border text-xs text-muted max-w-md mx-auto leading-relaxed">
              We have saved your details. Our Academy Director will reach out on WhatsApp within 2 hours to confirm your Zoom link and schedule.
            </div>
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-2.5 bg-background border border-border text-white text-sm font-semibold rounded-xl hover:bg-card transition"
            >
              Book Another Demo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, ShoppingBag, ArrowRight } from 'lucide-react';

export default function HeroBanner({ banners = [], onBannerClick }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xl mb-8 group">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div key={banner.id || index} className="min-w-full relative h-[320px] sm:h-[380px] lg:h-[420px] flex items-center">
            {/* Background Image with Ambient Zoom */}
            <img
              src={banner.image}
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.bg_gradient || 'from-slate-950 via-slate-900/80 to-transparent'} opacity-90`} />

            {/* Banner Content */}
            <div className="relative z-10 max-w-2xl px-6 sm:px-12 lg:px-16 text-white space-y-4">
              {banner.badge && (
                <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md">
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  {banner.badge}
                </div>
              )}
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
                {banner.title}
              </h2>
              <p className="text-slate-200 text-sm sm:text-base line-clamp-2 max-w-lg drop-shadow">
                {banner.subtitle}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => onBannerClick?.(banner.link)}
                  className="bg-white hover:bg-slate-100 text-slate-950 font-bold px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 hover:gap-3 transition-all hover:scale-105 active:scale-95 text-sm"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="hidden sm:inline-block text-xs font-medium text-emerald-200/90 bg-emerald-950/40 backdrop-blur px-3 py-2 rounded-xl border border-emerald-500/20">
                  ⚡ Guaranteed 30-min doorstep delivery
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/80 hover:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/80 hover:text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === i ? 'w-8 bg-emerald-400 shadow-md' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

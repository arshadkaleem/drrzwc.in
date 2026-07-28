'use client';

import { useState, useEffect, useCallback } from 'react';

interface Slide {
  image: string;
  alt_text: string;
}

interface HomeSliderProps {
  slides: Slide[];
}

export default function HomeSlider({ slides }: HomeSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const cleanUrl = useCallback((url: string) => {
    if (!url) return '';
    return url.replace('http://localhost/drrzwc.in', '').replace('https://drrzwc.in', '');
  }, []);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [slides.length, isTransitioning]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [slides.length, isTransitioning]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [slides.length, nextSlide]);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden group">
      {/* Slides */}
      {slides.map((slide, index) => {
        const cleanedImageSrc = cleanUrl(slide.image);
        return (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="relative w-full h-full">
              <img
                src={cleanedImageSrc}
                alt={slide.alt_text || 'College Slide'}
                className="w-full h-full object-cover"
              />
              {slide.alt_text && (
                <div className="absolute left-4 md:left-12 bottom-8 md:bottom-16 bg-[#0a1d37]/80 backdrop-blur-md text-white px-6 py-4 max-w-[85%] md:max-w-[600px] rounded-lg border border-white/10 shadow-2xl z-20 animate-[slideInLeft_0.5s_ease-out]">
                  <h3 className="text-sm md:text-xl font-bold tracking-wide font-heading text-[#c5a059]">{slide.alt_text}</h3>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isTransitioning) {
                  setIsTransitioning(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsTransitioning(false), 500);
                }
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-[#ee651e] scale-110' : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Arrow Controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/35 hover:bg-black/60 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/35 hover:bg-black/60 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

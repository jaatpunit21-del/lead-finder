import React from 'react';
import { Calendar, Eye } from 'lucide-react';

export default function Hero() {
  const handleScrollTo = (e, id) => {
    e.preventDefault();
    const targetElement = document.querySelector(id);
    if (targetElement) {
      const offset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section 
      id="home" 
      className="relative w-full h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-luxury-black"
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
        poster="/images/hero_fallback.png"
      >
        {/* Local video loop for maximum reliability and ad-blocker compliance */}
        <source 
          src="/images/hero_video.mp4" 
          type="video/mp4" 
        />
      </video>

      {/* Dark Subtle Luxury Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-luxury-black/80 via-luxury-darkBlue/75 to-luxury-black z-10"></div>

      {/* Hero Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-6 md:px-12 text-center text-white flex flex-col items-center">
        {/* Subtle Pre-header */}
        <div className="mb-6 flex items-center gap-3 tracking-widest-luxury uppercase text-xs text-luxury-gold/90 font-medium animate-fade-in">
          <div className="w-8 h-[1px] bg-luxury-gold/50"></div>
          <span>ESTABLISHED 1967 IN MISSISSAUGA</span>
          <div className="w-8 h-[1px] bg-luxury-gold/50"></div>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal leading-tight md:leading-none tracking-wide text-shadow-gold mb-6 max-w-4xl">
          Where Beauty Meets <span className="italic text-luxury-gold font-light">Precision</span>
        </h1>

        {/* Subheadline */}
        <p className="text-base md:text-xl lg:text-2xl text-luxury-cream/80 font-light tracking-wide max-w-2xl mb-12">
          Premium Hair & Laser Services in Mississauga. Elevating your aesthetic experience with master styling and clinical skin wellness.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full max-w-md">
          <a
            href="#booking"
            onClick={(e) => handleScrollTo(e, '#booking')}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-luxury-gold text-luxury-black font-semibold text-xs tracking-widest-luxury uppercase border border-luxury-gold hover:bg-transparent hover:text-white transition-all duration-500 rounded-sm shadow-lg group"
          >
            <Calendar className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Book Appointment</span>
          </a>
          
          <a
            href="#services"
            onClick={(e) => handleScrollTo(e, '#services')}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-transparent text-white font-semibold text-xs tracking-widest-luxury uppercase border border-white/30 hover:border-luxury-gold hover:text-luxury-gold transition-all duration-500 rounded-sm group"
          >
            <Eye className="w-4 h-4 transition-transform group-hover:translate-y-[1px]" />
            <span>View Services</span>
          </a>
        </div>
      </div>

      {/* Decorative Elegant Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-2 text-white/50 hover:text-luxury-gold transition-colors duration-300">
        <span className="text-[10px] tracking-widest-luxury uppercase font-light">Scroll To Explore</span>
        <div className="w-[1px] h-12 bg-white/20 relative overflow-hidden rounded-full">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-luxury-gold animate-bounce"></div>
        </div>
      </div>
    </section>
  );
}

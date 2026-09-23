import React, { useState } from 'react';
import { Camera, X, ZoomIn } from 'lucide-react';
import { galleryData } from '../data/salonData';

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);

  const openLightbox = (imgData) => {
    setSelectedImage(imgData);
    document.body.style.overflow = 'hidden'; // Lock body scroll
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto'; // Unlock body scroll
  };

  return (
    <section id="gallery" className="py-24 md:py-32 bg-white dark:bg-luxury-black transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <span className="text-xs tracking-widest-luxury uppercase text-luxury-gold font-medium block mb-3">
            Real Customer Results
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-luxury-black dark:text-white mb-6">
            Aesthetic Portfolio
          </h2>
          <div className="w-12 h-[1px] bg-luxury-gold/50 mx-auto mb-6"></div>
          <p className="text-luxury-black/60 dark:text-luxury-cream/70 font-light text-base leading-relaxed">
            Browse through our portfolio of custom colors, hand-painted balayages, and advanced skincare results captured in natural lighting.
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="masonry-grid reveal">
          {galleryData.map((item) => (
            <div
              key={item.id}
              onClick={() => openLightbox(item)}
              className="relative overflow-hidden rounded-sm gold-border-glow shadow-md bg-luxury-cream dark:bg-luxury-darkBlue cursor-pointer group break-inside-avoid mb-5"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Luxury Hover Overlay */}
              <div className="absolute inset-0 bg-luxury-blue/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 z-10">
                <span className="text-[10px] tracking-widest-luxury text-luxury-gold uppercase font-medium mb-1">
                  {item.category}
                </span>
                <h3 className="font-serif text-xl font-normal text-white mb-2">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-white/70 font-light mt-1">
                  <ZoomIn className="w-3.5 h-3.5 text-luxury-gold" />
                  <span>Enlarge Photo</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-luxury-black/95 p-4 transition-opacity duration-500"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 text-white/80 hover:text-luxury-gold transition-colors p-2 focus:outline-none z-50"
              aria-label="Close image viewer"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image Container */}
            <div 
              className="relative max-w-4xl max-h-[80vh] w-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()} // Stop close on inner click
            >
              <img
                src={selectedImage.image}
                alt={selectedImage.title}
                className="max-w-full max-h-[70vh] object-contain rounded-sm shadow-2xl border border-white/10"
              />
              
              {/* Info panel below image */}
              <div className="mt-6 text-center text-white max-w-xl">
                <span className="text-xs tracking-widest-luxury uppercase text-luxury-gold font-medium block mb-1">
                  {selectedImage.category}
                </span>
                <h3 className="font-serif text-2xl font-normal">
                  {selectedImage.title}
                </h3>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

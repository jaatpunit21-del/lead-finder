import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { instagramData } from '../data/salonData';

export default function InstagramGrid() {
  return (
    <section id="instagram" className="py-24 md:py-32 bg-white dark:bg-luxury-black border-t border-luxury-gold/15 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <div className="inline-flex items-center justify-center p-3.5 rounded-full bg-luxury-blue/5 dark:bg-luxury-gold/5 text-luxury-gold mb-4 border border-luxury-gold/20">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.096 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </div>
          <span className="text-xs tracking-widest-luxury uppercase text-luxury-gold font-medium block mb-3">
            Follow Our Transformations
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-normal text-luxury-black dark:text-white mb-6">
            Instagram Gallery
          </h2>
          <div className="w-12 h-[1px] bg-luxury-gold/50 mx-auto mb-6"></div>
          <p className="text-luxury-black/60 dark:text-luxury-cream/70 font-light text-base leading-relaxed">
            See the daily masterpieces, balayage blowouts, and aesthetic results straight from our styling chairs and clinical skin treatment rooms.
          </p>
        </div>

        {/* Instagrid 3x2 / Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 reveal">
          {instagramData.map((post) => (
            <a
              key={post.id}
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden aspect-square rounded-sm gold-border-glow shadow-sm bg-luxury-cream cursor-pointer group"
            >
              {/* Instagram Square Image */}
              <img
                src={post.image}
                alt={`Instagram salon transform ${post.id}`}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                loading="lazy"
              />

              {/* Instagram Hover Stat Overlay */}
              <div className="absolute inset-0 bg-luxury-blue/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-6 z-10 text-white">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Heart className="w-4.5 h-4.5 fill-luxury-gold text-luxury-gold" />
                  <span>{post.likes}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <MessageCircle className="w-4.5 h-4.5 fill-white text-white" />
                  <span>{post.comments}</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Follow CTA bar */}
        <div className="text-center mt-12 reveal">
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-luxury-blue hover:bg-luxury-gold text-white hover:text-luxury-black font-semibold text-xs tracking-widest-luxury uppercase border border-luxury-blue hover:border-luxury-gold transition-all duration-300 rounded-sm shadow-md"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.096 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            <span>Follow us @OriginalHairFashion</span>
          </a>
        </div>

      </div>
    </section>
  );
}

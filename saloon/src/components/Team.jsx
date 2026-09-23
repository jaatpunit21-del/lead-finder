import React from 'react';
import { Award, Star } from 'lucide-react';
import { teamData } from '../data/salonData';

export default function Team() {
  return (
    <section id="team" className="py-24 md:py-32 bg-white dark:bg-luxury-black transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 reveal">
          <span className="text-xs tracking-widest-luxury uppercase text-luxury-gold font-medium block mb-3">
            Elite Artistry & Skincare
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-luxury-black dark:text-white mb-6">
            Meet Our Masters
          </h2>
          <div className="w-12 h-[1px] bg-luxury-gold/50 mx-auto mb-6"></div>
          <p className="text-luxury-black/60 dark:text-luxury-cream/70 font-light text-base leading-relaxed">
            Our team consists of certified master colorists, precision hairstylists, and clinical medical estheticians who combine technical mastery with premium client care.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8 reveal">
          {teamData.map((member) => (
            <div
              key={member.id}
              className="flex flex-col items-center text-center p-6 bg-luxury-cream dark:bg-luxury-darkBlue border border-luxury-gold/10 dark:border-white/5 rounded-sm hover:shadow-lg transition-all duration-500 group"
            >
              {/* Circular portrait with gold halo effect on hover */}
              <div className="relative w-48 h-48 mb-8 rounded-full p-1 border-2 border-luxury-gold/20 group-hover:border-luxury-gold transition-colors duration-500 overflow-hidden shadow-md flex items-center justify-center bg-white dark:bg-luxury-black">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover rounded-full transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Tag/Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-luxury-blue/5 dark:bg-luxury-black/30 border border-luxury-gold/20 text-[10px] tracking-widest-luxury uppercase font-semibold text-luxury-gold rounded-full mb-4">
                <Award className="w-3.5 h-3.5" />
                {member.experience}
              </span>

              {/* Name & Title */}
              <h3 className="font-serif text-2xl font-normal text-luxury-black dark:text-white mb-1 group-hover:text-luxury-gold transition-colors">
                {member.name}
              </h3>
              <p className="text-[11px] uppercase tracking-widest-luxury text-luxury-black/50 dark:text-luxury-cream/50 font-medium mb-4">
                {member.role}
              </p>

              {/* Bio description */}
              <p className="text-sm text-luxury-black/70 dark:text-luxury-cream/70 font-light leading-relaxed max-w-xs px-2">
                {member.bio}
              </p>
            </div>
          ))}
        </div>

        {/* Call to consult */}
        <div className="mt-16 text-center reveal">
          <a
            href="#booking"
            className="inline-flex items-center gap-2 text-xs tracking-widest-luxury uppercase font-semibold text-luxury-black dark:text-white hover:text-luxury-gold transition-colors py-2 border-b border-luxury-black dark:border-white hover:border-luxury-gold dark:hover:border-luxury-gold transition-all duration-300"
          >
            <span>Book a consult with our specialists</span>
          </a>
        </div>

      </div>
    </section>
  );
}

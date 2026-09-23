import React from 'react';
import { Award, Clock, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="py-24 md:py-32 bg-luxury-cream dark:bg-luxury-black overflow-hidden transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Narrative Content */}
          <div className="lg:col-span-6 reveal">
            <div className="flex items-center gap-3 text-luxury-gold tracking-widest-luxury uppercase text-xs font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Our Legacy & Heritage</span>
            </div>
            
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-luxury-black dark:text-white mb-8 leading-tight">
              A Legacy of Beauty <br />
              <span className="italic text-luxury-gold font-light">& Clinical Precision</span>
            </h2>
            
            <p className="text-luxury-black/70 dark:text-luxury-cream/80 font-light text-base md:text-lg leading-relaxed mb-6">
              Serving the Mississauga community since 1967, **Original Hair Fashion & Laser** has stood as a hallmark of professional hair artistry. For over five decades, we have dedicated ourselves to transforming locks and instilling confidence in every client who walks through our doors.
            </p>
            
            <p className="text-luxury-black/70 dark:text-luxury-cream/80 font-light text-base md:text-lg leading-relaxed mb-10">
              In our pursuit of full-spectrum beauty, we expanded our offerings to include state-of-the-art medical esthetic and laser therapies. Combining the creative flair of master hair designers with the rigorous safety standards of advanced laser technology, we provide a premium sanctuary where your hair and skin receive unparalleled care.
            </p>

            {/* Feature stats */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-luxury-gold/20">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-luxury-blue/5 dark:bg-luxury-gold/5 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-semibold text-luxury-black dark:text-white">Established 1967</h4>
                  <p className="text-xs text-luxury-black/50 dark:text-luxury-cream/60 font-light mt-1">Over 50 years of trusted local beauty craft.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-luxury-blue/5 dark:bg-luxury-gold/5 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-semibold text-luxury-black dark:text-white">Tailored Care</h4>
                  <p className="text-xs text-luxury-black/50 dark:text-luxury-cream/60 font-light mt-1">Personalized beauty plans and precision treatments.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Showcase */}
          <div className="lg:col-span-6 relative reveal">
            {/* Elegant Background Gold Border Frame */}
            <div className="absolute -inset-4 border border-luxury-gold/20 rounded-sm translate-x-4 translate-y-4 -z-10 hidden sm:block"></div>
            
            {/* Main Salon Interior Image */}
            <div className="overflow-hidden rounded-sm gold-border-glow bg-luxury-blue shadow-2xl relative group">
              <img 
                src="/images/salon_interior.png" 
                alt="Original Hair Fashion & Laser Interior Design" 
                className="w-full h-[450px] md:h-[550px] object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              {/* Subtle dark overlay with brand badge */}
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/60 via-transparent to-transparent opacity-80 transition-opacity duration-300"></div>
              
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <p className="text-xs tracking-widest-luxury uppercase text-luxury-gold font-light mb-1">
                  Mississauga Salon & Clinic
                </p>
                <h3 className="font-serif text-2xl font-normal tracking-wide">
                  Where luxury and comfort align
                </h3>
              </div>
            </div>

            {/* Decorative Float Box */}
            <div className="absolute -bottom-8 -left-8 bg-luxury-blue dark:bg-luxury-darkBlue text-white p-6 md:p-8 rounded-sm shadow-xl border border-luxury-gold/20 hidden md:block max-w-[240px]">
              <span className="font-serif text-4xl text-luxury-gold font-light block mb-2">4.6★</span>
              <p className="text-xs tracking-wide font-light text-white/80">
                Highly rated by 136+ Mississauga residents for elite styling and laser skincare.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

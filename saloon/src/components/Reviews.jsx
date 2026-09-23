import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { testimonialsData, businessDetails } from '../data/salonData';

export default function Reviews() {
  // Helper to render star icons
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating 
            ? 'fill-luxury-gold text-luxury-gold' 
            : 'text-luxury-gray fill-luxury-gray'
        }`}
      />
    ));
  };

  return (
    <section id="reviews" className="py-24 md:py-32 bg-luxury-cream dark:bg-luxury-black border-t border-b border-luxury-gold/15 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Rating Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16 reveal">
          {/* Rating Summary Card */}
          <div className="lg:col-span-5 bg-luxury-blue dark:bg-luxury-darkBlue text-white p-8 md:p-12 rounded-sm border border-luxury-gold/20 shadow-xl relative overflow-hidden group">
            {/* Background design elements */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-luxury-gold/5 rounded-full blur-2xl"></div>
            
            <span className="text-[10px] tracking-widest-luxury uppercase text-luxury-gold font-medium block mb-4">
              Google Verified Rating
            </span>
            
            <div className="flex items-baseline gap-4 mb-4">
              <span className="font-serif text-6xl md:text-7xl font-light text-luxury-gold">
                {businessDetails.rating}
              </span>
              <div>
                <div className="flex gap-1 mb-1.5">
                  {renderStars(5)}
                </div>
                <span className="text-xs text-white/50 font-light block">
                  Based on Google Maps data
                </span>
              </div>
            </div>

            <h3 className="font-serif text-2xl font-normal mb-2 mt-6">
              {businessDetails.reviewsCount}+ Client Reviews
            </h3>
            
            <p className="text-white/70 font-light text-sm leading-relaxed mb-6">
              Mississauga's trusted destination for precision cuts and laser aesthetics. We strive to provide a premium customer experience for every guest.
            </p>

            <a
              href="https://maps.app.goo.gl/KUYXLUWfkUj25kG46"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs tracking-widest-luxury text-luxury-gold uppercase font-semibold hover:text-white transition-colors py-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Write A Review</span>
            </a>
          </div>

          {/* Intro Text */}
          <div className="lg:col-span-7">
            <span className="text-xs tracking-widest-luxury uppercase text-luxury-gold font-medium block mb-3">
              Why Clients Love Us
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-normal text-luxury-black dark:text-white mb-6 leading-tight">
              Testimonials From <br />
              <span className="italic text-luxury-gold font-light">Our Community</span>
            </h2>
            <div className="w-12 h-[1px] bg-luxury-gold/50 mb-6"></div>
            <p className="text-luxury-black/60 dark:text-luxury-cream/80 font-light text-base md:text-lg leading-relaxed max-w-xl">
              We take pride in our precision. Hear directly from our guests about their experiences with our hairstyling masters and laser skin clinicians.
            </p>
          </div>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 reveal">
          {testimonialsData.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-luxury-darkBlue p-8 rounded-sm shadow-md border border-luxury-gold/10 dark:border-white/5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="font-serif text-lg font-semibold text-luxury-black dark:text-white">
                      {testimonial.name}
                    </h4>
                    <span className="text-[10px] tracking-wider uppercase text-luxury-gold font-medium block mt-0.5">
                      Verified Client
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
                
                <p className="text-luxury-black/70 dark:text-luxury-cream/80 font-light text-sm italic leading-relaxed mb-6">
                  "{testimonial.text}"
                </p>
              </div>

              <div className="border-t border-luxury-gray dark:border-white/10 pt-4 flex justify-between items-center text-[10px] uppercase tracking-widest-luxury text-luxury-black/40 dark:text-luxury-cream/40 font-light">
                <span>Treatment Received:</span>
                <span className="font-medium text-luxury-black/60 dark:text-luxury-cream/60">{testimonial.service}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

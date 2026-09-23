import React from 'react';
import { MapPin, Phone, Compass, Clock, Star } from 'lucide-react';
import { businessDetails } from '../data/salonData';

export default function Location() {
  return (
    <section id="location" className="py-24 md:py-32 bg-white dark:bg-luxury-black transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <span className="text-xs tracking-widest-luxury uppercase text-luxury-gold font-medium block mb-3">
            Visit Our Salon & Clinic
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-normal text-luxury-black dark:text-white mb-6">
            Location & Hours
          </h2>
          <div className="w-12 h-[1px] bg-luxury-gold/50 mx-auto mb-6"></div>
        </div>

        {/* Map & Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-stretch reveal">
          
          {/* Business Hours & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-8 md:p-10 bg-luxury-cream dark:bg-luxury-darkBlue border border-luxury-gold/15 dark:border-white/5 rounded-sm shadow-md">
            <div>
              {/* Address detail */}
              <div className="mb-8">
                <div className="flex gap-3 text-luxury-gold mb-3">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-xs tracking-widest-luxury uppercase font-semibold">
                    Our Address
                  </span>
                </div>
                <p className="text-luxury-black dark:text-white text-base md:text-lg font-light leading-relaxed pl-8">
                  {businessDetails.address}
                </p>
                <div className="flex items-center gap-1 mt-2 pl-8 text-xs text-luxury-black/50 dark:text-luxury-cream/50 font-light">
                  <span>Rating: {businessDetails.rating} ★</span>
                  <span className="mx-1">•</span>
                  <span>{businessDetails.reviewsCount} Google Reviews</span>
                </div>
              </div>

              {/* Hours details */}
              <div className="mb-8">
                <div className="flex gap-3 text-luxury-gold mb-4">
                  <Clock className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs tracking-widest-luxury uppercase font-semibold">
                    Business Hours
                  </span>
                </div>
                <div className="space-y-2.5 pl-8">
                  {businessDetails.hours.map((item) => (
                    <div 
                      key={item.day} 
                      className={`flex justify-between text-sm ${
                        item.time === 'Closed' 
                          ? 'text-luxury-black/40 dark:text-white/30 italic font-light' 
                          : 'text-luxury-black dark:text-white/90 font-light'
                      }`}
                    >
                      <span className="font-medium">{item.day}</span>
                      <span>{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions button strip */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-luxury-gold/20 dark:border-white/10">
              <a
                href={businessDetails.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 bg-luxury-blue dark:bg-luxury-gold text-white dark:text-luxury-black font-semibold text-[10px] tracking-widest-luxury uppercase hover:bg-luxury-gold hover:text-luxury-black dark:hover:bg-transparent dark:hover:text-white border border-transparent dark:hover:border-luxury-gold transition-colors rounded-sm shadow-sm"
              >
                <Compass className="w-4 h-4 text-luxury-gold" />
                <span>Directions</span>
              </a>
              
              <a
                href={`tel:${businessDetails.phone}`}
                className="flex items-center justify-center gap-2 py-3.5 bg-transparent border border-luxury-blue/30 dark:border-white/10 text-luxury-blue dark:text-white hover:border-luxury-gold dark:hover:text-luxury-gold hover:text-luxury-gold dark:hover:border-luxury-gold transition-colors font-semibold text-[10px] tracking-widest-luxury uppercase rounded-sm"
              >
                <Phone className="w-4 h-4" />
                <span>Call Salon</span>
              </a>
            </div>
          </div>

          {/* Google Map Frame (7 cols) */}
          <div className="lg:col-span-7 min-h-[350px] lg:min-h-full rounded-sm overflow-hidden gold-border-glow shadow-md">
            <iframe
              src={businessDetails.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '350px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Original Hair Fashion & Laser Location Map"
              className="w-full h-full grayscale-[20%] hover:grayscale-0 dark:invert-[90%] dark:hue-rotate-[180deg] dark:contrast-[100%] transition-all duration-700"
            ></iframe>
          </div>

        </div>

      </div>
    </section>
  );
}

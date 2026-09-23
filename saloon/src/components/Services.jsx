import React, { useState } from 'react';
import { Scissors, Sparkles, Clock, Check } from 'lucide-react';
import { servicesData } from '../data/salonData';

export default function Services() {
  const [activeTab, setActiveTab] = useState('hair');

  const handleBookService = (serviceName) => {
    // Custom event to prefill service in Booking form
    const event = new CustomEvent('select-service', { detail: serviceName });
    window.dispatchEvent(event);
    
    // Smooth scroll to booking
    const bookingSection = document.querySelector('#booking');
    if (bookingSection) {
      const offset = 80;
      const elementPosition = bookingSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="services" className="py-24 md:py-32 bg-luxury-cream dark:bg-luxury-black border-t border-luxury-gold/15 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <span className="text-xs tracking-widest-luxury uppercase text-luxury-gold font-medium block mb-3">
            Our Curated Menu
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-luxury-black dark:text-white mb-6">
            Bespoke Services
          </h2>
          <div className="w-12 h-[1px] bg-luxury-gold/50 mx-auto mb-6"></div>
          <p className="text-luxury-black/60 dark:text-luxury-cream/70 font-light text-base leading-relaxed">
            From editorial cut and coloring to advanced clinical skincare, explore our premium beauty treatments designed for extraordinary results.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center mb-16 reveal">
          <div className="inline-flex p-1 bg-luxury-gray dark:bg-luxury-darkBlue border border-luxury-gold/10 rounded-sm shadow-inner">
            <button
              onClick={() => setActiveTab('hair')}
              className={`flex items-center gap-2 px-6 py-3 text-xs tracking-widest-luxury uppercase font-semibold transition-all duration-300 rounded-sm ${
                activeTab === 'hair'
                  ? 'bg-luxury-blue dark:bg-luxury-gold text-white dark:text-luxury-black shadow-md'
                  : 'text-luxury-black/60 dark:text-luxury-cream/60 hover:text-luxury-black dark:hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Hair Artistry</span>
            </button>
            <button
              onClick={() => setActiveTab('laser')}
              className={`flex items-center gap-2 px-6 py-3 text-xs tracking-widest-luxury uppercase font-semibold transition-all duration-300 rounded-sm ${
                activeTab === 'laser'
                  ? 'bg-luxury-blue dark:bg-luxury-gold text-white dark:text-luxury-black shadow-md'
                  : 'text-luxury-black/60 dark:text-luxury-cream/60 hover:text-luxury-black dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Laser & Esthetics</span>
            </button>
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal">
          {servicesData[activeTab].map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-luxury-darkBlue p-8 rounded-sm shadow-md transition-all duration-500 flex flex-col justify-between gold-border-glow relative group"
            >
              {/* Gold Ribbon Overlay on hover */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-luxury-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-serif text-2xl font-normal text-luxury-black dark:text-white tracking-wide pr-4 group-hover:text-luxury-gold transition-colors duration-300">
                    {service.name}
                  </h3>
                  <div className="text-right flex-shrink-0">
                    <span className="font-serif text-2xl font-light text-luxury-gold block">
                      {service.price}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest-luxury text-luxury-black/40 dark:text-luxury-cream/40 flex items-center justify-end gap-1 mt-1 font-light">
                      <Clock className="w-2.5 h-2.5" />
                      {service.duration}
                    </span>
                  </div>
                </div>
                
                <p className="text-luxury-black/60 dark:text-luxury-cream/70 font-light text-sm leading-relaxed mb-8">
                  {service.description}
                </p>
              </div>

              <div className="border-t border-luxury-gray dark:border-white/10 pt-6 mt-auto">
                <button
                  onClick={() => handleBookService(service.name)}
                  className="w-full py-3 bg-luxury-gray dark:bg-luxury-black/40 text-luxury-black dark:text-white font-semibold text-xs tracking-widest-luxury uppercase hover:bg-luxury-gold hover:text-luxury-black dark:hover:text-luxury-black border border-transparent hover:border-luxury-gold transition-all duration-300 rounded-sm flex items-center justify-center gap-2 group-hover:shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 text-luxury-gold group-hover:text-luxury-black transition-colors" />
                  <span>Book Service</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Note on custom needs */}
        <div className="text-center mt-16 reveal">
          <p className="text-xs text-luxury-black/50 dark:text-luxury-cream/50 font-light tracking-wide">
            Looking for something specific? We offer customized packages and skin corrective plans.{' '}
            <a 
              href="#booking" 
              onClick={(e) => {
                e.preventDefault();
                handleBookService('Custom Package');
              }}
              className="text-luxury-gold hover:text-luxury-blue dark:hover:text-white underline transition-colors"
            >
              Schedule a consultation
            </a>
          </p>
        </div>

      </div>
    </section>
  );
}

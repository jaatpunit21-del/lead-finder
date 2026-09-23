import React from 'react';
import { Phone, Calendar } from 'lucide-react';
import { businessDetails } from '../data/salonData';

export default function MobileBottomDock() {
  const handleScrollToBooking = (e) => {
    e.preventDefault();
    const targetElement = document.querySelector('#booking');
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
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden p-4 bg-gradient-to-t from-luxury-black/95 to-luxury-black/80 backdrop-blur-md border-t border-luxury-gold/20 shadow-xl transition-all duration-300">
      <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
        {/* Call Now Button */}
        <a
          href={`tel:${businessDetails.phone}`}
          className="flex items-center justify-center gap-2.5 py-3 px-4 bg-transparent border border-white/20 hover:border-luxury-gold text-white text-xs font-semibold tracking-widest-luxury uppercase rounded-sm transition-all duration-300"
        >
          <Phone className="w-3.5 h-3.5 text-luxury-gold" />
          <span>Call Us</span>
        </a>

        {/* Book Now Button */}
        <a
          href="#booking"
          onClick={handleScrollToBooking}
          className="flex items-center justify-center gap-2.5 py-3 px-4 bg-luxury-gold text-luxury-black text-xs font-semibold tracking-widest-luxury uppercase border border-luxury-gold hover:bg-transparent hover:text-white transition-all duration-300 rounded-sm shadow-md"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Now</span>
        </a>
      </div>
    </div>
  );
}

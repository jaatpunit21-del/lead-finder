import React from 'react';
import { Sparkles, Phone, MapPin, Mail, Compass } from 'lucide-react';
import { businessDetails } from '../data/salonData';

export default function Footer() {
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
    <footer className="bg-luxury-black text-white pt-20 pb-24 lg:pb-8 border-t border-luxury-gold/20 relative overflow-hidden">
      {/* Decorative subtle background lights */}
      <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-start">
            <a 
              href="#home" 
              onClick={(e) => handleScrollTo(e, '#home')}
              className="flex flex-col text-left group mb-6"
            >
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-semibold tracking-wider text-white group-hover:text-luxury-gold transition-colors">
                  ORIGINAL
                </span>
                <Sparkles className="w-4.5 h-4.5 text-luxury-gold animate-pulse" />
              </div>
              <span className="text-[11px] tracking-widest-luxury text-luxury-gold uppercase font-light mt-0.5">
                HAIR FASHION & LASER
              </span>
            </a>
            
            <p className="text-white/60 font-light text-sm leading-relaxed mb-6 max-w-sm">
              Providing exceptional hair coloring, precision cuts, and state-of-the-art laser treatments to Mississauga since 1967. Experience luxury and care under one roof.
            </p>

            {/* Social Icons */}
            <div className="flex gap-4">
              <a 
                href="https://www.instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-luxury-gold hover:text-luxury-black border border-white/10 hover:border-luxury-gold flex items-center justify-center text-white/80 transition-all duration-300"
                aria-label="Instagram Link"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a 
                href="https://www.facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-luxury-gold hover:text-luxury-black border border-white/10 hover:border-luxury-gold flex items-center justify-center text-white/80 transition-all duration-300"
                aria-label="Facebook Link"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a 
                href={businessDetails.directionsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-luxury-gold hover:text-luxury-black border border-white/10 hover:border-luxury-gold flex items-center justify-center text-white/80 transition-all duration-300"
                aria-label="Google Maps Directions Link"
              >
                <Compass className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links (2 cols) */}
          <div className="lg:col-span-2 lg:pl-4">
            <h4 className="font-serif text-lg font-semibold tracking-wider text-white mb-6 uppercase border-b border-white/10 pb-2">
              Explore
            </h4>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '#home' },
                { name: 'About Us', href: '#about' },
                { name: 'Services', href: '#services' },
                { name: 'Special Offers', href: '#offers' },
                { name: 'AI Recommender', href: '#ai-recommender' },
                { name: 'Portfolio', href: '#gallery' },
                { name: 'FAQ', href: '#faq' },
              ].map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleScrollTo(e, link.href)}
                    className="text-xs text-white/60 hover:text-luxury-gold transition-colors font-medium tracking-wider uppercase"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="font-serif text-lg font-semibold tracking-wider text-white mb-6 uppercase border-b border-white/10 pb-2">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <MapPin className="w-4 h-4 text-luxury-gold mt-0.5 flex-shrink-0" />
                <span className="text-xs text-white/70 font-light leading-relaxed">
                  3063 Hurontario St,<br />
                  Mississauga, ON L5A 4E4,<br />
                  Canada
                </span>
              </li>
              <li className="flex gap-3 items-center">
                <Phone className="w-4 h-4 text-luxury-gold flex-shrink-0" />
                <a 
                  href={`tel:${businessDetails.phone}`}
                  className="text-xs text-white/70 hover:text-luxury-gold transition-colors font-light"
                >
                  {businessDetails.phone}
                </a>
              </li>
              <li className="flex gap-3 items-center">
                <Mail className="w-4 h-4 text-luxury-gold flex-shrink-0" />
                <a 
                  href="mailto:info@originalhairfashion.com"
                  className="text-xs text-white/70 hover:text-luxury-gold transition-colors font-light"
                >
                  info@originalhairfashion.com
                </a>
              </li>
            </ul>
          </div>

          {/* Business Hours Brief (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="font-serif text-lg font-semibold tracking-wider text-white mb-6 uppercase border-b border-white/10 pb-2">
              Salon Hours
            </h4>
            <ul className="space-y-2.5">
              {businessDetails.hours.slice(1, 6).map((item) => (
                <li key={item.day} className="flex justify-between text-xs text-white/70 font-light">
                  <span className="font-semibold">{item.day}</span>
                  <span>{item.time}</span>
                </li>
              ))}
              {/* Add Sun/Mon since slice skips them */}
              <li className="flex justify-between text-xs text-white/40 italic font-light">
                <span>Sunday</span>
                <span>{businessDetails.hours[6].time}</span>
              </li>
              <li className="flex justify-between text-xs text-white/40 italic font-light">
                <span>Monday</span>
                <span>Closed</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] tracking-widest-luxury text-white/40 uppercase font-light">
          <p className="mb-4 md:mb-0">
            © {new Date().getFullYear()} {businessDetails.name}. All Rights Reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-luxury-gold transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-luxury-gold transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
}

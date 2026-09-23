import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, Phone, Sun, Moon } from 'lucide-react';
import { businessDetails } from '../data/salonData';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Offers', href: '#offers' },
    { name: 'AI Recommender', href: '#ai-recommender' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Location', href: '#location' },
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setIsOpen(false);
    const targetElement = document.querySelector(href);
    if (targetElement) {
      const offset = 80; // height of sticky navbar
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const [showPromo, setShowPromo] = useState(true);

  return (
    <div className="fixed top-0 left-0 w-full z-50 flex flex-col">
      {showPromo && (
        <div className="bg-luxury-gold text-luxury-black text-center py-2 px-6 text-[10px] md:text-xs font-semibold uppercase tracking-widest-luxury flex justify-between items-center relative border-b border-luxury-gold/20 shadow-md">
          <span className="mx-auto flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-luxury-black animate-pulse" />
            <span>Grand Reopening Offer: Use code <strong className="font-bold">FIRST15</strong> for 15% off first visit!</span>
          </span>
          <button 
            onClick={() => setShowPromo(false)} 
            className="text-luxury-black hover:text-white transition-colors focus:outline-none"
            aria-label="Close promotion banner"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      )}
      
      <nav className={`w-full transition-all duration-500 ${
        scrolled 
          ? 'glassmorphism py-4 shadow-lg' 
          : 'bg-transparent py-6 border-b border-white/5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Brand Name */}
        <a 
          href="#home" 
          onClick={(e) => handleLinkClick(e, '#home')}
          className="flex flex-col text-left group"
        >
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl md:text-2xl font-semibold tracking-wider text-white group-hover:text-luxury-gold transition-colors duration-300">
              ORIGINAL
            </span>
            <Sparkles className="w-4 h-4 text-luxury-gold animate-pulse" />
          </div>
          <span className="text-[10px] md:text-xs tracking-widest-luxury text-luxury-gold uppercase font-light">
            HAIR FASHION & LASER
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-sm tracking-luxury uppercase font-medium text-white/80 hover:text-luxury-gold transition-colors duration-300 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-luxury-gold after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.name}
              </a>
            ))}
          </div>
          
          <div className="flex items-center gap-4 pl-4 border-l border-white/10">
            {/* Theme Toggle Desktop */}
            <button
              onClick={toggleTheme}
              className="p-2 text-white/80 hover:text-luxury-gold transition-colors focus:outline-none"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <a 
              href={`tel:${businessDetails.phone}`} 
              className="text-white hover:text-luxury-gold transition-colors flex items-center gap-2 text-sm"
              title="Call us"
            >
              <Phone className="w-4 h-4 text-luxury-gold" />
              <span className="hidden xl:inline">{businessDetails.phone}</span>
            </a>
            
            <a
              href="#booking"
              onClick={(e) => handleLinkClick(e, '#booking')}
              className="px-6 py-2.5 bg-luxury-gold text-luxury-black font-semibold text-xs tracking-widest-luxury uppercase border border-luxury-gold hover:bg-transparent hover:text-white transition-all duration-500 rounded-sm shadow-md"
            >
              Book Now
            </a>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-3 lg:hidden">
          {/* Theme Toggle Mobile */}
          <button
            onClick={toggleTheme}
            className="p-2 text-white/80 hover:text-luxury-gold transition-colors focus:outline-none"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          
          {/* Mobile Toggle Hamburger Button */}
          <button
            onClick={toggleMenu}
            className="text-white hover:text-luxury-gold transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <div className={`fixed inset-0 top-[72px] bg-luxury-black/95 z-40 lg:hidden transition-all duration-500 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex flex-col items-center justify-center h-full px-6 gap-8 pb-24">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="text-lg tracking-widest-luxury uppercase font-medium text-white hover:text-luxury-gold transition-colors duration-300"
            >
              {link.name}
            </a>
          ))}
          <div className="w-16 h-[1px] bg-luxury-gold/30 my-2"></div>
          <a
            href={`tel:${businessDetails.phone}`}
            className="flex items-center gap-3 text-luxury-gold font-medium"
          >
            <Phone className="w-5 h-5" />
            <span>{businessDetails.phone}</span>
          </a>
          <a
            href="#booking"
            onClick={(e) => handleLinkClick(e, '#booking')}
            className="w-full max-w-xs text-center py-4 bg-luxury-gold text-luxury-black font-semibold tracking-widest-luxury uppercase hover:bg-transparent hover:text-white border border-luxury-gold transition-all duration-300 rounded-sm"
          >
            Book Appointment
          </a>
        </div>
      </div>
    </nav>
    </div>
  );
}

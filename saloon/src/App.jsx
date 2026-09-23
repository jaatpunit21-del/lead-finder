import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import PromoOffers from './components/PromoOffers';
import AIRecommender from './components/AIRecommender';
import Gallery from './components/Gallery';
import InstagramGrid from './components/InstagramGrid';
import Reviews from './components/Reviews';
import Team from './components/Team';
import Booking from './components/Booking';
import FAQ from './components/FAQ';
import Location from './components/Location';
import Footer from './components/Footer';
import MobileBottomDock from './components/MobileBottomDock';
import WhatsAppButton from './components/WhatsAppButton';

export default function App() {
  
  // Custom IntersectionObserver for luxury fade-in scroll effects
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal');
    
    const observerOptions = {
      root: null, // viewport
      rootMargin: '0px 0px -80px 0px', // triggers slightly before entry
      threshold: 0.1 // triggers when 10% is visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // unobserve to run animation only once
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-luxury-cream text-luxury-black dark:bg-luxury-black dark:text-white font-sans selection:bg-luxury-gold/30 selection:text-luxury-black dark:selection:text-white antialiased transition-colors duration-500">
      {/* Sticky Navigation Header with Promo announcement bar */}
      <Navbar />

      <main>
        {/* Full-Screen Video Hero Intro */}
        <Hero />

        {/* Storytelling & History since 1967 */}
        <About />

        {/* Curated Service Menus (Hair & Laser tabs) */}
        <Services />

        {/* Special Offers & Discounts */}
        <PromoOffers />

        {/* Interactive AI Hairstyle Recommendation Tool */}
        <AIRecommender />

        {/* Masonry Portfolio Grid & Lightbox */}
        <Gallery />

        {/* Instagram Grid showcasing lifestyle and daily cuts */}
        <InstagramGrid />

        {/* Ratings and Client Testimonials */}
        <Reviews />

        {/* Circular portrait profiles of master team members */}
        <Team />

        {/* Interactive Booking Reservation Form */}
        <Booking />

        {/* Collapsible Accordion FAQs */}
        <FAQ />

        {/* Physical map direction and hours panel */}
        <Location />
      </main>

      {/* Corporate Info Footer */}
      <Footer />

      {/* Sticky Bottom Actions Bar for Mobile/Tablet */}
      <MobileBottomDock />

      {/* Floating WhatsApp chat widget */}
      <WhatsAppButton />
    </div>
  );
}

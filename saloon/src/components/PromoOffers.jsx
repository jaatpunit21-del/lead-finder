import React, { useState } from 'react';
import { Tag, Copy, Check, Sparkles } from 'lucide-react';
import { promoOffersData } from '../data/salonData';

export default function PromoOffers() {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleBookPromo = (promoTitle) => {
    // Dispatch custom event to prefill booking form
    const event = new CustomEvent('select-service', { detail: promoTitle });
    window.dispatchEvent(event);

    // Scroll to booking section
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
    <section id="offers" className="py-24 md:py-32 bg-white dark:bg-luxury-black border-t border-luxury-gold/15 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 reveal">
          <span className="text-xs tracking-widest-luxury uppercase text-luxury-gold font-medium block mb-3">
            Exclusive Packages
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-luxury-black dark:text-white mb-6">
            Special Offers & Discounts
          </h2>
          <div className="w-12 h-[1px] bg-luxury-gold/50 mx-auto mb-6"></div>
          <p className="text-luxury-black/60 dark:text-luxury-cream/70 font-light text-base leading-relaxed">
            Take advantage of our limited-time seasonal pricing packages and introductory offers for hair and medical aesthetics.
          </p>
        </div>

        {/* Promo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 reveal">
          {promoOffersData.map((promo) => (
            <div
              key={promo.id}
              className="bg-luxury-cream dark:bg-luxury-darkBlue p-8 rounded-sm shadow-md border border-luxury-gold/20 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all duration-500"
            >
              {/* Gold badge ribbon */}
              <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-12 -translate-y-12 rotate-45 bg-luxury-gold/15 group-hover:bg-luxury-gold/25 transition-colors duration-500 flex items-end justify-center pb-2">
                <Sparkles className="w-4.5 h-4.5 text-luxury-gold mb-1" />
              </div>

              <div>
                {/* Discount Tag */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-luxury-blue dark:bg-luxury-black/40 text-[10px] tracking-widest-luxury font-bold text-luxury-gold uppercase rounded-sm mb-6 shadow-sm border border-luxury-gold/30">
                  <Tag className="w-3 h-3" />
                  {promo.discount}
                </div>

                {/* Offer Title */}
                <h3 className="font-serif text-2xl md:text-3xl font-normal text-luxury-black dark:text-white mb-4 pr-10">
                  {promo.title}
                </h3>

                {/* Description */}
                <p className="text-luxury-black/70 dark:text-luxury-cream/70 font-light text-sm leading-relaxed mb-8">
                  {promo.description}
                </p>
              </div>

              <div>
                {/* Copy Promo Code Area */}
                <div className="bg-white dark:bg-luxury-black/50 p-4 rounded-sm border border-luxury-gold/10 dark:border-white/5 mb-6 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest-luxury text-luxury-black/40 dark:text-luxury-cream/40 block mb-0.5">
                      Promo Code
                    </span>
                    <span className="font-mono font-bold text-sm text-luxury-black dark:text-white uppercase tracking-wider">
                      {promo.code}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(promo.code, promo.id)}
                    className="p-2.5 rounded-sm bg-luxury-cream dark:bg-luxury-darkBlue hover:bg-luxury-gold hover:text-luxury-black text-luxury-gold dark:text-white transition-all duration-300 border border-luxury-gold/20"
                    title="Copy code"
                  >
                    {copiedId === promo.id ? (
                      <Check className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleBookPromo(`${promo.title} (Code: ${promo.code})`)}
                  className="w-full py-3.5 bg-luxury-blue dark:bg-luxury-black hover:bg-luxury-gold text-white hover:text-luxury-black font-semibold text-xs tracking-widest-luxury uppercase border border-luxury-blue dark:border-white/10 hover:border-luxury-gold transition-all duration-500 rounded-sm"
                >
                  {promo.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

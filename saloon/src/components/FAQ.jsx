import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { faqData } from '../data/salonData';

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 md:py-32 bg-luxury-cream dark:bg-luxury-black border-t border-luxury-gold/15 transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 reveal">
          <span className="text-xs tracking-widest-luxury uppercase text-luxury-gold font-medium block mb-3">
            Common Inquiries
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-normal text-luxury-black dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="w-12 h-[1px] bg-luxury-gold/50 mx-auto mb-6"></div>
          <p className="text-luxury-black/60 dark:text-luxury-cream/70 font-light text-base leading-relaxed">
            Have questions about hair highlights, laser hair removal, or booking terms? Find answers below or get in touch.
          </p>
        </div>

        {/* Accordion Stack */}
        <div className="space-y-4 reveal">
          {faqData.map((faq, index) => {
            const isOpen = activeIndex === index;
            return (
              <div
                key={faq.id}
                className="bg-white dark:bg-luxury-darkBlue rounded-sm shadow-sm border border-luxury-gold/15 dark:border-white/5 overflow-hidden transition-all duration-300"
              >
                {/* Header Button */}
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full p-6 text-left flex justify-between items-center gap-4 focus:outline-none group"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-luxury-gold flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="font-serif text-lg md:text-xl font-normal text-luxury-black dark:text-white group-hover:text-luxury-gold transition-colors duration-300">
                      {faq.question}
                    </span>
                  </div>
                  <div className="flex-shrink-0 text-luxury-black/40 dark:text-white/40 group-hover:text-luxury-gold transition-colors">
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Collapsible Content */}
                <div
                  className={`transition-all duration-500 ease-in-out ${
                    isOpen ? 'max-h-[300px] border-t border-luxury-gray dark:border-white/10 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                  } overflow-hidden`}
                >
                  <div className="p-6 bg-luxury-cream/10 dark:bg-luxury-black/20 text-sm md:text-base text-luxury-black/70 dark:text-luxury-cream/80 font-light leading-relaxed">
                    <p className="mb-2 text-[10px] tracking-widest-luxury uppercase text-luxury-gold font-semibold">
                      Category: {faq.category}
                    </p>
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Still have questions */}
        <div className="text-center mt-16 reveal">
          <p className="text-sm text-luxury-black/50 dark:text-luxury-cream/50 font-light">
            Still have questions? We are here to help.{' '}
            <a 
              href="#booking"
              className="text-luxury-gold hover:text-luxury-blue dark:hover:text-white font-medium underline transition-colors"
            >
              Get in Touch
            </a>
          </p>
        </div>

      </div>
    </section>
  );
}

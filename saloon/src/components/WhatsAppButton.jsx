import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  // Close tooltip after 5 seconds on load
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const whatsappNumber = '19052703948'; // Salon number (+1 905-270-3948)
  const defaultMessage = encodeURIComponent(
    'Hello, I would like to inquire about booking an appointment at Original Hair Fashion & Laser.'
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultMessage}`;

  return (
    <div 
      className="fixed z-40 transition-all duration-300 right-6 bottom-24 lg:bottom-8"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip Alert Bubble */}
      <div 
        className={`absolute right-0 bottom-16 bg-luxury-blue dark:bg-luxury-darkBlue text-white text-xs py-2 px-3.5 rounded-sm border border-luxury-gold/30 shadow-lg whitespace-nowrap transition-all duration-300 transform ${
          showTooltip ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90 pointer-events-none'
        }`}
      >
        <span className="text-[10px] uppercase tracking-widest-luxury text-luxury-gold font-bold block mb-0.5">
          Online Concierge
        </span>
        Chat on WhatsApp
        {/* Pointer arrow */}
        <div className="absolute right-6 -bottom-1.5 w-3 h-3 bg-luxury-blue dark:bg-luxury-darkBlue border-r border-b border-luxury-gold/30 rotate-45"></div>
      </div>

      {/* Floating Pulsating Circle */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl relative group border border-emerald-400/20"
        aria-label="Chat with us on WhatsApp"
      >
        {/* Pulse ripples */}
        <span className="absolute inset-0 rounded-full bg-emerald-600 animate-ping opacity-25 group-hover:hidden"></span>
        
        {/* WhatsApp Icon (using lucide message icon style) */}
        <svg 
          className="w-7 h-7 fill-current transition-transform duration-300 group-hover:scale-110" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.488 1.45 5.41 1.451 5.58 0 10.121-4.542 10.124-10.125.002-2.705-1.047-5.247-2.959-7.161-1.911-1.913-4.453-2.964-7.164-2.964-5.585 0-10.126 4.544-10.129 10.128-.001 1.93.504 3.816 1.465 5.429L1.812 20.19l4.836-1.036zm11.353-7.534c-.31-.155-1.836-.906-2.119-1.01-.282-.103-.488-.155-.693.155-.205.31-.795.992-.974 1.199-.18.206-.359.233-.67.078-1.258-.63-2.185-1.082-3.044-2.556-.225-.387.225-.359.645-1.201.07-.14.035-.262-.017-.366-.053-.103-.488-1.178-.669-1.614-.176-.423-.37-.365-.508-.372-.132-.007-.282-.008-.432-.008-.15 0-.395.056-.603.282-.207.227-.793.774-.793 1.887 0 1.113.809 2.188.922 2.343.113.155 1.593 2.433 3.86 3.413.54.233.961.372 1.288.476.541.172 1.034.148 1.423.09.433-.064 1.836-.75 2.095-1.472.258-.722.258-1.343.18-1.472-.078-.129-.283-.207-.593-.362z" />
        </svg>
      </a>
    </div>
  );
}

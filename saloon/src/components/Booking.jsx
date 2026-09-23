import React, { useState, useEffect } from 'react';
import { Calendar, Phone, Mail, User, BookOpen, MessageSquare, CheckCircle, Sparkles } from 'lucide-react';

export default function Booking() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    date: '',
    time: '',
    message: ''
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  // Prefill service listener
  useEffect(() => {
    const handlePrefill = (event) => {
      setFormData((prev) => ({
        ...prev,
        service: event.detail
      }));
    };

    window.addEventListener('select-service', handlePrefill);
    return () => window.removeEventListener('select-service', handlePrefill);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulate API request and generate random reference ID
    const randomRef = 'OHFL-' + Math.floor(1000 + Math.random() * 9000);
    setBookingRef(randomRef);
    setIsSubmitted(true);
  };

  const closeSuccessModal = () => {
    setIsSubmitted(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      service: '',
      date: '',
      time: '',
      message: ''
    });
  };

  const servicesDropdown = [
    'Master Precision Cut ($85+)',
    'Signature Blowout & Style ($55+)',
    'Luxe All-Over Color ($120+)',
    'Dimensional Highlights ($165+)',
    'Artisanal Balayage ($220+)',
    'Medical-Grade Laser Hair Removal ($89+)',
    'Clinical Skin Consultation (Complimentary)',
    'Advanced Laser Skin Rejuvenation ($145+)',
    'Hydra-Infusion Esthetic Treatment ($130+)',
    'Custom Package / General Inquiry'
  ];

  return (
    <section id="booking" className="py-24 md:py-32 bg-luxury-cream dark:bg-luxury-black border-b border-luxury-gold/15 transition-colors duration-500 relative">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <span className="text-xs tracking-widest-luxury uppercase text-luxury-gold font-medium block mb-3">
            Reserve Your Experience
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-normal text-luxury-black dark:text-white mb-6">
            Book Appointment
          </h2>
          <div className="w-12 h-[1px] bg-luxury-gold/50 mx-auto mb-6"></div>
          <p className="text-luxury-black/60 dark:text-luxury-cream/70 font-light text-base leading-relaxed">
            Submit your preferred date and selected beauty treatments. Our coordinator will contact you within 2 business hours to confirm your reservation details.
          </p>
        </div>

        {/* Luxury Booking Form Card */}
        <div className="bg-white dark:bg-luxury-darkBlue p-8 md:p-12 rounded-sm shadow-xl border border-luxury-gold/15 dark:border-white/5 reveal">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="relative">
                <label className="text-[10px] uppercase tracking-widest-luxury text-luxury-black/50 dark:text-luxury-cream/50 font-semibold block mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-luxury-gold/80 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-3.5 border border-luxury-gold/20 dark:border-white/10 focus:border-luxury-gold bg-luxury-cream/20 dark:bg-luxury-black/40 text-sm font-light focus:outline-none transition-colors rounded-sm dark:text-white"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="relative">
                <label className="text-[10px] uppercase tracking-widest-luxury text-luxury-black/50 dark:text-luxury-cream/50 font-semibold block mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-luxury-gold/80 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-3.5 border border-luxury-gold/20 dark:border-white/10 focus:border-luxury-gold bg-luxury-cream/20 dark:bg-luxury-black/40 text-sm font-light focus:outline-none transition-colors rounded-sm dark:text-white"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="relative">
                <label className="text-[10px] uppercase tracking-widest-luxury text-luxury-black/50 dark:text-luxury-cream/50 font-semibold block mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-luxury-gold/80 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3.5 border border-luxury-gold/20 dark:border-white/10 focus:border-luxury-gold bg-luxury-cream/20 dark:bg-luxury-black/40 text-sm font-light focus:outline-none transition-colors rounded-sm dark:text-white"
                  />
                </div>
              </div>

              {/* Service Selection */}
              <div className="relative">
                <label className="text-[10px] uppercase tracking-widest-luxury text-luxury-black/50 dark:text-luxury-cream/50 font-semibold block mb-2">
                  Select Treatment
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-luxury-gold/80 pointer-events-none">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-8 py-3.5 border border-luxury-gold/20 dark:border-white/10 focus:border-luxury-gold bg-white dark:bg-luxury-darkBlue text-sm font-light focus:outline-none transition-colors rounded-sm appearance-none cursor-pointer dark:text-white"
                  >
                    <option value="" disabled>Select a service...</option>
                    {servicesDropdown.map((serviceOption) => (
                      <option 
                        key={serviceOption} 
                        value={serviceOption.split(' (')[0]}
                      >
                        {serviceOption}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-luxury-black/40 dark:text-luxury-cream/40">
                    ▼
                  </span>
                </div>
              </div>

              {/* Preferred Date */}
              <div className="relative">
                <label className="text-[10px] uppercase tracking-widest-luxury text-luxury-black/50 dark:text-luxury-cream/50 font-semibold block mb-2">
                  Preferred Date
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-luxury-gold/80 pointer-events-none">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border border-luxury-gold/20 dark:border-white/10 focus:border-luxury-gold bg-luxury-cream/20 dark:bg-luxury-black/40 text-sm font-light focus:outline-none transition-colors rounded-sm cursor-pointer dark:text-white"
                  />
                </div>
              </div>

              {/* Preferred Time */}
              <div className="relative">
                <label className="text-[10px] uppercase tracking-widest-luxury text-luxury-black/50 dark:text-luxury-cream/50 font-semibold block mb-2">
                  Preferred Time Slot
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-luxury-gold/80 pointer-events-none">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <select
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-8 py-3.5 border border-luxury-gold/20 dark:border-white/10 focus:border-luxury-gold bg-white dark:bg-luxury-darkBlue text-sm font-light focus:outline-none transition-colors rounded-sm appearance-none cursor-pointer dark:text-white"
                  >
                    <option value="" disabled>Select a time slot...</option>
                    <option value="Morning (9:30 AM - 12:00 PM)">Morning (9:30 AM - 12:00 PM)</option>
                    <option value="Afternoon (12:00 PM - 4:00 PM)">Afternoon (12:00 PM - 4:00 PM)</option>
                    <option value="Evening (4:00 PM - 8:00 PM)">Evening (4:00 PM - 8:00 PM)</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-luxury-black/40 dark:text-luxury-cream/40">
                    ▼
                  </span>
                </div>
              </div>

            </div>

            {/* Special Instructions */}
            <div className="relative">
              <label className="text-[10px] uppercase tracking-widest-luxury text-luxury-black/50 dark:text-luxury-cream/50 font-semibold block mb-2">
                Special Requests or Stylist Preferences
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-3.5 text-luxury-gold/80 pointer-events-none">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Tell us about your hair or skin type, or if you prefer a specific stylist..."
                  className="w-full pl-10 pr-4 py-3.5 border border-luxury-gold/20 dark:border-white/10 focus:border-luxury-gold bg-luxury-cream/20 dark:bg-luxury-black/40 text-sm font-light focus:outline-none transition-colors rounded-sm resize-none dark:text-white"
                ></textarea>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-4">
              <button
                type="submit"
                className="w-full sm:w-auto px-12 py-4 bg-luxury-blue dark:bg-luxury-gold hover:bg-luxury-gold dark:hover:bg-transparent text-white dark:text-luxury-black dark:hover:text-white font-semibold text-xs tracking-widest-luxury uppercase border border-luxury-blue dark:border-luxury-gold hover:border-luxury-gold transition-all duration-500 rounded-sm shadow-md"
              >
                Send Booking Request
              </button>
            </div>
          </form>
        </div>

        {/* Interactive Booking Confirmation Modal */}
        {isSubmitted && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-luxury-black/80 p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-luxury-darkBlue max-w-md w-full p-8 rounded-sm shadow-2xl border border-luxury-gold/30 dark:border-white/10 text-center relative">
              <div className="w-16 h-16 bg-luxury-gold/10 text-luxury-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-luxury-gold" />
                <span className="text-xs uppercase tracking-widest-luxury text-luxury-gold font-semibold">
                  Reservation Pending
                </span>
                <Sparkles className="w-4 h-4 text-luxury-gold" />
              </div>

              <h3 className="font-serif text-3xl font-normal text-luxury-black dark:text-white mb-4">
                Thank You, {formData.name.split(' ')[0]}!
              </h3>
              
              <div className="bg-luxury-cream dark:bg-luxury-black p-4 rounded-sm mb-6 text-left border border-luxury-gold/15 dark:border-white/10">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-luxury-black/50 dark:text-luxury-cream/50">Tracking Code:</span>
                  <span className="font-mono font-semibold text-luxury-black dark:text-white">{bookingRef}</span>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-luxury-black/50 dark:text-luxury-cream/50">Selected Treatment:</span>
                  <span className="font-medium text-luxury-black dark:text-white">{formData.service}</span>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-luxury-black/50 dark:text-luxury-cream/50">Preferred Date:</span>
                  <span className="font-medium text-luxury-black dark:text-white">{formData.date}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-luxury-black/50 dark:text-luxury-cream/50">Preferred Time:</span>
                  <span className="font-medium text-luxury-black dark:text-white">{formData.time.split(' (')[0]}</span>
                </div>
              </div>

              <p className="text-xs text-luxury-black/60 dark:text-luxury-cream/70 font-light leading-relaxed mb-8">
                We have received your request. A coordinator will call you at <strong className="text-luxury-black dark:text-white font-semibold">{formData.phone}</strong> or email you to confirm the exact styling slot.
              </p>

              <button
                onClick={closeSuccessModal}
                className="w-full py-3 bg-luxury-blue dark:bg-luxury-gold text-white dark:text-luxury-black hover:bg-luxury-gold dark:hover:bg-transparent hover:text-white dark:hover:text-white border border-luxury-blue dark:border-luxury-gold hover:border-luxury-gold transition-all duration-300 rounded-sm"
              >
                Close Window
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

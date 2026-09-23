import React, { useState, useEffect } from 'react';
import { Sparkles, Upload, Loader, User, Check, RefreshCw, Scissors } from 'lucide-react';

export default function AIRecommender() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Scanning, 3: Preferences, 4: Results
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDemoModel, setSelectedDemoModel] = useState(null);
  const [progress, setProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('Initializing facial mapping...');
  const [preferences, setPreferences] = useState({
    length: 'medium',
    goal: 'volume'
  });
  
  const [recommendation, setRecommendation] = useState(null);

  // Demo models to make testing instant and fun
  const demoModels = [
    { id: 'demo-1', label: 'Oval Face Shape', image: '/images/team_stylist_1.png', shape: 'Oval' },
    { id: 'demo-2', label: 'Round Face Shape', image: '/images/team_stylist_2.png', shape: 'Round' },
    { id: 'demo-3', label: 'Square Face Shape', image: '/images/team_stylist_3.png', shape: 'Square' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSelectedImage(uploadEvent.target.result);
        setSelectedDemoModel(null);
        setStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectDemo = (model) => {
    setSelectedDemoModel(model);
    setSelectedImage(model.image);
    setStep(2);
  };

  // Simulated Scanning Animation Progress
  useEffect(() => {
    if (step === 2) {
      setProgress(0);
      const statuses = [
        'Detecting facial boundaries...',
        'Determining jawline angle and forehead symmetry...',
        'Analyzing hair volume potential and texture...',
        'Matching features against master stylist database...',
        'Compiling custom styling recommendations...'
      ];

      let currentStatusIndex = 0;
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setStep(3);
            }, 500);
            return 100;
          }
          const increment = Math.floor(Math.random() * 10) + 5;
          const nextProgress = Math.min(prev + increment, 100);
          
          // Rotate status text based on progress thresholds
          const index = Math.min(Math.floor(nextProgress / 20), statuses.length - 1);
          setScanStatus(statuses[index]);

          return nextProgress;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [step]);

  // Compute recommendation based on face shape and styling goals
  const handleGenerateRecommendation = () => {
    const faceShape = selectedDemoModel ? selectedDemoModel.shape : 'Oval';
    const { length, goal } = preferences;

    let styleName = 'Textured Lob with Soft Balayage';
    let styleDetails = 'A collarbone-skimming texturized lob that softens strong jawlines. Tailored with a custom golden balayage to add motion.';
    let matchingService = 'Artisanal Balayage';

    if (faceShape === 'Oval') {
      if (length === 'short') {
        styleName = 'Dimensional Bixie Cut';
        styleDetails = 'A blend of pixie and bob length with structured side fringe to accentuate cheekbones. High-shine color tone.';
        matchingService = 'Master Precision Cut';
      } else if (length === 'long') {
        styleName = 'Luxury Hollywood Waves';
        styleDetails = 'Cascading long layers styled into glamorous retro waves. Highlighted with honey-gold notes for ultimate depth.';
        matchingService = 'Dimensional Highlights';
      }
    } else if (faceShape === 'Round') {
      if (length === 'short') {
        styleName = 'Asymmetrical A-Line Bob';
        styleDetails = 'Longer front layers offset round features, creating clean lines. Complete with a high-gloss color rinse.';
        matchingService = 'Signature Blowout & Style';
      } else if (length === 'medium') {
        styleName = 'Shag Cut with Curtain Bangs';
        styleDetails = 'Lots of textured layering to build volume at the crown and frame the eyes, drawing focus vertically.';
        matchingService = 'Master Precision Cut';
      } else {
        styleName = 'Long Layered Cut with Caramel Balayage';
        styleDetails = 'Vertical framing layers beginning below the chin to lengthen facial structure, combined with hand-painted caramel tones.';
        matchingService = 'Artisanal Balayage';
      }
    } else if (faceShape === 'Square') {
      if (length === 'short') {
        styleName = 'Soft Bob with Wispy Fringe';
        styleDetails = 'A rounded chin-length cut with feathered texture to offset angles. Includes deep conditioning for fluid movement.';
        matchingService = 'Master Precision Cut';
      } else if (length === 'long') {
        styleName = 'Soft Waves with Face-Framing Layers';
        styleDetails = 'Light layered waves that brush against jawline angles, softening features. Paired with dimensional lowlights.';
        matchingService = 'Luxe All-Over Color';
      }
    }

    // Goal-based refinement
    if (goal === 'color') {
      styleName += ' & Bespoke Color Treatment';
    }

    setRecommendation({
      styleName,
      styleDetails,
      matchingService,
      faceShape
    });
    setStep(4);
  };

  const handleBookRecommendedStyle = () => {
    if (recommendation) {
      const serviceName = `${recommendation.matchingService} (${recommendation.styleName})`;
      
      // Prefill event
      const event = new CustomEvent('select-service', { detail: serviceName });
      window.dispatchEvent(event);

      // Scroll to booking form
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
    }
  };

  const resetTool = () => {
    setSelectedImage(null);
    setSelectedDemoModel(null);
    setRecommendation(null);
    setStep(1);
  };

  return (
    <section id="ai-recommender" className="py-24 md:py-32 bg-white dark:bg-luxury-black border-t border-luxury-gold/15 transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-luxury-gold/10 text-[10px] tracking-widest-luxury uppercase font-semibold text-luxury-gold rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-luxury-gold animate-pulse" />
            <span>AI-Driven Consultations</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-normal text-luxury-black dark:text-white mb-6">
            AI Hairstyle Recommendation
          </h2>
          <div className="w-12 h-[1px] bg-luxury-gold/50 mx-auto mb-6"></div>
          <p className="text-luxury-black/60 dark:text-luxury-cream/70 font-light text-base leading-relaxed">
            Upload your picture or select one of our demo face profiles to let our custom styling AI analyze your facial geometry and recommend the perfect hair cut and color menu.
          </p>
        </div>

        {/* Interactive Shell */}
        <div className="bg-luxury-cream dark:bg-luxury-darkBlue p-8 md:p-12 rounded-sm border border-luxury-gold/20 shadow-xl reveal relative overflow-hidden min-h-[400px]">
          
          {/* STEP 1: Upload or Demo selection */}
          {step === 1 && (
            <div className="text-center flex flex-col items-center justify-center py-6">
              {/* Drag/Drop Box */}
              <label className="w-full max-w-lg border-2 border-dashed border-luxury-gold/30 hover:border-luxury-gold/80 rounded-sm p-10 cursor-pointer flex flex-col items-center justify-center bg-white dark:bg-luxury-black/40 transition-colors duration-300 group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <Upload className="w-12 h-12 text-luxury-gold mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-serif text-xl text-luxury-black dark:text-white mb-2 font-normal">
                  Upload Your Photo
                </h3>
                <p className="text-xs text-luxury-black/40 dark:text-luxury-cream/40 font-light max-w-xs leading-relaxed">
                  Drag and drop your front-facing headshot, or click here to browse. Photos are processed locally for privacy.
                </p>
              </label>

              {/* Divider */}
              <div className="w-full max-w-lg flex items-center my-8 text-xs text-luxury-black/30 dark:text-luxury-cream/30 uppercase tracking-widest-luxury">
                <div className="flex-grow h-[1px] bg-luxury-gold/15"></div>
                <span className="px-4">Or Quick Test With Demos</span>
                <div className="flex-grow h-[1px] bg-luxury-gold/15"></div>
              </div>

              {/* Demo selectors */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                {demoModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleSelectDemo(model)}
                    className="flex flex-col items-center p-3.5 bg-white dark:bg-luxury-black/40 border border-luxury-gold/10 hover:border-luxury-gold rounded-sm transition-all shadow-sm group"
                  >
                    <img 
                      src={model.image} 
                      alt={model.label} 
                      className="w-12 h-12 object-cover rounded-full mb-2 border border-luxury-gold/20"
                    />
                    <span className="text-[9px] uppercase tracking-wider text-luxury-black/60 dark:text-luxury-cream/80 text-center font-medium">
                      {model.shape} Face
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Scanning screen */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-10">
              {/* Photo viewport with scan line */}
              <div className="relative w-48 h-48 rounded-sm overflow-hidden border border-luxury-gold shadow-md bg-luxury-black/20 mb-8 flex items-center justify-center">
                <img 
                  src={selectedImage} 
                  alt="Scanning viewport" 
                  className="w-full h-full object-cover grayscale-[30%]"
                />
                {/* Simulated Scanning Laser Line */}
                <div className="absolute left-0 w-full h-[3px] bg-luxury-gold shadow-lg shadow-luxury-gold animate-bounce" style={{ top: `${progress}%` }}></div>
              </div>

              {/* Loader percentage */}
              <div className="w-full max-w-xs text-center">
                <h3 className="font-serif text-2xl font-light text-luxury-gold mb-2">
                  {progress}% Analyzed
                </h3>
                
                {/* Outer bar */}
                <div className="w-full h-1 bg-luxury-gold/10 rounded-full overflow-hidden mb-4">
                  {/* Inner progress bar */}
                  <div className="h-full bg-luxury-gold transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>

                <p className="text-xs text-luxury-black/60 dark:text-luxury-cream/70 font-light flex items-center justify-center gap-2">
                  <Loader className="w-3.5 h-3.5 text-luxury-gold animate-spin" />
                  <span>{scanStatus}</span>
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Customize Preferences */}
          {step === 3 && (
            <div className="w-full max-w-lg mx-auto py-6">
              <h3 className="font-serif text-2xl font-normal text-luxury-black dark:text-white mb-8 text-center">
                Define Your Custom Style Goals
              </h3>

              <div className="space-y-6">
                {/* Preferred Length */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest-luxury text-luxury-black/50 dark:text-luxury-cream/50 font-bold block mb-3">
                    Preferred Hair Length
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['short', 'medium', 'long'].map((lengthOption) => (
                      <button
                        key={lengthOption}
                        onClick={() => setPreferences(prev => ({ ...prev, length: lengthOption }))}
                        className={`py-3 px-4 border text-xs uppercase tracking-widest-luxury font-semibold transition-all duration-300 rounded-sm ${
                          preferences.length === lengthOption
                            ? 'bg-luxury-blue border-luxury-blue text-white shadow-md'
                            : 'bg-white dark:bg-luxury-black/40 border-luxury-gold/20 text-luxury-black/60 dark:text-luxury-cream/60 hover:border-luxury-gold'
                        }`}
                      >
                        {lengthOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Goal */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest-luxury text-luxury-black/50 dark:text-luxury-cream/50 font-bold block mb-3">
                    Primary Styling Goal
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'volume', label: 'Volume & Thickness' },
                      { value: 'maintenance', label: 'Easy Daily Maintenance' },
                      { value: 'color', label: 'Dimensional Color' },
                      { value: 'glow', label: 'Smoothness & Shine' }
                    ].map((goalOption) => (
                      <button
                        key={goalOption.value}
                        onClick={() => setPreferences(prev => ({ ...prev, goal: goalOption.value }))}
                        className={`py-3.5 px-4 border text-[11px] uppercase tracking-wider font-semibold transition-all duration-300 rounded-sm text-center ${
                          preferences.goal === goalOption.value
                            ? 'bg-luxury-blue border-luxury-blue text-white shadow-md'
                            : 'bg-white dark:bg-luxury-black/40 border-luxury-gold/20 text-luxury-black/60 dark:text-luxury-cream/60 hover:border-luxury-gold'
                        }`}
                      >
                        {goalOption.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="text-center mt-10">
                <button
                  onClick={handleGenerateRecommendation}
                  className="w-full py-4 bg-luxury-blue dark:bg-luxury-gold hover:bg-luxury-gold dark:hover:bg-transparent text-white dark:text-luxury-black hover:text-luxury-black dark:hover:text-white font-semibold text-xs tracking-widest-luxury uppercase border border-luxury-blue dark:border-luxury-gold hover:border-luxury-gold transition-colors duration-300 rounded-sm shadow-md"
                >
                  Generate Recommendation
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Results Display */}
          {step === 4 && recommendation && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-4">
              
              {/* Photo Display (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-luxury-gold shadow-md p-0.5 bg-white dark:bg-luxury-black mb-4">
                  <img 
                    src={selectedImage} 
                    alt="Facial profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                
                <span className="text-[10px] tracking-widest-luxury uppercase text-luxury-gold font-bold">
                  Detected Geometry
                </span>
                <span className="font-serif text-2xl font-light text-luxury-black dark:text-white mt-1">
                  {recommendation.faceShape} Face Shape
                </span>
              </div>

              {/* Content Panel (7 cols) */}
              <div className="md:col-span-7 border-t md:border-t-0 md:border-l border-luxury-gold/20 pt-6 md:pt-0 md:pl-8 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-1 text-[10px] tracking-widest-luxury uppercase text-luxury-gold font-bold mb-2">
                    <Scissors className="w-3.5 h-3.5 text-luxury-gold" />
                    <span>Your Recommended Look</span>
                  </div>

                  <h3 className="font-serif text-3xl font-normal text-luxury-black dark:text-white mb-3 tracking-wide">
                    {recommendation.styleName}
                  </h3>

                  <p className="text-luxury-black/70 dark:text-luxury-cream/70 font-light text-sm leading-relaxed mb-6">
                    {recommendation.styleDetails}
                  </p>

                  <div className="bg-white dark:bg-luxury-black/30 p-4 rounded-sm border border-luxury-gold/10 dark:border-white/5 mb-8 flex justify-between items-center text-xs">
                    <span className="text-luxury-black/50 dark:text-luxury-cream/50 uppercase tracking-widest-luxury text-[9px] font-bold">
                      Recommended Service Menu
                    </span>
                    <span className="font-semibold text-luxury-black dark:text-white">
                      {recommendation.matchingService}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleBookRecommendedStyle}
                    className="py-3.5 bg-luxury-blue dark:bg-luxury-gold hover:bg-luxury-gold dark:hover:bg-transparent text-white dark:text-luxury-black hover:text-luxury-black dark:hover:text-white font-semibold text-[10px] tracking-widest-luxury uppercase border border-luxury-blue dark:border-luxury-gold hover:border-luxury-gold transition-colors duration-300 rounded-sm shadow-md"
                  >
                    Book This Style
                  </button>
                  <button
                    onClick={resetTool}
                    className="py-3.5 bg-transparent border border-luxury-blue/30 dark:border-white/10 text-luxury-blue dark:text-white hover:border-luxury-gold hover:text-luxury-gold transition-colors font-semibold text-[10px] tracking-widest-luxury uppercase rounded-sm"
                  >
                    Reset & Try Again
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}

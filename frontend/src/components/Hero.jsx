import React, { useState, useEffect } from 'react';

export default function Hero({ onExploreClick, settings }) {
  const [bgImg, setBgImg] = useState(settings?.hero?.bg_image_url || '/images/hero-bg.png');

  useEffect(() => {
    const targetUrl = settings?.hero?.bg_image_url || '/images/hero-bg.png';
    const img = new Image();
    img.src = targetUrl;
    img.onload = () => setBgImg(targetUrl);
    img.onerror = () => {
      // Fallback if local load fails
      setBgImg('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=80');
    };
  }, [settings?.hero?.bg_image_url]);

  return (
    <section 
      className="relative min-h-[90vh] flex items-center justify-start overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: `url('${bgImg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Light gradient overlay that matches the theme background (#f9f9ff) for perfect readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#f9f9ff] via-[#f9f9ff]/90 to-[#f9f9ff]/10 z-0"></div>

      <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24">
        <div className="max-w-2xl reveal active">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-full mb-6">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-ui-caption font-ui-label-bold">Authorized Premium Retailer</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-primary mb-5 leading-tight">
            {settings?.hero?.title || 'Smart Tech.'} <span className="text-secondary font-semibold">{settings?.hero?.highlight || 'Modern Living.'}</span>
          </h1>
          <p className="text-base md:text-lg text-text-secondary mb-8 max-w-lg leading-relaxed">
            {settings?.hero?.subtitle || 'Curated smartphones and premium smart appliances designed to elevate your home.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="px-8 py-4 bg-gradient-to-r from-secondary to-secondary-container text-white font-ui-label-bold rounded-xl shadow-lg hover:shadow-secondary/20 transition-all text-center cursor-pointer" 
              onClick={onExploreClick}
            >
              {settings?.hero?.cta1_text || 'Explore Products'}
            </button>
            <a 
              className="px-8 py-4 border border-outline text-on-surface font-ui-label-bold rounded-xl hover:bg-surface-container-low transition-all text-center" 
              href={settings?.hero?.cta2_link || '#contact'}
            >
              {settings?.hero?.cta2_text || 'Contact Us'}
            </a>
          </div>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-status-success">check_circle</span>
              <span className="text-ui-caption font-ui-label-bold">100% Genuine</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-status-success">shield</span>
              <span className="text-ui-caption font-ui-label-bold">Full Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-status-success">local_shipping</span>
              <span className="text-ui-caption font-ui-label-bold">Fast Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

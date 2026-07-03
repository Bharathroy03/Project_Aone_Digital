import React, { useState, useEffect } from 'react';

export default function Hero({ onExploreClick }) {
  const [bgImg, setBgImg] = useState('/images/hero-bg.png');

  useEffect(() => {
    const img = new Image();
    img.src = '/images/hero-bg.png';
    img.onerror = () => {
      // Fallback to high-quality electronics showroom if local image fails
      setBgImg('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=80');
    };
  }, []);

  return (
    <section 
      className="relative min-h-[90vh] flex items-center justify-start overflow-hidden bg-cover bg-no-repeat bg-center lg:bg-right"
      style={{ backgroundImage: `url('${bgImg}')` }}
    >
      {/* Dynamic responsive overlay: near-opaque on mobile, fading gradient on larger screens */}
      <div className="absolute inset-0 bg-[#f9f9ff]/95 lg:bg-gradient-to-r lg:from-[#f9f9ff] lg:via-[#f9f9ff]/90 lg:to-transparent z-0"></div>

      <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24">
        <div className="max-w-2xl reveal active">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-full mb-6">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-ui-caption font-ui-label-bold">Authorized Premium Retailer</span>
          </div>
          <h1 className="font-display-lg-mobile md:text-display-lg text-primary mb-6">
            Discover the Latest Smartphones &amp; Home Appliances at <span className="text-secondary">Unbeatable Prices</span>
          </h1>
          <p className="text-body-lg text-text-secondary mb-10 max-w-xl">
            Explore premium smartphones, smart TVs, laptops, and more with easy financing and nationwide delivery at Aone Digital.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="px-8 py-4 bg-gradient-to-r from-secondary to-secondary-container text-white font-ui-label-bold rounded-xl shadow-lg hover:shadow-secondary/20 transition-all text-center cursor-pointer" 
              onClick={onExploreClick}
            >
              Explore Products
            </button>
            <a 
              className="px-8 py-4 border border-outline text-on-surface font-ui-label-bold rounded-xl hover:bg-surface-container-low transition-all text-center" 
              href="#contact"
            >
              Contact Us
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

import React from 'react';

export default function Hero({ onExploreClick }) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center py-16">
        <div className="z-10 reveal active">
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
        
        <div className="relative flex justify-center items-center reveal active" style={{ transitionDelay: '200ms' }}>
          <div className="absolute inset-0 bg-secondary/5 rounded-full blur-3xl transform scale-150"></div>
          <img 
            alt="Premium Electronics Showcase" 
            className="relative z-10 w-full max-w-lg object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
            src="/images/hero-bg.png"
            onError={(e) => {
              // Fallback if the user's hero-bg.png was not loaded or is a different file
              e.target.src = "https://lh3.googleusercontent.com/aida/AP1WRLsElqfFIIznj-aOe4E8QXrX5bWMrp6c1NuD9KZilU6CxbxNvTJ5ZhXRXlMWLDUSSwtn6oZTol5sbCgiITXUai9rAXewzGtRcgYlD6bl2cj42WhOfYr9DdxA0iIo-VGW7szXI9h_6uB4PkzcBjZnjJVcWVq2x-SlM6InWAV-U4jsbL5Fp4muVi3RLiY1ayhooSUY-o_FGH00HEd7E-YIXWPAIFdLv9HOelyoR7fbTLaj7aq6J3U6bNdxy50";
            }}
          />
        </div>
      </div>
    </section>
  );
}

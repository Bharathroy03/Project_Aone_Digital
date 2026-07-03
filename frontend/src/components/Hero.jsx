import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero({ onExploreClick }) {
  return (
    <section className="hero-section">
      <div className="hero-overlay"></div>
      
      <div className="hero-content">
        <span className="hero-tagline">
          <Sparkles size={14} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#f59e0b' }} />
          Smart Tech, Smart Home
        </span>
        <h1 className="hero-title">
          Elevate Your Living With Smart Appliances & Mobiles
        </h1>
        <p className="hero-description">
          Discover high-performance smartphones and energy-efficient home appliances tailored to your modern lifestyle. Built for efficiency, styled for elegance.
        </p>
        <div className="hero-buttons">
          <button className="btn btn-primary" onClick={onExploreClick}>
            Explore Catalog <ArrowRight size={16} />
          </button>
          <button className="btn btn-secondary">
            Learn More
          </button>
        </div>
      </div>

      <div className="hero-image-container">
        <div className="hero-image-wrapper">
          <img 
            src="/images/hero-bg.png" 
            alt="Premium Appliances & Mobiles" 
            className="hero-image"
            onError={(e) => {
              if (e.target.src.includes('.png')) {
                e.target.src = "/images/hero-bg.jpg";
              } else {
                e.target.src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80";
              }
            }}
          />
        </div>
      </div>
    </section>
  );
}

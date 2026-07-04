import React, { useState, useEffect, useCallback } from 'react';

// ─── Hero Slider ──────────────────────────────────────────────────────────────
function HeroSlider({ banners }) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const go = useCallback((idx) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  const prev = () => go((current - 1 + banners.length) % banners.length);
  const next = useCallback(() => go((current + 1) % banners.length), [current, banners.length, go]);

  // Auto-play every 5s
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (!banners.length) return null;
  const slide = banners[current];

  return (
    <div className="banner-hero-slider">
      {/* Slides */}
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`banner-hero-slide ${i === current ? 'active' : ''}`}
        >
          <img src={b.image_url} alt={b.title} className="banner-hero-img" />
          {/* Dark overlay for text contrast */}
          <div className="banner-hero-overlay" />
          {/* Text content */}
          <div className="banner-hero-content">
            <span className="banner-hero-badge">Featured Promotion</span>
            <h2 className="banner-hero-title">{b.title}</h2>
            {b.subtitle && <p className="banner-hero-subtitle">{b.subtitle}</p>}
            {b.link_url && (
              <a href={b.link_url} className="banner-hero-cta">
                {b.link_label || 'Shop Now'}
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </a>
            )}
          </div>
        </div>
      ))}

      {/* Arrow controls */}
      {banners.length > 1 && (
        <>
          <button className="banner-arrow left" onClick={prev} aria-label="Previous banner">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="banner-arrow right" onClick={next} aria-label="Next banner">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          {/* Dot indicators */}
          <div className="banner-dots">
            {banners.map((_, i) => (
              <button
                key={i}
                className={`banner-dot ${i === current ? 'active' : ''}`}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Wide Promo Strip ─────────────────────────────────────────────────────────
function WidePromoStrip({ banners }) {
  if (!banners.length) return null;
  return (
    <div className="banner-wide-row">
      {banners.map((b) => (
        <a
          key={b.id}
          href={b.link_url || '#'}
          className="banner-wide-card"
        >
          <img src={b.image_url} alt={b.title} className="banner-wide-img" />
          <div className="banner-wide-overlay">
            <div className="banner-wide-text">
              <h3 className="banner-wide-title">{b.title}</h3>
              {b.subtitle && <p className="banner-wide-sub">{b.subtitle}</p>}
              <span className="banner-wide-cta">
                {b.link_label || 'Explore'}
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ─── Square Grid ─────────────────────────────────────────────────────────────
function SquareGrid({ banners }) {
  if (!banners.length) return null;
  return (
    <div className="banner-square-grid">
      {banners.map((b) => (
        <a
          key={b.id}
          href={b.link_url || '#'}
          className="banner-square-card"
        >
          <img src={b.image_url} alt={b.title} className="banner-square-img" />
          <div className="banner-square-overlay">
            <h4 className="banner-square-title">{b.title}</h4>
            {b.subtitle && <p className="banner-square-sub">{b.subtitle}</p>}
            <span className="banner-square-cta">
              {b.link_label || 'View'}
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}

// ─── Main BannerSection ───────────────────────────────────────────────────────
export default function BannerSection({ banners = [], loading = false }) {
  const heroBanners   = banners.filter(b => b.type === 'hero');
  const wideBanners   = banners.filter(b => b.type === 'wide');
  const squareBanners = banners.filter(b => b.type === 'square');

  const hasBanners = heroBanners.length || wideBanners.length || squareBanners.length;

  return (
    <section className="banner-section" id="banners">
      {/* Section header */}
      <div className="banner-section-header">
        <div className="banner-section-title-row">
          <div>
            <h2 className="banner-section-title">Promotions &amp; Advertisements</h2>
            <p className="banner-section-sub">Exclusive deals and offers curated for you</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="banner-skeleton-wrap">
          <div className="banner-skeleton hero" />
          <div className="banner-skeleton-row">
            <div className="banner-skeleton square" />
            <div className="banner-skeleton square" />
            <div className="banner-skeleton square" />
          </div>
        </div>
      ) : !hasBanners ? (
        <div className="banner-empty">
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8' }}>image_not_supported</span>
          <p>No active promotions right now. Check back soon!</p>
        </div>
      ) : (
        <div className="banner-content-stack">
          {/* 1. Hero Slider */}
          {heroBanners.length > 0 && <HeroSlider banners={heroBanners} />}

          {/* 2. Wide Promo Strip */}
          {wideBanners.length > 0 && <WidePromoStrip banners={wideBanners} />}

          {/* 3. Square Tile Grid */}
          {squareBanners.length > 0 && <SquareGrid banners={squareBanners} />}
        </div>
      )}
    </section>
  );
}
